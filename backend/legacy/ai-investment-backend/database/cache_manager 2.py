"""
Cache manager for the AI Investment Backend
"""
import json
import logging
import pickle
from typing import Any, Dict, Optional, Union
from datetime import datetime, timedelta
import redis
from config.settings import settings

logger = logging.getLogger(__name__)


class CacheManager:
    """Redis-based cache manager for the application"""
    
    def __init__(self):
        """Initialize cache manager"""
        self.redis_client = None
        self._initialize_redis()
    
    def _initialize_redis(self):
        """Initialize Redis client"""
        try:
            self.redis_client = redis.from_url(
                settings.redis_url,
                decode_responses=False,  # We'll handle encoding/decoding manually
                socket_connect_timeout=5,
                socket_timeout=5,
                retry_on_timeout=True
            )
            
            # Test connection
            self.redis_client.ping()
            logger.info("Redis cache client initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize Redis: {e}")
            # Fallback to in-memory cache
            self.redis_client = None
            self._memory_cache = {}
            logger.warning("Using in-memory cache as fallback")
    
    def _serialize_data(self, data: Any) -> bytes:
        """Serialize data for storage"""
        try:
            return pickle.dumps(data)
        except Exception as e:
            logger.error(f"Error serializing data: {e}")
            return pickle.dumps(str(data))
    
    def _deserialize_data(self, data: bytes) -> Any:
        """Deserialize data from storage"""
        try:
            return pickle.loads(data)
        except Exception as e:
            logger.error(f"Error deserializing data: {e}")
            return None
    
    def set(self, key: str, value: Any, ttl: int = 3600) -> bool:
        """Set cache value with TTL"""
        try:
            if self.redis_client:
                serialized_value = self._serialize_data(value)
                return self.redis_client.setex(key, ttl, serialized_value)
            else:
                # In-memory cache fallback
                expire_time = datetime.utcnow() + timedelta(seconds=ttl)
                self._memory_cache[key] = {
                    "value": value,
                    "expires_at": expire_time
                }
                return True
                
        except Exception as e:
            logger.error(f"Error setting cache value: {e}")
            return False
    
    def get(self, key: str) -> Optional[Any]:
        """Get cache value"""
        try:
            if self.redis_client:
                data = self.redis_client.get(key)
                if data:
                    return self._deserialize_data(data)
                return None
            else:
                # In-memory cache fallback
                if key in self._memory_cache:
                    cache_item = self._memory_cache[key]
                    if cache_item["expires_at"] > datetime.utcnow():
                        return cache_item["value"]
                    else:
                        # Expired, remove it
                        del self._memory_cache[key]
                return None
                
        except Exception as e:
            logger.error(f"Error getting cache value: {e}")
            return None
    
    def delete(self, key: str) -> bool:
        """Delete cache value"""
        try:
            if self.redis_client:
                return bool(self.redis_client.delete(key))
            else:
                # In-memory cache fallback
                if key in self._memory_cache:
                    del self._memory_cache[key]
                    return True
                return False
                
        except Exception as e:
            logger.error(f"Error deleting cache value: {e}")
            return False
    
    def exists(self, key: str) -> bool:
        """Check if key exists in cache"""
        try:
            if self.redis_client:
                return bool(self.redis_client.exists(key))
            else:
                # In-memory cache fallback
                if key in self._memory_cache:
                    cache_item = self._memory_cache[key]
                    if cache_item["expires_at"] > datetime.utcnow():
                        return True
                    else:
                        # Expired, remove it
                        del self._memory_cache[key]
                return False
                
        except Exception as e:
            logger.error(f"Error checking cache existence: {e}")
            return False
    
    def get_ttl(self, key: str) -> int:
        """Get TTL for key"""
        try:
            if self.redis_client:
                return self.redis_client.ttl(key)
            else:
                # In-memory cache fallback
                if key in self._memory_cache:
                    cache_item = self._memory_cache[key]
                    if cache_item["expires_at"] > datetime.utcnow():
                        remaining = cache_item["expires_at"] - datetime.utcnow()
                        return int(remaining.total_seconds())
                return -1
                
        except Exception as e:
            logger.error(f"Error getting TTL: {e}")
            return -1
    
    def set_hash(self, key: str, field: str, value: Any, ttl: int = 3600) -> bool:
        """Set hash field value"""
        try:
            if self.redis_client:
                serialized_value = self._serialize_data(value)
                result = self.redis_client.hset(key, field, serialized_value)
                self.redis_client.expire(key, ttl)
                return bool(result)
            else:
                # In-memory cache fallback
                if key not in self._memory_cache:
                    self._memory_cache[key] = {
                        "value": {},
                        "expires_at": datetime.utcnow() + timedelta(seconds=ttl)
                    }
                self._memory_cache[key]["value"][field] = value
                return True
                
        except Exception as e:
            logger.error(f"Error setting hash field: {e}")
            return False
    
    def get_hash(self, key: str, field: str) -> Optional[Any]:
        """Get hash field value"""
        try:
            if self.redis_client:
                data = self.redis_client.hget(key, field)
                if data:
                    return self._deserialize_data(data)
                return None
            else:
                # In-memory cache fallback
                if key in self._memory_cache:
                    cache_item = self._memory_cache[key]
                    if cache_item["expires_at"] > datetime.utcnow():
                        return cache_item["value"].get(field)
                    else:
                        del self._memory_cache[key]
                return None
                
        except Exception as e:
            logger.error(f"Error getting hash field: {e}")
            return None
    
    def get_all_hash(self, key: str) -> Optional[Dict[str, Any]]:
        """Get all hash fields"""
        try:
            if self.redis_client:
                data = self.redis_client.hgetall(key)
                if data:
                    return {k.decode(): self._deserialize_data(v) for k, v in data.items()}
                return None
            else:
                # In-memory cache fallback
                if key in self._memory_cache:
                    cache_item = self._memory_cache[key]
                    if cache_item["expires_at"] > datetime.utcnow():
                        return cache_item["value"].copy()
                    else:
                        del self._memory_cache[key]
                return None
                
        except Exception as e:
            logger.error(f"Error getting all hash fields: {e}")
            return None
    
    def increment(self, key: str, amount: int = 1, ttl: int = 3600) -> Optional[int]:
        """Increment counter"""
        try:
            if self.redis_client:
                result = self.redis_client.incrby(key, amount)
                self.redis_client.expire(key, ttl)
                return result
            else:
                # In-memory cache fallback
                current_value = self.get(key) or 0
                new_value = current_value + amount
                self.set(key, new_value, ttl)
                return new_value
                
        except Exception as e:
            logger.error(f"Error incrementing counter: {e}")
            return None
    
    def expire(self, key: str, ttl: int) -> bool:
        """Set expiration for key"""
        try:
            if self.redis_client:
                return bool(self.redis_client.expire(key, ttl))
            else:
                # In-memory cache fallback
                if key in self._memory_cache:
                    self._memory_cache[key]["expires_at"] = datetime.utcnow() + timedelta(seconds=ttl)
                    return True
                return False
                
        except Exception as e:
            logger.error(f"Error setting expiration: {e}")
            return False
    
    def clear_pattern(self, pattern: str) -> int:
        """Clear keys matching pattern"""
        try:
            if self.redis_client:
                keys = self.redis_client.keys(pattern)
                if keys:
                    return self.redis_client.delete(*keys)
                return 0
            else:
                # In-memory cache fallback
                import fnmatch
                keys_to_delete = [k for k in self._memory_cache.keys() if fnmatch.fnmatch(k, pattern)]
                for key in keys_to_delete:
                    del self._memory_cache[key]
                return len(keys_to_delete)
                
        except Exception as e:
            logger.error(f"Error clearing pattern: {e}")
            return 0
    
    def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        try:
            if self.redis_client:
                info = self.redis_client.info()
                return {
                    "type": "redis",
                    "connected_clients": info.get("connected_clients", 0),
                    "used_memory": info.get("used_memory_human", "0B"),
                    "keyspace_hits": info.get("keyspace_hits", 0),
                    "keyspace_misses": info.get("keyspace_misses", 0),
                    "total_commands_processed": info.get("total_commands_processed", 0)
                }
            else:
                # In-memory cache stats
                return {
                    "type": "memory",
                    "total_keys": len(self._memory_cache),
                    "memory_usage": "unknown"
                }
                
        except Exception as e:
            logger.error(f"Error getting cache stats: {e}")
            return {"type": "error", "error": str(e)}


# Cache decorator for functions
def cache_result(ttl: int = 3600, key_prefix: str = ""):
    """Decorator to cache function results"""
    def decorator(func):
        def wrapper(*args, **kwargs):
            # Generate cache key
            cache_key = f"{key_prefix}:{func.__name__}:{hash(str(args) + str(kwargs))}"
            
            # Try to get from cache
            cached_result = cache_manager.get(cache_key)
            if cached_result is not None:
                logger.debug(f"Cache hit for {cache_key}")
                return cached_result
            
            # Execute function and cache result
            result = func(*args, **kwargs)
            cache_manager.set(cache_key, result, ttl)
            logger.debug(f"Cached result for {cache_key}")
            
            return result
        return wrapper
    return decorator


# Global cache manager instance
cache_manager = CacheManager()
