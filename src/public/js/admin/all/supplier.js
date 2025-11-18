importLinkCss('/css/admin/all/suppliers.css')

const tbody         = document.querySelector('table').querySelector('tbody')
const thead         = document.querySelector('table').querySelector('thead')
const changeColumns = document.querySelector('i.fi.fi-rr-objects-column')
const sortOptions   = {}
const filterOptions = {}
const currentPage   = { page: 1 }
const dataSize      = { size: 0 }

function generateColumns() {
  const columnsGroup = document.querySelector('div.checkbox-group')
  const inputList = `
    <label><input type="checkbox" value="_id" checked> Supplier Code</label>
    <label><input type="checkbox" value="name" checked> Supplier Name</label>
    <label><input type="checkbox" value="phone" > Phone</label>
    <label><input type="checkbox" value="email" > Email</label>
    <label><input type="checkbox" value="address" checked> Address</label>
    <label><input type="checkbox" value="quantity" checked> Quantity</label>
    <label><input type="checkbox" value="totalCost" checked> Total Revenue</label>
  `
  columnsGroup.insertAdjacentHTML('beforeend', inputList)
} 

async function getFilter() {
  const response = await fetch('/admin/all-suppliers/data/filter', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
  })
  if (!response.ok) throw new Error(`Response status: ${response.status}`)
  const {data, error} = await response.json()
  if (error) return pushNotification(error)

  data.forEach((element, index) => {
    const option = document.createElement('option')
    option.value = element.code
    option.textContent = element.name
    document.querySelector('select#memberCode').appendChild(option)
  })
}

async function getSuppliers(sortOptions, filterOptions, currentPage, itemsPerPage) {
  tbody.querySelectorAll('tr').forEach((tr, index) => {
    tr.querySelector('td:nth-child(1)').textContent = ''
    tr.querySelector('td:nth-child(1)').classList.add('loading')
  })

  const response = await fetch('/admin/all-suppliers/data/suppliers', {
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

  document.querySelector('div.board-title').querySelector('p').textContent = 'Suppliers: ' + dataSize.size

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

        // quantity
        // totalCost

        if (['quantity', 'totalCost'].includes(col.value) ) td.style.textAlign = 'right'
        if (['totalCost'].includes(col.value)) td.textContent = formatNumber(item[col.value])

        newTr.appendChild(td)
      })

      const link = document.createElement('td')
      link.innerHTML = `<a target="_blank" rel="noopener noreferrer" href="/admin/all-suppliers/supplier/${item._id}">View</a>`
      newTr.appendChild(link)
      tbody.appendChild(newTr)
      itemIndex++
    })
  }, 1000)
  
  pagination(getSuppliers, sortOptions, filterOptions, currentPage, dataSize.size)
}

changeColumns.onclick = function() {
  const columnLists = document.querySelector('div.checkbox-group')
  columnLists.style.display === 'none' ? columnLists.style.display = 'block' : columnLists.style.display = 'none'
}

window.addEventListener('DOMContentLoaded', async function loadData() {
  try {
    generateColumns()
    await getSuppliers(sortOptions, filterOptions, currentPage.page, 10)
    await sortAndFilter(getSuppliers, sortOptions, filterOptions, currentPage.page)
    await exportJs('BÁO CÁO DANH SÁCH NHÀ CUNG CẤP')
  } catch (error) {
    console.error('Error loading data:', error)
    pushNotification(error)
  }
})