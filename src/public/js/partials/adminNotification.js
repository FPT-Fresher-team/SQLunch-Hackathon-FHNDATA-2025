const notificationIcon = document.querySelector('div.admin-notification')
const notificationBody = document.querySelector('div.notification-box')
const readAllIcon = notificationBody.querySelector('i.fi.fi-rr-progress-complete')

socket.on('order', async function(id) {
  getNotification()
})

notificationIcon.onclick = function() {
  notificationBody.style.display = notificationBody.style.display === 'none' ? 'block' : 'none'
}

readAllIcon.onclick = async function() {
  const response = await fetch('/admin/all/update/all-notifications', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
  })
  if (!response.ok) throw new Error(`Response status: ${response.status}`)
  const {data, error} = await response.json()
  if (error) return pushNotification(error)
  getNotification()
}

async function getNotification() {
  const response = await fetch('/admin/all/data/notification', {
    method: 'GET',
    headers: {'Content-Type': 'application/json'},
  })
  if (!response.ok) throw new Error(`Response status: ${response.status}`)
  const {data, error} = await response.json()
  if (error) return pushNotification(error)

  notificationBody.querySelector('div.box-content').querySelectorAll('div.notification-details').forEach((div) => {
    div.remove()
  })
    
  let unreadQuantity = 0
  data.forEach((item, index) => {
    const id = item.message.split(':')[1].trim()
    const newNotification = document.createElement('div')
    newNotification.classList.add('notification-details')
    if (item.isRead === false) {
      newNotification.classList.add('unread')
      unreadQuantity++
    } 
    newNotification.innerHTML = `
      <img src="https://res.cloudinary.com/bunny-store/image/upload/v1763438302/web-img/Thi%E1%BA%BFt_k%E1%BA%BF_ch%C6%B0a_c%C3%B3_t%C3%AAn_zd0z3o.svg" alt="loading">
      <a href='/admin/all-orders/order/${id}'>${formatDate(item.createdAt)}: ${item.message}</a>
    `
    newNotification.onclick = async function() {
      const response = await fetch('/admin/all/update/notification', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          id: item._id
        })
      })
      if (!response.ok) throw new Error(`Response status: ${response.status}`)
      const {message, error} = await response.json()
      if (error) return pushNotification(error)
    }
    notificationBody.querySelector('div.box-content').appendChild(newNotification)
  })
  notificationIcon.querySelector('span.unread-quantity').textContent = unreadQuantity
}

window.addEventListener('DOMContentLoaded', getNotification)