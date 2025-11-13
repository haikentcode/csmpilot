import os
import ssl
import certifi

def setup_ssl_and_env():
    """
    Ensures SSL cert paths and required environment variables are set
    before initializing any external services like OpenAI or Pinecone.
    """
    cert_path = certifi.where()

    # Set SSL-related environment variables if missing
    os.environ.setdefault("SSL_CERT_FILE", cert_path)
    os.environ.setdefault("REQUESTS_CA_BUNDLE", cert_path)

    # Optional: verify the SSL context
    try:
        ssl_context = ssl.create_default_context(cafile=cert_path)
        print("✅ SSL context verified successfully.")
    except Exception as e:
        print(f"⚠️ SSL context verification failed: {e}")

    print(f"🔒 Using SSL_CERT_FILE = {os.environ['SSL_CERT_FILE']}")

    # (Optional) set paths for temp dirs if needed
    os.environ.setdefault("XDG_CACHE_HOME", "/tmp")
    os.environ.setdefault("OPENAI_CACHE_DIR", "/tmp")
