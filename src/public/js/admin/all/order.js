importLinkCss('/css/admin/all/orders.css')

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
    <label><input type="checkbox" value="_id" checked> Order ID</label>
    <label><input type="checkbox" value="customerInfo" checked> Customer Name</label>
    <label><input type="checkbox" value="totalOrderPrice" checked> Total Before Discount</label>
    <label><input type="checkbox" value="totalNewOrderPrice" checked> Total Amount</label>
    <label><input type="checkbox" value="paymentMethod" checked> Payment Method</label>
    <label><input type="checkbox" value="status" checked> Order Status</label>
    <label><input type="checkbox" value="isRated"> Review Status</label>
    <label><input type="checkbox" value="isPaid"> Payment Status</label>
    <label><input type="checkbox" value="voucherCode"> Voucher Code</label>
    <label><input type="checkbox" value="createdAt" checked> Order Date</label>
  `
  columnsGroup.insertAdjacentHTML('beforeend', inputList)
}

async function getFilter() {
  const response = await fetch('/admin/all-orders/data/filter', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  })
  if (!response.ok) throw new Error(`Response status: ${response.status}`)
  const {customers, orderStatus, paymentMethod, error } = await response.json()
  if (error) return pushNotification(error)

  customers.forEach(c => {
    const opt = document.createElement('option')
    opt.value = c._id
    opt.textContent = `${c.name}: ${c.phone}`
    document.querySelector('select#userId')?.appendChild(opt)
  })

  orderStatus.forEach(s => {
    const opt = document.createElement('option')
    opt.value = s.code
    opt.textContent = s.name
    document.querySelector('select#status')?.appendChild(opt)
  })

  paymentMethod.forEach(p => {
    const opt = document.createElement('option')
    opt.value = p.code
    opt.textContent = p.name
    document.querySelectorAll('select#paymentMethod').forEach(select => select.appendChild(opt.cloneNode(true)))
  })
}

async function getOrders(sortOptions, filterOptions, currentPage, itemsPerPage) {
  tbody.querySelectorAll('tr').forEach(tr => {
    const firstTd = tr.querySelector('td:nth-child(1)')
    if (firstTd) {
      firstTd.textContent = ''
      firstTd.classList.add('loading')
    }
  })

  const payload = {
    page: currentPage,
    itemsPerPage: itemsPerPage,
    sort: sortOptions,
    filter: filterOptions
  }

  if (searchInput.value.trim()) payload.searchQuery = searchInput.value.trim()

  const response = await fetch('/admin/all-orders/data/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })

  if (!response.ok) throw new Error(`Response status: ${response.status}`)
  const { data, data_size, error } = await response.json()
  if (error) return pushNotification(error)

  dataSize.size = data_size
  document.querySelector('div.board-title p').textContent = 'Orders: ' + dataSize.size

  const selected = Array.from(document.querySelectorAll('.checkbox-group input[type="checkbox"]'))
    .slice(1)  // Skip the very first checkbox (the "Select All")
    .filter(cb => cb.checked)
    .map(cb => ({
      value: cb.value,
      name: cb.closest("label").innerText.trim()
    }));

  thead.querySelectorAll('tr').forEach((tr, index) => {
    tr.remove()
  })

  // HEADER
  const trHead = document.createElement("tr")

  const headData = document.createElement('td')
  headData.textContent = 'No'
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

  // BODY
  tbody.querySelectorAll('tr').forEach((tr, index) => {
    tr.remove()
  })

  data.forEach((item, index) => {
    const rowIndex = index + (currentPage - 1) * itemsPerPage + 1
    const tr = document.createElement('tr')

    const tdNo = document.createElement('td')
    tdNo.textContent = rowIndex
    tr.appendChild(tdNo)

    selected.forEach(col => {
      const td = document.createElement('td')
      let value = item[col.value]

      if (col.value === 'customerInfo') td.textContent = item.customerInfo?.name || 'Guest'
      else if (['totalOrderPrice', 'totalNewOrderPrice'].includes(col.value)) {
        td.textContent = formatNumber(value)
        td.style.textAlign = 'right'
      }
      else if (col.value === 'createdAt') {
        td.textContent = formatDate(value)
        td.style.textAlign = 'right'
      }
      else if (['isRated', 'isPaid'].includes(col.value)) {
        td.textContent = value
      }
      else if (col.value === 'paymentMethod') {
        td.textContent = item.paymentMethod?.name || value
      }
      else if (col.value === 'status') {
        td.textContent = item.orderStatus?.name || value
      }
      else td.textContent = value ?? ''

      tr.appendChild(td)
    })

    const tdAction = document.createElement('td')
    tdAction.style.textAlign = 'center'
    tdAction.innerHTML = `<button class="view-btn" id="${item._id}"><i class="fi fi-rr-eye"></i></button>`
    tdAction.onclick = () => openOrderDetail(item._id)
    tr.appendChild(tdAction)

    tbody.appendChild(tr)
  })

  pagination(getOrders, sortOptions, filterOptions, currentPage, dataSize.size)
}

changeColumns.onclick = function () {
  const columnLists = document.querySelector('div.checkbox-group')
  columnLists.style.display = columnLists.style.display === 'none' ? 'block' : 'none'
}

// DETAIL MODAL
const detailModal       = document.querySelector('#detail-modal')
const detailCloseBtn    = detailModal.querySelector('.close-modal')
const detailUpdateBtn   = detailModal.querySelector('button[type="submit"]')
let currentOrderInfo    = null

detailCloseBtn.onclick = () => detailModal.classList.remove('show')
detailModal.onclick = e => { if (e.target === detailModal) detailModal.classList.remove('show') }

async function openOrderDetail(orderId) {
  try {
    detailModal.classList.add('show')

    const response = await fetch('/admin/all-orders/data/order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: orderId })
    })

    if (!response.ok) throw new Error(`Response status: ${response.status}`)
    const { error, orderInfo, orderStatuses, paymentMethods, userRole } = await response.json()
    if (error) {
      pushNotification('An error occurred')
      detailModal.classList.remove('show')
      return
    }

    document.title = 'Order ' + (orderInfo.customerInfo?.name || 'Guest')

    // Fill thông tin cơ bản
    detailModal.querySelector('input#id').value           = orderInfo._id
    detailModal.querySelector('input#date').value         = formatDate(orderInfo.createdAt)
    detailModal.querySelector('input#name').value         = orderInfo.customerInfo?.name || 'Guest'
    detailModal.querySelector('input#phone').value        = orderInfo.customerInfo?.phone || ''
    detailModal.querySelector('input#address').value      = orderInfo.customerInfo?.address || ''
    detailModal.querySelector('input#note').value         = orderInfo.customerInfo?.note || ''

    if (orderInfo.customerInfo?.userId === 'guest') {
      detailModal.querySelector('a#customer-link').style.display = 'none'
    }

    // Trạng thái đơn hàng
    const statusSelect = detailModal.querySelector('select#status')
    statusSelect.innerHTML = ''
    orderStatuses.forEach(s => {
      const opt = document.createElement('option')
      opt.value = s.code
      opt.textContent = s.name
      opt.disabled = true
      if (s.code === orderInfo.status) opt.selected = true

      // Phân quyền chỉnh sửa
      if (userRole === 'employee' && s.code === 'preparing') opt.disabled = false
      if (userRole === 'merchandise' && s.code === 'out_for_delivery') opt.disabled = false
      if (['shipper'].includes(userRole) && ['delivering', 'delivered'].includes(s.code)) opt.disabled = false
      if (userRole === 'manager' && s.code === 'cancel') opt.disabled = false
      if (userRole === 'admin') opt.disabled = false

      statusSelect.appendChild(opt)
    })

    // Phương thức thanh toán
    const paymentSelect = detailModal.querySelector('select#paymentMethod')
    paymentSelect.innerHTML = ''
    paymentMethods.forEach(p => {
      const opt = document.createElement('option')
      opt.value = p.code
      opt.textContent = p.name
      opt.disabled = true
      if (p.code === orderInfo.paymentMethod) opt.selected = true
      paymentSelect.appendChild(opt)
    })

    // Tổng tiền
    detailModal.querySelector('input#total').value      = formatNumber(orderInfo.totalOrderPrice)
    detailModal.querySelector('input#new-total').value  = formatNumber(orderInfo.totalNewOrderPrice)
    detailModal.querySelector('input#isRated').value    = orderInfo.isRated ? 'Yes' : 'No'

    // Thanh toán
    const isPaidSelect = detailModal.querySelector('select#isPaid')
    isPaidSelect.value = orderInfo.isPaid ? 'true' : 'false'
    isPaidSelect.querySelectorAll('option').forEach(opt => opt.disabled = userRole !== 'accountant')

    // Ẩn nút cập nhật nếu đã hoàn tất hoặc hủy
    if (['done', 'cancel'].includes(orderInfo.status)) {
      statusSelect.disabled = paymentSelect.disabled = true
      detailUpdateBtn.style.display = 'none'
    } else {
      detailUpdateBtn.style.display = 'block'
    }

    // Danh sách sản phẩm
    const productTbody = detailModal.querySelector('table#table-2 tbody')
    productTbody.innerHTML = ''
    let i = 1
    orderInfo.products?.forEach(p => {
      const tr = document.createElement('tr')
      tr.innerHTML = `
        <td>${i++}</td>
        <td style="display: flex; align-items: center; gap: 8px;">
          <img src="${p.image}" alt="${p.name}" loading="lazy" style="width: 40px; height: 40px; object-fit: cover;">
          ${p.name}
        </td>
        <td style="text-align: center;">${p.quantity}</td>
        <td style="text-align: right;">${formatNumber(p.price)}</td>
        <td><button class="view-product-btn" data-id="${p.id}"><i class="fi fi-rr-eye"></i></button></td>
      `
      productTbody.appendChild(tr)
    })

    // Lưu để so sánh khi cập nhật
    currentOrderInfo = {
      _id: orderInfo._id,
      status: orderInfo.status,
      paymentMethod: orderInfo.paymentMethod,
      isPaid: orderInfo.isPaid
    }

  } catch (err) {
    console.error('Error opening order detail:', err)
    pushNotification('An error occurred')
    detailModal.classList.remove('show')
  }
}

async function updateOrder() {
  try {
    const status        = detailModal.querySelector('select#status').value
    const paymentMethod = detailModal.querySelector('select#paymentMethod').value
    const isPaid        = detailModal.querySelector('select#isPaid').value === 'true'
  
    if (
      status        === currentOrderInfo.status &&
      paymentMethod === currentOrderInfo.paymentMethod &&
      isPaid        === currentOrderInfo.isPaid
    ) {
      return pushNotification('Please update the information')
    }
  
    detailUpdateBtn.classList.add('loading')
    const response = await fetch('/admin/all-orders/order/updated', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: currentOrderInfo._id,
        status,
        paymentMethod,
        isPaid
      })
    })
  
    if (!response.ok) throw new Error('Updated Failed')
    const { error, message } = await response.json()
    if (error) throw new Error(error)
  
    pushNotification(message)
    detailModal.classList.remove('show')
    detailUpdateBtn.classList.remove('loading')
    await getOrders(sortOptions, filterOptions, currentPage.page, 10)
    
  } catch (error) {
    console.error('Error updating order:', error)
    pushNotification("Order update failed")
    detailUpdateBtn.classList.remove('loading')
  }
}

detailUpdateBtn.onclick = () => updateOrder()

// CREATE MODAL (có thể mở rộng sau)
const createModal     = document.querySelector('#create-modal')
const createBtn       = document.querySelector('.create-btn')
const createCloseBtn  = createModal?.querySelector('.close-modal')
const createSubmitBtn = createModal?.querySelector('button[type="submit"]')

if (createBtn) createBtn.onclick = () => createModal.classList.add('show')
if (createCloseBtn) createCloseBtn.onclick = () => createModal.classList.remove('show')
createModal?.addEventListener('click', e => { if (e.target === createModal) createModal.classList.remove('show') })

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
  
// DOM Loaded
window.addEventListener('DOMContentLoaded', async function loadData() {
  try {
    generateColumns()
    await getFilter()
    await getOrders(sortOptions, filterOptions, currentPage.page, 10)
    await sortAndFilter(getOrders, sortOptions, filterOptions, currentPage.page)
    await exportJs('ORDER LIST REPORT')
  } catch (err) {
    console.error('Error loading data:', err)
    pushNotification('An error occurred while loading data')
  }
})