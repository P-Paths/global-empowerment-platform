"""
AI Brain - Multi-Agent Orchestration Service

Coordinates all 6 AI agents to process car deals from discovery to recommendation.
This is the core orchestration service that manages the entire multi-agent workflow.
"""

from typing import Any, Dict, List, Optional
from datetime import datetime
import asyncio
import logging
from ..agents import (
    ScoutAgent, ValuationAgent, InspectionAgent, 
    NegotiatorAgent, OrchestratorAgent, LearningAgent
)

logger = logging.getLogger(__name__)


class AIBrain:
    """
    AI Brain service that orchestrates the multi-agent car flipping system.
    
    This service coordinates all 6 agents to provide comprehensive deal analysis:
    1. Scout Agent - Finds and filters deals
    2. Valuation Agent - Analyzes market value and profit
    3. Inspection Agent - Performs due diligence
    4. Negotiator Agent - Handles communication strategy
    5. Orchestrator Agent - Makes final recommendations
    6. Learning Agent - Optimizes system performance
    """
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """
        Initialize the AI Brain with all agents.
        
        Args:
            config: Configuration for all agents
        """
        self.config = config or {}
        
        # Initialize all agents
        self.scout_agent = ScoutAgent(self.config.get("scout_agent", {}))
        self.valuation_agent = ValuationAgent(self.config.get("valuation_agent", {}))
        self.inspection_agent = InspectionAgent(self.config.get("inspection_agent", {}))
        self.negotiator_agent = NegotiatorAgent(self.config.get("negotiator_agent", {}))
        self.orchestrator_agent = OrchestratorAgent(self.config.get("orchestrator_agent", {}))
        self.learning_agent = LearningAgent(self.config.get("learning_agent", {}))
        
        # Agent registry for easy access
        self.agents = {
            "scout_agent": self.scout_agent,
            "valuation_agent": self.valuation_agent,
            "inspection_agent": self.inspection_agent,
            "negotiator_agent": self.negotiator_agent,
            "orchestrator_agent": self.orchestrator_agent,
            "learning_agent": self.learning_agent
        }
        
        logger.info("AI Brain initialized with all 6 agents")
    
    async def process_deal(self, listing_data: Dict[str, Any], user_preferences: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process a car deal through the complete multi-agent workflow.
        
        Args:
            listing_data: Car listing data
            user_preferences: User's preferences and constraints
            
        Returns:
            Complete deal analysis and recommendation
        """
        start_time = datetime.now()
        
        try:
            logger.info(f"Processing deal: {listing_data.get('title', 'Unknown')}")
            
            # Step 1: Scout Agent - Find and score the deal
            scout_result = await self._run_scout_agent(listing_data, user_preferences)
            
            if not scout_result["success"]:
                return self._create_error_response("Scout agent failed", str(scout_result.get("error_message", "Unknown error")))
            
            # Step 2: Valuation Agent - Analyze market value and profit
            valuation_result = await self._run_valuation_agent(listing_data, user_preferences)
            
            if not valuation_result["success"]:
                return self._create_error_response("Valuation agent failed", str(valuation_result.get("error_message", "Unknown error")))
            
            # Step 3: Inspection Agent - Perform due diligence
            inspection_result = await self._run_inspection_agent(listing_data, user_preferences)
            
            if not inspection_result["success"]:
                return self._create_error_response("Inspection agent failed", str(inspection_result.get("error_message", "Unknown error")))
            
            # Step 4: Negotiator Agent - Develop communication strategy
            negotiator_result = await self._run_negotiator_agent(listing_data, user_preferences)
            
            if not negotiator_result["success"]:
                return self._create_error_response("Negotiator agent failed", str(negotiator_result.get("error_message", "Unknown error")))
            
            # Step 5: Orchestrator Agent - Make final recommendation
            orchestrator_result = await self._run_orchestrator_agent(
                listing_data, user_preferences, {
                    "scout_agent": scout_result,
                    "valuation_agent": valuation_result,
                    "inspection_agent": inspection_result,
                    "negotiator_agent": negotiator_result
                }
            )
            
            if not orchestrator_result["success"]:
                return self._create_error_response("Orchestrator agent failed", str(orchestrator_result.get("error_message", "Unknown error")))
            
            # Step 6: Learning Agent - Track for optimization
            await self._run_learning_agent(listing_data, orchestrator_result)
            
            # Compile final response with safe data access
            processing_time = (datetime.now() - start_time).total_seconds()
            
            # Handle placeholder agents that don't return full data structure
            orchestrator_data = orchestrator_result.get("data", {})
            
            return {
                "success": True,
                "processing_time": processing_time,
                "timestamp": start_time.isoformat(),
                "deal_id": listing_data.get("id"),
                "final_recommendation": orchestrator_data.get("final_recommendation", "Deal analysis complete"),
                "comprehensive_analysis": orchestrator_data.get("comprehensive_analysis", {
                    "scout_analysis": scout_result.get("data", {}),
                    "valuation_analysis": valuation_result.get("data", {}),
                    "inspection_analysis": inspection_result.get("data", {}),
                    "negotiator_analysis": negotiator_result.get("data", {})
                }),
                "action_plan": orchestrator_data.get("action_plan", "Review deal details and proceed with caution"),
                "deal_summary": orchestrator_data.get("deal_summary", "Deal processed successfully"),
                "agent_outputs": {
                    "scout_agent": scout_result.get("data", {}),
                    "valuation_agent": valuation_result.get("data", {}),
                    "inspection_agent": inspection_result.get("data", {}),
                    "negotiator_agent": negotiator_result.get("data", {}),
                    "orchestrator_agent": orchestrator_data
                }
            }
            
        except Exception as e:
            logger.error(f"Error processing deal: {str(e)}", exc_info=True)
            return self._create_error_response("Processing failed", str(e))
    
    async def _run_scout_agent(self, listing_data: Dict[str, Any], user_preferences: Dict[str, Any]) -> Dict[str, Any]:
        """Run the Scout Agent to find and score the deal."""
        input_data = {
            "search_criteria": {
                "max_price": user_preferences.get("max_price", 50000),
                "location_radius": user_preferences.get("location_radius", 50),
                "make": user_preferences.get("make"),
                "model": user_preferences.get("model")
            },
            "user_preferences": user_preferences
        }
        
        # For existing listings, we'll simulate the scout process
        # In production, this would be used for new listings found by the scout
        result = await self.scout_agent.execute(input_data)
        return result.dict()
    
    async def _run_valuation_agent(self, listing_data: Dict[str, Any], user_preferences: Dict[str, Any]) -> Dict[str, Any]:
        """Run the Valuation Agent to analyze market value and profit."""
        input_data = {
            "listing_data": listing_data,
            "market_context": {
                "market_demand": user_preferences.get("market_demand", "normal"),
                "seasonal_factors": self._get_seasonal_factors()
            }
        }
        
        result = await self.valuation_agent.execute(input_data)
        return result.dict()
    
    async def _run_inspection_agent(self, listing_data: Dict[str, Any], user_preferences: Dict[str, Any]) -> Dict[str, Any]:
        """Run the Inspection Agent to perform due diligence."""
        input_data = {
            "listing_data": listing_data,
            "inspection_context": {
                "user_risk_tolerance": user_preferences.get("risk_tolerance", "medium"),
                "inspection_requirements": user_preferences.get("inspection_requirements", [])
            }
        }
        
        result = await self.inspection_agent.execute(input_data)
        return result.dict()
    
    async def _run_negotiator_agent(self, listing_data: Dict[str, Any], user_preferences: Dict[str, Any]) -> Dict[str, Any]:
        """Run the Negotiator Agent to develop communication strategy."""
        input_data = {
            "listing_data": listing_data,
            "user_preferences": {
                "negotiation_style": user_preferences.get("negotiation_style", "moderate"),
                "max_offer": user_preferences.get("max_offer"),
                "communication_preferences": user_preferences.get("communication_preferences", {})
            }
        }
        
        result = await self.negotiator_agent.execute(input_data)
        return result.dict()
    
    async def _run_orchestrator_agent(self, listing_data: Dict[str, Any], user_preferences: Dict[str, Any], agent_outputs: Dict[str, Any]) -> Dict[str, Any]:
        """Run the Orchestrator Agent to make final recommendation."""
        input_data = {
            "agent_outputs": agent_outputs,
            "listing_data": listing_data,
            "user_preferences": user_preferences
        }
        
        result = await self.orchestrator_agent.execute(input_data)
        return result.dict()
    
    async def _run_learning_agent(self, listing_data: Dict[str, Any], orchestrator_result: Dict[str, Any]) -> None:
        """Run the Learning Agent to track for optimization."""
        try:
            input_data = {
                "type": "track_outcome",
                "deal_id": listing_data.get("id"),
                "original_prediction": orchestrator_result["data"]["comprehensive_analysis"],
                "agent_outputs": orchestrator_result["data"]["agent_outputs"]
            }
            
            await self.learning_agent.execute(input_data)
        except Exception as e:
            logger.warning(f"Learning agent failed: {str(e)}")
    
    def _get_seasonal_factors(self) -> Dict[str, Any]:
        """Get current seasonal factors that might affect car prices."""
        current_month = datetime.now().month
        
        # Simple seasonal adjustments
        if current_month in [12, 1, 2]:  # Winter
            return {"season": "winter", "demand_factor": 0.9}
        elif current_month in [3, 4, 5]:  # Spring
            return {"season": "spring", "demand_factor": 1.0}
        elif current_month in [6, 7, 8]:  # Summer
            return {"season": "summer", "demand_factor": 1.1}
        else:  # Fall
            return {"season": "fall", "demand_factor": 1.05}
    
    def _create_error_response(self, error_type: str, error_message: str) -> Dict[str, Any]:
        """Create a standardized error response."""
        return {
            "success": False,
            "error_type": error_type,
            "error_message": error_message,
            "timestamp": datetime.now().isoformat()
        }
    
    async def get_agent_status(self) -> Dict[str, Any]:
        """Get status of all agents."""
        status = {}
        
        for agent_name, agent in self.agents.items():
            try:
                status[agent_name] = agent.get_status()
            except Exception as e:
                status[agent_name] = {
                    "name": agent_name,
                    "status": "error",
                    "error": str(e)
                }
        
        return {
            "timestamp": datetime.now().isoformat(),
            "agents": status,
            "total_agents": len(self.agents)
        }
    
    async def optimize_system(self) -> Dict[str, Any]:
        """Trigger system optimization using the Learning Agent."""
        try:
            input_data = {"type": "optimize"}
            result = await self.learning_agent.execute(input_data)
            return result.dict()
        except Exception as e:
            logger.error(f"System optimization failed: {str(e)}")
            return self._create_error_response("Optimization failed", str(e))
    
    async def get_performance_metrics(self) -> Dict[str, Any]:
        """Get system performance metrics from the Learning Agent."""
        try:
            input_data = {"type": "analysis"}
            result = await self.learning_agent.execute(input_data)
            return result.dict()
        except Exception as e:
            logger.error(f"Failed to get performance metrics: {str(e)}")
            return self._create_error_response("Metrics retrieval failed", str(e))
    
    async def process_user_feedback(self, user_id: str, deal_id: str, feedback: Dict[str, Any]) -> Dict[str, Any]:
        """Process user feedback for learning."""
        try:
            input_data = {
                "type": "user_feedback",
                "user_id": user_id,
                "deal_id": deal_id,
                "feedback_type": feedback.get("type"),
                "rating": feedback.get("rating"),
                "comments": feedback.get("comments"),
                "user_preferences": feedback.get("user_preferences", {})
            }
            
            result = await self.learning_agent.execute(input_data)
            return result.dict()
        except Exception as e:
            logger.error(f"Failed to process user feedback: {str(e)}")
            return self._create_error_response("Feedback processing failed", str(e))
    
    async def track_deal_outcome(self, deal_id: str, outcome: Dict[str, Any]) -> Dict[str, Any]:
        """Track the outcome of a deal for learning."""
        try:
            input_data = {
                "type": "track_outcome",
                "deal_id": deal_id,
                "actual_outcome": outcome.get("outcome"),
                "profit_realized": outcome.get("profit_realized", 0),
                "time_to_close": outcome.get("time_to_close"),
                "user_satisfaction": outcome.get("user_satisfaction")
            }
            
            result = await self.learning_agent.execute(input_data)
            return result.dict()
        except Exception as e:
            logger.error(f"Failed to track deal outcome: {str(e)}")
            return self._create_error_response("Outcome tracking failed", str(e)) 