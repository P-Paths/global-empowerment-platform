from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, List
import openai
import google.generativeai as genai
from enum import Enum
import logging
import asyncio
from dataclasses import dataclass

logger = logging.getLogger(__name__)

class BrainType(Enum):
    """Enum for different AI brain types"""
    LEFT = "openai"      # OpenAI GPT-4 - Analytical, structured
    RIGHT = "google"     # Google Gemini - Creative, contextual

@dataclass
class AIResponse:
    """Standardized response from any AI brain"""
    content: str
    brain_type: BrainType
    model_used: str
    tokens_used: Optional[int] = None
    cost: Optional[float] = None
    confidence: Optional[float] = None

class BaseAIBrain(ABC):
    """Abstract base class for AI brains"""
    
    @abstractmethod
    async def generate_response(self, prompt: str, context: Optional[Dict] = None) -> AIResponse:
        """Generate a response from this AI brain"""
        pass
    
    @abstractmethod
    def is_available(self) -> bool:
        """Check if this brain is available/configured"""
        pass

class LeftBrain(BaseAIBrain):
    """
    OpenAI GPT-4 Brain - Left Brain (Analytical, Structured)
    
    Best for:
    - Detailed analysis
    - Structured responses
    - Complex reasoning
    - Technical explanations
    - Data processing
    """
    
    def __init__(self, api_key: str, model: str = "gpt-4"):
        self.api_key = api_key
        self.model = model
        self.client = openai.AsyncOpenAI(api_key=api_key)
        
    def is_available(self) -> bool:
        return bool(self.api_key and self.api_key != "your-openai-api-key")
    
    async def generate_response(self, prompt: str, context: Optional[Dict] = None) -> AIResponse:
        try:
            # Build system message with context
            system_message = self._build_system_message(context)
            
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_message},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=500
            )
            
            return AIResponse(
                content=response.choices[0].message.content,
                brain_type=BrainType.LEFT,
                model_used=self.model,
                tokens_used=response.usage.total_tokens,
                cost=self._calculate_cost(response.usage),
                confidence=0.9  # GPT-4 is generally very confident
            )
            
        except Exception as e:
            logger.error(f"Left brain error: {e}")
            raise
    
    def _build_system_message(self, context: Optional[Dict] = None) -> str:
        """Build system message with context for structured responses"""
        base_message = """You are Accorria's analytical left brain. You excel at:
- Structured, logical responses
- Detailed analysis and reasoning
- Technical explanations
- Data processing and insights
- Professional, business-focused communication

Always provide clear, actionable responses with specific details."""
        
        if context:
            context_str = "\n".join([f"{k}: {v}" for k, v in context.items()])
            base_message += f"\n\nContext:\n{context_str}"
        
        return base_message
    
    def _calculate_cost(self, usage) -> float:
        """Calculate cost based on token usage"""
        # GPT-4 pricing (approximate)
        input_cost_per_1k = 0.03
        output_cost_per_1k = 0.06
        
        input_cost = (usage.prompt_tokens / 1000) * input_cost_per_1k
        output_cost = (usage.completion_tokens / 1000) * output_cost_per_1k
        
        return input_cost + output_cost

class RightBrain(BaseAIBrain):
    """
    Google Gemini Brain - Right Brain (Creative, Contextual)
    
    Best for:
    - Creative responses
    - Contextual understanding
    - Natural conversation
    - Emotional intelligence
    - Visual understanding (when needed)
    """
    
    def __init__(self, api_key: str, model: str = "gemini-pro"):
        self.api_key = api_key
        self.model = model
        genai.configure(api_key=api_key)
        self.model_instance = genai.GenerativeModel(model)
        
    def is_available(self) -> bool:
        return bool(self.api_key and self.api_key != "your-google-api-key")
    
    async def generate_response(self, prompt: str, context: Optional[Dict] = None) -> AIResponse:
        try:
            # Build context-aware prompt
            full_prompt = self._build_contextual_prompt(prompt, context)
            
            response = await asyncio.to_thread(
                self.model_instance.generate_content,
                full_prompt
            )
            
            return AIResponse(
                content=response.text,
                brain_type=BrainType.RIGHT,
                model_used=self.model,
                confidence=0.85,  # Gemini is good but slightly less confident than GPT-4
                cost=self._estimate_cost(full_prompt, response.text)
            )
            
        except Exception as e:
            logger.error(f"Right brain error: {e}")
            raise
    
    def _build_contextual_prompt(self, prompt: str, context: Optional[Dict] = None) -> str:
        """Build contextual prompt for creative responses"""
        base_prompt = """You are Accorria's creative right brain. You excel at:
- Natural, conversational responses
- Emotional intelligence and empathy
- Creative problem-solving
- Contextual understanding
- Building rapport with customers

Respond in a friendly, helpful manner that feels human and engaging."""
        
        if context:
            context_str = "\n".join([f"{k}: {v}" for k, v in context.items()])
            base_prompt += f"\n\nContext:\n{context_str}"
        
        base_prompt += f"\n\nUser request: {prompt}"
        return base_prompt
    
    def _estimate_cost(self, input_text: str, output_text: str) -> float:
        """Estimate cost for Gemini (approximate)"""
        # Gemini pricing (approximate)
        cost_per_1k_chars = 0.00025
        
        total_chars = len(input_text) + len(output_text)
        return (total_chars / 1000) * cost_per_1k_chars

class AIBrainOrchestrator:
    """
    Orchestrates between left and right brains
    
    Makes intelligent decisions about which brain to use for each task
    Provides fallback capabilities and cost optimization
    """
    
    def __init__(self, openai_key: str, google_key: str):
        self.left_brain = LeftBrain(openai_key)
        self.right_brain = RightBrain(google_key)
        
    async def think(self, prompt: str, task_type: str = "general", context: Optional[Dict] = None) -> AIResponse:
        """
        Main method to get AI response using the best brain for the task
        
        Args:
            prompt: The user's request
            task_type: Type of task ("analytical", "creative", "conversation", "general")
            context: Additional context for the AI
        """
        
        # Determine which brain to use based on task type
        brain_choice = self._choose_brain(task_type)
        
        # Try primary brain first
        try:
            if brain_choice == BrainType.LEFT and self.left_brain.is_available():
                return await self.left_brain.generate_response(prompt, context)
            elif brain_choice == BrainType.RIGHT and self.right_brain.is_available():
                return await self.right_brain.generate_response(prompt, context)
        except Exception as e:
            logger.warning(f"Primary brain failed: {e}")
        
        # Fallback to other brain
        try:
            if brain_choice == BrainType.LEFT and self.right_brain.is_available():
                logger.info("Falling back to right brain")
                return await self.right_brain.generate_response(prompt, context)
            elif brain_choice == BrainType.RIGHT and self.left_brain.is_available():
                logger.info("Falling back to left brain")
                return await self.left_brain.generate_response(prompt, context)
        except Exception as e:
            logger.error(f"Both brains failed: {e}")
            raise
        
        # If neither brain is available
        raise Exception("No AI brains are available")
    
    def _choose_brain(self, task_type: str) -> BrainType:
        """Choose the best brain for the given task type"""
        task_type = task_type.lower()
        
        # Left brain tasks (analytical, structured)
        left_brain_tasks = [
            "analytical", "analysis", "structured", "technical", 
            "data", "reasoning", "business", "professional",
            "pricing", "valuation", "market_analysis"
        ]
        
        # Right brain tasks (creative, conversational)
        right_brain_tasks = [
            "creative", "conversation", "chat", "friendly",
            "emotional", "empathy", "rapport", "casual",
            "negotiation", "customer_service", "marketing"
        ]
        
        if any(task in task_type for task in left_brain_tasks):
            return BrainType.LEFT
        elif any(task in task_type for task in right_brain_tasks):
            return BrainType.RIGHT
        else:
            # Default to left brain for general tasks
            return BrainType.LEFT
    
    async def dual_think(self, prompt: str, context: Optional[Dict] = None) -> Dict[str, AIResponse]:
        """
        Get responses from both brains for comparison or important decisions
        """
        responses = {}
        
        if self.left_brain.is_available():
            try:
                responses["left_brain"] = await self.left_brain.generate_response(prompt, context)
            except Exception as e:
                logger.error(f"Left brain failed in dual think: {e}")
        
        if self.right_brain.is_available():
            try:
                responses["right_brain"] = await self.right_brain.generate_response(prompt, context)
            except Exception as e:
                logger.error(f"Right brain failed in dual think: {e}")
        
        return responses
    
    def get_brain_status(self) -> Dict[str, bool]:
        """Get availability status of both brains"""
        return {
            "left_brain_available": self.left_brain.is_available(),
            "right_brain_available": self.right_brain.is_available()
        }

def create_ai_brain(openai_key: str, google_key: str) -> AIBrainOrchestrator:
    """Factory function to create AI brain orchestrator"""
    return AIBrainOrchestrator(openai_key, google_key) 