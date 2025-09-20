"""
Vector search system for semantic search in educational content
"""
import logging
import numpy as np
from typing import List, Dict, Any, Optional, Tuple
from database.vector_store import vector_store
from database.cache_manager import cache_manager
from config.model_config import VECTOR_SEARCH_CONFIG, RAG_CONFIG

logger = logging.getLogger(__name__)


class VectorSearch:
    """Vector search system for semantic search"""
    
    def __init__(self):
        """Initialize vector search system"""
        self.similarity_threshold = VECTOR_SEARCH_CONFIG["similarity_threshold"]
        self.max_results = VECTOR_SEARCH_CONFIG["max_results"]
        self.search_type = VECTOR_SEARCH_CONFIG["search_type"]
        self.mmr_diversity_threshold = VECTOR_SEARCH_CONFIG["mmr_diversity_threshold"]
    
    def search_educational_content(self, query: str, filters: Dict[str, Any] = None, 
                                 limit: int = None) -> List[Dict[str, Any]]:
        """Search educational content using vector similarity"""
        try:
            if limit is None:
                limit = self.max_results
            
            # Check cache first
            cache_key = f"search:{hash(query)}:{hash(str(filters))}:{limit}"
            cached_results = cache_manager.get(cache_key)
            
            if cached_results:
                logger.debug("Returning cached search results")
                return cached_results
            
            # Perform vector search
            if self.search_type == "similarity":
                results = self._similarity_search(query, filters, limit)
            elif self.search_type == "mmr":
                results = self._mmr_search(query, filters, limit)
            else:
                results = self._similarity_search(query, filters, limit)
            
            # Filter by similarity threshold
            filtered_results = [
                result for result in results 
                if result.get("distance", 1.0) <= (1.0 - self.similarity_threshold)
            ]
            
            # Cache results
            cache_manager.set(cache_key, filtered_results, ttl=3600)  # 1 hour cache
            
            logger.info(f"Vector search returned {len(filtered_results)} results for query: {query[:50]}...")
            return filtered_results
            
        except Exception as e:
            logger.error(f"Error in vector search: {e}")
            return []
    
    def _similarity_search(self, query: str, filters: Dict[str, Any] = None, 
                          limit: int = 10) -> List[Dict[str, Any]]:
        """Perform similarity search"""
        try:
            # Search in educational content collection
            results = vector_store.search_similar(
                collection_name="educational_content",
                query_text=query,
                n_results=limit * 2  # Get more results for filtering
            )
            
            # Apply filters if provided
            if filters:
                results = self._apply_filters(results, filters)
            
            return results[:limit]
            
        except Exception as e:
            logger.error(f"Error in similarity search: {e}")
            return []
    
    def _mmr_search(self, query: str, filters: Dict[str, Any] = None, 
                   limit: int = 10) -> List[Dict[str, Any]]:
        """Perform Maximal Marginal Relevance (MMR) search for diversity"""
        try:
            # Get more results for MMR selection
            all_results = vector_store.search_similar(
                collection_name="educational_content",
                query_text=query,
                n_results=limit * 3
            )
            
            # Apply filters if provided
            if filters:
                all_results = self._apply_filters(all_results, filters)
            
            # Apply MMR selection
            mmr_results = self._select_mmr_results(all_results, query, limit)
            
            return mmr_results
            
        except Exception as e:
            logger.error(f"Error in MMR search: {e}")
            return []
    
    def _select_mmr_results(self, results: List[Dict[str, Any]], query: str, 
                           limit: int) -> List[Dict[str, Any]]:
        """Select results using Maximal Marginal Relevance"""
        try:
            if len(results) <= limit:
                return results
            
            # Start with the most relevant result
            selected = [results[0]]
            remaining = results[1:]
            
            while len(selected) < limit and remaining:
                best_score = -1
                best_idx = 0
                
                for i, candidate in enumerate(remaining):
                    # Calculate MMR score
                    relevance = 1.0 - candidate.get("distance", 1.0)  # Convert distance to relevance
                    
                    # Calculate max similarity to already selected results
                    max_similarity = 0
                    for selected_result in selected:
                        similarity = self._calculate_similarity(candidate, selected_result)
                        max_similarity = max(max_similarity, similarity)
                    
                    # MMR score = relevance - diversity_threshold * max_similarity
                    mmr_score = relevance - self.mmr_diversity_threshold * max_similarity
                    
                    if mmr_score > best_score:
                        best_score = mmr_score
                        best_idx = i
                
                # Add best result to selected
                selected.append(remaining.pop(best_idx))
            
            return selected
            
        except Exception as e:
            logger.error(f"Error in MMR selection: {e}")
            return results[:limit]
    
    def _calculate_similarity(self, result1: Dict[str, Any], result2: Dict[str, Any]) -> float:
        """Calculate similarity between two results"""
        try:
            # Simple similarity based on metadata
            metadata1 = result1.get("metadata", {})
            metadata2 = result2.get("metadata", {})
            
            # Compare category
            category1 = metadata1.get("category", "")
            category2 = metadata2.get("category", "")
            category_similarity = 1.0 if category1 == category2 else 0.0
            
            # Compare difficulty level
            difficulty1 = metadata1.get("difficulty_level", "")
            difficulty2 = metadata2.get("difficulty_level", "")
            difficulty_similarity = 1.0 if difficulty1 == difficulty2 else 0.0
            
            # Compare source
            source1 = metadata1.get("source", "")
            source2 = metadata2.get("source", "")
            source_similarity = 1.0 if source1 == source2 else 0.0
            
            # Weighted average
            similarity = (
                category_similarity * 0.5 +
                difficulty_similarity * 0.3 +
                source_similarity * 0.2
            )
            
            return similarity
            
        except Exception as e:
            logger.error(f"Error calculating similarity: {e}")
            return 0.0
    
    def _apply_filters(self, results: List[Dict[str, Any]], filters: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Apply filters to search results"""
        try:
            filtered_results = []
            
            for result in results:
                metadata = result.get("metadata", {})
                
                # Check if result matches all filters
                matches = True
                
                for filter_key, filter_value in filters.items():
                    if filter_key in metadata:
                        if isinstance(filter_value, list):
                            if metadata[filter_key] not in filter_value:
                                matches = False
                                break
                        else:
                            if metadata[filter_key] != filter_value:
                                matches = False
                                break
                
                if matches:
                    filtered_results.append(result)
            
            return filtered_results
            
        except Exception as e:
            logger.error(f"Error applying filters: {e}")
            return results
    
    def search_by_category(self, category: str, query: str = "", 
                          limit: int = 10) -> List[Dict[str, Any]]:
        """Search content in a specific category"""
        try:
            if query:
                # Use semantic search within category
                results = vector_store.search_by_category(
                    collection_name="educational_content",
                    category=category,
                    query_text=query,
                    n_results=limit
                )
            else:
                # Get all content in category
                results = vector_store.search_by_category(
                    collection_name="educational_content",
                    category=category,
                    query_text=category,
                    n_results=limit
                )
            
            # Filter by similarity threshold
            filtered_results = [
                result for result in results 
                if result.get("distance", 1.0) <= (1.0 - self.similarity_threshold)
            ]
            
            return filtered_results
            
        except Exception as e:
            logger.error(f"Error searching by category: {e}")
            return []
    
    def search_by_difficulty(self, difficulty: str, query: str = "", 
                           limit: int = 10) -> List[Dict[str, Any]]:
        """Search content by difficulty level"""
        try:
            if query:
                # Use semantic search within difficulty level
                results = vector_store.search_by_difficulty(
                    collection_name="educational_content",
                    difficulty=difficulty,
                    query_text=query,
                    n_results=limit
                )
            else:
                # Get all content at difficulty level
                results = vector_store.search_by_difficulty(
                    collection_name="educational_content",
                    difficulty=difficulty,
                    query_text=difficulty,
                    n_results=limit
                )
            
            # Filter by similarity threshold
            filtered_results = [
                result for result in results 
                if result.get("distance", 1.0) <= (1.0 - self.similarity_threshold)
            ]
            
            return filtered_results
            
        except Exception as e:
            logger.error(f"Error searching by difficulty: {e}")
            return []
    
    def search_by_user_profile(self, user_profile: Dict[str, Any], 
                              query: str = "", limit: int = 10) -> List[Dict[str, Any]]:
        """Search content based on user profile"""
        try:
            # Build filters based on user profile
            filters = {}
            
            # Filter by age
            age = user_profile.get("age", 16)
            if age < 16:
                filters["target_age"] = "13-15"
            elif age > 18:
                filters["target_age"] = "16-19"
            else:
                filters["target_age"] = ["13-15", "16-19", "all_teens"]
            
            # Filter by experience level
            experience = user_profile.get("experience_level", "beginner")
            if experience == "beginner":
                filters["difficulty_level"] = "beginner"
            elif experience == "intermediate":
                filters["difficulty_level"] = ["beginner", "intermediate"]
            else:  # advanced
                filters["difficulty_level"] = ["beginner", "intermediate", "advanced"]
            
            # Filter by interests
            interests = user_profile.get("interests", [])
            if interests:
                filters["category"] = interests[:3]  # Top 3 interests
            
            # Perform search with filters
            results = self.search_educational_content(query, filters, limit)
            
            return results
            
        except Exception as e:
            logger.error(f"Error searching by user profile: {e}")
            return []
    
    def get_related_content(self, content_id: str, limit: int = 5) -> List[Dict[str, Any]]:
        """Get content related to a specific piece of content"""
        try:
            # Get the original content
            original_content = vector_store.get_document("educational_content", content_id)
            
            if not original_content:
                return []
            
            # Use the content text as query
            query_text = f"{original_content.get('title', '')} {original_content.get('content', '')[:500]}"
            
            # Search for similar content
            results = self.search_educational_content(query_text, limit=limit + 1)
            
            # Remove the original content from results
            related_results = [
                result for result in results 
                if result.get("id") != content_id
            ]
            
            return related_results[:limit]
            
        except Exception as e:
            logger.error(f"Error getting related content: {e}")
            return []
    
    def get_trending_content(self, time_period: str = "week", limit: int = 10) -> List[Dict[str, Any]]:
        """Get trending content based on popularity"""
        try:
            # This would typically involve analyzing user engagement data
            # For now, we'll use a simple approach based on content recency and quality
            
            # Get recent content
            results = vector_store.search_similar(
                collection_name="educational_content",
                query_text="investment education",
                n_results=limit * 2
            )
            
            # Sort by quality score if available
            sorted_results = sorted(
                results,
                key=lambda x: x.get("metadata", {}).get("content_quality_score", 5),
                reverse=True
            )
            
            return sorted_results[:limit]
            
        except Exception as e:
            logger.error(f"Error getting trending content: {e}")
            return []
    
    def get_personalized_recommendations(self, user_profile: Dict[str, Any], 
                                       limit: int = 10) -> List[Dict[str, Any]]:
        """Get personalized content recommendations"""
        try:
            # Build recommendation query based on user profile
            interests = user_profile.get("interests", [])
            experience = user_profile.get("experience_level", "beginner")
            age = user_profile.get("age", 16)
            
            # Create query string
            query_parts = []
            if interests:
                query_parts.extend(interests[:3])
            query_parts.append(experience)
            
            if age < 16:
                query_parts.append("beginner")
            elif age > 18:
                query_parts.append("advanced")
            else:
                query_parts.append("intermediate")
            
            query = " ".join(query_parts)
            
            # Search for recommendations
            recommendations = self.search_by_user_profile(user_profile, query, limit)
            
            # Add recommendation scores
            for i, rec in enumerate(recommendations):
                rec["recommendation_score"] = 1.0 - (i * 0.1)  # Decreasing score
                rec["recommendation_reason"] = f"Matches your interests in {', '.join(interests[:2])}"
            
            return recommendations
            
        except Exception as e:
            logger.error(f"Error getting personalized recommendations: {e}")
            return []
    
    def search_with_context(self, query: str, context: Dict[str, Any], 
                           limit: int = 10) -> List[Dict[str, Any]]:
        """Search with additional context"""
        try:
            # Enhance query with context
            enhanced_query = query
            
            # Add context information to query
            if "conversation_history" in context:
                # Add recent conversation topics
                recent_topics = context["conversation_history"][-3:]  # Last 3 topics
                enhanced_query += " " + " ".join(recent_topics)
            
            if "user_interests" in context:
                # Add user interests
                interests = context["user_interests"][:2]  # Top 2 interests
                enhanced_query += " " + " ".join(interests)
            
            if "current_topic" in context:
                # Add current topic
                enhanced_query += " " + context["current_topic"]
            
            # Perform search with enhanced query
            results = self.search_educational_content(enhanced_query, limit=limit)
            
            return results
            
        except Exception as e:
            logger.error(f"Error searching with context: {e}")
            return []
    
    def get_search_suggestions(self, partial_query: str, limit: int = 5) -> List[str]:
        """Get search suggestions based on partial query"""
        try:
            # This would typically involve analyzing popular search terms
            # For now, we'll use a simple approach based on content categories
            
            suggestions = []
            
            # Common investment education topics
            common_topics = [
                "stocks", "bonds", "etfs", "index funds", "diversification",
                "risk management", "compound interest", "portfolio", "savings",
                "budgeting", "retirement", "tax implications", "market analysis"
            ]
            
            # Filter topics that match partial query
            partial_lower = partial_query.lower()
            matching_topics = [
                topic for topic in common_topics 
                if topic.startswith(partial_lower)
            ]
            
            return matching_topics[:limit]
            
        except Exception as e:
            logger.error(f"Error getting search suggestions: {e}")
            return []


# Global vector search instance
vector_search = VectorSearch()
