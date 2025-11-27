importLinkCss('/css/admin/all/purchases.css')

// ALL
const thead         = document.querySelector('table').querySelector('thead')
const tbody         = document.querySelector('table').querySelector('tbody')
const changeColumns = document.querySelector('i.fi.fi-rr-objects-column')
const sortOptions   = {}
const filterOptions = {}
const currentPage   = { page: 1 }
const dataSize      = { size: 0 }
const searchInput   = document.querySelector('input#search-input')

function generateColumns() {
  const columnsGroup = document.querySelector('div.checkbox-group')
  const inputList = `
    <label><input type="checkbox" value="_id" checked> Order Code</label>
    <label><input type="checkbox" value="supplierId" > Supplier Name</label>
    <label><input type="checkbox" value="purchaseDate" checked> Import Date</label>
    <label><input type="checkbox" value="note" > Notes</label>
    <label><input type="checkbox" value="totalProducts" checked> Total Products</label>
    <label><input type="checkbox" value="totalPurchasePrice" checked> Total Cost</label>
  `
  columnsGroup.insertAdjacentHTML('beforeend', inputList)
} 

async function getPurchases(sortOptions, filterOptions, currentPage, itemsPerPage) {
  tbody.querySelectorAll('tr').forEach((tr, index) => {
    tr.querySelector('td:nth-child(1)').textContent = ''
    tr.querySelector('td:nth-child(1)').classList.add('loading')
  })

  const payload = {
    page: currentPage,
    itemsPerPage: itemsPerPage,
    sort: sortOptions,
    filter: filterOptions
  }

  if (searchInput.value.trim()) payload.searchQuery = searchInput.value.trim()

  const response = await fetch('/admin/all-purchases/data/purchases', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(payload)
  })
  if (!response.ok) throw new Error(`Response status: ${response.status}`)
  const {data, data_size, error} = await response.json()
  if (error) return pushNotification(error)

  dataSize.size = data_size

  document.querySelector('div.board-title').querySelector('p').textContent = 'Purchase Orders: ' + dataSize.size

  const selected = Array.from(document.querySelectorAll('.checkbox-group input:checked'))
                        .slice(1)   // remove the first checkbox
                        .map(cb => ({
                          value: cb.value,
                          name: cb.closest("label").innerText.trim()
                        }))

  thead.querySelectorAll('tr').forEach((tr, index) => {
    tr.remove()
  })

  // HEADER
  const trHead = document.createElement("tr")

  const headData = document.createElement('td')
  headData.textContent = 'NO'
  trHead.appendChild(headData)

  selected.forEach(col => {
    const td = document.createElement("td")
    td.textContent = col.name
    trHead.appendChild(td)
  })

  const headLink = document.createElement('td')
  headLink.textContent = 'Actions'
  trHead.appendChild(headLink)

  thead.appendChild(trHead)

  tbody.querySelectorAll('tr').forEach((tr, index) => {
    tr.remove()
  })

  data.forEach((item, index) => {
    const newTr = document.createElement('tr')

    const itemData = document.createElement('td')
    itemData.textContent = index + (currentPage - 1) * itemsPerPage + 1
    newTr.appendChild(itemData)

    selected.forEach(col => {
      const td = document.createElement("td")
      td.textContent = item[col.value]

      if (['purchaseDate', 'totalProducts', 'totalPurchasePrice'].includes(col.value) ) td.style.textAlign = 'right'
      if (['totalPurchasePrice'].includes(col.value)) td.textContent = formatNumber(item[col.value])
      if (['purchaseDate'].includes(col.value)) td.textContent = formatDate(item[col.value])

      newTr.appendChild(td)
    })

    const openButton = document.createElement('td')
    openButton.style.textAlign = 'center'
    openButton.innerHTML = `<button class="view-btn" id="${item._id}"><i class="fi fi-rr-eye"></i></button>`
    openButton.onclick = async function() {
      await openPurchaseDetail(item._id)
    }

    newTr.appendChild(openButton)
    tbody.appendChild(newTr)
  })
  
  pagination(getPurchases, sortOptions, filterOptions, currentPage, dataSize.size)
}

changeColumns.onclick = function() {
  const columnLists = document.querySelector('div.checkbox-group')
  columnLists.style.display === 'none' ? columnLists.style.display = 'block' : columnLists.style.display = 'none'
}

// DETAIL MODAL
const detailModal       = document.querySelector('#detail-modal')
const detailCloseBtn    = detailModal.querySelector('.close-modal')
const detailUpdateBtn   = detailModal.querySelector('button[type="submit"]')
let currentPurchaseInfo = null  // Store current customer info for comparison

detailCloseBtn.onclick = () => detailModal.classList.remove('show')
detailModal.onclick = (e) => {
  if (e.target === detailModal) detailModal.classList.remove('show')
}

async function openPurchaseDetail(purchaseId) {
  try {
    detailModal.classList.add('show')
    
    const response = await fetch('/admin/all-purchases/data/purchase', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({id: purchaseId})
  })
  if (!response.ok) throw new Error(`Response status: ${response.status}`)
  const {error, purchaseInfo, supplierInfo} = await response.json()
  if (error) return pushNotification('Có lỗi xảy ra')

  document.title = 'Purchase: ' + supplierInfo.name

  document.querySelector('input#id').value       = purchaseInfo._id
  document.querySelector('input#date').value     = formatDate(purchaseInfo.purchaseDate) 
  document.querySelector('input#supplier').value = supplierInfo.name
  document.querySelector('input#phone').value    = supplierInfo.phone
  document.querySelector('input#address').value  = supplierInfo.address
  document.querySelector('input#note').value     = purchaseInfo.note
  document.querySelector('input#total').value    = formatNumber(purchaseInfo.totalPurchasePrice)

  purchaseInfo.products.forEach((product) => {
    const tr = document.createElement('tr')
    tr.innerHTML = `
      <td></td>
      <td style="
        display: flex; 
        justify-content: start;
        align-items: center;
        gap: 5px"
      >
        <img src="${product.image}" alt="${product.name}" loading="lazy">
        ${product.name}
      </td>
      <td>${product.quantity}</td>
      <td>${formatNumber(product.price)}</td>
      <td><button class="view-product-btn" data-id="${product.id}"><i class="fi fi-rr-eye"></i></button></td>
    `
    document.querySelector('table#table-2').querySelector('tbody').appendChild(tr)
  })

  return

  } catch (error) {
    console.error('Error opening customer detail:', error)
    pushNotification('An error occurred')
    detailModal.classList.remove('show')
  }
}

// CREATE MODAL
const createModal     = document.querySelector('#create-modal')
const createBtn       = document.querySelector('.create-btn')
const createCloseBtn  = createModal.querySelector('.close-modal')
const createSubmitBtn = createModal.querySelector('button[type="submit"]')

createBtn.onclick = () => createModal.classList.add('show')
createCloseBtn.onclick  = () => createModal.classList.remove('show')
createModal.onclick = (e) => {
  if (e.target === createModal) createModal.classList.remove('show')
}

const input              = createModal.querySelector('input[type="text"][id="product-search"]')
const modalTbody         = createModal.querySelector('tbody')
const modalTfoot         = createModal.querySelector('tfoot')
const submitButton       = createModal.querySelector('button[type="submit"]')
const productId          = []
const productName        = []
const productImg         = []
const productQuantity    = []
const productPrice       = []
const totalPurchasePrice = { value: 0 }

function checkIsAddedProduct(id) {
  return productId.some((element) => element === id)
}

function updateProductTotalPrice() {
  modalTbody.querySelectorAll('tr').forEach((tr) => {
    const input  = tr.querySelector('input#productQuantity')
    const remove = tr.querySelector('td:last-child')
    const id     = tr.querySelector('input#productId').value

    input.addEventListener('input', function() {
      const price = deFormatNumber(tr.querySelector('td:nth-child(4)').innerText)
      const qty = input.value
      
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
  modalTbody.querySelectorAll('td:nth-child(6)').forEach((td) => {
    total += deFormatNumber(td.innerText)
  })
  modalTfoot.querySelector('td:nth-child(5)').innerText = formatNumber(total)
  totalPurchasePrice.value = total
  console.log(totalPurchasePrice.value)
}

async function getSuppliers() {
  const response = await fetch('/admin/all-purchases/data/suppliers', {
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
    document.querySelector('select[name="supplierId"]').appendChild(option) 
  })

  return
}

async function getProducts(query) {
  document.querySelector('div.products-match').querySelectorAll('div').forEach(element => element.remove())

  if (query === '') return

  const response = await fetch('/admin/all-purchases/data/products', {
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
      <p style="width: 10%; text-align:right" id="product-price">${formatNumber(element.purchasePrice)}</p>
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
        <td style="text-align: right;">${formatNumber(element.purchasePrice)}</td>
        <td><input type="number" id="productQuantity" min="1" value="1" style="max-width: 50px; text-align: center;"></td>
        <td style="text-align: right;">${formatNumber(element.purchasePrice)}</td>
        <td>x</td>
      `

      modalTbody.appendChild(newRow)

      updateProductTotalPrice()

      updatePurchaseTotalPrice()
    })

    document.querySelector('div.products-match').appendChild(div)
  })

  return
}

async function createPurchase() {
  try {
    const purchaseDate        = document.querySelector('input#purchaseDate').value
    const supplierId          = document.querySelector('select#supplierId').value
    const note                = document.querySelector('input#note').value
  
    if (
      !purchaseDate       || 
      !supplierId         || 
      !note               || 
      !productId          || 
      !productQuantity    || 
      !totalPurchasePrice
    ) {
      pushNotification("Hãy điền đầy đủ các thông tin!")
      return
    }
  
    const response = await fetch('/admin/all-purchases/purchase/created', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        purchaseDate      : purchaseDate,
        supplierId        : supplierId,
        note              : note,
        productId         : productId,
        productName       : productName,
        productImg        : productImg,
        productQuantity   : productQuantity,
        productPrice      : productPrice,
        totalPurchasePrice: totalPurchasePrice.value
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
  createPurchase()
}

// Product Detail Modal
const productDetailModal = document.querySelector('div.product-details-container')

productDetailModal?.addEventListener('click', e => {
  if (e.target === productDetailModal || e.target.classList.contains('close-modal')) {
    productDetailModal.classList.remove('show')
  }
})

async function openProductDetail(productId) {
  try {
    productDetailModal.classList.add('show')

    const response = await fetch('/admin/all-products/data/product', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: productId })
    })

    if (!response.ok) throw new Error(`Response status: ${response.status}`)
    const { error, productInfo, brands, productStatuses } = await response.json()
    if (error) {
      pushNotification('An error occurred')
      detailModal.classList.remove('show')
      return
    }

    document.title = productInfo.name || 'Product Detail'

    // Fill form
    productDetailModal.querySelector('input#id').value = productInfo._id
    productDetailModal.querySelector('select#categories').value = productInfo.categories || ''
    productDetailModal.querySelector('select#subcategories').value = productInfo.subcategories || ''
    productDetailModal.querySelector('input#name').value = productInfo.name || ''
    productDetailModal.querySelector('input#oldPrice').value = formatNumber(productInfo.oldPrice)
    productDetailModal.querySelector('input#price').value = formatNumber(productInfo.price)
    productDetailModal.querySelector('input#purchasePrice').value = formatNumber(productInfo.purchasePrice || 0)
    productDetailModal.querySelector('input#description').value = productInfo.description || ''
    productDetailModal.querySelector('input#details').value = productInfo.details || ''
    productDetailModal.querySelector('input#guide').value = productInfo.guide || ''
    productDetailModal.querySelector('input#quantity').value = productInfo.quantity || 0
    productDetailModal.querySelector('input#rate').value = formatRate(productInfo.rate) + '/5'
    productDetailModal.querySelector('input#saleNumber').value = productInfo.saleNumber || 0
    productDetailModal.querySelector('input#rateNumber').value = productInfo.rateNumber || 0
    productDetailModal.querySelector('img#image').src = productInfo.img?.path || '/images/default-product.png'

    // Brand
    const brandSelect = productDetailModal.querySelector('select#brand')
    brandSelect.innerHTML = ''
    brands.forEach(b => {
      const opt = document.createElement('option')
      opt.value = b.name
      opt.textContent = b.name
      if (b.name === productInfo.brand) opt.selected = true
      brandSelect.appendChild(opt)
    })

    // Status
    const statusSelect = productDetailModal.querySelector('select#status')
    statusSelect.innerHTML = ''
    productStatuses.forEach(s => {
      const opt = document.createElement('option')
      opt.value = s.code
      opt.textContent = s.name
      if (s.code === productInfo.status) opt.selected = true
      statusSelect.appendChild(opt)
    })

    // Format số khi nhập
    formatInputNumber(productDetailModal.querySelector('input#purchasePrice'))
    formatInputNumber(productDetailModal.querySelector('input#oldPrice'))
    formatInputNumber(productDetailModal.querySelector('input#price'))
  } catch (err) {
    console.error('Error opening product detail:', err)
    pushNotification('An error occurred')
    productDetailModal.classList.remove('show')
  }
}

// === HOẶC TỐT HƠN: Dùng event delegation (chỉ cần thêm 1 lần) ===
detailModal.querySelector('table#table-2 tbody').addEventListener('click', e => {
  if (e.target.classList.contains('view-product-btn')) {
    const productId = e.target.dataset.id
    openProductDetail(productId)
  }
})


window.addEventListener('DOMContentLoaded', async function loadData() {
  try {
    generateColumns()
    await getPurchases(sortOptions, filterOptions, currentPage.page, 10)
    await sortAndFilter(getPurchases, sortOptions, filterOptions, currentPage.page)
    await exportJs('PURCHASE ORDER LIST REPORT')
    getSuppliers()
  } catch (error) {
    console.error('Error loading data:', error)
    pushNotification(error)
  }
})