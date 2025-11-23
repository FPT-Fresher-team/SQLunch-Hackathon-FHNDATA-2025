let currentPage = 1
const blogsPerPage = 10
let allBlogs = []
let filteredBlogs = []

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  loadBlogs()
  setupEventListeners()
})

// Fetch all blogs
async function loadBlogs() {
  try {
    const response = await fetch('/api/blogs/admin', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    })

    const data = await response.json()
    
    if (data.blogs) {
      allBlogs = data.blogs
      filteredBlogs = [...allBlogs]
      
      // Load categories for filter
      loadCategories()
      
      // Initial render
      renderBlogsTable(1)
    } else {
      showError(data.error || 'Failed to load blogs')
    }
  } catch (error) {
    console.error('Error loading blogs:', error)
    showError('Error loading blogs')
  }
}

// Load unique categories
function loadCategories() {
  const categories = new Set()
  allBlogs.forEach(blog => {
    if (blog.category && blog.category.name) {
      categories.add(blog.category.name)
    }
  })

  const categoryFilter = document.getElementById('categoryFilter')
  categories.forEach(category => {
    const option = document.createElement('option')
    option.value = category
    option.textContent = category
    categoryFilter.appendChild(option)
  })
}

// Setup event listeners
function setupEventListeners() {
  const searchInput = document.getElementById('searchInput')
  const categoryFilter = document.getElementById('categoryFilter')
  const statusFilter = document.getElementById('statusFilter')
  const resetBtn = document.getElementById('resetFilters')
  const prevBtn = document.getElementById('prevBtn')
  const nextBtn = document.getElementById('nextBtn')

  searchInput.addEventListener('input', applyFilters)
  categoryFilter.addEventListener('change', applyFilters)
  statusFilter.addEventListener('change', applyFilters)
  resetBtn.addEventListener('click', resetFilters)
  prevBtn.addEventListener('click', () => changePage(-1))
  nextBtn.addEventListener('click', () => changePage(1))
}

// Apply filters
function applyFilters() {
  const searchTerm = document.getElementById('searchInput').value.toLowerCase()
  const category = document.getElementById('categoryFilter').value
  const status = document.getElementById('statusFilter').value

  filteredBlogs = allBlogs.filter(blog => {
    const matchesSearch = blog.title.toLowerCase().includes(searchTerm) ||
                         blog.summary.toLowerCase().includes(searchTerm)
    const matchesCategory = !category || (blog.category && blog.category.name === category)
    const matchesStatus = !status || blog.status === status

    return matchesSearch && matchesCategory && matchesStatus
  })

  currentPage = 1
  renderBlogsTable(currentPage)
}

// Reset filters
function resetFilters() {
  document.getElementById('searchInput').value = ''
  document.getElementById('categoryFilter').value = ''
  document.getElementById('statusFilter').value = ''
  
  filteredBlogs = [...allBlogs]
  currentPage = 1
  renderBlogsTable(currentPage)
}

// Render blogs table
function renderBlogsTable(page) {
  const tbody = document.getElementById('blogsTableBody')
  const startIndex = (page - 1) * blogsPerPage
  const endIndex = startIndex + blogsPerPage
  const blogs = filteredBlogs.slice(startIndex, endIndex)

  if (blogs.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center">No blogs found</td></tr>'
    updatePagination()
    return
  }

  tbody.innerHTML = blogs.map(blog => {
    const publishDate = blog.publishedAt 
      ? new Date(blog.publishedAt).toLocaleDateString('en-US')
      : 'Not published'
    
    return `
      <tr data-blog-id="${blog._id}">
        <td>${blog.title}</td>
        <td>${blog.category?.name || 'General'}</td>
        <td>
          <span class="status-badge status-${blog.status}">
            ${blog.status.charAt(0).toUpperCase() + blog.status.slice(1)}
          </span>
        </td>
        <td>${blog.views || 0}</td>
        <td>${publishDate}</td>
        <td class="actions">
          <a href="/admin/blog/${blog._id}" class="btn-sm btn-edit" title="Edit">Edit</a>
          <button class="btn-sm btn-delete" onclick="deleteBlog('${blog._id}')" title="Delete">Delete</button>
        </td>
      </tr>
    `
  }).join('')

  updatePagination()
}

// Update pagination
function updatePagination() {
  const totalPages = Math.ceil(filteredBlogs.length / blogsPerPage)
  const pageInfo = document.getElementById('pageInfo')
  const prevBtn = document.getElementById('prevBtn')
  const nextBtn = document.getElementById('nextBtn')

  pageInfo.textContent = `Page ${currentPage} of ${totalPages}`
  prevBtn.disabled = currentPage === 1
  nextBtn.disabled = currentPage === totalPages
}

// Change page
function changePage(direction) {
  const totalPages = Math.ceil(filteredBlogs.length / blogsPerPage)
  const newPage = currentPage + direction

  if (newPage >= 1 && newPage <= totalPages) {
    currentPage = newPage
    renderBlogsTable(currentPage)
    window.scrollTo(0, 0)
  }
}

// Delete blog
async function deleteBlog(blogId) {
  if (!confirm('Are you sure you want to delete this blog? This action cannot be undone.')) {
    return
  }

  try {
    const response = await fetch('/api/blogs/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: blogId })
    })

    const data = await response.json()

    if (data.message) {
      // Remove from local arrays
      allBlogs = allBlogs.filter(b => b._id !== blogId)
      filteredBlogs = filteredBlogs.filter(b => b._id !== blogId)
      
      // Re-render table
      renderBlogsTable(currentPage)
      showSuccess('Blog deleted successfully')
    } else {
      showError(data.error || 'Failed to delete blog')
    }
  } catch (error) {
    console.error('Error deleting blog:', error)
    showError('Error deleting blog')
  }
}

// Show success message
function showSuccess(message) {
  const alert = document.createElement('div')
  alert.className = 'alert alert-success'
  alert.textContent = message
  document.body.appendChild(alert)

  setTimeout(() => {
    alert.remove()
  }, 3000)
}

// Show error message
function showError(message) {
  const alert = document.createElement('div')
  alert.className = 'alert alert-error'
  alert.textContent = message
  document.body.appendChild(alert)

  setTimeout(() => {
    alert.remove()
  }, 3000)
}
