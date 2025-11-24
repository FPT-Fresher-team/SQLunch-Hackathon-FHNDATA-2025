importLinkCss('/css/admin/detail/product.css')

const urlSlug = location.href.match(/([^\/]*)\/*$/)[1]
const img          = document.querySelector('input#img')
const imgPath      = {path: ''}

img.addEventListener('change', function () {
  const file = img.files[0]; // Get the selected file
  const reader = new FileReader()
  reader.onload = function () {
    imgPath.path = reader.result; // Base64-encoded string
  }
  reader.readAsDataURL(file)
})

async function getProduct() {
  const response = await fetch('/admin/all-products/data/product', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({id: urlSlug})
  })
  if (!response.ok) throw new Error(`Response status: ${response.status}`)
  const {error, productInfo, brands, productStatuses} = await response.json()
  if (error) return pushNotification('An error occurred')

  document.title = productInfo.name

  document.querySelector('input#id').value = productInfo._id
  document.querySelector('select#categories').querySelectorAll('option').forEach(option => {
    if (option.value === productInfo.categories) option.selected = true
  })

  if (productInfo.categories === 'skincare') {
    document.querySelector('select#skincare').style.display = 'block'
    document.querySelector('select#skincare').querySelectorAll('option').forEach(option => {
      if (option.value === productInfo.skincare) option.selected = true
    })
  } 
  
  if (productInfo.categories === 'makeup') {
    document.querySelector('select#makeup').style.display = 'block'
    document.querySelector('select#makeup').querySelectorAll('option').forEach(option => {
      if (option.value === productInfo.makeup) option.selected = true
    })
  }

  brands.forEach((element, index) => {
    const option = document.createElement('option')
    option.value = element.name
    option.textContent = element.name
    if (element.name === productInfo.brand) option.selected = true
    
    document.querySelector('select#brand').appendChild(option)
  })

  document.querySelector('input#name').value          = productInfo.name
  document.querySelector('input#purchasePrice').value = formatNumber(productInfo.purchasePrice) 
  document.querySelector('input#oldPrice').value      = formatNumber(productInfo.oldPrice)
  document.querySelector('input#price').value         = formatNumber(productInfo.price)
  document.querySelector('input#description').value   = productInfo.description
  document.querySelector('input#details').value       = productInfo.details
  document.querySelector('input#guide').value         = productInfo.guide
  document.querySelector('input#quantity').value      = productInfo.quantity
  document.querySelector('input#rate').value          = formatRate(productInfo.rate)  + '/5'
  document.querySelector('input#saleNumber').value    = productInfo.saleNumber
  document.querySelector('input#rateNumber').value    = productInfo.rateNumber
  document.querySelector('img#image').src             = productInfo.img.path

  productStatuses.forEach((element, index) => {
    const option = document.createElement('option')
    option.value = element.code
    option.textContent = element.name
    if (element.code === productInfo.status) option.selected = true
    
    document.querySelector('select#status').appendChild(option)
  })

  return productInfo
}

async function updateProduct(productInfo) {
  const categories    = document.querySelector('select#categories').value
  const skincare      = document.querySelector('select#skincare').value
  const makeup        = document.querySelector('select#makeup').value
  const brand         = document.querySelector('select#brand').value
  const name          = document.querySelector('input#name').value
  const purchasePrice = document.querySelector('input#purchasePrice').value
  const oldPrice      = document.querySelector('input#oldPrice').value
  const price         = document.querySelector('input#price').value
  const description   = document.querySelector('input#description').value
  const details       = document.querySelector('input#details').value
  const guide         = document.querySelector('input#guide').value
  const quantity      = document.querySelector('input#quantity').value
  const status        = document.querySelector('select#status').value

  if (
    categories    === productInfo.categories     &&
    skincare      === productInfo.skincare       &&
    makeup        === productInfo.makeup         &&
    brand         === productInfo.brand          &&
    name          === productInfo.name           &&
    purchasePrice === formatNumber(productInfo.purchasePrice)  &&
    oldPrice      === formatNumber(productInfo.oldPrice)       &&
    price         === formatNumber(productInfo.price)          &&
    description   === productInfo.description    &&
    details       === productInfo.details        &&
    guide         === productInfo.guide          &&
    quantity      === formatQuantity(productInfo.quantity)     &&
    status        === productInfo.status
  ) return pushNotification('Please update the information')

  const response = await fetch('/admin/all-products/product/updated', {
    method: 'PUT',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      id            : urlSlug,
      categories    : categories,
      skincare      : skincare,
      makeup        : makeup,
      brand         : brand,
      name          : name,
      purchasePrice : purchasePrice,
      oldPrice      : oldPrice,
      price         : price,
      description   : description,
      details       : details,
      guide         : guide,
      quantity      : quantity,
      status        : status,
    })
  })
  if (!response.ok) throw new Error(`Response status: ${response.status}`)
  const {error, message} = await response.json()
  if (error) return pushNotification(error)
  pushNotification(message)

  setTimeout(() => window.location.reload(), 3000)
}

window.addEventListener('DOMContentLoaded', async function loadData() {
  try {
    const productInfo = await getProduct()
  
    document.querySelector('select#categories').addEventListener('change', (event) => {
      const skincare = document.querySelector('select#skincare')
      const makeup   = document.querySelector('select#makeup')
      
      const selectedValue = event.target.value
      if (selectedValue === 'skincare') {
        skincare.style.display = 'block'
        
        makeup.style.display = 'none'
        makeup.value = ''
      }
    
      if (selectedValue === 'makeup') {
        skincare.style.display = 'none'
        skincare.value = ''

        makeup.style.display = 'block'
      }
    })
    
    formatInputNumber(document.querySelector('input#purchasePrice'))
    formatInputNumber(document.querySelector('input#oldPrice'))
    formatInputNumber(document.querySelector('input#price'))

    document.querySelector('button[type="submit"]').onclick = function() {
      updateProduct(productInfo)
    }
  } catch (error) {
    console.error('An error occurred:', error)
    pushNotification('An error occurred')
  }
})