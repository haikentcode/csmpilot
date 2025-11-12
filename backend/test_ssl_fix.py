#!/usr/bin/env python3
"""
Direct SSL Test for Pinecone Connection
"""
import os
import sys
import ssl
import certifi
import urllib3
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'csmpilot.settings')

def test_ssl_approaches():
    print("🔐 Testing SSL Certificate Approaches")
    print("=" * 50)
    
    # Load environment variables
    from dotenv import load_dotenv
    load_dotenv()
    
    api_key = os.getenv('PINECONE_API_KEY')
    index_name = os.getenv('PINECONE_INDEX_NAME', 'csm-pilot')
    index_host = os.getenv('PINECONE_INDEX_HOST', 'https://csm-pilot-w9uksjc.svc.aped-4627-b74a.pinecone.io')
    
    if not api_key:
        print("❌ PINECONE_API_KEY not found")
        return
    
    print("✅ API Key loaded")
    print(f"📍 Index: {index_name}")
    print(f"🌐 Host: {index_host}")
    
    # Approach 1: Default SSL context with certifi
    print("\n1️⃣ Testing with certifi certificates...")
    try:
        cert_path = certifi.where()
        print(f"   📍 Certificate path: {cert_path}")
        
        os.environ['SSL_CERT_FILE'] = cert_path
        os.environ['REQUESTS_CA_BUNDLE'] = cert_path
        os.environ['CURL_CA_BUNDLE'] = cert_path
        
        from pinecone import Pinecone
        pc = Pinecone(api_key=api_key)
        
        # Try to connect to specific index instead of listing all indexes
        try:
            index = pc.Index(index_name, host=index_host)
            # Test a simple operation
            stats = index.describe_index_stats()
            print(f"   ✅ Success! Index stats: {stats}")
            return True
        except Exception as idx_e:
            # Fallback to listing indexes
            indexes = pc.list_indexes()
            print(f"   ✅ Success! Found indexes: {[idx.name for idx in indexes]}")
            return True
        
    except Exception as e:
        print(f"   ❌ Failed: {str(e)[:100]}")
    
    # Approach 2: Unverified SSL context
    print("\n2️⃣ Testing with unverified SSL context...")
    try:
        # Create unverified SSL context
        ssl_context = ssl.create_default_context()
        ssl_context.check_hostname = False
        ssl_context.verify_mode = ssl.CERT_NONE
        
        # Disable SSL warnings
        urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
        
        from pinecone import Pinecone
        pc = Pinecone(api_key=api_key)
        
        # Try direct index connection
        index = pc.Index(index_name, host=index_host)
        stats = index.describe_index_stats()
        print(f"   ✅ Success! Index stats: {stats}")
        return True
        
    except Exception as e:
        print(f"   ❌ Failed: {str(e)[:100]}")
    
    # Approach 3: System certificates
    print("\n3️⃣ Testing with system certificates...")
    try:
        # Clear previous SSL settings
        for key in ['SSL_CERT_FILE', 'REQUESTS_CA_BUNDLE', 'CURL_CA_BUNDLE']:
            os.environ.pop(key, None)
        
        # Try common system certificate locations
        system_certs = [
            '/System/Library/OpenSSL/certs/cert.pem',
            '/etc/ssl/certs/ca-certificates.crt',
            '/usr/local/etc/openssl/cert.pem',
            '/opt/homebrew/etc/ca-certificates/cert.pem'
        ]
        
        for cert_file in system_certs:
            if os.path.exists(cert_file):
                print(f"   📍 Trying: {cert_file}")
                os.environ['SSL_CERT_FILE'] = cert_file
                os.environ['REQUESTS_CA_BUNDLE'] = cert_file
                break
        
        from pinecone import Pinecone
        pc = Pinecone(api_key=api_key)
        
        # Try direct index connection
        index = pc.Index(index_name, host=index_host)
        stats = index.describe_index_stats()
        print(f"   ✅ Success! Index stats: {stats}")
        return True
        
    except Exception as e:
        print(f"   ❌ Failed: {str(e)[:100]}")
    
    print("\n❌ All SSL approaches failed")
    print("💡 Recommendation: Use Docker or Linux for production")
    return False

if __name__ == "__main__":
    test_ssl_approaches()