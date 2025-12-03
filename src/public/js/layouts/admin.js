const socket = io("https://beaute-chat.onrender.com/", { path: "/socket.io" })

async function checkRole() {
  try {
    const response = await fetch('/admin/all/data/user', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })
    const { data, error } = await response.json()
    if (error) throw new Error('Authorized error')
    const role = data.role
    const id   = data._id
    
    socket.emit('joinRoom', { id: id, room: 'admin-room' })
    return { 
      role: role, 
      id  : id
    }
  } catch (err) {
    console.error('checkRole error:', err.message)
    return null
  }
}

function updateNotification(message) {
  pushNotification(message)
  const currQuantity = parseInt(document.querySelector('div.admin-notification span.unread-quantity').textContent)
  document.querySelector('div.admin-notification span.unread-quantity').textContent = currQuantity + 1 
}

function initSocketEvents(role, adminId) {
  socket.on('order', () => {
    if (role === 'employee' || role === 'admin') updateNotification('You have a new order')
  })

  socket.on('account', () => {
    if (role === 'employee') updateNotification('You have a new customer')
  })

  socket.on('chat-message', (id) => {
    if (id === adminId) return
    if (role === 'chat' || role === 'admin') updateNotification('Bạn có tin nhắn mới')
  })
}

window.addEventListener('load', () => {
  const preloader = document.querySelector('div.preloader')
  preloader?.classList.add('inactive')
})

;(async function main() {
  const {role, id} = await checkRole()
  initSocketEvents(role, id)
})()