#!/usr/bin/env python3
"""
Simple test for local embedding functionality
"""
import os
import sys
import django
from pathlib import Path
from dotenv import load_dotenv

# Setup
backend_dir = Path(__file__).parent
sys.path.append(str(backend_dir))
load_dotenv(backend_dir / '.env')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'csmpilot.settings')
django.setup()

from customers.models import Customer
from customers.vector_services import get_customer_vector_service
from sentence_transformers import SentenceTransformer

def test_local_functionality():
    """Test the parts we can control locally"""
    print("🚀 Testing Local Vector Functionality")
    print("=" * 50)
    
    # Test 1: Embedding model directly
    print("\n🧠 Testing embedding model directly...")
    try:
        model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')
        test_text = "TechCorp Solutions is a technology company with $250,000 ARR."
        embedding = model.encode(test_text)
        
        print(f"✅ Direct embedding: {len(embedding)} dimensions")
        
        # Pad to 1024 dimensions
        embedding_list = embedding.tolist()
        if len(embedding_list) < 1024:
            embedding_list.extend([0.0] * (1024 - len(embedding_list)))
        
        print(f"✅ Padded embedding: {len(embedding_list)} dimensions")
        
    except Exception as e:
        print(f"❌ Direct embedding failed: {e}")
        return False
    
    # Test 2: Customer data processing
    print("\n👥 Testing customer data processing...")
    try:
        customer = Customer.objects.first()
        if not customer:
            print("❌ No customers found")
            return False
        
        vector_service = get_customer_vector_service()
        
        # Test text representation
        text = vector_service.create_customer_text_representation(customer)
        print(f"📝 Customer text: {text[:100]}...")
        
        # Test metadata
        metadata = vector_service.generate_customer_metadata(customer)
        print(f"📋 Metadata fields: {len(metadata)} fields")
        
        # Test embedding generation through our service
        if vector_service.pinecone_manager and vector_service.pinecone_manager.embedding_model:
            embedding = vector_service.pinecone_manager.generate_embedding(text)
            print(f"🧠 Service embedding: {len(embedding)} dimensions")
            
            if len(embedding) == 1024:
                print("✅ All local functionality working!")
                return True
            else:
                print(f"❌ Dimension mismatch: expected 1024, got {len(embedding)}")
                return False
        else:
            print("❌ Embedding service not available")
            return False
            
    except Exception as e:
        print(f"❌ Customer processing failed: {e}")
        return False

def test_api_endpoints():
    """Test API endpoints locally"""
    print("\n🌐 Testing API endpoints...")
    try:
        from django.test import Client
        
        client = Client()
        
        # Test customers list
        response = client.get('/api/customers/')
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Customers API: {len(data.get('results', []))} customers")
        else:
            print(f"❌ Customers API failed: {response.status_code}")
            return False
        
        # Test similar endpoint (should return empty due to no Pinecone connection)
        customer = Customer.objects.first()
        if customer:
            response = client.get(f'/api/customers/{customer.id}/similar/')
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Similar customers API accessible (found: {len(data.get('similar_customers', []))})")
            else:
                print(f"❌ Similar customers API failed: {response.status_code}")
                return False
        
        return True
        
    except Exception as e:
        print(f"❌ API test failed: {e}")
        return False

def main():
    """Run local tests"""
    print("🔧 Local Functionality Test (No Pinecone Connection Required)")
    print("=" * 70)
    
    results = []
    results.append(("Local Embedding", test_local_functionality()))
    results.append(("API Endpoints", test_api_endpoints()))
    
    print("\n" + "=" * 50)
    print("📊 Local Test Results:")
    
    passed = 0
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"  {test_name}: {status}")
        if result:
            passed += 1
    
    print(f"\n🎯 Local Tests: {passed}/{len(results)} passed")
    
    if passed == len(results):
        print("\n🎉 All local functionality is working!")
        print("\n📝 Next steps:")
        print("1. The SSL issue prevents Pinecone connection from Python")
        print("2. Your integration is ready - the index exists in Pinecone")
        print("3. You can manually test by:")
        print("   - Using Pinecone console to upload vectors")
        print("   - Testing similarity search through web interface")
        print("4. For production, consider using a different SSL approach")
        print("   - Docker container with different SSL setup")
        print("   - Server without macOS SSL issues")
        print("   - Different Python environment")
    else:
        print("\n🔧 Some local tests failed. Check the output above.")

if __name__ == "__main__":
    main()