"""
Listening Agent - Ingests uploaded images & form data

This agent handles the initial data ingestion phase of the car flipping workflow.
It processes uploaded images, form data, and prepares them for analysis by other agents.
"""

import asyncio
import json
import logging
from datetime import datetime
from typing import Any, Dict, List, Optional
from pathlib import Path
import aiofiles
from fastapi import UploadFile
from pydantic import BaseModel, Field

from .base_agent import BaseAgent, AgentOutput


class UploadedFile(BaseModel):
    """Represents an uploaded file with metadata"""
    filename: str
    content_type: str
    size: int
    file_path: str
    uploaded_at: datetime


class FormData(BaseModel):
    """Represents form data submitted with files"""
    title: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    make: Optional[str] = None
    model: Optional[str] = None
    year: Optional[int] = None
    mileage: Optional[int] = None
    location: Optional[str] = None
    contact_info: Optional[str] = None
    additional_notes: Optional[str] = None


class ListeningAgentInput(BaseModel):
    """Input data for the Listening Agent"""
    files: List[UploadedFile] = Field(..., description="List of uploaded files")
    form_data: Optional[FormData] = Field(None, description="Form data submitted with files")
    user_id: Optional[str] = Field(None, description="User ID who uploaded the data")
    session_id: Optional[str] = Field(None, description="Session ID for tracking")


class ListeningAgentOutput(BaseModel):
    """Output data from the Listening Agent"""
    processed_files: List[Dict[str, Any]] = Field(..., description="Processed file information")
    extracted_data: Dict[str, Any] = Field(..., description="Extracted data from files and forms")
    validation_results: Dict[str, Any] = Field(..., description="Validation results")
    next_agents: List[str] = Field(..., description="List of agents to call next")


class ListeningAgent(BaseAgent):
    """
    Listening Agent - Handles initial data ingestion and validation
    
    This agent is the entry point for the car flipping workflow. It:
    1. Validates uploaded files and form data
    2. Extracts basic information from images and forms
    3. Prepares data for downstream agents
    4. Determines which agents should be called next
    """
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """Initialize the Listening Agent"""
        super().__init__("listening_agent", config)
        
        # Configuration defaults
        self.max_file_size = config.get("max_file_size", 10 * 1024 * 1024)  # 10MB
        self.allowed_extensions = config.get("allowed_extensions", [".jpg", ".jpeg", ".png", ".pdf"])
        self.upload_directory = config.get("upload_directory", "./uploads")
        self.image_analysis_enabled = config.get("image_analysis_enabled", True)
        
        # Ensure upload directory exists
        Path(self.upload_directory).mkdir(parents=True, exist_ok=True)
        
    def get_capabilities(self) -> List[str]:
        """Return list of capabilities this agent provides"""
        return [
            "File upload validation",
            "Image metadata extraction", 
            "Form data processing",
            "Data validation and sanitization",
            "Workflow orchestration planning"
        ]
    
    def validate_input(self, input_data: Dict[str, Any]) -> bool:
        """Validate input data before processing"""
        try:
            # Validate required fields
            if "files" not in input_data:
                self.logger.error("Missing 'files' in input data")
                return False
                
            if not input_data["files"]:
                self.logger.error("No files provided")
                return False
                
            # Validate file structure
            for file_info in input_data["files"]:
                if not isinstance(file_info, dict):
                    self.logger.error("Invalid file info structure")
                    return False
                    
                required_fields = ["filename", "content_type", "size", "file_path"]
                for field in required_fields:
                    if field not in file_info:
                        self.logger.error(f"Missing required field '{field}' in file info")
                        return False
                        
            return True
            
        except Exception as e:
            self.logger.error(f"Input validation failed: {str(e)}")
            return False
    
    async def process(self, input_data: Dict[str, Any]) -> AgentOutput:
        """Process uploaded files and form data"""
        start_time = datetime.now()
        
        try:
            # Parse input
            listening_input = ListeningAgentInput(**input_data)
            
            # Process files
            processed_files = await self._process_files(listening_input.files)
            
            # Extract data from files and forms
            extracted_data = await self._extract_data(listening_input.files, listening_input.form_data)
            
            # Validate extracted data
            validation_results = await self._validate_data(extracted_data)
            
            # Determine next agents
            next_agents = self._determine_next_agents(processed_files, extracted_data, validation_results)
            
            # Prepare output
            output_data = ListeningAgentOutput(
                processed_files=processed_files,
                extracted_data=extracted_data,
                validation_results=validation_results,
                next_agents=next_agents
            )
            
            processing_time = (datetime.now() - start_time).total_seconds()
            
            return AgentOutput(
                agent_name=self.name,
                timestamp=start_time,
                success=True,
                data=output_data.dict(),
                confidence=0.9,  # High confidence for data ingestion
                processing_time=processing_time
            )
            
        except Exception as e:
            processing_time = (datetime.now() - start_time).total_seconds()
            self.logger.error(f"Processing failed: {str(e)}", exc_info=True)
            
            return AgentOutput(
                agent_name=self.name,
                timestamp=start_time,
                success=False,
                data={},
                confidence=0.0,
                processing_time=processing_time,
                error_message=str(e)
            )
    
    async def _process_files(self, files: List[UploadedFile]) -> List[Dict[str, Any]]:
        """Process uploaded files and extract metadata"""
        processed_files = []
        
        for file_info in files:
            try:
                file_path = Path(file_info.file_path)
                
                # Basic file validation
                if not file_path.exists():
                    self.logger.warning(f"File not found: {file_path}")
                    continue
                    
                # Check file size
                if file_path.stat().st_size > self.max_file_size:
                    self.logger.warning(f"File too large: {file_path}")
                    continue
                    
                # Check file extension
                if file_path.suffix.lower() not in self.allowed_extensions:
                    self.logger.warning(f"Unsupported file type: {file_path.suffix}")
                    continue
                
                # Extract file metadata
                file_metadata = {
                    "filename": file_info.filename,
                    "content_type": file_info.content_type,
                    "size": file_info.size,
                    "file_path": str(file_path),
                    "extension": file_path.suffix.lower(),
                    "uploaded_at": file_info.uploaded_at.isoformat(),
                    "is_image": file_info.content_type.startswith("image/"),
                    "is_pdf": file_info.content_type == "application/pdf"
                }
                
                # Add image-specific metadata if applicable
                if file_metadata["is_image"]:
                    image_metadata = await self._extract_image_metadata(file_path)
                    file_metadata.update(image_metadata)
                
                processed_files.append(file_metadata)
                
            except Exception as e:
                self.logger.error(f"Error processing file {file_info.filename}: {str(e)}")
                continue
        
        return processed_files
    
    async def _extract_image_metadata(self, file_path: Path) -> Dict[str, Any]:
        """Extract metadata from image files"""
        try:
            # Basic image metadata extraction
            # In a real implementation, you might use PIL or other image libraries
            metadata = {
                "image_type": "unknown",
                "dimensions": None,
                "color_space": None,
                "has_exif": False
            }
            
            # For now, return basic info
            # TODO: Implement actual image metadata extraction
            if file_path.suffix.lower() in [".jpg", ".jpeg"]:
                metadata["image_type"] = "jpeg"
            elif file_path.suffix.lower() == ".png":
                metadata["image_type"] = "png"
            
            return metadata
            
        except Exception as e:
            self.logger.error(f"Error extracting image metadata: {str(e)}")
            return {}
    
    async def _extract_data(self, files: List[UploadedFile], form_data: Optional[FormData]) -> Dict[str, Any]:
        """Extract structured data from files and forms"""
        extracted_data = {
            "files_count": len(files),
            "images_count": len([f for f in files if f.content_type.startswith("image/")]),
            "pdfs_count": len([f for f in files if f.content_type == "application/pdf"]),
            "total_size": sum(f.size for f in files),
            "form_data": form_data.dict() if form_data else {},
            "extracted_text": {},
            "detected_objects": []
        }
        
        # Extract text from PDFs (if any)
        pdf_files = [f for f in files if f.content_type == "application/pdf"]
        for pdf_file in pdf_files:
            try:
                # TODO: Implement PDF text extraction
                extracted_data["extracted_text"][pdf_file.filename] = "PDF text extraction not implemented yet"
            except Exception as e:
                self.logger.error(f"Error extracting text from PDF {pdf_file.filename}: {str(e)}")
        
        # Basic object detection from images (placeholder)
        image_files = [f for f in files if f.content_type.startswith("image/")]
        if image_files and self.image_analysis_enabled:
            # TODO: Implement basic object detection
            extracted_data["detected_objects"] = ["car", "vehicle"]  # Placeholder
        
        return extracted_data
    
    async def _validate_data(self, extracted_data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate extracted data and provide feedback"""
        validation_results = {
            "is_valid": True,
            "warnings": [],
            "errors": [],
            "suggestions": []
        }
        
        # Check if we have any images
        if extracted_data["images_count"] == 0:
            validation_results["warnings"].append("No images provided - this may affect analysis quality")
        
        # Check if we have form data
        form_data = extracted_data.get("form_data", {})
        if not form_data:
            validation_results["warnings"].append("No form data provided")
        else:
            # Validate form data fields
            if not form_data.get("make") or not form_data.get("model"):
                validation_results["suggestions"].append("Car make and model would improve analysis accuracy")
            
            if not form_data.get("price"):
                validation_results["suggestions"].append("Price information would help with market analysis")
        
        # Check file sizes
        total_size = extracted_data.get("total_size", 0)
        if total_size > 50 * 1024 * 1024:  # 50MB
            validation_results["warnings"].append("Large file upload detected - processing may take longer")
        
        return validation_results
    
    def _determine_next_agents(self, processed_files: List[Dict[str, Any]], 
                              extracted_data: Dict[str, Any], 
                              validation_results: Dict[str, Any]) -> List[str]:
        """Determine which agents should be called next based on available data"""
        next_agents = []
        
        # Always call Vision Agent if we have images
        if extracted_data.get("images_count", 0) > 0:
            next_agents.append("vision_agent")
        
        # Call Data Extraction Agent if we have PDFs or form data
        if (extracted_data.get("pdfs_count", 0) > 0 or 
            extracted_data.get("form_data")):
            next_agents.append("data_extraction_agent")
        
        # Call Market Analysis Agent if we have basic car info
        form_data = extracted_data.get("form_data", {})
        if form_data.get("make") and form_data.get("model"):
            next_agents.append("market_analysis_agent")
        
        # Always call Orchestrator Agent to coordinate
        if next_agents:
            next_agents.append("orchestrator_agent")
        
        return next_agents 