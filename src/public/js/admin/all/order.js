importLinkCss('/css/admin/all/orders.css')

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
    <label><input type="checkbox" value="customerInfo" checked> Customer Name</label>
    <label><input type="checkbox" value="totalOrderPrice" checked> Total Before Discount</label>
    <label><input type="checkbox" value="totalNewOrderPrice" checked> Total Amount</label>
    <label><input type="checkbox" value="paymentMethod" checked> Payment Method</label>
    <label><input type="checkbox" value="status"> Order Status</label>
    <label><input type="checkbox" value="isRated"> Review Status</label>
    <label><input type="checkbox" value="isPaid"> Payment Status</label>
    <label><input type="checkbox" value="voucherCode"> Voucher Code</label>
    <label><input type="checkbox" value="createdAt"> Order Date</label>
  `
  columnsGroup.insertAdjacentHTML('beforeend', inputList)
} 

async function getFilter() {
  const response = await fetch('/admin/all-orders/data/filter', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
  })
  if (!response.ok) throw new Error(`Response status: ${response.status}`)
  const {orderStatus, paymentMethod, error} = await response.json()
  if (error) return pushNotification(error)

  orderStatus.forEach((element, index) => {
    const option = document.createElement('option')
    option.value = element.code
    option.textContent = element.name
    document.querySelector('select#status').appendChild(option)
  })

  paymentMethod.forEach((element, index) => {
    const option = document.createElement('option')
    option.value = element.code
    option.textContent = element.name
    document.querySelector('select#paymentMethod').appendChild(option)
  })
}

async function getOrders(sortOptions, filterOptions, currentPage, itemsPerPage) {
  tbody.querySelectorAll('tr').forEach((tr, index) => {
    tr.querySelector('td:nth-child(1)').textContent = ''
    tr.querySelector('td:nth-child(1)').classList.add('loading')
  })

  const response = await fetch('/admin/all-orders/data/orders', {
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

  document.querySelector('div.board-title').querySelector('p').textContent = 'Orders: ' + dataSize.size

  const selected = Array.from(document.querySelectorAll('.checkbox-group input:checked')).map(cb => ({
    value: cb.value,
    name: cb.closest("label").innerText.trim()
  }))

  window.setTimeout(function() {
    thead.querySelectorAll('tr').forEach((tr, index) => {
      tr.remove()
    })

    // header
    const trHead = document.createElement("tr")

    const headData = document.createElement('td')
    headData.textContent = 'STT'
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

    // body
    tbody.querySelectorAll('tr').forEach((tr, index) => {
      tr.remove()
    })

    let itemIndex = (currentPage - 1) * itemsPerPage + 1

    data.forEach((item, index) => {
      const newTr = document.createElement('tr')

      const itemData = document.createElement('td')
      itemData.textContent = itemIndex
      newTr.appendChild(itemData)

      selected.forEach(col => {
        const td = document.createElement("td")
        td.textContent = item[col.value]

        if (['totalOrderPrice', 'totalNewOrderPrice', 'createdAt'].includes(col.value) ) td.style.textAlign = 'right'
        if (['totalOrderPrice', 'totalNewOrderPrice'].includes(col.value)) td.textContent = formatNumber(item[col.value])
        if (['createdAt'].includes(col.value)) td.textContent = formatDate(item[col.value])
        if (['isRated', 'isPaid'].includes(col.value)) td.textContent = item[col.value] === 'true' ? 'Rồi' : 'Chưa'
        if (['customerInfo'].includes(col.value)) td.textContent = item.customerInfo.name

        newTr.appendChild(td)
      })

      const link = document.createElement('td')
      link.innerHTML = `<a target="_blank" rel="noopener noreferrer" href="/admin/all-orders/order/${item._id}">View</a>`
      newTr.appendChild(link)
      tbody.appendChild(newTr)
      itemIndex++
    })
  }, 1000)
  
  pagination(getOrders, sortOptions, filterOptions, currentPage, dataSize.size)
}

changeColumns.onclick = function() {
  const columnLists = document.querySelector('div.checkbox-group')
  columnLists.style.display === 'none' ? columnLists.style.display = 'block' : columnLists.style.display = 'none'
}

window.addEventListener('DOMContentLoaded', async function loadData() {
  try {
    generateColumns()
    await getFilter()
    await getOrders(sortOptions, filterOptions, currentPage.page, 10)
    await sortAndFilter(getOrders, sortOptions, filterOptions, currentPage.page)
    await exportJs('BÁO CÁO DANH SÁCH ĐƠN HÀNG')
  } catch (error) {
    console.error('Error loading data:', error)
    pushNotification(error)
  }
})