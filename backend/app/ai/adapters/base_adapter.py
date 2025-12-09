"""
Base AI Adapter Interface
All AI adapters inherit from this base class
"""
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, List
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class AIAdapter(ABC):
    """
    Base class for all AI adapters.
    Provides common interface and error handling.
    """
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """
        Initialize adapter with configuration.
        
        Args:
            config: Adapter-specific configuration
        """
        self.config = config or {}
        self.logger = logging.getLogger(f"ai.adapter.{self.__class__.__name__}")
        self._initialize()
    
    @abstractmethod
    def _initialize(self):
        """Initialize the adapter (set up API clients, etc.)"""
        pass
    
    @abstractmethod
    async def generate(self, prompt: str, **kwargs) -> str:
        """
        Generate text response from prompt.
        
        Args:
            prompt: Input prompt
            **kwargs: Additional parameters (temperature, max_tokens, etc.)
            
        Returns:
            Generated text response
        """
        pass
    
    @abstractmethod
    async def generate_with_context(self, prompt: str, context: Dict[str, Any], **kwargs) -> str:
        """
        Generate response with additional context.
        
        Args:
            prompt: Input prompt
            context: Additional context (user data, history, etc.)
            **kwargs: Additional parameters
            
        Returns:
            Generated text response
        """
        pass
    
    def validate_output(self, output: str, max_length: Optional[int] = None) -> bool:
        """
        Validate adapter output.
        
        Args:
            output: Generated output
            max_length: Maximum allowed length
            
        Returns:
            True if valid, False otherwise
        """
        if not output or not isinstance(output, str):
            return False
        
        if max_length and len(output) > max_length:
            return False
        
        # Add more validation as needed
        return True
    
    def get_status(self) -> Dict[str, Any]:
        """
        Get adapter status and health.
        
        Returns:
            Status information
        """
        return {
            "adapter_type": self.__class__.__name__,
            "status": "active",
            "config": self.config
        }

