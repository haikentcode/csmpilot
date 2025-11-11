# CSM Copilot MCP Server

An MCP (Model Context Protocol) server for the CSM Copilot API that provides tools for exploring and testing the customer success management platform.

## Features

- **API Exploration**: Discover all available endpoints and their documentation
- **Customer Management**: List, search, and get detailed customer information
- **Risk Analysis**: Identify at-risk customers and upcoming renewals
- **Feedback Management**: Create and manage customer feedback
- **Health Analytics**: Get customer health score summaries
- **API Testing**: Test any endpoint with custom parameters

## Installation

```bash
pip install mcp httpx pydantic
```

## Usage

### As an MCP Server

Configure in your MCP client (like Claude Desktop):

```json
{
  "mcpServers": {
    "csm-copilot": {
      "command": "python",
      "args": ["/path/to/csmpilot/mcp-server/main.py"],
      "env": {
        "CSM_API_URL": "http://127.0.0.1:8000"
      }
    }
  }
}
```

### Available Tools

1. **explore_api** - Discover API structure and endpoints
2. **list_customers** - Get customers with filtering options
3. **get_customer_dashboard** - Comprehensive customer view
4. **get_at_risk_customers** - Find customers at risk of churning
5. **get_upcoming_renewals** - Customers with renewals in next 30 days
6. **create_customer_feedback** - Add feedback for customers
7. **get_health_summary** - Health score distribution analytics
8. **test_api_endpoint** - Test any API endpoint

### Example Usage

```python
# Through MCP client, you can now ask:
# "Show me all at-risk customers"
# "Get the dashboard for customer ID 1"
# "Create feedback for customer 2 about a bug report"
# "What's the health score distribution?"
```

## Resources

- **API Documentation** (`csm://api/docs`) - Complete API guide
- **API Schema** (`csm://api/schema`) - OpenAPI specification

## Configuration

Set environment variables:
- `CSM_API_URL` - Base URL for the CSM Copilot API (default: http://127.0.0.1:8000)