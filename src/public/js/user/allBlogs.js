importLinkCss('/css/user/allBlogs.css')

const ITEMS_PER_PAGE = 6
let currentPage = 1
let allBlogs = []
let filteredBlogs = []
const blogsList = document.querySelector('div.blogs-list')
const categoryFilter = document.getElementById('categoryFilter')
const blogSearch = document.getElementById('blogSearch')
const prevBtn = document.getElementById('prevBtn')
const nextBtn = document.getElementById('nextBtn')
const pageInfo = document.getElementById('pageInfo')
const recentPostsList = document.getElementById('recentPostsList')
const tagsCloud = document.getElementById('tagsCloud')

async function fetchBlogs() {
  try {
    const response = await fetch('/all-blogs/data/blogs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })
    if (!response.ok) throw new Error(`Response status: ${response.status}`)
    const { data, error } = await response.json()
    if (error) return pushNotification(error)

    allBlogs = data.filter(blog => blog.status === 'published')
    filteredBlogs = [...allBlogs]
    
    populateCategories()
    renderBlogs()
    renderRecentPosts()
    renderTagsCloud()
  } catch (error) {
    console.error('Error fetching blogs:', error)
    pushNotification('Failed to load blogs. Please try again later.')
  }
}

function populateCategories() {
  const categories = [...new Set(allBlogs.map(blog => blog.category?.name).filter(Boolean))]
  
  categories.forEach(category => {
    const option = document.createElement('option')
    option.value = category
    option.textContent = category
    categoryFilter.appendChild(option)
  })
}

function filterBlogs() {
  const category = categoryFilter.value
  const searchQuery = blogSearch.value.toLowerCase()

  filteredBlogs = allBlogs.filter(blog => {
    const matchCategory = !category || blog.category?.name === category
    const matchSearch = !searchQuery || 
      blog.title.toLowerCase().includes(searchQuery) ||
      blog.summary.toLowerCase().includes(searchQuery) ||
      blog.tags?.some(tag => tag.toLowerCase().includes(searchQuery))
    return matchCategory && matchSearch
  })

  currentPage = 1
  renderBlogs()
}

function renderBlogs() {
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedBlogs = filteredBlogs.slice(startIndex, endIndex)

  window.setTimeout(function() {
    blogsList.querySelectorAll('article.blog-card').forEach(card => card.remove())

    paginatedBlogs.forEach(blog => {
      const article = document.createElement('article')
      article.classList.add('blog-card')

      const imageDiv = document.createElement('div')
      imageDiv.classList.add('blog-image')
      const img = document.createElement('img')
      img.src = blog.featuredImage?.path || '/images/placeholder.jpg'
      img.alt = blog.title
      imageDiv.appendChild(img)

      const contentDiv = document.createElement('div')
      contentDiv.classList.add('blog-content')

      // Meta information
      const metaDiv = document.createElement('div')
      metaDiv.classList.add('blog-meta')

      const category = document.createElement('span')
      category.classList.add('blog-category')
      category.textContent = blog.category?.name || 'Uncategorized'
      metaDiv.appendChild(category)

      const date = document.createElement('span')
      date.classList.add('blog-date')
      date.innerHTML = `<i class="fi fi-rr-calendar"></i> ${formatDate(blog.publishedAt)}`
      metaDiv.appendChild(date)

      const views = document.createElement('span')
      views.classList.add('blog-views')
      views.innerHTML = `<i class="fi fi-rr-eye"></i> ${blog.views || 0} views`
      metaDiv.appendChild(views) 

      contentDiv.appendChild(metaDiv)

      // Title
      const title = document.createElement('h3')
      title.classList.add('blog-title')
      title.textContent = blog.title
      contentDiv.appendChild(title)

      // Summary
      const summary = document.createElement('p')
      summary.classList.add('blog-summary')
      summary.textContent = blog.summary
      contentDiv.appendChild(summary)

      // Tags
      if (blog.tags && blog.tags.length > 0) {
        const tagsDiv = document.createElement('div')
        tagsDiv.classList.add('blog-tags')
        blog.tags.slice(0, 3).forEach(tag => {
          const tagSpan = document.createElement('span')
          tagSpan.classList.add('tag')
          tagSpan.textContent = tag
          tagSpan.onclick = () => {
            blogSearch.value = tag
            filterBlogs()
          }
          tagsDiv.appendChild(tagSpan)
        })
        contentDiv.appendChild(tagsDiv)
      }

      // Read More Link
      const readMore = document.createElement('a')
      readMore.classList.add('read-more')
      readMore.href = `/all-blogs/blog/${blog._id}`
      readMore.textContent = 'Read More →'
      contentDiv.appendChild(readMore)

      article.appendChild(imageDiv)
      article.appendChild(contentDiv)
      blogsList.appendChild(article)
    })
  }, 300)

  updatePagination()
}

function updatePagination() {
  const totalPages = Math.ceil(filteredBlogs.length / ITEMS_PER_PAGE)
  
  prevBtn.disabled = currentPage === 1
  nextBtn.disabled = currentPage === totalPages || totalPages === 0
  
  pageInfo.textContent = `Page ${currentPage} of ${totalPages || 1}`
}

function renderRecentPosts() {
  const recentBlogs = allBlogs.slice(0, 5)

  window.setTimeout(function() {
    recentPostsList.querySelectorAll('li.post-item').forEach(item => item.remove())

    recentBlogs.forEach(blog => {
      const li = document.createElement('li')
      li.classList.add('post-item')
      
      const link = document.createElement('a')
      link.href = `/all-blogs/blog/${blog._id}`
      link.textContent = blog.title
      
      li.appendChild(link)
      recentPostsList.appendChild(li)
    })
  }, 300)
}

function renderTagsCloud() {
  const allTags = []
  allBlogs.forEach(blog => {
    if (blog.tags && Array.isArray(blog.tags)) {
      allTags.push(...blog.tags)
    }
  })
  
  const uniqueTags = [...new Set(allTags)]
  const tagCounts = {}
  allTags.forEach(tag => {
    tagCounts[tag] = (tagCounts[tag] || 0) + 1
  })

  window.setTimeout(function() {
    tagsCloud.querySelectorAll('span.tag-item').forEach(item => item.remove())

    uniqueTags.slice(0, 15).forEach(tag => {
      const span = document.createElement('span')
      span.classList.add('tag-item')
      span.textContent = tag
      span.style.opacity = 0.6 + (tagCounts[tag] / Math.max(...Object.values(tagCounts))) * 0.4
      span.onclick = () => {
        blogSearch.value = tag
        filterBlogs()
      }
      tagsCloud.appendChild(span)
    })
  }, 300)
}

// Event Listeners
categoryFilter.addEventListener('change', filterBlogs)
blogSearch.addEventListener('input', filterBlogs)

prevBtn.addEventListener('click', () => {
  if (currentPage > 1) {
    currentPage--
    renderBlogs()
    window.scrollTo({ top: document.querySelector('.user-all-blogs-container').offsetTop - 100, behavior: 'smooth' })
  }
})

nextBtn.addEventListener('click', () => {
  const totalPages = Math.ceil(filteredBlogs.length / ITEMS_PER_PAGE)
  if (currentPage < totalPages) {
    currentPage++
    renderBlogs()
    window.scrollTo({ top: document.querySelector('.user-all-blogs-container').offsetTop - 100, behavior: 'smooth' })
  }
})

// Load data on page load
window.addEventListener('DOMContentLoaded', () => {
  fetchBlogs()
})