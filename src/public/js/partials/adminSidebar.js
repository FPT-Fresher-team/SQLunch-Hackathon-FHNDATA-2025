import { permissions, menuConfig, footerMenu } from '../helpers/permission.js'

const checkDay = {message: ''}
const index    = new URL(window.location).pathname.split('/').find(el => el.includes('all')) || []

if (window.innerWidth <= 800) {
  document.querySelector('div.admin-sidebar-container').classList.add('small')
}

async function getProfile() {
  const response = await fetch('/admin/all/data/user')
  const json = await response.json()
  if (json.error) return pushNotification(error)
  
  const data = json.data

  const currentTime = new Date().getHours()
  if      (currentTime <= 9) checkDay.message  = 'Good morning'
  else if (currentTime <= 14) checkDay.message = 'Good afternoon'
  else if (currentTime <= 18) checkDay.message = 'Good evening'
  else    checkDay.message = 'Good night'
  document.getElementById('welcome-text').innerHTML = `Hello ${data.name}, Have a ${checkDay.message}!!!`

  const sidebar = document.querySelector('div.admin-button')
  menuConfig.forEach(item => {
    if (permissions[item.permission].includes(data.role)) {
      const a = document.createElement("a")
      a.href = item.href
      a.className = "sidebar-button"
      a.id = item.id
      a.innerHTML = `<i class="${item.icon}"></i><p>${item.label}</p>`
      sidebar.appendChild(a)
    }
  })

  footerMenu.forEach(item => {
    const a = document.createElement("a")
    a.href = item.href
    a.className = "sidebar-button"
    a.id = item.id
    a.innerHTML = `<i class="${item.icon}"></i><p>${item.label}</p>`
    sidebar.appendChild(a)
  })

  document.querySelector('div.admin-button').querySelectorAll('a').forEach((a) => {
    if (index === a.id) {
      a.classList.add('active')
    } 
    return 
  })
}

document.querySelector('button.resize-button').onclick = function() {
  const adminSidebar = document.querySelector('div.admin-sidebar-container')
  const main = document.querySelector('main')
  const minimize = document.querySelector('i.fi-rr-cross')
  const maximize = document.querySelector('i.fi-rr-menu-burger')

  if (adminSidebar.className.includes('small')) {
    adminSidebar.classList.remove('small')
    main.style.marginLeft = '210px'
    minimize.style.display = 'block'
    maximize.style.display = 'none'
  } else {
    adminSidebar.classList.add('small')
    main.style.marginLeft = '70px'
    minimize.style.display = 'none'
    maximize.style.display = 'block'
  }
}

window.addEventListener('DOMContentLoaded', getProfile)