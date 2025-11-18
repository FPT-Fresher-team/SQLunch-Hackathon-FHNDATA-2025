importLinkCss('/css/admin/all/products.css')

const thead         = document.querySelector('table').querySelector('thead')
const tbody         = document.querySelector('table').querySelector('tbody')
const changeColumns = document.querySelector('i.fi.fi-rr-objects-column')
const sortOptions   = {}
const filterOptions = { deletedAt: null }
const currentPage   = { page: 1 }
const dataSize      = { size: 0 }
const deleteForm    = document.forms['delete-form']
const deleteButton  = document.getElementById('delete-button')
const formButton    = document.getElementsByClassName('form-button')
var courseId

function generateColumns() {
  const columnsGroup = document.querySelector('div.checkbox-group')
  const inputList = `
    <label><input type="checkbox" value="_id"> Product Code</label>
    <label><input type="checkbox" value="categories" > Category</label>
    <label><input type="checkbox" value="skincare" > Skincare Line</label>
    <label><input type="checkbox" value="makeup" > Makeup Line</label>
    <label><input type="checkbox" value="brand" checked> Brand</label>
    <label><input type="checkbox" value="name" checked> Product Name</label>
    <label><input type="checkbox" value="oldPrice" checked> Old Price</label>
    <label><input type="checkbox" value="price" checked> Current Price</label>
    <label><input type="checkbox" value="quantity" checked> Stock</label>
    <label><input type="checkbox" value="status"> Status</label>
    <label><input type="checkbox" value="rate"> Rating</label>
    <label><input type="checkbox" value="saleNumber"> Sales Count</label>
    <label><input type="checkbox" value="rateNumber"> Review Count</label>
  `
  columnsGroup.insertAdjacentHTML('beforeend', inputList)
} 

async function getFilter() {
  const response = await fetch('/admin/all-products/data/filter', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
  })
  if (!response.ok) throw new Error(`Response status: ${response.status}`)
  const {brand, error} = await response.json()
  if (error) return pushNotification(error)


  brand.forEach((element, index) => {
    const option = document.createElement('option')
    option.value = element.name
    option.textContent = element.name
    document.querySelector('select#brand').appendChild(option)
  })
}

async function getProducts(sortOptions, filterOptions, currentPage, itemsPerPage) {
  tbody.querySelectorAll('tr').forEach((tr, index) => {
    tr.querySelector('td:nth-child(1)').textContent = ''
    tr.querySelector('td:nth-child(1)').classList.add('loading')
  })

  const response = await fetch('/admin/all-products/data/products', {
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

  document.querySelector('div.board-title').querySelector('p').textContent = 'Products: ' + dataSize.size

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

        if (['oldPrice', 'price', 'quantity', 'rate', 'saleNumber', 'rateNumber'].includes(col.value) ) td.style.textAlign = 'right'
        if (['oldPrice', 'price'].includes(col.value)) td.textContent = formatNumber(item[col.value])
        if (['rate'].includes(col.value)) td.textContent = formatRate(item[col.value])

        newTr.appendChild(td)
      })

      const link = document.createElement('td')
      link.innerHTML = `<a target="_blank" rel="noopener noreferrer" href="/admin/all-products/product/${item._id}">View</a>`
      newTr.appendChild(link)
      tbody.appendChild(newTr)
      itemIndex++
    })
  }, 1000)

  pagination(getProducts, sortOptions, filterOptions, currentPage, dataSize.size)
}

function reply_click(clicked_id, clicked_name) {
  console.log('123')
  const name = clicked_name
  const message = document.querySelector('p#confirm-message')
  message.innerText = `Bạn có muốn xoá sản phẩm ${name} không ?`
  document.getElementById('id01').style.display='block'
  courseId = clicked_id
}

// delete action
deleteButton.onclick = async function () {
  const response = await fetch('/admin/all-products/product/soft-delete', {
    method: 'DELETE',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({id: courseId})
  })
  if (!response.ok) throw new Error(`Response status: ${response.status}`)
  const {isValid, message} = await response.json()

  pushNotification(message)
  
  if (!isValid) return
  setTimeout(() => window.location.reload(), 2000)
}

changeColumns.onclick = function() {
  const columnLists = document.querySelector('div.checkbox-group')
  columnLists.style.display === 'none' ? columnLists.style.display = 'block' : columnLists.style.display = 'none'
}

window.addEventListener('DOMContentLoaded', async function loadData() {
  try {
    generateColumns()
    await getFilter()
    await getProducts(sortOptions, filterOptions, currentPage.page, 10)
    await sortAndFilter(getProducts, sortOptions, filterOptions, currentPage.page)
    await exportJs('BÁO CÁO DANH SÁCH SẢN PHẨM')
  } catch (error) {
    console.error('Error loading data:', error)
    pushNotification(error)
  }
})