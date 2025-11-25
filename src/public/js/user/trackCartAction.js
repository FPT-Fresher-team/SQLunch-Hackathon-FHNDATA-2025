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
          if (this.style.backgroundColor === '') {
            trackCartAction(productId, 'add_to_cart', quantity)
          } else {
            // Being removed from cart
            trackCartAction(productId, 'remove_from_cart', quantity)
          }
        }
      })
    }

    // ===== Generic Cart Button Tracking (fallback for other pages) =====
    // Track Add to Cart button clicks with flexible selectors
    const addToCartButtons = document.querySelectorAll(
      '[data-action="add-to-cart"], .add-to-cart-btn, .addToCart, [class*="add-to-cart"]'
    )

    addToCartButtons.forEach(btn => {
      // Skip if it's the detail product div (already handled above)
      if (btn.classList.contains('add-to-cart') && btn.tagName === 'DIV' && document.querySelector('div.detail-product-container')) {
        return
      }

      btn.addEventListener('click', function(e) {
        // Get product ID from various possible locations
        const productId =
          this.dataset.productId ||
          this.closest('[data-product-id]')?.dataset.productId ||
          this.getAttribute('data-id') ||
          this.closest('form')?.querySelector('[name="productId"]')?.value ||
          this.closest('.product-item')?.dataset.id ||
          getProductIdFromPage()

        if (productId) {
          // Get quantity if available
          const quantityInput = this.closest('form')?.querySelector('[name="quantity"]') ||
                                this.closest('.product-item')?.querySelector('[name="quantity"]') ||
                                document.querySelector('div.quantity > p')
          const quantity = quantityInput ? parseInt(quantityInput.innerText || quantityInput.value) || 1 : 1

          trackCartAction(productId, 'add_to_cart', quantity)
        }
      })
    })
  })

  // Expose tracking function globally for manual tracking if needed
  window.trackCartAction = trackCartAction
})()
