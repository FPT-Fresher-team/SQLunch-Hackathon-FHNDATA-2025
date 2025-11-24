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
      const response = await fetch('/api/track-cart-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          action,
          quantity,
          sessionId: getSessionId()
        })
      })
      const data = await response.json()
      console.log(`[Cart Tracking] ${action} tracked for product ${productId}:`, data)
    } catch (error) {
      console.error('[Cart Tracking] Error:', error)
    }
  }

  document.addEventListener('DOMContentLoaded', function() {
    // Track Add to Cart button clicks
    const addToCartButtons = document.querySelectorAll(
      '[data-action="add-to-cart"], .add-to-cart-btn, [class*="add-to-cart"]'
    )

    addToCartButtons.forEach(btn => {
      btn.addEventListener('click', function(e) {
        // Get product ID from various possible locations
        const productId =
          this.dataset.productId ||
          this.closest('[data-product-id]')?.dataset.productId ||
          this.getAttribute('data-id') ||
          this.closest('form')?.querySelector('[name="productId"]')?.value ||
          this.closest('.product-item')?.dataset.id

        if (productId) {
          // Get quantity if available
          const quantityInput = this.closest('form')?.querySelector('[name="quantity"]') ||
                                this.closest('.product-item')?.querySelector('[name="quantity"]')
          const quantity = quantityInput ? parseInt(quantityInput.value) || 1 : 1

          trackCartAction(productId, 'add_to_cart', quantity)
        }
      })
    })

    // Track Remove from Cart actions
    const removeFromCartButtons = document.querySelectorAll(
      '[data-action="remove-from-cart"], .remove-from-cart-btn, [class*="remove-from-cart"]'
    )

    removeFromCartButtons.forEach(btn => {
      btn.addEventListener('click', function(e) {
        const productId =
          this.dataset.productId ||
          this.closest('[data-product-id]')?.dataset.productId ||
          this.getAttribute('data-id')

        if (productId) {
          trackCartAction(productId, 'remove_from_cart', 1)
        }
      })
    })
  })

  // Expose tracking function globally for manual tracking
  window.trackCartAction = trackCartAction
})()
