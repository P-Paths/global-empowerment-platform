"""
Negotiator Agent - Handles buyer communication strategy and negotiation tactics

This agent provides:
- Buyer message analysis and sentiment detection
- Response strategy recommendations
- Negotiation tactics and pricing guidance
- Appointment scheduling assistance
- Deal closing strategies
"""

from datetime import datetime
from typing import Dict, Any, List, Optional
from .base_agent import BaseAgent, AgentOutput
import logging
import json
import re

logger = logging.getLogger(__name__)


class NegotiatorAgent(BaseAgent):
    """Negotiator Agent - Handles buyer communication and negotiation"""
    
    def __init__(self, config=None):
        super().__init__("negotiator_agent", config)
        
        # Buyer message patterns and sentiment indicators
        self.buyer_patterns = {
            "serious_buyer": [
                "when can i see it", "available today", "cash in hand", "ready to buy",
                "test drive", "meet up", "location", "phone number", "vin"
            ],
            "price_negotiation": [
                "lowest price", "best offer", "negotiable", "flexible on price",
                "cash discount", "final price", "bottom dollar"
            ],
            "tire_kicker": [
                "still available", "pics", "more photos", "history", "accidents",
                "maintenance", "service records", "clean title"
            ],
            "urgent_seller": [
                "need gone", "moving", "quick sale", "asap", "today only",
                "motivated", "flexible", "open to offers"
            ]
        }
        
        # Response strategies
        self.response_strategies = {
            "serious_buyer": {
                "priority": "high",
                "response_time": "immediate",
                "tone": "professional_helpful",
                "actions": ["schedule_meeting", "provide_details", "confirm_availability"]
            },
            "price_negotiation": {
                "priority": "medium",
                "response_time": "within_1_hour",
                "tone": "firm_but_fair",
                "actions": ["price_justification", "market_comparison", "counter_offer"]
            },
            "tire_kicker": {
                "priority": "low",
                "response_time": "within_4_hours",
                "tone": "informative",
                "actions": ["provide_info", "encourage_visit", "highlight_features"]
            }
        }
    
    async def process(self, input_data: Dict[str, Any]) -> AgentOutput:
        """
        Analyze buyer message and provide negotiation strategy
        
        Args:
            input_data: Dict containing:
                - buyer_message: str (message from buyer)
                - listing_data: Dict (car listing information)
                - seller_preferences: Dict (seller's rules and preferences)
                - conversation_history: List (previous messages)
        
        Returns:
            AgentOutput with negotiation strategy and response recommendations
        """
        start_time = datetime.now()
        
        try:
            buyer_message = input_data.get("buyer_message", "")
            listing_data = input_data.get("listing_data", {})
            seller_preferences = input_data.get("seller_preferences", {})
            conversation_history = input_data.get("conversation_history", [])
            
            if not buyer_message:
                raise ValueError("No buyer message provided")
            
            # Analyze buyer message
            analysis = await self._analyze_buyer_message(buyer_message, conversation_history)
            
            # Generate response strategy
            strategy = await self._generate_response_strategy(
                analysis, listing_data, seller_preferences
            )
            
            # Create recommended response
            recommended_response = await self._create_recommended_response(
                strategy, listing_data, seller_preferences
            )
            
            processing_time = (datetime.now() - start_time).total_seconds()
            
            return AgentOutput(
                agent_name=self.name,
                timestamp=datetime.now(),
                success=True,
                data={
                    "buyer_analysis": analysis,
                    "response_strategy": strategy,
                    "recommended_response": recommended_response,
                    "priority_level": strategy.get("priority", "medium"),
                    "response_timing": strategy.get("response_time", "within_1_hour"),
                    "suggested_actions": strategy.get("actions", []),
                    "processing_time": processing_time
                },
                confidence=0.85,
                processing_time=processing_time
            )
            
        except Exception as e:
            logger.error(f"Negotiator agent error: {e}")
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
    
    async def _analyze_buyer_message(self, message: str, history: List[Dict]) -> Dict[str, Any]:
        """Analyze buyer message for intent, sentiment, and urgency"""
        message_lower = message.lower()
        
        # Detect buyer type
        buyer_type = "unknown"
        confidence = 0.0
        
        for pattern_type, patterns in self.buyer_patterns.items():
            matches = sum(1 for pattern in patterns if pattern in message_lower)
            if matches > 0:
                buyer_type = pattern_type
                confidence = min(matches / len(patterns), 1.0)
                break
        
        # Detect urgency indicators
        urgency_indicators = [
            "asap", "today", "now", "urgent", "quick", "immediate",
            "cash in hand", "ready to buy", "available today"
        ]
        urgency_score = sum(1 for indicator in urgency_indicators if indicator in message_lower) / len(urgency_indicators)
        
        # Detect price sensitivity
        price_indicators = [
            "price", "cost", "money", "dollar", "cash", "offer", "negotiate",
            "discount", "deal", "value", "worth"
        ]
        price_sensitivity = sum(1 for indicator in price_indicators if indicator in message_lower) / len(price_indicators)
        
        return {
            "buyer_type": buyer_type,
            "confidence": confidence,
            "urgency_score": urgency_score,
            "price_sensitivity": price_sensitivity,
            "message_length": len(message),
            "has_questions": "?" in message,
            "has_contact_info": any(word in message_lower for word in ["phone", "call", "text", "email"]),
            "conversation_length": len(history)
        }
    
    async def _generate_response_strategy(self, analysis: Dict, listing_data: Dict, seller_preferences: Dict) -> Dict[str, Any]:
        """Generate response strategy based on buyer analysis"""
        buyer_type = analysis.get("buyer_type", "unknown")
        urgency_score = analysis.get("urgency_score", 0)
        
        # Get base strategy
        base_strategy = self.response_strategies.get(buyer_type, self.response_strategies["tire_kicker"])
        
        # Adjust based on urgency
        if urgency_score > 0.7:
            base_strategy["response_time"] = "immediate"
            base_strategy["priority"] = "high"
        
        # Adjust based on seller preferences
        if seller_preferences.get("flexible_pricing", False):
            base_strategy["actions"].append("price_negotiation")
        
        if seller_preferences.get("quick_sale", False):
            base_strategy["actions"].append("incentivize_quick_close")
        
        return base_strategy
    
    async def _create_recommended_response(self, strategy: Dict, listing_data: Dict, seller_preferences: Dict) -> str:
        """Create a recommended response based on strategy"""
        tone = strategy.get("tone", "professional_helpful")
        actions = strategy.get("actions", [])
        
        # Base response template
        response_parts = []
        
        # Greeting
        response_parts.append("Thanks for your interest!")
        
        # Address availability
        if "schedule_meeting" in actions:
            response_parts.append("The car is still available and I'd be happy to show it to you.")
        
        # Address pricing
        if "price_justification" in actions:
            price = listing_data.get("price", 0)
            response_parts.append(f"The asking price is ${price:,} which is competitive for this make/model/year.")
        
        # Call to action
        if "schedule_meeting" in actions:
            response_parts.append("When would be a good time for you to see it? I'm flexible on timing.")
        else:
            response_parts.append("Let me know if you have any questions or would like to schedule a viewing.")
        
        # Closing
        response_parts.append("Looking forward to hearing from you!")
        
        return " ".join(response_parts)
    
    def get_capabilities(self) -> List[str]:
        """Return list of capabilities this agent provides"""
        return [
            "Buyer message analysis",
            "Sentiment detection",
            "Response strategy generation",
            "Negotiation tactics",
            "Appointment scheduling",
            "Deal closing assistance"
        ]
