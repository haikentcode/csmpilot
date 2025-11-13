"""
AI-powered Use Cases Service
Uses OpenAI to intelligently filter and return relevant use cases based on customer industry/segment.
"""

import json
import os
from typing import List, Dict, Any, Optional
from django.conf import settings

# Try to import openai
try:
    import openai
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False

# Use cases reference cache
_use_cases_reference = None


def load_use_cases_reference() -> Dict[str, Any]:
    """Load use cases reference data"""
    global _use_cases_reference
    
    if _use_cases_reference is not None:
        return _use_cases_reference
    
    # Try to load from backend/data directory
    possible_paths = [
        os.path.join(settings.BASE_DIR, 'data', 'use-cases-reference.json'),
        os.path.join(settings.BASE_DIR, '..', 'data', 'use-cases-reference.json'),
        '/app/data/use-cases-reference.json',  # Docker path
    ]
    
    for path in possible_paths:
        abs_path = os.path.abspath(path)
        if os.path.exists(abs_path):
            try:
                with open(abs_path, 'r', encoding='utf-8') as f:
                    _use_cases_reference = json.load(f)
                    return _use_cases_reference
            except Exception as e:
                print(f"Error loading use cases reference from {abs_path}: {e}")
                continue
    
    # Return default structure if file not found
    print("Warning: Use cases reference file not found. Using default structure.")
    _use_cases_reference = {
        "use_cases": {},
        "industry_mapping": {}
    }
    return _use_cases_reference


def get_ai_filtered_use_cases(
    customer_products: List[str],
    industry: str,
    customer_name: Optional[str] = None,
    arr: Optional[float] = None
) -> List[Dict[str, Any]]:
    """
    Use AI to intelligently filter and return relevant use cases based on customer context.
    
    Args:
        customer_products: List of product names customer is using
        industry: Customer industry (healthcare, technology, finance, etc.)
        customer_name: Customer name (optional, for context)
        arr: Customer ARR (optional, for context)
    
    Returns:
        List of relevant use cases with AI-generated descriptions
    """
    if not OPENAI_AVAILABLE:
        # Fallback to basic filtering if OpenAI not available
        return get_basic_filtered_use_cases(customer_products, industry)
    
    # Get OpenAI API key
    api_key = (
        getattr(settings, 'OPENAI_API_KEY', None) or 
        os.getenv('OPENAI_API_KEY')
    )
    
    if not api_key:
        print("Warning: OPENAI_API_KEY not set. Using basic filtering.")
        return get_basic_filtered_use_cases(customer_products, industry)
    
    try:
        # Load use cases reference
        use_cases_ref = load_use_cases_reference()
        all_use_cases = use_cases_ref.get('use_cases', {})
        industry_mapping = use_cases_ref.get('industry_mapping', {})
        
        # Get relevant use case categories for this industry
        relevant_categories = industry_mapping.get(industry.lower(), [])
        
        # Build context for AI
        products_str = ', '.join(customer_products) if customer_products else 'None'
        arr_str = f"${arr:,.0f} per year" if arr else "Not specified"
        context = f"""
Customer Context:
- Industry: {industry}
- Products: {products_str}
- Customer Name: {customer_name or 'Unknown'}
- ARR: {arr_str}

Available Use Case Categories:
"""
        
        # Add all use cases from relevant categories
        available_use_cases_list = []
        for category in relevant_categories:
            if category in all_use_cases:
                for use_case in all_use_cases[category]:
                    available_use_cases_list.append(f"- {category}: {use_case}")
        
        context += '\n'.join(available_use_cases_list)
        
        # Build AI prompt
        prompt = f"""You are a Customer Success Manager helping a {industry} company understand how to use SurveyMonkey products effectively.

Customer is using: {products_str}

Based on the customer's industry ({industry}) and their products, select the MOST RELEVANT use cases from the list below that would be valuable for this customer.

Available Use Cases:
{context}

Return a JSON array of the top 5-8 most relevant use cases. For each use case, provide:
- category: The category it belongs to (HR, IT, Customer Experience, Marketing, Healthcare, Technology, etc.)
- use_case: The specific use case name
- description: A brief, specific description of how this {industry} company could use this use case
- product_match: Which of their products ({products_str}) would be best for this use case

Format:
[
  {{
    "category": "Customer Experience",
    "use_case": "CSAT",
    "description": "Specific description for {industry} companies",
    "product_match": "SurveyMonkey Enterprise (SME)"
  }}
]

Focus on use cases that are:
1. Most relevant to {industry} industry
2. Practical and actionable
3. Aligned with their current products
4. Valuable for CSM to pitch to customer
"""
        
        # Call OpenAI
        client = openai.OpenAI(api_key=api_key)
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert Customer Success Manager who helps customers understand how to use SurveyMonkey products effectively. Always return valid JSON arrays."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.7,
            max_tokens=1500
        )
        
        # Parse response
        response_text = response.choices[0].message.content.strip()
        
        # Extract JSON from response
        if '```json' in response_text:
            response_text = response_text.split('```json')[1].split('```')[0].strip()
        elif '```' in response_text:
            response_text = response_text.split('```')[1].split('```')[0].strip()
        
        ai_use_cases = json.loads(response_text)
        
        # Ensure it's a list
        if not isinstance(ai_use_cases, list):
            ai_use_cases = [ai_use_cases]
        
        # Enrich with product information
        from .product_service import get_product_by_name
        
        enriched_use_cases = []
        for uc in ai_use_cases[:8]:  # Limit to top 8
            product_name = uc.get('product_match', customer_products[0] if customer_products else 'SurveyMonkey Enterprise (SME)')
            product = get_product_by_name(product_name)
            
            enriched_use_cases.append({
                'category': uc.get('category', 'General'),
                'use_case': uc.get('use_case', ''),
                'description': uc.get('description', ''),
                'product_name': product.get('product_name', product_name) if product else product_name,
                'product_category': product.get('category', '') if product else '',
                'primary_use': product.get('primary_use', '') if product else '',
                'key_features': product.get('key_features', []) if product else []
            })
        
        return enriched_use_cases
        
    except Exception as e:
        print(f"Error in AI use cases filtering: {e}")
        # Fallback to basic filtering
        return get_basic_filtered_use_cases(customer_products, industry)


def get_basic_filtered_use_cases(
    customer_products: List[str],
    industry: str
) -> List[Dict[str, Any]]:
    """
    Fallback method: Basic filtering without AI.
    Uses industry mapping to filter use cases.
    """
    use_cases_ref = load_use_cases_reference()
    all_use_cases = use_cases_ref.get('use_cases', {})
    industry_mapping = use_cases_ref.get('industry_mapping', {})
    
    # Get relevant categories for industry
    relevant_categories = industry_mapping.get(industry.lower(), ['Customer Experience', 'HR', 'Marketing'])
    
    # Collect use cases from relevant categories
    filtered_use_cases = []
    from .product_service import get_product_by_name
    
    # Get primary product for context
    primary_product = customer_products[0] if customer_products else None
    product = get_product_by_name(primary_product) if primary_product else None
    
    for category in relevant_categories:
        if category in all_use_cases:
            for use_case_name in all_use_cases[category][:3]:  # Top 3 per category
                filtered_use_cases.append({
                    'category': category,
                    'use_case': use_case_name,
                    'description': f"{use_case_name} for {industry} companies",
                    'product_name': product.get('product_name', primary_product) if product else primary_product or 'SurveyMonkey Enterprise (SME)',
                    'product_category': product.get('category', '') if product else '',
                    'primary_use': product.get('primary_use', '') if product else '',
                    'key_features': product.get('key_features', []) if product else []
                })
    
    return filtered_use_cases[:8]  # Return top 8

