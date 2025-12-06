"""
VIN Decoder Service
Decodes VIN numbers to get real vehicle specifications and features
"""

import re
import httpx
from typing import Optional, Dict, Any, List
import logging

logger = logging.getLogger(__name__)


class VINDecoder:
    """Service to decode VIN numbers and get vehicle specifications"""
    
    def __init__(self):
        self.nhtsa_base_url = "https://vpic.nhtsa.dot.gov/api/vehicles"
        self.session = httpx.AsyncClient(timeout=10.0)
    
    async def decode_vin(self, vin: str) -> Optional[Dict[str, Any]]:
        """
        Decode VIN using NHTSA API (free, no API key required)
        
        Args:
            vin: 17-character VIN number
            
        Returns:
            Dictionary with vehicle specifications or None if decode fails
        """
        if not vin or len(vin) != 17:
            logger.warning(f"Invalid VIN format: {vin}")
            return None
        
        # Clean VIN (remove spaces, convert to uppercase)
        vin_clean = vin.strip().upper()
        
        # Validate VIN format (17 alphanumeric characters, excluding I, O, Q)
        vin_pattern = r'^[A-HJ-NPR-Z0-9]{17}$'
        if not re.match(vin_pattern, vin_clean):
            logger.warning(f"VIN does not match required pattern: {vin_clean}")
            return None
        
        try:
            # NHTSA VIN Decoder API
            url = f"{self.nhtsa_base_url}/DecodeVin/{vin_clean}?format=json"
            
            response = await self.session.get(url)
            response.raise_for_status()
            data = response.json()
            
            if not data.get("Results") or len(data["Results"]) == 0:
                logger.warning(f"No results from NHTSA API for VIN: {vin_clean}")
                return None
            
            # Parse NHTSA response
            results = data["Results"]
            vin_data = {}
            
            for result in results:
                variable = result.get("Variable")
                value = result.get("Value")
                
                if variable and value and value != "Not Applicable" and value != "":
                    # Map NHTSA variables to our format
                    if variable == "Make":
                        vin_data["make"] = value
                    elif variable == "Model":
                        vin_data["model"] = value
                    elif variable == "Model Year":
                        try:
                            vin_data["year"] = int(value)
                        except (ValueError, TypeError):
                            pass
                    elif variable == "Trim":
                        vin_data["trim"] = value
                    elif variable == "Drive Type":
                        vin_data["drivetrain"] = value
                    elif variable == "Transmission Style":
                        vin_data["transmission"] = value
                    elif variable == "Engine Configuration":
                        vin_data["engine_config"] = value
                    elif variable == "Engine Number of Cylinders":
                        vin_data["cylinders"] = value
                    elif variable == "Displacement (L)":
                        vin_data["displacement"] = value
                    elif variable == "Fuel Type - Primary":
                        vin_data["fuel_type"] = value
                    elif variable == "Body Class":
                        vin_data["body_style"] = value
                    elif variable == "Vehicle Type":
                        vin_data["vehicle_type"] = value
            
            if vin_data:
                vin_data["vin"] = vin_clean
                logger.info(f"✅ Successfully decoded VIN: {vin_clean} -> {vin_data.get('make')} {vin_data.get('model')} {vin_data.get('year')}")
                return vin_data
            else:
                logger.warning(f"No usable data extracted from NHTSA response for VIN: {vin_clean}")
                return None
                
        except httpx.HTTPError as e:
            logger.error(f"HTTP error decoding VIN {vin_clean}: {e}")
            return None
        except Exception as e:
            logger.error(f"Error decoding VIN {vin_clean}: {e}")
            return None
    
    def extract_vin_from_text(self, text: str) -> Optional[str]:
        """
        Extract VIN from text (e.g., from aboutVehicle field)
        
        Args:
            text: Text that may contain a VIN
            
        Returns:
            Extracted VIN or None
        """
        if not text:
            return None
        
        # VIN pattern: 17 alphanumeric characters (excluding I, O, Q)
        vin_pattern = r'\b([A-HJ-NPR-Z0-9]{17})\b'
        matches = re.findall(vin_pattern, text.upper())
        
        if matches:
            # Return first valid VIN found
            return matches[0]
        
        return None
    
    async def get_vehicle_features_from_vin(self, vin: str) -> List[str]:
        """
        Get vehicle features from VIN - PURE NHTSA DATA ONLY.
        NO INFERENCE, NO ASSUMPTIONS, NO ENRICHMENT.
        
        Only returns features that are explicitly in the NHTSA response.
        
        Args:
            vin: VIN number
            
        Returns:
            List of features from NHTSA data (column names and values only)
        """
        vin_data = await self.decode_vin(vin)
        if not vin_data:
            return []
        
        features = []
        
        # ONLY use actual NHTSA data - no inference
        # Only add drivetrain if it's explicitly in the NHTSA response
        drivetrain = vin_data.get("drivetrain", "")
        if drivetrain and drivetrain != "Not Applicable":
            # Use the exact NHTSA value, formatted nicely
            features.append(drivetrain)
        
        # Return ONLY what NHTSA provides - no assumptions about modern cars, luxury brands, etc.
        return features
    
    async def close(self):
        """Close the HTTP session"""
        await self.session.aclose()


# Singleton instance
_vin_decoder_instance: Optional[VINDecoder] = None


async def get_vin_decoder() -> VINDecoder:
    """Get or create VIN decoder instance"""
    global _vin_decoder_instance
    if _vin_decoder_instance is None:
        _vin_decoder_instance = VINDecoder()
    return _vin_decoder_instance

