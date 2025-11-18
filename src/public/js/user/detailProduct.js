importLinkCss('/css/user/detailProduct.css')
// importScript('/js/user/trackProductView.js')

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

  productElement.querySelector('img').setAttribute('src', data.img.path)
  productElement.querySelector('img').setAttribute('alt', data.name)
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
  productElement.querySelector('h4#quantity').textContent = 'Số lượng: ' + data.quantity
  productElement.querySelector('h5#sale-number').textContent = 'Đã bán: ' + data.saleNumber
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
        product.querySelector('p#sale-number').textContent =  'Đã bán: ' + data[index].saleNumber
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

function increaseQuantity(productInfo) {
  getIncreaseQuantity.onclick = function () {
    // increase the quantity on page
    getQuantityValue.innerText++
    listProductLength.length = myObj.productInfo.length
    for (let i = 0; i < listProductLength.length; ++i) {
      if (myObj.productInfo[i].id === productInfo._id) {
        // store the quantity on page to localStorage
        myObj.productInfo[i].quantity = getQuantityValue.innerText
        localStorage.setItem('product_cart_count', JSON.stringify(myObj))
      }
    }
  }
}

function decreaseQuantity(productInfo) {
  getDecreaseQuantity.onclick = function () {
    getQuantityValue.innerText--
    listProductLength.length = myObj.productInfo.length
    for (let i = 0; i < listProductLength.length; ++i) {
      if (myObj.productInfo[i].id === productInfo._id) {
        if (getQuantityValue.innerText === '1') {
          getQuantityValue.innerText = 1
          myObj.productInfo[i].quantity = 1
        } else {
          myObj.productInfo[i].quantity = getQuantityValue.innerText
        }
        localStorage.setItem('product_cart_count', JSON.stringify(myObj));
      }
    }
  }
}

function addToCart(productInfo) {
  getAddToCart.onclick = async function() {
    // the item has not yet been added, click to add
    if (getAddToCart.style.backgroundColor === '') {
      // change button color to 'added button'
      getAddToCart.style.backgroundColor = '#389845'
      getAddToCart.querySelector('p').style.color = 'white'
  
      // add 1 to the cartCounting and set the quantity value min = 1
      myObj.localCounting++
      if (getQuantityValue.innerText === '0') {
        getQuantityValue.innerText = 1
      }

      // create new added product
      const newProductInfo = {
        id      : productInfo._id,
        quantity: getQuantityValue.innerText
      };
  
      // store new added product to localStorage
      myObj.productInfo.push(newProductInfo)

      // push event log to kafka
      // getLog(
      //   topic = 'cart-update', 
      //   value = {
      //     "user_id"     : window.uid,
      //     "product_id"  : urlSlug,
      //     "update_type" : 'add',
      //     "timestamp"   : new Date(),
      //   }
      // )
    } else {
      // the item has already been added, click to remove
      // change button color to 'default button'
      getAddToCart.style.backgroundColor = ''
      getAddToCart.querySelector('p').style.color = '#389845'
  
      // minus 1 from the cartCounting and reset the productQuantity to 0
      myObj.localCounting--
  
      // remove the product from the localStorage
      listProductLength.length = myObj.productInfo.length
      for (let i = 0; i < listProductLength.length; i++) {
        if (myObj.productInfo[i].id === productInfo._id) {
          myObj.productInfo.splice(i, 1)
          break
        }
      }

      // getLog(
      //   topic = 'cart-update', 
      //   value = {
      //     "user_id"     : window.uid,
      //     "product_id"  : urlSlug,
      //     "update_type" : 'remove',
      //     "timestamp"   : new Date(),
      //   }
      // )
    }
  
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
        quantity: getQuantityValue.innerText
      }
  
      myObj.productInfo.push(newProductInfo)
      localStorage.setItem('product_cart_count', JSON.stringify(myObj))

      // getLog(
      //   topic = 'cart-update', 
      //   value = {
      //     "user_id"     : window.uid,
      //     "product_id"  : urlSlug,
      //     "update_type" : 'add',
      //     "timestamp"   : new Date(),
      //   }
      // )
    } else {}
  }
}

function checkExistedProduct(productInfo) {
  for (let i = 0; i < listProductLength.length; ++i) {
    if (myObj.productInfo[i].id === productInfo._id) {
      // change button color to 'added button'
      getAddToCart.style.backgroundColor = '#389845'
      getAddToCart.querySelector('p').style.color = 'white'
  
      // visible the quantity div
      getQuantityDiv.style.visibility = 'visible'
      getQuantityValue.innerText = myObj.productInfo[i].quantity 
      break
    } 
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
    ratingBars[index].style.backgroundColor = '#389845'
  })
}

async function loadData(retriesLeft) {
  try {
    const data = await getProduct()
    for (let key in data) {
      productInfo[key] = data[key]
    }
    checkExistedProduct(productInfo)
    checkStatusProduct(productInfo)
    addToCart(productInfo)
    buyNow(productInfo)
    increaseQuantity(productInfo)
    decreaseQuantity(productInfo)
    getComment()
    getRelatedProducts(productInfo)
    pushDataToRecommendationSystem(data)
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

// setTimeout(() => {
//   getLog(
//     topic = 'product-view', 
//     value = {
//       "user_id"   : window.uid,
//       "product_id": urlSlug,
//       "timestamp" : new Date(),
//     }
//   )
// }, 1000)