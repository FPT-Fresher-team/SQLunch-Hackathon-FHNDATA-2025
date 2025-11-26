importLinkCss('/css/user/allProducts.css')

// Category dropdown toggle functionality
const categoryHeader = document.querySelector('.category-header')
const categoryContent = document.querySelector('.category-content')

if (categoryHeader && categoryContent) {
  categoryHeader.addEventListener('click', function() {
    categoryHeader.classList.toggle('collapsed')
    categoryContent.classList.toggle('collapsed')
  })
}

// URL tracking - show/hide categories
const currentUrl = window.location.pathname
const skincareCategory = document.querySelector('div.all-category-skincare')
const makeupCategory = document.querySelector('div.all-category-makeup')

// Show categories based on URL
if (currentUrl.includes('skincare')) {
  skincareCategory.style.display = 'block'
  makeupCategory.style.display = 'none'
} else if (currentUrl.includes('makeup')) {
  makeupCategory.style.display = 'block'
  skincareCategory.style.display = 'none'
} else {
  skincareCategory.style.display = 'block'
  makeupCategory.style.display = 'block'
}

const mainTitle        = document.querySelector('div.main-title').querySelector('b')
const allProducts      = document.querySelector('div[class="products"]').querySelectorAll('div.product')
const pagination       = document.querySelector('span.pagination')
const urlSlug          = new URL(window.location).pathname.split('/').slice(1).filter(slug => slug !== 'all-products')
let sortOptions        = {}
const filterOptions    = { deletedAt: null, [urlSlug[0]]: urlSlug[1] }
const currentPage      = { page: 1 }

const titles = {
  'xit-khoang': 'Mineral Mist Products',
  'mat-na': 'Mask Products',
  'serum': 'Serum Products',
  'bha': 'BHA Products',
  'tay-da-chet': 'Exfoliator Products',
  'duong-da': 'Moisturizer Products',
  'toner': 'Toner Products',
  'nuoc-tay-trang': 'Cleansing Water Products',
  'cham-mun': 'Spot Treatment Products',
  'kem-duong-am': 'Moisturizing Cream Products',
  'sua-rua-mat': 'Facial Cleanser Products',
  'phan-ma': 'Blush Products',
  'mascara': 'Mascara Products',
  'ke-mat': 'Eyeliner Products',
  'kem-chong-nang': 'Sunscreen Products',
  'che-khuyet-diem': 'Concealer Products',
  'son': 'Lipstick Products',
  'makeup': 'Makeup Products',
  'skincare': 'Skincare Products',
}

if (urlSlug[1] === 'true') {
  if (urlSlug[0] === 'isFlashDeal') {
    mainTitle.innerText = 'Flash Deal Products'
  } else if (urlSlug[0] === 'isNewArrival') {
    mainTitle.innerText = 'New Arrival Products'
  } else if (urlSlug[0] === 'isTopSelling') {
    mainTitle.innerText = 'TopSelling Products'
  }
}

if (titles[urlSlug[1]]) {
  mainTitle.innerText = titles[urlSlug[1]]
  document.title = titles[urlSlug[1]]
} 

if (urlSlug.includes('skincare')) {
  skincareCategory.style.display = ''
}
if (urlSlug.includes('makeup')) {
  makeupCategory.style.display = ''
}

async function paginatingProducts(data_size) {
  pagination.querySelectorAll('p').forEach(p => p.remove())
  var totalPage = 1
  for (var i = 0; i < data_size; i += 9) {
    const newPage = document.createElement('p')
    if (i === 0) newPage.classList.add('current')
    newPage.innerText = `${totalPage}`
    pagination.appendChild(newPage)
    newPage.onclick = function() {
      pagination.querySelectorAll('p').forEach(t => t.classList.remove('current'))
      currentPage.page = parseInt(newPage.innerText) 
      newPage.classList.add('current')

      getProducts(allProducts, sortOptions, filterOptions, currentPage.page)
    }
    totalPage++
  }
}

async function checkingClearButton(clearSortBtn, clearFilterBtn) {
  if (Object.keys(sortOptions).length > 0) clearSortBtn.style.display = ''
  if (Object.keys(filterOptions).length > 2) clearFilterBtn.style.display = ''
}

async function getProducts(products, sortOptions, filterOptions, currentPage) {
  products.forEach((product, index) => {
    product.querySelector('div.loading').style.display = ''
  })

  const response = await fetch('/all-products/data/products', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({sort: sortOptions, filter: filterOptions, page: currentPage})
  })
  if (!response.ok) throw new Error(`Response status: ${response.status}`)
  const {data, data_size} = await response.json()

  products.forEach((product, index) => {
    if (index < data.length) {
      product.querySelector('span.discount-badge').textContent = formatPercentage((data[index].oldPrice - data[index].price) / data[index].oldPrice * 100) 
      product.querySelector('img').setAttribute('src', data[index].img.path)
      product.querySelector('img').setAttribute('alt', data[index].img.name)
      product.querySelector('p#old-price').textContent = formatNumber(data[index].oldPrice) 
      product.querySelector('p#price').textContent = formatNumber(data[index].price) 
      product.querySelector('p#name').textContent = data[index].name
      product.querySelector('span#rate-score').textContent = formatRate(data[index].rate) 
      product.querySelector('p#sale-number').textContent =  'Sold: ' + data[index].saleNumber
      product.querySelector('div.loading').style.display = 'none'
      product.querySelectorAll('i').forEach((star, i) => {
        star.style.color = 'black'
      })
      product.querySelectorAll('i').forEach((star, i) => {
        if (i + 1 <= Math.floor(parseInt(product.querySelector('span#rate-score').innerText))) star.style.color = 'orange'
      })
      product.style.display = ''
      product.parentElement.setAttribute('href', '/all-products/product/' + data[index]._id)
    } else {
      product.style.display = 'none'
    }
  })
  
  return data_size
}

function calcLeftPosition(value) {
  return (value - minPrice)/(maxPrice - minPrice) * 100
}

// sort
const sortButton = document.querySelector('div.sort').querySelectorAll('select')
sortButton.forEach((button) => {
  button.onchange = function () {
    sortButton.forEach(otherSelect => {
      if (otherSelect !== this) otherSelect.value = '0'  // Reset to Default
    })
    const sortType = button.id
    const sortValue = parseInt(button.value)
    if (sortValue === 0) {
      sortOptions = {}
    } else {
      sortOptions = { [sortType]: sortValue }
    }
    getProducts(allProducts, sortOptions, filterOptions, currentPage.page)
    checkingClearButton(clearSortBtn, clearFilterBtn)
  }
}) 

const clearSortBtn = document.querySelector('div.sort').querySelector('button#clear-sort')
clearSortBtn.onclick = function() {
  Object.keys(sortOptions).forEach(key => delete sortOptions[key])
  getProducts(allProducts, sortOptions, filterOptions, currentPage.page)
  sortButton.forEach((button) => {
    button.selectedIndex = 0
  }) 
  clearSortBtn.style.display = 'none'
}

// filter
const minPrice = 10000
const maxPrice = 1000000
document.querySelector('div.filter').querySelector('input#rangeMin').addEventListener('input', function (e) {
  const newValue = parseInt(e.target.value)
  if (newValue > maxPrice) return

  document.querySelector('div.filter').querySelector('span#thumbMin').style.left = calcLeftPosition(newValue) + '%'
  document.querySelector('div.filter').querySelector('span#min').innerHTML = formatNumber(newValue)
  document.querySelector('div.filter').querySelector('input#rangeMin').value = newValue

  const line = document.querySelector('div.filter').querySelector('div#line')
  line.style.left  = calcLeftPosition(newValue) + '%'
  line.style.right = (100 - calcLeftPosition(maxPrice)) + '%'
})
document.querySelector('div.filter').querySelector('input#rangeMax').addEventListener('input', function (e) {
  const newValue = parseInt(e.target.value)
  if (newValue > maxPrice) return

  document.querySelector('div.filter').querySelector('span#thumbMax').style.left = calcLeftPosition(newValue) + '%'
  document.querySelector('div.filter').querySelector('span#max').innerHTML = formatNumber(newValue)
  document.querySelector('div.filter').querySelector('input#rangeMax').value = newValue

  const line = document.querySelector('div.filter').querySelector('div#line')
  line.style.left  = calcLeftPosition(minPrice) + '%'
  line.style.right = (100 - calcLeftPosition(newValue)) + '%'
})
document.querySelector('div.filter').querySelector('button#submit-filter').addEventListener('click', async function() {
  const min = parseInt(document.querySelector('div.filter').querySelector('input#rangeMin').value)
  const max = parseInt(document.querySelector('div.filter').querySelector('input#rangeMax').value)
  if (min === minPrice && max === maxPrice) return

  filterOptions.price = `${min}-${max}`
  const data_size = await getProducts(allProducts, sortOptions, filterOptions, currentPage.page)
  // pagination.querySelectorAll('p').forEach(p => p.remove())
  paginatingProducts(data_size)
  checkingClearButton(clearSortBtn, clearFilterBtn)
})

const clearFilterBtn = document.querySelector('div.filter').querySelector('button#clear-filter')
clearFilterBtn.onclick = async function() {
  delete filterOptions['price']
  clearFilterBtn.style.display = 'none'
  
  document.querySelector('div.filter').querySelector('span#thumbMin').style.left  = calcLeftPosition(minPrice) + '%'
  document.querySelector('div.filter').querySelector('span#min').innerHTML        = formatNumber(minPrice)
  document.querySelector('div.filter').querySelector('input#rangeMin').value      = minPrice
  
  document.querySelector('div.filter').querySelector('span#thumbMax').style.left  = calcLeftPosition(maxPrice) + '%'
  document.querySelector('div.filter').querySelector('span#max').innerHTML        = formatNumber(maxPrice)
  document.querySelector('div.filter').querySelector('input#rangeMax').value      = maxPrice

  document.querySelector('div.filter').querySelector('div#line').style.left  = calcLeftPosition(minPrice) + '%'
  document.querySelector('div.filter').querySelector('div#line').style.right = (100 - calcLeftPosition(minPrice)) + '%'
  
  const data_size = await getProducts(allProducts, sortOptions, filterOptions, currentPage.page)
  paginatingProducts(data_size)
}

async function loadData(retriesLeft) {
  try {
    const data_size = await getProducts(allProducts, sortOptions, filterOptions, currentPage.page)
    paginatingProducts(data_size)
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
//       user_id: window.uid,
//       page_type: urlSlug[1],
//       timestamp: new Date(),
//     }
//   );
// }, 1000)