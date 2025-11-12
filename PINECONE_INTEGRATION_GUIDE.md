# Pinecone Integration Guide for CSM Copilot

This guide walks you through integrating Pinecone vector database with your CSM Copilot project for advanced customer similarity search and AI-powered insights.

## 🎯 What This Integration Provides

- **Customer Similarity Search**: Find similar customers based on industry, ARR, health metrics, feedback patterns, and more
- **Intelligent Recommendations**: Get AI-powered suggestions for customer success strategies
- **Vector-Based Analytics**: Leverage semantic search across your customer data
- **Real-time Sync**: Automatic synchronization when customer data changes

## 📋 Prerequisites

1. **Pinecone Account**: Sign up at [pinecone.io](https://pinecone.io)
2. **Redis**: For async task processing (can use local Redis or cloud service)
3. **Python Environment**: Your existing virtual environment with new packages installed

## 🚀 Setup Steps

### 1. Get Pinecone API Key

1. Go to [Pinecone Console](https://app.pinecone.io/)
2. Create a new project or use existing
3. Navigate to "API Keys" section
4. Copy your API key

### 2. Configure Environment Variables

Update your `.env` file in the backend directory:

```bash
# Required
PINECONE_API_KEY=your-pinecone-api-key-here
PINECONE_ENVIRONMENT=us-east-1-aws
PINECONE_INDEX_NAME=csm-copilot

# Optional - Redis for async tasks
REDIS_URL=redis://localhost:6379/0
```

### 3. Start Redis (for async processing)

```bash
# macOS with Homebrew
brew install redis
brew services start redis

# Or run Redis manually
redis-server
```

### 4. Test Your Setup

Run the test script to verify everything is working:

```bash
cd backend
python test_pinecone_setup.py
```

### 5. Initialize Vector Database

Sync your existing customers to Pinecone:

```bash
# Sync all customers
python manage.py sync_vectors

# Or sync specific customer
python manage.py sync_vectors --customer-id 1
```

### 6. Start Celery Worker (Optional)

For async processing of vector updates:

```bash
# In a separate terminal
cd backend
celery -A csmpilot worker -l info
```

## 🔧 Usage Examples

### API Endpoints

#### Find Similar Customers
```bash
GET /api/customers/{id}/similar/
GET /api/customers/{id}/similar/?limit=5&industry=technology
GET /api/customers/{id}/similar/?min_arr=50000&health_score=healthy
```

#### Sync Customer Vectors
```bash
POST /api/customers/{id}/sync-vectors/
POST /api/customers/bulk-sync-vectors/
```

### Django Management Commands

```bash
# Sync all customers
python manage.py sync_vectors

# Sync with async tasks
python manage.py sync_vectors --async

# Sync specific customer
python manage.py sync_vectors --customer-id 123

# Custom batch size
python manage.py sync_vectors --batch-size 50
```

### Python Code Examples

```python
from customers.vector_services import get_customer_vector_service
from customers.models import Customer

# Get vector service
vector_service = get_customer_vector_service()

# Find similar customers
customer = Customer.objects.get(id=1)
similar = vector_service.find_similar_customers(
    customer=customer,
    top_k=10,
    filter_criteria={'industry': 'technology'}
)

# Add customer to vectors
success = vector_service.add_customer_to_vector_db(customer)
```

## 🎨 Frontend Integration

### Update Similar Customers Component

Your existing `SimilarCustomers.tsx` component can now use real vector similarity:

```typescript
// Update your API service to call the new endpoint
const fetchSimilarCustomers = async (customerId: number) => {
  const response = await fetch(`/api/customers/${customerId}/similar/`);
  return response.json();
};
```

### Add Similarity Scores

Display similarity scores in your UI:

```typescript
{similarCustomers.map((customer) => (
  <div key={customer.customer_id}>
    <h3>{customer.name}</h3>
    <p>Similarity: {(customer.similarity_score * 100).toFixed(1)}%</p>
    <p>Industry: {customer.industry}</p>
    <p>ARR: ${customer.arr.toLocaleString()}</p>
  </div>
))}
```

## 🔄 Automatic Synchronization

The integration includes automatic sync when data changes:

- **New Customer**: Automatically added to vector database
- **Customer Update**: Vectors updated automatically
- **Metrics Change**: Customer vectors refreshed
- **New Feedback/Meeting**: Customer representation updated

## 📊 Monitoring and Maintenance

### Check Vector Database Status

```python
from csmpilot.pinecone_config import get_pinecone_manager

pm = get_pinecone_manager()
stats = pm.index.describe_index_stats()
print(f"Total vectors: {stats['total_vector_count']}")
```

### Monitor Celery Tasks

```bash
# Check task status
celery -A csmpilot inspect active

# Monitor task results
celery -A csmpilot events
```

## 🛠️ Troubleshooting

### Common Issues

1. **"Pinecone not available" error**
   - Check PINECONE_API_KEY in .env
   - Verify internet connection
   - Check Pinecone service status

2. **Redis connection errors**
   - Start Redis server: `redis-server`
   - Check REDIS_URL in .env
   - Verify Redis is accessible

3. **Embedding model download slow**
   - First run downloads ~90MB model
   - Subsequent runs use cached model
   - Consider using GPU for faster processing

4. **Vector search returns no results**
   - Ensure customers are synced: `python manage.py sync_vectors`
   - Check index has vectors: use monitoring commands
   - Verify filter criteria aren't too restrictive

### Performance Optimization

1. **Batch Processing**: Use batch operations for better performance
2. **Async Tasks**: Enable Celery for non-blocking operations
3. **Caching**: Consider caching frequent similarity searches
4. **Indexing**: Monitor Pinecone usage and optimize queries

## 📈 Advanced Features

### Custom Embedding Models

To use different embedding models, update `pinecone_config.py`:

```python
EMBEDDING_CONFIG = {
    'model_name': 'sentence-transformers/all-mpnet-base-v2',  # Higher quality
    'max_seq_length': 512,
    'device': 'cuda'  # If GPU available
}
```

### Custom Similarity Metrics

Add custom metadata for more sophisticated filtering:

```python
def generate_custom_metadata(self, customer):
    metadata = self.generate_customer_metadata(customer)
    metadata.update({
        'churn_risk_score': calculate_churn_risk(customer),
        'engagement_level': get_engagement_level(customer),
        'growth_potential': assess_growth_potential(customer)
    })
    return metadata
```

## 🎉 Next Steps

1. **Test the integration** using the provided test script
2. **Sync your customer data** to Pinecone
3. **Update your frontend** to use the new similarity endpoints
4. **Monitor performance** and optimize as needed
5. **Explore advanced features** like custom embeddings

## 📚 Additional Resources

- [Pinecone Documentation](https://docs.pinecone.io/)
- [Sentence Transformers](https://www.sbert.net/)
- [Celery Documentation](https://docs.celeryproject.org/)
- [Django Signals](https://docs.djangoproject.com/en/stable/topics/signals/)

---

Your CSM Copilot now has powerful vector-based customer similarity search capabilities! 🚀