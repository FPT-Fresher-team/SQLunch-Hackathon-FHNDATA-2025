importLinkCss('/css/admin/all/trash.css') 

const tbody         = document.querySelector('table').querySelector('tbody')
const thead         = document.querySelector('table').querySelector('thead')
const sortOptions   = {}
const filterOptions = {}
const currentPage   = { page: 1 }
const dataSize      = { size: 0 }
const deleteForm    = document.forms['delete-form']
const restoreForm   = document.forms['restore-form']
const deleteButton  = document.getElementById('delete-button')
const restoreButton = document.getElementById('restore-button')
var productId;

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
          <button class= "restore-btn" id="${item._id}" onclick="clickToRestore(this.id)"><i class="fi fi-rr-undo"></i></button>
          <button class= "delete-btn" id="${item._id}" onclick="clickToDelete(this.id)"><i class="fi fi-rr-trash"></i></button>
        </td>
      `
      tbody.appendChild(newTr)
      productIndex++
    })
  }, 1000)
  
  pagination(getDeletedProducts , sortOptions, filterOptions, currentPage, dataSize.size)
}

function clickToDelete(clicked_id) {
  document.getElementById('delete-modal').classList.add('active')
  productId = clicked_id
}

deleteButton.onclick = async function () {
  const response = await fetch('/admin/all-products/product/delete', {
    method: 'DELETE',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({id: productId})
  })
  if (!response.ok) throw new Error(`Response status: ${response.status}`)
  const {message, error} = await response.json()
  if (error) return pushNotification(error)

  pushNotification(message)
  document.getElementById('delete-modal').classList.remove('active')
  getDeletedProducts(sortOptions, filterOptions, currentPage.page)
}

//restore button
function clickToRestore(clicked_id) {
  document.getElementById('restore-modal').classList.add('active')
  productId = clicked_id
}

restoreButton.onclick = async function () {
  const response = await fetch('/admin/all-products/product/restore', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({id: productId})
  })
  if (!response.ok) throw new Error(`Response status: ${response.status}`)
  const {message, error} = await response.json()
  if (error) return pushNotification(error)

  pushNotification(message)
  document.getElementById('restore-modal').classList.remove('active')
  getDeletedProducts(sortOptions, filterOptions, currentPage.page)
}

window.addEventListener('DOMContentLoaded', async function loadData() {
  try {
    await getDeletedProducts(sortOptions, filterOptions, currentPage.page)
  } catch (error) {
    console.error('Error loading data:', error)
  }
})

function closeModal(id) {
  document.getElementById(id).classList.remove('active')
}