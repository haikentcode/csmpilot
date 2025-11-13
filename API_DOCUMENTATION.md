# CSM Pilot API Documentation

## Base URL
```
http://localhost:8000/api
```

---

## Customer APIs

### 1. Get Customer Detail
**Endpoint:** `GET /api/customers/{id}/`

**Description:** Get complete customer information including products, feedback, meetings, and metrics.

**Response:**
```json
{
  "id": 50,
  "name": "UBER",
  "industry": "technology",
  "arr": "2500000.00",
  "health_score": "healthy",
  "renewal_date": "2025-01-01",
  "products": [
    "SurveyMonkey Enterprise (SME)",
    "SurveyMonkey Audience"
  ],
  "feedback": [],
  "meetings": [],
  "metrics": null,
  "last_updated": "2025-11-13T10:06:34.229651Z",
  "created_at": "2025-11-13T10:06:34.189215Z"
}
```

**Key Fields:**
- `products`: Array of SurveyMonkey product names the customer is using
- `industry`: Customer industry (healthcare, technology, finance, etc.)
- `arr`: Annual Recurring Revenue
- `health_score`: Customer health status (healthy, at_risk, critical)

---

### 2. Get Use Cases for Customer ⭐ NEW
**Endpoint:** `GET /api/customers/{id}/use_cases/`

**Description:** Get relevant use cases for a customer based on their current products. Helps CSMs understand how customers can effectively use their products.

**Query Parameters:**
- `industry` (optional): Override customer's industry for filtering

**Example Request:**
```bash
GET /api/customers/50/use_cases/
GET /api/customers/50/use_cases/?industry=healthcare
```

**Response:**
```json
{
  "customer_id": 50,
  "customer_name": "UBER",
  "customer_products": [
    "SurveyMonkey Enterprise (SME)",
    "SurveyMonkey Audience"
  ],
  "industry": "technology",
  "use_cases": [
    {
      "product_name": "SurveyMonkey Enterprise (SME)",
      "product_category": "Survey & Feedback Platform",
      "use_case": "A hospital system runs patient and staff feedback programs securely.",
      "primary_use": "Collect, analyze, and act on feedback securely across teams and departments.",
      "key_features": [
        "Centralized admin & governance",
        "Role-based access control",
        "HIPAA/GDPR compliance",
        "Integrations with Slack, Salesforce, Tableau"
      ]
    },
    {
      "product_name": "SurveyMonkey Audience",
      "product_category": "Survey Panel / Respondent Marketplace",
      "use_case": "A SaaS company validates new feature ideas with tech professionals.",
      "primary_use": "Gather market and consumer insights from non-customers or general audiences.",
      "key_features": [
        "Pre-screened panels",
        "Demographic targeting",
        "Fast turnaround",
        "Real-time analytics"
      ]
    }
  ],
  "total_use_cases": 6
}
```

**Use Case:**
- CSM can show customer how to use their products effectively
- Helps with product adoption and training
- Provides talking points for customer meetings

---

### 3. Get Upsell Opportunities for Customer ⭐ NEW
**Endpoint:** `GET /api/customers/{id}/upsell_opportunities/`

**Description:** Get intelligent upsell recommendations based on:
- Products customer already has (from product catalog)
- Similar customers (using AI-powered vector similarity search)
- Industry and ARR matching

**Query Parameters:**
- `limit` (optional, default: 10): Number of similar customers to consider
- `include_similar` (optional, default: true): Include recommendations from similar customers

**Example Request:**
```bash
GET /api/customers/50/upsell_opportunities/
GET /api/customers/50/upsell_opportunities/?limit=5
GET /api/customers/50/upsell_opportunities/?limit=5&include_similar=true
```

**Response:**
```json
{
  "customer_id": 50,
  "customer_name": "UBER",
  "current_products": [
    "SurveyMonkey Enterprise (SME)",
    "SurveyMonkey Audience"
  ],
  "industry": "technology",
  "arr": "2500000.00",
  "opportunities": [
    {
      "product_name": "GetFeedback Direct",
      "category": "Customer Experience (CX) Feedback Platform",
      "description": "Transactional feedback tool that captures customer experiences immediately after key interactions via email, SMS, or app triggers.",
      "reason": "GetFeedback Direct – for transactional CX feedback.",
      "reason_type": "product_upsell",
      "key_features": [
        "Event-based triggers",
        "Multi-channel distribution",
        "Real-time dashboards",
        "Salesforce integration"
      ],
      "ideal_customer_profiles": [
        "Healthcare providers",
        "Banks and financial services",
        "Retail and eCommerce",
        "SaaS companies",
        "Customer support organizations"
      ]
    },
    {
      "product_name": "SurveyMonkey MRX Solutions",
      "category": "Managed Market Research Services",
      "description": "Full-service research programs combining SurveyMonkey's technology with professional research expertise for end-to-end studies.",
      "reason": "MRX Solutions – for advanced brand or market research support.",
      "reason_type": "product_upsell",
      "key_features": [
        "Custom survey design",
        "Brand and ad tracking",
        "Expert consulting",
        "Cross-market benchmarking"
      ],
      "ideal_customer_profiles": [
        "Healthcare brands",
        "CPG enterprises",
        "Financial services",
        "SaaS and B2B companies",
        "Market research teams"
      ]
    }
  ],
  "total_opportunities": 3
}
```

**Reason Types:**
- `product_upsell`: Recommended from product catalog (based on products customer already has)
- `similar_customers`: Recommended because similar customers use this product

**Use Case:**
- Sales team can see upsell opportunities for each customer
- CSM can proactively suggest relevant products
- Helps with expansion revenue planning

---

## Example API Calls

### JavaScript/TypeScript Example
```typescript
// Get customer use cases
const getUseCases = async (customerId: number) => {
  const response = await fetch(`http://localhost:8000/api/customers/${customerId}/use_cases/`);
  const data = await response.json();
  return data;
};

// Get upsell opportunities
const getUpsellOpportunities = async (customerId: number, limit: number = 5) => {
  const response = await fetch(
    `http://localhost:8000/api/customers/${customerId}/upsell_opportunities/?limit=${limit}`
  );
  const data = await response.json();
  return data;
};

// Get customer detail (includes products)
const getCustomerDetail = async (customerId: number) => {
  const response = await fetch(`http://localhost:8000/api/customers/${customerId}/`);
  const data = await response.json();
  return data;
};
```

### cURL Examples
```bash
# Get customer detail
curl http://localhost:8000/api/customers/50/

# Get use cases
curl http://localhost:8000/api/customers/50/use_cases/

# Get upsell opportunities
curl http://localhost:8000/api/customers/50/upsell_opportunities/?limit=5
```

---

## Product Reference

### Available Products
1. **SurveyMonkey Enterprise (SME)** - Survey & Feedback Platform
2. **SurveyMonkey Audience** - Survey Panel / Respondent Marketplace
3. **SurveyMonkey MRX Solutions** - Managed Market Research Services
4. **SurveyMonkey MRX Audience** - Premium Market Research Audience
5. **GetFeedback Digital (GFB Digital)** - Digital Experience Feedback Platform
6. **Wufoo** - Online Form Builder
7. **SM Apply** - Application Management Platform
8. **Research.net** - Professional Research Platform (White-label)
9. **GetFeedback Direct** - Customer Experience (CX) Feedback Platform

---

## Response Status Codes

- `200 OK`: Request successful
- `404 Not Found`: Customer not found
- `500 Internal Server Error`: Server error

---

## Notes

- All APIs return JSON format
- Products are stored as an array of product names
- Use cases are filtered by customer's industry when available
- Upsell opportunities use AI-powered similarity search to find similar customers
- All timestamps are in ISO 8601 format (UTC)

---

## Frontend Integration Tips

1. **Display Products**: Show customer products in customer profile card
2. **Use Cases Section**: Create a collapsible section showing relevant use cases
3. **Upsell Opportunities**: Display as cards with product details and reasoning
4. **Loading States**: Handle async loading for use cases and upsell APIs
5. **Error Handling**: Handle cases where customer has no products or no opportunities

---

## Example Frontend Component Structure

```typescript
// Customer Profile Component
interface CustomerProfile {
  id: number;
  name: string;
  products: string[];
  industry: string;
  arr: string;
  // ... other fields
}

// Use Cases Response
interface UseCase {
  product_name: string;
  product_category: string;
  use_case: string;
  primary_use: string;
  key_features: string[];
}

interface UseCasesResponse {
  customer_id: number;
  customer_name: string;
  customer_products: string[];
  industry: string;
  use_cases: UseCase[];
  total_use_cases: number;
}

// Upsell Opportunity Response
interface UpsellOpportunity {
  product_name: string;
  category: string;
  description: string;
  reason: string;
  reason_type: 'product_upsell' | 'similar_customers';
  key_features: string[];
  ideal_customer_profiles: string[];
  similarity_score?: number; // Only for similar_customers type
}

interface UpsellOpportunitiesResponse {
  customer_id: number;
  customer_name: string;
  current_products: string[];
  industry: string;
  arr: string;
  opportunities: UpsellOpportunity[];
  total_opportunities: number;
}
```

---

## Testing

All APIs have been tested and verified:
- ✅ Customer Detail API returns products correctly
- ✅ Use Cases API returns relevant use cases based on products
- ✅ Upsell Opportunities API returns intelligent recommendations
- ✅ All APIs handle edge cases (no products, no opportunities, etc.)

---

## Support

For questions or issues, refer to:
- API Root: `http://localhost:8000/api/`
- Django Admin: `http://localhost:8000/admin/`
- API Documentation: This file

