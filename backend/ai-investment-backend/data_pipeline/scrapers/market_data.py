"""
Market data scraper using yfinance for teen-relevant stocks
"""
import logging
import yfinance as yf
import pandas as pd
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from config.settings import settings, TEEN_RELEVANT_STOCKS

logger = logging.getLogger(__name__)


class MarketDataScraper:
    """Market data scraper for teen-relevant stocks and ETFs"""
    
    def __init__(self):
        """Initialize market data scraper"""
        self.symbols = TEEN_RELEVANT_STOCKS
        self.session = yf.Session()
    
    def get_stock_data(self, symbol: str, period: str = "1d") -> Optional[Dict[str, Any]]:
        """Get stock data for a specific symbol"""
        try:
            ticker = yf.Ticker(symbol)
            
            # Get current data
            info = ticker.info
            hist = ticker.history(period=period)
            
            if hist.empty:
                logger.warning(f"No data available for {symbol}")
                return None
            
            # Get latest price data
            latest = hist.iloc[-1]
            
            # Calculate price change
            if len(hist) > 1:
                previous = hist.iloc[-2]
                price_change = latest['Close'] - previous['Close']
                percent_change = (price_change / previous['Close']) * 100
            else:
                price_change = 0
                percent_change = 0
            
            stock_data = {
                "symbol": symbol,
                "name": info.get("longName", symbol),
                "current_price": round(latest['Close'], 2),
                "price_change": round(price_change, 2),
                "percent_change": round(percent_change, 2),
                "volume": int(latest['Volume']),
                "market_cap": info.get("marketCap"),
                "sector": info.get("sector"),
                "industry": info.get("industry"),
                "pe_ratio": info.get("trailingPE"),
                "dividend_yield": info.get("dividendYield"),
                "52_week_high": info.get("fiftyTwoWeekHigh"),
                "52_week_low": info.get("fiftyTwoWeekLow"),
                "description": info.get("longBusinessSummary", ""),
                "timestamp": datetime.utcnow().isoformat(),
                "data_source": "yfinance"
            }
            
            return stock_data
            
        except Exception as e:
            logger.error(f"Error getting stock data for {symbol}: {e}")
            return None
    
    def get_all_teen_stocks_data(self) -> List[Dict[str, Any]]:
        """Get data for all teen-relevant stocks"""
        try:
            all_stock_data = []
            
            for symbol in self.symbols:
                stock_data = self.get_stock_data(symbol)
                if stock_data:
                    all_stock_data.append(stock_data)
            
            logger.info(f"Retrieved data for {len(all_stock_data)} stocks")
            return all_stock_data
            
        except Exception as e:
            logger.error(f"Error getting all teen stocks data: {e}")
            return []
    
    def get_historical_data(self, symbol: str, period: str = "1mo") -> Optional[Dict[str, Any]]:
        """Get historical data for a symbol"""
        try:
            ticker = yf.Ticker(symbol)
            hist = ticker.history(period=period)
            
            if hist.empty:
                return None
            
            # Convert to list of daily data
            historical_data = []
            for date, row in hist.iterrows():
                historical_data.append({
                    "date": date.strftime("%Y-%m-%d"),
                    "open": round(row['Open'], 2),
                    "high": round(row['High'], 2),
                    "low": round(row['Low'], 2),
                    "close": round(row['Close'], 2),
                    "volume": int(row['Volume'])
                })
            
            return {
                "symbol": symbol,
                "period": period,
                "data": historical_data,
                "timestamp": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error getting historical data for {symbol}: {e}")
            return None
    
    def get_market_summary(self) -> Dict[str, Any]:
        """Get overall market summary"""
        try:
            # Get major indices
            indices = {
                "SPY": "S&P 500",
                "QQQ": "NASDAQ",
                "DIA": "Dow Jones",
                "VTI": "Total Stock Market"
            }
            
            market_summary = {
                "timestamp": datetime.utcnow().isoformat(),
                "indices": {},
                "teen_stocks_summary": {}
            }
            
            # Get index data
            for symbol, name in indices.items():
                index_data = self.get_stock_data(symbol)
                if index_data:
                    market_summary["indices"][name] = {
                        "symbol": symbol,
                        "price": index_data["current_price"],
                        "change": index_data["price_change"],
                        "percent_change": index_data["percent_change"]
                    }
            
            # Get teen stocks summary
            teen_stocks_data = self.get_all_teen_stocks_data()
            if teen_stocks_data:
                # Calculate averages
                avg_change = sum(stock["percent_change"] for stock in teen_stocks_data) / len(teen_stocks_data)
                gainers = len([stock for stock in teen_stocks_data if stock["percent_change"] > 0])
                losers = len([stock for stock in teen_stocks_data if stock["percent_change"] < 0])
                
                market_summary["teen_stocks_summary"] = {
                    "total_stocks": len(teen_stocks_data),
                    "average_change": round(avg_change, 2),
                    "gainers": gainers,
                    "losers": losers,
                    "top_gainer": max(teen_stocks_data, key=lambda x: x["percent_change"]),
                    "top_loser": min(teen_stocks_data, key=lambda x: x["percent_change"])
                }
            
            return market_summary
            
        except Exception as e:
            logger.error(f"Error getting market summary: {e}")
            return {}
    
    def get_stock_news(self, symbol: str, max_news: int = 5) -> List[Dict[str, Any]]:
        """Get recent news for a stock"""
        try:
            ticker = yf.Ticker(symbol)
            news = ticker.news
            
            formatted_news = []
            for article in news[:max_news]:
                formatted_news.append({
                    "title": article.get("title", ""),
                    "summary": article.get("summary", ""),
                    "url": article.get("link", ""),
                    "publisher": article.get("publisher", ""),
                    "published": datetime.fromtimestamp(article.get("providerPublishTime", 0)).isoformat() if article.get("providerPublishTime") else None,
                    "symbol": symbol
                })
            
            return formatted_news
            
        except Exception as e:
            logger.error(f"Error getting news for {symbol}: {e}")
            return []
    
    def get_earnings_calendar(self, symbols: List[str] = None) -> List[Dict[str, Any]]:
        """Get upcoming earnings for teen-relevant stocks"""
        try:
            if symbols is None:
                symbols = self.symbols
            
            earnings_data = []
            
            for symbol in symbols:
                try:
                    ticker = yf.Ticker(symbol)
                    calendar = ticker.calendar
                    
                    if calendar is not None and not calendar.empty:
                        # Get next earnings date
                        next_earnings = calendar.iloc[0]
                        earnings_data.append({
                            "symbol": symbol,
                            "earnings_date": next_earnings.name.strftime("%Y-%m-%d") if hasattr(next_earnings.name, 'strftime') else str(next_earnings.name),
                            "estimate": next_earnings.get("Earnings Estimate", 0),
                            "actual": next_earnings.get("Earnings Actual", None)
                        })
                
                except Exception as e:
                    logger.warning(f"Could not get earnings data for {symbol}: {e}")
                    continue
            
            return earnings_data
            
        except Exception as e:
            logger.error(f"Error getting earnings calendar: {e}")
            return []
    
    def get_dividend_data(self, symbol: str) -> Optional[Dict[str, Any]]:
        """Get dividend information for a stock"""
        try:
            ticker = yf.Ticker(symbol)
            
            # Get dividend history
            dividends = ticker.dividends
            info = ticker.info
            
            if dividends.empty:
                return None
            
            # Get recent dividend data
            recent_dividends = dividends.tail(4)  # Last 4 dividends
            
            dividend_data = {
                "symbol": symbol,
                "dividend_yield": info.get("dividendYield", 0),
                "dividend_rate": info.get("dividendRate", 0),
                "payout_ratio": info.get("payoutRatio", 0),
                "recent_dividends": [
                    {
                        "date": date.strftime("%Y-%m-%d"),
                        "amount": round(amount, 4)
                    }
                    for date, amount in recent_dividends.items()
                ],
                "next_dividend_date": info.get("exDividendDate"),
                "timestamp": datetime.utcnow().isoformat()
            }
            
            return dividend_data
            
        except Exception as e:
            logger.error(f"Error getting dividend data for {symbol}: {e}")
            return None
    
    def get_sector_performance(self) -> Dict[str, Any]:
        """Get performance by sector for teen-relevant stocks"""
        try:
            teen_stocks_data = self.get_all_teen_stocks_data()
            
            sector_performance = {}
            
            for stock in teen_stocks_data:
                sector = stock.get("sector", "Unknown")
                
                if sector not in sector_performance:
                    sector_performance[sector] = {
                        "stocks": [],
                        "total_change": 0,
                        "count": 0
                    }
                
                sector_performance[sector]["stocks"].append({
                    "symbol": stock["symbol"],
                    "name": stock["name"],
                    "change": stock["percent_change"]
                })
                sector_performance[sector]["total_change"] += stock["percent_change"]
                sector_performance[sector]["count"] += 1
            
            # Calculate average performance per sector
            for sector, data in sector_performance.items():
                if data["count"] > 0:
                    data["average_change"] = round(data["total_change"] / data["count"], 2)
            
            return sector_performance
            
        except Exception as e:
            logger.error(f"Error getting sector performance: {e}")
            return {}
    
    def get_volatility_analysis(self, symbol: str, period: str = "1mo") -> Optional[Dict[str, Any]]:
        """Get volatility analysis for a stock"""
        try:
            ticker = yf.Ticker(symbol)
            hist = ticker.history(period=period)
            
            if hist.empty or len(hist) < 2:
                return None
            
            # Calculate daily returns
            hist['Daily_Return'] = hist['Close'].pct_change()
            
            # Calculate volatility metrics
            volatility = hist['Daily_Return'].std() * (252 ** 0.5)  # Annualized volatility
            avg_return = hist['Daily_Return'].mean() * 252  # Annualized return
            
            # Calculate beta (simplified - would need market data for proper calculation)
            price_range = hist['Close'].max() - hist['Close'].min()
            price_volatility = price_range / hist['Close'].mean()
            
            volatility_data = {
                "symbol": symbol,
                "period": period,
                "annualized_volatility": round(volatility * 100, 2),  # As percentage
                "annualized_return": round(avg_return * 100, 2),  # As percentage
                "price_volatility": round(price_volatility * 100, 2),  # As percentage
                "max_price": round(hist['Close'].max(), 2),
                "min_price": round(hist['Close'].min(), 2),
                "current_price": round(hist['Close'].iloc[-1], 2),
                "timestamp": datetime.utcnow().isoformat()
            }
            
            return volatility_data
            
        except Exception as e:
            logger.error(f"Error getting volatility analysis for {symbol}: {e}")
            return None


# Global market data scraper instance
market_data_scraper = MarketDataScraper()
