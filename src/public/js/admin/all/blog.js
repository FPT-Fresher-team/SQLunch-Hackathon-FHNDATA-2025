importLinkCss('/css/admin/all/blogs.css')

// MAIN TABLE
const thead         = document.querySelector('table thead')
const tbody         = document.querySelector('table tbody')
const changeColumns = document.querySelector('i.fi.fi-rr-objects-column')
const sortOptions   = {}
const filterOptions = { deletedAt: null }
const currentPage   = { page: 1 }
const dataSize      = { size: 0 }

// Soft Delete
let blogToDelete = null
const deleteModal   = document.getElementById('id01')
const deleteBtn     = document.getElementById('delete-button')

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

async function getBlogs(sortOptions, filterOptions, currentPage, itemsPerPage) {
  tbody.querySelectorAll('tr').forEach(tr => {
    const firstTd = tr.querySelector('td')
    if (firstTd) {
      firstTd.textContent = ''
      firstTd.classList.add('loading')
    }
  })

  const response = await fetch('/admin/all-blogs/data/blogs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sort: sortOptions, filter: filterOptions, page: currentPage, itemsPerPage: itemsPerPage })
  })

  if (!response.ok) throw new Error(`Response status: ${response.status}`)
  const { data, data_size, error } = await response.json()
  if (error) return pushNotification(error)

  dataSize.size = data_size
  document.querySelector('div.board-title p').textContent = `Blogs: ${dataSize.size}`

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
      <button class="view-btn">View</button>
      <button class="delete-btn" onclick="confirmDelete('${blog._id}', '${blog.title.replace(/'/g, "\\'")}')">
        Delete
      </button>
    `
    actionTd.querySelector('.view-btn').onclick = () => openBlogDetail(blog._id)
    tr.appendChild(actionTd)

    tbody.appendChild(tr)
  })

  pagination(getBlogs, sortOptions, filterOptions, currentPage, dataSize.size)
}

// Soft Delete Confirmation
function confirmDelete(id, title) {
  blogToDelete = id
  document.querySelector('#confirm-message').textContent = `Delete blog "${title}"? This action cannot be undone.`
  deleteModal.style.display = 'block'
}

deleteBtn.onclick = async () => {
  if (!blogToDelete) return
  deleteBtn.classList.add('loading')

  const res = await fetch('/admin/all-blogs/blog/soft-delete', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: blogToDelete })
  })

  deleteBtn.classList.remove('loading')
  deleteModal.style.display = 'none'

  if (!res.ok) return pushNotification('Delete failed')
  const { isValid, message } = await res.json()
  pushNotification(message)
  if (isValid) {
    blogToDelete = null
    await getBlogs(sortOptions, filterOptions, currentPage.page, 10)
  }
}

changeColumns.onclick = () => {
  const panel = document.querySelector('div.checkbox-group')
  panel.style.display = panel.style.display === 'none' ? 'block' : 'none'
}

// DETAIL / EDIT MODAL
const detailModal     = document.querySelector('#detail-modal')
const closeBtn        = detailModal.querySelector('.close-modal')
const updateBtn       = detailModal.querySelector('button[type="submit"]')
let currentBlog       = null
let imgPath           = { path: '' }

closeBtn.onclick = () => detailModal.classList.remove('show')
detailModal.onclick = e => { if (e.target === detailModal) detailModal.classList.remove('show') }

// Image preview
detailModal.querySelector('input#featuredImage')?.addEventListener('change', function () {
  const file = this.files[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = e => {
      imgPath.path = e.target.result
      detailModal.querySelector('img#preview').src = e.target.result
    }
    reader.readAsDataURL(file)
  }
})

async function openBlogDetail(blogId) {
  try {
    detailModal.classList.add('show')

    const res = await fetch('/admin/all-blogs/data/blog', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: blogId })
    })

    if (!res.ok) throw new Error(`Status: ${res.status}`)
    const { error, blogInfo } = await res.json()
    if (error) throw new Error(error)

    document.title = `${blogInfo.title} - Edit Blog`

    // Fill form
    detailModal.querySelector('input#id').value = blogInfo._id
    detailModal.querySelector('input#title').value = blogInfo.title || ''
    detailModal.querySelector('textarea#summary').value = blogInfo.summary || ''
    detailModal.querySelector('textarea#content').value = blogInfo.content || ''
    detailModal.querySelector('input#categoryName').value = blogInfo.category?.name || ''
    detailModal.querySelector('input#categorySlug').value = blogInfo.category?.slug || ''
    detailModal.querySelector('input#tags').value = blogInfo.tags?.join(', ') || ''
    detailModal.querySelector('select#status').value = blogInfo.status || 'draft'

    // Image
    const imgPreview = detailModal.querySelector('img#feature-image')
    if (blogInfo.featuredImage?.path) {
      imgPreview.src = blogInfo.featuredImage.path
    } else {
      imgPreview.src = '/images/default-blog.jpg'
    }

    // Save current state
    currentBlog = { ...blogInfo }
    imgPath.path = ''

  } catch (err) {
    console.error(err)
    pushNotification('Failed to load blog')
    detailModal.classList.remove('show')
  }
}

async function updateBlog() {
  if (!currentBlog) return

  const title        = detailModal.querySelector('#title').value.trim()
  const summary      = detailModal.querySelector('#summary').value.trim()
  const content      = detailModal.querySelector('#content').value.trim()
  const categoryName = detailModal.querySelector('#categoryName').value.trim()
  const categorySlug = detailModal.querySelector('#categorySlug').value.trim()
  const tags         = detailModal.querySelector('#tags').value.split(',').map(t => t.trim()).filter(Boolean)
  const status       = detailModal.querySelector('#status').value

  if (!title || !content) {
    return pushNotification('Title and content are required!')
  }

  // Auto set publishedAt when status changes to published
  let publishedAt = currentBlog.publishedAt
  if (status === 'published' && currentBlog.status !== 'published') {
    publishedAt = new Date().toISOString()
  } else if (status === 'draft') {
    publishedAt = null
  }

  const hasChanged =
    title !== currentBlog.title ||
    summary !== (currentBlog.summary || '') ||
    content !== (currentBlog.content || '') ||
    categoryName !== (currentBlog.category?.name || '') ||
    categorySlug !== (currentBlog.category?.slug || '') ||
    JSON.stringify(tags) !== JSON.stringify(currentBlog.tags || []) ||
    status !== currentBlog.status ||
    imgPath.path

  if (!hasChanged) {
    return pushNotification('Please update the information')
  }

  updateBtn.classList.add('loading')

  const payload = {
    id: currentBlog._id,
    title,
    summary,
    content,
    category: { name: categoryName, slug: categorySlug },
    tags,
    status,
    publishedAt
  }
  if (imgPath.path) payload.featuredImage = imgPath.path

  const res = await fetch('/admin/all-blogs/blog/updated', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })

  updateBtn.classList.remove('loading')
  if (!res.ok) return pushNotification('Update failed')

  const { error, message } = await res.json()
  if (error) return pushNotification(error)

  pushNotification(message)
  detailModal.classList.remove('show')
  imgPath.path = ''
  await getBlogs(sortOptions, filterOptions, currentPage.page, 10)
}

updateBtn.onclick = updateBlog

// CREATE MODAL
const createModal     = document.querySelector('#create-modal')
const createBtn       = document.querySelector('.create-btn')
const createCloseBtn  = createModal?.querySelector('.close-modal')
const createSubmitBtn = createModal?.querySelector('button[type="submit"]')
let createImgPath     = { path: '' }

createBtn.onclick = () => createModal.classList.add('show')
createCloseBtn.onclick = () => createModal.classList.remove('show')
createModal.onclick = e => { if (e.target === createModal) createModal.classList.remove('show') }

createModal.querySelector('input#featuredImage')?.addEventListener('change', function () {
  const file = this.files[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = e => createImgPath.path = e.target.result
    reader.readAsDataURL(file)
  }
})

async function createBlog() {
  const title   = createModal.querySelector('#title')?.value.trim()
  const summary = createModal.querySelector('#summary')?.value.trim()
  const content = createModal.querySelector('#content')?.value.trim()

  if (!title || !content || !createImgPath.path) {
    return pushNotification('Title, content, and image are required!')
  }

  const payload = {
    title,
    summary,
    content,
    featuredImage: createImgPath.path,
    status: 'draft'
  }

  const res = await fetch('/admin/all-blogs/blog/created', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })

  if (!res.ok) throw new Error(`Status: ${res.status}`)
  const { error, message } = await res.json()
  if (error) return pushNotification(error)

  pushNotification(message)
  createModal.classList.remove('show')
  createImgPath.path = ''
  await getBlogs(sortOptions, filterOptions, currentPage.page, 10)
}

createSubmitBtn.onclick = createBlog

// INIT
window.addEventListener('DOMContentLoaded', async () => {
  try {
    generateColumns()
    await getBlogs(sortOptions, filterOptions, currentPage.page, 10)
    await sortAndFilter(getBlogs, sortOptions, filterOptions, currentPage.page)
    await exportJs('BLOG LIST REPORT')
  } catch (error) {
    console.error('Error loading data:', error)
    pushNotification(error)
  }
})