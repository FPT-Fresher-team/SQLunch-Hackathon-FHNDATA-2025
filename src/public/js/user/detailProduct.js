importLinkCss('/css/user/detailProduct.css')

const getAddToCart        = document.querySelector('div.add-to-cart')
const getBuyNow           = document.querySelector('div.buy-now')
const getOutOfOrder       = document.querySelector('div.out-of-order')
const getQuantityDiv      = document.querySelector('div.quantity')
const getIncreaseQuantity = document.querySelector('i.fi-rr-add')
const getDecreaseQuantity = document.querySelector('i.fi-rr-minus-circle')
const getQuantityValue    = document.querySelector('div.quantity').querySelector('p')
const metaDescription     = document.querySelector("meta[name='description']")
const productElement      = document.querySelector('div.table')
const commentElement      = document.querySelector('div.comment-box')
const relatedProducts     = document.querySelector('div.related-products').querySelectorAll('div.product')
const urlSlug             = location.href.match(/([^\/]*)\/*$/)[1]
const productInfo         = {}

// get obj from storage first, if not created, return {}
const myObjFromStorage = JSON.parse(localStorage.getItem('product_cart_count')) || {
  localCounting: 0,
  productInfo: []
}
const myObj = {
  localCounting: myObjFromStorage.localCounting || 0,
  productInfo: myObjFromStorage.productInfo || []
} 
const listProductLength = {length: myObj.productInfo.length}

// set value to the myObj, stringify because localStorage only store string type
localStorage.setItem('product_cart_count', JSON.stringify(myObj))

// set default quantity value to 0 on first load and hidden the quantity div
getQuantityValue.innerText = 0

// ==================== IMAGE SLIDESHOW ==================== 
let currentImageIndex = 0
const mainImage = document.querySelector('#main-image')
const thumbnails = document.querySelectorAll('.thumbnail')
const prevBtn = document.querySelector('.slide-prev')
const nextBtn = document.querySelector('.slide-next')
const imageArray = []

function updateMainImage(index) {
  if (imageArray.length === 0) return
  
  currentImageIndex = (index + imageArray.length) % imageArray.length
  mainImage.src = imageArray[currentImageIndex]
  
  thumbnails.forEach((thumb, i) => {
    if (i === currentImageIndex) {
      thumb.classList.add('active')
    } else {
      thumb.classList.remove('active')
    }
  })
}

function nextImage() {
  updateMainImage(currentImageIndex + 1)
}

function prevImage() {
  updateMainImage(currentImageIndex - 1)
}

if (prevBtn && nextBtn) {
  prevBtn.addEventListener('click', prevImage)
  nextBtn.addEventListener('click', nextImage)
}

thumbnails.forEach((thumb, index) => {
  thumb.addEventListener('click', () => {
    updateMainImage(index)
  })
})

async function getProduct() {
  const response = await fetch('/all-products/data/product', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({productId: urlSlug})
  })
  if (!response.ok) throw new Error(`Response status: ${response.status}`)
  const {data} = await response.json()

  metaDescription.setAttribute("content", data.description)
  document.title = data.name

  // Update main image and populate slideshow
  if (data.img && data.img.path) {
    imageArray.push(data.img.path)
    mainImage.setAttribute('src', data.img.path)
    mainImage.setAttribute('alt', data.name)
  }
  
  // Populate additional images if available (use same image up to 5 times or different images if available)
  if (data.img && data.img.path) {
    for (let i = 1; i < 5; i++) {
      imageArray.push(data.img.path)
    }
  }
  
  // Update thumbnails with images
  thumbnails.forEach((thumb, index) => {
    if (index < imageArray.length) {
      thumb.querySelector('img').src = imageArray[index]
      thumb.querySelector('img').alt = `${data.name} - image ${index + 1}`
    }
  })
  
  // Update rating stars
  productElement.querySelector('span.discount-badge').textContent = formatPercentage((data.oldPrice - data.price) / data.oldPrice * 100) 
  productElement.querySelector('span#rate-score').textContent = formatRate(data.rate)
  productElement.querySelector('p#product-rate').querySelectorAll('i').forEach((star, i) => {
    star.style.color = 'black'
  })
  productElement.querySelector('p#product-rate').querySelectorAll('i').forEach((star, i) => {
    if (i + 1 <= data.rate) star.style.color = 'orange'
  })
  productElement.querySelector('h3#brand').textContent = data.brand
  productElement.querySelector('h1#name').textContent = data.name
  productElement.querySelector('h4#old-price').textContent = formatNumber(data.oldPrice) 
  productElement.querySelector('h3#price').textContent = formatNumber(data.price)
  productElement.querySelector('h4#quantity').textContent = 'Quantity: ' + data.quantity
  productElement.querySelector('h5#sale-number').textContent = 'Sold: ' + data.saleNumber
  productElement.querySelector('p#description').textContent = data.description
  productElement.querySelector('div.loading').remove()

  document.querySelector('p#details').textContent = data.details
  document.querySelector('p#guide').textContent = data.guide
  document.querySelector('div.rating-score').querySelector('h1').textContent = formatRate(data.rate)
  document.querySelectorAll('div.more-details').forEach(div => div.querySelector('div.loading').remove())

  return data
}

async function getComment() {
  const response = await fetch('/all-products/data/comment', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({productId: urlSlug})
  })
  if (!response.ok) throw new Error(`Response status: ${response.status}`)
  const {data} = await response.json()

  commentElement.querySelectorAll('div.comment').forEach((comment, index) => {
    if (index < data.length) {
      comment.querySelector('p#sender').textContent = data[index].senderId
      comment.querySelector('span#rate').textContent = data[index].rate 
      comment.querySelector('p#comment').textContent = data[index].comment 
    } else {
      comment.remove()
    }
  })

  rateProduct()
}

async function getRelatedProducts(productInfo) {
  const response = await fetch('/all-products/data/related-products', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      productId: productInfo._id, 
      categories: productInfo.categories, 
      type: productInfo.skincare || productInfo.makeup})
  })
  if (!response.ok) throw new Error(`Response status: ${response.status}`)
  const {data} = await response.json()

  window.setTimeout(function() {
    relatedProducts.forEach((product, index) => {
      if (index < data.length) {
        product.querySelector('img').setAttribute('src', data[index].img.path)
        product.querySelector('img').setAttribute('alt', data[index].img.name)
        product.querySelector('p#old-price').textContent = formatNumber(data[index].oldPrice) 
        product.querySelector('p#price').textContent = formatNumber(data[index].price) 
        product.querySelector('p#name').textContent = data[index].name
        product.querySelector('span#rate-score').textContent = Math.round(data[index].rate * 100) / 100
        product.querySelector('p#sale-number').textContent =  'Sold: ' + data[index].saleNumber
        product.querySelector('div.loading').style.display = 'none'
        product.querySelectorAll('i').forEach((star, i) => {
          if (i + 1 <= Math.floor(parseInt(product.querySelector('span#rate-score').innerText))) star.style.color = 'orange'
        })
        product.style.display = ''
        product.parentElement.setAttribute('href', '/all-products/product/' + data[index]._id)
      } else {
        product.remove()
      }
    })
  }, 2000)
}

async function pushDataToRecommendationSystem(data) {
  try {
    // Wait until window.isLoggedIn is assigned
    while (typeof window.isLoggedIn === 'undefined' | typeof window.recommend_url === 'undefined') {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  
    if (!window.isLoggedIn) return
  
    const response = await fetch(`${window.recommend_url}/get_data`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({data: data, uid: window.uid})
    })
    if (!response.ok) throw new Error(`Response status: ${response.status}`)
  } catch (error) {
    pushNotification(error)
    console.log(error)
  }
}

function increaseQuantity() {
  getIncreaseQuantity.onclick = function () {
    getQuantityValue.innerText++
  }
}

function decreaseQuantity() {
  getDecreaseQuantity.onclick = function () {
    getQuantityValue.innerText--
    if (getQuantityValue.innerText < 1) {
      getQuantityValue.innerText = 1
    }
  }
}

function addToCart(productInfo) {
  getAddToCart.onclick = async function() {
    // add 1 to the cartCounting and set the quantity value min = 1
    if (getQuantityValue.innerText === '0') {
      getQuantityValue.innerText = 1
    }

    const quantity = parseInt(getQuantityValue.innerText)
    console.log(quantity)

    listProductLength.length = myObj.productInfo.length
    for (let i = 0; i < listProductLength.length; ++i) {
      if (myObj.productInfo[i].id === productInfo._id) {
        myObj.productInfo[i].quantity += quantity
        localStorage.setItem('product_cart_count', JSON.stringify(myObj))
        return
      }
    }

    myObj.localCounting++
    
    // create new added product
    const newProductInfo = {
      id       : productInfo._id,
      quantity : parseInt(getQuantityValue.innerText),
      isChecked: false
    };

    // store new added product to localStorage
    myObj.productInfo.push(newProductInfo)
  
    localStorage.setItem('product_cart_count', JSON.stringify(myObj));
    document.dispatchEvent(new CustomEvent('cartUpdated'));
  }
}

function buyNow(productInfo) {
  getBuyNow.onclick = function () {
    if (getAddToCart.style.backgroundColor === '') {
      myObj.localCounting++
      if (getQuantityValue.innerText === '0') {
        getQuantityValue.innerText = 1
      }

      const newProductInfo = {
        id      : productInfo._id,
        quantity: parseInt(getQuantityValue.innerText),
        isChecked: false
      }
  
      myObj.productInfo.push(newProductInfo)
      localStorage.setItem('product_cart_count', JSON.stringify(myObj))
    } else {}
  }
}

function checkStatusProduct(productInfo) {
  if (productInfo.status === 'out-of-order') {
    getAddToCart.style.display = 'none'
    getBuyNow.style.display = 'none'
    getOutOfOrder.style.display = 'flex'
  }
}

function rateProduct() {
  const scoreList = Array.from(document.querySelectorAll('div.comment'))
  const ratingPercents = Array.from(document.querySelector('div.rating-detail-score').querySelectorAll('span#rating-percent'))
  const ratingBars = document.querySelector('div.rating-detail-score').querySelectorAll('span#rating-progress')
  const ratingNums = Array.from(document.querySelector('div.rating-detail-score').querySelectorAll('span#rating-num'))
  const rateList = Array(5).fill(0)
  scoreList.forEach((score, index) => {
    const value = parseFloat(score.querySelector('span#rate').innerText)
    scoreList[index] = value
    rateList.forEach((rate, index) => {
      if (index+1 === value) rateList[index] = rate + 1
    })
  })
  
  ratingPercents.forEach((rate, index) => {
    const length = scoreList.length || 1
    const value = (rateList[index] / length * 100).toFixed(0)
    rate.innerText = value
    ratingNums[index].innerText = rateList[index]
    ratingBars[index].style.width = `${value}%`
    ratingBars[index].style.backgroundColor = '#2B6377'
  })
}

async function loadData(retriesLeft) {
  try {
    const data = await getProduct()
    for (let key in data) {
      productInfo[key] = data[key]
    }
    checkStatusProduct(productInfo)
    addToCart(productInfo)
    buyNow(productInfo)
    increaseQuantity()
    decreaseQuantity()
    getComment()
    // getRelatedProducts(productInfo)
    pushDataToRecommendationSystem(data)
    await loadRelatedProducts('category', relatedSections.category)
  } catch (err) {
    if (retriesLeft > 1) {
      console.error(`Retrying... Attempts left: ${retriesLeft - 1}`)
      pushNotification('Error loading data. Retrying...')
      window.setTimeout(async function() {
        loadData(retriesLeft - 1)
      }, 2000)
    } else {
      console.error("Failed to fetch products after multiple attempts:", err)
      pushNotification(`Error loading data: ${err}. Please try again later`)
    }
  }
}

loadData(5)

// ==================== RELATED PRODUCTS TABS ==================== 
const tabButtons = document.querySelectorAll('.tab-btn')
const relatedSections = {
  category: document.getElementById('related-category'),
  type: document.getElementById('related-type'),
  brand: document.getElementById('related-brand'),
  viewed: document.getElementById('related-viewed'),
  recommended: document.getElementById('related-recommended')
}

tabButtons.forEach(button => {
  button.addEventListener('click', async (e) => {
    const tabType = e.currentTarget.dataset.tab
    
    // Update active button
    tabButtons.forEach(btn => btn.classList.remove('active'))
    e.currentTarget.classList.add('active')
    
    // Hide all sections
    Object.values(relatedSections).forEach(section => {
      section.style.display = 'none'
    })
    
    // Load and show selected section
    const selectedSection = relatedSections[tabType]
    selectedSection.style.display = 'grid'
    
    // Load data if not already loaded
    if (selectedSection.querySelector('.loading-placeholder')) {
      await loadRelatedProducts(tabType, selectedSection)
    }
  })
})

// Load related products based on type
async function loadRelatedProducts(type, container) {
  try {
    let endpoint = ''
    let filter = { productId: productInfo._id }

    if (type === 'category') {
      // Get category from current product (already loaded)
      endpoint = '/all-products/data/related-category'
      filter.categories = productInfo.categories
    } else if (type === 'type') {
      endpoint = '/all-products/data/related-type'
      filter.categories = productInfo.categories
      filter.type = productInfo.skincare ? productInfo.skincare : productInfo.makeup
    } else if (type === 'brand') {
      endpoint = '/all-products/data/related-brand'
      filter.brand = productInfo.brand
    } else if (type === 'viewed') {
      endpoint = '/all-products/data/related-viewed'
      filter = {}
    } else if (type === 'recommended') {
      endpoint = 'http://localhost:8000/recommend'
      filter = {
        productId: productInfo._id,     // current viewed product
        mode: "product"
      }
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(filter),
      credentials: 'include' 
    })

    const data = await response.json()

    console.log(data)
    
    if (data.data && data.data.length > 0) {
      // Clear loading placeholder
      container.innerHTML = ''
      
      // Add products
      data.data.forEach(product => {
        const productHTML = createProductCard(product)
        container.innerHTML += productHTML
      })
    } else {
      container.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 20px;">No products found</p>'
    }
  } catch (error) {
    console.error('Error loading related products:', error)
    container.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 20px; color: red;">Error loading products</p>'
  }
}

// Helper function to create product card HTML
function createProductCard(product) {
  return `
    <a href="/all-products/product/${product._id}">
      <div class="product">
        <div class="loading"></div>
        <span class="discount-badge">${formatPercentage((product.oldPrice - product.price) / product.oldPrice * 100)}</span>
        <img loading="lazy" src="${product.img.path}" alt="${product.img.name}">
        <del><p id="old-price">${formatNumber(product.oldPrice)}</p></del>
        <p id="price">${formatNumber(product.price)}</p>
        <p id="name">${product.name}</p>
        <p id="rate">
          <i class="fi fi-ss-star"></i>
          <span id="rate-score">${formatRate(product.rate)}</span> 
        </p>
        <p id="sale-number">${'Sold: ' + product.saleNumber}</p>
      </div>
    </a>
  `
}