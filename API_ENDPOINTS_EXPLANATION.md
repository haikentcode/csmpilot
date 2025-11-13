# API Endpoints Explanation

## Overview

The **use-cases** and **upsell-opportunities** APIs are **NEW endpoints** added to the **existing Customer API**.

They are **NOT separate services** - they're part of the `CustomerViewSet` in Django REST Framework.

---

## API Structure

### Base URL
```
http://localhost:8000/api/customers/
```

### Existing Customer Endpoints

1. **List all customers**
   ```
   GET /api/customers/
   ```

2. **Get customer details**
   ```
   GET /api/customers/{id}/
   ```

3. **Get customer dashboard**
   ```
   GET /api/customers/{id}/dashboard/
   ```

4. **Get customer feedback**
   ```
   GET /api/customers/{id}/feedback/
   ```

5. **Get customer meetings**
   ```
   GET /api/customers/{id}/meetings/
   ```

6. **Find similar customers**
   ```
   GET /api/customers/{id}/similar/
   ```

---

## NEW Endpoints (Added for Products Feature)

### 1. Get Use Cases for Customer

**Endpoint:**
```
GET /api/customers/{id}/use_cases/
```

**Description:**
Returns relevant use cases for the customer based on their current products.

**Query Parameters:**
- `industry` (optional): Override customer's industry for filtering

**Example Request:**
```bash
curl http://localhost:8000/api/customers/14/use_cases/
```

**Example Response:**
```json
{
  "customer_id": 14,
  "customer_name": "UBER",
  "customer_products": [
    "SurveyMonkey Enterprise (SME)",
    "GetFeedback Direct"
  ],
  "industry": "technology",
  "use_cases": [
    {
      "product_name": "SurveyMonkey Enterprise (SME)",
      "product_category": "Survey & Feedback Platform",
      "use_case": "A hospital system runs patient and staff feedback programs securely.",
      "primary_use": "Collect, analyze, and act on feedback securely...",
      "key_features": [...]
    },
    ...
  ],
  "total_use_cases": 6
}
```

---

### 2. Get Upsell Opportunities for Customer

**Endpoint:**
```
GET /api/customers/{id}/upsell_opportunities/
```

**Description:**
Returns upsell opportunities based on:
- Products customer already has (from product catalog)
- Similar customers (using vector similarity search)
- Industry and ARR matching

**Query Parameters:**
- `limit` (optional, default: 10): Number of similar customers to consider
- `include_similar` (optional, default: true): Include recommendations from similar customers

**Example Request:**
```bash
curl http://localhost:8000/api/customers/14/upsell_opportunities/?limit=5
```

**Example Response:**
```json
{
  "customer_id": 14,
  "customer_name": "UBER",
  "current_products": [
    "SurveyMonkey Enterprise (SME)",
    "GetFeedback Direct"
  ],
  "industry": "technology",
  "arr": "2500000.00",
  "opportunities": [
    {
      "product_name": "SurveyMonkey Audience",
      "category": "Survey Panel / Respondent Marketplace",
      "description": "On-demand marketplace of millions of vetted respondents...",
      "reason": "SurveyMonkey Audience – for external respondent sourcing.",
      "reason_type": "product_upsell",
      "key_features": [...],
      "ideal_customer_profiles": [...]
    },
    ...
  ],
  "total_opportunities": 4
}
```

---

## How They Work

### Use Cases API (`/use_cases/`)

1. **Gets customer's products** from `Customer.products` field
2. **Looks up each product** in product catalog (`products-reference.json`)
3. **Extracts use cases** from `sample_use_cases` field
4. **Filters by industry** (if provided)
5. **Returns formatted use cases** with product context

**No AI/RAG** - Direct matching from product catalog.

---

### Upsell Opportunities API (`/upsell_opportunities/`)

1. **Gets customer's products** from `Customer.products` field
2. **Gets upsell opportunities** from product catalog (for products customer has)
3. **Finds similar customers** using vector similarity search (Pinecone)
4. **Extracts products** used by similar customers
5. **Counts frequency** of products among similar customers
6. **Filters by industry and ARR** (within 50% range)
7. **Returns recommendations** with reasoning

**Uses AI** - Vector similarity search for finding similar customers.

---

## Integration with Frontend

These are **standard REST endpoints** that can be called from your frontend:

```typescript
// Get use cases
const useCases = await fetch(`/api/customers/${customerId}/use_cases/`)
  .then(res => res.json());

// Get upsell opportunities
const upsellOpps = await fetch(`/api/customers/${customerId}/upsell_opportunities/?limit=5`)
  .then(res => res.json());
```

---

## Summary

✅ **NEW endpoints** - Added to existing Customer API  
✅ **Part of CustomerViewSet** - Not separate services  
✅ **Standard REST** - GET requests with query parameters  
✅ **Ready to use** - Working and tested  
✅ **Frontend ready** - Can be called from React/Next.js  

---

## Full API Documentation

You can see all available endpoints at:
```
http://localhost:8000/api/
```

Or check Django REST Framework browsable API:
```
http://localhost:8000/api/customers/
```

