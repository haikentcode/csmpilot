"""
CSM Copilot MCP Server

A Model Context Protocol server that provides tools for exploring and testing
the CSM Copilot API. This server helps developers and users interact with the
customer success management platform programmatically.

Features:
- API endpoint discovery
- Customer data exploration  
- Feedback and meeting management
- Health score analytics
- Sample data testing
"""

import asyncio
import json
import httpx
from typing import Any, Sequence
from mcp.server.models import InitializationOptions
from mcp.server import NotificationOptions, Server
from mcp.server.stdio import stdio_server
from mcp.types import (
    Resource,
    Tool,
    TextContent,
    ImageContent,
    EmbeddedResource,
    LoggingLevel
)
from pydantic import AnyUrl


class CSMCopilotMCPServer:
    def __init__(self, base_url: str = "http://127.0.0.1:8000"):
        self.base_url = base_url.rstrip('/')
        self.server = Server("csm-copilot")
        self.setup_tools()
        self.setup_resources()
    
    def setup_tools(self):
        """Register all available tools"""
        
        @self.server.list_tools()
        async def handle_list_tools() -> list[Tool]:
            return [
                Tool(
                    name="explore_api",
                    description="Explore the CSM Copilot API structure and available endpoints",
                    inputSchema={
                        "type": "object",
                        "properties": {},
                        "required": []
                    }
                ),
                Tool(
                    name="list_customers",
                    description="Get a list of all customers with optional filtering",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "search": {
                                "type": "string",
                                "description": "Search customers by name or industry"
                            },
                            "ordering": {
                                "type": "string", 
                                "description": "Order by field (e.g., '-arr', 'renewal_date')"
                            }
                        }
                    }
                ),
                Tool(
                    name="get_customer_dashboard",
                    description="Get comprehensive dashboard data for a specific customer",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "customer_id": {
                                "type": "integer",
                                "description": "The ID of the customer"
                            }
                        },
                        "required": ["customer_id"]
                    }
                ),
                Tool(
                    name="get_at_risk_customers",
                    description="Get customers that are at risk of churning",
                    inputSchema={
                        "type": "object",
                        "properties": {},
                        "required": []
                    }
                ),
                Tool(
                    name="get_upcoming_renewals", 
                    description="Get customers with upcoming renewal dates",
                    inputSchema={
                        "type": "object",
                        "properties": {},
                        "required": []
                    }
                ),
                Tool(
                    name="create_customer_feedback",
                    description="Create new feedback for a customer",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "customer_id": {
                                "type": "integer",
                                "description": "The ID of the customer"
                            },
                            "title": {
                                "type": "string",
                                "description": "Feedback title"
                            },
                            "status": {
                                "type": "string",
                                "enum": ["open", "in_progress", "resolved", "closed"],
                                "description": "Feedback status"
                            },
                            "description": {
                                "type": "string",
                                "description": "Detailed feedback description"
                            }
                        },
                        "required": ["customer_id", "title"]
                    }
                ),
                Tool(
                    name="get_health_summary",
                    description="Get customer health score distribution analytics",
                    inputSchema={
                        "type": "object",
                        "properties": {},
                        "required": []
                    }
                ),
                Tool(
                    name="test_api_endpoint",
                    description="Test any API endpoint with custom parameters",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "endpoint": {
                                "type": "string",
                                "description": "API endpoint path (e.g., '/api/customers/')"
                            },
                            "method": {
                                "type": "string",
                                "enum": ["GET", "POST", "PUT", "PATCH", "DELETE"],
                                "description": "HTTP method"
                            },
                            "data": {
                                "type": "object",
                                "description": "Request body data (for POST/PUT/PATCH)"
                            }
                        },
                        "required": ["endpoint", "method"]
                    }
                )
            ]

        @self.server.call_tool()
        async def handle_call_tool(name: str, arguments: dict[str, Any]) -> list[TextContent]:
            """Handle tool calls"""
            
            if name == "explore_api":
                return await self._explore_api()
            elif name == "list_customers":
                return await self._list_customers(arguments)
            elif name == "get_customer_dashboard":
                return await self._get_customer_dashboard(arguments)
            elif name == "get_at_risk_customers":
                return await self._get_at_risk_customers()
            elif name == "get_upcoming_renewals":
                return await self._get_upcoming_renewals()
            elif name == "create_customer_feedback":
                return await self._create_customer_feedback(arguments)
            elif name == "get_health_summary":
                return await self._get_health_summary()
            elif name == "test_api_endpoint":
                return await self._test_api_endpoint(arguments)
            else:
                raise ValueError(f"Unknown tool: {name}")

    def setup_resources(self):
        """Setup available resources"""
        
        @self.server.list_resources()
        async def handle_list_resources() -> list[Resource]:
            return [
                Resource(
                    uri=AnyUrl("csm://api/docs"),
                    name="CSM Copilot API Documentation",
                    description="Complete API documentation with examples",
                    mimeType="text/markdown"
                ),
                Resource(
                    uri=AnyUrl("csm://api/schema"),
                    name="API Schema",
                    description="OpenAPI schema for the CSM Copilot API",
                    mimeType="application/json"
                )
            ]

        @self.server.read_resource()
        async def handle_read_resource(uri: AnyUrl) -> str:
            if str(uri) == "csm://api/docs":
                return await self._get_api_docs()
            elif str(uri) == "csm://api/schema":
                return await self._get_api_schema()
            else:
                raise ValueError(f"Unknown resource: {uri}")

    async def _make_request(self, endpoint: str, method: str = "GET", data: dict = None) -> dict:
        """Make HTTP request to the API"""
        url = f"{self.base_url}{endpoint}"
        
        async with httpx.AsyncClient() as client:
            if method == "GET":
                response = await client.get(url)
            elif method == "POST":
                response = await client.post(url, json=data)
            elif method == "PUT":
                response = await client.put(url, json=data)
            elif method == "PATCH":
                response = await client.patch(url, json=data)
            elif method == "DELETE":
                response = await client.delete(url)
            
            response.raise_for_status()
            return response.json()

    async def _explore_api(self) -> list[TextContent]:
        """Explore the API structure"""
        try:
            data = await self._make_request("/api/")
            
            content = "# CSM Copilot API Explorer\n\n"
            content += f"**Version:** {data.get('version', 'Unknown')}\n"
            content += f"**Description:** {data.get('description', 'CSM Platform')}\n\n"
            
            content += "## Available Endpoints\n\n"
            for name, info in data.get('endpoints', {}).items():
                content += f"### {name.replace('_', ' ').title()}\n"
                content += f"- **URL:** `{info['url']}`\n"
                content += f"- **Description:** {info['description']}\n"
                content += f"- **Methods:** {', '.join(info.get('methods', []))}\n\n"
            
            content += "## Sample Usage\n\n"
            for usage, endpoint in data.get('sample_usage', {}).items():
                content += f"- **{usage.replace('_', ' ').title()}:** `{endpoint}`\n"
            
            return [TextContent(type="text", text=content)]
            
        except Exception as e:
            return [TextContent(type="text", text=f"Error exploring API: {str(e)}")]

    async def _list_customers(self, args: dict) -> list[TextContent]:
        """List customers with optional filtering"""
        try:
            params = {}
            if args.get('search'):
                params['search'] = args['search']
            if args.get('ordering'):
                params['ordering'] = args['ordering']
            
            query_string = '&'.join([f"{k}={v}" for k, v in params.items()])
            endpoint = f"/api/customers/?{query_string}" if query_string else "/api/customers/"
            
            data = await self._make_request(endpoint)
            
            content = "# Customer List\n\n"
            content += f"**Total Results:** {data.get('count', len(data.get('results', [])))}\n\n"
            
            customers = data.get('results', data) if isinstance(data, dict) else data
            
            for customer in customers:
                content += f"## {customer['name']}\n"
                content += f"- **ID:** {customer['id']}\n"
                content += f"- **Industry:** {customer['industry']}\n"
                content += f"- **ARR:** ${customer['arr']:,}\n"
                content += f"- **Health Score:** {customer['health_score']}\n"
                content += f"- **Renewal Date:** {customer['renewal_date']}\n\n"
            
            return [TextContent(type="text", text=content)]
            
        except Exception as e:
            return [TextContent(type="text", text=f"Error listing customers: {str(e)}")]

    async def _get_customer_dashboard(self, args: dict) -> list[TextContent]:
        """Get customer dashboard"""
        try:
            customer_id = args['customer_id']
            data = await self._make_request(f"/api/customers/{customer_id}/dashboard/")
            
            content = f"# Customer Dashboard: {data['name']}\n\n"
            
            # Basic Info
            content += "## Basic Information\n"
            content += f"- **Industry:** {data['industry']}\n"
            content += f"- **ARR:** ${data['arr']:,}\n"
            content += f"- **Health Score:** {data['health_score']}\n"
            content += f"- **Renewal Date:** {data['renewal_date']}\n\n"
            
            # Metrics
            if 'metrics' in data and data['metrics']:
                metrics = data['metrics']
                content += "## Key Metrics\n"
                content += f"- **NPS Score:** {metrics['nps']}\n"
                content += f"- **Usage Trend:** {metrics['usage_trend']}\n"
                content += f"- **Active Users:** {metrics['active_users']}\n"
                content += f"- **Renewal Rate:** {metrics['renewal_rate']}%\n"
                content += f"- **Seat Utilization:** {metrics['seat_utilization']}%\n\n"
            
            # Recent Feedback
            if 'feedback' in data and data['feedback']:
                content += "## Recent Feedback\n"
                for feedback in data['feedback'][:5]:  # Show last 5
                    content += f"- **{feedback['title']}** ({feedback['status']})\n"
                content += "\n"
            
            # Recent Meetings
            if 'meetings' in data and data['meetings']:
                content += "## Recent Meetings\n"
                for meeting in data['meetings'][:3]:  # Show last 3
                    content += f"- **{meeting['date']}:** {meeting['summary']}\n"
                content += "\n"
            
            return [TextContent(type="text", text=content)]
            
        except Exception as e:
            return [TextContent(type="text", text=f"Error getting customer dashboard: {str(e)}")]

    async def _get_at_risk_customers(self) -> list[TextContent]:
        """Get at-risk customers"""
        try:
            data = await self._make_request("/api/customers/at-risk/")
            
            content = "# At-Risk Customers 🚨\n\n"
            content += f"**Total At-Risk:** {len(data)}\n\n"
            
            if not data:
                content += "No customers currently at risk! 🎉\n"
            else:
                for customer in data:
                    urgency = "🔴 CRITICAL" if customer['health_score'] == 'critical' else "🟡 AT RISK"
                    content += f"## [{urgency}] {customer['name']}\n"
                    content += f"- **ARR:** ${customer['arr']:,}\n"
                    content += f"- **Renewal Date:** {customer['renewal_date']}\n"
                    content += f"- **Industry:** {customer['industry']}\n\n"
            
            return [TextContent(type="text", text=content)]
            
        except Exception as e:
            return [TextContent(type="text", text=f"Error getting at-risk customers: {str(e)}")]

    async def _create_customer_feedback(self, args: dict) -> list[TextContent]:
        """Create customer feedback"""
        try:
            customer_id = args['customer_id']
            feedback_data = {
                'title': args['title'],
                'status': args.get('status', 'open'),
                'description': args.get('description', '')
            }
            
            data = await self._make_request(
                f"/api/customers/{customer_id}/feedback/",
                method="POST",
                data=feedback_data
            )
            
            content = "# Feedback Created Successfully ✅\n\n"
            content += f"**ID:** {data['id']}\n"
            content += f"**Title:** {data['title']}\n"
            content += f"**Status:** {data['status']}\n"
            content += f"**Created:** {data['created_at']}\n"
            
            if data.get('description'):
                content += f"**Description:** {data['description']}\n"
            
            return [TextContent(type="text", text=content)]
            
        except Exception as e:
            return [TextContent(type="text", text=f"Error creating feedback: {str(e)}")]

    async def _get_health_summary(self) -> list[TextContent]:
        """Get health score summary"""
        try:
            data = await self._make_request("/api/customers/health-summary/")
            
            content = "# Customer Health Score Summary 📊\n\n"
            
            total_customers = sum(item['count'] for item in data)
            content += f"**Total Customers:** {total_customers}\n\n"
            
            for item in data:
                health_score = item['health_score']
                count = item['count']
                percentage = (count / total_customers * 100) if total_customers > 0 else 0
                
                emoji = {"healthy": "🟢", "at_risk": "🟡", "critical": "🔴"}.get(health_score, "⚪")
                content += f"## {emoji} {health_score.replace('_', ' ').title()}\n"
                content += f"- **Count:** {count} customers\n"
                content += f"- **Percentage:** {percentage:.1f}%\n\n"
            
            return [TextContent(type="text", text=content)]
            
        except Exception as e:
            return [TextContent(type="text", text=f"Error getting health summary: {str(e)}")]

    async def _get_upcoming_renewals(self) -> list[TextContent]:
        """Get upcoming renewals"""
        try:
            data = await self._make_request("/api/customers/upcoming-renewals/")
            
            content = "# Upcoming Renewals (Next 30 Days) 📅\n\n"
            content += f"**Total Renewals:** {len(data)}\n\n"
            
            if not data:
                content += "No renewals in the next 30 days.\n"
            else:
                for customer in data:
                    content += f"## {customer['name']}\n"
                    content += f"- **Renewal Date:** {customer['renewal_date']}\n"
                    content += f"- **ARR:** ${customer['arr']:,}\n"
                    content += f"- **Health Score:** {customer['health_score']}\n\n"
            
            return [TextContent(type="text", text=content)]
            
        except Exception as e:
            return [TextContent(type="text", text=f"Error getting upcoming renewals: {str(e)}")]

    async def _test_api_endpoint(self, args: dict) -> list[TextContent]:
        """Test any API endpoint"""
        try:
            endpoint = args['endpoint']
            method = args['method']
            data = args.get('data')
            
            result = await self._make_request(endpoint, method, data)
            
            content = f"# API Test Result\n\n"
            content += f"**Endpoint:** `{method} {endpoint}`\n"
            content += f"**Status:** ✅ Success\n\n"
            content += "## Response:\n```json\n"
            content += json.dumps(result, indent=2)
            content += "\n```\n"
            
            return [TextContent(type="text", text=content)]
            
        except Exception as e:
            return [TextContent(type="text", text=f"API test failed: {str(e)}")]

    async def _get_api_docs(self) -> str:
        """Get API documentation"""
        return """
# CSM Copilot API Documentation

## Overview
The CSM Copilot API provides comprehensive customer success management functionality.

## Authentication
Currently no authentication required for development.

## Base URL
http://127.0.0.1:8000/api/

## Available Endpoints
- GET /customers/ - List customers
- GET /customers/{id}/dashboard/ - Customer dashboard
- GET /customers/at-risk/ - At-risk customers
- GET /customers/upcoming-renewals/ - Upcoming renewals
- POST /customers/{id}/feedback/ - Create feedback

## Response Format
All responses are in JSON format with consistent structure.
"""

    async def _get_api_schema(self) -> str:
        """Get API schema"""
        try:
            # This would typically fetch from /api/schema/ if available
            return json.dumps({
                "openapi": "3.0.0",
                "info": {
                    "title": "CSM Copilot API",
                    "version": "1.0.0"
                }
            })
        except:
            return "{}"

    async def run(self):
        """Run the MCP server"""
        async with stdio_server() as (read_stream, write_stream):
            await self.server.run(
                read_stream,
                write_stream,
                InitializationOptions(
                    server_name="csm-copilot",
                    server_version="1.0.0",
                    capabilities=self.server.get_capabilities(
                        notification_options=NotificationOptions(),
                        experimental_capabilities={}
                    )
                )
            )


if __name__ == "__main__":
    server = CSMCopilotMCPServer()
    asyncio.run(server.run())