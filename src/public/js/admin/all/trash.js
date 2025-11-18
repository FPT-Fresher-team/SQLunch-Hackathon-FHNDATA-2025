importLinkCss('/css/admin/all/trash.css') 

const tbody         = document.querySelector('table').querySelector('tbody')
const thead         = document.querySelector('table').querySelector('thead')
const paginationBtn = document.querySelector('select[name="pagination"]')
const changeColumns = document.querySelector('i.fi.fi-rr-objects-column')
const submitChange  = document.querySelector('button.generate-columns')
const sortOptions   = {}
const filterOptions = {}
const currentPage   = { page: 1 }
const dataSize      = { size: 0 }
const deleteForm    = document.forms['delete-form']
const restoreForm   = document.forms['restore-form']
const deleteButton  = document.getElementById('delete-button')
const restoreButton = document.getElementById('restore-button')
var productId;

function generateColumns() {
  const columnsGroup = document.querySelector('div.checkbox-group')
  const inputList = `
    <label><input type="checkbox" value="_id" checked> Customer Code</label>
    <label><input type="checkbox" value="name" checked> Customer Name</label>
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

async function getDeletedProducts(sortOptions, filterOptions, currentPage) {
  tbody.querySelectorAll('tr').forEach((tr, index) => {
    tr.querySelector('td:nth-child(1)').textContent = ''
    tr.querySelector('td:nth-child(1)').classList.add('loading')
  })

  const response = await fetch('/admin/all-products/data/deleted-products', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({sort: sortOptions, filter: filterOptions, page: currentPage})
  })
  if (!response.ok) throw new Error(`Response status: ${response.status}`)
  const {data, data_size, error} = await response.json()
  if (error) return pushNotification(error)

  dataSize.size = data_size

  document.querySelector('div.board-title').querySelector('p').textContent = 'Deleted: ' + dataSize.size

  window.setTimeout(function() {
    tbody.querySelectorAll('tr').forEach((tr, index) => {
      tr.remove()
    })

    let productIndex = (currentPage - 1) * 10 + 1

    data.forEach((item, index) => {
      const newTr = document.createElement('tr')
      newTr.innerHTML = `
        <td>${productIndex}</td>
        <td>${item.brand}</td>
        <td style="display: flex; justify-content: center;align-items: center">
          <img src="${item.img.path}" alt="${item.name}" loading="lazy">
          <p>${item.name}</p>
        </td>
        <td>${item.categories}</td>
        <td style="text-align: right;">${formatNumber(item.price)}</td>
        <td>
          <button id="${item._id}" onclick="clickToRestore(this.id)">Restore</button>
          <button id="${item._id}" onclick="clickToDelete(this.id)">Delete</button>
        </td>
      `
      tbody.appendChild(newTr)
      productIndex++
    })
  }, 1000)
  
  pagination(getDeletedProducts , sortOptions, filterOptions, currentPage, dataSize.size)
}

function clickToDelete(clicked_id) {
  document.getElementById('id01').style.display='block'
  productId = clicked_id
}

deleteButton.onclick = async function () {
  const response = await fetch('/admin/all-products/product/delete', {
    method: 'DELETE',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({id: productId})
  })
  if (!response.ok) throw new Error(`Response status: ${response.status}`)
  const {isValid, message} = await response.json()

  pushNotification(message)
  
  if (!isValid) return
  setTimeout(() => window.location.reload(), 2000)
}

//restore button
function clickToRestore(clicked_id) {
  document.getElementById('id00').style.display='block'
  productId = clicked_id
}

restoreButton.onclick = async function () {
  const response = await fetch('/admin/all-products/product/restore', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({id: productId})
  })
  if (!response.ok) throw new Error(`Response status: ${response.status}`)
  const {isValid, message} = await response.json()

  pushNotification(message)
  
  if (!isValid) return
  setTimeout(() => window.location.reload(), 3000)
}

changeColumns.onclick = function() {
  const columnLists = document.querySelector('div.checkbox-group')
  columnLists.style.display === 'none' ? columnLists.style.display = 'block' : columnLists.style.display = 'none'
}

submitChange.onclick = async function() {
  await getCustomers(sortOptions, filterOptions, currentPage.page, 10)
}

window.addEventListener('DOMContentLoaded', async function loadData() {
  try {
    generateColumns()
    await getDeletedProducts(sortOptions, filterOptions, currentPage.page)
  } catch (error) {
    console.error('Error loading data:', error)
  }
})