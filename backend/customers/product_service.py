"""
Product Catalog Service for SurveyMonkey Products
Loads product reference data and provides utilities for product matching and recommendations
"""
import json
import os
from typing import List, Dict, Any, Optional
from django.conf import settings

# Product catalog cache
_product_catalog = None

def load_product_catalog() -> List[Dict[str, Any]]:
    """
    Load product catalog from JSON file.
    Uses cached version if available.
    """
    global _product_catalog
    
    if _product_catalog is not None:
        return _product_catalog
    
    # Try to load from multiple possible locations
    # Priority: backend/data/ (copied for Docker), then mock-api-service (for local dev)
    possible_paths = [
        os.path.join(settings.BASE_DIR, 'data', 'products-reference.json'),  # Backend data directory
        os.path.join(settings.BASE_DIR, '..', 'mock-api-service', 'data', 'products-reference.json'),  # Local dev
        os.path.join(settings.BASE_DIR, '..', '..', 'mock-api-service', 'data', 'products-reference.json'),  # Alternative
        '/app/data/products-reference.json',  # Docker absolute path
        '/app/../mock-api-service/data/products-reference.json',  # Docker volume path
    ]
    
    for path in possible_paths:
        abs_path = os.path.abspath(path)
        if os.path.exists(abs_path):
            try:
                with open(abs_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    _product_catalog = data.get('products', [])
                    return _product_catalog
            except Exception as e:
                print(f"Error loading product catalog from {abs_path}: {e}")
                continue
    
    # Return empty list if file not found
    print("Warning: Product catalog file not found. Returning empty catalog.")
    _product_catalog = []
    return _product_catalog

def get_product_by_name(product_name: str) -> Optional[Dict[str, Any]]:
    """
    Get product details by product name.
    
    Args:
        product_name: Name of the product (e.g., "SurveyMonkey Enterprise (SME)")
    
    Returns:
        Product dictionary or None if not found
    """
    catalog = load_product_catalog()
    
    # Try exact match first
    for product in catalog:
        if product.get('product_name') == product_name:
            return product
    
    # Try partial match (case-insensitive)
    product_name_lower = product_name.lower()
    for product in catalog:
        catalog_name = product.get('product_name', '').lower()
        if product_name_lower in catalog_name or catalog_name in product_name_lower:
            return product
    
    return None

def get_all_products() -> List[Dict[str, Any]]:
    """Get all products from catalog"""
    return load_product_catalog()

def get_products_by_category(category: str) -> List[Dict[str, Any]]:
    """
    Get all products in a specific category.
    
    Args:
        category: Product category (e.g., "Survey & Feedback Platform")
    
    Returns:
        List of products in that category
    """
    catalog = load_product_catalog()
    return [p for p in catalog if p.get('category', '').lower() == category.lower()]

def get_use_cases_for_customer(customer_products: List[str], industry: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    Get relevant use cases for a customer based on their products.
    
    Args:
        customer_products: List of product names the customer uses
        industry: Customer's industry (optional, for filtering)
    
    Returns:
        List of use cases with product context
    """
    catalog = load_product_catalog()
    use_cases = []
    
    for product_name in customer_products:
        product = get_product_by_name(product_name)
        if product:
            # Get use cases for this product
            for use_case in product.get('sample_use_cases', []):
                use_cases.append({
                    'product_name': product.get('product_name'),
                    'product_category': product.get('category'),
                    'use_case': use_case,
                    'primary_use': product.get('primary_use'),
                    'key_features': product.get('key_features', [])
                })
    
    # Filter by industry if provided
    if industry:
        industry_lower = industry.lower()
        filtered_use_cases = []
        for use_case in use_cases:
            product = get_product_by_name(use_case['product_name'])
            if product:
                ideal_profiles = [p.lower() for p in product.get('ideal_customer_profiles', [])]
                # Check if industry matches any ideal profile
                if any(industry_lower in profile or profile in industry_lower for profile in ideal_profiles):
                    filtered_use_cases.append(use_case)
        
        if filtered_use_cases:
            return filtered_use_cases
    
    return use_cases

def get_upsell_opportunities(
    customer_products: List[str],
    similar_customers_products: Optional[List[List[str]]] = None,
    industry: Optional[str] = None,
    arr_range: Optional[tuple] = None
) -> List[Dict[str, Any]]:
    """
    Get upsell opportunities for a customer.
    
    Args:
        customer_products: List of product names the customer currently uses
        similar_customers_products: List of product lists from similar customers (for recommendations)
        industry: Customer's industry
        arr_range: Tuple of (min_arr, max_arr) for filtering
    
    Returns:
        List of upsell opportunities with reasoning
    """
    catalog = load_product_catalog()
    opportunities = []
    customer_product_names = [p.lower() for p in customer_products]
    
    # Get upsell opportunities from products customer already has
    for product_name in customer_products:
        product = get_product_by_name(product_name)
        if product:
            upsell_list = product.get('upsell_opportunities', [])
            for upsell_text in upsell_list:
                # Extract product name from upsell text (e.g., "SurveyMonkey Audience – for external...")
                upsell_product_name = upsell_text.split('–')[0].strip()
                upsell_product = get_product_by_name(upsell_product_name)
                
                if upsell_product and upsell_product_name.lower() not in customer_product_names:
                    opportunities.append({
                        'product_name': upsell_product.get('product_name'),
                        'category': upsell_product.get('category'),
                        'description': upsell_product.get('description'),
                        'reason': upsell_text,
                        'reason_type': 'product_upsell',
                        'key_features': upsell_product.get('key_features', []),
                        'ideal_customer_profiles': upsell_product.get('ideal_customer_profiles', [])
                    })
    
    # Get recommendations based on similar customers
    if similar_customers_products:
        # Count product frequency among similar customers
        product_frequency: Dict[str, int] = {}
        for similar_products in similar_customers_products:
            for product in similar_products:
                product_lower = product.lower()
                if product_lower not in customer_product_names:
                    product_frequency[product_lower] = product_frequency.get(product_lower, 0) + 1
        
        # Get top products used by similar customers
        sorted_products = sorted(product_frequency.items(), key=lambda x: x[1], reverse=True)
        
        for product_name_lower, frequency in sorted_products[:5]:  # Top 5
            product = get_product_by_name(product_name_lower)
            if product:
                opportunities.append({
                    'product_name': product.get('product_name'),
                    'category': product.get('category'),
                    'description': product.get('description'),
                    'reason': f'Used by {frequency} similar customer(s)',
                    'reason_type': 'similar_customers',
                    'key_features': product.get('key_features', []),
                    'ideal_customer_profiles': product.get('ideal_customer_profiles', []),
                    'similarity_score': frequency
                })
    
    # Filter by industry and ARR if provided
    if industry or arr_range:
        filtered_opportunities = []
        for opp in opportunities:
            product = get_product_by_name(opp['product_name'])
            if product:
                # Check industry match
                if industry:
                    ideal_profiles = [p.lower() for p in product.get('ideal_customer_profiles', [])]
                    industry_lower = industry.lower()
                    industry_match = any(industry_lower in profile or profile in industry_lower for profile in ideal_profiles)
                    if not industry_match:
                        continue
                
                filtered_opportunities.append(opp)
        
        if filtered_opportunities:
            return filtered_opportunities
    
    # Remove duplicates (same product with different reasons)
    seen_products = set()
    unique_opportunities = []
    for opp in opportunities:
        product_name_lower = opp['product_name'].lower()
        if product_name_lower not in seen_products:
            seen_products.add(product_name_lower)
            unique_opportunities.append(opp)
    
    return unique_opportunities

