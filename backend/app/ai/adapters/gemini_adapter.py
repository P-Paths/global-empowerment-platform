"""
Gemini / NanoBanana Adapter
Handles all creative, identity, and persona features
"""
import os
import google.generativeai as genai
from typing import Dict, Any, Optional, List
import logging

from .base_adapter import AIAdapter

logger = logging.getLogger(__name__)


class GeminiAdapter(AIAdapter):
    """
    Adapter for Google Gemini / NanoBanana.
    Used for creative, identity, and persona features.
    """
    
    def _initialize(self):
        """Initialize Gemini client"""
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY not found in environment variables")
        
        genai.configure(api_key=api_key)
        
        # Get model from config or use default
        model_name = self.config.get("model", "gemini-1.5-pro")
        self.model = genai.GenerativeModel(model_name)
        
        self.logger.info(f"Gemini adapter initialized with model: {model_name}")
    
    async def generate(self, prompt: str, **kwargs) -> str:
        """
        Generate text response using Gemini.
        
        Args:
            prompt: Input prompt
            **kwargs: Additional parameters
                - temperature: 0.0-1.0 (default: 0.8 for creativity)
                - max_tokens: Maximum tokens (default: 4000)
                - system_prompt: System instructions
        
        Returns:
            Generated text response
        """
        try:
            # Get parameters
            temperature = kwargs.get("temperature", 0.8)  # Creative default
            max_output_tokens = kwargs.get("max_tokens", 4000)
            system_prompt = kwargs.get("system_prompt", "")
            
            # Build full prompt with system instructions
            full_prompt = prompt
            if system_prompt:
                full_prompt = f"{system_prompt}\n\n{prompt}"
            
            # Generate
            generation_config = {
                "temperature": temperature,
                "max_output_tokens": max_output_tokens,
            }
            
            response = self.model.generate_content(
                full_prompt,
                generation_config=generation_config
            )
            
            result = response.text
            
            # Validate
            if not self.validate_output(result, max_length=kwargs.get("max_length")):
                raise ValueError("Generated output failed validation")
            
            return result
            
        except Exception as e:
            self.logger.error(f"Gemini generation error: {e}")
            raise
    
    async def generate_with_context(self, prompt: str, context: Dict[str, Any], **kwargs) -> str:
        """
        Generate response with user context (for persona/identity features).
        
        Args:
            prompt: Input prompt
            context: User context (posts, bio, products, persona, etc.)
            **kwargs: Additional parameters
        
        Returns:
            Generated text response
        """
        # Build context-aware prompt
        context_str = self._build_context_string(context)
        full_prompt = f"{context_str}\n\n{prompt}"
        
        return await self.generate(full_prompt, **kwargs)
    
    async def generate_multimodal(self, prompt: str, image_data: Optional[bytes] = None, **kwargs) -> str:
        """
        Generate response with image input (multimodal).
        
        Args:
            prompt: Text prompt
            image_data: Image bytes (optional)
            **kwargs: Additional parameters
        
        Returns:
            Generated text response
        """
        try:
            if not image_data:
                # Fall back to text-only
                return await self.generate(prompt, **kwargs)
            
            # Multimodal generation
            # Note: This is a placeholder - actual implementation depends on Gemini API
            # You may need to use different methods for image input
            
            # For now, return text-only
            return await self.generate(prompt, **kwargs)
            
        except Exception as e:
            self.logger.error(f"Gemini multimodal generation error: {e}")
            raise
    
    def _build_context_string(self, context: Dict[str, Any]) -> str:
        """
        Build context string from user data.
        
        Args:
            context: User context dictionary
        
        Returns:
            Formatted context string
        """
        parts = []
        
        if context.get("persona"):
            parts.append(f"Persona: {context['persona']}")
        
        if context.get("bio"):
            parts.append(f"Bio: {context['bio']}")
        
        if context.get("business_name"):
            parts.append(f"Business: {context['business_name']}")
        
        if context.get("posts"):
            parts.append(f"Recent posts: {', '.join(context['posts'][:3])}")
        
        if context.get("products"):
            parts.append(f"Products: {', '.join([p.get('name', '') for p in context['products'][:3]])}")
        
        return "\n".join(parts)
    
    async def create_persona(self, user_content: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create persona clone from user content.
        
        Args:
            user_content: User's posts, bio, products, etc.
        
        Returns:
            Persona profile dictionary
        """
        prompt = f"""
        Analyze this user's content and create a persona profile:
        
        Posts: {user_content.get('posts', [])}
        Bio: {user_content.get('bio', '')}
        Business: {user_content.get('business_name', '')}
        
        Create a persona profile with:
        1. Voice and tone
        2. Writing style
        3. Key themes
        4. Brand personality
        
        Return as structured JSON.
        """
        
        response = await self.generate(prompt, temperature=0.7)
        # Parse response and return structured persona
        # This is simplified - actual implementation would parse JSON
        
        return {
            "voice": "extracted from response",
            "tone": "extracted from response",
            "style": "extracted from response",
            "themes": "extracted from response"
        }
    
    async def generate_in_voice(self, content_type: str, persona: Dict[str, Any], **kwargs) -> str:
        """
        Generate content in user's persona voice.
        
        Args:
            content_type: Type of content (caption, bio, post, etc.)
            persona: Persona profile
            **kwargs: Additional parameters
        
        Returns:
            Generated content in persona voice
        """
        prompt = f"""
        Generate a {content_type} in this persona's voice:
        
        Voice: {persona.get('voice', '')}
        Tone: {persona.get('tone', '')}
        Style: {persona.get('style', '')}
        
        Create engaging {content_type} that matches this persona perfectly.
        """
        
        return await self.generate(prompt, temperature=0.8, **kwargs)

