"""
Content scraper for educational investment content from various sources
"""
import logging
import requests
from bs4 import BeautifulSoup
from typing import List, Dict, Any, Optional
from urllib.parse import urljoin, urlparse
import time
import re
from datetime import datetime
from config.settings import settings

logger = logging.getLogger(__name__)


class ContentScraper:
    """Scraper for educational investment content"""
    
    def __init__(self):
        """Initialize content scraper"""
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        })
        self.scraped_urls = set()
    
    def scrape_sec_content(self, max_pages: int = 5) -> List[Dict[str, Any]]:
        """Scrape educational content from SEC.gov"""
        try:
            content_items = []
            base_url = "https://www.sec.gov"
            
            # SEC Investor Education pages
            education_urls = [
                "/investor/education",
                "/investor/education/beginner",
                "/investor/education/intermediate",
                "/investor/education/advanced"
            ]
            
            for url_path in education_urls:
                full_url = urljoin(base_url, url_path)
                page_content = self._scrape_page(full_url)
                
                if page_content:
                    # Extract articles and resources
                    articles = self._extract_sec_articles(page_content, base_url)
                    content_items.extend(articles)
                    
                    time.sleep(1)  # Be respectful to the server
            
            logger.info(f"Scraped {len(content_items)} SEC content items")
            return content_items[:max_pages * 10]  # Limit results
            
        except Exception as e:
            logger.error(f"Error scraping SEC content: {e}")
            return []
    
    def scrape_khan_academy_content(self, max_pages: int = 5) -> List[Dict[str, Any]]:
        """Scrape financial education content from Khan Academy"""
        try:
            content_items = []
            base_url = "https://www.khanacademy.org"
            
            # Khan Academy finance and economics sections
            finance_urls = [
                "/economics-finance-domain/core-finance",
                "/economics-finance-domain/macroeconomics",
                "/economics-finance-domain/microeconomics"
            ]
            
            for url_path in finance_urls:
                full_url = urljoin(base_url, url_path)
                page_content = self._scrape_page(full_url)
                
                if page_content:
                    # Extract lessons and articles
                    lessons = self._extract_khan_lessons(page_content, base_url)
                    content_items.extend(lessons)
                    
                    time.sleep(1)
            
            logger.info(f"Scraped {len(content_items)} Khan Academy content items")
            return content_items[:max_pages * 10]
            
        except Exception as e:
            logger.error(f"Error scraping Khan Academy content: {e}")
            return []
    
    def scrape_investopedia_content(self, max_pages: int = 5) -> List[Dict[str, Any]]:
        """Scrape educational content from Investopedia"""
        try:
            content_items = []
            base_url = "https://www.investopedia.com"
            
            # Investopedia educational sections
            education_urls = [
                "/investing/",
                "/investing/basics/",
                "/investing/strategies/",
                "/investing/analysis/",
                "/investing/portfolio-management/"
            ]
            
            for url_path in education_urls:
                full_url = urljoin(base_url, url_path)
                page_content = self._scrape_page(full_url)
                
                if page_content:
                    # Extract articles
                    articles = self._extract_investopedia_articles(page_content, base_url)
                    content_items.extend(articles)
                    
                    time.sleep(1)
            
            logger.info(f"Scraped {len(content_items)} Investopedia content items")
            return content_items[:max_pages * 10]
            
        except Exception as e:
            logger.error(f"Error scraping Investopedia content: {e}")
            return []
    
    def _scrape_page(self, url: str) -> Optional[BeautifulSoup]:
        """Scrape a single page and return BeautifulSoup object"""
        try:
            if url in self.scraped_urls:
                return None
            
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            
            self.scraped_urls.add(url)
            return BeautifulSoup(response.content, 'html.parser')
            
        except Exception as e:
            logger.error(f"Error scraping page {url}: {e}")
            return None
    
    def _extract_sec_articles(self, soup: BeautifulSoup, base_url: str) -> List[Dict[str, Any]]:
        """Extract articles from SEC pages"""
        articles = []
        
        try:
            # Look for article links and content
            article_links = soup.find_all('a', href=True)
            
            for link in article_links:
                href = link.get('href')
                if href and ('article' in href.lower() or 'guide' in href.lower() or 'education' in href.lower()):
                    full_url = urljoin(base_url, href)
                    
                    # Get article content
                    article_soup = self._scrape_page(full_url)
                    if article_soup:
                        article_data = self._parse_sec_article(article_soup, full_url)
                        if article_data:
                            articles.append(article_data)
            
            return articles
            
        except Exception as e:
            logger.error(f"Error extracting SEC articles: {e}")
            return []
    
    def _extract_khan_lessons(self, soup: BeautifulSoup, base_url: str) -> List[Dict[str, Any]]:
        """Extract lessons from Khan Academy pages"""
        lessons = []
        
        try:
            # Look for lesson links
            lesson_links = soup.find_all('a', href=True)
            
            for link in lesson_links:
                href = link.get('href')
                if href and ('lesson' in href.lower() or 'video' in href.lower() or 'article' in href.lower()):
                    full_url = urljoin(base_url, href)
                    
                    # Get lesson content
                    lesson_soup = self._scrape_page(full_url)
                    if lesson_soup:
                        lesson_data = self._parse_khan_lesson(lesson_soup, full_url)
                        if lesson_data:
                            lessons.append(lesson_data)
            
            return lessons
            
        except Exception as e:
            logger.error(f"Error extracting Khan Academy lessons: {e}")
            return []
    
    def _extract_investopedia_articles(self, soup: BeautifulSoup, base_url: str) -> List[Dict[str, Any]]:
        """Extract articles from Investopedia pages"""
        articles = []
        
        try:
            # Look for article links
            article_links = soup.find_all('a', href=True)
            
            for link in article_links:
                href = link.get('href')
                if href and ('article' in href.lower() or 'definition' in href.lower() or 'tutorial' in href.lower()):
                    full_url = urljoin(base_url, href)
                    
                    # Get article content
                    article_soup = self._scrape_page(full_url)
                    if article_soup:
                        article_data = self._parse_investopedia_article(article_soup, full_url)
                        if article_data:
                            articles.append(article_data)
            
            return articles
            
        except Exception as e:
            logger.error(f"Error extracting Investopedia articles: {e}")
            return []
    
    def _parse_sec_article(self, soup: BeautifulSoup, url: str) -> Optional[Dict[str, Any]]:
        """Parse SEC article content"""
        try:
            # Extract title
            title_elem = soup.find('h1') or soup.find('title')
            title = title_elem.get_text().strip() if title_elem else "SEC Educational Content"
            
            # Extract main content
            content_elem = soup.find('div', class_='content') or soup.find('main') or soup.find('article')
            if not content_elem:
                content_elem = soup.find('body')
            
            content = self._extract_text_content(content_elem) if content_elem else ""
            
            if len(content) < 100:  # Skip very short content
                return None
            
            return {
                "title": title,
                "content": content,
                "url": url,
                "source": "SEC",
                "category": "regulatory_education",
                "difficulty_level": "intermediate",
                "target_age_range": "16-19",
                "scraped_at": datetime.utcnow().isoformat(),
                "keywords": self._extract_keywords(content),
                "estimated_read_time": self._calculate_read_time(content)
            }
            
        except Exception as e:
            logger.error(f"Error parsing SEC article: {e}")
            return None
    
    def _parse_khan_lesson(self, soup: BeautifulSoup, url: str) -> Optional[Dict[str, Any]]:
        """Parse Khan Academy lesson content"""
        try:
            # Extract title
            title_elem = soup.find('h1') or soup.find('title')
            title = title_elem.get_text().strip() if title_elem else "Khan Academy Lesson"
            
            # Extract content
            content_elem = soup.find('div', class_='lesson-content') or soup.find('main') or soup.find('article')
            if not content_elem:
                content_elem = soup.find('body')
            
            content = self._extract_text_content(content_elem) if content_elem else ""
            
            if len(content) < 100:
                return None
            
            return {
                "title": title,
                "content": content,
                "url": url,
                "source": "Khan Academy",
                "category": "educational_content",
                "difficulty_level": "beginner",
                "target_age_range": "13-19",
                "scraped_at": datetime.utcnow().isoformat(),
                "keywords": self._extract_keywords(content),
                "estimated_read_time": self._calculate_read_time(content)
            }
            
        except Exception as e:
            logger.error(f"Error parsing Khan Academy lesson: {e}")
            return None
    
    def _parse_investopedia_article(self, soup: BeautifulSoup, url: str) -> Optional[Dict[str, Any]]:
        """Parse Investopedia article content"""
        try:
            # Extract title
            title_elem = soup.find('h1') or soup.find('title')
            title = title_elem.get_text().strip() if title_elem else "Investopedia Article"
            
            # Extract content
            content_elem = soup.find('div', class_='article-body') or soup.find('main') or soup.find('article')
            if not content_elem:
                content_elem = soup.find('body')
            
            content = self._extract_text_content(content_elem) if content_elem else ""
            
            if len(content) < 100:
                return None
            
            return {
                "title": title,
                "content": content,
                "url": url,
                "source": "Investopedia",
                "category": "investment_education",
                "difficulty_level": "intermediate",
                "target_age_range": "16-19",
                "scraped_at": datetime.utcnow().isoformat(),
                "keywords": self._extract_keywords(content),
                "estimated_read_time": self._calculate_read_time(content)
            }
            
        except Exception as e:
            logger.error(f"Error parsing Investopedia article: {e}")
            return None
    
    def _extract_text_content(self, element) -> str:
        """Extract clean text content from HTML element"""
        try:
            # Remove script and style elements
            for script in element(["script", "style", "nav", "footer", "header"]):
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
    
    def _extract_keywords(self, content: str) -> List[str]:
        """Extract keywords from content"""
        try:
            # Simple keyword extraction based on common investment terms
            investment_keywords = [
                'stock', 'stocks', 'bond', 'bonds', 'etf', 'etfs', 'mutual fund', 'mutual funds',
                'portfolio', 'diversification', 'risk', 'return', 'dividend', 'dividends',
                'market', 'investing', 'investment', 'investor', 'investors', 'trading',
                'brokerage', 'index fund', 'index funds', 'savings', 'retirement',
                'compound interest', 'asset allocation', 'volatility', 'liquidity'
            ]
            
            content_lower = content.lower()
            found_keywords = [keyword for keyword in investment_keywords if keyword in content_lower]
            
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
    
    def scrape_all_sources(self, max_items_per_source: int = 20) -> List[Dict[str, Any]]:
        """Scrape content from all sources"""
        try:
            all_content = []
            
            # Scrape from each source
            sec_content = self.scrape_sec_content(max_items_per_source // 3)
            khan_content = self.scrape_khan_academy_content(max_items_per_source // 3)
            investopedia_content = self.scrape_investopedia_content(max_items_per_source // 3)
            
            all_content.extend(sec_content)
            all_content.extend(khan_content)
            all_content.extend(investopedia_content)
            
            logger.info(f"Total content scraped: {len(all_content)} items")
            return all_content
            
        except Exception as e:
            logger.error(f"Error scraping all sources: {e}")
            return []


# Global content scraper instance
content_scraper = ContentScraper()
