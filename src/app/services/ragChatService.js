/**
 * RAG Chatbot Service Layer
 *
 * This service communicates with FastAPI backend for RAG-based chat queries.
 * It handles:
 * - Health checks
 * - Chat queries with RAG retrieval
 * - Index building/rebuilding
 */

require('dotenv').config()

const FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:8000'
const FASTAPI_TIMEOUT = parseInt(process.env.FASTAPI_TIMEOUT || '30000', 10)

/**
 * Make HTTP request to FastAPI with timeout
 */
async function makeRequest(endpoint, options = {}) {
  const url = `${FASTAPI_URL}${endpoint}`
  const timeout = options.timeout || FASTAPI_TIMEOUT

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(
        `FastAPI error: ${response.status} - ${errorData.detail || response.statusText}`
      )
    }

    return await response.json()
  } catch (error) {
    clearTimeout(timeoutId)
    throw error
  }
}

/**
 * Check if FastAPI server is healthy
 */
async function checkHealth() {
  try {
    const response = await makeRequest('/health')
    return {
      healthy: response.status === 'healthy',
      indexLoaded: response.index_loaded,
      documentsCount: response.documents_count
    }
  } catch (error) {
    console.error('Health check failed:', error.message)
    return {
      healthy: false,
      indexLoaded: false,
      documentsCount: 0
    }
  }
}

/**
 * Send chat query to FastAPI RAG endpoint
 * @param {string} query - User query in Vietnamese
 * @param {string} userId - Optional user ID for tracking
 * @param {number} topK - Number of top documents to retrieve (default: 5)
 * @returns {Promise<{answer: string, sources: Array, query: string}>}
 */
async function chatQuery(query, userId = null, topK = 5) {
  if (!query || typeof query !== 'string') {
    throw new Error('Query must be a non-empty string')
  }

  const request = {
    query: query.trim(),
    top_k: topK,
    user_id: userId
  }

  try {
    const response = await makeRequest('/chat', {
      method: 'POST',
      body: request
    })

    return {
      answer: response.answer,
      sources: response.sources || [],
      query: response.query
    }
  } catch (error) {
    console.error('Chat query error:', error.message)
    throw error
  }
}

/**
 * Trigger FAISS index rebuild from MongoDB
 * This should be called periodically or after data updates
 */
async function buildIndex() {
  try {
    const response = await makeRequest('/build-index', {
      method: 'GET',
      timeout: 120000 // 2 minutes for index building
    })

    return {
      success: response.status === 'success',
      documentsCount: response.documents_count,
      message: response.message
    }
  } catch (error) {
    console.error('Build index error:', error.message)
    throw error
  }
}

/**
 * Format sources for display in frontend
 */
function formatSources(sources) {
  return sources.map(source => {
    const meta = source.metadata || {}
    return {
      id: source.id,
      collection: source.collection,
      url: source.url,
      title: meta.product_name || meta.code || meta.name || 'Unknown',
      price: meta.price,
      discount: meta.discount,
      brand: meta.brand
    }
  })
}

/**
 * Convert Markdown to HTML for display
 * Supports: **bold**, [links], line breaks, bullet points, etc.
 */
function markdownToHtml(markdown) {
  if (!markdown) return ''
  
  let html = markdown
    // Markdown links: [text](url) → <a href="url" target="_blank">text</a>
    .replace(/\[([^\]]+)\]\(([^\)]+)\)/g, (match, text, url) => {
      // If URL doesn't have protocol, assume http://
      const href = url.startsWith('http') ? url : `http://${url}`
      return `<a href="${href}" target="_blank" style="color: #0066cc; text-decoration: underline;">${text}</a>`
    })
    // Bold: **text** → <strong>text</strong>
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Italic: *text* → <em>text</em>
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Line breaks
    .replace(/\n/g, '<br>')
    // Bullet points: - item → <li>item</li>
    .replace(/^- (.*?)$/gm, '<li>$1</li>')
    // Wrap consecutive <li> in <ul>
    .replace(/(<li>.*?<\/li>)/s, '<ul>$1</ul>')
  
  return html
}

module.exports = {
  checkHealth,
  chatQuery,
  buildIndex,
  formatSources,
  markdownToHtml
}
