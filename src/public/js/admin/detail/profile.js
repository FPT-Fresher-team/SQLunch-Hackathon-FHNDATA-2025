importLinkCss('/css/admin/detail/profile.css')

async function getProfile() {
  try {
    const response = await fetch('/admin/all-personal-info/data/profile', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
    })
    if (!response.ok) throw new Error(`Response status: ${response.status}`)
    const {error, userInfo, positionsInfo} = await response.json()
    if (error) throw new Error(error)

    document.title = userInfo.name

    document.querySelector('input#id').value   = userInfo._id
    document.querySelector('input#name').value = userInfo.name

    positionsInfo.forEach((element, index) => {
      const option = document.createElement('option')
      option.value = element.code
      option.textContent = element.name
      if (element.code === userInfo.role) option.selected = true

      document.querySelector('select#role').appendChild(option)
    })

    document.querySelector('input#email').value    = userInfo.email
    document.querySelector('input#phone').value    = userInfo.phone
    document.querySelector('input#address').value  = userInfo.address
    document.querySelectorAll('input[name="gender"]').forEach((input) => {
      if (input.value === userInfo.gender) input.checked = true
    })

    document.querySelector('input#date').value = formatDate(userInfo.createdAt)

    return userInfo
  } catch (error) {
    console.log(error)
    pushNotification(error)
  }
  
}

async function updateProfile(userInfo) {
  try {
    const name    = document.querySelector('input#name').value
    const phone   = document.querySelector('input#phone').value
    const address = document.querySelector('input#address').value
    const gender  = document.querySelector('input[name="gender"]:checked').value
  
    if (
      name    === userInfo.name    &&
      phone   === userInfo.phone   &&
      address === userInfo.address &&
      gender  === userInfo.gender
    ) return pushNotification('Please update the information')
  
    const response = await fetch('/admin/all-personal-info/updated', {
      method: 'PUT',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        name    : name,
        phone   : phone,
        address : address,
        gender  : gender
      })
    })
    if (!response.ok) throw new Error(`Response status: ${response.status}`)
    const {error, message} = await response.json()
    if (error) throw new Error(error)
    pushNotification(message)
  
    setTimeout(() => window.location.reload(), 3000)
  } catch (error) {
    console.log(error)
    pushNotification(error)
  }
}

window.addEventListener('DOMContentLoaded', async function loadData() {
  try {
    const userInfo = await getProfile()

    document.querySelector('button[type="submit"]').onclick = function() {
      updateProfile(userInfo)
    }
  } catch (error) {
    console.error('An error occurred:', error)
    pushNotification('An error occurred')
  }
})