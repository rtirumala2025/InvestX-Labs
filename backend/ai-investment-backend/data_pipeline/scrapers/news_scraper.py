"""
News scraper for financial and investment education news
"""
import logging
import requests
import feedparser
from bs4 import BeautifulSoup
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import time
import re
from config.settings import settings

logger = logging.getLogger(__name__)


class NewsScraper:
    """Financial news scraper for investment education"""
    
    def __init__(self):
        """Initialize news scraper"""
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        })
        
        # Financial news RSS feeds
        self.rss_feeds = [
            "https://feeds.finance.yahoo.com/rss/2.0/headline",
            "https://feeds.marketwatch.com/marketwatch/topstories/",
            "https://feeds.reuters.com/news/wealth",
            "https://feeds.bloomberg.com/markets/news.rss",
            "https://feeds.finance.yahoo.com/rss/2.0/headline?s=AAPL&region=US&lang=en-US",
            "https://feeds.finance.yahoo.com/rss/2.0/headline?s=GOOGL&region=US&lang=en-US",
            "https://feeds.finance.yahoo.com/rss/2.0/headline?s=TSLA&region=US&lang=en-US"
        ]
        
        # Financial news websites
        self.news_sites = [
            {
                "name": "Yahoo Finance",
                "url": "https://finance.yahoo.com/news/",
                "selectors": {
                    "articles": "h3 a",
                    "title": "h3",
                    "summary": ".C(#959595)"
                }
            },
            {
                "name": "MarketWatch",
                "url": "https://www.marketwatch.com/latest-news",
                "selectors": {
                    "articles": ".article__headline a",
                    "title": ".article__headline",
                    "summary": ".article__summary"
                }
            }
        ]
    
    def scrape_rss_feeds(self, max_articles_per_feed: int = 10) -> List[Dict[str, Any]]:
        """Scrape news from RSS feeds"""
        try:
            all_articles = []
            
            for feed_url in self.rss_feeds:
                try:
                    articles = self._scrape_rss_feed(feed_url, max_articles_per_feed)
                    all_articles.extend(articles)
                    time.sleep(1)  # Be respectful to servers
                    
                except Exception as e:
                    logger.error(f"Error scraping RSS feed {feed_url}: {e}")
                    continue
            
            logger.info(f"Scraped {len(all_articles)} articles from RSS feeds")
            return all_articles
            
        except Exception as e:
            logger.error(f"Error scraping RSS feeds: {e}")
            return []
    
    def scrape_news_sites(self, max_articles_per_site: int = 10) -> List[Dict[str, Any]]:
        """Scrape news from financial news websites"""
        try:
            all_articles = []
            
            for site in self.news_sites:
                try:
                    articles = self._scrape_news_site(site, max_articles_per_site)
                    all_articles.extend(articles)
                    time.sleep(2)  # Be respectful to servers
                    
                except Exception as e:
                    logger.error(f"Error scraping news site {site['name']}: {e}")
                    continue
            
            logger.info(f"Scraped {len(all_articles)} articles from news sites")
            return all_articles
            
        except Exception as e:
            logger.error(f"Error scraping news sites: {e}")
            return []
    
    def _scrape_rss_feed(self, feed_url: str, max_articles: int) -> List[Dict[str, Any]]:
        """Scrape a single RSS feed"""
        try:
            feed = feedparser.parse(feed_url)
            articles = []
            
            for entry in feed.entries[:max_articles]:
                # Extract article data
                article_data = {
                    "title": entry.get("title", ""),
                    "summary": entry.get("summary", ""),
                    "url": entry.get("link", ""),
                    "published": self._parse_date(entry.get("published", "")),
                    "source": feed.feed.get("title", "RSS Feed"),
                    "author": entry.get("author", ""),
                    "tags": [tag.term for tag in entry.get("tags", [])],
                    "scraped_at": datetime.utcnow().isoformat()
                }
                
                # Get full article content if URL is available
                if article_data["url"]:
                    full_content = self._scrape_article_content(article_data["url"])
                    if full_content:
                        article_data["content"] = full_content
                        article_data["keywords"] = self._extract_keywords(full_content)
                        article_data["estimated_read_time"] = self._calculate_read_time(full_content)
                
                # Filter for teen-relevant content
                if self._is_teen_relevant(article_data):
                    articles.append(article_data)
            
            return articles
            
        except Exception as e:
            logger.error(f"Error scraping RSS feed {feed_url}: {e}")
            return []
    
    def _scrape_news_site(self, site: Dict[str, Any], max_articles: int) -> List[Dict[str, Any]]:
        """Scrape a single news website"""
        try:
            response = self.session.get(site["url"], timeout=10)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            articles = []
            
            # Find article links
            article_links = soup.select(site["selectors"]["articles"])
            
            for link in article_links[:max_articles]:
                try:
                    article_url = link.get('href')
                    if not article_url:
                        continue
                    
                    # Make URL absolute
                    if article_url.startswith('/'):
                        article_url = site["url"] + article_url
                    
                    # Get article content
                    article_data = self._scrape_article_content(article_url)
                    if article_data:
                        article_data.update({
                            "source": site["name"],
                            "scraped_at": datetime.utcnow().isoformat()
                        })
                        
                        # Filter for teen-relevant content
                        if self._is_teen_relevant(article_data):
                            articles.append(article_data)
                    
                    time.sleep(0.5)  # Be respectful
                    
                except Exception as e:
                    logger.warning(f"Error scraping article from {site['name']}: {e}")
                    continue
            
            return articles
            
        except Exception as e:
            logger.error(f"Error scraping news site {site['name']}: {e}")
            return []
    
    def _scrape_article_content(self, url: str) -> Optional[Dict[str, Any]]:
        """Scrape full article content from URL"""
        try:
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Extract title
            title_elem = soup.find('h1') or soup.find('title')
            title = title_elem.get_text().strip() if title_elem else ""
            
            # Extract content - try multiple selectors
            content_selectors = [
                'article',
                '.article-content',
                '.story-body',
                '.article-body',
                '.content',
                'main',
                '.post-content'
            ]
            
            content = ""
            for selector in content_selectors:
                content_elem = soup.select_one(selector)
                if content_elem:
                    content = self._extract_text_content(content_elem)
                    if len(content) > 200:  # Found substantial content
                        break
            
            if not content or len(content) < 100:
                return None
            
            # Extract summary
            summary_elem = soup.find('meta', attrs={'name': 'description'}) or \
                          soup.find('meta', attrs={'property': 'og:description'})
            summary = summary_elem.get('content', '') if summary_elem else ""
            
            # Extract published date
            date_elem = soup.find('time') or soup.find('meta', attrs={'property': 'article:published_time'})
            published_date = ""
            if date_elem:
                if date_elem.get('datetime'):
                    published_date = date_elem.get('datetime')
                else:
                    published_date = date_elem.get_text().strip()
            
            return {
                "title": title,
                "content": content,
                "summary": summary,
                "url": url,
                "published": self._parse_date(published_date),
                "keywords": self._extract_keywords(content),
                "estimated_read_time": self._calculate_read_time(content)
            }
            
        except Exception as e:
            logger.error(f"Error scraping article content from {url}: {e}")
            return None
    
    def _extract_text_content(self, element) -> str:
        """Extract clean text content from HTML element"""
        try:
            # Remove script and style elements
            for script in element(["script", "style", "nav", "footer", "header", "aside"]):
                script.decompose()
            
            # Get text and clean it up
            text = element.get_text()
            lines = (line.strip() for line in text.splitlines())
            chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
            text = ' '.join(chunk for chunk in chunks if chunk)
            
            return text
            
        except Exception as e:
            logger.error(f"Error extracting text content: {e}")
            return ""
    
    def _parse_date(self, date_string: str) -> str:
        """Parse date string to ISO format"""
        try:
            if not date_string:
                return datetime.utcnow().isoformat()
            
            # Try different date formats
            date_formats = [
                "%a, %d %b %Y %H:%M:%S %Z",
                "%Y-%m-%dT%H:%M:%S%z",
                "%Y-%m-%d %H:%M:%S",
                "%Y-%m-%d",
                "%B %d, %Y",
                "%b %d, %Y"
            ]
            
            for fmt in date_formats:
                try:
                    parsed_date = datetime.strptime(date_string, fmt)
                    return parsed_date.isoformat()
                except ValueError:
                    continue
            
            # If all formats fail, return current time
            return datetime.utcnow().isoformat()
            
        except Exception as e:
            logger.error(f"Error parsing date {date_string}: {e}")
            return datetime.utcnow().isoformat()
    
    def _extract_keywords(self, content: str) -> List[str]:
        """Extract keywords from content"""
        try:
            # Financial and investment keywords
            financial_keywords = [
                'stock', 'stocks', 'bond', 'bonds', 'etf', 'etfs', 'mutual fund', 'mutual funds',
                'portfolio', 'diversification', 'risk', 'return', 'dividend', 'dividends',
                'market', 'investing', 'investment', 'investor', 'investors', 'trading',
                'brokerage', 'index fund', 'index funds', 'savings', 'retirement',
                'compound interest', 'asset allocation', 'volatility', 'liquidity',
                'earnings', 'revenue', 'profit', 'loss', 'growth', 'decline',
                'bull market', 'bear market', 'recession', 'inflation', 'interest rate'
            ]
            
            content_lower = content.lower()
            found_keywords = [keyword for keyword in financial_keywords if keyword in content_lower]
            
            return list(set(found_keywords))[:10]  # Return unique keywords, max 10
            
        except Exception as e:
            logger.error(f"Error extracting keywords: {e}")
            return []
    
    def _calculate_read_time(self, content: str) -> int:
        """Calculate estimated read time in minutes"""
        try:
            words_per_minute = 200  # Average reading speed
            word_count = len(content.split())
            read_time = max(1, word_count // words_per_minute)
            return read_time
            
        except Exception as e:
            logger.error(f"Error calculating read time: {e}")
            return 1
    
    def _is_teen_relevant(self, article: Dict[str, Any]) -> bool:
        """Check if article is relevant for teens"""
        try:
            title = article.get("title", "").lower()
            content = article.get("content", "").lower()
            summary = article.get("summary", "").lower()
            
            # Teen-relevant keywords
            teen_keywords = [
                'beginner', 'start', 'first', 'young', 'teen', 'student', 'college',
                'savings', 'budget', 'part-time', 'job', 'allowance', 'money',
                'learn', 'education', 'tutorial', 'guide', 'how to', 'tips',
                'simple', 'easy', 'basic', 'fundamentals', 'introduction'
            ]
            
            # Check for teen-relevant content
            text_to_check = f"{title} {summary} {content}"
            
            # Must contain at least one teen-relevant keyword
            has_teen_keyword = any(keyword in text_to_check for keyword in teen_keywords)
            
            # Must not be too advanced (avoid complex financial instruments)
            advanced_keywords = [
                'derivatives', 'options', 'futures', 'hedge fund', 'private equity',
                'leverage', 'margin', 'short selling', 'arbitrage', 'quantitative'
            ]
            
            has_advanced_keyword = any(keyword in text_to_check for keyword in advanced_keywords)
            
            # Article is relevant if it has teen keywords and is not too advanced
            return has_teen_keyword and not has_advanced_keyword
            
        except Exception as e:
            logger.error(f"Error checking teen relevance: {e}")
            return False
    
    def get_teen_focused_news(self, max_articles: int = 20) -> List[Dict[str, Any]]:
        """Get news articles specifically focused on teen investors"""
        try:
            all_articles = []
            
            # Scrape from RSS feeds
            rss_articles = self.scrape_rss_feeds(max_articles // 2)
            all_articles.extend(rss_articles)
            
            # Scrape from news sites
            site_articles = self.scrape_news_sites(max_articles // 2)
            all_articles.extend(site_articles)
            
            # Remove duplicates based on URL
            unique_articles = []
            seen_urls = set()
            
            for article in all_articles:
                url = article.get("url", "")
                if url and url not in seen_urls:
                    unique_articles.append(article)
                    seen_urls.add(url)
            
            # Sort by published date (newest first)
            unique_articles.sort(key=lambda x: x.get("published", ""), reverse=True)
            
            logger.info(f"Retrieved {len(unique_articles)} unique teen-focused news articles")
            return unique_articles[:max_articles]
            
        except Exception as e:
            logger.error(f"Error getting teen-focused news: {e}")
            return []
    
    def get_stock_specific_news(self, symbol: str, max_articles: int = 10) -> List[Dict[str, Any]]:
        """Get news articles about a specific stock"""
        try:
            # Use Yahoo Finance RSS feed for specific stock
            feed_url = f"https://feeds.finance.yahoo.com/rss/2.0/headline?s={symbol}&region=US&lang=en-US"
            
            articles = self._scrape_rss_feed(feed_url, max_articles)
            
            # Add stock symbol to each article
            for article in articles:
                article["related_stock"] = symbol
            
            logger.info(f"Retrieved {len(articles)} news articles for {symbol}")
            return articles
            
        except Exception as e:
            logger.error(f"Error getting stock-specific news for {symbol}: {e}")
            return []


# Global news scraper instance
news_scraper = NewsScraper()
