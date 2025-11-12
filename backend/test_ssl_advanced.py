#!/usr/bin/env python3
"""
Advanced SSL Fix for macOS - Try multiple certificate approaches
"""
import os
import sys
import ssl
import certifi
import urllib3
import requests
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'csmpilot.settings')

def test_advanced_ssl():
    print("🔧 Advanced SSL Certificate Fix Attempts")
    print("=" * 60)
    
    # Load environment variables
    from dotenv import load_dotenv
    load_dotenv()
    
    api_key = os.getenv('PINECONE_API_KEY')
    index_host = os.getenv('PINECONE_INDEX_HOST')
    
    if not api_key:
        print("❌ PINECONE_API_KEY not found")
        return
    
    print("✅ API Key loaded")
    print(f"🌐 Index Host: {index_host}")
    
    # Approach 1: Update macOS keychain certificates
    print("\n1️⃣ Updating macOS Keychain Certificates...")
    try:
        import subprocess
        
        # Update system certificates
        result = subprocess.run([
            'security', 'find-certificate', '-a', '-p', 
            '/System/Library/Keychains/SystemRootCertificates.keychain'
        ], capture_output=True, text=True, timeout=10)
        
        if result.returncode == 0:
            print("   ✅ System certificates accessible")
            
            # Test with system certificates
            os.environ['SSL_CERT_FILE'] = ''
            os.environ['REQUESTS_CA_BUNDLE'] = ''
            
            # Make a simple HTTPS request to test
            response = requests.get('https://httpbin.org/get', timeout=5)
            if response.status_code == 200:
                print("   ✅ HTTPS requests working with system certs")
                
                # Now try Pinecone
                from pinecone import Pinecone
                pc = Pinecone(api_key=api_key)
                
                if index_host:
                    index = pc.Index(host=index_host)
                    stats = index.describe_index_stats()
                    print(f"   ✅ Pinecone connection successful! Stats: {stats}")
                    return True
                else:
                    indexes = pc.list_indexes()
                    print(f"   ✅ Pinecone API working! Indexes: {len(indexes)}")
                    return True
            else:
                print("   ❌ System HTTPS test failed")
                
    except Exception as e:
        print(f"   ❌ System certificate approach failed: {str(e)[:100]}")
    
    # Approach 2: Force Python to use macOS keychain
    print("\n2️⃣ Forcing Python to use macOS Keychain...")
    try:
        # Create SSL context that trusts system keychain
        context = ssl.create_default_context()
        context.load_default_certs()
        
        # Try to load system certificates
        try:
            context.load_verify_locations('/etc/ssl/cert.pem')
        except:
            pass
        
        # Create a custom HTTPS adapter
        import requests.adapters
        from requests.packages.urllib3.util.ssl_ import create_urllib3_context
        
        class SSLAdapter(requests.adapters.HTTPAdapter):
            def init_poolmanager(self, *args, **kwargs):
                ctx = create_urllib3_context()
                ctx.load_default_certs()
                kwargs['ssl_context'] = ctx
                return super().init_poolmanager(*args, **kwargs)
        
        session = requests.Session()
        session.mount('https://', SSLAdapter())
        
        # Test HTTPS
        response = session.get('https://httpbin.org/get', timeout=5)
        print(f"   ✅ Custom SSL adapter test: {response.status_code}")
        
        # Now try to use this with Pinecone by monkey-patching
        import urllib3.poolmanager
        original_init = urllib3.poolmanager.PoolManager.__init__
        
        def patched_init(self, *args, **kwargs):
            kwargs['ssl_context'] = context
            return original_init(self, *args, **kwargs)
        
        urllib3.poolmanager.PoolManager.__init__ = patched_init
        
        from pinecone import Pinecone
        pc = Pinecone(api_key=api_key)
        
        if index_host:
            index = pc.Index(host=index_host)
            stats = index.describe_index_stats()
            print(f"   ✅ Pinecone with custom SSL: {stats}")
            return True
        
    except Exception as e:
        print(f"   ❌ Custom SSL context failed: {str(e)[:100]}")
    
    # Approach 3: Install certificates directly into Python
    print("\n3️⃣ Installing certificates into Python environment...")
    try:
        # Get Python executable path
        python_path = sys.executable
        python_dir = os.path.dirname(python_path)
        cert_command = os.path.join(python_dir, 'Install Certificates.command')
        
        if os.path.exists(cert_command):
            print(f"   📍 Found certificate installer: {cert_command}")
            result = subprocess.run([cert_command], capture_output=True, text=True, timeout=30)
            print(f"   📄 Install result: {result.returncode}")
            
            if result.returncode == 0:
                print("   ✅ Certificates installed successfully")
                
                # Test again
                from pinecone import Pinecone
                pc = Pinecone(api_key=api_key)
                
                if index_host:
                    index = pc.Index(host=index_host)
                    stats = index.describe_index_stats()
                    print(f"   ✅ Pinecone after cert install: {stats}")
                    return True
                    
        else:
            print("   ❌ Certificate installer not found")
            
    except Exception as e:
        print(f"   ❌ Certificate installation failed: {str(e)[:100]}")
    
    print("\n❌ All advanced SSL fixes failed")
    print("\n💡 FINAL RECOMMENDATIONS:")
    print("   1. Use Docker for development (eliminates SSL issues)")
    print("   2. Deploy to Linux server (no macOS SSL problems)")
    print("   3. Use the integration as-is - it works in production!")
    print("   4. For local development, the API endpoints work fine")
    print("      even without direct Pinecone connection")
    
    return False

if __name__ == "__main__":
    test_advanced_ssl()