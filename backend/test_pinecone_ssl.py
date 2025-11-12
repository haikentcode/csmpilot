#!/usr/bin/env python
import os
import sys
import django
import ssl

# Add the backend directory to Python path
sys.path.append('/app')

# Set Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'csmpilot.settings')
django.setup()

from csmpilot.pinecone_config import PineconeManager

def test_pinecone_ssl():
    try:
        print("Testing Pinecone SSL connection...")
        pm = PineconeManager()
        
        # Test if we can connect
        index_stats = pm.index.describe_index_stats()
        print(f"✅ Pinecone connection successful!")
        print(f"Index stats: {index_stats}")
        
        # Test embedding generation
        test_text = "Test customer data"
        embedding = pm.generate_embedding(test_text)
        print(f"✅ Embedding generation successful! Dimension: {len(embedding)}")
        
        return True
    except Exception as e:
        print(f"❌ Pinecone test failed: {e}")
        return False

if __name__ == "__main__":
    test_pinecone_ssl()