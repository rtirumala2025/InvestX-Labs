from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
from datetime import datetime

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    message: str
    user_id: str
    session_id: str = "default-session"

class ChatResponse(BaseModel):
    success: bool
    response: str
    session_id: str
    conversation_id: str = "test-conversation"
    metadata: dict = {}
    recommendations: list = []

@app.post("/api/chat")
async def chat(chat_request: ChatRequest):
    """Simple chat endpoint that responds to messages"""
    user_message = chat_request.message.lower()
    
    # Simple response logic
    if "hello" in user_message or "hi" in user_message or "hey" in user_message:
        response_text = "Hello! I'm the InvestX Labs assistant. How can I help you with your investments today?"
    elif "help" in user_message:
        response_text = "I can help you learn about investing, explain financial terms, and provide investment suggestions. What would you like to know?"
    elif "stock" in user_message or "invest" in user_message:
        response_text = "Investing in stocks can be a great way to grow your wealth over time. It's important to research companies, understand market trends, and consider a diversified portfolio."
    else:
        response_text = f"I received your message: '{chat_request.message}'. I'm a test server, so my responses are limited. In a full implementation, I would provide more detailed investment advice."
    
    return {
        "success": True,
        "response": response_text,
        "session_id": chat_request.session_id,
        "conversation_id": "test-conversation",
        "metadata": {
            "timestamp": datetime.utcnow().isoformat(),
            "model": "test-model"
        },
        "recommendations": []
    }

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok", "timestamp": datetime.utcnow().isoformat()}

if __name__ == "__main__":
    uvicorn.run("test_server:app", host="0.0.0.0", port=5001, reload=True)
