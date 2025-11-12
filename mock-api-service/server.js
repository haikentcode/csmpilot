/**
 * External Mock API Service
 * 
 * This is an EXTERNAL service (separate from Django) that mimics Salesforce API.
 * You can control the data by editing JSON files in /data directory.
 * 
 * Django/Celery will poll this service just like it would poll real Salesforce.
 * 
 * Usage:
 *   npm install
 *   npm start
 * 
 * Then access:
 *   http://localhost:3001/mock-apis/salesforce/services/data/v58.0/sobjects/Opportunity
 */

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3001;

// Enable CORS for Django
app.use(cors());
app.use(express.json());

// Load mock data from JSON files
function loadSalesforceData() {
    try {
        const dataPath = path.join(__dirname, 'data', 'salesforce-opportunities.json');
        const rawData = fs.readFileSync(dataPath, 'utf8');
        return JSON.parse(rawData);
    } catch (error) {
        console.error('Error loading Salesforce data:', error);
        return { opportunities: [] };
    }
}

function loadGainsightData() {
    try {
        const dataPath = path.join(__dirname, 'data', 'gainsight-companies.json');
        const rawData = fs.readFileSync(dataPath, 'utf8');
        return JSON.parse(rawData);
    } catch (error) {
        console.error('Error loading Gainsight data:', error);
        return { companies: [] };
    }
}

function loadGongData() {
    try {
        const dataPath = path.join(__dirname, 'data', 'gong-meetings.json');
        const rawData = fs.readFileSync(dataPath, 'utf8');
        return JSON.parse(rawData);
    } catch (error) {
        console.error('Error loading Gong data:', error);
        return { meetings: [] };
    }
}

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'External Mock API Service',
        integrations: ['salesforce', 'gainsight', 'gong'],
        timestamp: new Date().toISOString()
    });
});

// API Info
app.get('/info', (req, res) => {
    res.json({
        service: 'External Mock API Service',
        version: '1.0.0',
        description: 'External mock API that Django/Celery polls - mimics real Salesforce and Gainsight APIs',
        base_url: `http://localhost:${PORT}/mock-apis`,
        integrations: {
            salesforce: {
                name: 'Salesforce REST API Mock',
                version: 'v58.0',
                endpoints: {
                    opportunity_detail: '/mock-apis/salesforce/services/data/v58.0/sobjects/Opportunity/:id',
                    opportunity_list: '/mock-apis/salesforce/services/data/v58.0/sobjects/Opportunity',
                    query: '/mock-apis/salesforce/services/data/v58.0/query?q=SELECT...'
                },
                data_source: 'data/salesforce-opportunities.json',
                note: 'Edit JSON file to change mock data - no code changes needed!'
            },
            gainsight: {
                name: 'Gainsight Company API Mock',
                version: 'v1',
                endpoints: {
                    company_query: '/mock-apis/gainsight/v1/data/objects/query/Company',
                    company_detail: '/mock-apis/gainsight/v1/data/objects/Company/:gsid'
                },
                data_source: 'data/gainsight-companies.json',
                note: 'Edit JSON file to change mock data - no code changes needed!'
            },
            gong: {
                name: 'Gong Meetings API Mock',
                version: 'v2',
                endpoints: {
                    calls_list: '/mock-apis/gong/v2/calls',
                    call_detail: '/mock-apis/gong/v2/calls/:callId',
                    calls_by_account: '/mock-apis/gong/v2/calls?accountId=:accountId'
                },
                data_source: 'data/gong-meetings.json',
                note: 'Edit JSON file to change mock data - no code changes needed!'
            }
        }
    });
});

// ============================================================================
// SALESFORCE MOCK API ENDPOINTS
// Mimics official Salesforce REST API v58.0 structure
// ============================================================================

// GET /mock-apis/salesforce/services/data/v58.0/sobjects/Opportunity/:id
app.get('/mock-apis/salesforce/services/data/v58.0/sobjects/Opportunity/:id', (req, res) => {
    const { id } = req.params;
    const data = loadSalesforceData();
    
    // Find opportunity by ID
    const opportunity = data.opportunities.find(opp => opp.Id === id);
    
    if (opportunity) {
        res.json(opportunity);
    } else {
        res.status(404).json({
            error: 'NOT_FOUND',
            message: `Opportunity with ID ${id} not found`
        });
    }
});

// GET /mock-apis/salesforce/services/data/v58.0/sobjects/Opportunity
app.get('/mock-apis/salesforce/services/data/v58.0/sobjects/Opportunity', (req, res) => {
    const data = loadSalesforceData();
    
    res.json({
        totalSize: data.opportunities.length,
        done: true,
        records: data.opportunities
    });
});

// GET /mock-apis/salesforce/services/data/v58.0/query
app.get('/mock-apis/salesforce/services/data/v58.0/query', (req, res) => {
    const query = req.query.q || '';
    const data = loadSalesforceData();
    
    // Simple query handling (can be extended)
    res.json({
        totalSize: data.opportunities.length,
        done: true,
        records: data.opportunities
    });
});

// ============================================================================
// GAINSIGHT MOCK API ENDPOINTS
// Mimics official Gainsight Company API structure
// ============================================================================

// POST /mock-apis/gainsight/v1/data/objects/query/Company
// Gainsight Read API uses POST with query body
app.post('/mock-apis/gainsight/v1/data/objects/query/Company', (req, res) => {
    const data = loadGainsightData();
    
    // Check for AccessKey header (mimics Gainsight authentication)
    const accessKey = req.headers['accesskey'] || req.headers['Accesskey'];
    if (!accessKey) {
        return res.status(401).json({
            result: false,
            errorCode: 'AUTH_001',
            errorDesc: 'AccessKey is required',
            requestId: `mock-${Date.now()}`,
            data: null,
            message: null
        });
    }
    
    // Return Gainsight API format
    res.json({
        result: true,
        errorCode: null,
        errorDesc: null,
        requestId: `mock-${Date.now()}`,
        data: data.companies,
        message: null
    });
});

// GET /mock-apis/gainsight/v1/data/objects/Company/:gsid
app.get('/mock-apis/gainsight/v1/data/objects/Company/:gsid', (req, res) => {
    const { gsid } = req.params;
    const data = loadGainsightData();
    
    // Find company by GSID
    const company = data.companies.find(comp => comp.Gsid === gsid);
    
    if (company) {
        res.json({
            result: true,
            errorCode: null,
            errorDesc: null,
            requestId: `mock-${Date.now()}`,
            data: company,
            message: null
        });
    } else {
        res.status(404).json({
            result: false,
            errorCode: 'GSOBJ_1XXX',
            errorDesc: 'No data found for given criteria',
            requestId: `mock-${Date.now()}`,
            data: null,
            message: null
        });
    }
});

// ============================================================================
// GONG MOCK API ENDPOINTS
// Mimics official Gong API v2 structure
// ============================================================================

// GET /mock-apis/gong/v2/calls - List all calls/meetings
app.get('/mock-apis/gong/v2/calls', (req, res) => {
    const data = loadGongData();
    const accountId = req.query.accountId;
    
    let meetings = data.meetings;
    
    // Filter by account if accountId provided
    if (accountId) {
        meetings = meetings.filter(meeting => {
            const accountName = meeting.account?.name || '';
            // Simple matching - in real scenario would use account ID
            return accountName.toLowerCase().includes(accountId.toLowerCase());
        });
    }
    
    res.json({
        calls: meetings,
        pagination: {
            total: meetings.length,
            page: 1,
            perPage: meetings.length
        }
    });
});

// GET /mock-apis/gong/v2/calls/:callId - Get specific call/meeting
app.get('/mock-apis/gong/v2/calls/:callId', (req, res) => {
    const { callId } = req.params;
    const data = loadGongData();
    
    // Find by id or callId
    const meeting = data.meetings.find(m => m.id === callId || m.callId === callId);
    
    if (meeting) {
        res.json(meeting);
    } else {
        res.status(404).json({
            error: 'NOT_FOUND',
            message: `Call with ID ${callId} not found`
        });
    }
});

// GET /mock-apis/gong/v2/calls/:callId/transcript - Get transcript
app.get('/mock-apis/gong/v2/calls/:callId/transcript', (req, res) => {
    const { callId } = req.params;
    const data = loadGongData();
    
    const meeting = data.meetings.find(m => m.id === callId || m.callId === callId);
    
    if (meeting) {
        res.json({
            callId: meeting.id,
            transcript: meeting.transcript || meeting.summary,
            duration: meeting.duration
        });
    } else {
        res.status(404).json({
            error: 'NOT_FOUND',
            message: `Call with ID ${callId} not found`
        });
    }
});

// ============================================================================
// Future integrations can be added here:
// - /mock-apis/hubspot/...
// ============================================================================

app.listen(PORT, () => {
    console.log('='.repeat(60));
    console.log('🚀 External Mock API Service');
    console.log('='.repeat(60));
    console.log(`Running on: http://localhost:${PORT}`);
    console.log('');
    console.log('Endpoints:');
    console.log(`  Health: http://localhost:${PORT}/health`);
    console.log(`  Info: http://localhost:${PORT}/info`);
    console.log(`  Salesforce Opportunities: http://localhost:${PORT}/mock-apis/salesforce/services/data/v58.0/sobjects/Opportunity`);
    console.log(`  Gainsight Companies: http://localhost:${PORT}/mock-apis/gainsight/v1/data/objects/query/Company`);
    console.log(`  Gong Meetings: http://localhost:${PORT}/mock-apis/gong/v2/calls`);
    console.log('');
    console.log('📝 To change mock data:');
    console.log('   Salesforce: Edit data/salesforce-opportunities.json');
    console.log('   Gainsight: Edit data/gainsight-companies.json');
    console.log('   Gong: Edit data/gong-meetings.json');
    console.log('   No code changes needed - just edit JSON and restart!');
    console.log('='.repeat(60));
});

