import http from 'http';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env') });

const PORT = process.env.PORT || 3001;
let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function runTests() {
  console.log('--- Testing Backend Health & SerpApi Search Endpoints ---\n');

  // Test 1: GET /api/health
  try {
    const health = await makeRequest({
      hostname: 'localhost',
      port: PORT,
      path: '/api/health',
      method: 'GET',
    });

    assert(health.status === 200, `GET /api/health returned 200 OK (got: ${health.status})`);
    assert(health.body.status === 'ok', `Health status is "ok"`);
    assert(typeof health.body.configured === 'boolean', `Key configured flag is boolean (${health.body.configured})`);
  } catch (err) {
    console.error('Could not connect to backend server. Make sure "npm run server" is running!', err.message);
    process.exit(1);
  }

  // Test 2: POST /api/search with invalid empty query
  const emptyQuery = await makeRequest(
    {
      hostname: 'localhost',
      port: PORT,
      path: '/api/search',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { query: '' }
  );
  assert(emptyQuery.status === 400, `Empty query rejected with 400 Bad Request (got: ${emptyQuery.status})`);
  assert(emptyQuery.body.error === 'INVALID_REQUEST', `Error code is INVALID_REQUEST`);

  // Test 3: POST /api/search with key status check
  const isKeyConfigured = process.env.SERPAPI_KEY && process.env.SERPAPI_KEY !== 'YOUR_NEW_KEY' && process.env.SERPAPI_KEY.trim().length > 5;

  const searchQuery = await makeRequest(
    {
      hostname: 'localhost',
      port: PORT,
      path: '/api/search',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { query: 'Kubernetes container orchestration' }
  );

  if (!isKeyConfigured) {
    console.log('\n[Info] SERPAPI_KEY is currently placeholder "YOUR_NEW_KEY". Testing graceful 503 response.');
    assert(searchQuery.status === 503, `Returns 503 Service Unavailable when key is unconfigured (got: ${searchQuery.status})`);
    assert(searchQuery.body.error === 'MISSING_API_KEY', `Error code is MISSING_API_KEY`);
    assert(searchQuery.body.message.includes('SerpApi key is not configured'), `Helpful setup message returned`);
  } else {
    console.log('\n[Info] SERPAPI_KEY is configured. Testing live SerpApi search response.');
    if (searchQuery.status === 200) {
      assert(searchQuery.body.success === true, `Search succeeded`);
      assert(Array.isArray(searchQuery.body.results), `Results is an array`);
      assert(searchQuery.body.results.length > 0, `Returned ${searchQuery.body.results.length} organic results`);
      const first = searchQuery.body.results[0];
      assert(Boolean(first.title && first.link), `Result has title and source link: "${first.title}"`);
    } else {
      console.log(`Live request returned status ${searchQuery.status}:`, searchQuery.body);
    }
  }

  console.log(`\n========================================`);
  console.log(`SEARCH TEST SUMMARY: ${passed} passed, ${failed} failed.`);
  console.log(`========================================`);
}

runTests();
