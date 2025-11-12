#!/usr/bin/env python3

import os
import sys
import django
import requests
from django.conf import settings

# Add the project directory to the Python path
sys.path.insert(0, '/Users/hregar/Developer/experiments/csmpilot/backend')

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'csmpilot.settings')
django.setup()

def test_sync_endpoint():
    """Test the sync endpoint directly"""
    print("🧪 Testing Sync Endpoint")
    print("=" * 50)
    
    base_url = "http://localhost:8000"
    
    # Test if Django server is running
    try:
        response = requests.get(f"{base_url}/api/customers/", timeout=5)
        print(f"✅ Django server running: {response.status_code}")
        
        customers = response.json()
        if customers and len(customers) > 0:
            customer_id = customers[0]['id']
            print(f"📋 Testing sync for customer ID: {customer_id}")
            
            # Test sync endpoint with underscores (DRF default)
            sync_url = f"{base_url}/api/customers/{customer_id}/sync_vectors/"
            print(f"🔗 Testing URL: {sync_url}")
            
            try:
                response = requests.post(sync_url, timeout=10)
                print(f"📡 Sync response: {response.status_code}")
                
                if response.status_code == 200:
                    print(f"✅ Sync endpoint working!")
                    try:
                        print(f"📄 Response: {response.json()}")
                    except:
                        print(f"📄 Response: {response.text}")
                elif response.status_code == 404:
                    print(f"❌ Sync endpoint not found (404)")
                    print(f"📄 Response: {response.text}")
                    
                    # Try alternative URL pattern with hyphens
                    alt_url = f"{base_url}/api/customers/{customer_id}/sync-vectors/"
                    print(f"🔗 Trying alternative URL: {alt_url}")
                    try:
                        alt_response = requests.post(alt_url, timeout=10)
                        print(f"📡 Alternative response: {alt_response.status_code}")
                        
                        if alt_response.status_code == 200:
                            print(f"✅ Alternative URL works!")
                            try:
                                print(f"📄 Response: {alt_response.json()}")
                            except:
                                print(f"📄 Response: {alt_response.text}")
                        else:
                            print(f"❌ Alternative URL also failed: {alt_response.status_code}")
                            print(f"📄 Response: {alt_response.text}")
                    except Exception as e:
                        print(f"❌ Alternative URL error: {e}")
                else:
                    print(f"❌ Sync endpoint failed: {response.status_code}")
                    print(f"📄 Response: {response.text}")
                    
            except Exception as e:
                print(f"❌ Request error: {e}")
        else:
            print("❌ No customers found to test with")
            
    except requests.exceptions.ConnectionError:
        print("❌ Django server not running. Please start with: python manage.py runserver")
    except Exception as e:
        print(f"❌ Error: {e}")

def test_url_resolution():
    """Test Django URL resolution"""
    print("\n🔍 Testing Django URL Resolution")
    print("=" * 50)
    
    try:
        from django.urls import reverse
        from customers.models import Customer
        
        # Get a customer
        customer = Customer.objects.first()
        if customer:
            print(f"📋 Testing with customer ID: {customer.id}")
            
            # Try to reverse the URL
            try:
                url = reverse('customer-sync-vectors', kwargs={'pk': customer.id})
                print(f"✅ Resolved URL: {url}")
            except Exception as e:
                print(f"❌ URL reverse failed: {e}")
                
                # Let's see what URLs are available
                from django.urls import get_resolver
                resolver = get_resolver()
                print("🔍 Available URL patterns:")
                for pattern in resolver.url_patterns:
                    print(f"   {pattern}")
        else:
            print("❌ No customers found")
            
    except Exception as e:
        print(f"❌ URL resolution test error: {e}")

if __name__ == "__main__":
    test_sync_endpoint()
    test_url_resolution()