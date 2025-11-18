/**
 * ============================================
 * FILE: src/public/js/user/trackProductView.js
 * ============================================
 * 
 * CHỨC NĂNG:
 * - Track thời gian user ở lại product page
 * - Nếu ở lại ≥ 5 giây → gửi POST API để record view
 * - Tránh duplicate tracking (chỉ track 1 lần per session)
 * 
 * CÁCH HOẠT ĐỘNG:
 * 1. Script tự động run khi DOM load (detailProduct.js import file này)
 * 2. Lấy product slug từ URL
 * 3. Tạo timer để đếm thời gian user ở lại
 * 4. Khi user rời khỏi page hoặc sau 5s:
 *    - Nếu timeOnPage ≥ 5s → POST /api/track-product-view
 *    - Backend cập nhật Product.viewCount
 * 5. Mark session để tránh track 2 lần (localStorage)
 * 
 * API ENDPOINT:
 * POST /api/track-product-view
 * Body: {
 *   productId: string (slug)
 *   timeOnPage: number (seconds)
 *   userId: string (optional, từ auth cookie)
 * }
 * 
 * RESPONSE:
 * {
 *   success: true,
 *   message: "Product view tracked",
 *   viewCount: number
 * }
 */

(function() {
  'use strict'

  const MIN_VIEW_TIME = 5000 // 5 seconds in milliseconds
  const TRACKING_KEY = 'product_view_tracked'

  // Lấy product slug từ URL
  // VD: /all-products/chi-tiet-san-pham-xyz → 'chi-tiet-san-pham-xyz'
  function getProductSlug() {
    const pathParts = window.location.pathname.split('/')
    return pathParts[pathParts.length - 1] || null
  }

  // Lấy session ID (hoặc tạo mới)
  function getSessionId() {
    let sessionId = sessionStorage.getItem('session_id')
    if (!sessionId) {
      sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
      sessionStorage.setItem('session_id', sessionId)
    }
    return sessionId
  }

  // Track mỗi page view, không cần check session history
  // Người dùng có thể quay lại và xem lại sản phẩm, mỗi lần sẽ được count

  // Gửi tracking data tới backend
  async function sendProductViewTracking(productSlug, timeOnPage) {
    try {
      const response = await fetch('/api/track-product-view', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          productId: productSlug,
          timeOnPage: Math.round(timeOnPage / 1000), // Convert to seconds
          sessionId: getSessionId(),
          timestamp: new Date().toISOString()
        })
      })

      if (!response.ok) {
        console.warn('Failed to track product view:', response.statusText)
        return false
      }

      const data = await response.json()
      console.log('✅ Product view tracked:', productSlug, 'viewCount:', data.viewCount)
      return true
    } catch (error) {
      console.error('❌ Error tracking product view:', error)
      return false
    }
  }

  // Main tracking logic
  function initProductTracking() {
    const productSlug = getProductSlug()

    if (!productSlug) {
      console.warn('Could not determine product slug from URL')
      return
    }

    const pageLoadTime = Date.now()
    let hasTracked = false

    // Hàm để track nếu timeOnPage ≥ 5s
    const trackIfEligible = () => {
      if (hasTracked) return

      const timeOnPage = Date.now() - pageLoadTime

      if (timeOnPage >= MIN_VIEW_TIME) {
        hasTracked = true
        sendProductViewTracking(productSlug, timeOnPage)
      }
    }

    // Track nếu user ở lại ≥ 5s
    const fiveSecTimer = setTimeout(trackIfEligible, MIN_VIEW_TIME)

    // Track nếu user rời khỏi page (beforeunload)
    const handlePageLeave = () => {
      clearTimeout(fiveSecTimer)
      trackIfEligible()
    }

    window.addEventListener('beforeunload', handlePageLeave)
    window.addEventListener('pagehide', handlePageLeave)

    // Clean up listeners (optional, khi component unmount)
    // window.removeEventListener('beforeunload', handlePageLeave)
    // window.removeEventListener('pagehide', handlePageLeave)

    console.log('📊 Product tracking initialized for:', productSlug)
  }

  // Run khi DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initProductTracking)
  } else {
    initProductTracking()
  }
})()
