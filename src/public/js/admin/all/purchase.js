importLinkCss('/css/admin/all/purchases.css')

// ALL
const thead         = document.querySelector('table').querySelector('thead')
const tbody         = document.querySelector('table').querySelector('tbody')
const changeColumns = document.querySelector('i.fi.fi-rr-objects-column')
const sortOptions   = {}
const filterOptions = {}
const currentPage   = { page: 1 }
const dataSize      = { size: 0 }

function generateColumns() {
  const columnsGroup = document.querySelector('div.checkbox-group')
  const inputList = `
    <label><input type="checkbox" value="_id" checked> Order Code</label>
    <label><input type="checkbox" value="supplierId" > Supplier Name</label>
    <label><input type="checkbox" value="purchaseDate" checked> Import Date</label>
    <label><input type="checkbox" value="note" > Notes</label>
    <label><input type="checkbox" value="totalProducts" checked> Total Products</label>
    <label><input type="checkbox" value="totalPurchasePrice"> Total Cost</label>
  `
  columnsGroup.insertAdjacentHTML('beforeend', inputList)
} 

async function getPurchases(sortOptions, filterOptions, currentPage, itemsPerPage) {
  tbody.querySelectorAll('tr').forEach((tr, index) => {
    tr.querySelector('td:nth-child(1)').textContent = ''
    tr.querySelector('td:nth-child(1)').classList.add('loading')
  })

  const response = await fetch('/admin/all-purchases/data/purchases', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      sort  : sortOptions, 
      filter: filterOptions, 
      page  : currentPage,
      itemsPerPage: itemsPerPage
    })
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
  headLink.textContent = 'Details'
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
      if (['totalProducts', 'totalPurchasePrice'].includes(col.value)) td.textContent = formatNumber(item[col.value])
      if (['purchaseDate'].includes(col.value)) td.textContent = formatDate(item[col.value])

      newTr.appendChild(td)
    })

    const openButton = document.createElement('td')
    openButton.style.textAlign = 'center'
    openButton.innerHTML = `<button id="${item._id}">View</button>`
    openButton.onclick = async function() {
      await openCustomerDetail(item._id)
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
let currentCustomerInfo = null  // Store current customer info for comparison

detailCloseBtn.onclick = () => detailModal.classList.remove('show')
detailModal.onclick = (e) => {
  if (e.target === detailModal) detailModal.classList.remove('show')
}

async function openCustomerDetail(customerId) {
  try {
    detailModal.classList.add('show')
    
    // Fetch customer data
    const response = await fetch('/admin/all-customers/data/customer', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({id: customerId})
    })
    
    if (!response.ok) throw new Error(`Response status: ${response.status}`)
    const {error, customerInfo, memberInfo, orderInfo} = await response.json()
    if (error) {
      pushNotification('An error occurred')
      detailModal.classList.remove('show')
      return
    }

    document.title = customerInfo.name

    detailModal.querySelector('input[name="id"]').value = customerInfo._id || ''
    detailModal.querySelector('input[name="name"]').value = customerInfo.name || ''
    detailModal.querySelector('input[name="email"]').value = customerInfo.email || ''
    detailModal.querySelector('input[name="phone"]').value = customerInfo.phone || ''
    detailModal.querySelector('input[name="address"]').value = customerInfo.address || ''
    detailModal.querySelector('input[name="dob"]').value = customerInfo.dob === null ? null : customerInfo.dob.split('T')[0]
    
    detailModal.querySelectorAll('input[name="gender"]').forEach((input) => {
      if (input.value === customerInfo.gender) input.checked = true
    })
    
    detailModal.querySelector('input[name="quantity"]').value = customerInfo.quantity || ''
    detailModal.querySelector('input[name="revenue"]').value = formatNumber(customerInfo.revenue) || ''
    detailModal.querySelector('input[name="member"]').value = memberInfo.name || ''

    const tbody = detailModal.querySelector('table#table-2').querySelector('tbody')
    tbody.innerHTML = ''
    
    orderInfo.forEach((order, index) => {
      const tr = document.createElement('tr')
      tr.innerHTML = `
        <td>${index + 1}</td>
        <td>${formatNumber(order.totalOrderPrice)}</td>
        <td>${order.paymentMethod.name}</td>
        <td>${order.orderStatus.name}</td>
        <td><a href="/admin/all-orders/order/${order._id}">View</a></td>
      `
      tbody.appendChild(tr)
    })

    // Store customer info for update comparison
    currentCustomerInfo = {
      _id: customerInfo._id,
      name: customerInfo.name,
      phone: customerInfo.phone,
      address: customerInfo.address,
      gender: customerInfo.gender,
      dob: customerInfo.dob === null ? null : customerInfo.dob.split('T')[0]
    }

    return

  } catch (error) {
    console.error('Error opening customer detail:', error)
    pushNotification('An error occurred')
    detailModal.classList.remove('show')
  }
}

// UPDATE MODAL
async function updateCustomer() {
  const name    = detailModal.querySelector('input[name="name"]').value
  const phone   = detailModal.querySelector('input[name="phone"]').value
  const address = detailModal.querySelector('input[name="address"]').value
  const dob     = detailModal.querySelector('input[name="dob"]').value
  const gender  = detailModal.querySelector('input[name="gender"]:checked').value

  // Check if any field has changed
  if (
    name    === currentCustomerInfo.name    &&
    phone   === currentCustomerInfo.phone   &&
    address === currentCustomerInfo.address &&
    gender  === currentCustomerInfo.gender  &&
    dob     === currentCustomerInfo.dob
  ) return pushNotification('Please update the information')

  detailUpdateBtn.classList.add('loading')
  const response = await fetch('/admin/all-customers/customer/updated', {
    method: 'PUT',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      id      : currentCustomerInfo._id,
      name    : name,
      phone   : phone,
      address : address,
      dob     : dob,
      gender  : gender
    })
  })
  if (!response.ok) throw new Error(`Response status: ${response.status}`)
  const {error, message} = await response.json()

  if (error) {
    detailUpdateBtn.classList.remove('loading')
    return pushNotification(error)
  }  

  pushNotification(message)
  detailUpdateBtn.classList.remove('loading')
  detailModal.classList.remove('show')
  await getCustomers(sortOptions, filterOptions, currentPage.page, 10)
}

detailUpdateBtn.onclick = function() {
  updateCustomer()
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

async function createCustomer() {
  try {
    const name     = createModal.querySelector('input#name').value
    const email    = createModal.querySelector('input#email').value
    const phone    = createModal.querySelector('input#phone').value
    const address  = createModal.querySelector('input#address').value
    const password = createModal.querySelector('input#password').value

    if (
      !name     || 
      !email    || 
      !phone    || 
      !address  || 
      !password
    ) {
      return pushNotification("Please fill in all information!")
    }

    const response = await fetch('/admin/all-customers/customer/created', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        name    : name,
        email   : email,
        phone   : phone,
        address : address,
        password: password,
      })
    })
    if (!response.ok) throw new Error(`Response status: ${response.status}`)
    const {error, message} = await response.json()
    if (error) return pushNotification(error)
    pushNotification(message)
    createModal.classList.remove('show')
    await getCustomers(sortOptions, filterOptions, currentPage.page, 10)
  } catch (error) {
    console.error('Error creating customer:', error)
    pushNotification("An error occurred.")
  }
}

createSubmitBtn.onclick = async function() {
  await createCustomer()
}

window.addEventListener('DOMContentLoaded', async function loadData() {
  try {
    generateColumns()
    await getPurchases(sortOptions, filterOptions, currentPage.page, 10)
    await sortAndFilter(getPurchases, sortOptions, filterOptions, currentPage.page)
    await exportJs('PURCHASE ORDER LIST REPORT')
  } catch (error) {
    console.error('Error loading data:', error)
    pushNotification(error)
  }
})