importLinkCss('/css/admin/create/store.css')

const submitButton = document.querySelector('button[type="submit"]')

async function createStore() {
  try {
    const name     = document.querySelector('input#name').value
    const address  = document.querySelector('input#address').value
    const details  = document.querySelector('input#details').value
  
    if (
      !name     || 
      !address  || 
      !details
    ) {
      pushNotification("Please fill in all information!")
      return
    }
  
    const response = await fetch('/admin/all-stores/store/created', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        name    : name,
        address : address,
        details : details,
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
  createStore()
}