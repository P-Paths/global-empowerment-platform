"""
Content Generation Agent - Creates optimized listing content

This agent generates:
- Optimized titles
- Compelling descriptions
- Feature bullets
- Platform-specific content (Facebook, Craigslist, etc.)
- CTAs and disclosures
"""

from datetime import datetime
from typing import Dict, Any, List, Optional
from .base_agent import BaseAgent, AgentOutput
import logging
import json

logger = logging.getLogger(__name__)


class ContentGenerationAgent(BaseAgent):
    """Content Generation Agent - Creates optimized listing content"""
    
    def __init__(self, config=None):
        super().__init__("content_generation_agent", config)
        
        # Platform-specific content guidelines
        self.platform_guidelines = {
            "facebook": {
                "title_max_length": 60,
                "description_max_length": 5000,
                "emoji_allowed": True,
                "hashtags_allowed": True,
                "cta_style": "friendly"
            },
            "craigslist": {
                "title_max_length": 70,
                "description_max_length": 4000,
                "emoji_allowed": False,
                "hashtags_allowed": False,
                "cta_style": "direct"
            },
            "offerup": {
                "title_max_length": 50,
                "description_max_length": 3000,
                "emoji_allowed": True,
                "hashtags_allowed": False,
                "cta_style": "casual"
            }
        }
        
        # Common feature keywords
        self.feature_keywords = {
            "interior": ["leather", "cloth", "heated seats", "cooled seats", "navigation", "bluetooth", "backup camera", "sunroof", "moonroof"],
            "exterior": ["alloy wheels", "steel wheels", "fog lights", "led lights", "tinted windows", "spoiler", "tow hitch"],
            "safety": ["airbags", "abs", "traction control", "stability control", "backup sensors", "blind spot monitoring"],
            "performance": ["turbo", "v6", "v8", "4-cylinder", "hybrid", "electric", "all-wheel drive", "4wd"]
        }
    
    async def process(self, input_data: Dict[str, Any]) -> AgentOutput:
        """
        Generate optimized listing content
        
        Args:
            input_data: Dict containing:
                - vehicle_data: Dict (year, make, model, mileage, condition, title_status, features)
                - pricing_strategy: Dict (pricing options and rationale)
                - platform: str (facebook, craigslist, offerup)
                - user_preferences: Dict (optional custom preferences)
        
        Returns:
            AgentOutput with generated content
        """
        start_time = datetime.now()
        
        try:
            vehicle_data = input_data.get("vehicle_data", {})
            pricing_strategy = input_data.get("pricing_strategy", {})
            platform = input_data.get("platform", "facebook")
            user_preferences = input_data.get("user_preferences", {})
            
            if not vehicle_data:
                raise ValueError("No vehicle data provided")
            
            # Generate content for the specified platform
            content = await self._generate_platform_content(
                vehicle_data, pricing_strategy, platform, user_preferences
            )
            
            processing_time = (datetime.now() - start_time).total_seconds()
            
            return AgentOutput(
                agent_name=self.name,
                timestamp=datetime.now(),
                success=True,
                data={
                    "content": content,
                    "platform": platform,
                    "content_optimization": self._get_optimization_tips(platform),
                    "processing_time": processing_time
                },
                confidence=0.9,
                processing_time=processing_time
            )
            
        except Exception as e:
            logger.error(f"Content generation agent error: {e}")
            processing_time = (datetime.now() - start_time).total_seconds()
            
            return AgentOutput(
                agent_name=self.name,
                timestamp=datetime.now(),
                success=False,
                data={"error": str(e)},
                confidence=0.0,
                processing_time=processing_time,
                error_message=str(e)
            )
    
    async def _generate_platform_content(self, vehicle_data: Dict, pricing_strategy: Dict, platform: str, user_preferences: Dict) -> Dict[str, Any]:
        """
        Generate platform-specific content
        """
        guidelines = self.platform_guidelines.get(platform, self.platform_guidelines["facebook"])
        
        # Generate title
        title = self._generate_title(vehicle_data, guidelines)
        
        # Generate description
        description = self._generate_description(vehicle_data, pricing_strategy, guidelines)
        
        # Generate feature bullets
        feature_bullets = self._generate_feature_bullets(vehicle_data)
        
        # Generate CTAs
        ctas = self._generate_ctas(platform, guidelines)
        
        # Generate disclosures
        disclosures = self._generate_disclosures(vehicle_data)
        
        # Generate platform-specific content
        platform_content = self._generate_platform_specific_content(platform, vehicle_data, pricing_strategy)
        
        return {
            "title": title,
            "description": description,
            "feature_bullets": feature_bullets,
            "ctas": ctas,
            "disclosures": disclosures,
            "platform_specific": platform_content,
            "content_length": {
                "title_length": len(title),
                "description_length": len(description),
                "total_length": len(title) + len(description)
            },
            "seo_optimized": self._check_seo_optimization(title, description, vehicle_data)
        }
    
    def _generate_title(self, vehicle_data: Dict, guidelines: Dict) -> str:
        """
        Generate optimized title
        """
        year = vehicle_data.get("year", "")
        make = vehicle_data.get("make", "").title()
        model = vehicle_data.get("model", "").title()
        mileage = vehicle_data.get("mileage", "")
        condition = vehicle_data.get("condition", "").title()
        
        # Base title
        title_parts = []
        if year:
            title_parts.append(str(year))
        if make:
            title_parts.append(make)
        if model:
            title_parts.append(model)
        
        # Add condition if it's good or excellent
        if condition and condition.lower() in ["excellent", "good"]:
            title_parts.append(condition)
        
        # Add mileage if it's low
        if mileage and mileage < 100000:
            title_parts.append(f"{mileage:,} miles")
        
        title = " ".join(title_parts)
        
        # Truncate if too long
        max_length = guidelines.get("title_max_length", 60)
        if len(title) > max_length:
            title = title[:max_length-3] + "..."
        
        return title
    
    def _generate_description(self, vehicle_data: Dict, pricing_strategy: Dict, guidelines: Dict) -> str:
        """
        Generate compelling description
        """
        description_parts = []
        
        # Opening hook
        year = vehicle_data.get("year", "")
        make = vehicle_data.get("make", "").title()
        model = vehicle_data.get("model", "").title()
        
        if year and make and model:
            description_parts.append(f"🚗 {year} {make} {model} - Ready for a new home!")
        
        # Key details
        mileage = vehicle_data.get("mileage", "")
        if mileage:
            description_parts.append(f"📏 Mileage: {mileage:,} miles")
        
        condition = vehicle_data.get("condition", "").title()
        if condition:
            description_parts.append(f"✨ Condition: {condition}")
        
        title_status = vehicle_data.get("title_status", "").title()
        if title_status:
            description_parts.append(f"📋 Title: {title_status}")
        
        # Features
        features = vehicle_data.get("features", [])
        if features:
            description_parts.append("🔧 Features:")
            for feature in features[:5]:  # Limit to 5 features
                description_parts.append(f"• {feature}")
        
        # Pricing information
        if pricing_strategy:
            market_price = pricing_strategy.get("market_price", {}).get("price", "")
            if market_price:
                description_parts.append(f"💰 Priced at ${market_price:,} - Competitive market value!")
        
        # Call to action
        description_parts.append("📞 Serious inquiries only. No lowballers or scammers.")
        description_parts.append("📍 Available for viewing by appointment.")
        
        description = "\n\n".join(description_parts)
        
        # Truncate if too long
        max_length = guidelines.get("description_max_length", 5000)
        if len(description) > max_length:
            description = description[:max_length-3] + "..."
        
        return description
    
    def _generate_feature_bullets(self, vehicle_data: Dict) -> List[str]:
        """
        Generate feature bullet points
        """
        features = vehicle_data.get("features", [])
        bullets = []
        
        for feature in features:
            # Categorize features
            for category, keywords in self.feature_keywords.items():
                if any(keyword in feature.lower() for keyword in keywords):
                    bullets.append(f"• {feature.title()}")
                    break
            else:
                bullets.append(f"• {feature.title()}")
        
        return bullets[:10]  # Limit to 10 bullets
    
    def _generate_ctas(self, platform: str, guidelines: Dict) -> List[str]:
        """
        Generate platform-specific calls to action
        """
        cta_style = guidelines.get("cta_style", "friendly")
        
        if cta_style == "friendly":
            return [
                "📱 Message me for more details!",
                "📞 Call or text for quick response",
                "🚗 Test drive available by appointment"
            ]
        elif cta_style == "direct":
            return [
                "Contact for details",
                "Call for appointment",
                "Serious buyers only"
            ]
        else:  # casual
            return [
                "Hit me up for details!",
                "Text me for quick response",
                "Down to show the car anytime"
            ]
    
    def _generate_disclosures(self, vehicle_data: Dict) -> List[str]:
        """
        Generate required disclosures
        """
        disclosures = []

        title_status_raw = vehicle_data.get("title_status")
        title_status = (str(title_status_raw) if title_status_raw and isinstance(title_status_raw, str) else "").lower()
        if title_status in ["rebuilt", "salvage", "junk"]:
            disclosures.append(f"⚠️ {title_status.title()} title - Vehicle has been previously damaged/repaired")
        
        mileage = vehicle_data.get("mileage", 0)
        if mileage > 150000:
            disclosures.append("⚠️ High mileage vehicle")
        
        condition_raw = vehicle_data.get("condition")
        condition = (str(condition_raw) if condition_raw and isinstance(condition_raw, str) else "").lower()
        if condition in ["fair", "poor"]:
            disclosures.append(f"⚠️ {condition.title()} condition - Some wear and tear")
        
        # Standard disclosures
        disclosures.extend([
            "📋 Clean title in hand",
            "🚗 Vehicle sold as-is",
            "💰 Cash or bank check only"
        ])
        
        return disclosures
    
    def _generate_platform_specific_content(self, platform: str, vehicle_data: Dict, pricing_strategy: Dict) -> Dict[str, Any]:
        """
        Generate platform-specific optimizations
        """
        if platform == "facebook":
            return {
                "hashtags": self._generate_hashtags(vehicle_data),
                "emoji_usage": "extensive",
                "tone": "friendly and social"
            }
        elif platform == "craigslist":
            return {
                "keywords": self._generate_keywords(vehicle_data),
                "emoji_usage": "minimal",
                "tone": "professional and direct"
            }
        elif platform == "offerup":
            return {
                "hashtags": [],
                "emoji_usage": "moderate",
                "tone": "casual and approachable"
            }
        
        return {}
    
    def _generate_hashtags(self, vehicle_data: Dict) -> List[str]:
        """
        Generate relevant hashtags for Facebook
        """
        hashtags = []
        
        year = vehicle_data.get("year", "")
        make_raw = vehicle_data.get("make")
        make = (str(make_raw) if make_raw and isinstance(make_raw, str) else "").lower()
        model_raw = vehicle_data.get("model")
        model = (str(model_raw) if model_raw and isinstance(model_raw, str) else "").lower()
        
        if year:
            hashtags.append(f"#{year}")
        if make:
            hashtags.append(f"#{make}")
        if model:
            hashtags.append(f"#{model}")
        
        hashtags.extend([
            "#carsale", "#usedcar", "#cardeals", "#automotive",
            "#carlife", "#carforsale", "#localdeal"
        ])
        
        return hashtags[:10]  # Limit to 10 hashtags
    
    def _generate_keywords(self, vehicle_data: Dict) -> List[str]:
        """
        Generate SEO keywords for Craigslist
        """
        keywords = []
        
        year = vehicle_data.get("year", "")
        make_raw = vehicle_data.get("make")
        make = (str(make_raw) if make_raw and isinstance(make_raw, str) else "").lower()
        model_raw = vehicle_data.get("model")
        model = (str(model_raw) if model_raw and isinstance(model_raw, str) else "").lower()
        
        if year:
            keywords.append(str(year))
        if make:
            keywords.append(make)
        if model:
            keywords.append(model)
        
        keywords.extend([
            "car", "vehicle", "automobile", "used", "sale",
            "reliable", "clean", "well maintained"
        ])
        
        return keywords
    
    def _check_seo_optimization(self, title: str, description: str, vehicle_data: Dict) -> Dict[str, Any]:
        """
        Check SEO optimization of content
        """
        year = str(vehicle_data.get("year", ""))
        make_raw = vehicle_data.get("make")
        make = (str(make_raw) if make_raw and isinstance(make_raw, str) else "").lower()
        model_raw = vehicle_data.get("model")
        model = (str(model_raw) if model_raw and isinstance(model_raw, str) else "").lower()
        
        seo_score = 0
        issues = []
        
        # Check if year is in title
        if year and year in title:
            seo_score += 25
        else:
            issues.append("Year not in title")
        
        # Check if make is in title
        if make and make in title.lower():
            seo_score += 25
        else:
            issues.append("Make not in title")
        
        # Check if model is in title
        if model and model in title.lower():
            seo_score += 25
        else:
            issues.append("Model not in title")
        
        # Check description length
        if len(description) > 200:
            seo_score += 25
        else:
            issues.append("Description too short")
        
        return {
            "score": seo_score,
            "issues": issues,
            "optimization_level": "excellent" if seo_score >= 75 else "good" if seo_score >= 50 else "needs_improvement"
        }
    
    def _get_optimization_tips(self, platform: str) -> List[str]:
        """
        Get platform-specific optimization tips
        """
        if platform == "facebook":
            return [
                "Use emojis to make your listing stand out",
                "Include relevant hashtags for better visibility",
                "Post during peak hours (7-9 PM) for maximum engagement",
                "Respond quickly to messages to maintain interest"
            ]
        elif platform == "craigslist":
            return [
                "Use specific keywords in your title",
                "Include clear, high-quality photos",
                "Be detailed in your description",
                "Price competitively based on market research"
            ]
        elif platform == "offerup":
            return [
                "Keep your listing casual and approachable",
                "Use local keywords for better visibility",
                "Include multiple photos from different angles",
                "Be responsive to potential buyers"
            ]
        
        return []
    
    def get_capabilities(self) -> List[str]:
        """Return list of capabilities this agent provides"""
        return [
            "Generate optimized titles for different platforms",
            "Create compelling descriptions with proper formatting",
            "Generate feature bullet points from vehicle data",
            "Create platform-specific calls to action",
            "Generate required disclosures based on vehicle condition",
            "Optimize content for SEO and search visibility",
            "Provide platform-specific optimization tips",
            "Generate hashtags and keywords for social platforms",
            "Ensure content meets platform guidelines and limits"
        ]
