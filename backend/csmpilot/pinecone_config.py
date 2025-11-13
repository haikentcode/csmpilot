"""
Pinecone Vector Database Configuration for CSM Copilot
"""
import os
from typing import Dict, Any, Optional
import requests
import json

from openai import OpenAI

import ssl

# Fix missing SSL cert paths
default_cert = "/etc/ssl/certs/ca-certificates.crt"
if not os.path.exists(os.environ.get("SSL_CERT_FILE", "")) and os.path.exists(default_cert):
    os.environ["SSL_CERT_FILE"] = default_cert
    

# # Redirect Pinecone config to /tmp so it always exists
# os.environ["PINECONE_CONFIG_DIR"] = "/tmp"

# Pinecone Configuration
PINECONE_CONFIG = {
    'api_key': os.getenv('PINECONE_API_KEY'),
    'environment': os.getenv('PINECONE_ENVIRONMENT', 'us-east-1'),
    'index_name': os.getenv('PINECONE_INDEX_NAME', 'csm-pilot'),
    'index_host': os.getenv('PINECONE_INDEX_HOST', 'https://csm-pilot-w9uksjc.svc.aped-4627-b74a.pinecone.io'),
    'dimension': 1024,  # Updated to match your Pinecone index
    'metric': 'cosine',
    'cloud': 'aws',
    'region': 'us-east-1'
}

# Embedding Model Configuration - Using OpenAI's text-embedding-3-large
EMBEDDING_CONFIG = {
    'model_name': 'text-embedding-3-large',
    'api_key': os.getenv('OPENAI_API_KEY'),
    'dimensions': 1024,  # text-embedding-3-large supports up to 3072, we use 1024 for Pinecone
}

class PineconeManager:
    """Manage Pinecone vector database operations"""

    def __init__(self):
        self.api_key = None
        self.index_host = None
        self.headers = None
        self.embedding_model = None
        self.openai_client = None
        self.index = None  # Add index attribute for compatibility
        self._initialize()
    
    def _initialize(self):
        """Initialize Pinecone client and embedding model"""
        try:
            if not PINECONE_CONFIG['api_key']:
                raise ValueError("PINECONE_API_KEY environment variable is required")

            print("Connecting to Pinecone...")

            # Configure Pinecone REST client
            self.api_key = PINECONE_CONFIG['api_key']
            self.index_host = PINECONE_CONFIG['index_host']
            self.headers = {
                'Api-Key': self.api_key,
                'Content-Type': 'application/json'
            }

            print("✅ Configured Pinecone REST client")
            print(f"📡 Using host: {self.index_host}")
            self.index = "rest_client_ready"

            # Initialize embedding model (OpenAI)
            print("Initializing OpenAI embedding model...")
            if not EMBEDDING_CONFIG['api_key']:
                raise ValueError("OPENAI_API_KEY environment variable is required")

            # # ✅ Ensure OpenAI can write cache/config files
            # os.environ["OPENAI_CACHE_DIR"] = "/tmp"
            # os.environ["XDG_CACHE_HOME"] = "/tmp"
            # os.environ["HOME"] = "/tmp"

            # print("✅ Environment paths configured:")
            # print(f"  HOME={os.getenv('HOME')}")
            # print(f"  XDG_CACHE_HOME={os.getenv('XDG_CACHE_HOME')}")
            # print(f"  OPENAI_CACHE_DIR={os.getenv('OPENAI_CACHE_DIR')}")

            print("🔧 Initializing OpenAI client...")
            self.openai_client = OpenAI(api_key=EMBEDDING_CONFIG['api_key'])
            self.embedding_model = "openai_configured"
            print("✅ OpenAI embedding model ready!")

        except Exception as e:
            print(f"❌ Failed to initialize Pinecone: {e}")
            import traceback
            traceback.print_exc()
            raise
        
    # def _initialize(self):
    #     """Initialize Pinecone client and embedding model"""
    #     try:
    #         if not PINECONE_CONFIG['api_key']:
    #             raise ValueError("PINECONE_API_KEY environment variable is required")

    #         print("Connecting to Pinecone...")

    #         # For now, we'll use REST API calls directly
    #         self.api_key = PINECONE_CONFIG['api_key']
    #         self.index_host = PINECONE_CONFIG['index_host']
            
    #         # Set up headers for API calls
    #         self.headers = {
    #             'Api-Key': self.api_key,
    #             'Content-Type': 'application/json'
    #         }
            
    #         print(f"✅ Configured Pinecone REST client")
    #         print(f"📡 Using host: {self.index_host}")
            
    #         # Set index flag to indicate REST client is ready
    #         self.index = "rest_client_ready"

    #         # Initialize embedding model
    #         print("Initializing OpenAI embedding model...")
    #         print(EMBEDDING_CONFIG)
    #         if not EMBEDDING_CONFIG['api_key']:
    #             raise ValueError("OPENAI_API_KEY environment variable is required")
            
    #         print("before just OpenAPI object making : ",EMBEDDING_CONFIG['api_key'])
    #         os.environ["OPENAI_CACHE_DIR"] = "/tmp"
    #         os.environ["XDG_CACHE_HOME"] = "/tmp"
    #         os.environ["HOME"] = "/tmp"


    #         self.openai_client = OpenAI(api_key=EMBEDDING_CONFIG['api_key'])
    #         self.embedding_model = "openai_configured"  # Flag to indicate OpenAI is ready
    #         print("✅ OpenAI embedding model ready!")

    #     except Exception as e:
    #         print(f"Failed to initialize Pinecone: {e}")
    #         raise

    def _create_index_if_not_exists(self):
        """Create Pinecone index if it doesn't exist (placeholder for REST implementation)"""
        # For now, just assume the index exists since we're using REST API
        print(f"✅ Assuming index '{PINECONE_CONFIG['index_name']}' exists")

    def generate_embedding(self, text: str) -> list:
        """Generate embedding for given text using OpenAI's text-embedding-3-large"""
        try:
            response = self.openai_client.embeddings.create(
                model=EMBEDDING_CONFIG['model_name'],
                input=text,
                dimensions=EMBEDDING_CONFIG['dimensions']
            )
            
            embedding = response.data[0].embedding
            return embedding
            
        except Exception as e:
            print(f"Error generating embedding: {e}")
            return []

    def upsert_vectors(self, vectors: list):
        """Upsert vectors to Pinecone index using REST API"""
        try:
            url = f"{self.index_host}/vectors/upsert"
            data = {"vectors": vectors}
            
            response = requests.post(
                url, 
                headers=self.headers, 
                json=data,
                verify=False  # Disable SSL verification for now
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                print(f"Upsert failed with status {response.status_code}: {response.text}")
                return None
                
        except Exception as e:
            print(f"Error upserting vectors: {e}")
            return None

    def query_vectors(self, query_vector: list, top_k: int = 10, filter_dict: Dict = None):
        """Query similar vectors from Pinecone using REST API"""
        try:
            url = f"{self.index_host}/query"
            data = {
                "vector": query_vector,
                "topK": top_k,
                "includeMetadata": True,
                "includeValues": False
            }
            
            if filter_dict:
                data["filter"] = filter_dict
            
            response = requests.post(
                url, 
                headers=self.headers, 
                json=data,
                verify=False  # Disable SSL verification for now
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                print(f"Query failed with status {response.status_code}: {response.text}")
                return None
                
        except Exception as e:
            print(f"Error querying vectors: {e}")
            return None

    def delete_vectors(self, ids: list):
        """Delete vectors by IDs using REST API"""
        try:
            url = f"{self.index_host}/vectors/delete"
            data = {"ids": ids}
            
            response = requests.post(
                url, 
                headers=self.headers, 
                json=data,
                verify=False  # Disable SSL verification for now
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                print(f"Delete failed with status {response.status_code}: {response.text}")
                return None
                
        except Exception as e:
            print(f"Error deleting vectors: {e}")
            return None

# Global instance
pinecone_manager = None

def get_pinecone_manager():
    """Get or create PineconeManager instance"""
    global pinecone_manager
    if pinecone_manager is None:
        pinecone_manager = PineconeManager()
    return pinecone_manager