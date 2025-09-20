"""
Model trainer for fine-tuning AI models on educational investment content
"""
import logging
import openai
import json
from typing import List, Dict, Any, Optional
from datetime import datetime
import pandas as pd
from config.settings import settings
from config.model_config import MODEL_CONFIGS
from database.firestore_client import firestore_client

logger = logging.getLogger(__name__)


class ModelTrainer:
    """Trainer for fine-tuning AI models on educational content"""
    
    def __init__(self):
        """Initialize model trainer"""
        openai.api_key = settings.openai_api_key
        self.model_config = MODEL_CONFIGS["fine_tuning"]
        self.training_data = []
    
    def prepare_training_data(self, content_list: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Prepare training data from educational content"""
        try:
            logger.info(f"Preparing training data from {len(content_list)} content items")
            
            training_examples = []
            
            for content_item in content_list:
                try:
                    # Create training examples for different scenarios
                    examples = self._create_training_examples(content_item)
                    training_examples.extend(examples)
                    
                except Exception as e:
                    logger.error(f"Error creating training examples for content: {e}")
                    continue
            
            self.training_data = training_examples
            logger.info(f"Prepared {len(training_examples)} training examples")
            
            return training_examples
            
        except Exception as e:
            logger.error(f"Error preparing training data: {e}")
            return []
    
    def _create_training_examples(self, content_item: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Create training examples from a single content item"""
        try:
            examples = []
            
            title = content_item.get("title", "")
            content = content_item.get("content", "")
            category = content_item.get("category", "")
            difficulty = content_item.get("difficulty_level", "")
            target_age = content_item.get("target_age", "")
            
            # Example 1: Explain concept
            if content and title:
                explain_prompt = f"Explain {title} in simple terms for a teenager"
                explain_response = self._generate_explanation_response(content_item)
                
                examples.append({
                    "messages": [
                        {"role": "system", "content": "You are Finley, a friendly AI investment education assistant for teenagers."},
                        {"role": "user", "content": explain_prompt},
                        {"role": "assistant", "content": explain_response}
                    ]
                })
            
            # Example 2: Answer specific question
            if category and content:
                question_prompt = f"What should I know about {category} as a beginner investor?"
                question_response = self._generate_question_response(content_item)
                
                examples.append({
                    "messages": [
                        {"role": "system", "content": "You are Finley, a friendly AI investment education assistant for teenagers."},
                        {"role": "user", "content": question_prompt},
                        {"role": "assistant", "content": question_response}
                    ]
                })
            
            # Example 3: Provide step-by-step guidance
            if "how" in title.lower() or "step" in title.lower():
                guide_prompt = f"Can you walk me through {title} step by step?"
                guide_response = self._generate_guide_response(content_item)
                
                examples.append({
                    "messages": [
                        {"role": "system", "content": "You are Finley, a friendly AI investment education assistant for teenagers."},
                        {"role": "user", "content": guide_prompt},
                        {"role": "assistant", "content": guide_response}
                    ]
                })
            
            # Example 4: Risk assessment guidance
            if "risk" in content.lower() or "risk" in title.lower():
                risk_prompt = "How do I assess my risk tolerance as a teen investor?"
                risk_response = self._generate_risk_response(content_item)
                
                examples.append({
                    "messages": [
                        {"role": "system", "content": "You are Finley, a friendly AI investment education assistant for teenagers."},
                        {"role": "user", "content": risk_prompt},
                        {"role": "assistant", "content": risk_response}
                    ]
                })
            
            return examples
            
        except Exception as e:
            logger.error(f"Error creating training examples: {e}")
            return []
    
    def _generate_explanation_response(self, content_item: Dict[str, Any]) -> str:
        """Generate explanation response for training"""
        try:
            title = content_item.get("title", "")
            content = content_item.get("content", "")
            category = content_item.get("category", "")
            
            # Create teen-friendly explanation
            response = f"Great question! Let me explain {title} in simple terms! 💡\n\n"
            
            # Extract key points from content
            key_points = self._extract_key_points(content)
            
            for i, point in enumerate(key_points[:3], 1):
                response += f"{i}. {point}\n"
            
            response += f"\n{title} is part of {category}, which is super important for building your investment knowledge! 📚\n\n"
            response += "Remember, I'm here to help you learn! Feel free to ask me more questions about this topic! 🚀"
            
            return response
            
        except Exception as e:
            logger.error(f"Error generating explanation response: {e}")
            return f"I'd love to explain {title} to you! This is a great topic for learning about investing! 💡"
    
    def _generate_question_response(self, content_item: Dict[str, Any]) -> str:
        """Generate question response for training"""
        try:
            category = content_item.get("category", "")
            content = content_item.get("content", "")
            difficulty = content_item.get("difficulty_level", "")
            
            response = f"Awesome question about {category}! As a beginner, here's what you should know: 🎯\n\n"
            
            # Provide beginner-friendly information
            if difficulty == "beginner":
                response += "This is perfect for beginners like you! "
            elif difficulty == "intermediate":
                response += "This is a bit more advanced, but I'll break it down for you! "
            
            # Extract practical tips
            tips = self._extract_practical_tips(content)
            
            for tip in tips[:2]:
                response += f"• {tip}\n"
            
            response += f"\n{category} is a fundamental part of investing that every teen should understand! 📈\n\n"
            response += "Want to dive deeper into any of these points? Just ask! 😊"
            
            return response
            
        except Exception as e:
            logger.error(f"Error generating question response: {e}")
            return f"Great question about {category}! This is definitely something every teen investor should know! 💰"
    
    def _generate_guide_response(self, content_item: Dict[str, Any]) -> str:
        """Generate step-by-step guide response for training"""
        try:
            title = content_item.get("title", "")
            content = content_item.get("content", "")
            
            response = f"Absolutely! Let me walk you through {title} step by step! 🚀\n\n"
            
            # Extract steps from content
            steps = self._extract_steps(content)
            
            for i, step in enumerate(steps[:5], 1):
                response += f"**Step {i}:** {step}\n\n"
            
            response += "Take your time with each step - there's no rush when learning about investing! ⏰\n\n"
            response += "Need clarification on any of these steps? I'm here to help! 💡"
            
            return response
            
        except Exception as e:
            logger.error(f"Error generating guide response: {e}")
            return f"I'd be happy to walk you through {title} step by step! Let's break it down together! 📚"
    
    def _generate_risk_response(self, content_item: Dict[str, Any]) -> str:
        """Generate risk assessment response for training"""
        try:
            content = content_item.get("content", "")
            
            response = "Great question! Understanding risk is super important for teen investors! ⚖️\n\n"
            
            # Extract risk-related information
            risk_info = self._extract_risk_info(content)
            
            response += "Here's how to think about risk as a teen:\n\n"
            
            for info in risk_info[:3]:
                response += f"• {info}\n"
            
            response += "\nRemember: As a teen, you have time on your side, which is actually a huge advantage! 🕐\n\n"
            response += "Want to explore your own risk tolerance? I can help you figure that out! 🎯"
            
            return response
            
        except Exception as e:
            logger.error(f"Error generating risk response: {e}")
            return "Understanding risk is so important for teen investors! Let me help you figure this out! ⚖️"
    
    def _extract_key_points(self, content: str) -> List[str]:
        """Extract key points from content"""
        try:
            # Simple extraction - look for numbered lists, bullet points, etc.
            import re
            
            # Look for numbered lists
            numbered_points = re.findall(r'\d+\.\s*([^.\n]+)', content)
            
            # Look for bullet points
            bullet_points = re.findall(r'[•\-\*]\s*([^.\n]+)', content)
            
            # Combine and clean
            all_points = numbered_points + bullet_points
            
            # Clean and limit
            cleaned_points = [point.strip() for point in all_points if len(point.strip()) > 10]
            
            return cleaned_points[:5]
            
        except Exception as e:
            logger.error(f"Error extracting key points: {e}")
            return []
    
    def _extract_practical_tips(self, content: str) -> List[str]:
        """Extract practical tips from content"""
        try:
            import re
            
            # Look for tips, advice, recommendations
            tip_patterns = [
                r'tip[s]?\s*:?\s*([^.\n]+)',
                r'advice\s*:?\s*([^.\n]+)',
                r'recommend[s]?\s*:?\s*([^.\n]+)',
                r'should\s+([^.\n]+)',
                r'important\s+to\s+([^.\n]+)'
            ]
            
            tips = []
            for pattern in tip_patterns:
                matches = re.findall(pattern, content, re.IGNORECASE)
                tips.extend(matches)
            
            # Clean and limit
            cleaned_tips = [tip.strip() for tip in tips if len(tip.strip()) > 10]
            
            return cleaned_tips[:3]
            
        except Exception as e:
            logger.error(f"Error extracting practical tips: {e}")
            return []
    
    def _extract_steps(self, content: str) -> List[str]:
        """Extract steps from content"""
        try:
            import re
            
            # Look for step patterns
            step_patterns = [
                r'step\s+\d+\s*:?\s*([^.\n]+)',
                r'first\s+([^.\n]+)',
                r'next\s+([^.\n]+)',
                r'then\s+([^.\n]+)',
                r'finally\s+([^.\n]+)'
            ]
            
            steps = []
            for pattern in step_patterns:
                matches = re.findall(pattern, content, re.IGNORECASE)
                steps.extend(matches)
            
            # Clean and limit
            cleaned_steps = [step.strip() for step in steps if len(step.strip()) > 10]
            
            return cleaned_steps[:5]
            
        except Exception as e:
            logger.error(f"Error extracting steps: {e}")
            return []
    
    def _extract_risk_info(self, content: str) -> List[str]:
        """Extract risk-related information from content"""
        try:
            import re
            
            # Look for risk-related information
            risk_patterns = [
                r'risk\s+([^.\n]+)',
                r'volatility\s+([^.\n]+)',
                r'uncertainty\s+([^.\n]+)',
                r'potential\s+loss\s+([^.\n]+)',
                r'conservative\s+([^.\n]+)',
                r'aggressive\s+([^.\n]+)'
            ]
            
            risk_info = []
            for pattern in risk_patterns:
                matches = re.findall(pattern, content, re.IGNORECASE)
                risk_info.extend(matches)
            
            # Clean and limit
            cleaned_info = [info.strip() for info in risk_info if len(info.strip()) > 10]
            
            return cleaned_info[:3]
            
        except Exception as e:
            logger.error(f"Error extracting risk info: {e}")
            return []
    
    def create_training_file(self, training_data: List[Dict[str, Any]], filename: str = "training_data.jsonl") -> str:
        """Create training file in JSONL format"""
        try:
            logger.info(f"Creating training file with {len(training_data)} examples")
            
            # Convert to JSONL format
            jsonl_content = []
            for example in training_data:
                jsonl_content.append(json.dumps(example))
            
            # Write to file
            with open(filename, 'w', encoding='utf-8') as f:
                f.write('\n'.join(jsonl_content))
            
            logger.info(f"Training file created: {filename}")
            return filename
            
        except Exception as e:
            logger.error(f"Error creating training file: {e}")
            return ""
    
    def upload_training_file(self, filename: str) -> Optional[str]:
        """Upload training file to OpenAI"""
        try:
            logger.info(f"Uploading training file: {filename}")
            
            with open(filename, 'rb') as f:
                response = openai.File.create(
                    file=f,
                    purpose='fine-tune'
                )
            
            file_id = response.id
            logger.info(f"Training file uploaded with ID: {file_id}")
            
            return file_id
            
        except Exception as e:
            logger.error(f"Error uploading training file: {e}")
            return None
    
    def create_fine_tuning_job(self, training_file_id: str, model_name: str = None) -> Optional[str]:
        """Create fine-tuning job"""
        try:
            if model_name is None:
                model_name = self.model_config["base_model"]
            
            logger.info(f"Creating fine-tuning job for model: {model_name}")
            
            response = openai.FineTuningJob.create(
                training_file=training_file_id,
                model=model_name,
                hyperparameters={
                    "n_epochs": self.model_config["training_epochs"],
                    "learning_rate_multiplier": self.model_config["learning_rate"],
                    "batch_size": self.model_config["batch_size"]
                }
            )
            
            job_id = response.id
            logger.info(f"Fine-tuning job created with ID: {job_id}")
            
            return job_id
            
        except Exception as e:
            logger.error(f"Error creating fine-tuning job: {e}")
            return None
    
    def monitor_fine_tuning_job(self, job_id: str) -> Dict[str, Any]:
        """Monitor fine-tuning job progress"""
        try:
            response = openai.FineTuningJob.retrieve(job_id)
            
            status_info = {
                "job_id": job_id,
                "status": response.status,
                "model": response.model,
                "created_at": response.created_at,
                "finished_at": response.finished_at,
                "trained_tokens": response.trained_tokens,
                "training_file": response.training_file,
                "result_files": response.result_files,
                "error": response.error if hasattr(response, 'error') else None
            }
            
            return status_info
            
        except Exception as e:
            logger.error(f"Error monitoring fine-tuning job: {e}")
            return {"error": str(e)}
    
    def list_fine_tuning_jobs(self, limit: int = 10) -> List[Dict[str, Any]]:
        """List fine-tuning jobs"""
        try:
            response = openai.FineTuningJob.list(limit=limit)
            
            jobs = []
            for job in response.data:
                jobs.append({
                    "job_id": job.id,
                    "status": job.status,
                    "model": job.model,
                    "created_at": job.created_at,
                    "finished_at": job.finished_at
                })
            
            return jobs
            
        except Exception as e:
            logger.error(f"Error listing fine-tuning jobs: {e}")
            return []
    
    def test_fine_tuned_model(self, model_name: str, test_prompts: List[str]) -> List[Dict[str, Any]]:
        """Test fine-tuned model with sample prompts"""
        try:
            logger.info(f"Testing fine-tuned model: {model_name}")
            
            results = []
            
            for prompt in test_prompts:
                try:
                    response = openai.ChatCompletion.create(
                        model=model_name,
                        messages=[
                            {"role": "system", "content": "You are Finley, a friendly AI investment education assistant for teenagers."},
                            {"role": "user", "content": prompt}
                        ],
                        temperature=0.7,
                        max_tokens=300
                    )
                    
                    result = {
                        "prompt": prompt,
                        "response": response.choices[0].message.content,
                        "model": model_name,
                        "tokens_used": response.usage.total_tokens
                    }
                    
                    results.append(result)
                    
                except Exception as e:
                    logger.error(f"Error testing prompt: {e}")
                    results.append({
                        "prompt": prompt,
                        "error": str(e),
                        "model": model_name
                    })
            
            return results
            
        except Exception as e:
            logger.error(f"Error testing fine-tuned model: {e}")
            return []
    
    def save_model_evaluation(self, model_name: str, evaluation_results: Dict[str, Any]) -> bool:
        """Save model evaluation results"""
        try:
            evaluation_data = {
                "model_name": model_name,
                "evaluation_results": evaluation_results,
                "evaluated_at": datetime.utcnow().isoformat(),
                "evaluation_version": "1.0"
            }
            
            # Save to Firestore
            firestore_client.db.collection("model_evaluations").add(evaluation_data)
            
            logger.info(f"Model evaluation saved for {model_name}")
            return True
            
        except Exception as e:
            logger.error(f"Error saving model evaluation: {e}")
            return False


# Global model trainer instance
model_trainer = ModelTrainer()
