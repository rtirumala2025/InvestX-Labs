"""
Data cleaner for removing duplicates, validating, and normalizing content
"""
import logging
import hashlib
import re
from typing import List, Dict, Any, Optional, Set
from datetime import datetime
from urllib.parse import urlparse
import difflib

logger = logging.getLogger(__name__)


class DataCleaner:
    """Data cleaner for educational content"""
    
    def __init__(self):
        """Initialize data cleaner"""
        self.seen_hashes: Set[str] = set()
        self.seen_urls: Set[str] = set()
        self.similarity_threshold = 0.8
    
    def clean_content_list(self, content_list: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Clean a list of content items"""
        try:
            logger.info(f"Starting to clean {len(content_list)} content items")
            
            # Step 1: Remove duplicates
            deduplicated_content = self._remove_duplicates(content_list)
            logger.info(f"After deduplication: {len(deduplicated_content)} items")
            
            # Step 2: Validate content
            validated_content = self._validate_content(deduplicated_content)
            logger.info(f"After validation: {len(validated_content)} items")
            
            # Step 3: Normalize content
            normalized_content = self._normalize_content(validated_content)
            logger.info(f"After normalization: {len(normalized_content)} items")
            
            # Step 4: Remove similar content
            final_content = self._remove_similar_content(normalized_content)
            logger.info(f"Final cleaned content: {len(final_content)} items")
            
            return final_content
            
        except Exception as e:
            logger.error(f"Error cleaning content list: {e}")
            return content_list
    
    def _remove_duplicates(self, content_list: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Remove duplicate content based on URL and content hash"""
        try:
            unique_content = []
            
            for content_item in content_list:
                # Check URL duplicates
                url = content_item.get("url", "")
                if url and url in self.seen_urls:
                    logger.debug(f"Skipping duplicate URL: {url}")
                    continue
                
                # Check content hash duplicates
                content_hash = self._generate_content_hash(content_item)
                if content_hash in self.seen_hashes:
                    logger.debug(f"Skipping duplicate content hash: {content_hash}")
                    continue
                
                # Add to unique content
                unique_content.append(content_item)
                self.seen_urls.add(url)
                self.seen_hashes.add(content_hash)
            
            return unique_content
            
        except Exception as e:
            logger.error(f"Error removing duplicates: {e}")
            return content_list
    
    def _validate_content(self, content_list: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Validate content items"""
        try:
            validated_content = []
            
            for content_item in content_list:
                if self._is_valid_content(content_item):
                    validated_content.append(content_item)
                else:
                    logger.debug(f"Skipping invalid content: {content_item.get('title', 'No title')}")
            
            return validated_content
            
        except Exception as e:
            logger.error(f"Error validating content: {e}")
            return content_list
    
    def _normalize_content(self, content_list: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Normalize content items"""
        try:
            normalized_content = []
            
            for content_item in content_list:
                normalized_item = self._normalize_single_content(content_item)
                normalized_content.append(normalized_item)
            
            return normalized_content
            
        except Exception as e:
            logger.error(f"Error normalizing content: {e}")
            return content_list
    
    def _remove_similar_content(self, content_list: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Remove similar content using text similarity"""
        try:
            if len(content_list) <= 1:
                return content_list
            
            unique_content = []
            
            for i, content_item in enumerate(content_list):
                is_similar = False
                
                # Check similarity with already processed items
                for existing_item in unique_content:
                    if self._are_similar(content_item, existing_item):
                        logger.debug(f"Removing similar content: {content_item.get('title', 'No title')}")
                        is_similar = True
                        break
                
                if not is_similar:
                    unique_content.append(content_item)
            
            return unique_content
            
        except Exception as e:
            logger.error(f"Error removing similar content: {e}")
            return content_list
    
    def _generate_content_hash(self, content_item: Dict[str, Any]) -> str:
        """Generate hash for content item"""
        try:
            # Combine title and content for hashing
            title = content_item.get("title", "")
            content = content_item.get("content", "")
            url = content_item.get("url", "")
            
            # Create hash string
            hash_string = f"{title}|{content[:500]}|{url}"
            
            # Generate MD5 hash
            content_hash = hashlib.md5(hash_string.encode('utf-8')).hexdigest()
            
            return content_hash
            
        except Exception as e:
            logger.error(f"Error generating content hash: {e}")
            return ""
    
    def _is_valid_content(self, content_item: Dict[str, Any]) -> bool:
        """Check if content item is valid"""
        try:
            # Check required fields
            title = content_item.get("title", "")
            content = content_item.get("content", "")
            
            if not title or not content:
                return False
            
            # Check minimum content length
            if len(content.strip()) < 100:
                return False
            
            # Check for valid URL if present
            url = content_item.get("url", "")
            if url and not self._is_valid_url(url):
                return False
            
            # Check for spam indicators
            if self._is_spam_content(content_item):
                return False
            
            return True
            
        except Exception as e:
            logger.error(f"Error validating content: {e}")
            return False
    
    def _is_valid_url(self, url: str) -> bool:
        """Check if URL is valid"""
        try:
            parsed = urlparse(url)
            return bool(parsed.scheme and parsed.netloc)
        except Exception:
            return False
    
    def _is_spam_content(self, content_item: Dict[str, Any]) -> bool:
        """Check for spam indicators"""
        try:
            title = content_item.get("title", "").lower()
            content = content_item.get("content", "").lower()
            
            # Spam indicators
            spam_keywords = [
                "click here", "buy now", "limited time", "act now",
                "free money", "get rich quick", "guaranteed returns",
                "no risk", "secret formula", "insider tip"
            ]
            
            # Check for spam keywords
            text_to_check = f"{title} {content}"
            spam_count = sum(1 for keyword in spam_keywords if keyword in text_to_check)
            
            # If more than 2 spam keywords, likely spam
            if spam_count > 2:
                return True
            
            # Check for excessive promotional language
            promotional_words = ["buy", "sell", "invest", "profit", "earn", "money"]
            promotional_count = sum(1 for word in promotional_words if word in text_to_check)
            
            # If too many promotional words relative to content length, might be spam
            if promotional_count > len(text_to_check.split()) * 0.1:  # More than 10% promotional words
                return True
            
            return False
            
        except Exception as e:
            logger.error(f"Error checking spam content: {e}")
            return False
    
    def _normalize_single_content(self, content_item: Dict[str, Any]) -> Dict[str, Any]:
        """Normalize a single content item"""
        try:
            normalized_item = content_item.copy()
            
            # Normalize title
            title = content_item.get("title", "")
            normalized_item["title"] = self._normalize_text(title)
            
            # Normalize content
            content = content_item.get("content", "")
            normalized_item["content"] = self._normalize_text(content)
            
            # Normalize summary
            summary = content_item.get("summary", "")
            if summary:
                normalized_item["summary"] = self._normalize_text(summary)
            
            # Normalize URL
            url = content_item.get("url", "")
            if url:
                normalized_item["url"] = self._normalize_url(url)
            
            # Normalize source
            source = content_item.get("source", "")
            if source:
                normalized_item["source"] = self._normalize_source(source)
            
            # Add normalization metadata
            normalized_item["normalized_at"] = datetime.utcnow().isoformat()
            normalized_item["normalization_version"] = "1.0"
            
            return normalized_item
            
        except Exception as e:
            logger.error(f"Error normalizing single content: {e}")
            return content_item
    
    def _normalize_text(self, text: str) -> str:
        """Normalize text content"""
        try:
            if not text:
                return ""
            
            # Remove extra whitespace
            text = re.sub(r'\s+', ' ', text)
            
            # Remove HTML tags if any
            text = re.sub(r'<[^>]+>', '', text)
            
            # Normalize quotes
            text = text.replace('"', '"').replace('"', '"')
            text = text.replace(''', "'").replace(''', "'")
            
            # Remove excessive punctuation
            text = re.sub(r'[!]{2,}', '!', text)
            text = re.sub(r'[?]{2,}', '?', text)
            text = re.sub(r'[.]{3,}', '...', text)
            
            # Remove leading/trailing whitespace
            text = text.strip()
            
            return text
            
        except Exception as e:
            logger.error(f"Error normalizing text: {e}")
            return text
    
    def _normalize_url(self, url: str) -> str:
        """Normalize URL"""
        try:
            if not url:
                return ""
            
            # Remove common tracking parameters
            tracking_params = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content']
            parsed = urlparse(url)
            
            if parsed.query:
                from urllib.parse import parse_qs, urlencode, urlunparse
                query_params = parse_qs(parsed.query)
                
                # Remove tracking parameters
                for param in tracking_params:
                    query_params.pop(param, None)
                
                # Rebuild URL
                new_query = urlencode(query_params, doseq=True)
                url = urlunparse((parsed.scheme, parsed.netloc, parsed.path, parsed.params, new_query, parsed.fragment))
            
            return url
            
        except Exception as e:
            logger.error(f"Error normalizing URL: {e}")
            return url
    
    def _normalize_source(self, source: str) -> str:
        """Normalize source name"""
        try:
            if not source:
                return ""
            
            # Common source normalizations
            source_mappings = {
                "yahoo finance": "Yahoo Finance",
                "marketwatch": "MarketWatch",
                "reuters": "Reuters",
                "bloomberg": "Bloomberg",
                "sec": "SEC",
                "khan academy": "Khan Academy",
                "investopedia": "Investopedia"
            }
            
            source_lower = source.lower().strip()
            return source_mappings.get(source_lower, source.title())
            
        except Exception as e:
            logger.error(f"Error normalizing source: {e}")
            return source
    
    def _are_similar(self, content1: Dict[str, Any], content2: Dict[str, Any]) -> bool:
        """Check if two content items are similar"""
        try:
            # Compare titles
            title1 = content1.get("title", "")
            title2 = content2.get("title", "")
            
            if title1 and title2:
                title_similarity = difflib.SequenceMatcher(None, title1.lower(), title2.lower()).ratio()
                if title_similarity > self.similarity_threshold:
                    return True
            
            # Compare content (first 500 characters)
            content1_text = content1.get("content", "")[:500]
            content2_text = content2.get("content", "")[:500]
            
            if content1_text and content2_text:
                content_similarity = difflib.SequenceMatcher(None, content1_text.lower(), content2_text.lower()).ratio()
                if content_similarity > self.similarity_threshold:
                    return True
            
            return False
            
        except Exception as e:
            logger.error(f"Error checking similarity: {e}")
            return False
    
    def clean_market_data(self, market_data_list: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Clean market data"""
        try:
            cleaned_data = []
            
            for data_item in market_data_list:
                if self._is_valid_market_data(data_item):
                    cleaned_item = self._normalize_market_data(data_item)
                    cleaned_data.append(cleaned_item)
            
            return cleaned_data
            
        except Exception as e:
            logger.error(f"Error cleaning market data: {e}")
            return market_data_list
    
    def _is_valid_market_data(self, data_item: Dict[str, Any]) -> bool:
        """Check if market data is valid"""
        try:
            # Check required fields
            symbol = data_item.get("symbol", "")
            current_price = data_item.get("current_price")
            
            if not symbol or current_price is None:
                return False
            
            # Check for reasonable price values
            if current_price <= 0 or current_price > 1000000:  # Unreasonable price
                return False
            
            return True
            
        except Exception as e:
            logger.error(f"Error validating market data: {e}")
            return False
    
    def _normalize_market_data(self, data_item: Dict[str, Any]) -> Dict[str, Any]:
        """Normalize market data"""
        try:
            normalized_item = data_item.copy()
            
            # Normalize symbol
            symbol = data_item.get("symbol", "")
            normalized_item["symbol"] = symbol.upper().strip()
            
            # Round numeric values
            numeric_fields = ["current_price", "price_change", "percent_change", "pe_ratio", "dividend_yield"]
            for field in numeric_fields:
                if field in normalized_item and normalized_item[field] is not None:
                    try:
                        normalized_item[field] = round(float(normalized_item[field]), 2)
                    except (ValueError, TypeError):
                        normalized_item[field] = None
            
            # Normalize volume
            volume = data_item.get("volume")
            if volume is not None:
                try:
                    normalized_item["volume"] = int(volume)
                except (ValueError, TypeError):
                    normalized_item["volume"] = None
            
            # Add normalization timestamp
            normalized_item["normalized_at"] = datetime.utcnow().isoformat()
            
            return normalized_item
            
        except Exception as e:
            logger.error(f"Error normalizing market data: {e}")
            return data_item
    
    def get_cleaning_stats(self, original_count: int, cleaned_count: int) -> Dict[str, Any]:
        """Get cleaning statistics"""
        try:
            return {
                "original_count": original_count,
                "cleaned_count": cleaned_count,
                "removed_count": original_count - cleaned_count,
                "removal_rate": round((original_count - cleaned_count) / original_count * 100, 2) if original_count > 0 else 0,
                "cleaning_timestamp": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error getting cleaning stats: {e}")
            return {}


# Global data cleaner instance
data_cleaner = DataCleaner()


def is_content_safe(self, content: str) -> bool:
    """
    Run semantic and heuristic checks to detect unsafe content.
    """
    try:
        # Basic checks
        if not content or len(content.strip()) == 0:
            return False

        # Example heuristic: block content with banned keywords
        banned_keywords = ['gamble', 'scam', 'illegal']
        if any(keyword in content.lower() for keyword in banned_keywords):
            return False

        # TODO: Integrate semantic moderation API call here
        # e.g., response = moderation_api.check(content)
        # if response.flagged:
        #     return False

        return True

    except Exception as e:
        logger.error(f"Error during content safety check: {e}")
        return False
