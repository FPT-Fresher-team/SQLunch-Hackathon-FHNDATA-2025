importLinkCss('/css/admin/all/trash.css') 

// ALL
const thead         = document.querySelector('table thead')
const tbody         = document.querySelector('table tbody')
const changeColumns = document.querySelector('i.fi.fi-rr-objects-column')
const sortOptions   = {}
const filterOptions = {}
const currentPage   = { page: 1 }
const dataSize      = { size: 0 }
const deleteForm    = document.forms['delete-form']
const restoreForm   = document.forms['restore-form']
const deleteButton  = document.getElementById('delete-button')
const restoreButton = document.getElementById('restore-button')
var blogId;

function generateColumns() {
  const columnsGroup = document.querySelector('div.checkbox-group')
  const inputList = `
    <label><input type="checkbox" value="featuredImage" checked> Image</label>
    <label><input type="checkbox" value="title" checked> Title</label>
    <label><input type="checkbox" value="category" checked> Category</label>
    <label><input type="checkbox" value="tags"> Tags</label>
    <label><input type="checkbox" value="status" checked> Status</label>
    <label><input type="checkbox" value="views" checked> Views</label>
    <label><input type="checkbox" value="publishedAt"> Published Date</label>
    <label><input type="checkbox" value="createdAt" checked> Created</label>
  `
  columnsGroup.insertAdjacentHTML('beforeend', inputList)
}

async function getDeletedBlogs(sortOptions, filterOptions, currentPage, itemsPerPage) {
  tbody.querySelectorAll('tr').forEach(tr => {
    const firstTd = tr.querySelector('td')
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

  const response = await fetch('/admin/all-blogs/data/deleted-blogs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })

  if (!response.ok) throw new Error(`Response status: ${response.status}`)
  const { data, data_size, error } = await response.json()
  if (error) return pushNotification(error)

  dataSize.size = data_size
  document.querySelector('div.board-title p').textContent = `Deleted: ${dataSize.size}`

  const selectedCols = Array.from(document.querySelectorAll('.checkbox-group input:checked'))
    .map(cb => ({ value: cb.value, label: cb.closest('label').innerText.trim() }))

  // Rebuild header
  thead.innerHTML = ''
  const headerRow = document.createElement('tr')
  headerRow.innerHTML = `<td>No</td>`
  selectedCols.forEach(col => headerRow.insertAdjacentHTML('beforeend', `<td>${col.label}</td>`))
  headerRow.insertAdjacentHTML('beforeend', `<td>Actions</td>`)
  thead.appendChild(headerRow)

  // Rebuild body
  tbody.innerHTML = ''
  data.forEach((blog, idx) => {
    const tr = document.createElement('tr')
    const no = idx + + (currentPage - 1) * itemsPerPage + 1

    tr.innerHTML = `<td>${no}</td>`

    selectedCols.forEach(col => {
      const td = document.createElement('td')
      let value = blog[col.value]

      if (col.value === 'featuredImage') {
        const img = blog.featuredImage?.path
          ? `<img src="${blog.featuredImage.path}" alt="thumb" style="width:50px;height:50px;object-fit:cover;border-radius:4px;">`
          : '<div style="width:50px;height:50px;background:#eee;border-radius:4px;"></div>'
        td.innerHTML = img
      }
      else if (col.value === 'title') {
        td.innerHTML = `<strong>${blog.title}</strong>`
      }
      else if (col.value === 'category') {
        td.textContent = blog.category?.name || '-'
      }
      else if (col.value === 'tags') {
        td.innerHTML = blog.tags?.length
          ? blog.tags.map(t => `<span class="tag">${t}</span>`).join(' ')
          : '<em style="color:#999">No tags</em>'
      }
      else if (col.value === 'status') {
        const color = blog.status === 'published' ? 'green' : 'orange'
        const text = blog.status === 'published' ? 'Published' : 'Draft'
        td.innerHTML = `<span style="color:${color};font-weight:bold">${text}</span>`
      }
      else if (col.value === 'views') {
        td.textContent = value || 0
        td.style.textAlign = 'right'
      }
      else if (col.value === 'publishedAt' || col.value === 'createdAt') {
        td.textContent = value ? formatDate(value) : '-'
        td.style.textAlign = 'center'
      }
      else {
        td.textContent = value ?? ''
      }
      tr.appendChild(td)
    })

    // Actions
    const actionTd = document.createElement('td')
    actionTd.style.textAlign = 'center'
    actionTd.innerHTML = `
      <button class="restore-btn"id="${blog._id}" onclick="clickToRestore(this.id)"><i class="fi fi-rr-undo"></i></button> 
      <button class="delete-btn" id="${blog._id}" onclick="clickToDelete(this.id)"><i class="fi fi-rr-trash"></i></button>
    `
    tr.appendChild(actionTd)

    tbody.appendChild(tr)
  })

  pagination(getDeletedBlogs, sortOptions, filterOptions, currentPage, dataSize.size)
}

function clickToDelete(clicked_id) {
  document.getElementById('delete-modal').classList.add('active')
  blogId = clicked_id
}

deleteButton.onclick = async function () {
  const response = await fetch('/admin/all-blogs/blog/delete', {
    method: 'DELETE',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({id: blogId})
  })
  if (!response.ok) throw new Error(`Response status: ${response.status}`)
  const {message, error} = await response.json()
  if (error) return pushNotification(error)

  pushNotification(message)
  document.getElementById('delete-modal').classList.remove('active')
  getDeletedBlogs(sortOptions, filterOptions, currentPage.page)
}

//restore button
function clickToRestore(clicked_id) {
  document.getElementById('restore-modal').classList.add('active')
  blogId = clicked_id
}

restoreButton.onclick = async function () {
  console.log(blogId)
  const response = await fetch('/admin/all-blogs/blog/restore', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({id: blogId})
  })
  if (!response.ok) throw new Error(`Response status: ${response.status}`)
  const {message, error} = await response.json()
  if (error) return pushNotification(error)

  pushNotification(message)
  document.getElementById('restore-modal').classList.remove('active')
  getDeletedBlogs(sortOptions, filterOptions, currentPage.page)
}

changeColumns.onclick = () => {
  const panel = document.querySelector('div.checkbox-group')
  panel.style.display = panel.style.display === 'none' ? 'block' : 'none'
}

window.addEventListener('DOMContentLoaded', async function loadData() {
  try {
    generateColumns()
    await getDeletedBlogs(sortOptions, filterOptions, currentPage.page, 10)
  } catch (error) {
    console.error('Error loading data:', error)
  }
})

function closeModal(id) {
  document.getElementById(id).classList.remove('active')
}