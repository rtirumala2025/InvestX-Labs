"""
Context retriever for RAG system to get relevant content for responses
"""
import logging
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timedelta
from ai_models.rag_system.vector_search import vector_search
from database.firestore_client import firestore_client
from database.cache_manager import cache_manager
from config.model_config import RAG_CONFIG

logger = logging.getLogger(__name__)


class ContextRetriever:
    """Context retriever for RAG system"""
    
    def __init__(self):
        """Initialize context retriever"""
        self.max_context_length = RAG_CONFIG["max_context_length"]
        self.context_overlap = RAG_CONFIG["context_overlap"]
        self.chunk_size = RAG_CONFIG["chunk_size"]
        self.chunk_overlap = RAG_CONFIG["chunk_overlap"]
    
    def retrieve_context(self, query: str, user_profile: Dict[str, Any] = None, 
                        conversation_history: List[Dict[str, Any]] = None,
                        context_type: str = "educational") -> Dict[str, Any]:
        """Retrieve relevant context for a query"""
        try:
            logger.info(f"Retrieving context for query: {query[:50]}...")
            
            # Check cache first
            cache_key = f"context:{hash(query)}:{hash(str(user_profile))}:{context_type}"
            cached_context = cache_manager.get(cache_key)
            
            if cached_context:
                logger.debug("Returning cached context")
                return cached_context
            
            # Retrieve different types of context
            context_data = {
                "query": query,
                "retrieved_at": datetime.utcnow().isoformat(),
                "context_type": context_type,
                "user_profile": user_profile,
                "educational_content": [],
                "market_data": [],
                "news_articles": [],
                "conversation_context": {},
                "related_topics": [],
                "recommendations": []
            }
            
            # Retrieve educational content
            if context_type in ["educational", "all"]:
                educational_context = self._retrieve_educational_context(query, user_profile)
                context_data["educational_content"] = educational_context
            
            # Retrieve market data if relevant
            if context_type in ["market", "all"] and self._is_market_related(query):
                market_context = self._retrieve_market_context(query)
                context_data["market_data"] = market_context
            
            # Retrieve news articles if relevant
            if context_type in ["news", "all"] and self._is_news_related(query):
                news_context = self._retrieve_news_context(query)
                context_data["news_articles"] = news_context
            
            # Retrieve conversation context
            if conversation_history:
                conversation_context = self._retrieve_conversation_context(conversation_history)
                context_data["conversation_context"] = conversation_context
            
            # Get related topics
            related_topics = self._get_related_topics(query, context_data["educational_content"])
            context_data["related_topics"] = related_topics
            
            # Get recommendations
            if user_profile:
                recommendations = self._get_contextual_recommendations(user_profile, query)
                context_data["recommendations"] = recommendations
            
            # Cache the context
            cache_manager.set(cache_key, context_data, ttl=1800)  # 30 minutes cache
            
            logger.info(f"Retrieved context with {len(context_data['educational_content'])} educational items")
            return context_data
            
        except Exception as e:
            logger.error(f"Error retrieving context: {e}")
            return {"error": str(e)}
    
    def _retrieve_educational_context(self, query: str, user_profile: Dict[str, Any] = None) -> List[Dict[str, Any]]:
        """Retrieve relevant educational content"""
        try:
            # Use vector search to find relevant content
            if user_profile:
                results = vector_search.search_by_user_profile(user_profile, query, limit=5)
            else:
                results = vector_search.search_educational_content(query, limit=5)
            
            # Process and format results
            educational_context = []
            
            for result in results:
                try:
                    # Extract relevant information
                    content_item = {
                        "id": result.get("id", ""),
                        "title": result.get("metadata", {}).get("title", ""),
                        "content": result.get("text", ""),
                        "summary": result.get("metadata", {}).get("summary", ""),
                        "category": result.get("metadata", {}).get("category", ""),
                        "difficulty_level": result.get("metadata", {}).get("difficulty_level", ""),
                        "source": result.get("metadata", {}).get("source", ""),
                        "keywords": result.get("metadata", {}).get("keywords", []),
                        "relevance_score": 1.0 - result.get("distance", 1.0),
                        "url": result.get("metadata", {}).get("url", "")
                    }
                    
                    # Chunk content if too long
                    if len(content_item["content"]) > self.chunk_size:
                        content_item["content"] = self._chunk_content(content_item["content"])
                    
                    educational_context.append(content_item)
                    
                except Exception as e:
                    logger.error(f"Error processing educational content: {e}")
                    continue
            
            return educational_context
            
        except Exception as e:
            logger.error(f"Error retrieving educational context: {e}")
            return []
    
    def _retrieve_market_context(self, query: str) -> List[Dict[str, Any]]:
        """Retrieve relevant market data"""
        try:
            # Extract stock symbols from query
            symbols = self._extract_stock_symbols(query)
            
            market_context = []
            
            for symbol in symbols:
                try:
                    # Get market data from cache or database
                    market_data = cache_manager.get(f"market_data:{symbol}")
                    
                    if not market_data:
                        market_data = firestore_client.get_market_data(symbol)
                        if market_data:
                            cache_manager.set(f"market_data:{symbol}", market_data, ttl=3600)
                    
                    if market_data:
                        market_context.append({
                            "symbol": symbol,
                            "name": market_data.get("name", symbol),
                            "current_price": market_data.get("current_price", 0),
                            "price_change": market_data.get("price_change", 0),
                            "percent_change": market_data.get("percent_change", 0),
                            "volume": market_data.get("volume", 0),
                            "market_cap": market_data.get("market_cap", 0),
                            "sector": market_data.get("sector", ""),
                            "description": market_data.get("description", ""),
                            "timestamp": market_data.get("timestamp", "")
                        })
                        
                except Exception as e:
                    logger.error(f"Error retrieving market data for {symbol}: {e}")
                    continue
            
            return market_context
            
        except Exception as e:
            logger.error(f"Error retrieving market context: {e}")
            return []
    
    def _retrieve_news_context(self, query: str) -> List[Dict[str, Any]]:
        """Retrieve relevant news articles"""
        try:
            # Get recent news articles
            news_articles = firestore_client.get_recent_news(limit=10)
            
            # Filter and rank by relevance to query
            relevant_news = []
            
            for article in news_articles:
                try:
                    # Simple relevance check based on keywords
                    relevance_score = self._calculate_news_relevance(query, article)
                    
                    if relevance_score > 0.3:  # Threshold for relevance
                        relevant_news.append({
                            "id": article.get("id", ""),
                            "title": article.get("title", ""),
                            "summary": article.get("summary", ""),
                            "url": article.get("url", ""),
                            "source": article.get("source", ""),
                            "published": article.get("published", ""),
                            "relevance_score": relevance_score,
                            "keywords": article.get("keywords", [])
                        })
                        
                except Exception as e:
                    logger.error(f"Error processing news article: {e}")
                    continue
            
            # Sort by relevance and return top results
            relevant_news.sort(key=lambda x: x["relevance_score"], reverse=True)
            return relevant_news[:3]
            
        except Exception as e:
            logger.error(f"Error retrieving news context: {e}")
            return []
    
    def _retrieve_conversation_context(self, conversation_history: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Retrieve context from conversation history"""
        try:
            if not conversation_history:
                return {}
            
            # Analyze recent conversation
            recent_messages = conversation_history[-5:]  # Last 5 messages
            
            # Extract topics and themes
            topics = []
            user_interests = set()
            current_focus = ""
            
            for message in recent_messages:
                content = message.get("content", "").lower()
                
                # Extract investment-related topics
                investment_topics = [
                    "stocks", "bonds", "etfs", "index funds", "diversification",
                    "risk", "portfolio", "savings", "budgeting", "compound interest"
                ]
                
                for topic in investment_topics:
                    if topic in content:
                        topics.append(topic)
                        user_interests.add(topic)
                
                # Determine current focus
                if "how" in content or "what" in content:
                    current_focus = content[:100]  # First 100 characters
            
            return {
                "recent_topics": list(set(topics)),
                "user_interests": list(user_interests),
                "current_focus": current_focus,
                "conversation_length": len(conversation_history),
                "last_message_time": recent_messages[-1].get("timestamp", "") if recent_messages else ""
            }
            
        except Exception as e:
            logger.error(f"Error retrieving conversation context: {e}")
            return {}
    
    def _get_related_topics(self, query: str, educational_content: List[Dict[str, Any]]) -> List[str]:
        """Get related topics based on query and content"""
        try:
            related_topics = set()
            
            # Extract topics from educational content
            for content_item in educational_content:
                keywords = content_item.get("keywords", [])
                related_topics.update(keywords)
                
                category = content_item.get("category", "")
                if category:
                    related_topics.add(category)
            
            # Add common related topics based on query
            query_lower = query.lower()
            
            if "stock" in query_lower:
                related_topics.update(["portfolio", "diversification", "risk management"])
            elif "bond" in query_lower:
                related_topics.update(["fixed income", "interest rates", "risk"])
            elif "etf" in query_lower:
                related_topics.update(["index funds", "diversification", "low cost"])
            elif "risk" in query_lower:
                related_topics.update(["diversification", "asset allocation", "volatility"])
            
            return list(related_topics)[:10]  # Limit to 10 topics
            
        except Exception as e:
            logger.error(f"Error getting related topics: {e}")
            return []
    
    def _get_contextual_recommendations(self, user_profile: Dict[str, Any], query: str) -> List[Dict[str, Any]]:
        """Get contextual recommendations based on user profile and query"""
        try:
            # Get personalized recommendations
            recommendations = vector_search.get_personalized_recommendations(user_profile, limit=3)
            
            # Filter recommendations based on query relevance
            relevant_recommendations = []
            
            for rec in recommendations:
                relevance_score = self._calculate_recommendation_relevance(query, rec)
                
                if relevance_score > 0.4:  # Threshold for relevance
                    relevant_recommendations.append({
                        "id": rec.get("id", ""),
                        "title": rec.get("metadata", {}).get("title", ""),
                        "category": rec.get("metadata", {}).get("category", ""),
                        "difficulty_level": rec.get("metadata", {}).get("difficulty_level", ""),
                        "relevance_score": relevance_score,
                        "recommendation_reason": rec.get("recommendation_reason", "")
                    })
            
            return relevant_recommendations
            
        except Exception as e:
            logger.error(f"Error getting contextual recommendations: {e}")
            return []
    
    def _is_market_related(self, query: str) -> bool:
        """Check if query is market-related"""
        try:
            market_keywords = [
                "stock", "stocks", "price", "market", "trading", "buy", "sell",
                "portfolio", "investment", "earnings", "dividend", "volume"
            ]
            
            query_lower = query.lower()
            return any(keyword in query_lower for keyword in market_keywords)
            
        except Exception as e:
            logger.error(f"Error checking market relevance: {e}")
            return False
    
    def _is_news_related(self, query: str) -> bool:
        """Check if query is news-related"""
        try:
            news_keywords = [
                "news", "update", "recent", "latest", "happening", "today",
                "yesterday", "this week", "announcement", "report"
            ]
            
            query_lower = query.lower()
            return any(keyword in query_lower for keyword in news_keywords)
            
        except Exception as e:
            logger.error(f"Error checking news relevance: {e}")
            return False
    
    def _extract_stock_symbols(self, query: str) -> List[str]:
        """Extract stock symbols from query"""
        try:
            import re
            
            # Common stock symbols for teens
            teen_stocks = [
                "AAPL", "GOOGL", "TSLA", "MSFT", "AMZN", "META", "NFLX",
                "VTI", "VOO", "SPY", "QQQ", "ARKK"
            ]
            
            found_symbols = []
            query_upper = query.upper()
            
            for symbol in teen_stocks:
                if symbol in query_upper:
                    found_symbols.append(symbol)
            
            return found_symbols
            
        except Exception as e:
            logger.error(f"Error extracting stock symbols: {e}")
            return []
    
    def _calculate_news_relevance(self, query: str, article: Dict[str, Any]) -> float:
        """Calculate relevance score for news article"""
        try:
            query_lower = query.lower()
            title = article.get("title", "").lower()
            summary = article.get("summary", "").lower()
            keywords = article.get("keywords", [])
            
            relevance_score = 0.0
            
            # Check title relevance
            if any(word in title for word in query_lower.split()):
                relevance_score += 0.5
            
            # Check summary relevance
            if any(word in summary for word in query_lower.split()):
                relevance_score += 0.3
            
            # Check keywords relevance
            if keywords:
                keyword_matches = sum(1 for keyword in keywords if keyword.lower() in query_lower)
                relevance_score += (keyword_matches / len(keywords)) * 0.2
            
            return min(relevance_score, 1.0)
            
        except Exception as e:
            logger.error(f"Error calculating news relevance: {e}")
            return 0.0
    
    def _calculate_recommendation_relevance(self, query: str, recommendation: Dict[str, Any]) -> float:
        """Calculate relevance score for recommendation"""
        try:
            query_lower = query.lower()
            title = recommendation.get("metadata", {}).get("title", "").lower()
            category = recommendation.get("metadata", {}).get("category", "").lower()
            
            relevance_score = 0.0
            
            # Check title relevance
            if any(word in title for word in query_lower.split()):
                relevance_score += 0.6
            
            # Check category relevance
            if any(word in category for word in query_lower.split()):
                relevance_score += 0.4
            
            return min(relevance_score, 1.0)
            
        except Exception as e:
            logger.error(f"Error calculating recommendation relevance: {e}")
            return 0.0
    
    def _chunk_content(self, content: str) -> str:
        """Chunk content to fit within context limits"""
        try:
            if len(content) <= self.chunk_size:
                return content
            
            # Find a good breaking point
            chunk = content[:self.chunk_size]
            
            # Try to break at sentence boundary
            last_period = chunk.rfind('.')
            last_question = chunk.rfind('?')
            last_exclamation = chunk.rfind('!')
            
            break_point = max(last_period, last_question, last_exclamation)
            
            if break_point > self.chunk_size * 0.7:  # If we found a good break point
                return content[:break_point + 1] + "..."
            else:
                return content[:self.chunk_size] + "..."
                
        except Exception as e:
            logger.error(f"Error chunking content: {e}")
            return content[:self.chunk_size] + "..."
    
    def format_context_for_prompt(self, context_data: Dict[str, Any]) -> str:
        """Format context data for use in AI prompts"""
        try:
            formatted_context = ""
            
            # Add educational content
            educational_content = context_data.get("educational_content", [])
            if educational_content:
                formatted_context += "## Educational Content\n\n"
                
                for i, content in enumerate(educational_content[:3], 1):
                    formatted_context += f"### {i}. {content.get('title', 'Untitled')}\n"
                    formatted_context += f"**Category:** {content.get('category', 'N/A')}\n"
                    formatted_context += f"**Difficulty:** {content.get('difficulty_level', 'N/A')}\n"
                    formatted_context += f"**Content:** {content.get('content', '')[:500]}...\n\n"
            
            # Add market data
            market_data = context_data.get("market_data", [])
            if market_data:
                formatted_context += "## Market Data\n\n"
                
                for data in market_data[:2]:
                    formatted_context += f"**{data.get('name', data.get('symbol', ''))}:** "
                    formatted_context += f"${data.get('current_price', 0):.2f} "
                    formatted_context += f"({data.get('percent_change', 0):+.2f}%)\n"
                
                formatted_context += "\n"
            
            # Add news articles
            news_articles = context_data.get("news_articles", [])
            if news_articles:
                formatted_context += "## Recent News\n\n"
                
                for article in news_articles[:2]:
                    formatted_context += f"**{article.get('title', 'Untitled')}**\n"
                    formatted_context += f"{article.get('summary', '')[:200]}...\n\n"
            
            # Add related topics
            related_topics = context_data.get("related_topics", [])
            if related_topics:
                formatted_context += f"## Related Topics\n{', '.join(related_topics[:5])}\n\n"
            
            return formatted_context
            
        except Exception as e:
            logger.error(f"Error formatting context for prompt: {e}")
            return ""


# Global context retriever instance
context_retriever = ContextRetriever()
