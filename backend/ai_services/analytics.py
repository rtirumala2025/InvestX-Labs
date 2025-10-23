import time
from datetime import datetime
from typing import Dict, Optional
from fastapi import Request, HTTPException
import asyncpg
import json
import os
from contextlib import asynccontextmanager

# Database connection pool
pool = None

@asynccontextmanager
async def get_db_connection():
    """Context manager for database connections"""
    conn = await asyncpg.connect(
        host=os.getenv("DB_HOST", "localhost"),
        database=os.getenv("DB_NAME", "investiq"),
        user=os.getenv("DB_USER", "postgres"),
        password=os.getenv("DB_PASSWORD", "")
    )
    try:
        yield conn
    finally:
        await conn.close()

async def init_db():
    """Initialize database tables if they don't exist"""
    async with get_db_connection() as conn:
        await conn.execute('''
        CREATE TABLE IF NOT EXISTS chat_logs (
            id SERIAL PRIMARY KEY,
            user_id TEXT NOT NULL,
            session_id TEXT NOT NULL,
            timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            intent TEXT,
            query_text TEXT,
            response_time_ms INTEGER,
            error_state BOOLEAN DEFAULT FALSE,
            metadata JSONB
        )
        ''')

class AnalyticsLogger:
    def __init__(self, request: Request = None):
        self.request = request
        self.start_time = time.time()
        
    async def log_interaction(
        self,
        user_id: str,
        session_id: str,
        intent: str,
        query_text: str,
        error: Optional[Exception] = None,
        metadata: Optional[Dict] = None
    ) -> None:
        """Log a user interaction to the database"""
        end_time = time.time()
        response_time_ms = int((end_time - self.start_time) * 1000)
        
        log_data = {
            "user_id": user_id,
            "session_id": session_id,
            "intent": intent,
            "query_text": query_text[:1000],  # Truncate long queries
            "response_time_ms": response_time_ms,
            "error_state": error is not None,
            "metadata": metadata or {}
        }
        
        if self.request:
            log_data.update({
                "ip": self.request.client.host,
                "user_agent": self.request.headers.get("user-agent")
            })
        
        try:
            async with get_db_connection() as conn:
                await conn.execute('''
                INSERT INTO chat_logs 
                (user_id, session_id, timestamp, intent, query_text, response_time_ms, error_state, metadata)
                VALUES ($1, $2, NOW(), $3, $4, $5, $6, $7)
                ''',
                user_id, session_id, intent, query_text, response_time_ms, 
                error is not None, json.dumps(metadata or {})
                )
        except Exception as e:
            print(f"Failed to log analytics: {e}")
            # Consider falling back to a file-based logger or similar

    @classmethod
    async def get_metrics(cls, user_id: str = None, time_period: str = "7d"):
        """Retrieve analytics metrics"""
        time_filter = {
            "24h": "timestamp > NOW() - INTERVAL '24 hours'",
            "7d": "timestamp > NOW() - INTERVAL '7 days'",
            "30d": "timestamp > NOW() - INTERVAL '30 days'"
        }.get(time_period, "timestamp > NOW() - INTERVAL '7 days'")
        
        query = f"""
        SELECT 
            COUNT(*) as total_queries,
            AVG(response_time_ms) as avg_response_time,
            intent,
            COUNT(*) FILTER (WHERE error_state) as error_count
        FROM chat_logs
        WHERE {time_filter} {'AND user_id = $1' if user_id else ''}
        GROUP BY intent
        ORDER BY total_queries DESC
        """
        
        params = [user_id] if user_id else []
        
        try:
            async with get_db_connection() as conn:
                results = await conn.fetch(query, *params)
                return [dict(row) for row in results]
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to fetch metrics: {e}")
