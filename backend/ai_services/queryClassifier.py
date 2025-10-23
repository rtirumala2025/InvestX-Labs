import os
import json
import openai
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional

app = FastAPI()

# Configuration
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
openai.api_key = OPENAI_API_KEY

class QueryInput(BaseModel):
    text: str
    user_id: str
    context: Optional[Dict] = None

INTENT_LABELS = [
    "education",
    "portfolio",
    "calculation", 
    "general",
    "advice_request"
]

@app.post("/classify")
async def classify_query(query: QueryInput):
    """
    Classify user query using OpenAI's API
    Returns: {
        "intent": str,
        "confidence": float,
        "entities": Dict
    }
    """
    try:
        response = await openai.ChatCompletion.acreate(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": f"""
                You are an intent classifier for a financial education chatbot.
                Classify the user's query into one of these categories: {', '.join(INTENT_LABELS)}
                
                For each query, respond with a JSON object containing:
                - intent: The most relevant label
                - confidence: 0-1 confidence score
                - entities: Any financial terms or numbers mentioned
                """},
                {"role": "user", "content": query.text}
            ],
            temperature=0.3,
            max_tokens=60
        )
        
        result = json.loads(response.choices[0].message.content)
        return {
            "intent": result.get("intent", "general"),
            "confidence": result.get("confidence", 0.8),
            "entities": result.get("entities", {})
        }
        
    except Exception as e:
        # Fallback to rule-based classification
        return await fallback_classification(query.text)

async def fallback_classification(text: str) -> Dict:
    """Fallback classification using simple rules"""
    text = text.lower()
    
    # Simple rule-based classification
    if any(term in text for term in ["how to", "what is", "explain"]):
        return {"intent": "education", "confidence": 0.7, "entities": {}}
    elif any(term in text for term in ["portfolio", "invest", "stock", "crypto"]):
        return {"intent": "portfolio", "confidence": 0.7, "entities": {}}
    elif any(term in text for term in ["calculate", "how much", "what's", "="]):
        return {"intent": "calculation", "confidence": 0.8, "entities": {}}
    elif any(term in text for term in ["should i", "recommend", "is it good"]):
        return {"intent": "advice_request", "confidence": 0.9, "entities": {}}
    
    return {"intent": "general", "confidence": 0.6, "entities": {}}
