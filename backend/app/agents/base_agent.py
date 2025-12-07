"""
Base Agent Class for Multi-Agent AI System

Provides common functionality and interface for all specialized agents
in the car flipping platform.
"""

from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional
from datetime import datetime
import logging
from pydantic import BaseModel

logger = logging.getLogger(__name__)


class AgentOutput(BaseModel):
    """Standard output format for all agents"""
    agent_name: str
    timestamp: datetime
    success: bool
    data: Dict[str, Any]
    confidence: float  # 0.0 to 1.0
    processing_time: float  # seconds
    error_message: Optional[str] = None


class BaseAgent(ABC):
    """
    Abstract base class for all AI agents in the car flipping platform.
    
    Each agent specializes in a specific aspect of the car flipping process
    and follows a consistent interface for input/output and error handling.
    """
    
    def __init__(self, name: str, config: Optional[Dict[str, Any]] = None):
        """
        Initialize the agent with name and configuration.
        
        Args:
            name: Unique identifier for this agent
            config: Agent-specific configuration parameters
        """
        self.name = name
        self.config = config or {}
        self.logger = logging.getLogger(f"agent.{name}")
        
    @abstractmethod
    async def process(self, input_data: Dict[str, Any]) -> AgentOutput:
        """
        Process input data and return structured output.
        
        Args:
            input_data: Input data specific to this agent's function
            
        Returns:
            AgentOutput: Structured output with results and metadata
        """
        pass
    
    @abstractmethod
    def get_capabilities(self) -> List[str]:
        """
        Return list of capabilities this agent provides.
        
        Returns:
            List of capability descriptions
        """
        pass
    
    def validate_input(self, input_data: Dict[str, Any]) -> bool:
        """
        Validate input data before processing.
        
        Args:
            input_data: Input data to validate
            
        Returns:
            True if valid, False otherwise
        """
        # Base implementation - override in subclasses
        return True
    
    def preprocess(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Preprocess input data before main processing.
        
        Args:
            input_data: Raw input data
            
        Returns:
            Preprocessed data ready for main processing
        """
        # Base implementation - override in subclasses
        return input_data
    
    def postprocess(self, output_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Postprocess output data after main processing.
        
        Args:
            output_data: Raw output data
            
        Returns:
            Postprocessed data ready for return
        """
        # Base implementation - override in subclasses
        return output_data
    
    async def execute(self, input_data: Dict[str, Any]) -> AgentOutput:
        """
        Main execution method that handles the full processing pipeline.
        
        Args:
            input_data: Input data for processing
            
        Returns:
            AgentOutput: Complete output with metadata
        """
        start_time = datetime.now()
        
        try:
            # Validate input
            if not self.validate_input(input_data):
                return AgentOutput(
                    agent_name=self.name,
                    timestamp=start_time,
                    success=False,
                    data={},
                    confidence=0.0,
                    processing_time=0.0,
                    error_message="Input validation failed"
                )
            
            # Preprocess
            processed_input = self.preprocess(input_data)
            
            # Main processing
            result_data = await self.process(processed_input)
            
            # Postprocess
            final_data = self.postprocess(result_data.data)
            
            processing_time = (datetime.now() - start_time).total_seconds()
            
            return AgentOutput(
                agent_name=self.name,
                timestamp=start_time,
                success=result_data.success,
                data=final_data,
                confidence=result_data.confidence,
                processing_time=processing_time
            )
            
        except Exception as e:
            processing_time = (datetime.now() - start_time).total_seconds()
            self.logger.error(f"Agent {self.name} failed: {str(e)}", exc_info=True)
            
            return AgentOutput(
                agent_name=self.name,
                timestamp=start_time,
                success=False,
                data={},
                confidence=0.0,
                processing_time=processing_time,
                error_message=str(e)
            )
    
    def get_status(self) -> Dict[str, Any]:
        """
        Get current status and health information for this agent.
        
        Returns:
            Status information dictionary
        """
        return {
            "name": self.name,
            "status": "active",
            "capabilities": self.get_capabilities(),
            "config": self.config
        } 