importLinkCss('/css/admin/create/order.css')

const input              = document.querySelector('input[type="text"][id="product-search"]')
const tbody              = document.querySelector('tbody')
const tfoot              = document.querySelector('tfoot')
const submitButton       = document.querySelector('button[type="submit"]')
const productId          = []
const productName        = []
const productImg         = []
const productQuantity    = []
const productPrice       = []
const totalOrderPrice    = { value: 0 }

function checkIsAddedProduct(id) {
  return productId.some((element) => element === id)
}

function updateProductTotalPrice() {
  tbody.querySelectorAll('tr').forEach((tr) => {
    const input  = tr.querySelector('input#productQuantity')
    const remove = tr.querySelector('td:last-child')
    const id     = tr.querySelector('input#productId').value
  
    input.addEventListener('input', function() {
      const price = deFormatNumber(tr.querySelector('td:nth-child(4)').innerText)
      const qty   = input.value
      
      productId.forEach((element, index) => {
        if (element === id) {
          productQuantity[index] = qty
        }
      })

      tr.querySelector('td:nth-child(6)').innerText = formatNumber(price * qty)
      updatePurchaseTotalPrice()
    })
    remove.addEventListener('click', function() {
      productId.forEach((element, index) => {
        if (element === id) {
          productId.splice(index, 1)
          productName.splice(index, 1)
          productImg.splice(index, 1)
          productQuantity.splice(index, 1)
          productPrice.splice(index, 1)
        }
      })

      tr.remove()

      updatePurchaseTotalPrice()
    })
  })
}

function updatePurchaseTotalPrice() {
  var total = 0
  tbody.querySelectorAll('td:nth-child(6)').forEach((td) => {
    total += deFormatNumber(td.innerText)
  })
  document.querySelector('tfoot td:nth-child(5)').innerText = formatNumber(total)
  totalOrderPrice.value = total
}

async function getCustomers() {
  const response = await fetch('/admin/all-orders/data/customers', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
  })
  if (!response.ok) throw new Error(`Response status: ${response.status}`)
  const json = await response.json()
  if (json.error) return pushNotification(error)

  json.data.forEach((element) => {
    const option = document.createElement('option')
    option.value = element._id
    option.textContent = element.name + ': ' + element.phone
    document.querySelector('select[name="userId"]').appendChild(option) 
  })

  return
}

async function getStores() {
  const response = await fetch('/admin/all-orders/data/stores', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
  })
  if (!response.ok) throw new Error(`Response status: ${response.status}`)
  const json = await response.json()
  if (json.error) return pushNotification(error)

  json.data.forEach((element) => {
    const option = document.createElement('option')
    option.value = element.code
    option.textContent = element.name
    document.querySelector('select[name="storeCode"]').appendChild(option) 
  })

  return
}

async function getPaymentMethod() {
  const response = await fetch('/admin/all-orders/data/paymentMethod', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
  })
  if (!response.ok) throw new Error(`Response status: ${response.status}`)
  const json = await response.json()
  if (json.error) return pushNotification(error)

  json.data.forEach((element) => {
    const option = document.createElement('option')
    option.value = element.code
    option.textContent = element.name
    document.querySelector('select[name="paymentMethod"]').appendChild(option) 
  })

  return
}

async function getProducts(query) {
  document.querySelector('div.products-match').querySelectorAll('div').forEach(element => element.remove())

  if (query === '') return

  const response = await fetch('/admin/all-orders/data/products', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({ query: query })
  })
  if (!response.ok) throw new Error(`Response status: ${response.status}`)
  const json = await response.json()
  if (json.error) return pushNotification(error)

  json.data.forEach((element) => {
    const isAddedProduct = checkIsAddedProduct(element._id)
    if (isAddedProduct) return

    const div = document.createElement('div')
    div.classList.add('product')
    div.innerHTML = `
      <p style="display: none" id="product-id">${element._id}</p>
      <p style="width: 15%">${element.brand}</p>
      <p 
        style="width: 65%; display:flex; align-items:center; justify-content:start; gap:5px"
        id="product-name"
      >
        <img src="${element.img.path}" alt="${element.name}" loading="lazy" loading="lazy"> 
        ${element.name}
      </p>  
      <p style="width: 10%;">${element.categories}</p>
      <p style="width: 10%; text-align:right" id="product-price">${formatNumber(element.price)}</p>
    `

    div.addEventListener('click', function() {
      productId.push(element._id)
      productName.push(element.name)
      productImg.push(element.img.path)
      productQuantity.push('1')
      productPrice.push(element.price)

      div.remove()

      const newRow = document.createElement('tr')
      newRow.innerHTML = `
        <td></td>
        <td style="display: none"><input type="hidden" id="productId" value="${element._id}"></td>
        <td style="display:flex; align-items:center; justify-content:start; gap:5px">
          <img src="${element.img.path}" alt="${element.name}" loading="lazy" loading="lazy"> 
          ${element.name}
        </td>
        <td style="text-align: right;">${formatNumber(element.price)}</td>
        <td><input type="number" id="productQuantity" min="1" value="1" style="max-width: 50px; text-align: center;"></td>
        <td style="text-align: right;">${formatNumber(element.price)}</td>
        <td>x</td>
      `

      tbody.appendChild(newRow)

      updateProductTotalPrice()

      updatePurchaseTotalPrice()
    })

    document.querySelector('div.products-match').appendChild(div)
  })

  return
}

async function createOrder() {
  try {
    const orderDate     = document.querySelector('input#orderDate').value
    const userId        = document.querySelector('select#userId').value
    const paymentMethod = document.querySelector('select#paymentMethod').value
    const note          = document.querySelector('input#note').value
  
    if (
      !orderDate        || 
      !userId           || 
      !paymentMethod    || 
      !productId        || 
      !productQuantity  || 
      !totalOrderPrice
    ) {
      pushNotification("Please fill in all information!")
      return
    }
  
    const response = await fetch('/admin/all-orders/order/created', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        orderDate         : orderDate,
        userId            : userId,
        paymentMethod     : paymentMethod,
        note              : note,
        productId         : productId,
        productName       : productName,
        productImg        : productImg,
        productQuantity   : productQuantity,
        productPrice      : productPrice,
        totalOrderPrice   : totalOrderPrice.value
      })
    })
    if (!response.ok) throw new Error(`Response status: ${response.status}`)
    const {error, message} = await response.json()
    if (error) return pushNotification(error)
    pushNotification(message)
  
    setTimeout(() => window.location.reload(), 2000)
  } catch (error) {
    console.error('Error creating customer:', error)
    pushNotification("Đã có lỗi xảy ra.")
  }
}

input.addEventListener('input', function() {
  const value = input.value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase() 
  getProducts(value)
})

submitButton.onclick = function() {
  createOrder()
}

window.addEventListener('DOMContentLoaded', async function loadData() {
  getCustomers()
  getStores()
  getPaymentMethod()
})