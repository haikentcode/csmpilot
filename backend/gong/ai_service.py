"""
Gong AI Service
Uses OpenAI API to process meeting transcripts and extract actionable insights.
"""

import json
import os
from django.conf import settings
from django.utils import timezone
from .models import GongMeeting

# Try to import openai, handle gracefully if not available
try:
    import openai
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False


class GongAIService:
    """
    Service to process Gong meetings through OpenAI and extract insights.
    """
    
    # Insight categories
    CATEGORIES = [
        'FEATURE_REQUEST',
        'CRITICAL_REVIEW',
        'COMPLIMENTS',
        'DISSATISFACTION',
        'COMPETITOR_MENTION',
        'PRICING_DISCUSSION',
        'RENEWAL_SIGNAL',
        'ESCALATION_NEEDED',
        'INTEGRATION_REQUEST',
        'SUPPORT_NEEDED',
    ]
    
    def __init__(self, api_key=None):
        """
        Initialize OpenAI client.
        
        Args:
            api_key: OpenAI API key (defaults to OPENAI_API_KEY from settings or environment)
        """
        if not OPENAI_AVAILABLE:
            self.api_key = None
            return
        
        # Try to get API key from various sources
        self.api_key = (
            api_key or 
            getattr(settings, 'OPENAI_API_KEY', None) or 
            os.getenv('OPENAI_API_KEY')
        )
        
        if self.api_key:
            # Initialize OpenAI client (new API style)
            self.client = openai.OpenAI(api_key=self.api_key)
        else:
            print("⚠️  Warning: OPENAI_API_KEY not set. AI processing will be skipped.")
            self.client = None
    
    def _build_prompt(self, meeting_summary, meeting_transcript):
        """
        Build prompt for OpenAI API.
        """
        categories_list = ', '.join(self.CATEGORIES)
        
        prompt = f"""Analyze the following meeting transcript and summary. Extract actionable insights and categorize them.

Categories to use: {categories_list}

For each insight found, provide:
1. Category (one of the categories above)
2. A one-sentence summary of the insight
3. Confidence level (0.0 to 1.0)
4. Approximate timestamp if mentioned in transcript (format: HH:MM:SS)

Meeting Summary:
{meeting_summary}

Meeting Transcript:
{meeting_transcript}

Return a JSON object with this structure:
{{
    "insights": [
        {{
            "category": "FEATURE_REQUEST",
            "sentence": "Customer requested advanced analytics dashboard",
            "confidence": 0.95,
            "timestamp": "00:15:30",
            "context": "Brief context about where this was mentioned"
        }}
    ],
    "overall_sentiment": "positive|neutral|negative",
    "key_topics": ["topic1", "topic2", "topic3"]
}}

Only include insights that are clearly actionable or significant. If no insights are found, return an empty insights array.
"""
        return prompt
    
    def process_meeting(self, gong_meeting):
        """
        Process a GongMeeting through OpenAI and extract insights.
        
        Args:
            gong_meeting: GongMeeting instance
        
        Returns:
            dict: Processed insights structure
        """
        if not OPENAI_AVAILABLE:
            return {
                'insights': [],
                'overall_sentiment': 'neutral',
                'key_topics': [],
                'error': 'OpenAI package not installed'
            }
        
        if not self.api_key:
            return {
                'insights': [],
                'overall_sentiment': 'neutral',
                'key_topics': [],
                'error': 'OpenAI API key not configured'
            }
        
        # Extract text for analysis
        meeting_summary = gong_meeting.meeting_summary or ''
        meeting_transcript = gong_meeting.meeting_transcript or ''
        
        # Use summary if transcript is not available
        text_to_analyze = meeting_transcript if meeting_transcript else meeting_summary
        
        if not text_to_analyze:
            return {
                'insights': [],
                'overall_sentiment': 'neutral',
                'key_topics': [],
                'error': 'No meeting text available for analysis'
            }
        
        try:
            # Build prompt
            prompt = self._build_prompt(meeting_summary, meeting_transcript)
            
            # Call OpenAI API
            if not self.client:
                raise ValueError("OpenAI client not initialized")
            
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",  # Using cost-effective model
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert at analyzing customer meetings and extracting actionable insights. Always return valid JSON."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.3,  # Lower temperature for more consistent results
                max_tokens=1000
            )
            
            # Parse response
            response_text = response.choices[0].message.content.strip()
            
            # Try to extract JSON from response (handle markdown code blocks)
            if '```json' in response_text:
                response_text = response_text.split('```json')[1].split('```')[0].strip()
            elif '```' in response_text:
                response_text = response_text.split('```')[1].split('```')[0].strip()
            
            insights_data = json.loads(response_text)
            
            # Validate structure
            if not isinstance(insights_data, dict):
                raise ValueError("Invalid response format")
            
            # Ensure required fields
            insights_data.setdefault('insights', [])
            insights_data.setdefault('overall_sentiment', 'neutral')
            insights_data.setdefault('key_topics', [])
            
            return insights_data
            
        except json.JSONDecodeError as e:
            print(f"Error parsing OpenAI response: {e}")
            print(f"Response was: {response_text[:200]}")
            return {
                'insights': [],
                'overall_sentiment': 'neutral',
                'key_topics': [],
                'error': f'Failed to parse AI response: {str(e)}'
            }
        except Exception as e:
            print(f"Error calling OpenAI API: {e}")
            return {
                'insights': [],
                'overall_sentiment': 'neutral',
                'key_topics': [],
                'error': f'OpenAI API error: {str(e)}'
            }
    
    def process_and_save_insights(self, gong_meeting):
        """
        Process meeting and save insights to database.
        
        Args:
            gong_meeting: GongMeeting instance
        
        Returns:
            bool: Success status
        """
        insights_data = self.process_meeting(gong_meeting)
        
        # Update meeting with insights
        gong_meeting.ai_insights = insights_data
        gong_meeting.ai_processed = True
        gong_meeting.ai_processed_at = timezone.now()
        
        # Set overall sentiment if available
        if insights_data.get('overall_sentiment'):
            sentiment = insights_data['overall_sentiment'].lower()
            if sentiment in ['positive', 'neutral', 'negative']:
                gong_meeting.overall_sentiment = sentiment
        
        # Set key topics
        if insights_data.get('key_topics'):
            gong_meeting.key_topics = insights_data['key_topics']
        
        gong_meeting.save()
        
        return True

