"""
Automated scheduler for data pipeline runs
"""
import logging
import schedule
import time
from datetime import datetime, timedelta
from typing import Dict, Any, List
import asyncio
from concurrent.futures import ThreadPoolExecutor
import threading

from data_pipeline.scrapers.content_scraper import content_scraper
from data_pipeline.scrapers.market_data import market_data_scraper
from data_pipeline.scrapers.news_scraper import news_scraper
from data_pipeline.processors.content_analyzer import content_analyzer
from data_pipeline.processors.embedding_generator import embedding_generator
from data_pipeline.processors.data_cleaner import data_cleaner
from database.firestore_client import firestore_client
from database.vector_store import vector_store
from database.cache_manager import cache_manager

logger = logging.getLogger(__name__)


class DataPipelineScheduler:
    """Scheduler for automated data pipeline runs"""
    
    def __init__(self):
        """Initialize data pipeline scheduler"""
        self.is_running = False
        self.executor = ThreadPoolExecutor(max_workers=4)
        self.last_run_times = {}
        
    def start_scheduler(self):
        """Start the data pipeline scheduler"""
        try:
            logger.info("Starting data pipeline scheduler")
            
            # Schedule content scraping (daily at 2 AM)
            schedule.every().day.at("02:00").do(self._run_content_pipeline)
            
            # Schedule market data updates (every 4 hours during market hours)
            schedule.every().day.at("09:30").do(self._run_market_data_pipeline)  # Market open
            schedule.every().day.at("13:30").do(self._run_market_data_pipeline)  # Midday
            schedule.every().day.at("16:00").do(self._run_market_data_pipeline)  # Market close
            
            # Schedule news scraping (every 2 hours)
            schedule.every(2).hours.do(self._run_news_pipeline)
            
            # Schedule content analysis (daily at 3 AM)
            schedule.every().day.at("03:00").do(self._run_content_analysis_pipeline)
            
            # Schedule embedding generation (daily at 4 AM)
            schedule.every().day.at("04:00").do(self._run_embedding_pipeline)
            
            # Schedule cache cleanup (daily at 1 AM)
            schedule.every().day.at("01:00").do(self._run_cache_cleanup)
            
            # Schedule health check (every hour)
            schedule.every().hour.do(self._run_health_check)
            
            self.is_running = True
            
            # Start scheduler in background thread
            scheduler_thread = threading.Thread(target=self._run_scheduler_loop, daemon=True)
            scheduler_thread.start()
            
            logger.info("Data pipeline scheduler started successfully")
            
        except Exception as e:
            logger.error(f"Error starting scheduler: {e}")
            raise
    
    def stop_scheduler(self):
        """Stop the data pipeline scheduler"""
        try:
            self.is_running = False
            schedule.clear()
            self.executor.shutdown(wait=True)
            logger.info("Data pipeline scheduler stopped")
            
        except Exception as e:
            logger.error(f"Error stopping scheduler: {e}")
    
    def _run_scheduler_loop(self):
        """Main scheduler loop"""
        try:
            while self.is_running:
                schedule.run_pending()
                time.sleep(60)  # Check every minute
                
        except Exception as e:
            logger.error(f"Error in scheduler loop: {e}")
    
    def _run_content_pipeline(self):
        """Run content scraping and processing pipeline"""
        try:
            logger.info("Starting content pipeline")
            start_time = datetime.utcnow()
            
            # Scrape content from all sources
            content_data = content_scraper.scrape_all_sources(max_items_per_source=20)
            
            if content_data:
                # Clean content
                cleaned_content = data_cleaner.clean_content_list(content_data)
                
                # Analyze content
                analyzed_content = content_analyzer.analyze_batch(cleaned_content)
                
                # Save to database
                saved_count = 0
                for content_item in analyzed_content:
                    try:
                        content_id = firestore_client.save_educational_content(content_item)
                        if content_id:
                            saved_count += 1
                    except Exception as e:
                        logger.error(f"Error saving content: {e}")
                
                # Update last run time
                self.last_run_times["content_pipeline"] = start_time
                
                logger.info(f"Content pipeline completed: {saved_count} items saved")
            else:
                logger.warning("No content scraped in content pipeline")
                
        except Exception as e:
            logger.error(f"Error in content pipeline: {e}")
    
    def _run_market_data_pipeline(self):
        """Run market data collection pipeline"""
        try:
            logger.info("Starting market data pipeline")
            start_time = datetime.utcnow()
            
            # Get market data for all teen-relevant stocks
            market_data = market_data_scraper.get_all_teen_stocks_data()
            
            if market_data:
                # Clean market data
                cleaned_data = data_cleaner.clean_market_data(market_data)
                
                # Save to database
                saved_count = 0
                for stock_data in cleaned_data:
                    try:
                        symbol = stock_data.get("symbol", "")
                        if symbol:
                            success = firestore_client.save_market_data(symbol, stock_data)
                            if success:
                                saved_count += 1
                    except Exception as e:
                        logger.error(f"Error saving market data: {e}")
                
                # Get and save market summary
                try:
                    market_summary = market_data_scraper.get_market_summary()
                    if market_summary:
                        firestore_client.save_to_cache("market_summary", market_summary, ttl=14400)  # 4 hours
                except Exception as e:
                    logger.error(f"Error saving market summary: {e}")
                
                # Update last run time
                self.last_run_times["market_data_pipeline"] = start_time
                
                logger.info(f"Market data pipeline completed: {saved_count} stocks updated")
            else:
                logger.warning("No market data collected in market data pipeline")
                
        except Exception as e:
            logger.error(f"Error in market data pipeline: {e}")
    
    def _run_news_pipeline(self):
        """Run news scraping pipeline"""
        try:
            logger.info("Starting news pipeline")
            start_time = datetime.utcnow()
            
            # Scrape teen-focused news
            news_articles = news_scraper.get_teen_focused_news(max_articles=30)
            
            if news_articles:
                # Clean news articles
                cleaned_news = data_cleaner.clean_content_list(news_articles)
                
                # Save to database
                saved_count = 0
                for article in cleaned_news:
                    try:
                        article_id = firestore_client.save_news_article(article)
                        if article_id:
                            saved_count += 1
                    except Exception as e:
                        logger.error(f"Error saving news article: {e}")
                
                # Update last run time
                self.last_run_times["news_pipeline"] = start_time
                
                logger.info(f"News pipeline completed: {saved_count} articles saved")
            else:
                logger.warning("No news articles scraped in news pipeline")
                
        except Exception as e:
            logger.error(f"Error in news pipeline: {e}")
    
    def _run_content_analysis_pipeline(self):
        """Run content analysis pipeline"""
        try:
            logger.info("Starting content analysis pipeline")
            start_time = datetime.utcnow()
            
            # Get unanalyzed content from database
            try:
                unanalyzed_content = firestore_client.get_educational_content(limit=50)
                
                if unanalyzed_content:
                    # Analyze content
                    analyzed_content = content_analyzer.analyze_batch(unanalyzed_content)
                    
                    # Update content in database
                    updated_count = 0
                    for content_item in analyzed_content:
                        try:
                            content_id = content_item.get("id")
                            if content_id:
                                # Update content with analysis results
                                firestore_client.db.collection("educational_content").document(content_id).update({
                                    "analysis_results": content_item,
                                    "analyzed_at": datetime.utcnow()
                                })
                                updated_count += 1
                        except Exception as e:
                            logger.error(f"Error updating analyzed content: {e}")
                    
                    # Update last run time
                    self.last_run_times["content_analysis_pipeline"] = start_time
                    
                    logger.info(f"Content analysis pipeline completed: {updated_count} items analyzed")
                else:
                    logger.info("No unanalyzed content found")
                    
            except Exception as e:
                logger.error(f"Error getting unanalyzed content: {e}")
                
        except Exception as e:
            logger.error(f"Error in content analysis pipeline: {e}")
    
    def _run_embedding_pipeline(self):
        """Run embedding generation pipeline"""
        try:
            logger.info("Starting embedding pipeline")
            start_time = datetime.utcnow()
            
            # Get content without embeddings
            try:
                content_without_embeddings = firestore_client.get_educational_content(limit=100)
                
                if content_without_embeddings:
                    # Generate embeddings
                    embeddings = embedding_generator.generate_embeddings_for_content_list(content_without_embeddings)
                    
                    # Store embeddings in vector store
                    if embeddings:
                        success = embedding_generator.store_embeddings_in_vector_store(embeddings)
                        
                        if success:
                            # Save embedding metadata to Firestore
                            for embedding_data in embeddings:
                                try:
                                    content_id = embedding_data.get("content_id")
                                    if content_id:
                                        firestore_client.save_embedding(content_id, embedding_data)
                                except Exception as e:
                                    logger.error(f"Error saving embedding metadata: {e}")
                            
                            # Update last run time
                            self.last_run_times["embedding_pipeline"] = start_time
                            
                            logger.info(f"Embedding pipeline completed: {len(embeddings)} embeddings generated")
                        else:
                            logger.error("Failed to store embeddings in vector store")
                    else:
                        logger.warning("No embeddings generated")
                else:
                    logger.info("No content found for embedding generation")
                    
            except Exception as e:
                logger.error(f"Error getting content for embedding: {e}")
                
        except Exception as e:
            logger.error(f"Error in embedding pipeline: {e}")
    
    def _run_cache_cleanup(self):
        """Run cache cleanup"""
        try:
            logger.info("Starting cache cleanup")
            start_time = datetime.utcnow()
            
            # Clear expired cache entries
            try:
                # Clear old conversation cache
                firestore_client.clear_pattern("conversation_*")
                
                # Clear old market data cache
                firestore_client.clear_pattern("market_*")
                
                # Clear old news cache
                firestore_client.clear_pattern("news_*")
                
                # Update last run time
                self.last_run_times["cache_cleanup"] = start_time
                
                logger.info("Cache cleanup completed")
                
            except Exception as e:
                logger.error(f"Error in cache cleanup: {e}")
                
        except Exception as e:
            logger.error(f"Error in cache cleanup: {e}")
    
    def _run_health_check(self):
        """Run system health check"""
        try:
            logger.info("Running health check")
            start_time = datetime.utcnow()
            
            health_status = {
                "timestamp": start_time.isoformat(),
                "services": {}
            }
            
            # Check Firestore connection
            try:
                firestore_client.db.collection("health_check").document("test").set({"test": True})
                health_status["services"]["firestore"] = "healthy"
            except Exception as e:
                health_status["services"]["firestore"] = f"unhealthy: {e}"
            
            # Check vector store
            try:
                collections = vector_store.list_collections()
                health_status["services"]["vector_store"] = "healthy"
            except Exception as e:
                health_status["services"]["vector_store"] = f"unhealthy: {e}"
            
            # Check cache
            try:
                cache_stats = cache_manager.get_stats()
                health_status["services"]["cache"] = "healthy"
            except Exception as e:
                health_status["services"]["cache"] = f"unhealthy: {e}"
            
            # Save health status
            try:
                firestore_client.db.collection("system_health").document(start_time.strftime("%Y%m%d_%H%M")).set(health_status)
            except Exception as e:
                logger.error(f"Error saving health status: {e}")
            
            # Update last run time
            self.last_run_times["health_check"] = start_time
            
            logger.info("Health check completed")
            
        except Exception as e:
            logger.error(f"Error in health check: {e}")
    
    def run_pipeline_manually(self, pipeline_name: str) -> Dict[str, Any]:
        """Run a specific pipeline manually"""
        try:
            logger.info(f"Running {pipeline_name} manually")
            
            pipeline_functions = {
                "content": self._run_content_pipeline,
                "market_data": self._run_market_data_pipeline,
                "news": self._run_news_pipeline,
                "content_analysis": self._run_content_analysis_pipeline,
                "embedding": self._run_embedding_pipeline,
                "cache_cleanup": self._run_cache_cleanup,
                "health_check": self._run_health_check
            }
            
            if pipeline_name in pipeline_functions:
                # Run pipeline in thread pool
                future = self.executor.submit(pipeline_functions[pipeline_name])
                future.result(timeout=3600)  # 1 hour timeout
                
                return {
                    "status": "success",
                    "pipeline": pipeline_name,
                    "message": f"{pipeline_name} pipeline completed successfully"
                }
            else:
                return {
                    "status": "error",
                    "pipeline": pipeline_name,
                    "message": f"Unknown pipeline: {pipeline_name}"
                }
                
        except Exception as e:
            logger.error(f"Error running {pipeline_name} manually: {e}")
            return {
                "status": "error",
                "pipeline": pipeline_name,
                "message": str(e)
            }
    
    def get_scheduler_status(self) -> Dict[str, Any]:
        """Get scheduler status and last run times"""
        try:
            return {
                "is_running": self.is_running,
                "last_run_times": self.last_run_times,
                "next_run_times": self._get_next_run_times(),
                "scheduled_jobs": len(schedule.jobs),
                "status": "healthy" if self.is_running else "stopped"
            }
            
        except Exception as e:
            logger.error(f"Error getting scheduler status: {e}")
            return {
                "is_running": False,
                "error": str(e),
                "status": "error"
            }
    
    def _get_next_run_times(self) -> Dict[str, str]:
        """Get next run times for scheduled jobs"""
        try:
            next_runs = {}
            
            for job in schedule.jobs:
                next_run = job.next_run
                if next_run:
                    next_runs[job.job_func.__name__] = next_run.isoformat()
            
            return next_runs
            
        except Exception as e:
            logger.error(f"Error getting next run times: {e}")
            return {}


# Global scheduler instance
data_pipeline_scheduler = DataPipelineScheduler()
