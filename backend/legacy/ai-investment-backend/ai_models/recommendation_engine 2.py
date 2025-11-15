"""
Recommendation engine for matching users with personalized content
"""
import logging
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timedelta
import numpy as np
from database.firestore_client import firestore_client
from database.vector_store import vector_store
from database.cache_manager import cache_manager
from config.model_config import RECOMMENDATION_WEIGHTS, USER_PROFILE_ATTRIBUTES

logger = logging.getLogger(__name__)


class RecommendationEngine:
    """Recommendation engine for personalized content suggestions"""
    
    def __init__(self):
        """Initialize recommendation engine"""
        self.weights = RECOMMENDATION_WEIGHTS
        self.user_attributes = USER_PROFILE_ATTRIBUTES
    
    def get_personalized_recommendations(self, user_id: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Get personalized recommendations for a user"""
        try:
            logger.info(f"Getting personalized recommendations for user: {user_id}")
            
            # Check cache first
            cache_key = f"recommendations:{user_id}:{limit}"
            cached_recommendations = cache_manager.get(cache_key)
            
            if cached_recommendations:
                logger.debug("Returning cached recommendations")
                return cached_recommendations
            
            # Get user profile
            user_profile = firestore_client.get_user_profile(user_id)
            if not user_profile:
                logger.warning(f"No user profile found for user: {user_id}")
                return self._get_default_recommendations(limit)
            
            # Get user engagement data
            user_engagement = firestore_client.get_user_analytics(user_id, days=30)
            
            # Generate recommendations
            recommendations = self._generate_recommendations(user_profile, user_engagement, limit)
            
            # Cache recommendations
            cache_manager.set(cache_key, recommendations, ttl=3600)  # 1 hour cache
            
            logger.info(f"Generated {len(recommendations)} recommendations for user: {user_id}")
            return recommendations
            
        except Exception as e:
            logger.error(f"Error getting personalized recommendations: {e}")
            return self._get_default_recommendations(limit)
    
    def _generate_recommendations(self, user_profile: Dict[str, Any], 
                                user_engagement: Dict[str, Any], 
                                limit: int) -> List[Dict[str, Any]]:
        """Generate recommendations based on user profile and engagement"""
        try:
            # Get all available content
            all_content = firestore_client.get_educational_content(limit=100)
            
            if not all_content:
                return self._get_default_recommendations(limit)
            
            # Score each content item
            scored_content = []
            
            for content_item in all_content:
                score = self._calculate_recommendation_score(
                    content_item, user_profile, user_engagement
                )
                
                if score > 0.3:  # Minimum threshold
                    scored_content.append({
                        "content": content_item,
                        "score": score,
                        "recommendation_reason": self._get_recommendation_reason(
                            content_item, user_profile
                        )
                    })
            
            # Sort by score and return top recommendations
            scored_content.sort(key=lambda x: x["score"], reverse=True)
            
            return scored_content[:limit]
            
        except Exception as e:
            logger.error(f"Error generating recommendations: {e}")
            return self._get_default_recommendations(limit)
    
    def _calculate_recommendation_score(self, content_item: Dict[str, Any], 
                                      user_profile: Dict[str, Any],
                                      user_engagement: Dict[str, Any]) -> float:
        """Calculate recommendation score for content item"""
        try:
            total_score = 0.0
            
            # Score based on user interests
            interest_score = self._calculate_interest_score(content_item, user_profile)
            total_score += interest_score * self.weights["user_interests"]
            
            # Score based on user experience level
            experience_score = self._calculate_experience_score(content_item, user_profile)
            total_score += experience_score * self.weights["user_experience_level"]
            
            # Score based on content popularity
            popularity_score = self._calculate_popularity_score(content_item)
            total_score += popularity_score * self.weights["content_popularity"]
            
            # Score based on content freshness
            freshness_score = self._calculate_freshness_score(content_item)
            total_score += freshness_score * self.weights["content_freshness"]
            
            # Score based on user engagement
            engagement_score = self._calculate_engagement_score(content_item, user_engagement)
            total_score += engagement_score * self.weights["user_engagement"]
            
            return min(total_score, 1.0)  # Cap at 1.0
            
        except Exception as e:
            logger.error(f"Error calculating recommendation score: {e}")
            return 0.0
    
    def _calculate_interest_score(self, content_item: Dict[str, Any], 
                                user_profile: Dict[str, Any]) -> float:
        """Calculate score based on user interests"""
        try:
            user_interests = user_profile.get("interests", [])
            content_category = content_item.get("category", "")
            content_keywords = content_item.get("keywords", [])
            
            if not user_interests:
                return 0.5  # Neutral score if no interests specified
            
            # Check category match
            category_match = 1.0 if content_category in user_interests else 0.0
            
            # Check keyword matches
            keyword_matches = 0
            for keyword in content_keywords:
                if keyword.lower() in [interest.lower() for interest in user_interests]:
                    keyword_matches += 1
            
            keyword_score = min(keyword_matches / len(user_interests), 1.0) if user_interests else 0.0
            
            # Weighted average
            return (category_match * 0.7) + (keyword_score * 0.3)
            
        except Exception as e:
            logger.error(f"Error calculating interest score: {e}")
            return 0.0
    
    def _calculate_experience_score(self, content_item: Dict[str, Any], 
                                  user_profile: Dict[str, Any]) -> float:
        """Calculate score based on user experience level"""
        try:
            user_experience = user_profile.get("experience_level", "beginner")
            content_difficulty = content_item.get("difficulty_level", "beginner")
            
            # Experience level mapping
            experience_levels = {"beginner": 1, "intermediate": 2, "advanced": 3}
            
            user_level = experience_levels.get(user_experience, 1)
            content_level = experience_levels.get(content_difficulty, 1)
            
            # Score based on how well difficulty matches experience
            if content_level == user_level:
                return 1.0  # Perfect match
            elif content_level == user_level + 1:
                return 0.8  # Slightly challenging
            elif content_level == user_level - 1:
                return 0.6  # Slightly easy
            elif content_level > user_level + 1:
                return 0.2  # Too advanced
            else:
                return 0.4  # Too easy
            
        except Exception as e:
            logger.error(f"Error calculating experience score: {e}")
            return 0.5
    
    def _calculate_popularity_score(self, content_item: Dict[str, Any]) -> float:
        """Calculate score based on content popularity"""
        try:
            # Use content quality score as popularity proxy
            quality_score = content_item.get("content_quality_score", 5)
            return quality_score / 10.0  # Normalize to 0-1
            
        except Exception as e:
            logger.error(f"Error calculating popularity score: {e}")
            return 0.5
    
    def _calculate_freshness_score(self, content_item: Dict[str, Any]) -> float:
        """Calculate score based on content freshness"""
        try:
            created_at = content_item.get("created_at", "")
            if not created_at:
                return 0.5  # Neutral score if no date
            
            # Parse creation date
            try:
                if isinstance(created_at, str):
                    created_date = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
                else:
                    created_date = created_at
                
                # Calculate days since creation
                days_old = (datetime.utcnow() - created_date).days
                
                # Score decreases with age
                if days_old < 7:
                    return 1.0  # Very fresh
                elif days_old < 30:
                    return 0.8  # Fresh
                elif days_old < 90:
                    return 0.6  # Moderately fresh
                elif days_old < 365:
                    return 0.4  # Older
                else:
                    return 0.2  # Very old
                    
            except Exception:
                return 0.5  # Neutral score if date parsing fails
            
        except Exception as e:
            logger.error(f"Error calculating freshness score: {e}")
            return 0.5
    
    def _calculate_engagement_score(self, content_item: Dict[str, Any], 
                                  user_engagement: Dict[str, Any]) -> float:
        """Calculate score based on user engagement patterns"""
        try:
            if not user_engagement:
                return 0.5  # Neutral score if no engagement data
            
            # Get user's interaction history
            conversation_data = user_engagement.get("conversation_data", [])
            
            # Check if user has shown interest in similar content
            content_category = content_item.get("category", "")
            content_keywords = content_item.get("keywords", [])
            
            engagement_score = 0.0
            
            for conversation in conversation_data:
                conversation_content = conversation.get("content", "").lower()
                
                # Check for category mentions
                if content_category.lower() in conversation_content:
                    engagement_score += 0.3
                
                # Check for keyword mentions
                for keyword in content_keywords:
                    if keyword.lower() in conversation_content:
                        engagement_score += 0.1
            
            return min(engagement_score, 1.0)
            
        except Exception as e:
            logger.error(f"Error calculating engagement score: {e}")
            return 0.5
    
    def _get_recommendation_reason(self, content_item: Dict[str, Any], 
                                 user_profile: Dict[str, Any]) -> str:
        """Get reason for recommendation"""
        try:
            user_interests = user_profile.get("interests", [])
            content_category = content_item.get("category", "")
            content_difficulty = content_item.get("difficulty_level", "")
            user_experience = user_profile.get("experience_level", "beginner")
            
            reasons = []
            
            # Interest-based reason
            if content_category in user_interests:
                reasons.append(f"matches your interest in {content_category}")
            
            # Experience-based reason
            if content_difficulty == user_experience:
                reasons.append(f"perfect for your {user_experience} level")
            elif content_difficulty == "beginner" and user_experience == "intermediate":
                reasons.append("great for building fundamentals")
            
            # Quality-based reason
            quality_score = content_item.get("content_quality_score", 5)
            if quality_score >= 8:
                reasons.append("high-quality educational content")
            
            # Default reason
            if not reasons:
                reasons.append("relevant to your learning goals")
            
            return f"Recommended because it {', '.join(reasons[:2])}"
            
        except Exception as e:
            logger.error(f"Error getting recommendation reason: {e}")
            return "Recommended based on your profile"
    
    def _get_default_recommendations(self, limit: int) -> List[Dict[str, Any]]:
        """Get default recommendations when personalization fails"""
        try:
            # Get popular beginner content
            default_content = firestore_client.get_educational_content(
                category="basics",
                difficulty="beginner",
                limit=limit
            )
            
            recommendations = []
            for content_item in default_content:
                recommendations.append({
                    "content": content_item,
                    "score": 0.7,  # Default score
                    "recommendation_reason": "Popular beginner content to get you started"
                })
            
            return recommendations
            
        except Exception as e:
            logger.error(f"Error getting default recommendations: {e}")
            return []
    
    def get_trending_content(self, time_period: str = "week", limit: int = 10) -> List[Dict[str, Any]]:
        """Get trending content based on popularity and engagement"""
        try:
            logger.info(f"Getting trending content for period: {time_period}")
            
            # Check cache
            cache_key = f"trending:{time_period}:{limit}"
            cached_trending = cache_manager.get(cache_key)
            
            if cached_trending:
                return cached_trending
            
            # Get recent content
            recent_content = firestore_client.get_educational_content(limit=50)
            
            # Score content based on trending factors
            trending_content = []
            
            for content_item in recent_content:
                trending_score = self._calculate_trending_score(content_item, time_period)
                
                if trending_score > 0.5:
                    trending_content.append({
                        "content": content_item,
                        "trending_score": trending_score,
                        "trending_reason": self._get_trending_reason(content_item)
                    })
            
            # Sort by trending score
            trending_content.sort(key=lambda x: x["trending_score"], reverse=True)
            
            result = trending_content[:limit]
            
            # Cache result
            cache_manager.set(cache_key, result, ttl=1800)  # 30 minutes cache
            
            return result
            
        except Exception as e:
            logger.error(f"Error getting trending content: {e}")
            return []
    
    def _calculate_trending_score(self, content_item: Dict[str, Any], time_period: str) -> float:
        """Calculate trending score for content"""
        try:
            # Factors for trending score
            quality_score = content_item.get("content_quality_score", 5) / 10.0
            freshness_score = self._calculate_freshness_score(content_item)
            teen_relevance = content_item.get("teen_relevance_score", 5) / 10.0
            
            # Weighted average
            trending_score = (
                quality_score * 0.4 +
                freshness_score * 0.4 +
                teen_relevance * 0.2
            )
            
            return trending_score
            
        except Exception as e:
            logger.error(f"Error calculating trending score: {e}")
            return 0.0
    
    def _get_trending_reason(self, content_item: Dict[str, Any]) -> str:
        """Get reason why content is trending"""
        try:
            quality_score = content_item.get("content_quality_score", 5)
            created_at = content_item.get("created_at", "")
            
            reasons = []
            
            if quality_score >= 8:
                reasons.append("high quality")
            
            if created_at:
                try:
                    created_date = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
                    days_old = (datetime.utcnow() - created_date).days
                    
                    if days_old < 7:
                        reasons.append("recently added")
                except Exception:
                    pass
            
            if not reasons:
                reasons.append("popular with teens")
            
            return f"Trending because it's {' and '.join(reasons)}"
            
        except Exception as e:
            logger.error(f"Error getting trending reason: {e}")
            return "Trending content"
    
    def get_similar_users_recommendations(self, user_id: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Get recommendations based on similar users"""
        try:
            logger.info(f"Getting similar users recommendations for user: {user_id}")
            
            # This would typically involve collaborative filtering
            # For now, we'll use a simplified approach based on user profiles
            
            user_profile = firestore_client.get_user_profile(user_id)
            if not user_profile:
                return self._get_default_recommendations(limit)
            
            # Find users with similar profiles
            similar_users = self._find_similar_users(user_profile)
            
            if not similar_users:
                return self._get_default_recommendations(limit)
            
            # Get content that similar users have engaged with
            similar_content = self._get_content_from_similar_users(similar_users, limit)
            
            return similar_content
            
        except Exception as e:
            logger.error(f"Error getting similar users recommendations: {e}")
            return self._get_default_recommendations(limit)
    
    def _find_similar_users(self, user_profile: Dict[str, Any]) -> List[str]:
        """Find users with similar profiles"""
        try:
            # This is a simplified implementation
            # In a real system, you'd use more sophisticated similarity algorithms
            
            user_interests = user_profile.get("interests", [])
            user_experience = user_profile.get("experience_level", "beginner")
            user_age = user_profile.get("age", 16)
            
            # For now, return empty list as we don't have user comparison data
            # In a real implementation, you'd query the database for similar users
            return []
            
        except Exception as e:
            logger.error(f"Error finding similar users: {e}")
            return []
    
    def _get_content_from_similar_users(self, similar_users: List[str], limit: int) -> List[Dict[str, Any]]:
        """Get content that similar users have engaged with"""
        try:
            # This would typically involve analyzing engagement data from similar users
            # For now, return default recommendations
            return self._get_default_recommendations(limit)
            
        except Exception as e:
            logger.error(f"Error getting content from similar users: {e}")
            return []
    
    def update_user_interests(self, user_id: str, new_interests: List[str]) -> bool:
        """Update user interests based on their interactions"""
        try:
            logger.info(f"Updating interests for user: {user_id}")
            
            # Get current user profile
            user_profile = firestore_client.get_user_profile(user_id)
            if not user_profile:
                return False
            
            # Get current interests
            current_interests = user_profile.get("interests", [])
            
            # Merge new interests with current ones
            updated_interests = list(set(current_interests + new_interests))
            
            # Update user profile
            success = firestore_client.update_user_interests(user_id, updated_interests)
            
            if success:
                # Clear recommendation cache for this user
                cache_manager.clear_pattern(f"recommendations:{user_id}:*")
            
            return success
            
        except Exception as e:
            logger.error(f"Error updating user interests: {e}")
            return False
    
    def get_recommendation_stats(self) -> Dict[str, Any]:
        """Get recommendation engine statistics"""
        try:
            return {
                "weights": self.weights,
                "user_attributes": self.user_attributes,
                "cache_stats": cache_manager.get_stats(),
                "timestamp": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error getting recommendation stats: {e}")
            return {"error": str(e)}


# Global recommendation engine instance
recommendation_engine = RecommendationEngine()
