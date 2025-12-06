"""
Google Vision API Integration for Aquaria
Uses Application Default Credentials (ADC) - no JSON key files needed

This service provides car image analysis capabilities for the Accorria backend.
"""

import logging
from typing import List, Dict, Any, Optional, Tuple
from pathlib import Path
import asyncio

try:
    from google.cloud import vision
    from google.api_core import exceptions as google_exceptions
except ImportError:
    raise ImportError("google-cloud-vision not installed. Run: pip install google-cloud-vision")

logger = logging.getLogger(__name__)


class VisionAnalyzer:
    """
    Google Vision API analyzer for car images using Application Default Credentials.
    
    This class provides comprehensive image analysis specifically tailored for
    car flipping use cases, including make/model detection, damage assessment,
    and text extraction (VIN, mileage, etc.).
    """
    
    def __init__(self):
        """Initialize Vision API client using ADC"""
        try:
            self.client = vision.ImageAnnotatorClient()
            logger.info("Vision API client initialized successfully with ADC")
        except Exception as e:
            logger.error(f"Failed to initialize Vision API client: {e}")
            raise
    
    async def analyze_car_image(self, image_content: bytes, image_name: str = "car_image") -> Dict[str, Any]:
        """
        Comprehensive car image analysis
        
        Args:
            image_content: Image data as bytes
            image_name: Name/identifier for the image (for logging)
            
        Returns:
            Dictionary with analysis results including:
            - make_model_detected: Detected car make/model info
            - condition_assessment: Vehicle condition indicators
            - text_extracted: Any text found (VIN, mileage, etc.)
            - damage_indicators: Signs of damage or wear
            - confidence_scores: Confidence levels for detections
        """
        try:
            logger.info(f"Analyzing car image: {image_name}")
            
            # Run all Vision API analyses
            labels = await self._detect_labels(image_content)
            texts = await self._detect_text(image_content)
            objects = await self._detect_objects(image_content)
            
            # Process results for car-specific insights
            analysis_result = self._process_car_analysis(labels, texts, objects, image_name)
            
            logger.info(f"Image analysis completed for {image_name}: {analysis_result['summary']}")
            return analysis_result
            
        except Exception as e:
            logger.error(f"Vision API analysis failed for {image_name}: {e}")
            return {
                'success': False,
                'error': str(e),
                'image_name': image_name,
                'make_model_detected': {},
                'condition_assessment': {},
                'text_extracted': [],
                'damage_indicators': [],
                'confidence_scores': {}
            }
    
    async def _detect_labels(self, image_content: bytes) -> List[Dict[str, Any]]:
        """Detect labels in image using Vision API"""
        try:
            image = vision.Image(content=image_content)
            
            # Run label detection in thread pool to avoid blocking
            response = await asyncio.to_thread(
                self.client.label_detection, image=image
            )
            
            if response.error.message:
                raise Exception(f'Vision API error: {response.error.message}')
            
            labels = []
            for label in response.label_annotations:
                labels.append({
                    'description': label.description,
                    'score': round(label.score, 4),
                    'confidence_percent': round(label.score * 100, 1)
                })
            
            logger.debug(f"Detected {len(labels)} labels")
            return labels
            
        except google_exceptions.PermissionDenied as e:
            logger.error(f"Vision API permission denied: {e}")
            raise Exception("Vision API access denied. Check IAM permissions.")
        except google_exceptions.QuotaExceeded as e:
            logger.error(f"Vision API quota exceeded: {e}")
            raise Exception("Vision API quota exceeded. Check usage limits.")
        except Exception as e:
            logger.error(f"Label detection failed: {e}")
            return []
    
    async def _detect_text(self, image_content: bytes) -> List[str]:
        """Detect text in image using Vision API"""
        try:
            image = vision.Image(content=image_content)
            response = await asyncio.to_thread(
                self.client.text_detection, image=image
            )
            
            if response.error.message:
                raise Exception(f'Vision API error: {response.error.message}')
            
            texts = [text.description for text in response.text_annotations]
            logger.debug(f"Detected {len(texts)} text elements")
            return texts
            
        except Exception as e:
            logger.error(f"Text detection failed: {e}")
            return []
    
    async def _detect_objects(self, image_content: bytes) -> List[Dict[str, Any]]:
        """Detect objects in image using Vision API"""
        try:
            image = vision.Image(content=image_content)
            response = await asyncio.to_thread(
                self.client.object_localization, image=image
            )
            
            if response.error.message:
                raise Exception(f'Vision API error: {response.error.message}')
            
            objects = []
            for obj in response.localized_object_annotations:
                objects.append({
                    'name': obj.name,
                    'score': round(obj.score, 4),
                    'confidence_percent': round(obj.score * 100, 1)
                })
            
            logger.debug(f"Detected {len(objects)} objects")
            return objects
            
        except Exception as e:
            logger.error(f"Object detection failed: {e}")
            return []
    
    def _process_car_analysis(self, labels: List[Dict], texts: List[str], objects: List[Dict], image_name: str) -> Dict[str, Any]:
        """Process Vision API results into car-specific insights"""
        
        # Car-related keywords for classification
        car_keywords = {
            'make_model': ['car', 'vehicle', 'automobile', 'sedan', 'suv', 'truck', 'coupe', 'hatchback', 'wagon'],
            'luxury': ['luxury', 'premium', 'executive', 'sports car'],
            'damage': ['rust', 'dent', 'scratch', 'damaged', 'worn', 'cracked'],
            'condition': ['new', 'used', 'vintage', 'classic', 'restored'],
            'parts': ['wheel', 'tire', 'door', 'window', 'bumper', 'hood', 'trunk'],
            'brands': ['toyota', 'honda', 'ford', 'bmw', 'mercedes', 'audi', 'nissan', 'hyundai', 'kia', 'mazda']
        }
        
        # Categorize detected labels
        make_model_info = []
        condition_info = []
        damage_info = []
        parts_info = []
        
        for label in labels:
            desc_lower = label['description'].lower()
            
            # Check for car-related labels
            if any(keyword in desc_lower for keyword in car_keywords['make_model']):
                make_model_info.append(label)
            elif any(keyword in desc_lower for keyword in car_keywords['luxury']):
                make_model_info.append(label)
            elif any(keyword in desc_lower for keyword in car_keywords['brands']):
                make_model_info.append(label)
            elif any(keyword in desc_lower for keyword in car_keywords['damage']):
                damage_info.append(label)
            elif any(keyword in desc_lower for keyword in car_keywords['condition']):
                condition_info.append(label)
            elif any(keyword in desc_lower for keyword in car_keywords['parts']):
                parts_info.append(label)
        
        # Extract meaningful text (VIN, mileage, etc.)
        extracted_info = self._extract_car_text_info(texts)
        
        # Calculate confidence scores
        overall_confidence = self._calculate_confidence(labels, make_model_info)
        
        return {
            'success': True,
            'image_name': image_name,
            'make_model_detected': {
                'labels': make_model_info,
                'confidence': overall_confidence['make_model'],
                'primary_type': make_model_info[0]['description'] if make_model_info else 'Unknown'
            },
            'condition_assessment': {
                'labels': condition_info,
                'damage_indicators': damage_info,
                'parts_visible': parts_info,
                'overall_condition': self._assess_condition(condition_info, damage_info)
            },
            'text_extracted': extracted_info,
            'damage_indicators': damage_info,
            'confidence_scores': overall_confidence,
            'summary': {
                'total_labels': len(labels),
                'car_related_labels': len(make_model_info),
                'text_elements': len(texts),
                'objects_detected': len(objects),
                'analysis_quality': 'high' if overall_confidence['overall'] > 0.7 else 'medium' if overall_confidence['overall'] > 0.4 else 'low'
            }
        }
    
    def _extract_car_text_info(self, texts: List[str]) -> Dict[str, Any]:
        """Extract car-specific information from detected text"""
        extracted = {
            'vin_candidates': [],
            'mileage_candidates': [],
            'year_candidates': [],
            'price_candidates': [],
            'other_text': []
        }
        
        import re
        
        for text in texts:
            text_clean = text.strip()
            if not text_clean:
                continue
                
            # VIN pattern (17 characters, alphanumeric except I, O, Q)
            vin_pattern = r'\b[A-HJ-NPR-Z0-9]{17}\b'
            if re.match(vin_pattern, text_clean):
                extracted['vin_candidates'].append(text_clean)
                continue
            
            # Mileage patterns
            mileage_patterns = [
                r'\b(\d{1,3}(?:,\d{3})*)\s*(?:miles?|mi|km)\b',
                r'\b(\d{1,6})\s*(?:miles?|mi|km)\b'
            ]
            for pattern in mileage_patterns:
                match = re.search(pattern, text_clean.lower())
                if match:
                    extracted['mileage_candidates'].append({
                        'value': match.group(1),
                        'text': text_clean
                    })
                    break
            
            # Year pattern (1900-2030)
            year_pattern = r'\b(19[0-9]{2}|20[0-3][0-9])\b'
            match = re.search(year_pattern, text_clean)
            if match:
                extracted['year_candidates'].append(match.group(1))
                continue
            
            # Price pattern
            price_pattern = r'\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)'
            match = re.search(price_pattern, text_clean)
            if match:
                extracted['price_candidates'].append({
                    'value': match.group(1),
                    'text': text_clean
                })
                continue
            
            # Store other text
            if len(text_clean) > 2:  # Ignore single characters
                extracted['other_text'].append(text_clean)
        
        return extracted
    
    def _assess_condition(self, condition_labels: List[Dict], damage_labels: List[Dict]) -> str:
        """Assess overall vehicle condition based on detected labels"""
        if damage_labels:
            return 'poor'
        elif any('new' in label['description'].lower() for label in condition_labels):
            return 'excellent'
        elif any('vintage' in label['description'].lower() or 'classic' in label['description'].lower() for label in condition_labels):
            return 'classic'
        elif condition_labels:
            return 'good'
        else:
            return 'unknown'
    
    def _calculate_confidence(self, all_labels: List[Dict], car_labels: List[Dict]) -> Dict[str, float]:
        """Calculate confidence scores for the analysis"""
        if not all_labels:
            return {'overall': 0.0, 'make_model': 0.0}
        
        # Overall confidence is average of top 3 labels
        top_3_avg = sum(label['score'] for label in all_labels[:3]) / min(3, len(all_labels))
        
        # Car-specific confidence
        car_confidence = 0.0
        if car_labels:
            car_confidence = max(label['score'] for label in car_labels)
        
        return {
            'overall': round(top_3_avg, 3),
            'make_model': round(car_confidence, 3)
        }


# Convenience function for easy integration
async def analyze_car_image_bytes(image_bytes: bytes, image_name: str = "uploaded_image") -> Dict[str, Any]:
    """
    Convenience function to analyze a car image from bytes
    
    Usage in your FastAPI endpoints:
        from app.services.vision_analyzer import analyze_car_image_bytes
        
        result = await analyze_car_image_bytes(image_data, "user_upload.jpg")
        if result['success']:
            make_model = result['make_model_detected']['primary_type']
            condition = result['condition_assessment']['overall_condition']
    """
    analyzer = VisionAnalyzer()
    return await analyzer.analyze_car_image(image_bytes, image_name) 