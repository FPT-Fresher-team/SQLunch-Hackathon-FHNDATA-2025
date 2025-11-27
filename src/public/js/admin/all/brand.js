importLinkCss('/css/admin/all/brands.css')

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
    <label><input type="checkbox" value="_id" checked> Brand Code</label>
    <label><input type="checkbox" value="name" checked> Brand Name</label>
    <label><input type="checkbox" value="totalProduct" checked> Total Products</label>
    <label><input type="checkbox" value="totalRevenue" checked> Total Revenue</label>
  `
  columnsGroup.insertAdjacentHTML('beforeend', inputList)
}

async function getBrands(sortOptions, filterOptions, currentPage, itemsPerPage) {
  // Loading state
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

  const response = await fetch('/admin/all-brands/data/brands', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })

  if (!response.ok) throw new Error(`Response status: ${response.status}`)
  const { data, data_size, error } = await response.json()
  if (error) return pushNotification(error)

  dataSize.size = data_size
  document.querySelector('div.board-title p').textContent = 'Brands: ' + dataSize.size

  // Lấy các cột được chọn
  const selected = Array.from(document.querySelectorAll('.checkbox-group input:checked'))
    .map(cb => ({
      value: cb.value,
      name: cb.closest('label').innerText.trim()
    }))

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
  thAction.textContent = 'Actions'
  trHead.appendChild(thAction)
  thead.appendChild(trHead)

  // Rebuild TBODY
  tbody.querySelectorAll('tr').forEach(tr => tr.remove())

  data.forEach((item, index) => {
    const rowIndex = index + (currentPage - 1) * itemsPerPage + 1
    const tr = document.createElement('tr')

    // STT
    const tdNo = document.createElement('td')
    tdNo.textContent = rowIndex
    tr.appendChild(tdNo)

    // Các cột được chọn
    selected.forEach(col => {
      const td = document.createElement('td')

      if (col.value === 'name') {
        td.innerHTML = `
          <div style="display: flex; justify-content: start; align-items: center; gap: 8px;">
            <img src="${item.img?.path || '/images/default-brand.png'}" 
                 alt="${item.name}" 
                 loading="lazy" 
                 style="width: 32px; height: 32px; object-fit: cover; border-radius: 4px;">
            <span>${item.name || ''}</span>
          </div>
        `
      } 
      else if (col.value === 'totalProduct') {
        td.textContent = item.totalProduct || 0
        td.style.textAlign = 'right'
      }
      else if (col.value === 'totalRevenue') {
        td.textContent = formatNumber(item.totalRevenue || 0)
        td.style.textAlign = 'right'
      }
      else {
        td.textContent = item[col.value] ?? ''
      }

      tr.appendChild(td)
    })

    // Cột hành động
    const tdAction = document.createElement('td')
    tdAction.style.textAlign = 'center'
    tdAction.innerHTML = `<button class="view-btn" id="${item._id}"><i class="fi fi-rr-eye"></i></button>`
    tdAction.onclick = () => openBrandDetail(item._id)
    tr.appendChild(tdAction)

    tbody.appendChild(tr)
  })

  pagination(getBrands, sortOptions, filterOptions, currentPage, dataSize.size)
}

changeColumns.onclick = function () {
  const columnLists = document.querySelector('div.checkbox-group')
  columnLists.style.display = columnLists.style.display === 'none' ? 'block' : 'none'
}

// DETAIL MODAL
const detailModal       = document.querySelector('#detail-modal')
const detailCloseBtn    = detailModal.querySelector('.close-modal')
const detailUpdateBtn   = detailModal.querySelector('button[type="submit"]')
let currentBrandInfo    = null

detailCloseBtn.onclick = () => detailModal.classList.remove('show')
detailModal.onclick = e => {
  if (e.target === detailModal) detailModal.classList.remove('show')
}

async function openBrandDetail(brandId) {
  try {
    detailModal.classList.add('show')

    const response = await fetch('/admin/all-brands/data/brand', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: brandId })
    })

    if (!response.ok) throw new Error(`Response status: ${response.status}`)
    const { error, brandInfo } = await response.json()

    if (error) {
      pushNotification('An error occurred')
      detailModal.classList.remove('show')
      return
    }

    detailModal.querySelector('input[name="id"]').value = brandInfo._id || ''
    detailModal.querySelector('input[name="name"]').value = brandInfo.name || ''
    detailModal.querySelector('input[name="totalProduct"]').value = brandInfo.totalProduct || 0
    detailModal.querySelector('input[name="totalRevenue"]').value = formatNumber(brandInfo.totalRevenue) || ''

    // Lưu để so sánh khi cập nhật
    currentBrandInfo = {
      _id: brandInfo._id,
      name: brandInfo.name
    }

  } catch (err) {
    console.error('Error opening brand detail:', err)
    pushNotification('An error occurred')
    detailModal.classList.remove('show')
  }
}

async function updateBrand() {
  const name = detailModal.querySelector('input[name="name"]').value.trim()

  if (name === currentBrandInfo.name) {
    return pushNotification('Please update the information')
  }

  detailUpdateBtn.classList.add('loading')

  const response = await fetch('/admin/all-brands/brand/updated', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: currentBrandInfo._id,
      name: name
    })
  })

  if (!response.ok) throw new Error(`Response status: ${response.status}`)
  const { error, message } = await response.json()

  detailUpdateBtn.classList.remove('loading')
  if (error) return pushNotification(error)

  pushNotification(message)
  detailModal.classList.remove('show')
  await getBrands(sortOptions, filterOptions, currentPage.page, 10)
}

detailUpdateBtn.onclick = () => updateBrand()

// CREATE MODAL
const createModal     = document.querySelector('#create-modal')
const createBtn       = document.querySelector('.create-btn')
const createCloseBtn  = createModal.querySelector('.close-modal')
const createSubmitBtn = createModal.querySelector('button[type="submit"]')

createBtn.onclick = () => createModal.classList.add('show')
createCloseBtn.onclick = () => createModal.classList.remove('show')
createModal.onclick = e => {
  if (e.target === createModal) createModal.classList.remove('show')
}

async function createBrand() {
  const name = createModal.querySelector('input#name').value.trim()

  if (!name) {
    return pushNotification('Please enter brand name!')
  }

  const response = await fetch('/admin/all-brands/brand/created', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name })
  })

  if (!response.ok) throw new Error(`Response status: ${response.status}`)
  const { error, message } = await response.json()

  if (error) return pushNotification(error)

  pushNotification(message)
  createModal.classList.remove('show')
  await getBrands(sortOptions, filterOptions, currentPage.page, 10)
}

createSubmitBtn.onclick = () => createBrand()

// DOM Loaded
window.addEventListener('DOMContentLoaded', async function loadData() {
  try {
    generateColumns()
    await getBrands(sortOptions, filterOptions, currentPage.page, 10)
    await sortAndFilter(getBrands, sortOptions, filterOptions, currentPage.page)
    await exportJs('BÁO CÁO DANH SÁCH THƯƠNG HIỆU')
  } catch (err) {
    console.error('Error loading data:', err)
    pushNotification('An error occurred while loading data')
  }
})