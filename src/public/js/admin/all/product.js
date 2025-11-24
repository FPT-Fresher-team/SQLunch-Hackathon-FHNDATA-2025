importLinkCss('/css/admin/all/products.css')

// ALL
const thead         = document.querySelector('table').querySelector('thead')
const tbody         = document.querySelector('table').querySelector('tbody')
const changeColumns = document.querySelector('i.fi.fi-rr-objects-column')
const sortOptions   = {}
const filterOptions = { deletedAt: null }
const currentPage   = { page: 1 }
const dataSize      = { size: 0 }

// Soft Delete
const deleteModal   = document.getElementById('id01')
const deleteButton  = document.getElementById('delete-button')
let productToDelete = null

function generateColumns() {
  const columnsGroup = document.querySelector('div.checkbox-group')
  const inputList = `
    <label><input type="checkbox" value="_id"> Product Code</label>
    <label><input type="checkbox" value="img" checked> Image</label>
    <label><input type="checkbox" value="categories"> Category</label>
    <label><input type="checkbox" value="skincare"> Skincare Line</label>
    <label><input type="checkbox" value="makeup"> Makeup Line</label>
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
    headers: { 'Content-Type': 'application/json' }
  })
  if (!response.ok) throw new Error(`Response status: ${response.status}`)
  const { brand, error } = await response.json()
  if (error) return pushNotification(error)

  const brandSelect = document.querySelectorAll('select#brand')
  if (brandSelect) {
    brand.forEach(b => {
      const opt = document.createElement('option')
      opt.value = b.name
      opt.textContent = b.name
      brandSelect.forEach(select => select.appendChild(opt.cloneNode(true)))
    })
  }
}

async function getProducts(sortOptions, filterOptions, currentPage, itemsPerPage) {
  tbody.querySelectorAll('tr').forEach(tr => {
    const firstTd = tr.querySelector('td:nth-child(1)')
    if (firstTd) {
      firstTd.textContent = ''
      firstTd.classList.add('loading')
    }
  })

  const response = await fetch('/admin/all-products/data/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sort: sortOptions, filter: filterOptions, page: currentPage, itemsPerPage })
  })

  if (!response.ok) throw new Error(`Response status: ${response.status}`)
  const { data, data_size, error } = await response.json()
  if (error) return pushNotification(error)

  dataSize.size = data_size
  document.querySelector('div.board-title p').textContent = 'Products: ' + dataSize.size

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
  thAction.textContent = 'Actions'
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
      let value = item[col.value]

      if (col.value === 'img') {
        td.innerHTML = `<img src="${item.img?.path || '/images/default-product.png'}" 
                         alt="${item.name}" loading="lazy" 
                         style="width: 40px; height: 40px; object-fit: cover; border-radius: 4px;">`
      }
      else if (col.value === 'name') {
        td.innerHTML = `
          <div style="display: flex; align-items: center; gap: 8px;">
            <span>${item.name || ''}</span>
          </div>
        `
      }
      else if (['oldPrice', 'price'].includes(col.value)) {
        td.textContent = formatNumber(value)
        td.style.textAlign = 'right'
      }
      else if (['quantity', 'saleNumber', 'rateNumber'].includes(col.value)) {
        td.textContent = value ?? 0
        td.style.textAlign = 'right'
      }
      else if (col.value === 'rate') {
        td.textContent = formatRate(value) + '/5'
        td.style.textAlign = 'right'
      }
      else if (col.value === 'brand') {
        td.textContent = item.brand?.name || value
      }
      else {
        td.textContent = value ?? ''
      }

      tr.appendChild(td)
    })

    // Action buttons: View + Delete
    const tdAction = document.createElement('td')
    tdAction.style.textAlign = 'center'
    tdAction.innerHTML = `
      <button class="view-btn" id="${item._id}">View</button>
      <button class="delete-btn" 
              onclick="reply_click('${item._id}', '${item.name.replace(/'/g, "\\'")}')">
        Delete
      </button>
    `
    tdAction.querySelector('.view-btn').onclick = () => openProductDetail(item._id)
    tr.appendChild(tdAction)

    tbody.appendChild(tr)
  })

  pagination(getProducts, sortOptions, filterOptions, currentPage, dataSize.size)
}

function reply_click(id, name) {
  productToDelete = id
  document.querySelector('p#confirm-message').textContent = `Bạn có muốn xoá sản phẩm "${name}" không?`
  deleteModal.style.display = 'block'
}

deleteButton.onclick = async function () {
  if (!productToDelete) return

  deleteButton.classList.add('loading')

  const response = await fetch('/admin/all-products/product/soft-delete', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: productToDelete })
  })

  deleteButton.classList.remove('loading')
  deleteModal.style.display = 'none'

  if (!response.ok) {
    pushNotification('Xóa thất bại')
    return
  }

  const { isValid, message } = await response.json()
  pushNotification(message)

  if (isValid) {
    productToDelete = null
    await getProducts(sortOptions, filterOptions, currentPage.page, 10)
  }
}

changeColumns.onclick = function () {
  const columnLists = document.querySelector('div.checkbox-group')
  columnLists.style.display = columnLists.style.display === 'none' ? 'block' : 'none'
}

// DETAIL MODAL
const detailModal       = document.querySelector('#detail-modal')
const detailCloseBtn    = detailModal.querySelector('.close-modal')
const detailUpdateBtn   = detailModal.querySelector('button[type="submit"]')
let currentProductInfo  = null
let imgPath             = { path: '' }

detailCloseBtn.onclick = () => detailModal.classList.remove('show')
detailModal.onclick = e => { if (e.target === detailModal) detailModal.classList.remove('show') }

// Xử lý ảnh khi thay đổi
detailModal.querySelector('input#img')?.addEventListener('change', function () {
  const file = this.files[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = () => {
      imgPath.path = reader.result
      detailModal.querySelector('img#image').src = reader.result
    }
    reader.readAsDataURL(file)
  }
})

async function openProductDetail(productId) {
  try {
    detailModal.classList.add('show')

    const response = await fetch('/admin/all-products/data/product', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: productId })
    })

    if (!response.ok) throw new Error(`Response status: ${response.status}`)
    const { error, productInfo, brands, productStatuses } = await response.json()
    if (error) {
      pushNotification('An error occurred')
      detailModal.classList.remove('show')
      return
    }

    document.title = productInfo.name || 'Product Detail'

    // Fill form
    detailModal.querySelector('input#id').value = productInfo._id
    detailModal.querySelector('select#categories').value = productInfo.categories || ''
    detailModal.querySelector('input#name').value = productInfo.name || ''
    detailModal.querySelector('input#oldPrice').value = formatNumber(productInfo.oldPrice)
    detailModal.querySelector('input#price').value = formatNumber(productInfo.price)
    detailModal.querySelector('input#purchasePrice').value = formatNumber(productInfo.purchasePrice || 0)
    detailModal.querySelector('input#description').value = productInfo.description || ''
    detailModal.querySelector('input#details').value = productInfo.details || ''
    detailModal.querySelector('input#guide').value = productInfo.guide || ''
    detailModal.querySelector('input#quantity').value = productInfo.quantity || 0
    detailModal.querySelector('input#rate').value = formatRate(productInfo.rate) + '/5'
    detailModal.querySelector('input#saleNumber').value = productInfo.saleNumber || 0
    detailModal.querySelector('input#rateNumber').value = productInfo.rateNumber || 0
    detailModal.querySelector('img#image').src = productInfo.img?.path || '/images/default-product.png'

    // Brand
    const brandSelect = detailModal.querySelector('select#brand')
    brandSelect.innerHTML = ''
    brands.forEach(b => {
      const opt = document.createElement('option')
      opt.value = b.name
      opt.textContent = b.name
      if (b.name === productInfo.brand) opt.selected = true
      brandSelect.appendChild(opt)
    })

    // Status
    const statusSelect = detailModal.querySelector('select#status')
    statusSelect.innerHTML = ''
    productStatuses.forEach(s => {
      const opt = document.createElement('option')
      opt.value = s.code
      opt.textContent = s.name
      if (s.code === productInfo.status) opt.selected = true
      statusSelect.appendChild(opt)
    })

    // Hiển thị dòng sản phẩm phù hợp
    detailModal.querySelector('select#categories').value = productInfo.categories

    const skincareBox = detailModal.querySelector('select#skincare')
    const makeupBox = detailModal.querySelector('select#makeup')
    if (productInfo.categories === 'skincare') {
      skincareBox.style.display = 'block'
      makeupBox.style.display = 'none'
      detailModal.querySelector('select#skincare').value = productInfo.skincare || ''
    } else if (productInfo.categories === 'makeup') {
      skincareBox.style.display = 'none'
      makeupBox.style.display = 'block'
      detailModal.querySelector('select#makeup').value = productInfo.makeup || ''
    } else {
      skincareBox.style.display = 'none'
      makeupBox.style.display = 'none'
    }

    // Xử lý thay đổi category
    detailModal.querySelector('select#categories').onchange = function () {
      const val = this.value
      if (val === 'skincare') {
        skincareBox.style.display = 'block'
        makeupBox.style.display = 'none'
      } else if (val === 'makeup') {
        skincareBox.style.display = 'none'
        makeupBox.style.display = 'block'
      } else {
        skincareBox.style.display = 'none'
        makeupBox.style.display = 'none'
      }
    }

    // Format số khi nhập
    formatInputNumber(detailModal.querySelector('input#oldPrice'))
    formatInputNumber(detailModal.querySelector('input#price'))
    formatInputNumber(detailModal.querySelector('input#purchasePrice'))

    // Lưu để so sánh khi update
    currentProductInfo = { ...productInfo }

  } catch (err) {
    console.error('Error opening product detail:', err)
    pushNotification('An error occurred')
    detailModal.classList.remove('show')
  }
}

async function updateProduct() {
  if (!currentProductInfo) return

  const categories    = detailModal.querySelector('select#categories').value
  const skincare      = detailModal.querySelector('select#skincare').value || ''
  const makeup        = detailModal.querySelector('select#makeup').value || ''
  const brand         = detailModal.querySelector('select#brand').value
  const name          = detailModal.querySelector('input#name').value.trim()
  const oldPrice      = deFormatNumber(detailModal.querySelector('input#oldPrice').value)
  const price         = deFormatNumber(detailModal.querySelector('input#price').value)
  const purchasePrice = deFormatNumber(detailModal.querySelector('input#purchasePrice').value || '0')
  const description   = detailModal.querySelector('input#description').value
  const details       = detailModal.querySelector('input#details').value
  const guide         = detailModal.querySelector('input#guide').value
  const quantity      = detailModal.querySelector('input#quantity').value
  const status        = detailModal.querySelector('select#status').value

  // Kiểm tra thay đổi
  if (
    categories === currentProductInfo.categories &&
    skincare === (currentProductInfo.skincare || '') &&
    makeup === (currentProductInfo.makeup || '') &&
    brand === currentProductInfo.brand &&
    name === currentProductInfo.name &&
    oldPrice == currentProductInfo.oldPrice &&
    price == currentProductInfo.price &&
    purchasePrice == (currentProductInfo.purchasePrice || 0) &&
    description === currentProductInfo.description &&
    details === currentProductInfo.details &&
    guide === currentProductInfo.guide &&
    quantity == currentProductInfo.quantity &&
    status === currentProductInfo.status &&
    !imgPath.path
  ) {
    return pushNotification('Please update the information')
  }

  detailUpdateBtn.classList.add('loading')

  const payload = {
    id: currentProductInfo._id,
    categories, skincare, makeup, brand, name,
    oldPrice, price, purchasePrice,
    description, details, guide, quantity, status
  }
  if (imgPath.path) payload.img = imgPath.path

  const response = await fetch('/admin/all-products/product/updated', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })

  detailUpdateBtn.classList.remove('loading')

  if (!response.ok) {
    pushNotification('Cập nhật thất bại')
    return
  }

  const { error, message } = await response.json()
  if (error) return pushNotification(error)

  pushNotification(message)
  detailModal.classList.remove('show')
  imgPath.path = ''
  await getProducts(sortOptions, filterOptions, currentPage.page, 10)
}

detailUpdateBtn.onclick = () => updateProduct()

// CREATE MODAL
const createModal     = document.querySelector('#create-modal')
const createBtn       = document.querySelector('.create-btn')
const createCloseBtn  = createModal?.querySelector('.close-modal')
const createSubmitBtn = createModal?.querySelector('button[type="submit"]')
let createImgPath     = { path: '' }

const selectBox    = createModal.querySelector('select[name="categories"]')
const skincareBox  = createModal.querySelector('select[name="skincare"]').parentElement
const makeUpBox    = createModal.querySelector('select[name="makeup"]').parentElement

selectBox.onchange = function() {
  const selectedValue = selectBox.options[selectBox.selectedIndex].value;
  if (selectedValue === 'skincare') {
    skincareBox.style.display = ''
    makeUpBox.style.display = 'none'
  }
  if (selectedValue === 'makeup') {
    skincareBox.style.display = 'none'
    makeUpBox.style.display = ''
  }
}

formatInputNumber(createModal.querySelector('input[name="oldPrice"]'))
formatInputNumber(createModal.querySelector('input[name="price"]'))

if (createBtn) createBtn.onclick = () => createModal.classList.add('show')
if (createCloseBtn) createCloseBtn.onclick = () => createModal.classList.remove('show')
createModal?.addEventListener('click', e => { if (e.target === createModal) createModal.classList.remove('show') })

// Xử lý ảnh tạo mới
createModal?.querySelector('input#img')?.addEventListener('change', function () {
  const file = this.files[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = () => createImgPath.path = reader.result
    reader.readAsDataURL(file)
  }
})

async function createProduct() {
  const categories  = createModal.querySelector('select[name="categories"]')?.value
  const skincare    = createModal.querySelector('select[name="skincare"]')?.value || ''
  const makeup      = createModal.querySelector('select[name="makeup"]')?.value || ''
  const brand       = createModal.querySelector('select[name="brand"]')?.value
  const name        = createModal.querySelector('input#name')?.value.trim()
  const oldPrice    = deFormatNumber(createModal.querySelector('input#oldPrice')?.value || '0')
  const price       = deFormatNumber(createModal.querySelector('input#price')?.value || '0')
  const description = createModal.querySelector('input#description')?.value
  const details     = createModal.querySelector('input#details')?.value
  const guide       = createModal.querySelector('input#guide')?.value
  const status      = createModal.querySelector('select[name="status"]')?.value

  if (!categories || !brand || !name || !oldPrice || !price || !description || !details || !guide || !status || !createImgPath.path) {
    return pushNotification('Please fill in all information!')
  }

  const response = await fetch('/admin/all-products/product/created', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      categories, skincare, makeup, brand, name,
      oldPrice, price, description, details, guide, status,
      img: createImgPath.path
    })
  })

  if (!response.ok) throw new Error(`Response status: ${response.status}`)
  const { error, message } = await response.json()
  if (error) return pushNotification(error)

  pushNotification(message)
  createModal.classList.remove('show')
  createImgPath.path = ''
  await getProducts(sortOptions, filterOptions, currentPage.page, 10)
}

if (createSubmitBtn) createSubmitBtn.onclick = () => createProduct()

// DOM Loaded
window.addEventListener('DOMContentLoaded', async function loadData() {
  try {
    generateColumns()
    await getFilter()
    await getProducts(sortOptions, filterOptions, currentPage.page, 10)
    await sortAndFilter(getProducts, sortOptions, filterOptions, currentPage.page)
    await exportJs('BÁO CÁO DANH SÁCH SẢN PHẨM')
  } catch (err) {
    console.error('Error loading data:', err)
    pushNotification('An error occurred while loading data')
  }
})