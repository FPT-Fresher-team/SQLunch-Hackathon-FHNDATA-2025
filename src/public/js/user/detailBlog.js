importLinkCss('/css/user/detailBlog.css')

const blogId = window.location.pathname.split('/').pop()
let blogData = {}
let allBlogs = []

// DOM Elements
const blogImage = document.getElementById('blogImage')
const blogTitle = document.getElementById('blogTitle')
const blogAuthor = document.getElementById('blogAuthor')
const blogDate = document.getElementById('blogDate')
const blogViewCount = document.getElementById('blogViewCount')
const blogCategoryTag = document.getElementById('blogCategoryTag')
const blogSummary = document.getElementById('blogSummary')
const blogBody = document.getElementById('blogBody')
const blogTags = document.getElementById('blogTags')
const tagsSection = document.getElementById('tagsSection')
const bookmarkBtn = document.getElementById('bookmarkBtn')
const recentPostsList = document.getElementById('recentPostsList')
const relatedPostsSidebar = document.getElementById('relatedPostsSidebar')
const tagsCloud = document.getElementById('tagsCloud')
const relatedBlogsContainer = document.querySelector('.related-blogs-container')
const commentForm = document.getElementById('commentForm')
const commentsList = document.getElementById('commentsList')
const commentCount = document.getElementById('commentCount')

async function fetchBlog() {
  try {
    const response = await fetch('/all-blogs/data/blog', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: blogId })
    })
    if (!response.ok) throw new Error(`Response status: ${response.status}`)
    const { data, error } = await response.json()
    if (error) return pushNotification(error)

    blogData = data
    renderBlogDetail()
  } catch (error) {
    console.error('Error fetching blog:', error)
    pushNotification('Failed to load blog. Please try again later.')
  }
}

async function fetchAllBlogs() {
  try {
    const response = await fetch('/all-blogs/data/blogs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    })
    if (!response.ok) throw new Error(`Response status: ${response.status}`)
    const { data, error } = await response.json()
    if (error) return pushNotification(error)

    allBlogs = data.filter(b => b.status === 'published')
    renderRecentPosts()
    renderRelatedBlogs()
    renderTagsCloud()
    renderBlogNavigation()
  } catch (error) {
    console.error('Error fetching blogs:', error)
  }
}

function renderBlogDetail() {
  // Set page metadata
  document.title = blogData.title
  if (document.querySelector("meta[name='description']")) {
    document.querySelector("meta[name='description']").setAttribute('content', blogData.summary)
  }

  // Render header info
  blogImage.src = blogData.featuredImage?.path || '/images/placeholder.jpg'
  blogImage.alt = blogData.title
  blogTitle.textContent = blogData.title
  blogAuthor.textContent = 'Admin'
  blogDate.textContent = formatDate(blogData.publishedAt)
  blogViewCount.textContent = blogData.views || 0
  blogCategoryTag.textContent = blogData.category?.name || 'Uncategorized'

  // Render content
  blogSummary.textContent = blogData.summary
  blogBody.innerHTML = blogData.content || '<p>Content not available</p>'

  // Render tags
  if (blogData.tags && blogData.tags.length > 0) {
    tagsSection.style.display = 'block'
    blogTags.innerHTML = ''
    blogData.tags.forEach(tag => {
      const tagSpan = document.createElement('span')
      tagSpan.classList.add('tag')
      tagSpan.textContent = tag
      tagSpan.onclick = () => window.location.href = `/all-blogs?search=${encodeURIComponent(tag)}`
      blogTags.appendChild(tagSpan)
    })
  }

  // Check if bookmarked
  updateBookmarkButton()
}

function renderRecentPosts() {
  const recentBlogs = allBlogs.slice(0, 5)

  window.setTimeout(function() {
    recentPostsList.innerHTML = ''
    recentBlogs.forEach(blog => {
      const li = document.createElement('li')
      li.classList.add('post-item')

      const link = document.createElement('a')
      link.href = `/all-blogs/blog/${blog._id}`
      link.textContent = blog.title

      const small = document.createElement('small')
      small.textContent = formatDate(blog.publishedAt)

      li.appendChild(link)
      li.appendChild(small)
      recentPostsList.appendChild(li)
    })
  }, 300)
}

function renderRelatedBlogs() {
  const related = allBlogs.filter(b =>
    b.category?.name === blogData.category?.name && b._id !== blogData._id
  ).slice(0, 3)

  window.setTimeout(function() {
    // Sidebar related posts
    relatedPostsSidebar.innerHTML = ''
    related.forEach(blog => {
      const div = document.createElement('div')
      div.classList.add('related-post-item')

      const img = document.createElement('img')
      img.src = blog.featuredImage?.path || '/images/placeholder.jpg'
      img.alt = blog.title

      const link = document.createElement('a')
      link.href = `/all-blogs/blog/${blog._id}`
      link.textContent = blog.title

      div.appendChild(img)
      div.appendChild(link)
      relatedPostsSidebar.appendChild(div)
    })

    // Main section related blogs
    relatedBlogsContainer.innerHTML = ''
    related.forEach(blog => {
      const article = document.createElement('article')
      article.classList.add('related-blog-card')

      const imageDiv = document.createElement('div')
      imageDiv.classList.add('related-blog-image')
      const img = document.createElement('img')
      img.src = blog.featuredImage?.path || '/images/placeholder.jpg'
      img.alt = blog.title
      imageDiv.appendChild(img)

      const contentDiv = document.createElement('div')
      contentDiv.classList.add('related-blog-content')

      const category = document.createElement('span')
      category.classList.add('related-blog-category')
      category.textContent = blog.category?.name || 'Uncategorized'

      const title = document.createElement('h3')
      title.classList.add('related-blog-title')
      title.textContent = blog.title

      const summary = document.createElement('p')
      summary.classList.add('related-blog-summary')
      summary.textContent = blog.summary

      const readMore = document.createElement('a')
      readMore.classList.add('read-more')
      readMore.href = `/all-blogs/blog/${blog._id}`
      readMore.textContent = 'Read More →'

      contentDiv.appendChild(category)
      contentDiv.appendChild(title)
      contentDiv.appendChild(summary)
      contentDiv.appendChild(readMore)

      article.appendChild(imageDiv)
      article.appendChild(contentDiv)
      relatedBlogsContainer.appendChild(article)
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
    tagsCloud.innerHTML = ''
    uniqueTags.slice(0, 15).forEach(tag => {
      const span = document.createElement('span')
      span.classList.add('tag-item')
      span.textContent = tag
      span.style.opacity = 0.6 + (tagCounts[tag] / Math.max(...Object.values(tagCounts))) * 0.4
      span.onclick = () => window.location.href = `/all-blogs?search=${encodeURIComponent(tag)}`
      tagsCloud.appendChild(span)
    })
  }, 300)
}

function renderBlogNavigation() {
  const sortedBlogs = allBlogs.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
  const currentIndex = sortedBlogs.findIndex(b => b._id === blogData._id)

  if (currentIndex > 0) {
    const prevBlog = sortedBlogs[currentIndex - 1]
    const prevBtn = document.getElementById('prevBlogBtn')
    prevBtn.href = `/all-blogs/blog/${prevBlog._id}`
    document.getElementById('prevBlogTitle').textContent = prevBlog.title
    prevBtn.style.display = 'flex'
  }

  if (currentIndex < sortedBlogs.length - 1) {
    const nextBlog = sortedBlogs[currentIndex + 1]
    const nextBtn = document.getElementById('nextBlogBtn')
    nextBtn.href = `/all-blogs/blog/${nextBlog._id}`
    document.getElementById('nextBlogTitle').textContent = nextBlog.title
    nextBtn.style.display = 'flex'
  }
}

function toggleBookmark() {
  const bookmarks = JSON.parse(localStorage.getItem('bookmarkedBlogs') || '[]')
  const index = bookmarks.indexOf(blogData._id)

  if (index === -1) {
    bookmarks.push(blogData._id)
    bookmarkBtn.classList.add('active')
    pushNotification('Blog saved to bookmarks!')
  } else {
    bookmarks.splice(index, 1)
    bookmarkBtn.classList.remove('active')
    pushNotification('Blog removed from bookmarks!')
  }

  localStorage.setItem('bookmarkedBlogs', JSON.stringify(bookmarks))
}

function updateBookmarkButton() {
  const bookmarks = JSON.parse(localStorage.getItem('bookmarkedBlogs') || '[]')
  if (bookmarks.includes(blogData._id)) {
    bookmarkBtn.classList.add('active')
  }
}

function shareBlog() {
  if (navigator.share) {
    navigator.share({
      title: blogData.title,
      text: blogData.summary,
      url: window.location.href
    }).catch(err => console.log('Error sharing:', err))
  } else {
    // Fallback: copy to clipboard
    navigator.clipboard.writeText(window.location.href)
    pushNotification('Link copied to clipboard!')
  }
}

function subscribeNewsletter(event) {
  event.preventDefault()
  const email = event.target.querySelector('input[type="email"]').value
  pushNotification(`Thanks for subscribing with ${email}!`)
  event.target.reset()
}

// Load data on page load
window.addEventListener('DOMContentLoaded', () => {
  fetchBlog()
  fetchAllBlogs()
})