importLinkCss('/css/admin/create/product.css')

const selectBox    = document.querySelector('select[name="categories"]')
const skincareBox  = document.querySelector('select[name="skincare"]').parentElement
const makeUpBox    = document.querySelector('select[name="makeup"]').parentElement
const submitButton = document.querySelector('button[type="submit"]')
const img          = document.querySelector('input#img')
const imgPath      = {path: ''}

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

formatInputNumber(document.querySelector('input[name="oldPrice"]'))

formatInputNumber(document.querySelector('input[name="price"]'))

img.addEventListener('change', function () {
  const file = img.files[0]; // Get the selected file
  const reader = new FileReader()
  reader.onload = function () {
    imgPath.path = reader.result; // Base64-encoded string
  }
  reader.readAsDataURL(file)
})

async function createProduct() {
  try {
    const categories  = document.querySelector('select[name="categories"]').value
    const skincare    = document.querySelector('select[name="skincare"]').value
    const makeup      = document.querySelector('select[name="makeup"]').value
    const brand       = document.querySelector('select[name="brand"]').value
    const name        = document.querySelector('input#name').value
    const oldPrice    = deFormatNumber(document.querySelector('input#oldPrice').value) 
    const price       = deFormatNumber(document.querySelector('input#price').value)
    const description = document.querySelector('input#description').value
    const details     = document.querySelector('input#details').value
    const guide       = document.querySelector('input#guide ').value
    const status      = document.querySelector('select[name="status"]').value
  
    if (
      !categories   || 
      !brand        || 
      !name         || 
      !oldPrice     || 
      !price        || 
      !description  || 
      !details      || 
      !guide        || 
      !status       || 
      !img 
    ) return pushNotification("Please fill in all information!")
  
    const response = await fetch('/admin/all-products/product/created', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        categories  : categories,
        skincare    : skincare,
        makeup      : makeup,
        brand       : brand,
        name        : name,
        oldPrice    : oldPrice,
        price       : price,
        description : description,
        details     : details,
        guide       : guide,
        status      : status,
        img         : imgPath.path,
      })
    })
    if (!response.ok) throw new Error(`Response status: ${response.status}`)
    const {error, message} = await response.json()
    if (error) return pushNotification(error)
    pushNotification(message)
  
    setTimeout(() => window.location.reload(), 2000)
  } catch (error) {
    console.error('Error creating customer:', error)
    pushNotification("An error occurred.")
  }
}

submitButton.onclick = function() {
  createProduct()
}