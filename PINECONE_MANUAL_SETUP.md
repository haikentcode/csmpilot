# Manual Pinecone Index Setup Guide

Since automatic index creation is having SSL issues on macOS, please create the index manually:

## 1. Login to Pinecone Console
Go to: https://app.pinecone.io/

## 2. Create New Index
Click "Create Index" and use these settings:

**Index Configuration:**
- **Name**: `csm-pilot`
- **Dimensions**: `384`
- **Metric**: `cosine`
- **Cloud Provider**: `AWS`
- **Region**: `us-east-1`

## 3. Verify Index Creation
Once created, you should see your index in the dashboard.

## 4. Test the Connection
Run this command to test:
```bash
cd backend
python test_pinecone_setup.py
```

## 5. Sync Your Data
Once the index is created and connection works:
```bash
python manage.py sync_vectors
```

That's it! Your Pinecone integration should now work properly.