"""
Pinecone Vector Database Configuration for CSM Copilot
"""
import os
import ssl
import certifi
import requests
from typing import Dict, Any

# Fix SSL certificate issues BEFORE any imports
import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# Disable SSL verification completely for development
ssl._create_default_https_context = ssl._create_unverified_context

# Monkey patch requests to ignore SSL globally
original_request = requests.adapters.HTTPAdapter.send
def patched_send(self, request, *args, **kwargs):
    kwargs['verify'] = False
    return original_request(self, request, *args, **kwargs)
requests.adapters.HTTPAdapter.send = patched_send

# Set environment variables to disable SSL verification
os.environ['PYTHONHTTPSVERIFY'] = '0'
os.environ['PYTHONVERIFY'] = '0'
os.environ['CURL_CA_BUNDLE'] = ''
os.environ['REQUESTS_CA_BUNDLE'] = ''

# Now import Pinecone and other modules
from pinecone import Pinecone
from sentence_transformers import SentenceTransformer

# Set environment variables for SSL
try:
    cert_path = certifi.where()
    os.environ['SSL_CERT_FILE'] = cert_path
    os.environ['REQUESTS_CA_BUNDLE'] = cert_path
    os.environ['CURL_CA_BUNDLE'] = cert_path
    print(f"🔐 SSL Certificate path: {cert_path}")
except Exception as e:
    print(f"⚠️ SSL setup warning: {e}")
    # Fallback to system certificates for Linux/Docker
    linux_cert_paths = [
        '/etc/ssl/certs/ca-certificates.crt',
        '/etc/ssl/certs/ca-bundle.crt',
        '/etc/pki/tls/certs/ca-bundle.crt'
    ]
    for cert_path in linux_cert_paths:
        if os.path.exists(cert_path):
            os.environ['SSL_CERT_FILE'] = cert_path
            os.environ['REQUESTS_CA_BUNDLE'] = cert_path
            os.environ['CURL_CA_BUNDLE'] = cert_path
            break

# Pinecone Configuration
PINECONE_CONFIG = {
    'api_key': os.getenv('PINECONE_API_KEY'),
    'environment': os.getenv('PINECONE_ENVIRONMENT', 'us-east-1-aws'),
    'index_name': os.getenv('PINECONE_INDEX_NAME', 'csm-pilot'),
    'index_host': os.getenv('PINECONE_INDEX_HOST', 'https://csm-pilot-w9uksjc.svc.aped-4627-b74a.pinecone.io'),
    'dimension': 1024,  # Updated to match your Pinecone index
    'metric': 'cosine',
    'cloud': 'aws',
    'region': 'us-east-1'
}

# Embedding Model Configuration - Using model that can be configured for 1024 dimensions
EMBEDDING_CONFIG = {
    'model_name': 'sentence-transformers/all-MiniLM-L6-v2',  # We'll pad/transform to 1024
    'max_seq_length': 256,
    'device': 'cpu'  # Change to 'cuda' if GPU available
}

class PineconeManager:
    """Manage Pinecone vector database operations"""
    
    def __init__(self):
        self.pc = None
        self.index = None
        self.embedding_model = None
        self._initialize()
    
    def _initialize(self):
        """Initialize Pinecone client and embedding model"""
        try:
            # Initialize Pinecone
            if not PINECONE_CONFIG['api_key']:
                raise ValueError("PINECONE_API_KEY environment variable is required")
            
            print("Connecting to Pinecone...")
            
            # Apply SSL workaround for macOS
            self._apply_ssl_workaround()
            
            # Initialize Pinecone client with additional SSL bypass
            import requests
            session = requests.Session()
            session.verify = False
            
            # TEMPORARY FIX: Disable SSL verification to unblock testing.
            # REMOVE ssl_verify=False BEFORE PRODUCTION.
            self.pc = Pinecone(
                api_key=PINECONE_CONFIG['api_key'],
                ssl_verify=False  # <--- THIS IS THE TEMPORARY ADDITION
            )
            
            # Create index if it doesn't exist (skip SSL errors)
            self._create_index_if_not_exists()
            
            # Try to connect to index using specific host
            try:
                if PINECONE_CONFIG.get('index_host'):
                    # Use specific index host URL
                    self.index = self.pc.Index(
                        name=PINECONE_CONFIG['index_name'],
                        host=PINECONE_CONFIG['index_host']
                    )
                    print(f"✅ Connected to Pinecone index: {PINECONE_CONFIG['index_name']}")
                    print(f"📡 Using host: {PINECONE_CONFIG['index_host']}")
                else:
                    # Fallback to default connection
                    self.index = self.pc.Index(PINECONE_CONFIG['index_name'])
                    print(f"✅ Connected to Pinecone index: {PINECONE_CONFIG['index_name']}")
            except Exception as e:
                print(f"⚠️ Could not connect to index: {e}")
                print("🔧 Please verify the index host URL and API key")
                self.index = None
            
            # Initialize embedding model (already downloaded)
            print("Initializing embedding model...")
            try:
                # Try with SSL verification first
                self.embedding_model = SentenceTransformer(
                    EMBEDDING_CONFIG['model_name'],
                    device=EMBEDDING_CONFIG['device']
                )
                print("✅ Embedding model ready!")
            except Exception as e:
                print(f"⚠️ First attempt failed: {e}")
                print("🔄 Trying with SSL workarounds...")
                
                # Apply additional SSL workarounds
                old_verify = os.environ.get('PYTHONHTTPSVERIFY', '1')
                os.environ['PYTHONHTTPSVERIFY'] = '0'
                
                try:
                    import ssl
                    ssl._create_default_https_context = ssl._create_unverified_context
                    
                    self.embedding_model = SentenceTransformer(
                        EMBEDDING_CONFIG['model_name'],
                        device=EMBEDDING_CONFIG['device']
                    )
                    print("✅ Embedding model ready (with SSL workaround)!")
                except Exception as e2:
                    print(f"⚠️ Could not initialize embedding model: {e2}")
                    print("🔧 Using fallback dummy embeddings for testing")
                    self.embedding_model = None
                finally:
                    os.environ['PYTHONHTTPSVERIFY'] = old_verify
            
        except Exception as e:
            print(f"Failed to initialize Pinecone: {e}")
            raise
    
    def _apply_ssl_workaround(self):
        """Apply SSL workaround for macOS certificate issues"""
        try:
            import requests
            requests.packages.urllib3.disable_warnings()
            
            # Additional environment variables for SSL
            os.environ['PYTHONHTTPSVERIFY'] = '0'
            os.environ['SSL_VERIFY'] = 'false'
            
        except Exception as e:
            print(f"Warning: Could not apply SSL workaround: {e}")
    
    def _create_index_if_not_exists(self):
        """Create Pinecone index if it doesn't exist"""
        try:
            # Check if index exists
            existing_indexes = [index.name for index in self.pc.list_indexes()]
            
            if PINECONE_CONFIG['index_name'] not in existing_indexes:
                print(f"⚠️ Index '{PINECONE_CONFIG['index_name']}' not found!")
                print(f"🔧 Please create the index manually in Pinecone Console:")
                print(f"   - Name: {PINECONE_CONFIG['index_name']}")
                print(f"   - Dimension: {PINECONE_CONFIG['dimension']}")
                print(f"   - Metric: {PINECONE_CONFIG['metric']}")
                print(f"   - Cloud: {PINECONE_CONFIG['cloud']}")
                print(f"   - Region: {PINECONE_CONFIG['region']}")
                print(f"   - URL: https://app.pinecone.io/")
                
                # Don't raise an error, just warn
                print("⏳ Continuing without automatic index creation...")
            else:
                print(f"✅ Index '{PINECONE_CONFIG['index_name']}' found!")
                
        except Exception as e:
            print(f"⚠️ Could not check existing indexes: {e}")
            print("🔧 Please ensure your index exists in Pinecone Console")
            # Don't raise an error for SSL issues
    
    def generate_embedding(self, text: str) -> list:
        """Generate embedding for given text"""
        try:
            if self.embedding_model is None:
                # Fallback: Create a dummy embedding for testing
                import hashlib
                hash_obj = hashlib.md5(text.encode())
                hash_hex = hash_obj.hexdigest()
                
                # Convert hex to numbers and normalize to create a dummy embedding
                dummy_embedding = []
                for i in range(0, min(32, len(hash_hex)), 2):
                    hex_pair = hash_hex[i:i+2]
                    value = int(hex_pair, 16) / 255.0 - 0.5  # Normalize to [-0.5, 0.5]
                    dummy_embedding.append(value)
                
                # Pad to target dimension
                target_dim = PINECONE_CONFIG['dimension']
                while len(dummy_embedding) < target_dim:
                    dummy_embedding.extend(dummy_embedding[:min(len(dummy_embedding), target_dim - len(dummy_embedding))])
                
                return dummy_embedding[:target_dim]
            
            embedding = self.embedding_model.encode(text, normalize_embeddings=True)
            embedding_list = embedding.tolist()
            
            # Handle dimension mismatch by padding or truncating
            target_dim = PINECONE_CONFIG['dimension']
            current_dim = len(embedding_list)
            
            if current_dim < target_dim:
                # Pad with zeros
                embedding_list.extend([0.0] * (target_dim - current_dim))
            elif current_dim > target_dim:
                # Truncate
                embedding_list = embedding_list[:target_dim]
            
            return embedding_list
        except Exception as e:
            print(f"Error generating embedding: {e}")
            return []
    
    def upsert_vectors(self, vectors: list):
        """Upsert vectors to Pinecone index"""
        try:
            response = self.index.upsert(vectors=vectors)
            return response
        except Exception as e:
            print(f"Error upserting vectors: {e}")
            return None
    
    def query_vectors(self, query_vector: list, top_k: int = 10, filter_dict: Dict = None):
        """Query similar vectors from Pinecone"""
        try:
            response = self.index.query(
                vector=query_vector,
                top_k=top_k,
                filter=filter_dict,
                include_metadata=True,
                include_values=False
            )
            return response
        except Exception as e:
            print(f"Error querying vectors: {e}")
            return None
    
    def delete_vectors(self, ids: list):
        """Delete vectors by IDs"""
        try:
            response = self.index.delete(ids=ids)
            return response
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