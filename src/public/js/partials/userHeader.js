const header          = document.querySelector('header')
const ordersQuantity  = document.querySelector('span.orders-quantity')
const searchIcon      = document.querySelector('i.fi-br-search')
const searchInput     = document.querySelector('input#search-input')
const searchProducts  = document.querySelector('div#search-products')
const avatar          = document.querySelector('img.dropdown-avatar')
const avatarMenu      = document.querySelector('div.avatar-menu')
const menu            = document.querySelector('div.menu')
const responsiveMenu  = document.querySelector('div.responsive-menu')
var width = window.innerWidth

window.addEventListener('scroll', function() {
  document.documentElement.scrollTop > 0 ? header.classList.add('scroll') : header.classList.remove('scroll')
})

window.addEventListener("resize", function() {
  width = window.innerWidth
  setDisplay(width, menu)
})

document.addEventListener('cartUpdated', updateCartCount)

document.addEventListener('click', function(event) {
  if (!event.target.matches('.dropdown-avatar') && !event.target.closest('.dropdown-avatar')) avatarMenu.style.display = 'none'
})

async function checkUser() {
  // Wait until window.isLoggedIn is assigned
  while (typeof window?.isLoggedIn === 'undefined') {
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  if (window.isLoggedIn) {
    const updateProfileButton = document.createElement('a')
    updateProfileButton.innerText = 'Personal Information'
    updateProfileButton.setAttribute('href', '/profile/info')
    avatarMenu.appendChild(updateProfileButton)
  
    const logOutButton = document.createElement('a')
    logOutButton.innerText = 'Sign Out'
    logOutButton.setAttribute('href', '/log-out')
    // logOutButton.onclick = async function() {
    //   getLog(
    //     topic = 'auth-update', 
    //     value = {
    //       "user_id"     : window.uid,
    //       "update_type" : 'logout',
    //       "timestamp"   : new Date(),
    //     }
    //   )
    // }
    avatarMenu.appendChild(logOutButton)
  } 
  else {
    const logInButton = document.createElement('a')
    logInButton.innerText = 'Sign In'
    logInButton.setAttribute('href', '/authentication/sign-in')
    avatarMenu.appendChild(logInButton)
  }
}

function updateCartCount() {
  const countObject = JSON.parse(localStorage.getItem('product_cart_count')) || {};
  const countOrdersQuantity = countObject.localCounting || 0;
  ordersQuantity.innerText = countOrdersQuantity
}

function setDisplay(width, menu) {
  if (width < 700) menu.style.display = 'none'
  else menu.style.display = 'flex'
}

searchIcon.addEventListener('click', () => {
  searchInput.classList.toggle('open')
  searchInput.focus()
  searchProducts.classList.remove("open")
});

// create input element
// searchIcon.onclick = function() {
//   if(searchInput.style.display === 'none') return searchInput.style.display = ''
   
//   searchProducts.style.display = 'none' 
//   searchInput.style.display = 'none'
// }

let timer
searchInput.oninput = async function(event) {
  searchProducts.classList.remove("open")
  searchProducts.querySelectorAll('div.product').forEach(element => element.remove())
  
  clearTimeout(timer)
  timer = setTimeout(async function() {
    if (event.target.value.trim() === '') return
    const response = await fetch('/data/search', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ searchQuery: event.target.value})
    })
    if (!response.ok) throw new Error(`Response status: ${response.status}`)
    const {data} = await response.json()

    console.log(data)

    searchProducts.classList.add("open")

    data.forEach((element) => {
      const div = document.createElement('div')
      div.classList.add('product')
      div.innerHTML = `
        <p style="width: 15%">${element.brand}</p>
        <a 
          style="width: 65%; display:flex; align-items:center; justify-content:start; gap:5px"
          id="product-name"
          href="/all-products/product/${element._id}"
        >
          <img src="${element.img.path}" alt="${element.name}" loading="lazy" loading="lazy"> 
          ${element.name}
        </a>  
        <p style="width: 10%;">${element.categories === 'skincare' ? 'Skincare' : 'Makeup'}</p>
        <p style="width: 10%; text-align:right" id="product-price">${formatNumber(element.price)}</p>
      `

      searchProducts.appendChild(div)
    })
  }, 1000)

  return
}

avatar.onclick = function() {
  avatarMenu.style.display === 'none' ? avatarMenu.style.display = '': avatarMenu.style.display = 'none'
}

checkUser()
updateCartCount()
setDisplay(width, menu)