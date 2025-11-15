"""
Vector store for embeddings and semantic search
"""
import logging
import numpy as np
from typing import List, Dict, Any, Optional, Tuple
import chromadb
from chromadb.config import Settings
from sentence_transformers import SentenceTransformer
from config.settings import settings
from config.model_config import EMBEDDING_CONFIG, VECTOR_SEARCH_CONFIG

logger = logging.getLogger(__name__)


class VectorStore:
    """Vector store for embeddings and semantic search"""
    
    def __init__(self):
        """Initialize vector store"""
        self.client = None
        self.embedding_model = None
        self.collections = {}
        self._initialize_chroma()
        self._initialize_embedding_model()
    
    def _initialize_chroma(self):
        """Initialize ChromaDB client"""
        try:
            self.client = chromadb.PersistentClient(
                path=settings.chroma_persist_directory,
                settings=Settings(
                    anonymized_telemetry=False,
                    allow_reset=True
                )
            )
            logger.info("ChromaDB client initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize ChromaDB: {e}")
            raise
    
    def _initialize_embedding_model(self):
        """Initialize sentence transformer model"""
        try:
            self.embedding_model = SentenceTransformer(EMBEDDING_CONFIG["model_name"])
            logger.info(f"Embedding model loaded: {EMBEDDING_CONFIG['model_name']}")
            
        except Exception as e:
            logger.error(f"Failed to initialize embedding model: {e}")
            raise
    
    def _get_or_create_collection(self, collection_name: str) -> chromadb.Collection:
        """Get or create a ChromaDB collection"""
        try:
            if collection_name not in self.collections:
                self.collections[collection_name] = self.client.get_or_create_collection(
                    name=collection_name,
                    metadata={"hnsw:space": "cosine"}
                )
            return self.collections[collection_name]
            
        except Exception as e:
            logger.error(f"Error getting/creating collection {collection_name}: {e}")
            raise
    
    def generate_embedding(self, text: str) -> List[float]:
        """Generate embedding for text"""
        try:
            # Clean and prepare text
            if not text or not text.strip():
                return [0.0] * 384  # Default embedding size for all-MiniLM-L6-v2
            
            # Generate embedding
            embedding = self.embedding_model.encode(
                text,
                normalize_embeddings=EMBEDDING_CONFIG["normalize_embeddings"]
            )
            
            return embedding.tolist()
            
        except Exception as e:
            logger.error(f"Error generating embedding: {e}")
            return [0.0] * 384
    
    def add_document(self, collection_name: str, document_id: str, 
                    text: str, metadata: Dict[str, Any] = None) -> bool:
        """Add document to vector store"""
        try:
            collection = self._get_or_create_collection(collection_name)
            
            # Generate embedding
            embedding = self.generate_embedding(text)
            
            # Prepare metadata
            if metadata is None:
                metadata = {}
            
            metadata.update({
                "text": text,
                "document_id": document_id
            })
            
            # Add to collection
            collection.add(
                ids=[document_id],
                embeddings=[embedding],
                metadatas=[metadata],
                documents=[text]
            )
            
            logger.info(f"Document added to collection {collection_name}: {document_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error adding document to vector store: {e}")
            return False
    
    def add_documents_batch(self, collection_name: str, 
                           documents: List[Dict[str, Any]]) -> bool:
        """Add multiple documents to vector store"""
        try:
            collection = self._get_or_create_collection(collection_name)
            
            ids = []
            embeddings = []
            metadatas = []
            texts = []
            
            for doc in documents:
                doc_id = doc.get("id", f"doc_{len(ids)}")
                text = doc.get("text", "")
                metadata = doc.get("metadata", {})
                
                # Generate embedding
                embedding = self.generate_embedding(text)
                
                # Prepare metadata
                metadata.update({
                    "text": text,
                    "document_id": doc_id
                })
                
                ids.append(doc_id)
                embeddings.append(embedding)
                metadatas.append(metadata)
                texts.append(text)
            
            # Add batch to collection
            collection.add(
                ids=ids,
                embeddings=embeddings,
                metadatas=metadatas,
                documents=texts
            )
            
            logger.info(f"Added {len(documents)} documents to collection {collection_name}")
            return True
            
        except Exception as e:
            logger.error(f"Error adding documents batch: {e}")
            return False
    
    def search_similar(self, collection_name: str, query_text: str, 
                      n_results: int = 5, 
                      where_clause: Dict[str, Any] = None) -> List[Dict[str, Any]]:
        """Search for similar documents"""
        try:
            collection = self._get_or_create_collection(collection_name)
            
            # Generate query embedding
            query_embedding = self.generate_embedding(query_text)
            
            # Perform search
            results = collection.query(
                query_embeddings=[query_embedding],
                n_results=n_results,
                where=where_clause
            )
            
            # Format results
            formatted_results = []
            if results["ids"] and results["ids"][0]:
                for i in range(len(results["ids"][0])):
                    formatted_results.append({
                        "id": results["ids"][0][i],
                        "text": results["documents"][0][i],
                        "metadata": results["metadatas"][0][i],
                        "distance": results["distances"][0][i] if "distances" in results else None
                    })
            
            return formatted_results
            
        except Exception as e:
            logger.error(f"Error searching similar documents: {e}")
            return []
    
    def search_by_category(self, collection_name: str, category: str, 
                          query_text: str, n_results: int = 5) -> List[Dict[str, Any]]:
        """Search for documents in a specific category"""
        try:
            where_clause = {"category": category}
            return self.search_similar(collection_name, query_text, n_results, where_clause)
            
        except Exception as e:
            logger.error(f"Error searching by category: {e}")
            return []
    
    def search_by_difficulty(self, collection_name: str, difficulty: str, 
                           query_text: str, n_results: int = 5) -> List[Dict[str, Any]]:
        """Search for documents by difficulty level"""
        try:
            where_clause = {"difficulty_level": difficulty}
            return self.search_similar(collection_name, query_text, n_results, where_clause)
            
        except Exception as e:
            logger.error(f"Error searching by difficulty: {e}")
            return []
    
    def get_document(self, collection_name: str, document_id: str) -> Optional[Dict[str, Any]]:
        """Get specific document by ID"""
        try:
            collection = self._get_or_create_collection(collection_name)
            
            results = collection.get(ids=[document_id])
            
            if results["ids"]:
                return {
                    "id": results["ids"][0],
                    "text": results["documents"][0],
                    "metadata": results["metadatas"][0]
                }
            
            return None
            
        except Exception as e:
            logger.error(f"Error getting document: {e}")
            return None
    
    def update_document(self, collection_name: str, document_id: str, 
                       text: str, metadata: Dict[str, Any] = None) -> bool:
        """Update document in vector store"""
        try:
            collection = self._get_or_create_collection(collection_name)
            
            # Generate new embedding
            embedding = self.generate_embedding(text)
            
            # Prepare metadata
            if metadata is None:
                metadata = {}
            
            metadata.update({
                "text": text,
                "document_id": document_id
            })
            
            # Update document
            collection.update(
                ids=[document_id],
                embeddings=[embedding],
                metadatas=[metadata],
                documents=[text]
            )
            
            logger.info(f"Document updated in collection {collection_name}: {document_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error updating document: {e}")
            return False
    
    def delete_document(self, collection_name: str, document_id: str) -> bool:
        """Delete document from vector store"""
        try:
            collection = self._get_or_create_collection(collection_name)
            collection.delete(ids=[document_id])
            
            logger.info(f"Document deleted from collection {collection_name}: {document_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error deleting document: {e}")
            return False
    
    def get_collection_stats(self, collection_name: str) -> Dict[str, Any]:
        """Get collection statistics"""
        try:
            collection = self._get_or_create_collection(collection_name)
            count = collection.count()
            
            return {
                "collection_name": collection_name,
                "document_count": count,
                "status": "active"
            }
            
        except Exception as e:
            logger.error(f"Error getting collection stats: {e}")
            return {"collection_name": collection_name, "document_count": 0, "status": "error"}
    
    def list_collections(self) -> List[str]:
        """List all collections"""
        try:
            collections = self.client.list_collections()
            return [col.name for col in collections]
            
        except Exception as e:
            logger.error(f"Error listing collections: {e}")
            return []
    
    def delete_collection(self, collection_name: str) -> bool:
        """Delete entire collection"""
        try:
            self.client.delete_collection(collection_name)
            if collection_name in self.collections:
                del self.collections[collection_name]
            
            logger.info(f"Collection deleted: {collection_name}")
            return True
            
        except Exception as e:
            logger.error(f"Error deleting collection: {e}")
            return False
    
    def semantic_search(self, query: str, filters: Dict[str, Any] = None, 
                       limit: int = 5) -> List[Dict[str, Any]]:
        """Perform semantic search across multiple collections"""
        try:
            all_results = []
            
            # Search in educational content
            educational_results = self.search_similar("educational_content", query, limit)
            for result in educational_results:
                result["collection"] = "educational_content"
                all_results.append(result)
            
            # Search in news articles
            news_results = self.search_similar("news_articles", query, limit)
            for result in news_results:
                result["collection"] = "news_articles"
                all_results.append(result)
            
            # Apply filters if provided
            if filters:
                filtered_results = []
                for result in all_results:
                    if self._matches_filters(result, filters):
                        filtered_results.append(result)
                all_results = filtered_results
            
            # Sort by similarity score (distance)
            all_results.sort(key=lambda x: x.get("distance", 1.0))
            
            return all_results[:limit]
            
        except Exception as e:
            logger.error(f"Error in semantic search: {e}")
            return []
    
    def _matches_filters(self, result: Dict[str, Any], filters: Dict[str, Any]) -> bool:
        """Check if result matches filters"""
        try:
            metadata = result.get("metadata", {})
            
            for key, value in filters.items():
                if key in metadata:
                    if isinstance(value, list):
                        if metadata[key] not in value:
                            return False
                    else:
                        if metadata[key] != value:
                            return False
            
            return True
            
        except Exception as e:
            logger.error(f"Error checking filters: {e}")
            return False
    
    def get_recommendations(self, user_profile: Dict[str, Any], 
                          limit: int = 10) -> List[Dict[str, Any]]:
        """Get personalized content recommendations"""
        try:
            recommendations = []
            
            # Build query based on user interests
            interests = user_profile.get("interests", [])
            experience_level = user_profile.get("experience_level", "beginner")
            
            for interest in interests[:3]:  # Top 3 interests
                # Search for content matching interest and experience level
                results = self.search_by_category("educational_content", interest, 
                                                f"{interest} {experience_level}", 3)
                
                for result in results:
                    result["recommendation_reason"] = f"Matches your interest in {interest}"
                    recommendations.append(result)
            
            # Remove duplicates and sort by relevance
            unique_recommendations = []
            seen_ids = set()
            
            for rec in recommendations:
                if rec["id"] not in seen_ids:
                    unique_recommendations.append(rec)
                    seen_ids.add(rec["id"])
            
            return unique_recommendations[:limit]
            
        except Exception as e:
            logger.error(f"Error getting recommendations: {e}")
            return []


# Global vector store instance
vector_store = VectorStore()
