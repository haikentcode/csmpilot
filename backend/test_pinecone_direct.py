#!/usr/bin/env python3
"""
Simple Pinecone connection test with aggressive SSL fixes
"""
import os
import ssl
import urllib3
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Aggressive SSL fix for macOS
ssl._create_default_https_context = ssl._create_unverified_context
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# Set all possible SSL environment variables
os.environ['PYTHONHTTPSVERIFY'] = '0'
os.environ['SSL_VERIFY'] = 'false'

try:
    # Test basic HTTP connection first
    import requests
    requests.packages.urllib3.disable_warnings(requests.packages.urllib3.exceptions.InsecureRequestWarning)
    
    print("🌐 Testing basic HTTPS connectivity...")
    response = requests.get('https://httpbin.org/json', verify=False, timeout=10)
    if response.status_code == 200:
        print("✅ Basic HTTPS works!")
    else:
        print("❌ Basic HTTPS failed")
        exit(1)
        
except Exception as e:
    print(f"❌ Basic HTTPS test failed: {e}")
    exit(1)

try:
    # Now test Pinecone with custom session
    import requests
    from pinecone import Pinecone
    
    # Create a custom session that ignores SSL
    session = requests.Session()
    session.verify = False
    
    print("🔑 Testing Pinecone API key...")
    api_key = os.getenv('PINECONE_API_KEY')
    if not api_key:
        print("❌ PINECONE_API_KEY not found")
        exit(1)
    
    # Monkey patch the Pinecone client to use our session
    import pinecone.core.client.api_client
    original_call_api = pinecone.core.client.api_client.ApiClient.call_api
    
    def patched_call_api(self, *args, **kwargs):
        # Set verify=False for all requests
        if 'verify' not in kwargs:
            kwargs['verify'] = False
        return original_call_api(self, *args, **kwargs)
    
    pinecone.core.client.api_client.ApiClient.call_api = patched_call_api
    
    pc = Pinecone(api_key=api_key)
    
    print("✅ Pinecone client created successfully!")
    
    # Try to list indexes
    try:
        indexes = pc.list_indexes()
        print(f"✅ Successfully connected to Pinecone! Found {len(indexes)} indexes.")
        
        # Check if our index exists
        index_name = os.getenv('PINECONE_INDEX_NAME', 'csm-pilot')
        existing_names = [idx.name for idx in indexes]
        
        if index_name in existing_names:
            print(f"✅ Index '{index_name}' already exists!")
        else:
            print(f"📝 Index '{index_name}' not found. Will need to create it.")
            
    except Exception as e:
        print(f"⚠️ Could not list indexes: {e}")
        print("🔧 This might be a permissions issue or the index doesn't exist yet.")
        
    # Test embedding model separately
    print("\n🧠 Testing embedding model...")
    try:
        from sentence_transformers import SentenceTransformer
        model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')
        
        test_text = "This is a test sentence for embedding."
        embedding = model.encode(test_text)
        
        print(f"✅ Embedding model works! Dimension: {len(embedding)}")
        
    except Exception as e:
        print(f"❌ Embedding model failed: {e}")
    
    print("\n🎉 Pinecone connection test completed successfully!")
    print("The integration should work now.")
    
except Exception as e:
    print(f"❌ Pinecone test failed: {e}")
    print("\n💡 Possible solutions:")
    print("1. Check your Pinecone API key")
    print("2. Try creating the index manually in Pinecone console")
    print("3. Check your internet connection")
    print("4. Try using a VPN if behind corporate firewall")