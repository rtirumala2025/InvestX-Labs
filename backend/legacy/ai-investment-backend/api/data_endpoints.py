"""
Data API endpoints for educational content and market data
"""
import logging
from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime

from database.firestore_client import firestore_client
from database.vector_store import vector_store
from ai_models.recommendation_engine import recommendation_engine
from ai_models.rag_system.vector_search import vector_search
from utils.validation import validate_user_id

logger = logging.getLogger(__name__)

# Create router
data_router = APIRouter()


# Pydantic models
class ContentRequest(BaseModel):
    category: Optional[str] = Field(None, description="Content category filter")
    difficulty: Optional[str] = Field(None, description="Difficulty level filter")
    limit: int = Field(10, ge=1, le=50, description="Number of items to return")


class SearchRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=200, description="Search query")
    category: Optional[str] = Field(None, description="Category filter")
    difficulty: Optional[str] = Field(None, description="Difficulty filter")
    limit: int = Field(10, ge=1, le=20, description="Number of results")


class MarketDataRequest(BaseModel):
    symbols: List[str] = Field(..., min_items=1, max_items=20, description="Stock symbols")


# Dependency for user validation
async def get_current_user(user_id: str) -> str:
    """Validate and return user ID"""
    if not validate_user_id(user_id):
        raise HTTPException(status_code=400, detail="Invalid user ID")
    return user_id


@data_router.get("/educational-content")
async def get_educational_content(
    category: Optional[str] = Query(None, description="Filter by category"),
    difficulty: Optional[str] = Query(None, description="Filter by difficulty level"),
    limit: int = Query(20, ge=1, le=50, description="Number of items to return")
):
    """Get educational content"""
    try:
        logger.info(f"Getting educational content - category: {category}, difficulty: {difficulty}")
        
        content = await firestore_client.get_educational_content(
            category=category,
            difficulty=difficulty,
            limit=limit
        )
        
        return {
            "success": True,
            "content": content,
            "count": len(content),
            "filters": {
                "category": category,
                "difficulty": difficulty,
                "limit": limit
            },
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting educational content: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@data_router.post("/educational-content/search")
async def search_educational_content(
    search_request: SearchRequest,
    user_id: str = Query(..., description="User ID for personalization")
):
    """Search educational content using vector search"""
    try:
        logger.info(f"Searching educational content for user {user_id}: {search_request.query}")
        
        # Get user profile for personalization
        user_profile = await firestore_client.get_user_profile(user_id)
        
        # Perform vector search
        if user_profile:
            results = vector_search.search_by_user_profile(
                user_profile=user_profile,
                query=search_request.query,
                limit=search_request.limit
            )
        else:
            results = vector_search.search_educational_content(
                query=search_request.query,
                filters={
                    "category": search_request.category,
                    "difficulty_level": search_request.difficulty
                } if search_request.category or search_request.difficulty else None,
                limit=search_request.limit
            )
        
        return {
            "success": True,
            "query": search_request.query,
            "results": results,
            "count": len(results),
            "user_profile_used": bool(user_profile),
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error searching educational content: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@data_router.get("/recommendations/{user_id}")
async def get_personalized_recommendations(
    user_id: str,
    limit: int = Query(10, ge=1, le=20, description="Number of recommendations"),
    current_user: str = Depends(get_current_user)
):
    """Get personalized content recommendations for user"""
    try:
        logger.info(f"Getting personalized recommendations for user {user_id}")
        
        recommendations = recommendation_engine.get_personalized_recommendations(
            user_id=user_id,
            limit=limit
        )
        
        return {
            "success": True,
            "user_id": user_id,
            "recommendations": recommendations,
            "count": len(recommendations),
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting personalized recommendations: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@data_router.get("/trending")
async def get_trending_content(
    time_period: str = Query("week", description="Time period for trending content"),
    limit: int = Query(10, ge=1, le=20, description="Number of trending items")
):
    """Get trending educational content"""
    try:
        logger.info(f"Getting trending content for period: {time_period}")
        
        trending_content = recommendation_engine.get_trending_content(
            time_period=time_period,
            limit=limit
        )
        
        return {
            "success": True,
            "trending_content": trending_content,
            "count": len(trending_content),
            "time_period": time_period,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting trending content: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@data_router.get("/market-data/{symbol}")
async def get_market_data(
    symbol: str,
    current_user: str = Depends(get_current_user)
):
    """Get market data for a specific symbol"""
    try:
        logger.info(f"Getting market data for symbol: {symbol}")
        
        from data_pipeline.scrapers.market_data import market_data_scraper
        
        market_data = market_data_scraper.get_stock_data(symbol)
        
        if not market_data:
            raise HTTPException(status_code=404, detail=f"Market data not found for symbol: {symbol}")
        
        return {
            "success": True,
            "symbol": symbol,
            "market_data": market_data,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting market data: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@data_router.post("/market-data/batch")
async def get_batch_market_data(
    market_data_request: MarketDataRequest,
    current_user: str = Depends(get_current_user)
):
    """Get market data for multiple symbols"""
    try:
        logger.info(f"Getting batch market data for {len(market_data_request.symbols)} symbols")
        
        from data_pipeline.scrapers.market_data import market_data_scraper
        
        market_data_list = market_data_scraper.get_all_teen_stocks_data()
        
        # Filter for requested symbols
        requested_data = [
            data for data in market_data_list 
            if data.get("symbol") in market_data_request.symbols
        ]
        
        return {
            "success": True,
            "requested_symbols": market_data_request.symbols,
            "market_data": requested_data,
            "count": len(requested_data),
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting batch market data: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@data_router.get("/market-data/summary")
async def get_market_summary():
    """Get overall market summary"""
    try:
        logger.info("Getting market summary")
        
        from data_pipeline.scrapers.market_data import market_data_scraper
        
        market_summary = market_data_scraper.get_market_summary()
        
        return {
            "success": True,
            "market_summary": market_summary,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting market summary: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@data_router.get("/news/recent")
async def get_recent_news(
    limit: int = Query(20, ge=1, le=50, description="Number of news articles")
):
    """Get recent financial news"""
    try:
        logger.info(f"Getting recent news - limit: {limit}")
        
        news_articles = await firestore_client.get_recent_news(limit=limit)
        
        return {
            "success": True,
            "news_articles": news_articles,
            "count": len(news_articles),
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting recent news: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@data_router.get("/news/stock/{symbol}")
async def get_stock_news(
    symbol: str,
    limit: int = Query(10, ge=1, le=20, description="Number of news articles"),
    current_user: str = Depends(get_current_user)
):
    """Get news articles for a specific stock"""
    try:
        logger.info(f"Getting news for symbol: {symbol}")
        
        from data_pipeline.scrapers.news_scraper import news_scraper
        
        news_articles = news_scraper.get_stock_specific_news(symbol, limit)
        
        return {
            "success": True,
            "symbol": symbol,
            "news_articles": news_articles,
            "count": len(news_articles),
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting stock news: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@data_router.get("/categories")
async def get_content_categories():
    """Get available content categories"""
    try:
        from config.settings import EDUCATIONAL_CATEGORIES
        
        return {
            "success": True,
            "categories": EDUCATIONAL_CATEGORIES,
            "count": len(EDUCATIONAL_CATEGORIES),
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting content categories: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@data_router.get("/difficulty-levels")
async def get_difficulty_levels():
    """Get available difficulty levels"""
    try:
        difficulty_levels = ["beginner", "intermediate", "advanced"]
        
        return {
            "success": True,
            "difficulty_levels": difficulty_levels,
            "count": len(difficulty_levels),
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting difficulty levels: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@data_router.get("/teen-stocks")
async def get_teen_relevant_stocks():
    """Get list of teen-relevant stocks"""
    try:
        from config.settings import TEEN_RELEVANT_STOCKS
        
        return {
            "success": True,
            "teen_stocks": TEEN_RELEVANT_STOCKS,
            "count": len(TEEN_RELEVANT_STOCKS),
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting teen-relevant stocks: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@data_router.get("/content/{content_id}")
async def get_content_by_id(
    content_id: str,
    current_user: str = Depends(get_current_user)
):
    """Get specific content by ID"""
    try:
        logger.info(f"Getting content by ID: {content_id}")
        
        # Get from vector store
        content = vector_store.get_document("educational_content", content_id)
        
        if not content:
            raise HTTPException(status_code=404, detail="Content not found")
        
        return {
            "success": True,
            "content_id": content_id,
            "content": content,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting content by ID: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@data_router.get("/related-content/{content_id}")
async def get_related_content(
    content_id: str,
    limit: int = Query(5, ge=1, le=10, description="Number of related items"),
    current_user: str = Depends(get_current_user)
):
    """Get content related to a specific piece of content"""
    try:
        logger.info(f"Getting related content for ID: {content_id}")
        
        related_content = vector_search.get_related_content(content_id, limit)
        
        return {
            "success": True,
            "content_id": content_id,
            "related_content": related_content,
            "count": len(related_content),
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting related content: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@data_router.get("/search-suggestions")
async def get_search_suggestions(
    query: str = Query(..., min_length=1, description="Partial search query")
):
    """Get search suggestions based on partial query"""
    try:
        logger.info(f"Getting search suggestions for query: {query}")
        
        suggestions = vector_search.get_search_suggestions(query)
        
        return {
            "success": True,
            "query": query,
            "suggestions": suggestions,
            "count": len(suggestions),
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting search suggestions: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@data_router.get("/analytics/{user_id}")
async def get_user_analytics(
    user_id: str,
    days: int = Query(30, ge=1, le=365, description="Number of days to analyze"),
    current_user: str = Depends(get_current_user)
):
    """Get user analytics and engagement data"""
    try:
        logger.info(f"Getting analytics for user {user_id} - {days} days")
        
        analytics = await firestore_client.get_user_analytics(user_id, days)
        
        return {
            "success": True,
            "user_id": user_id,
            "analytics": analytics,
            "period_days": days,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting user analytics: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
