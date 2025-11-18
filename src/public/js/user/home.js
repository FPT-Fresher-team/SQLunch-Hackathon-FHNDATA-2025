importLinkCss('/css/user/home.css')
importLinkCss('/css/user/advertise.css')

async function getVouchers() {
  // Wait until window.isLoggedIn is assigned
  while (typeof window.isLoggedIn === 'undefined' | typeof window.recommend_url === 'undefined') {
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  
  if (!window.isLoggedIn) return
  console.log(window.isLoggedIn)
  document.querySelector('div[class="vouchers-board"][id="voucher"]').style.display = 'flex'

  try {
    const response = await fetch('/data/vouchers', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
    })
    if (!response.ok) throw new Error(`Response status: ${response.status}`)
    const {data} = await response.json()
  
    const vouchersDiv = document.querySelector('div[class="vouchers-board"][id="voucher"]').querySelectorAll('div.voucher')
    window.setTimeout(function() {
      vouchersDiv.forEach((voucher, index) => {
        if (index < data.length) {
          voucher.querySelector('p#name').textContent         = data[index].name
          voucher.querySelector('p#description').textContent  = data[index].description
          voucher.querySelector('p#end-date').textContent     = formatDate(data[index].endDate)
          voucher.querySelector('p#code').textContent         = 'Code: ' + data[index].code
          voucher.querySelector('div.loading').style.display  = 'none'
          voucher.parentElement.setAttribute('href', '/all-vouchers/voucher/' + data[index]._id)
          voucher.querySelector('button').addEventListener('click', function(e) {
            e.preventDefault()
            e.stopPropagation()
            const codeText = data[index].code
            navigator.clipboard.writeText(codeText)
            alert("Code copied successfully: " + codeText)
          })
        } else {
          voucher.style.display = 'none'
        }
      })
    }, 1000)
  } catch (error) {
    console.log(error)
    pushNotification(`Error loading favorite products: ${error}`)
  }
}

async function getFavProducts() {
  // Wait until window.isLoggedIn is assigned
  while (typeof window.isLoggedIn === 'undefined' | typeof window.recommend_url === 'undefined') {
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  if (!window.isLoggedIn) return
  document.querySelector('div[class="products-board"][id="favorite"]').style.display = 'flex'

  try {
    const response = await fetch(`${window.recommend_url}/return_data`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({uid: window.uid})
    })
    if (!response.ok) throw new Error(`Response status: ${response.status}`)
    const data = await response.json()

    const favProductsDiv = document.querySelector('div[class="products-board"][id="favorite"]').querySelectorAll('div.product')
    window.setTimeout(function() {
      favProductsDiv.forEach((product, index) => {
        product.querySelector('img').setAttribute('src', data[index].img.path)
        product.querySelector('img').setAttribute('alt', data[index].img.name)
        product.querySelector('p#old-price').textContent = formatNumber(data[index].oldPrice) 
        product.querySelector('p#price').textContent = formatNumber(data[index].price) 
        product.querySelector('p#name').textContent = data[index].name
        product.querySelector('span#rate-score').textContent = formatRate(data[index].rate) 
        product.querySelector('p#sale-number').textContent =  'Sold: ' + data[index].saleNumber
        product.querySelector('div.loading').style.display = 'none'
        product.querySelectorAll('i').forEach((star, i) => {
          if (i + 1 <= Math.floor(parseInt(product.querySelector('span#rate-score').innerText))) star.style.color = 'orange'
        })
        product.parentElement.setAttribute('href', '/all-products/product/' + data[index].id)
      })
    }, 1000)
  } catch (error) {
    pushNotification(`Error loading favorite products: ${error}`)
  }
}

async function getProducts() {
  try {
    const response = await fetch('/data/products', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify()
    })
    if (!response.ok) throw new Error(`Response status: ${response.status}`)
    const {
      flashSale,
      hotSale,
      topSale,
      skincare,
      makeup,
      all
    } = await response.json()
    const flashSaleProductsDiv  = document.querySelector('div[class="flash-deal-board"][id="flash-deal"]').querySelectorAll('div.product')
    const topSaleProductsDiv    = document.querySelector('div[class="products-board"][id="top-sale"]').querySelectorAll('div.product')
    const hotSaleProductsDiv    = document.querySelector('div[class="products-board"][id="hot-sale"]').querySelectorAll('div.product')
    const skincareProductsDiv   = document.querySelector('div[class="products-board"][id="skincare"]').querySelectorAll('div.product')
    const makeupProductsDiv     = document.querySelector('div[class="products-board"][id="makeup"]').querySelectorAll('div.product')
    const allProductsDiv        = document.querySelector('div[class="products-board"][id="all"]').querySelectorAll('div.product')

    function setProductData(products, data) {
      window.setTimeout(function() {
        products.forEach((product, index) => {
          product.querySelector('img').setAttribute('src', data[index].img.path)
          product.querySelector('img').setAttribute('alt', data[index].img.name)
          product.querySelector('p#old-price').textContent = formatNumber(data[index].oldPrice) 
          product.querySelector('p#price').textContent = formatNumber(data[index].price) 
          product.querySelector('p#name').textContent = data[index].name
          product.querySelector('span#rate-score').textContent = formatRate(data[index].rate) 
          product.querySelector('p#sale-number').textContent =  'Sold: ' + data[index].saleNumber
          product.querySelector('div.loading').style.display = 'none'
          product.querySelectorAll('i').forEach((star, i) => {
            if (i + 1 <= Math.floor(parseInt(product.querySelector('span#rate-score').innerText))) star.style.color = 'orange'
          })
          product.parentElement.setAttribute('href', '/all-products/product/' + data[index]._id)
        })
      }, 1000)
    }

    setProductData(flashSaleProductsDiv, flashSale)
    setProductData(topSaleProductsDiv  , hotSale  )
    setProductData(hotSaleProductsDiv  , topSale  )
    setProductData(skincareProductsDiv , skincare )
    setProductData(makeupProductsDiv   , makeup   )
    setProductData(allProductsDiv      , all      )

  } catch (error) {
    console.log(error)
    pushNotification(`Error loading products: ${error}`) 
  }
}

async function getBrands() {
  try {
    const response = await fetch('/data/brands', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
    })
    if (!response.ok) throw new Error(`Response status: ${response.status}`)
    const {data} = await response.json()
    const allBrandsDiv = document.querySelector('div[class="famous-brand-board"][id="brand"]').querySelectorAll('img')

    allBrandsDiv.forEach((img, index) => {
      img.parentElement.setAttribute('href', '/all-brands/brand/' + data[index]._id)
      img.setAttribute('src', data[index].img.path)
      img.setAttribute('alt', data[index].name)
    }) 
  } catch (error) {
    pushNotification(`Error loading brands: ${error}`)
  }
}

async function loadData(retriesLeft) {
  try {
    await getVouchers()
    await new Promise(r => setTimeout(r, 500))

    await getFavProducts()
    await new Promise(r => setTimeout(r, 500))

    await getProducts()
    await new Promise(r => setTimeout(r, 500))

    await getBrands()
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
//     topic = 'page-view', 
//     value = {
//       "user_id"   : window.uid,
//       "page_type" : 'home',
//       "timestamp" : new Date(),
//     }
//   )
// }, 1000);