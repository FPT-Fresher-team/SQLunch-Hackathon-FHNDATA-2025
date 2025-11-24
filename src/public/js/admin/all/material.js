importLinkCss('/css/admin/all/materials.css')

const thead         = document.querySelector('table').querySelector('thead')
const tbody         = document.querySelector('table').querySelector('tbody')
const changeColumns = document.querySelector('i.fi.fi-rr-objects-column')
const sortOptions   = {}
const filterOptions = {}
const currentPage   = { page: 1 }
const dataSize      = { size: 0 }

// DETAIL MODAL
const detailModal       = document.querySelector('#detail-modal')
const detailCloseBtn    = detailModal.querySelector('.close-modal-btn')
const detailUpdateBtn   = detailModal.querySelector('button[type="submit"]')
let currentMaterialInfo = null

detailCloseBtn.onclick = () => detailModal.classList.remove('show')
detailModal.onclick = (e) => {
  if (e.target === detailModal) detailModal.classList.remove('show')
}

async function openMaterialDetail(materialId) {
  try {
    detailModal.classList.add('show')
    const response = await fetch('/admin/all-materials/data/material', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({id: materialId})
    })
    if (!response.ok) throw new Error(`Response status: ${response.status}`)
    const {error, materialInfo} = await response.json()
    if (error) {
      pushNotification('An error occurred')
      detailModal.classList.remove('show')
      return
    }

    detailModal.querySelector('input[name="id"]').value = materialInfo._id || ''
    detailModal.querySelector('input[name="name"]').value = materialInfo.name || ''
    detailModal.querySelector('input[name="price"]').value = materialInfo.price || ''
    detailModal.querySelector('input[name="quantity"]').value = materialInfo.quantity || ''
    detailModal.querySelector('input[name="expiry_date"]').value = materialInfo.expiry_date ? materialInfo.expiry_date.split('T')[0] : ''

    currentMaterialInfo = {
      _id: materialInfo._id,
      name: materialInfo.name,
      price: materialInfo.price,
      quantity: materialInfo.quantity,
      expiry_date: materialInfo.expiry_date
    }
  } catch (error) {
    console.error('Error opening material detail:', error)
    pushNotification('An error occurred')
    detailModal.classList.remove('show')
  }
}

async function updateMaterial() {
  const name = detailModal.querySelector('input#name').value
  const price = detailModal.querySelector('input#price').value
  const quantity = detailModal.querySelector('input#quantity').value
  const expiry_date = detailModal.querySelector('input#expiry_date').value

  if (name === currentMaterialInfo.name && price == currentMaterialInfo.price && quantity == currentMaterialInfo.quantity && expiry_date === (currentMaterialInfo.expiry_date ? currentMaterialInfo.expiry_date.split('T')[0] : '')) {
    return pushNotification('Please update the information')
  }

  detailUpdateBtn.classList.add('loading')
  const response = await fetch('/admin/all-materials/material/updated', {
    method: 'PUT',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      id: currentMaterialInfo._id,
      name: name,
      price: price,
      quantity: quantity,
      expiry_date: expiry_date
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
  await getMaterials(sortOptions, filterOptions, currentPage, 10)
}

detailUpdateBtn.onclick = () => updateMaterial()

// CREATE MODAL
const createModal     = document.querySelector('#create-modal')
const createBtn       = document.querySelector('.create-btn')
const createCloseBtn  = createModal.querySelector('.close-modal')
const createSubmitBtn = createModal.querySelector('button[type="submit"]')

createBtn.onclick = () => createModal.classList.add('show')
createCloseBtn.onclick = () => createModal.classList.remove('show')
createModal.onclick = (e) => {
  if (e.target === createModal) createModal.classList.remove('show')
}

async function createMaterial() {
  try {
    const code = createModal.querySelector('input#code').value
    const name = createModal.querySelector('input#name').value
    const price = createModal.querySelector('input#price').value
    const quantity = createModal.querySelector('input#quantity').value
    const expiry_date = createModal.querySelector('input#expiry_date').value

    if (!code || !name || !price || !quantity || !expiry_date) {
      return pushNotification("Please fill in all information!")
    }

    const response = await fetch('/admin/all-materials/material/created', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        code: code,
        name: name,
        price: price,
        quantity: quantity,
        expiry_date: expiry_date
      })
    })
    if (!response.ok) throw new Error(`Response status: ${response.status}`)
    const {error, message} = await response.json()
    if (error) return pushNotification(error)
    
    pushNotification(message)
    createModal.classList.remove('show')
    await getMaterials(sortOptions, filterOptions, currentPage, 10)
  } catch (error) {
    console.error('Error creating material:', error)
    pushNotification("An error occurred.")
  }
}

createSubmitBtn.onclick = async () => await createMaterial()

function generateColumns() {
  const columnsGroup = document.querySelector('div.checkbox-group')
  const inputList = `
    <label><input type="checkbox" value="_id" checked> Material Code</label>
    <label><input type="checkbox" value="name" checked> Material Name</label>
    <label><input type="checkbox" value="price" checked> Purchase Price</label>
    <label><input type="checkbox" value="quantity" checked> Stock</label>
    <label><input type="checkbox" value="expiry_date" checked> Expiration Date</label>
  `
  columnsGroup.insertAdjacentHTML('beforeend', inputList)
} 

async function getMaterials(sortOptions, filterOptions, currentPage, itemsPerPage) {
  tbody.querySelectorAll('tr').forEach((tr, index) => {
    tr.querySelector('td:nth-child(1)').textContent = ''
    tr.querySelector('td:nth-child(1)').classList.add('loading')
  })

  const response = await fetch('/admin/all-materials/data/materials', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      sort: sortOptions, 
      filter: filterOptions, 
      page: currentPage,
      itemsPerPage: itemsPerPage
    })
  })
  if (!response.ok) throw new Error(`Response status: ${response.status}`)
  const {data, data_size, error} = await response.json()
  if (error) return pushNotification(error)

  dataSize.size = data_size

  document.querySelector('div.board-title').querySelector('p').textContent = 'Materials: ' + dataSize.size

  window.setTimeout(function() {
    tbody.querySelectorAll('tr').forEach((tr, index) => {
      tr.remove()
    })

    let productIndex = (currentPage - 1) * itemsPerPage + 1

    data.forEach((item, index) => {
      const newTr = document.createElement('tr')
      
      const indexTd = document.createElement('td')
      indexTd.textContent = productIndex
      newTr.appendChild(indexTd)
      
      const codeTd = document.createElement('td')
      codeTd.textContent = item.code
      newTr.appendChild(codeTd)
      
      const nameTd = document.createElement('td')
      nameTd.textContent = item.name
      newTr.appendChild(nameTd)
      
      const priceTd = document.createElement('td')
      priceTd.style.textAlign = 'right'
      priceTd.textContent = formatNumber(item.price)
      newTr.appendChild(priceTd)
      
      const qtyTd = document.createElement('td')
      qtyTd.style.textAlign = 'right'
      qtyTd.textContent = item.quantity
      newTr.appendChild(qtyTd)
      
      const expiryTd = document.createElement('td')
      expiryTd.style.textAlign = 'right'
      expiryTd.textContent = formatDate(item.expiry_date)
      newTr.appendChild(expiryTd)
      
      const viewTd = document.createElement('td')
      viewTd.style.textAlign = 'center'
      viewTd.innerHTML = `<button id="${item._id}">View</button>`
      viewTd.onclick = async function() {
        await openMaterialDetail(item._id)
      }
      newTr.appendChild(viewTd)
      
      tbody.appendChild(newTr)
      productIndex++
    })
  }, 1000)

  pagination(getMaterials, sortOptions, filterOptions, currentPage, dataSize.size)
}

changeColumns.onclick = function() {
  const columnLists = document.querySelector('div.checkbox-group')
  columnLists.style.display === 'none' ? columnLists.style.display = 'block' : columnLists.style.display = 'none'
}

window.addEventListener('DOMContentLoaded', async function loadData() {
  try {
    generateColumns()
    await getMaterials(sortOptions, filterOptions, currentPage.page, 10)
    await sortAndFilter(getMaterials, sortOptions, filterOptions, currentPage.page)
    await exportJs()
  } catch (error) {
    console.error('Error loading data:', error)
    pushNotification(error)
  }
})