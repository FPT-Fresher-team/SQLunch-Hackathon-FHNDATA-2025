// Import CSS
importLinkCss('/css/admin/detail/blog.css')

// Extract blog ID from URL
const blogId = location.href.match(/\/admin\/blog\/([^\/]*)\/*$/)[1]

// Get form elements
const form = document.getElementById('editBlogForm')
const blogIdInput = document.getElementById('blogId')
const titleInput = document.getElementById('title')
const summaryInput = document.getElementById('summary')
const contentInput = document.getElementById('content')
const categorySelect = document.getElementById('category')
const tagsInput = document.getElementById('tags')
const statusSelect = document.getElementById('status')
const viewsInput = document.getElementById('views')
const publishedDateInput = document.getElementById('publishedDate')
const featuredImageInput = document.getElementById('featuredImage')
const img          = document.querySelector('input#img')
const imgPath      = {path: ''}

img.addEventListener('change', function () {
  const file = img.files[0]; // Get the selected file
  const reader = new FileReader()
  reader.onload = function () {
    imgPath.path = reader.result; // Base64-encoded string
  }
  reader.readAsDataURL(file)
})

let currentBlog = null

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  loadBlogData()
})

// Form submission
form.addEventListener('submit', async (e) => {
  e.preventDefault()
  await updateBlog()
})

// Load blog data
async function loadBlogData() {
  try {
    const response = await fetch('/admin/all-blogs/data/blog', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: blogId })
    })

    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`)
    }

    const data = await response.json()

    if (data.error) {
      pushNotification(data.error)
      setTimeout(() => {
        window.location.href = '/admin/blog'
      }, 1500)
      return
    }

    currentBlog = data.blogInfo
    populateForm()

  } catch (error) {
    console.error('Error loading blog:', error)
    pushNotification('Error loading blog data')
    setTimeout(() => {
      window.location.href = '/admin/blog'
    }, 1500)
  }
}

// Populate form with blog data
function populateForm() {
  blogIdInput.value = currentBlog._id
  titleInput.value = currentBlog.title || ''
  summaryInput.value = currentBlog.summary || ''
  contentInput.value = currentBlog.content || ''
  tagsInput.value = (currentBlog.tags || []).join(', ')
  statusSelect.value = currentBlog.status || 'draft'
  viewsInput.value = currentBlog.views || 0

  // Set category
  const categoryValue = JSON.stringify(currentBlog.category || { name: 'General', slug: 'general' })
  categorySelect.value = categoryValue

  // Set published date
  if (currentBlog.publishedAt) {
    publishedDateInput.value = new Date(currentBlog.publishedAt).toLocaleDateString('en-US')
  }

  document.title = `Edit: ${currentBlog.title}`
}

// Update blog
async function updateBlog() {
  try {
    // Validate required fields
    if (!titleInput.value.trim()) {
      pushNotification('Please enter a blog title')
      return
    }

    if (!summaryInput.value.trim()) {
      pushNotification('Please enter a blog summary')
      return
    }

    if (!contentInput.value.trim()) {
      pushNotification('Please enter blog content')
      return
    }

    if (!categorySelect.value) {
      pushNotification('Please select a category')
      return
    }

    // Parse tags
    const tagsArray = tagsInput.value
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0)

    // Handle featured image upload if changed
    let featuredImageData = currentBlog.featuredImage || { path: '', filename: '' }
    if (featuredImageInput.files.length > 0) {
      featuredImageData = await uploadFeaturedImage(featuredImageInput.files[0])
      if (!featuredImageData) return
    }

    // Prepare update data
    const updateData = {
      id: blogIdInput.value,
      title: titleInput.value.trim(),
      summary: summaryInput.value.trim(),
      content: contentInput.value.trim(),
      category: categorySelect.value,
      tags: JSON.stringify(tagsArray),
      status: statusSelect.value,
      featuredImage: JSON.stringify(featuredImageData)
    }

    // Submit update
    const response = await fetch('/api/blogs/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData)
    })

    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`)
    }

    const result = await response.json()

    if (result.error) {
      pushNotification(result.error)
      return
    }

    pushNotification('Blog updated successfully!')
    setTimeout(() => {
      window.location.href = '/admin/blog'
    }, 1500)

  } catch (error) {
    console.error('Error updating blog:', error)
    pushNotification('An error occurred while updating the blog')
  }
}