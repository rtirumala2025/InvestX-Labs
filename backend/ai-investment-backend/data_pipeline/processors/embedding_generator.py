"""
Embedding generator for creating vector embeddings from content
"""
import logging
from typing import List, Dict, Any, Optional
import numpy as np
from sentence_transformers import SentenceTransformer
from config.settings import settings
from config.model_config import EMBEDDING_CONFIG
from database.vector_store import vector_store

logger = logging.getLogger(__name__)


class EmbeddingGenerator:
    """Generate embeddings for educational content"""
    
    def __init__(self):
        """Initialize embedding generator"""
        self.model = None
        self._initialize_model()
    
    def _initialize_model(self):
        """Initialize sentence transformer model"""
        try:
            self.model = SentenceTransformer(EMBEDDING_CONFIG["model_name"])
            logger.info(f"Embedding model loaded: {EMBEDDING_CONFIG['model_name']}")
            
        except Exception as e:
            logger.error(f"Failed to initialize embedding model: {e}")
            raise
    
    def generate_embedding(self, text: str) -> List[float]:
        """Generate embedding for a single text"""
        try:
            if not text or not text.strip():
                # Return zero vector for empty text
                return [0.0] * 384  # Default embedding size for all-MiniLM-L6-v2
            
            # Clean and prepare text
            cleaned_text = self._clean_text(text)
            
            # Generate embedding
            embedding = self.model.encode(
                cleaned_text,
                normalize_embeddings=EMBEDDING_CONFIG["normalize_embeddings"],
                show_progress_bar=False
            )
            
            return embedding.tolist()
            
        except Exception as e:
            logger.error(f"Error generating embedding: {e}")
            return [0.0] * 384
    
    def generate_embeddings_batch(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings for multiple texts"""
        try:
            if not texts:
                return []
            
            # Clean texts
            cleaned_texts = [self._clean_text(text) for text in texts]
            
            # Generate embeddings in batch
            embeddings = self.model.encode(
                cleaned_texts,
                normalize_embeddings=EMBEDDING_CONFIG["normalize_embeddings"],
                show_progress_bar=True,
                batch_size=32
            )
            
            return embeddings.tolist()
            
        except Exception as e:
            logger.error(f"Error generating batch embeddings: {e}")
            return [[0.0] * 384] * len(texts)
    
    def generate_content_embedding(self, content_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate embedding for educational content"""
        try:
            # Combine title and content for embedding
            title = content_data.get("title", "")
            content = content_data.get("content", "")
            summary = content_data.get("summary", "")
            
            # Create combined text for embedding
            combined_text = f"{title}\n\n{summary}\n\n{content}"
            
            # Generate embedding
            embedding = self.generate_embedding(combined_text)
            
            # Create embedding data
            embedding_data = {
                "content_id": content_data.get("id", ""),
                "title": title,
                "content": content,
                "summary": summary,
                "embedding": embedding,
                "category": content_data.get("category", ""),
                "difficulty_level": content_data.get("difficulty_level", ""),
                "target_age": content_data.get("target_age", ""),
                "keywords": content_data.get("keywords", []),
                "source": content_data.get("source", ""),
                "created_at": content_data.get("created_at", ""),
                "embedding_model": EMBEDDING_CONFIG["model_name"],
                "embedding_version": "1.0"
            }
            
            return embedding_data
            
        except Exception as e:
            logger.error(f"Error generating content embedding: {e}")
            return {}
    
    def generate_embeddings_for_content_list(self, content_list: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Generate embeddings for a list of content items"""
        try:
            embeddings = []
            
            for content_item in content_list:
                try:
                    embedding_data = self.generate_content_embedding(content_item)
                    if embedding_data:
                        embeddings.append(embedding_data)
                        
                except Exception as e:
                    logger.error(f"Error generating embedding for content item: {e}")
                    continue
            
            logger.info(f"Generated {len(embeddings)} embeddings from {len(content_list)} content items")
            return embeddings
            
        except Exception as e:
            logger.error(f"Error generating embeddings for content list: {e}")
            return []
    
    def store_embeddings_in_vector_store(self, embeddings: List[Dict[str, Any]], 
                                       collection_name: str = "educational_content") -> bool:
        """Store embeddings in vector store"""
        try:
            success_count = 0
            
            for embedding_data in embeddings:
                try:
                    # Prepare data for vector store
                    content_id = embedding_data.get("content_id", f"content_{len(embeddings)}")
                    text = f"{embedding_data.get('title', '')}\n\n{embedding_data.get('summary', '')}\n\n{embedding_data.get('content', '')}"
                    metadata = {
                        "category": embedding_data.get("category", ""),
                        "difficulty_level": embedding_data.get("difficulty_level", ""),
                        "target_age": embedding_data.get("target_age", ""),
                        "source": embedding_data.get("source", ""),
                        "keywords": embedding_data.get("keywords", []),
                        "created_at": embedding_data.get("created_at", ""),
                        "embedding_model": embedding_data.get("embedding_model", ""),
                        "embedding_version": embedding_data.get("embedding_version", "")
                    }
                    
                    # Store in vector store
                    success = vector_store.add_document(
                        collection_name=collection_name,
                        document_id=content_id,
                        text=text,
                        metadata=metadata
                    )
                    
                    if success:
                        success_count += 1
                        
                except Exception as e:
                    logger.error(f"Error storing embedding in vector store: {e}")
                    continue
            
            logger.info(f"Stored {success_count}/{len(embeddings)} embeddings in vector store")
            return success_count > 0
            
        except Exception as e:
            logger.error(f"Error storing embeddings in vector store: {e}")
            return False
    
    def generate_query_embedding(self, query: str) -> List[float]:
        """Generate embedding for search query"""
        try:
            return self.generate_embedding(query)
            
        except Exception as e:
            logger.error(f"Error generating query embedding: {e}")
            return [0.0] * 384
    
    def find_similar_content(self, query: str, collection_name: str = "educational_content", 
                           n_results: int = 5) -> List[Dict[str, Any]]:
        """Find similar content using vector search"""
        try:
            # Generate query embedding
            query_embedding = self.generate_query_embedding(query)
            
            # Search in vector store
            similar_content = vector_store.search_similar(
                collection_name=collection_name,
                query_text=query,
                n_results=n_results
            )
            
            return similar_content
            
        except Exception as e:
            logger.error(f"Error finding similar content: {e}")
            return []
    
    def find_content_by_category(self, category: str, query: str = "", 
                               collection_name: str = "educational_content", 
                               n_results: int = 5) -> List[Dict[str, Any]]:
        """Find content in a specific category"""
        try:
            if query:
                # Use semantic search within category
                similar_content = vector_store.search_by_category(
                    collection_name=collection_name,
                    category=category,
                    query_text=query,
                    n_results=n_results
                )
            else:
                # Get all content in category
                similar_content = vector_store.search_by_category(
                    collection_name=collection_name,
                    category=category,
                    query_text=category,  # Use category as query
                    n_results=n_results
                )
            
            return similar_content
            
        except Exception as e:
            logger.error(f"Error finding content by category: {e}")
            return []
    
    def find_content_by_difficulty(self, difficulty: str, query: str = "", 
                                 collection_name: str = "educational_content", 
                                 n_results: int = 5) -> List[Dict[str, Any]]:
        """Find content by difficulty level"""
        try:
            if query:
                # Use semantic search within difficulty level
                similar_content = vector_store.search_by_difficulty(
                    collection_name=collection_name,
                    difficulty=difficulty,
                    query_text=query,
                    n_results=n_results
                )
            else:
                # Get all content at difficulty level
                similar_content = vector_store.search_by_difficulty(
                    collection_name=collection_name,
                    difficulty=difficulty,
                    query_text=difficulty,  # Use difficulty as query
                    n_results=n_results
                )
            
            return similar_content
            
        except Exception as e:
            logger.error(f"Error finding content by difficulty: {e}")
            return []
    
    def get_recommendations(self, user_profile: Dict[str, Any], 
                          collection_name: str = "educational_content", 
                          n_results: int = 10) -> List[Dict[str, Any]]:
        """Get personalized content recommendations"""
        try:
            # Build query based on user profile
            interests = user_profile.get("interests", [])
            experience_level = user_profile.get("experience_level", "beginner")
            age = user_profile.get("age", 16)
            
            # Create query string
            query_parts = []
            if interests:
                query_parts.extend(interests[:3])  # Top 3 interests
            query_parts.append(experience_level)
            
            if age < 16:
                query_parts.append("beginner")
            elif age > 18:
                query_parts.append("advanced")
            else:
                query_parts.append("intermediate")
            
            query = " ".join(query_parts)
            
            # Search for similar content
            recommendations = vector_store.search_similar(
                collection_name=collection_name,
                query_text=query,
                n_results=n_results
            )
            
            # Filter by user preferences
            filtered_recommendations = []
            for rec in recommendations:
                metadata = rec.get("metadata", {})
                
                # Check if content matches user's experience level
                content_difficulty = metadata.get("difficulty_level", "")
                if self._matches_difficulty(content_difficulty, experience_level):
                    filtered_recommendations.append(rec)
            
            return filtered_recommendations[:n_results]
            
        except Exception as e:
            logger.error(f"Error getting recommendations: {e}")
            return []
    
    def _matches_difficulty(self, content_difficulty: str, user_experience: str) -> bool:
        """Check if content difficulty matches user experience"""
        try:
            difficulty_levels = ["beginner", "intermediate", "advanced"]
            
            content_level = difficulty_levels.index(content_difficulty) if content_difficulty in difficulty_levels else 1
            user_level = difficulty_levels.index(user_experience) if user_experience in difficulty_levels else 0
            
            # Allow content that's at or slightly above user's level
            return content_level <= user_level + 1
            
        except Exception as e:
            logger.error(f"Error checking difficulty match: {e}")
            return True
    
    def _clean_text(self, text: str) -> str:
        """Clean text for embedding generation"""
        try:
            if not text:
                return ""
            
            # Remove extra whitespace
            text = " ".join(text.split())
            
            # Limit text length
            max_length = EMBEDDING_CONFIG["max_seq_length"] * 4  # Rough character limit
            if len(text) > max_length:
                text = text[:max_length] + "..."
            
            return text.strip()
            
        except Exception as e:
            logger.error(f"Error cleaning text: {e}")
            return text
    
    def update_embedding(self, content_id: str, content_data: Dict[str, Any], 
                        collection_name: str = "educational_content") -> bool:
        """Update embedding for existing content"""
        try:
            # Generate new embedding
            embedding_data = self.generate_content_embedding(content_data)
            
            if not embedding_data:
                return False
            
            # Update in vector store
            text = f"{embedding_data.get('title', '')}\n\n{embedding_data.get('summary', '')}\n\n{embedding_data.get('content', '')}"
            metadata = {
                "category": embedding_data.get("category", ""),
                "difficulty_level": embedding_data.get("difficulty_level", ""),
                "target_age": embedding_data.get("target_age", ""),
                "source": embedding_data.get("source", ""),
                "keywords": embedding_data.get("keywords", []),
                "created_at": embedding_data.get("created_at", ""),
                "embedding_model": embedding_data.get("embedding_model", ""),
                "embedding_version": embedding_data.get("embedding_version", "")
            }
            
            success = vector_store.update_document(
                collection_name=collection_name,
                document_id=content_id,
                text=text,
                metadata=metadata
            )
            
            return success
            
        except Exception as e:
            logger.error(f"Error updating embedding: {e}")
            return False
    
    def delete_embedding(self, content_id: str, collection_name: str = "educational_content") -> bool:
        """Delete embedding from vector store"""
        try:
            return vector_store.delete_document(collection_name=collection_name, document_id=content_id)
            
        except Exception as e:
            logger.error(f"Error deleting embedding: {e}")
            return False
    
    def get_embedding_stats(self, collection_name: str = "educational_content") -> Dict[str, Any]:
        """Get statistics about embeddings in vector store"""
        try:
            stats = vector_store.get_collection_stats(collection_name)
            return stats
            
        except Exception as e:
            logger.error(f"Error getting embedding stats: {e}")
            return {"error": str(e)}


# Global embedding generator instance
embedding_generator = EmbeddingGenerator()
