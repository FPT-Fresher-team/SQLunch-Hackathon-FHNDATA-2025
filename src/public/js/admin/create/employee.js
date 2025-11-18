importLinkCss('/css/admin/create/employee.css')

const submitButton = document.querySelector('button[type="submit"]')

async function getPositions() {
  const response = await fetch('/admin/all-employees/data/positions', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
  })
  if (!response.ok) throw new Error(`Response status: ${response.status}`)
  const {data, error} = await response.json()
  if (error) return pushNotification(error)

  data.forEach((element) => {
    const option = document.createElement('option')
    option.value = element.code
    option.textContent = element.name
    document.querySelector('select[name="role"]').appendChild(option) 
  })

  return
}

async function createEmployee() {
  try {
    const role      = document.querySelector('select[name="role"]').value
    const name      = document.querySelector('input#name').value
    const email     = document.querySelector('input#email').value
    const phone     = document.querySelector('input#phone').value
    const address   = document.querySelector('input#address').value
    const password  = document.querySelector('input#password').value
    const confirmPassword = document.querySelector('input#password-confirm').value

    if (password !== confirmPassword) return pushNotification("Passwords do not match!")
  
    if (
      !name     || 
      !email    || 
      !phone    || 
      !address  || 
      !password || 
      !role     
    ) {
      return pushNotification("Please fill in all information!")
    }
  
    const response = await fetch('/admin/all-employees/employee/created', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        role      : role,
        name      : name,
        email     : email,
        phone     : phone,
        address   : address,
        password  : password,
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
  createEmployee()
}

window.addEventListener('DOMContentLoaded', async function loadData() {
  getPositions()
})