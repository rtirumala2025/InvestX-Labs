"""
AI-powered content analyzer for educational investment content
"""
import logging
import openai
from typing import Dict, List, Any, Optional
import json
import re
from datetime import datetime
from config.settings import settings
from config.model_config import MODEL_CONFIGS, CONTENT_PROCESSING_CONFIG

logger = logging.getLogger(__name__)


class ContentAnalyzer:
    """AI-powered content analyzer for educational investment content"""
    
    def __init__(self):
        """Initialize content analyzer"""
        openai.api_key = settings.openai_api_key
        self.model_config = MODEL_CONFIGS["content_analysis"]
    
    def analyze_content(self, content_data: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze educational content and extract metadata"""
        try:
            title = content_data.get("title", "")
            content = content_data.get("content", "")
            source = content_data.get("source", "")
            
            if not content or len(content) < CONTENT_PROCESSING_CONFIG["min_content_length"]:
                logger.warning("Content too short for analysis")
                return content_data
            
            # Clean content
            cleaned_content = self._clean_content(content)
            
            # Analyze with AI
            analysis_result = self._ai_analyze_content(title, cleaned_content, source)
            
            # Merge analysis results with original data
            content_data.update(analysis_result)
            content_data["analyzed_at"] = datetime.utcnow().isoformat()
            content_data["analysis_version"] = "1.0"
            
            return content_data
            
        except Exception as e:
            logger.error(f"Error analyzing content: {e}")
            return content_data
    
    def _clean_content(self, content: str) -> str:
        """Clean and normalize content"""
        try:
            # Remove extra whitespace
            if CONTENT_PROCESSING_CONFIG["remove_extra_whitespace"]:
                content = re.sub(r'\s+', ' ', content)
            
            # Normalize unicode
            if CONTENT_PROCESSING_CONFIG["normalize_unicode"]:
                content = content.encode('utf-8', 'ignore').decode('utf-8')
            
            # Limit content length
            if len(content) > CONTENT_PROCESSING_CONFIG["max_content_length"]:
                content = content[:CONTENT_PROCESSING_CONFIG["max_content_length"]] + "..."
            
            return content.strip()
            
        except Exception as e:
            logger.error(f"Error cleaning content: {e}")
            return content
    
    def _ai_analyze_content(self, title: str, content: str, source: str) -> Dict[str, Any]:
        """Use AI to analyze content and extract metadata"""
        try:
            prompt = f"""
            Analyze this educational investment content and extract the following information:
            
            Title: {title}
            Source: {source}
            Content: {content[:2000]}...
            
            Please provide a JSON response with the following fields:
            {{
                "target_age": "13-15" or "16-19" or "all_teens",
                "budget_range": "under_100" or "100_500" or "500_1000" or "1000_5000" or "over_5000" or "any",
                "risk_level": "conservative" or "moderate" or "aggressive" or "educational",
                "investment_types": ["stocks", "etfs", "bonds", "mutual_funds", "index_funds", "savings_accounts", "cds", "robo_advisors"],
                "difficulty_level": "beginner" or "intermediate" or "advanced",
                "category": "basics" or "stocks" or "etfs" or "index_funds" or "risk_management" or "diversification" or "compound_interest" or "budgeting" or "saving" or "market_analysis" or "portfolio_management" or "tax_implications",
                "keywords": ["keyword1", "keyword2", "keyword3"],
                "learning_objectives": ["objective1", "objective2", "objective3"],
                "prerequisites": ["prerequisite1", "prerequisite2"],
                "estimated_read_time": number_in_minutes,
                "content_quality_score": number_between_1_and_10,
                "teen_relevance_score": number_between_1_and_10,
                "educational_value_score": number_between_1_and_10,
                "summary": "Brief summary of the content",
                "key_takeaways": ["takeaway1", "takeaway2", "takeaway3"],
                "related_topics": ["topic1", "topic2", "topic3"],
                "interactive_elements": ["quiz", "calculator", "examples", "exercises"],
                "real_world_examples": ["example1", "example2"],
                "safety_notes": ["note1", "note2"]
            }}
            
            Focus on making this content accessible and relevant for teenagers learning about investing.
            """
            
            response = openai.ChatCompletion.create(
                model=self.model_config["model"],
                messages=[
                    {"role": "system", "content": "You are an expert in educational content analysis, specializing in making financial education accessible to teenagers."},
                    {"role": "user", "content": prompt}
                ],
                temperature=self.model_config["temperature"],
                max_tokens=self.model_config["max_tokens"]
            )
            
            # Parse AI response
            ai_response = response.choices[0].message.content.strip()
            
            # Try to extract JSON from response
            try:
                # Find JSON in response
                json_match = re.search(r'\{.*\}', ai_response, re.DOTALL)
                if json_match:
                    analysis_data = json.loads(json_match.group())
                else:
                    # Fallback parsing
                    analysis_data = self._fallback_parse_analysis(ai_response)
                
                return analysis_data
                
            except json.JSONDecodeError as e:
                logger.error(f"Error parsing AI response as JSON: {e}")
                return self._fallback_parse_analysis(ai_response)
            
        except Exception as e:
            logger.error(f"Error in AI content analysis: {e}")
            return self._get_default_analysis()
    
    def _fallback_parse_analysis(self, ai_response: str) -> Dict[str, Any]:
        """Fallback parsing when JSON parsing fails"""
        try:
            # Extract key information using regex patterns
            analysis_data = self._get_default_analysis()
            
            # Extract target age
            age_match = re.search(r'target_age["\']?\s*:\s*["\']?([^"\',\s]+)', ai_response, re.IGNORECASE)
            if age_match:
                analysis_data["target_age"] = age_match.group(1)
            
            # Extract difficulty level
            difficulty_match = re.search(r'difficulty_level["\']?\s*:\s*["\']?([^"\',\s]+)', ai_response, re.IGNORECASE)
            if difficulty_match:
                analysis_data["difficulty_level"] = difficulty_match.group(1)
            
            # Extract category
            category_match = re.search(r'category["\']?\s*:\s*["\']?([^"\',\s]+)', ai_response, re.IGNORECASE)
            if category_match:
                analysis_data["category"] = category_match.group(1)
            
            # Extract summary
            summary_match = re.search(r'summary["\']?\s*:\s*["\']([^"\']+)["\']', ai_response, re.IGNORECASE)
            if summary_match:
                analysis_data["summary"] = summary_match.group(1)
            
            return analysis_data
            
        except Exception as e:
            logger.error(f"Error in fallback parsing: {e}")
            return self._get_default_analysis()
    
    def _get_default_analysis(self) -> Dict[str, Any]:
        """Get default analysis when AI analysis fails"""
        return {
            "target_age": "all_teens",
            "budget_range": "any",
            "risk_level": "educational",
            "investment_types": ["stocks", "etfs"],
            "difficulty_level": "intermediate",
            "category": "basics",
            "keywords": [],
            "learning_objectives": [],
            "prerequisites": [],
            "estimated_read_time": 5,
            "content_quality_score": 5,
            "teen_relevance_score": 5,
            "educational_value_score": 5,
            "summary": "Educational content about investing",
            "key_takeaways": [],
            "related_topics": [],
            "interactive_elements": [],
            "real_world_examples": [],
            "safety_notes": []
        }
    
    def analyze_batch(self, content_list: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Analyze multiple content items"""
        try:
            analyzed_content = []
            
            for content_item in content_list:
                try:
                    analyzed_item = self.analyze_content(content_item)
                    analyzed_content.append(analyzed_item)
                    
                except Exception as e:
                    logger.error(f"Error analyzing content item: {e}")
                    # Add original content with default analysis
                    content_item.update(self._get_default_analysis())
                    analyzed_content.append(content_item)
            
            logger.info(f"Analyzed {len(analyzed_content)} content items")
            return analyzed_content
            
        except Exception as e:
            logger.error(f"Error in batch analysis: {e}")
            return content_list
    
    def extract_keywords(self, content: str) -> List[str]:
        """Extract keywords from content using AI"""
        try:
            prompt = f"""
            Extract the most important keywords from this educational investment content for teenagers:
            
            {content[:1000]}...
            
            Return a JSON array of 5-10 keywords that would help teens find this content when searching for investment education.
            Focus on terms that teens would use when looking for investment information.
            """
            
            response = openai.ChatCompletion.create(
                model=self.model_config["model"],
                messages=[
                    {"role": "system", "content": "You are an expert at extracting relevant keywords for educational content targeting teenagers."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=200
            )
            
            ai_response = response.choices[0].message.content.strip()
            
            # Try to parse as JSON array
            try:
                keywords = json.loads(ai_response)
                if isinstance(keywords, list):
                    return keywords[:CONTENT_PROCESSING_CONFIG["max_keywords"]]
            except json.JSONDecodeError:
                pass
            
            # Fallback: extract keywords from text
            keywords = re.findall(r'"([^"]+)"', ai_response)
            return keywords[:CONTENT_PROCESSING_CONFIG["max_keywords"]]
            
        except Exception as e:
            logger.error(f"Error extracting keywords: {e}")
            return []
    
    def assess_content_quality(self, content_data: Dict[str, Any]) -> Dict[str, Any]:
        """Assess the quality and relevance of content for teens"""
        try:
            title = content_data.get("title", "")
            content = content_data.get("content", "")
            source = content_data.get("source", "")
            
            prompt = f"""
            Assess the quality and relevance of this educational investment content for teenagers (ages 13-19):
            
            Title: {title}
            Source: {source}
            Content: {content[:1500]}...
            
            Rate the following aspects on a scale of 1-10:
            1. Content Quality (accuracy, clarity, completeness)
            2. Teen Relevance (appropriate for teenage audience)
            3. Educational Value (learning potential)
            4. Safety (appropriate financial advice for teens)
            5. Engagement (how interesting/engaging it would be for teens)
            
            Also provide:
            - Overall recommendation (recommend, neutral, not_recommend)
            - Main strengths
            - Areas for improvement
            - Safety concerns (if any)
            
            Return as JSON with scores and text feedback.
            """
            
            response = openai.ChatCompletion.create(
                model=self.model_config["model"],
                messages=[
                    {"role": "system", "content": "You are an expert in educational content assessment, specializing in financial education for teenagers."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=400
            )
            
            ai_response = response.choices[0].message.content.strip()
            
            # Parse assessment
            try:
                json_match = re.search(r'\{.*\}', ai_response, re.DOTALL)
                if json_match:
                    assessment = json.loads(json_match.group())
                else:
                    assessment = self._parse_assessment_fallback(ai_response)
                
                return assessment
                
            except json.JSONDecodeError:
                return self._parse_assessment_fallback(ai_response)
            
        except Exception as e:
            logger.error(f"Error assessing content quality: {e}")
            return {
                "content_quality_score": 5,
                "teen_relevance_score": 5,
                "educational_value_score": 5,
                "safety_score": 5,
                "engagement_score": 5,
                "overall_recommendation": "neutral",
                "strengths": [],
                "improvements": [],
                "safety_concerns": []
            }
    
    def _parse_assessment_fallback(self, ai_response: str) -> Dict[str, Any]:
        """Fallback parsing for assessment when JSON parsing fails"""
        try:
            assessment = {
                "content_quality_score": 5,
                "teen_relevance_score": 5,
                "educational_value_score": 5,
                "safety_score": 5,
                "engagement_score": 5,
                "overall_recommendation": "neutral",
                "strengths": [],
                "improvements": [],
                "safety_concerns": []
            }
            
            # Extract scores using regex
            score_patterns = {
                "content_quality_score": r'content quality["\']?\s*:\s*(\d+)',
                "teen_relevance_score": r'teen relevance["\']?\s*:\s*(\d+)',
                "educational_value_score": r'educational value["\']?\s*:\s*(\d+)',
                "safety_score": r'safety["\']?\s*:\s*(\d+)',
                "engagement_score": r'engagement["\']?\s*:\s*(\d+)'
            }
            
            for key, pattern in score_patterns.items():
                match = re.search(pattern, ai_response, re.IGNORECASE)
                if match:
                    try:
                        assessment[key] = int(match.group(1))
                    except ValueError:
                        pass
            
            return assessment
            
        except Exception as e:
            logger.error(f"Error in assessment fallback parsing: {e}")
            return {
                "content_quality_score": 5,
                "teen_relevance_score": 5,
                "educational_value_score": 5,
                "safety_score": 5,
                "engagement_score": 5,
                "overall_recommendation": "neutral",
                "strengths": [],
                "improvements": [],
                "safety_concerns": []
            }


# Global content analyzer instance
content_analyzer = ContentAnalyzer()
