importLinkCss('/css/admin/create/material.css')

const submitButton = document.querySelector('button[type="submit"]')

formatInputNumber(document.querySelector('input[name="price"]'))

async function createProduct() {
  try {
    const supplierId       = document.querySelector('select[name="supplier"]').value
    const code             = document.querySelector('input#code').value
    const name             = document.querySelector('input#name').value
    const category         = document.querySelector('input#category').value
    const unit             = document.querySelector('input#unit').value
    const quantity         = document.querySelector('input#quantity').value
    const price            = deFormatNumber(document.querySelector('input#price').value)
    const description      = document.querySelector('input#description').value
    const certifications   = document.querySelector('input#certifications').value
    const expiry_date      = document.querySelector('input#expiry_date').value

    if (
      !supplierId     || 
      !code           || 
      !name           || 
      !category       || 
      !unit           || 
      !quantity       || 
      !price          || 
      !description    || 
      !certifications || 
      !expiry_date
    ) return pushNotification("Please fill in all information!")
  
    const response = await fetch('/admin/all-materials/material/created', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        supplierId      : supplierId,
        code            : code,
        name            : name,
        category        : category,
        unit            : unit,
        quantity        : quantity,
        price           : price,
        description     : description,
        certifications  : certifications,
        expiry_date     : expiry_date,
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