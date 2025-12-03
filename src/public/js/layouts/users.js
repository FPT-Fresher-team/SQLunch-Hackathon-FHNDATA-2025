checkUser()
// const socket = io("http://localhost:3100/", {path: "/socket.io"})
const socket = io("https://beaute-chat.onrender.com/", {path: "/socket.io"})

async function checkUser() {
  const response = await fetch('/data/user')
  if (!response.ok) throw new Error(`Response status: ${response.status}`)
  const {message, uid} = await response.json()

  window.isLoggedIn = message
  window.uid = uid
}

window.addEventListener('DOMContentLoaded', async function() {
  const preloader = document.querySelector('div.preloader')
  preloader.classList.add('inactive')
})