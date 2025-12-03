const socket = io("https://beaute-chat.onrender.com/", {path: "/socket.io"})

window.addEventListener('load', () => {
  const preloader = document.querySelector('div.preloader')
  preloader.classList.add('inactive')
})