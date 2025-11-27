importLinkCss('/css/admin/all/suppliers.css')

// MAIN TABLE
const thead         = document.querySelector('table thead')
const tbody         = document.querySelector('table tbody')
const changeColumns = document.querySelector('i.fi.fi-rr-objects-column')
const sortOptions   = {}
const filterOptions = {}
const currentPage   = { page: 1 }
const dataSize      = { size: 0 }
const searchInput   = document.querySelector('input#search-input')

function generateColumns() {
  const columnsGroup = document.querySelector('div.checkbox-group')
  const inputList = `
    <label><input type="checkbox" value="_id" checked> Supplier Code</label>
    <label><input type="checkbox" value="name" checked> Supplier Name</label>
    <label><input type="checkbox" value="phone"> Phone</label>
    <label><input type="checkbox" value="email"> Email</label>
    <label><input type="checkbox" value="address" checked> Address</label>
    <label><input type="checkbox" value="quantity" checked> Total Items</label>
    <label><input type="checkbox" value="totalCost" checked> Total Spent</label>
  `
  columnsGroup.insertAdjacentHTML('beforeend', inputList)
}

async function getSuppliers(sortOptions, filterOptions, currentPage, itemsPerPage) {
  // Loading state
  tbody.querySelectorAll('tr').forEach(tr => {
    const firstTd = tr.querySelector('td')
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

  const response = await fetch('/admin/all-suppliers/data/suppliers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })

  if (!response.ok) throw new Error(`Response status: ${response.status}`)
  const { data, data_size, error } = await response.json()
  if (error) return pushNotification(error)

  dataSize.size = data_size
  document.querySelector('div.board-title p').textContent = `Suppliers: ${dataSize.size}`

  const selectedCols = Array.from(document.querySelectorAll('.checkbox-group input:checked'))
    .map(cb => ({ value: cb.value, label: cb.closest('label').innerText.trim() }))

  // Rebuild header
  thead.innerHTML = ''
  const headerRow = document.createElement('tr')
  headerRow.innerHTML = `<td>No</td>`
  selectedCols.forEach(col => headerRow.insertAdjacentHTML('beforeend', `<td>${col.label}</td>`))
  headerRow.insertAdjacentHTML('beforeend', `<td>Actions</td>`)
  thead.appendChild(headerRow)

  // Rebuild body
  tbody.innerHTML = ''
  data.forEach((supplier, idx) => {
    const tr = document.createElement('tr')
    const no = idx + + (currentPage - 1) * itemsPerPage + 1

    tr.innerHTML = `<td>${no}</td>`

    selectedCols.forEach(col => {
      const td = document.createElement('td')
      let value = supplier[col.value]

      if (col.value === 'totalCost') {
        td.textContent = formatNumber(value)
        td.style.textAlign = 'right'
      }
      else if (col.value === 'quantity') {
        td.textContent = value ?? 0
        td.style.textAlign = 'right'
      }
      else {
        td.textContent = value ?? ''
      }
      tr.appendChild(td)
    })

    // Action button
    const actionTd = document.createElement('td')
    actionTd.style.textAlign = 'center'
    actionTd.innerHTML = `<button class="view-btn"><i class="fi fi-rr-eye"></i></button>`
    actionTd.querySelector('.view-btn').onclick = () => openSupplierDetail(supplier._id)
    tr.appendChild(actionTd)

    tbody.appendChild(tr)
  })

  pagination(getSuppliers, sortOptions, filterOptions, currentPage, dataSize.size)
}

// Toggle column selector
changeColumns.onclick = () => {
  const panel = document.querySelector('div.checkbox-group')
  panel.style.display = panel.style.display === 'none' ? 'block' : 'none'
}

// DETAIL MODAL
const detailModal     = document.querySelector('#detail-modal')
const closeBtn        = detailModal.querySelector('.close-modal')
const updateBtn       = detailModal.querySelector('button[type="submit"]')
let currentSupplier   = null

closeBtn.onclick = () => detailModal.classList.remove('show')
detailModal.onclick = e => { if (e.target === detailModal) detailModal.classList.remove('show') }

async function openSupplierDetail(supplierId) {
  try {
    detailModal.classList.add('show')

    const res = await fetch('/admin/all-suppliers/data/supplier', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: supplierId })
    })

    if (!res.ok) throw new Error(`Status: ${res.status}`)
    const { error, supplierInfo, purchaseInfo } = await res.json()
    if (error) throw new Error(error)

    document.title = `${supplierInfo.name} - Supplier Detail`

    // Fill supplier info
    detailModal.querySelector('input#id').value         = supplierInfo._id
    detailModal.querySelector('input#name').value       = supplierInfo.name || ''
    detailModal.querySelector('input#email').value      = supplierInfo.email || ''
    detailModal.querySelector('input#phone').value      = supplierInfo.phone || ''
    detailModal.querySelector('input#address').value    = supplierInfo.address || ''
    detailModal.querySelector('input#quantity').value   = supplierInfo.quantity || 0
    detailModal.querySelector('input#totalCost').value  = formatNumber(supplierInfo.totalCost || 0)

    // Fill purchase history
    const purchaseTbody = detailModal.querySelector('table#table-2 tbody')
    purchaseTbody.innerHTML = ''

    purchaseInfo.forEach((purchase, index) => {
      const tr = document.createElement('tr')
      tr.innerHTML = `
        <td>${index + 1}</td>
        <td>${formatNumber(purchase.totalPurchasePrice)}</td>
        <td>${formatDate(purchase.purchaseDate)}</td>
        <td><a href="/admin/all-purchases/purchase/${purchase._id}">View</a></td>
      `
      purchaseTbody.appendChild(tr)
    })

    // Save current state for update comparison
    currentSupplier = {
      _id:     supplierInfo._id,
      name:    supplierInfo.name,
      phone:   supplierInfo.phone,
      address: supplierInfo.address
    }

  } catch (err) {
    console.error('Error loading supplier:', err)
    pushNotification('Failed to load supplier details')
    detailModal.classList.remove('show')
  }
}

async function updateSupplier() {
  if (!currentSupplier) return

  const name    = detailModal.querySelector('input#name').value.trim()
  const phone   = detailModal.querySelector('input#phone').value.trim()
  const address = detailModal.querySelector('input#address').value.trim()

  if (
    name    === currentSupplier.name &&
    phone   === currentSupplier.phone &&
    address === currentSupplier.address
  ) {
    return pushNotification('Please update the information')
  }

  updateBtn.classList.add('loading')

  const res = await fetch('/admin/all-suppliers/supplier/updated', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: currentSupplier._id, name, phone, address })
  })

  updateBtn.classList.remove('loading')

  if (!res.ok) return pushNotification('Update failed')

  const { error, message } = await res.json()
  if (error) return pushNotification(error)

  pushNotification(message)
  detailModal.classList.remove('show')
  await getSuppliers(sortOptions, filterOptions, currentPage.page, 10)
}

updateBtn.onclick = updateSupplier

// CREATE MODAL
const createModal     = document.querySelector('#create-modal')
const createBtn       = document.querySelector('.create-btn')
const createCloseBtn  = createModal?.querySelector('.close-modal')
const createSubmitBtn = createModal?.querySelector('button[type="submit"]')

createBtn.onclick = () => createModal.classList.add('show')
createCloseBtn.onclick = () => createModal.classList.remove('show')
createModal.onclick = e => { if (e.target === createModal) createModal.classList.remove('show') }

async function createSupplier() {
  const name    = createModal.querySelector('input#name')?.value.trim()
  const email   = createModal.querySelector('input#email')?.value.trim()
  const phone   = createModal.querySelector('input#phone')?.value.trim()
  const address = createModal.querySelector('input#address')?.value.trim()

  if (!name || !email || !phone || !address) {
    return pushNotification('Please fill in all required fields!')
  }

  const res = await fetch('/admin/all-suppliers/supplier/created', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, phone, address })
  })

  if (!res.ok) throw new Error(`Status: ${res.status}`)
  const { error, message } = await res.json()
  if (error) return pushNotification(error)

  pushNotification(message)
  createModal.classList.remove('show')
  await getSuppliers(sortOptions, filterOptions, currentPage.page, 10)
}

createSubmitBtn.onclick = createSupplier

// INIT
window.addEventListener('DOMContentLoaded', async () => {
  try {
    generateColumns()
    await getSuppliers(sortOptions, filterOptions, currentPage.page, 10)
    await sortAndFilter(getSuppliers, sortOptions, filterOptions, currentPage.page)
    await exportJs('SUPPLIER LIST REPORT')
  } catch (err) {
    console.error(err)
    pushNotification('Failed to load suppliers')
  }
})