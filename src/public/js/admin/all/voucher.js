importLinkCss('/css/admin/all/vouchers.css')

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
    <label><input type="checkbox" value="code" checked> Voucher Code</label>
    <label><input type="checkbox" value="name" checked> Voucher Name</label>
    <label><input type="checkbox" value="description" checked> Description</label>
    <label><input type="checkbox" value="memberCode" checked> Membership Tier</label>
    <label><input type="checkbox" value="discount" checked> Discount Rate</label>
    <label><input type="checkbox" value="maxDiscount"> Maximum Discount</label>
    <label><input type="checkbox" value="minOrder"> Minimum Order</label>
    <label><input type="checkbox" value="status"> Status</label>
    <label><input type="checkbox" value="startDate"> Start Date</label>
    <label><input type="checkbox" value="endDate"> End Date</label>
    <label><input type="checkbox" value="usedAt"> Used Date</label>

  `
  columnsGroup.insertAdjacentHTML('beforeend', inputList)
} 

async function getFilter() {
  const response = await fetch('/admin/all-vouchers/data/filter', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
  })
  if (!response.ok) throw new Error(`Response status: ${response.status}`)
  const {memberShip, error} = await response.json()
  if (error) return pushNotification(error)

  memberShip.forEach((element, index) => {
    const option = document.createElement('option')
    option.value = element.code
    option.textContent = element.name
    document.querySelectorAll('select#memberCode').forEach(select => {
      select.appendChild(option)
    })
  })
}

async function getVouchers(sortOptions, filterOptions, currentPage, itemsPerPage) {
  tbody.querySelectorAll('tr').forEach((tr, index) => {
    tr.querySelector('td:nth-child(1)').textContent = ''
    tr.querySelector('td:nth-child(1)').classList.add('loading')
  })

  const response = await fetch('/admin/all-vouchers/data/vouchers', {
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

  document.querySelector('div.board-title').querySelector('p').textContent = 'Voucher: ' + dataSize.size

  const selected = Array.from(document.querySelectorAll('.checkbox-group input:checked')).slice(1)   // remove the first checkbox
                        .map(cb => ({
                          value: cb.value,
                          name: cb.closest("label").innerText.trim()
                        }))

  thead.querySelectorAll('tr').forEach((tr, index) => {
    tr.remove()
  })

  // header
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
  headLink.textContent = 'Chi tiết'
  trHead.appendChild(headLink)

  thead.appendChild(trHead)

  // body
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

      if (['discount', 'maxDiscount', 'minOrder', 'startDate', 'endDate', 'usedAt'].includes(col.value) ) td.style.textAlign = 'right'
      if (['maxDiscount', 'minOrder'].includes(col.value)) td.textContent = formatNumber(item[col.value])
      if (['discount'].includes(col.value)) td.textContent = formatPercentage(item[col.value])
      if (['startDate', 'endDate', 'usedAt'].includes(col.value)) td.textContent = formatDate(item[col.value])

      newTr.appendChild(td)
    })

    const openButton = document.createElement('td')
    openButton.style.textAlign = 'center'
    openButton.innerHTML = `<button id="${item._id}">View</button>`
    openButton.onclick = async function() {
      await openVoucherDetail(item._id)
    }

    newTr.appendChild(openButton)
    tbody.appendChild(newTr)
  })
  
  pagination(getVouchers, sortOptions, filterOptions, currentPage, dataSize.size)
}

changeColumns.onclick = function() {
  const columnLists = document.querySelector('div.checkbox-group')
  columnLists.style.display === 'none' ? columnLists.style.display = 'block' : columnLists.style.display = 'none'
}

// DETAIL MODAL
const detailModal       = document.querySelector('#detail-modal')
const detailCloseBtn    = detailModal.querySelector('.close-modal')
const detailUpdateBtn   = detailModal.querySelector('button[type="submit"]')
let currentVoucherInfo  = null  // Store current voucher info for comparison

detailCloseBtn.onclick = () => detailModal.classList.remove('show')
detailModal.onclick = (e) => {
  if (e.target === detailModal) detailModal.classList.remove('show')
}

async function openVoucherDetail(voucherId) {
  try {
    detailModal.classList.add('show')
    
    // Fetch voucher data
    const response = await fetch('/admin/all-vouchers/data/voucher', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({id: voucherId})
    })
    
    if (!response.ok) throw new Error(`Response status: ${response.status}`)
    const {error, voucherInfo} = await response.json()
    if (error) {
      pushNotification('An error occurred')
      detailModal.classList.remove('show')
      return
    }

    detailModal.querySelector('input[name="id"]').value           = voucherInfo._id || ''
    detailModal.querySelector('input[name="name"]').value         = voucherInfo.name || ''
    detailModal.querySelector('input[name="description"]').value  = voucherInfo.description || ''
    detailModal.querySelector('input[name="discount"]').value     = formatPercentage(voucherInfo.discount) || ''
    detailModal.querySelector('input[name="maxDiscount"]').value  = formatNumber(voucherInfo.maxDiscount) || ''
    detailModal.querySelector('input[name="minOrder"]').value     = formatNumber(voucherInfo.minOrder) || ''
    detailModal.querySelector('input[name="status"]').value       = voucherInfo.status || ''
    detailModal.querySelector('input[name="memberCode"]').value   = voucherInfo.memberCode || ''
    detailModal.querySelector('input[name="startDate"]').value    = voucherInfo.startDate ? formatDate(voucherInfo.startDate) : ''
    detailModal.querySelector('input[name="endDate"]').value      = voucherInfo.endDate ? formatDate(voucherInfo.endDate) : ''

    // Store voucher info for update comparison
    currentVoucherInfo = {
      _id: voucherInfo._id,
      name: voucherInfo.name,
      description: voucherInfo.description,
      discount: voucherInfo.discount,
      maxDiscount: voucherInfo.maxDiscount,
      minOrder: voucherInfo.minOrder
    }

    return voucherInfo

  } catch (error) {
    console.error('Error opening voucher detail:', error)
    pushNotification('An error occurred')
    detailModal.classList.remove('show')
  }
}

// UPDATE MODAL
async function updateVoucher() {
  const name        = detailModal.querySelector('input[name="name"]').value
  const description = detailModal.querySelector('input[name="description"]').value
  const discount    = deFormatNumber(detailModal.querySelector('input[name="discount"]').value)
  const maxDiscount = deFormatNumber(detailModal.querySelector('input[name="maxDiscount"]').value)
  const minOrder    = deFormatNumber(detailModal.querySelector('input[name="minOrder"]').value)

  // Check if any field has changed
  if (name        === currentVoucherInfo.name         && 
      description === currentVoucherInfo.description  && 
      discount    === currentVoucherInfo.discount     &&
      maxDiscount === currentVoucherInfo.maxDiscount  &&
      minOrder    === currentVoucherInfo.minOrder) {
    return pushNotification('Please update the information')
  }

  detailUpdateBtn.classList.add('loading')
  const response = await fetch('/admin/all-vouchers/voucher/updated', {
    method: 'PUT',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      id: currentVoucherInfo._id,
      name: name,
      description: description,
      discount: discount,
      maxDiscount: maxDiscount,
      minOrder: minOrder
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
  await getVouchers(sortOptions, filterOptions, currentPage.page, 10)
}

detailUpdateBtn.onclick = function() {
  updateVoucher()
}

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

async function createVoucher() {
  try {
    const code = createModal.querySelector('input#code').value
    const name = createModal.querySelector('input#name').value
    const description = createModal.querySelector('input#description').value
    const discount = createModal.querySelector('input#discount').value
    const maxDiscount = createModal.querySelector('input#maxDiscount').value
    const minOrder = createModal.querySelector('input#minOrder').value
    const status = createModal.querySelector('select#status').value
    const memberCode = createModal.querySelector('select#memberCode').value
    const startDate = createModal.querySelector('input#startDate').value
    const endDate = createModal.querySelector('input#endDate').value

    if (!code || !name || !discount || !status) {
      return pushNotification("Please fill in all information!")
    }

    const response = await fetch('/admin/all-vouchers/voucher/created', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        code: code,
        name: name,
        description: description,
        discount: discount,
        maxDiscount: maxDiscount,
        minOrder: minOrder,
        status: status,
        memberCode: memberCode,
        startDate: startDate,
        endDate: endDate
      })
    })
    if (!response.ok) throw new Error(`Response status: ${response.status}`)
    const {error, message} = await response.json()
    if (error) return pushNotification(error)
    
    pushNotification(message)
    createModal.classList.remove('show')
    await getVouchers(sortOptions, filterOptions, currentPage.page, 10)
  } catch (error) {
    console.error('Error creating voucher:', error)
    pushNotification("An error occurred.")
  }
}

createSubmitBtn.onclick = async function() {
  await createVoucher()
}

window.addEventListener('DOMContentLoaded', async function() {
  try {
    generateColumns()
    await getFilter()
    await getVouchers(sortOptions, filterOptions, currentPage.page, 10)
    await sortAndFilter(getVouchers, sortOptions, filterOptions, currentPage.page)
    await exportJs('VOUCHER LIST REPORT')
  } catch (error) {
    console.error('Error loading data:', error)
    pushNotification(error)
  }
})