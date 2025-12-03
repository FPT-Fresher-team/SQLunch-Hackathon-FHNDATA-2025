importLinkCss('/css/admin/all/blogs.css')

// ALL
const thead         = document.querySelector('table thead')
const tbody         = document.querySelector('table tbody')
const changeColumns = document.querySelector('i.fi.fi-rr-objects-column')
const sortOptions   = {}
const filterOptions = { deletedAt: null }
const currentPage   = { page: 1 }
const dataSize      = { size: 0 }
const searchInput   = document.querySelector('input#search-input')

// Soft Delete
const deleteModal   = document.getElementById('id01')
const deleteButton  = document.getElementById('deletebtn')
let blogToDelete    = null

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
  // Show loading state on the first column (No)
  tbody.querySelectorAll('tr').forEach(tr => {
    const firstTd = tr.querySelector('td:nth-child(1)');
    if (firstTd) {
      firstTd.textContent = '';
      firstTd.classList.add('loading');
    }
  });

  const payload = {
    page: currentPage,
    itemsPerPage: itemsPerPage,
    sort: sortOptions,
    filter: filterOptions
  };

  if (searchInput.value.trim()) payload.searchQuery = searchInput.value.trim();

  const response = await fetch('/admin/all-blogs/data/blogs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) throw new Error(`Response status: ${response.status}`);
  const { data, data_size, error } = await response.json();
  if (error) return pushNotification(error);

  // Update total count
  dataSize.size = data_size;
  document.querySelector('div.board-title p').textContent = 'Blogs: ' + dataSize.size;

  const selected = Array.from(document.querySelectorAll('.checkbox-group input[type="checkbox"]'))
    .slice(1)  // Skip the very first checkbox (the "Select All")
    .filter(cb => cb.checked)
    .map(cb => ({
      value: cb.value,
      name: cb.closest("label").innerText.trim()
    }));

  thead.querySelectorAll('tr').forEach((tr, index) => {
    tr.remove()
  })

  // HEADER
  const trHead = document.createElement("tr")

  const headData = document.createElement('td')
  headData.textContent = 'No'
  trHead.appendChild(headData)

  selected.forEach(col => {
    const td = document.createElement("td")
    td.textContent = col.name
    trHead.appendChild(td)
  })

  const headLink = document.createElement('td')
  headLink.textContent = 'Actions'
  trHead.appendChild(headLink)

  thead.appendChild(trHead)

  // BODY
  tbody.querySelectorAll('tr').forEach((tr, index) => {
    tr.remove()
  })

  data.forEach((blog, index) => {
    const tr = document.createElement('tr');

    // No column
    const tdNo = document.createElement('td');
    tdNo.textContent = index + (currentPage - 1) * itemsPerPage + 1;
    tr.appendChild(tdNo);

    // Dynamic selected columns
    selected.forEach(col => {
      const td = document.createElement("td");
      const value = blog[col.value];

      if (col.value === 'featuredImage') {
        const imgPath = blog.featuredImage?.path;
        td.innerHTML = imgPath
          ? `<img src="${imgPath}" alt="thumb" style="width:50px;height:50px;object-fit:cover;border-radius:4px;">`
          : '<div style="width:50px;height:50px;background:#eee;border-radius:4px;"></div>';
      } 
      else if (col.value === 'title') {
        td.innerHTML = `<strong>${value || ''}</strong>`;
      } 
      else if (col.value === 'category') {
        td.textContent = blog.category || '-';
      } 
      else if (col.value === 'tags') {
        td.innerHTML = blog.tags?.length
          ? blog.tags.map(t => `<span class="tag">${t}</span>`).join(' ')
          : '<em style="color:#999">No tags</em>';
      } 
      else if (col.value === 'status') {
        const isPublished = blog.status === 'published';
        td.innerHTML = `<span style="color:${isPublished ? 'green' : 'orange'};font-weight:bold">
                          ${isPublished ? 'Published' : 'Draft'}
                        </span>`;
      } 
      else if (col.value === 'views') {
        td.textContent = value || 0;
        td.style.textAlign = 'right';
      } 
      else if (col.value === 'publishedAt' || col.value === 'createdAt') {
        td.textContent = value ? formatDate(value) : '-';
        td.style.textAlign = 'center';
      } 
      else {
        td.textContent = value ?? '';
      }

      tr.appendChild(td);
    });

    // Actions column
    const tdActions = document.createElement('td');
    tdActions.style.textAlign = 'center';
    tdActions.innerHTML = `
      <button class="view-btn"   id="${blog._id}"><i class="fi fi-rr-eye"></i></button>
      <button class="delete-btn" id="${blog._id}"><i class="fi fi-rr-trash"></i></button>
    `;

    tdActions.querySelector('.view-btn').onclick = () => openBlogDetail(blog._id);
    // Optional: add delete handler
    // tdActions.querySelector('.delete-btn').onclick = () => deleteBlog(blog._id);

    tr.appendChild(tdActions);
    tbody.appendChild(tr);
  });

  // Update pagination
  pagination(getBlogs, sortOptions, filterOptions, currentPage, dataSize.size);
}

deleteButton.onclick = async function () {
  if (!blogToDelete) return

  deleteButton.classList.add('loading')

  const response = await fetch('/admin/all-blogs/blog/soft-delete', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: blogToDelete })
  })

  deleteButton.classList.remove('loading')
  deleteModal.style.display = 'none'

  if (!response.ok) {
    pushNotification('Failed to delete')
    return
  }

  const { isValid, message } = await response.json()
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
      detailModal.querySelector('img#feature-image').src = e.target.result
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
    detailModal.querySelector('input#categoryName').value = blogInfo.category || ''
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
  try {
    if (!currentBlog) return;

    const title        = detailModal.querySelector('#title').value.trim();
    const summary      = detailModal.querySelector('#summary').value.trim();
    const content      = detailModal.querySelector('#content').value.trim();
    const categoryName = detailModal.querySelector('#categoryName').value.trim();
    const tags         = detailModal.querySelector('#tags').value;
    const status       = detailModal.querySelector('#status').value;

    if (!title || !content) {
      return pushNotification('Title and content are required!', 'error');
    }

    // Build payload
    const payload = {
      id: currentBlog._id,
      title,
      summary,
      content,
      categoryName,
      tags,
      status,
      // Only send oldImageId if we have current image in DB
      oldImageId: currentBlog.img?.filename || null
    };

    // If user uploaded a NEW image → send base64 + keep oldImageId for cleanup
    if (imgPath.path) {
      payload.img = imgPath.path; // this is base64 data URL
    }

    // Auto-set publishedAt on frontend? → Let backend handle this safely!
    // (We removed frontend logic – backend is the source of truth)

    updateBtn.classList.add('loading');

    const res = await fetch('/admin/all-blogs/blog/updated', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (!res.ok || data.error) {
      throw new Error(data.error || 'Update failed');
    }

    pushNotification(data.message || 'Blog updated successfully!', 'success');
    
    // Reset & refresh
    detailModal.classList.remove('show');
    imgPath.path = ''; // clear preview
    await getBlogs(sortOptions, filterOptions, currentPage.page, 10);

  } catch (error) {
    console.error('Update blog error:', error);
    pushNotification(error.message || 'Failed to update blog', 'error');
  } finally {
    updateBtn.classList.remove('loading');
  }
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
  try {
    const title   = createModal.querySelector('#title')?.value.trim()
    const summary = createModal.querySelector('#summary')?.value.trim()
    const content = createModal.querySelector('#content')?.value.trim()
    const category = createModal.querySelector('#categoryName')?.value.trim()
    const tags    = createModal.querySelector('#tags')?.value.trim()

    if (!title || !content || !createImgPath.path) {
      return pushNotification('Title, content, and image are required!')
    }

    const payload = {
      title,
      summary,
      content,
      image: createImgPath.path,
      category,
      tags,
      status: 'draft'
    }

    createSubmitBtn.classList.add('loading')
    const res = await fetch('/admin/all-blogs/blog/created', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    if (!res.ok) throw new Error('Created Failed')
    const { error, message } = await res.json()
    if (error) throw new Error(error)

    pushNotification(message)
    createModal.classList.remove('show')
    createSubmitBtn.classList.remove('loading')
    createImgPath.path = ''
    await getBlogs(sortOptions, filterOptions, currentPage.page, 10)
  } catch (error) {
    console.error('Error creating blog:', error)
    pushNotification("Blog creation failed")
    createSubmitBtn.classList.remove('loading')
  }
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

// Đặt ở cuối file, sau khi DOM load
document.addEventListener('click', function(e) {
  const deleteBtn = e.target.closest('.delete-btn')
  if (!deleteBtn) return

  const row = deleteBtn.closest('tr')
  const blogId = row.querySelector('.view-btn').id
  const blogName = row.querySelector('td:nth-child(3)')?.textContent || 'this blog'

  blogToDelete = blogId
  document.querySelector('p#confirm-message').textContent =
    `Do you want to delete the blog "${blogName}"?`

  deleteModal.style.display = 'flex'
})