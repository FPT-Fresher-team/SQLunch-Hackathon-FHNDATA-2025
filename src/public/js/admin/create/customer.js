importLinkCss('/css/admin/create/customer.css')

const submitButton = document.querySelector('button[type="submit"]')

async function createCustomer() {
  try {
    const name     = document.querySelector('input#name').value
    const email    = document.querySelector('input#email').value
    const phone    = document.querySelector('input#phone').value
    const address  = document.querySelector('input#address').value
    const password = document.querySelector('input#password').value

    if (
      !name     || 
      !email    || 
      !phone    || 
      !address  || 
      !password
    ) {
      pushNotification("Please fill in all information!")
      return
    }

    const response = await fetch('/admin/all-customers/customer/created', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        name    : name,
        email   : email,
        phone   : phone,
        address : address,
        password: password,
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
  createCustomer()
}