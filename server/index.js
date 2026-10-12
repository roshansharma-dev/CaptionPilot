import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Resolve current directory for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env in project root
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Helper to check if SerpApi key is validly configured
function isKeyConfigured() {
  const key = process.env.SERPAPI_KEY;
  return Boolean(
    key &&
    typeof key === 'string' &&
    key.trim().length > 0 &&
    key.trim() !== 'YOUR_NEW_KEY'
  );
}

// Health & configuration status check (never leaks the actual key)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    configured: isKeyConfigured(),
    timestamp: new Date().toISOString(),
  });
});

// POST /api/search: Query SerpApi Google Search API
app.post('/api/search', async (req, res) => {
  try {
    const { query } = req.body;

    // Validate query input
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return res.status(400).json({
        error: 'INVALID_REQUEST',
        message: 'A search query string is required.',
      });
    }

    const trimmedQuery = query.trim();

    // Check for configured API key
    if (!isKeyConfigured()) {
      return res.status(503).json({
        error: 'MISSING_API_KEY',
        message:
          'SerpApi key is not configured. Please add your SERPAPI_KEY in the server .env file and restart the server.',
        configured: false,
      });
    }

    const apiKey = process.env.SERPAPI_KEY.trim();

    // Construct SerpApi URL
    const serpApiUrl = new URL('https://serpapi.com/search.json');
    serpApiUrl.searchParams.set('engine', 'google');
    serpApiUrl.searchParams.set('q', trimmedQuery);
    serpApiUrl.searchParams.set('api_key', apiKey);
    serpApiUrl.searchParams.set('num', '5');

    // Perform request to SerpApi using Node's native fetch
    const response = await fetch(serpApiUrl.toString(), {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    const data = await response.json();

    // Handle SerpApi error responses
    if (!response.ok || data.error) {
      const errorMessage = data.error || `SerpApi responded with HTTP status ${response.status}`;

      if (response.status === 429 || errorMessage.toLowerCase().includes('rate limit')) {
        return res.status(429).json({
          error: 'RATE_LIMIT',
          message: 'SerpApi rate limit reached. Please check your account search quota.',
        });
      }

      if (
        response.status === 401 ||
        response.status === 403 ||
        errorMessage.toLowerCase().includes('invalid api key')
      ) {
        return res.status(401).json({
          error: 'INVALID_API_KEY',
          message: 'Invalid SerpApi key provided. Please verify your SERPAPI_KEY in .env.',
        });
      }

      return res.status(502).json({
        error: 'API_ERROR',
        message: 'SerpApi search request failed. Please try again.',
      });
    }

    // Extract organic search results
    const rawOrganic = Array.isArray(data.organic_results) ? data.organic_results : [];
    const results = rawOrganic.slice(0, 5).map((item, idx) => ({
      position: item.position || idx + 1,
      title: item.title || 'No Title Available',
      link: item.link || '',
      snippet: item.snippet || item.snippet_highlighted_words?.join(' ') || 'No preview snippet available.',
      source: item.source || item.displayed_link || '',
    }));

    // Extract knowledge graph if available for quick technical definitions
    let knowledgeGraph = null;
    if (data.knowledge_graph) {
      const kg = data.knowledge_graph;
      knowledgeGraph = {
        title: kg.title || trimmedQuery,
        type: kg.type || '',
        description: kg.description || '',
        source: kg.source ? { name: kg.source.name, link: kg.source.link } : null,
      };
    }

    return res.json({
      success: true,
      query: trimmedQuery,
      knowledgeGraph,
      results,
      totalResults: results.length,
    });
  } catch (err) {
    // Log safe error without exposing credentials
    console.error('Search endpoint internal error:', err.message);
    return res.status(500).json({
      error: 'SERVER_ERROR',
      message: 'Internal server error while processing search query.',
    });
  }
});

// Start Express server
app.listen(PORT, () => {
  console.log(`CaptionPilot backend running at http://localhost:${PORT}`);
  console.log(`SerpApi status: ${isKeyConfigured() ? 'Key detected' : 'Pending configuration (.env)'}`);
});
