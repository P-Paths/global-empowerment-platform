"""
VIN Knowledge Base Service

Stores and retrieves VIN feature data to avoid expensive API calls.
This allows the system to learn from previous VIN lookups and reuse
knowledge across multiple users and listings.
"""

import logging
from typing import Optional, Dict, List, Any
from datetime import datetime
import json

logger = logging.getLogger(__name__)


class VINKnowledgeBase:
    """Service to store and retrieve VIN feature data"""
    
    def __init__(self, supabase_client=None):
        """
        Initialize VIN Knowledge Base service
        
        Args:
            supabase_client: Supabase client instance (optional, will create if not provided)
        """
        self.supabase = supabase_client
        if not self.supabase:
            try:
                from app.core.supabase_config import get_supabase
                self.supabase = get_supabase()
                if self.supabase:
                    print(f"[VIN-KB] ✅ Supabase client initialized successfully")
                else:
                    print(f"[VIN-KB] ⚠️  Supabase client is None - check SUPABASE_URL and SUPABASE_ANON_KEY in .env")
                    logger.warning("Supabase client is None - VIN knowledge base will not work")
            except Exception as e:
                logger.warning(f"Could not initialize Supabase client: {e}")
                print(f"[VIN-KB] ❌ Failed to initialize Supabase: {e}")
                import traceback
                print(f"[VIN-KB] ❌ Traceback: {traceback.format_exc()}")
                self.supabase = None
    
    async def get_vin_features(self, vin: str) -> Optional[Dict[str, Any]]:
        """
        Get VIN features from knowledge base
        
        Args:
            vin: VIN number (17 characters)
            
        Returns:
            Dictionary with VIN feature data, or None if not found
        """
        if not self.supabase or not vin:
            return None
        
        try:
            vin_clean = vin.upper().strip()
            if len(vin_clean) != 17:
                return None
            
            # Query knowledge base
            response = self.supabase.table('vin_knowledge_base') \
                .select('*') \
                .eq('vin', vin_clean) \
                .maybe_single() \
                .execute()
            
            if response.data:
                # Update last_used_date and usage_count
                await self._update_usage(vin_clean)
                
                logger.info(f"✅ Found VIN {vin_clean} in knowledge base (used {response.data.get('usage_count', 0)} times)")
                return response.data
            else:
                logger.info(f"ℹ️  VIN {vin_clean} not found in knowledge base")
                return None
                
        except Exception as e:
            logger.error(f"Error querying VIN knowledge base for {vin}: {e}")
            return None
    
    async def store_vin_features(
        self,
        vin: str,
        make: Optional[str] = None,
        model: Optional[str] = None,
        year: Optional[int] = None,
        trim: Optional[str] = None,
        nhtsa_data: Optional[Dict[str, Any]] = None,
        features_interior: Optional[List[str]] = None,
        features_exterior: Optional[List[str]] = None,
        features_safety: Optional[List[str]] = None,
        features_technology: Optional[List[str]] = None,
        features_comfort: Optional[List[str]] = None,
        features_powertrain: Optional[List[str]] = None,
        features_audio_entertainment: Optional[List[str]] = None,
        all_features: Optional[List[str]] = None,
        extraction_source: str = 'combined',
        confidence_score: Optional[float] = None
    ) -> bool:
        """
        Store VIN features in knowledge base
        
        Args:
            vin: VIN number
            make: Vehicle make
            model: Vehicle model
            year: Vehicle year
            trim: Vehicle trim
            nhtsa_data: Raw NHTSA decoded data
            features_interior: Interior features list
            features_exterior: Exterior features list
            features_safety: Safety features list
            features_technology: Technology features list
            features_comfort: Comfort features list
            features_powertrain: Powertrain features list
            features_audio_entertainment: Audio/entertainment features list
            all_features: Combined list of all features
            extraction_source: Source of extraction ('nhtsa', 'google_search', 'ai_extraction', 'combined')
            confidence_score: Confidence score (0.0 to 1.0)
            
        Returns:
            True if stored successfully, False otherwise
        """
        if not vin:
            print(f"[VIN-KB] ⚠️  No VIN provided, cannot store")
            return False
        
        if not self.supabase:
            print(f"[VIN-KB] ⚠️  Supabase client not initialized, cannot store VIN {vin}")
            logger.warning("Supabase client not initialized - cannot store VIN features")
            return False
        
        try:
            vin_clean = vin.upper().strip()
            if len(vin_clean) != 17:
                logger.warning(f"Invalid VIN length: {vin_clean}")
                return False
            
            # Check if VIN already exists
            existing = await self.get_vin_features(vin_clean)
            
            # Combine all features if not provided
            if not all_features:
                all_features = []
                if features_interior:
                    all_features.extend(features_interior)
                if features_exterior:
                    all_features.extend(features_exterior)
                if features_safety:
                    all_features.extend(features_safety)
                if features_technology:
                    all_features.extend(features_technology)
                if features_comfort:
                    all_features.extend(features_comfort)
                if features_powertrain:
                    all_features.extend(features_powertrain)
                if features_audio_entertainment:
                    all_features.extend(features_audio_entertainment)
                # Remove duplicates
                all_features = list(dict.fromkeys(all_features))  # Preserves order
            
            data = {
                'vin': vin_clean,
                'make': make,
                'model': model,
                'year': year,
                'trim': trim,
                'nhtsa_data': nhtsa_data,
                'features_interior': features_interior or [],
                'features_exterior': features_exterior or [],
                'features_safety': features_safety or [],
                'features_technology': features_technology or [],
                'features_comfort': features_comfort or [],
                'features_powertrain': features_powertrain or [],
                'features_audio_entertainment': features_audio_entertainment or [],
                'all_features': all_features,
                'extraction_source': extraction_source,
                'confidence_score': confidence_score,
                'updated_at': datetime.utcnow().isoformat()
            }
            
            if existing:
                # Update existing record
                response = self.supabase.table('vin_knowledge_base') \
                    .update(data) \
                    .eq('vin', vin_clean) \
                    .execute()
                logger.info(f"✅ Updated VIN {vin_clean} in knowledge base")
                print(f"[VIN-KB] ✅ Updated VIN {vin_clean} in knowledge base: {len(all_features)} features")
            else:
                # Insert new record
                data['created_at'] = datetime.utcnow().isoformat()
                data['last_used_date'] = datetime.utcnow().isoformat()
                data['usage_count'] = 1
                
                response = self.supabase.table('vin_knowledge_base') \
                    .insert(data) \
                    .execute()
                logger.info(f"✅ Stored new VIN {vin_clean} in knowledge base")
                print(f"[VIN-KB] ✅ Stored new VIN {vin_clean} in knowledge base: {len(all_features)} features")
                if response.data:
                    print(f"[VIN-KB] 📊 Stored data: {json.dumps(response.data[0] if response.data else {}, indent=2)}")
            
            return True
            
        except Exception as e:
            logger.error(f"Error storing VIN features for {vin}: {e}")
            print(f"[VIN-KB] ❌ ERROR storing VIN {vin}: {str(e)}")
            import traceback
            print(f"[VIN-KB] ❌ Traceback: {traceback.format_exc()}")
            return False
    
    async def _update_usage(self, vin: str) -> None:
        """Update last_used_date and usage_count for a VIN"""
        if not self.supabase:
            return
        
        try:
            vin_clean = vin.upper().strip()
            self.supabase.table('vin_knowledge_base') \
                .update({
                    'last_used_date': datetime.utcnow().isoformat(),
                    'updated_at': datetime.utcnow().isoformat()
                }) \
                .eq('vin', vin_clean) \
                .execute()
        except Exception as e:
            logger.warning(f"Could not update usage stats for VIN {vin}: {e}")
    
    async def get_features_by_make_model_year(
        self,
        make: str,
        model: str,
        year: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """
        Get features for similar vehicles (same make/model/year)
        Useful for learning common features for a vehicle type
        
        Args:
            make: Vehicle make
            model: Vehicle model
            year: Vehicle year (optional)
            
        Returns:
            List of VIN feature records
        """
        if not self.supabase:
            return []
        
        try:
            query = self.supabase.table('vin_knowledge_base') \
                .select('*') \
                .eq('make', make) \
                .eq('model', model)
            
            if year:
                query = query.eq('year', year)
            
            response = query.order('last_used_date', desc=True) \
                .limit(10) \
                .execute()
            
            if response.data:
                logger.info(f"Found {len(response.data)} similar VINs for {make} {model} {year or ''}")
                return response.data
            else:
                return []
                
        except Exception as e:
            logger.error(f"Error querying knowledge base by make/model/year: {e}")
            return []
    
    def get_all_features_from_record(self, record: Dict[str, Any]) -> List[str]:
        """
        Extract all features from a knowledge base record
        
        Args:
            record: VIN knowledge base record
            
        Returns:
            Combined list of all features
        """
        if not record:
            return []
        
        # Return all_features if available, otherwise combine from categories
        if record.get('all_features'):
            return record['all_features']
        
        all_features = []
        for category in ['features_interior', 'features_exterior', 'features_safety',
                        'features_technology', 'features_comfort', 'features_powertrain',
                        'features_audio_entertainment']:
            if record.get(category):
                all_features.extend(record[category])
        
        # Remove duplicates while preserving order
        return list(dict.fromkeys(all_features))

