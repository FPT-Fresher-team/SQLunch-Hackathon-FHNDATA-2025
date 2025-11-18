importLinkCss('/css/admin/all/products.css')

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
    <label><input type="checkbox" value="_id" checked> Supplier Code</label>
    <label><input type="checkbox" value="name" checked> Supplier Name</label>
    <label><input type="checkbox" value="address" checked> Address</label>
    <label><input type="checkbox" value="quantity" checked> Order Count</label>
    <label><input type="checkbox" value="revenue" checked> Total Revenue</label>
    <label><input type="checkbox" value="email"> Email</label>
    <label><input type="checkbox" value="phone"> Phone</label>
    <label><input type="checkbox" value="gender"> Gender</label>
    <label><input type="checkbox" value="memberCode"> Member Rank</label>
    <label><input type="checkbox" value="isActive"> Status</label>
    <label><input type="checkbox" value="dob"> Date of Birth</label>
    <label><input type="checkbox" value="lastLogin"> Last Login</label>
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
      newTr.innerHTML = `
        <td>${productIndex}</td>
        <td>${item.code}</td>
        <td>${item.name}</td>
        <td style="text-align: right;">${formatNumber(item.price)}</td>
        <td style="text-align: right;">${item.quantity}</td>
        <td style="text-align: right;">${formatDate(item.expiry_date)}</td>
        <td><a target="_blank" rel="noopener noreferrer" href="/admin/all-materials/material/${item._id}" class="update-button">View</a></td>
      `
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