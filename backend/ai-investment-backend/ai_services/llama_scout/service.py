"""
LLaMA 4 Scout AI Service
Handles all interactions with the LLaMA 4 Scout model via OpenRouter API
"""
import os
import json
import logging
from typing import Dict, List, Optional, Any
import aiohttp
from datetime import datetime, timedelta
from functools import lru_cache

logger = logging.getLogger(__name__)

class LlamaScoutService:
    """Service for interacting with LLaMA 4 Scout AI via OpenRouter"""
    
    def __init__(self):
        self.base_url = os.getenv("OPENROUTER_API_URL", "https://openrouter.ai/api/v1/chat/completions")
        self.api_key = os.getenv("OPENROUTER_API_KEY")
        if not self.api_key:
            logger.warning("OPENROUTER_API_KEY not found in environment variables")
        
        self.model = "meta-llama/llama-3.2-90b-vision-instruct"
        self.cache = {}
        self.cache_ttl = 300  # 5 minutes cache
    
    async def _make_request(self, messages: List[Dict[str, str]], **kwargs) -> Dict[str, Any]:
        """Make a request to the OpenRouter API"""
        if not self.api_key:
            raise ValueError("OpenRouter API key is not configured")
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://investxlabs.com",
            "X-Title": "InvestX Labs"
        }
        
        payload = {
            "model": self.model,
            "messages": messages,
            **kwargs
        }
        
        cache_key = self._generate_cache_key(messages, **kwargs)
        if cache_key in self.cache:
            if datetime.now() - self.cache[cache_key]["timestamp"] < timedelta(seconds=self.cache_ttl):
                return self.cache[cache_key]["response"]
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    self.base_url,
                    headers=headers,
                    json=payload,
                    timeout=30
                ) as response:
                    response.raise_for_status()
                    data = await response.json()
                    
                    # Cache the response
                    self.cache[cache_key] = {
                        "response": data,
                        "timestamp": datetime.now()
                    }
                    
                    return data
                    
        except aiohttp.ClientError as e:
            logger.error(f"Error making request to OpenRouter API: {str(e)}")
            raise
    
    def _generate_cache_key(self, messages: List[Dict[str, str]], **kwargs) -> str:
        """Generate a cache key for the request"""
        key_parts = [
            json.dumps(messages, sort_keys=True),
            json.dumps(kwargs, sort_keys=True)
        ]
        return hash(tuple(key_parts))
    
    async def generate_response(
        self, 
        user_message: str, 
        portfolio_data: Optional[Dict] = None,
        conversation_history: Optional[List[Dict]] = None
    ) -> Dict[str, Any]:
        """Generate a response from LLaMA 4 Scout"""
        messages = self._build_messages(user_message, portfolio_data, conversation_history)
        
        try:
            response = await self._make_request(
                messages=messages,
                temperature=0.7,
                max_tokens=1000,
                top_p=0.9,
                frequency_penalty=0.5,
                presence_penalty=0.5,
            )
            
            return {
                "success": True,
                "response": response["choices"][0]["message"]["content"],
                "model": response["model"],
                "usage": response.get("usage", {})
            }
            
        except Exception as e:
            logger.error(f"Error generating response: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "response": "I'm having trouble connecting to the AI service. Please try again later."
            }
    
    def _build_messages(
        self, 
        user_message: str, 
        portfolio_data: Optional[Dict] = None,
        conversation_history: Optional[List[Dict]] = None
    ) -> List[Dict[str, str]]:
        """Build the messages array for the API request"""
        system_prompt = self._generate_system_prompt(portfolio_data)
        
        messages = [{"role": "system", "content": system_prompt}]
        
        # Add conversation history if available
        if conversation_history:
            for msg in conversation_history[-6:]:  # Limit history to last 6 messages
                role = "user" if msg.get("type") == "user" else "assistant"
                messages.append({"role": role, "content": msg.get("content", "")})
        
        # Add the current user message
        messages.append({"role": "user", "content": user_message})
        
        return messages
    
    def _generate_system_prompt(self, portfolio_data: Optional[Dict] = None) -> str:
        """Generate the system prompt based on portfolio data"""
        base_prompt = """You are Finley, an AI investment assistant for InvestX Labs. 
        Provide clear, educational, and helpful investment advice. 
        Be concise but thorough in your explanations.
        """
        
        if not portfolio_data:
            return base_prompt
            
        # Add portfolio context to the prompt
        portfolio_prompt = f"""
        User Portfolio Summary:
        - Total Value: ${portfolio_data.get('totalValue', 0):,.2f}
        - Holdings: {len(portfolio_data.get('holdings', []))} assets
        - Risk Level: {portfolio_data.get('riskProfile', 'Not specified')}
        - Investment Goal: {portfolio_data.get('investmentGoal', 'Not specified')}
        """
        
        return base_prompt + portfolio_prompt

# Singleton instance
llama_scout_service = LlamaScoutService()
