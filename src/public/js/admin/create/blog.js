importLinkCss('/css/admin/create/blog.css')

const submitButton = document.querySelector('button[type="submit"]')
const img          = document.querySelector('input#img')
const imgPath      = { path: '' }

img.addEventListener('change', function () {
  const file = img.files[0]
  const reader = new FileReader()
  reader.onload = function () {
    imgPath.path = reader.result
  }
  reader.readAsDataURL(file)
})

async function createBlog() {
  try {
    const title     = document.querySelector('input#title').value.trim()
    const summary   = document.querySelector('textarea#summary').value.trim()
    const content   = document.querySelector('textarea#content').value.trim()
    const category  = document.querySelector('select#category').value
    const tags      = document.querySelector('input#tags').value
    const status    = document.querySelector('select#status').value
    const image     = imgPath.path

    // Validate required fields
    if (
      !title     ||
      !summary   ||
      !content   ||
      !category
    ) {
      pushNotification("Please fill in all required fields!")
      return
    }

    // Parse tags into array
    const tagsArray = tags
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0)

    const response = await fetch('/admin/all-blogs/blog/created', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        title      : title,
        summary    : summary,
        content    : content,
        category   : category,
        tags       : JSON.stringify(tagsArray),
        status     : status,
        image      : imgPath.path,
      })
    })

    if (!response.ok) throw new Error(`Response status: ${response.status}`)

    const {error, message} = await response.json()
    if (error) return pushNotification(error)
    pushNotification(message || "Blog created successfully!")

    // setTimeout(() => window.location.reload(), 2000)

  } catch (error) {
    console.error("Error creating blog:", error)
    pushNotification("An error occurred.")
  }
}

submitButton.onclick = function() {
  createBlog()
}