"""
Mock Salesforce API Server
This simulates Salesforce REST API responses for development/testing.
Run this as a separate Flask server that Celery will poll.
"""

from flask import Flask, jsonify, request
from datetime import datetime, timedelta
import random
import uuid

app = Flask(__name__)

# Mock Salesforce API responses based on real Salesforce structure
# This mimics: GET /services/data/v58.0/sobjects/Opportunity/{id}

MOCK_OPPORTUNITIES = [
    {
        "attributes": {
            "type": "Opportunity",
            "url": "/services/data/v58.0/sobjects/Opportunity/0064V00001NhvGwQAJ"
        },
        "Id": "0064V00001NhvGwQAJ",
        "Name": "Europcar International - Renewal of 00028816 - 2024",
        "AccountId": "0014V00001ABC123",
        "Account": {
            "attributes": {
                "type": "Account",
                "url": "/services/data/v58.0/sobjects/Account/0014V00001ABC123"
            },
            "Id": "0014V00001ABC123",
            "Name": "Europcar International"
        },
        "StageName": "Closed Won",
        "CloseDate": "2024-04-01",
        "Amount": 79180.00,
        "CurrencyIsoCode": "EUR",
        "Amount_USD__c": 85401.88,
        "Probability": 100,
        "Type": "Renewal",
        "LeadSource": None,
        "OwnerId": "0054V00001XYZ789",
        "Owner": {
            "attributes": {
                "type": "User",
                "url": "/services/data/v58.0/sobjects/User/0054V00001XYZ789"
            },
            "Name": "Renewals Team"
        },
        "Opportunity_CSM__c": "Robin van Huis",
        "Renewal_Categories__c": "Verbal Commit (95%)",
        "Custom_Agreement__c": False,
        "CPQ_Auto_Renew__c": False,
        "Send_Survey_to_Buying_Contact__c": False,
        "Billing_Survey_Sent_Time__c": None,
        "Executive_Influencers__c": None,
        "GR_Number__c": None,
        "Feature_Request__c": None,
        "Furthest_Stage__c": "0. Lost/Not Interested",
        "Was_Lost_Without_Advancement__c": False,
        "Verbal_Award__c": False,
        "Security_Review_Completed__c": False,
        "Mutually_Agreed_Sign_Date__c": False,
        "Financial_Terms_Agreed__c": False,
        "Legal_Completed__c": False,
        "Next_Step__c": "27 March: 2 year renewal. OF = signed. Awaiting PO.",
        "Support_Needed__c": None,
        "CreatedDate": "2024-01-15T10:30:00.000+0000",
        "LastModifiedDate": "2024-03-27T14:20:00.000+0000",
        "SystemModstamp": "2024-03-27T14:20:00.000+0000"
    },
    {
        "attributes": {
            "type": "Opportunity",
            "url": "/services/data/v58.0/sobjects/Opportunity/0064V00001Rit456"
        },
        "Id": "0064V00001Rit456",
        "Name": "Rituals Cosmetics E-Commerce B.V. - Renewal of 00051569 - 2026",
        "AccountId": "0014V00001DEF456",
        "Account": {
            "attributes": {
                "type": "Account",
                "url": "/services/data/v58.0/sobjects/Account/0014V00001DEF456"
            },
            "Id": "0014V00001DEF456",
            "Name": "Rituals Cosmetics E-Commerce B.V."
        },
        "StageName": "Qualified",
        "CloseDate": "2026-04-12",
        "Amount": 35375.00,
        "CurrencyIsoCode": "EUR",
        "Amount_USD__c": 40865.81,
        "Probability": 20,
        "Type": "Renewal",
        "LeadSource": None,
        "OwnerId": "0054V00001XYZ789",
        "Owner": {
            "attributes": {
                "type": "User",
                "url": "/services/data/v58.0/sobjects/User/0054V00001XYZ789"
            },
            "Name": "Renewals Team"
        },
        "Opportunity_CSM__c": "Niek Loots",
        "Renewal_Categories__c": "Leaning our Way (65%)",
        "Custom_Agreement__c": False,
        "CPQ_Auto_Renew__c": True,
        "Send_Survey_to_Buying_Contact__c": False,
        "Billing_Survey_Sent_Time__c": None,
        "Executive_Influencers__c": None,
        "GR_Number__c": None,
        "Feature_Request__c": None,
        "Furthest_Stage__c": None,
        "Was_Lost_Without_Advancement__c": False,
        "Verbal_Award__c": False,
        "Security_Review_Completed__c": False,
        "Mutually_Agreed_Sign_Date__c": False,
        "Financial_Terms_Agreed__c": False,
        "Legal_Completed__c": False,
        "Next_Step__c": None,
        "Support_Needed__c": None,
        "CreatedDate": "2025-11-01T09:15:00.000+0000",
        "LastModifiedDate": "2025-11-12T08:30:00.000+0000",
        "SystemModstamp": "2025-11-12T08:30:00.000+0000"
    }
]


def generate_mock_opportunity():
    """Generate a random mock opportunity for testing"""
    stages = ["Qualified", "Development", "Proposal", "Negotiating", "Contracting", "Ready to Close", "Closed Won"]
    renewal_cats = ["Verbal Commit (95%)", "Leaning our Way (65%)", "Neutral (50%)", "Leaning Away (35%)", "At Risk (20%)"]
    companies = ["TechCorp Solutions", "HealthPlus Medical", "RetailMax Inc", "Emeritus Institute of Management"]
    
    stage = random.choice(stages)
    probability_map = {
        "Qualified": 20,
        "Development": 40,
        "Proposal": 60,
        "Negotiating": 75,
        "Contracting": 90,
        "Ready to Close": 95,
        "Closed Won": 100
    }
    
    opp_id = f"006{''.join([str(random.randint(0,9)) for _ in range(15)])}"
    account_id = f"001{''.join([str(random.randint(0,9)) for _ in range(15)])}"
    company = random.choice(companies)
    
    return {
        "attributes": {
            "type": "Opportunity",
            "url": f"/services/data/v58.0/sobjects/Opportunity/{opp_id}"
        },
        "Id": opp_id,
        "Name": f"{company} - Renewal - {datetime.now().year}",
        "AccountId": account_id,
        "Account": {
            "attributes": {
                "type": "Account",
                "url": f"/services/data/v58.0/sobjects/Account/{account_id}"
            },
            "Id": account_id,
            "Name": company
        },
        "StageName": stage,
        "CloseDate": (datetime.now() + timedelta(days=random.randint(30, 365))).strftime("%Y-%m-%d"),
        "Amount": round(random.uniform(50000, 500000), 2),
        "CurrencyIsoCode": random.choice(["USD", "EUR", "GBP"]),
        "Amount_USD__c": round(random.uniform(55000, 550000), 2),
        "Probability": probability_map.get(stage, 50),
        "Type": "Renewal",
        "LeadSource": None,
        "OwnerId": "0054V00001XYZ789",
        "Owner": {
            "attributes": {
                "type": "User",
                "url": "/services/data/v58.0/sobjects/User/0054V00001XYZ789"
            },
            "Name": "Renewals Team"
        },
        "Opportunity_CSM__c": f"CSM {random.randint(1, 10)}",
        "Renewal_Categories__c": random.choice(renewal_cats),
        "Custom_Agreement__c": random.choice([True, False]),
        "CPQ_Auto_Renew__c": random.choice([True, False]),
        "Send_Survey_to_Buying_Contact__c": False,
        "Billing_Survey_Sent_Time__c": None,
        "Executive_Influencers__c": None,
        "GR_Number__c": None,
        "Feature_Request__c": None,
        "Furthest_Stage__c": None,
        "Was_Lost_Without_Advancement__c": False,
        "Verbal_Award__c": random.choice([True, False]),
        "Security_Review_Completed__c": random.choice([True, False]),
        "Mutually_Agreed_Sign_Date__c": random.choice([True, False]),
        "Financial_Terms_Agreed__c": random.choice([True, False]),
        "Legal_Completed__c": random.choice([True, False]),
        "Next_Step__c": f"Next step notes for {company}",
        "Support_Needed__c": None,
        "CreatedDate": (datetime.now() - timedelta(days=random.randint(30, 180))).strftime("%Y-%m-%dT%H:%M:%S.000+0000"),
        "LastModifiedDate": datetime.now().strftime("%Y-%m-%dT%H:%M:%S.000+0000"),
        "SystemModstamp": datetime.now().strftime("%Y-%m-%dT%H:%M:%S.000+0000")
    }


@app.route('/services/data/v58.0/sobjects/Opportunity/<opportunity_id>', methods=['GET'])
def get_opportunity(opportunity_id):
    """
    Mock Salesforce GET Opportunity endpoint
    Mimics: GET /services/data/v58.0/sobjects/Opportunity/{id}
    """
    # Check if we have a predefined opportunity
    for opp in MOCK_OPPORTUNITIES:
        if opp["Id"] == opportunity_id:
            return jsonify(opp)
    
    # Generate a new mock opportunity
    mock_opp = generate_mock_opportunity()
    mock_opp["Id"] = opportunity_id
    return jsonify(mock_opp)


@app.route('/services/data/v58.0/query', methods=['GET'])
def query_opportunities():
    """
    Mock Salesforce SOQL Query endpoint
    Mimics: GET /services/data/v58.0/query?q=SELECT+Id,Name+FROM+Opportunity
    """
    query = request.args.get('q', '')
    
    # Return all mock opportunities
    all_opportunities = MOCK_OPPORTUNITIES + [generate_mock_opportunity() for _ in range(2)]
    
    return jsonify({
        "totalSize": len(all_opportunities),
        "done": True,
        "records": all_opportunities
    })


@app.route('/services/data/v58.0/sobjects/Opportunity', methods=['GET'])
def list_opportunities():
    """
    Mock Salesforce list Opportunities endpoint
    Returns all opportunities
    """
    all_opportunities = MOCK_OPPORTUNITIES + [generate_mock_opportunity() for _ in range(3)]
    return jsonify({
        "totalSize": len(all_opportunities),
        "done": True,
        "records": all_opportunities
    })


@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({"status": "healthy", "service": "Mock Salesforce API"})


if __name__ == '__main__':
    print("=" * 60)
    print("Mock Salesforce API Server")
    print("=" * 60)
    print("Endpoints:")
    print("  GET /services/data/v58.0/sobjects/Opportunity/<id>")
    print("  GET /services/data/v58.0/query?q=SELECT...")
    print("  GET /services/data/v58.0/sobjects/Opportunity")
    print("  GET /health")
    print("=" * 60)
    print("Starting server on http://localhost:5000")
    app.run(host='0.0.0.0', port=5000, debug=True)

