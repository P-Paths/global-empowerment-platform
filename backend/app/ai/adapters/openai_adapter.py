"""
OpenAI Adapter
Handles all coaching, guidance, and dialogue features
"""
import os
from openai import OpenAI
from typing import Dict, Any, Optional
import logging

from .base_adapter import AIAdapter

logger = logging.getLogger(__name__)


class OpenAIAdapter(AIAdapter):
    """
    Adapter for OpenAI (ChatGPT-style models).
    Used for coaching, guidance, and dialogue features.
    """
    
    def _initialize(self):
        """Initialize OpenAI client"""
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OPENAI_API_KEY not found in environment variables")
        
        self.client = OpenAI(api_key=api_key)
        
        # Get model from config or use default
        self.model = self.config.get("model", "gpt-4o")
        
        self.logger.info(f"OpenAI adapter initialized with model: {self.model}")
    
    async def generate(self, prompt: str, **kwargs) -> str:
        """
        Generate text response using OpenAI.
        
        Args:
            prompt: Input prompt
            **kwargs: Additional parameters
                - temperature: 0.0-1.0 (default: 0.4 for clarity)
                - max_tokens: Maximum tokens (default: 2000)
                - system_prompt: System instructions
        
        Returns:
            Generated text response
        """
        try:
            # Get parameters
            temperature = kwargs.get("temperature", 0.4)  # Clarity default
            max_tokens = kwargs.get("max_tokens", 2000)
            system_prompt = kwargs.get("system_prompt", "")
            
            # Build messages
            messages = []
            if system_prompt:
                messages.append({"role": "system", "content": system_prompt})
            messages.append({"role": "user", "content": prompt})
            
            # Generate
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens
            )
            
            result = response.choices[0].message.content
            
            # Validate
            if not self.validate_output(result, max_length=kwargs.get("max_length")):
                raise ValueError("Generated output failed validation")
            
            return result
            
        except Exception as e:
            self.logger.error(f"OpenAI generation error: {e}")
            raise
    
    async def generate_with_context(self, prompt: str, context: Dict[str, Any], **kwargs) -> str:
        """
        Generate response with user context (for personalized coaching).
        
        Args:
            prompt: Input prompt
            context: User context (score, tasks, profile, etc.)
            **kwargs: Additional parameters
        
        Returns:
            Generated text response
        """
        # Build context-aware prompt
        context_str = self._build_context_string(context)
        full_prompt = f"{context_str}\n\n{prompt}"
        
        return await self.generate(full_prompt, **kwargs)
    
    async def coach(self, question: str, user_context: Dict[str, Any], **kwargs) -> str:
        """
        Provide coaching response.
        
        Args:
            question: User's question
            user_context: User's current state (score, tasks, etc.)
            **kwargs: Additional parameters
        
        Returns:
            Coaching response
        """
        system_prompt = """
        You are GEP's AI Growth Coach. Your role is to provide clear, actionable guidance.
        
        Be:
        - Clear and specific
        - Actionable and step-by-step
        - Encouraging but realistic
        - Focused on helping users improve
        
        Provide concrete steps, not vague advice.
        """
        
        context_str = self._build_context_string(user_context)
        prompt = f"""
        User context:
        {context_str}
        
        Question: {question}
        
        Provide clear, actionable coaching guidance.
        """
        
        return await self.generate(prompt, system_prompt=system_prompt, temperature=0.3, **kwargs)
    
    async def explain_score(self, score: int, breakdown: Dict[str, Any], **kwargs) -> str:
        """
        Explain funding readiness score.
        
        Args:
            score: Current score (0-100)
            breakdown: Score component breakdown
            **kwargs: Additional parameters
        
        Returns:
            Clear explanation of score
        """
        system_prompt = """
        You are explaining a funding readiness score. Be clear, helpful, and actionable.
        """
        
        prompt = f"""
        Funding Readiness Score: {score}/100
        
        Breakdown:
        {self._format_breakdown(breakdown)}
        
        Explain:
        1. What this score means
        2. What's working well
        3. What needs improvement
        4. Specific steps to improve
        
        Be clear and encouraging.
        """
        
        return await self.generate(prompt, system_prompt=system_prompt, temperature=0.3, **kwargs)
    
    async def generate_task_description(self, task_type: str, task_data: Dict[str, Any], **kwargs) -> str:
        """
        Generate engaging task description.
        
        Args:
            task_type: Type of task (post_content, update_bio, etc.)
            task_data: Task-specific data
            **kwargs: Additional parameters
        
        Returns:
            Engaging task description
        """
        system_prompt = """
        You are writing task descriptions for GEP's AI Growth Coach.
        Make them clear, motivating, and actionable.
        """
        
        prompt = f"""
        Task type: {task_type}
        Task data: {task_data}
        
        Write an engaging task description that:
        1. Clearly explains what to do
        2. Explains why it matters
        3. Provides motivation
        4. Is actionable
        
        Keep it concise but helpful.
        """
        
        return await self.generate(prompt, system_prompt=system_prompt, temperature=0.4, **kwargs)
    
    def _build_context_string(self, context: Dict[str, Any]) -> str:
        """Build context string from user data"""
        parts = []
        
        if context.get("funding_score") is not None:
            parts.append(f"Funding Score: {context['funding_score']}/100")
        
        if context.get("funding_status"):
            parts.append(f"Status: {context['funding_status']}")
        
        if context.get("business_name"):
            parts.append(f"Business: {context['business_name']}")
        
        if context.get("tasks_completed"):
            parts.append(f"Tasks Completed: {context['tasks_completed']}")
        
        return "\n".join(parts)
    
    def _format_breakdown(self, breakdown: Dict[str, Any]) -> str:
        """Format score breakdown for prompt"""
        parts = []
        for component, value in breakdown.items():
            parts.append(f"- {component}: {value}")
        return "\n".join(parts)

