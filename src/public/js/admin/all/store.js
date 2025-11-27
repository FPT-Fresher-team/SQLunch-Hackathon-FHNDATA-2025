importLinkCss('/css/admin/all/stores.css')

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
    <label><input type="checkbox" value="_id" checked> Store Code</label>
    <label><input type="checkbox" value="name" checked> Store Name</label>
    <label><input type="checkbox" value="address" checked> Address</label>
    <label><input type="checkbox" value="details"> Details</label>
    <label><input type="checkbox" value="revenue" checked> Total Revenue</label>
  `
  columnsGroup.insertAdjacentHTML('beforeend', inputList)
}

async function getStores(sortOptions, filterOptions, currentPage, itemsPerPage) {
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

  const response = await fetch('/admin/all-stores/data/stores', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })

  if (!response.ok) throw new Error(`Response status: ${response.status}`)
  const { data, data_size, error } = await response.json()
  if (error) return pushNotification(error)

  dataSize.size = data_size
  document.querySelector('div.board-title p').textContent = 'Stores: ' + dataSize.size

  const selected = Array.from(document.querySelectorAll('.checkbox-group input:checked'))
    .map(cb => ({ value: cb.value, name: cb.closest('label').innerText.trim() }))

  // Rebuild THEAD
  thead.querySelectorAll('tr').forEach(tr => tr.remove())
  const trHead = document.createElement('tr')
  const thNo = document.createElement('td')
  thNo.textContent = 'No'
  trHead.appendChild(thNo)
  selected.forEach(col => {
    const th = document.createElement('td')
    th.textContent = col.name
    trHead.appendChild(th)
  })
  const thAction = document.createElement('td')
  thAction.textContent = 'Details'
  trHead.appendChild(thAction)
  thead.appendChild(trHead)

  // Rebuild TBODY
  tbody.querySelectorAll('tr').forEach(tr => tr.remove())

  data.forEach((item, index) => {
    const rowIndex = index + (currentPage - 1) * itemsPerPage + 1
    const tr = document.createElement('tr')

    const tdNo = document.createElement('td')
    tdNo.textContent = rowIndex
    tr.appendChild(tdNo)

    selected.forEach(col => {
      const td = document.createElement('td')
      let value = item[col.value] ?? ''

      if (col.value === 'revenue') {
        td.textContent = formatNumber(value)
        td.style.textAlign = 'right'
      } else {
        td.textContent = value
      }

      tr.appendChild(td)
    })

    const tdAction = document.createElement('td')
    tdAction.style.textAlign = 'center'
    tdAction.innerHTML = `<button id="${item._id}">View</button>`
    tdAction.onclick = () => openStoreDetail(item._id)
    tr.appendChild(tdAction)

    tbody.appendChild(tr)
  })

  pagination(getStores, sortOptions, filterOptions, currentPage, dataSize.size)
}

changeColumns.onclick = function () {
  const columnLists = document.querySelector('div.checkbox-group')
  columnLists.style.display = columnLists.style.display === 'none' ? 'block' : 'none'
}

// DETAIL MODAL
const detailModal       = document.querySelector('#detail-modal')
const detailCloseBtn    = detailModal.querySelector('.close-modal')
const detailUpdateBtn   = detailModal.querySelector('button[type="submit"]')
let currentStoreInfo    = null

detailCloseBtn.onclick = () => detailModal.classList.remove('show')
detailModal.onclick = e => { if (e.target === detailModal) detailModal.classList.remove('show') }

async function openStoreDetail(storeId) {
  try {
    detailModal.classList.add('show')

    const response = await fetch('/admin/all-stores/data/store', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: storeId })
    })

    if (!response.ok) throw new Error(`Response status: ${response.status}`)
    const { error, storeInfo } = await response.json()
    if (error) {
      pushNotification('An error occurred')
      detailModal.classList.remove('show')
      return
    }

    document.title = storeInfo.name || 'Store Detail'

    detailModal.querySelector('input#id').value      = storeInfo._id || ''
    detailModal.querySelector('input#name').value    = storeInfo.name || ''
    detailModal.querySelector('input#address').value = storeInfo.address || ''
    detailModal.querySelector('input#details').value = storeInfo.details || ''
    detailModal.querySelector('input#total').value   = formatNumber(storeInfo.revenue) || '0'

    // Lưu lại để so sánh khi update
    currentStoreInfo = {
      _id: storeInfo._id,
      name: storeInfo.name,
      address: storeInfo.address,
      details: storeInfo.details
    }

  } catch (err) {
    console.error('Error opening store detail:', err)
    pushNotification('An error occurred')
    detailModal.classList.remove('show')
  }
}

async function updateStore() {
  const name    = detailModal.querySelector('input#name').value.trim()
  const address = detailModal.querySelector('input#address').value.trim()
  const details = detailModal.querySelector('input#details').value.trim()

  if (
    name    === currentStoreInfo.name &&
    address === currentStoreInfo.address &&
    details === currentStoreInfo.details
  ) {
    return pushNotification('Please update the information')
  }

  detailUpdateBtn.classList.add('loading')

  const response = await fetch('/admin/all-stores/store/updated', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: currentStoreInfo._id,
      name,
      address,
      details
    })
  })

  detailUpdateBtn.classList.remove('loading')

  if (!response.ok) {
    pushNotification('Update failed')
    return
  }

  const { error, message } = await response.json()
  if (error) return pushNotification(error)

  pushNotification(message)
  detailModal.classList.remove('show')
  await getStores(sortOptions, filterOptions, currentPage.page, 10)
}

detailUpdateBtn.onclick = () => updateStore()

// CREATE MODAL
const createModal     = document.querySelector('#create-modal')
const createBtn       = document.querySelector('.create-btn')
const createCloseBtn  = createModal?.querySelector('.close-modal')
const createSubmitBtn = createModal?.querySelector('button[type="submit"]')

if (createBtn) createBtn.onclick = () => createModal.classList.add('show')
if (createCloseBtn) createCloseBtn.onclick = () => createModal.classList.remove('show')
createModal?.addEventListener('click', e => { if (e.target === createModal) createModal.classList.remove('show') })

async function createStore() {
  const name    = createModal.querySelector('input#name')?.value.trim()
  const address = createModal.querySelector('input#address')?.value.trim()
  const details = createModal.querySelector('input#details')?.value.trim()

  if (!name || !address || !details) {
    return pushNotification('Please fill in all information!')
  }

  const response = await fetch('/admin/all-stores/store/created', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, address, details })
  })

  if (!response.ok) throw new Error(`Response status: ${response.status}`)
  const { error, message } = await response.json()
  if (error) return pushNotification(error)

  pushNotification(message)
  createModal.classList.remove('show')
  await getStores(sortOptions, filterOptions, currentPage.page, 10)
}

if (createSubmitBtn) createSubmitBtn.onclick = () => createStore()

// DOM Loaded
window.addEventListener('DOMContentLoaded', async function loadData() {
  try {
    generateColumns()
    await getStores(sortOptions, filterOptions, currentPage.page, 10)
    await sortAndFilter(getStores, sortOptions, filterOptions, currentPage.page)
    await exportJs('BÁO CÁO DANH SÁCH CỬA HÀNG')
  } catch (err) {
    console.error('Error loading data:', err)
    pushNotification('An error occurred while loading data')
  }
})