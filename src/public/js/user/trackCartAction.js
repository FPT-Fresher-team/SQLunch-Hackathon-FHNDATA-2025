// Track Cart Interactions (Add to Cart, Remove from Cart)
(function() {
  // Helper to get or create session ID
  function getSessionId() {
    let sessionId = sessionStorage.getItem('sessionId')
    if (!sessionId) {
      sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
      sessionStorage.setItem('sessionId', sessionId)
    }
    return sessionId
  }

  // Helper to track action
  async function trackCartAction(productId, action, quantity = 1) {
    try {
      const response = await fetch('http://localhost:8000/marketing/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          action,
          quantity,
          sessionId: getSessionId()
        }),
        credentials: 'include' 
      })
      const data = await response.json()
      if (data.success) {
        console.log(`✓ [Cart] ${action} tracked: product=${productId}, qty=${quantity}`)
      } else {
        console.warn(`✗ [Cart] Failed: ${data.error}`)
      }
    } catch (error) {
      console.error('[Cart] Error:', error.message)
    }
  }

  // Extract product ID from URL or page data
  function getProductIdFromPage() {
    // For detail product page: /all-products/product/{productId}
    const match = window.location.href.match(/\/all-products\/product\/([^\/\?]+)/)
    if (match) return match[1]
    
    // Try to get from data attribute on page
    const productData = document.querySelector('[data-product-id]')
    if (productData) return productData.dataset.productId
    
    return null
  }

  document.addEventListener('DOMContentLoaded', function() {
    // ===== Detail Product Page Tracking =====
    const addToCartDiv = document.querySelector('div.add-to-cart')
    if (addToCartDiv) {
      addToCartDiv.addEventListener('click', function(e) {
        const productId = getProductIdFromPage()
        if (productId) {
          // Get quantity from the page quantity display
          const quantityElement = document.querySelector('div.quantity > p')
          const quantity = quantityElement ? parseInt(quantityElement.innerText) || 1 : 1
          
          // Only track if it's being ADDED (not already in cart)
          trackCartAction(productId, 'add_to_cart', quantity)
        }
      })
    }
  })

  // Expose tracking function globally for manual tracking if needed
  window.trackCartAction = trackCartAction
})()
