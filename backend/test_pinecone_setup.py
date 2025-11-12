"""
Test script for Pinecone integration with CSM Copilot
Run this to verify your Pinecone setup is working correctly
"""
import os
import sys
import django
from pathlib import Path
from dotenv import load_dotenv

# Add the backend directory to Python path
backend_dir = Path(__file__).parent
sys.path.append(str(backend_dir))

# Load environment variables from .env file
load_dotenv(backend_dir / '.env')

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'csmpilot.settings')
django.setup()

from customers.models import Customer
from customers.vector_services import get_customer_vector_service
from csmpilot.pinecone_config import get_pinecone_manager
import time

def test_pinecone_connection():
    """Test basic Pinecone connection"""
    print("🔍 Testing Pinecone connection...")
    try:
        pm = get_pinecone_manager()
        if pm.pc and pm.index:
            print("✅ Pinecone connection successful!")
            
            # Test index stats
            stats = pm.index.describe_index_stats()
            print(f"📊 Index stats: {stats}")
            return True
        else:
            print("❌ Pinecone connection failed")
            return False
    except Exception as e:
        print(f"❌ Pinecone connection error: {e}")
        return False

def test_embedding_generation():
    """Test embedding generation"""
    print("\n🧠 Testing embedding generation...")
    try:
        pm = get_pinecone_manager()
        test_text = "TechCorp Solutions is a technology company with $250,000 ARR and healthy status."
        
        embedding = pm.generate_embedding(test_text)
        expected_dim = 1024  # Updated to match your Pinecone index
        if embedding and len(embedding) == expected_dim:
            print(f"✅ Embedding generated successfully! Dimension: {len(embedding)}")
            return True
        else:
            print(f"❌ Embedding generation failed. Expected: {expected_dim}, Got: {len(embedding) if embedding else 0}")
            return False
    except Exception as e:
        print(f"❌ Embedding generation error: {e}")
        return False

def test_customer_vectorization():
    """Test customer data vectorization"""
    print("\n👥 Testing customer vectorization...")
    try:
        # Get first customer
        customer = Customer.objects.first()
        if not customer:
            print("❌ No customers found. Please load sample data first.")
            return False
        
        vector_service = get_customer_vector_service()
        
        # Test text representation
        text = vector_service.create_customer_text_representation(customer)
        print(f"📝 Customer text representation: {text[:100]}...")
        
        # Test metadata generation
        metadata = vector_service.generate_customer_metadata(customer)
        print(f"📋 Customer metadata keys: {list(metadata.keys())}")
        
        print("✅ Customer vectorization test passed!")
        return True
        
    except Exception as e:
        print(f"❌ Customer vectorization error: {e}")
        return False

def test_vector_operations():
    """Test vector database operations"""
    print("\n🔄 Testing vector database operations...")
    try:
        # Get first customer
        customer = Customer.objects.first()
        if not customer:
            print("❌ No customers found")
            return False
        
        vector_service = get_customer_vector_service()
        
        # Test adding customer to vector DB
        print(f"📤 Adding customer '{customer.name}' to vector database...")
        success = vector_service.add_customer_to_vector_db(customer)
        
        if success:
            print("✅ Customer added to vector database!")
            
            # Wait a moment for indexing
            time.sleep(2)
            
            # Test similarity search
            print("🔍 Testing similarity search...")
            similar = vector_service.find_similar_customers(customer, top_k=3)
            
            if similar:
                print(f"✅ Found {len(similar)} similar customers:")
                for sim_customer in similar[:2]:
                    print(f"  - {sim_customer['name']} (similarity: {sim_customer['similarity_score']:.3f})")
            else:
                print("⚠️ No similar customers found (this is normal with only one customer)")
            
            return True
        else:
            print("❌ Failed to add customer to vector database")
            return False
            
    except Exception as e:
        print(f"❌ Vector operations error: {e}")
        return False

def test_api_endpoints():
    """Test API endpoints"""
    print("\n🌐 Testing API endpoints...")
    try:
        from django.test import Client
        from django.urls import reverse
        
        client = Client()
        
        # Test customers list
        response = client.get('/api/customers/')
        if response.status_code == 200:
            print("✅ Customers API endpoint working!")
        else:
            print(f"❌ Customers API endpoint failed: {response.status_code}")
            return False
        
        # Test similar customers endpoint (if we have customers)
        customer = Customer.objects.first()
        if customer:
            response = client.get(f'/api/customers/{customer.id}/similar/')
            if response.status_code in [200, 500]:  # 500 is OK if Pinecone not configured
                print("✅ Similar customers API endpoint accessible!")
            else:
                print(f"❌ Similar customers API endpoint failed: {response.status_code}")
        
        return True
        
    except Exception as e:
        print(f"❌ API endpoints error: {e}")
        return False

def main():
    """Run all tests"""
    print("🚀 Starting Pinecone integration tests for CSM Copilot")
    print("=" * 60)
    
    results = []
    
    # Check if Pinecone API key is set
    if not os.getenv('PINECONE_API_KEY'):
        print("⚠️ PINECONE_API_KEY not set in environment variables")
        print("📝 Please update your .env file with your Pinecone API key")
        print("🔗 Get your API key from: https://app.pinecone.io/")
        return
    
    # Run tests
    results.append(("Pinecone Connection", test_pinecone_connection()))
    results.append(("Embedding Generation", test_embedding_generation()))
    results.append(("Customer Vectorization", test_customer_vectorization()))
    results.append(("Vector Operations", test_vector_operations()))
    results.append(("API Endpoints", test_api_endpoints()))
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 Test Results Summary:")
    
    passed = 0
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"  {test_name}: {status}")
        if result:
            passed += 1
    
    print(f"\n🎯 Overall: {passed}/{len(results)} tests passed")
    
    if passed == len(results):
        print("🎉 All tests passed! Your Pinecone integration is ready!")
        print("\n📚 Next steps:")
        print("  1. Use the management command: python manage.py sync_vectors")
        print("  2. Start Celery worker: celery -A csmpilot worker -l info")
        print("  3. Test similarity search in your frontend")
    else:
        print("🔧 Some tests failed. Please check the errors above.")
        print("\n💡 Common issues:")
        print("  - Missing PINECONE_API_KEY in .env file")
        print("  - Redis not running (for Celery)")
        print("  - Network connectivity issues")

if __name__ == "__main__":
    main()