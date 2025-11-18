const headerBottom          = document.querySelector('headerBottom').querySelector('header')
const ordersQuantityBottom  = document.querySelector('headerBottom').querySelector('span.orders-quantity')
const searchIconBottom      = document.querySelector('headerBottom').querySelector('i.fi-br-search')
const searchInputBottom     = document.querySelector('headerBottom').querySelector('input#search-input')
const searchProductsBottom  = document.querySelector('headerBottom').querySelector('div#search-products')
const avatarBottom          = document.querySelector('headerBottom').querySelector('img.dropdown-avatar')
const avatarMenuBottom      = document.querySelector('headerBottom').querySelector('div.avatar-menu')
const menuBottom            = document.querySelector('headerBottom').querySelector('div.menu')

document.addEventListener('cartUpdated', updateCartCount)

document.addEventListener('click', function(event) {
  if (!event.target.matches('.dropdown-avatar') && !event.target.closest('.dropdown-avatar')) avatarMenuBottom.style.display = 'none'
})

async function checkUser() {
  while (typeof window?.isLoggedIn === 'undefined') {
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  if (window.isLoggedIn) {
    const updateProfileButton = document.createElement('a')
    updateProfileButton.innerText = 'Personal Information'
    updateProfileButton.setAttribute('href', `/profile/info/${window.uid}`)
    avatarMenuBottom.appendChild(updateProfileButton)
  
    const logOutButton = document.createElement('a')
    logOutButton.innerText = 'Sign Out'
    logOutButton.setAttribute('href', '/log-out')
    avatarMenuBottom.appendChild(logOutButton)
  } 
  else {
    const logInButton = document.createElement('a')
    logInButton.innerText = 'Sign In'
    logInButton.setAttribute('href', '/authentication/sign-in')
    avatarMenuBottom.appendChild(logInButton)
  }
}

function updateCartCount() {
  const countObject = JSON.parse(localStorage.getItem('product_cart_count')) || {};
  const countOrdersQuantity = countObject.localCounting || 0;
  ordersQuantityBottom.innerText = countOrdersQuantity
}

// create input element
searchIconBottom.onclick = function() {
  if(searchInputBottom.style.display === 'none') return searchInputBottom.style.display = ''
   
  searchProductsBottom.style.display = 'none' 
  searchInputBottom.style.display = 'none'
}

let timerBottom
searchInputBottom.oninput = async function(event) {
  searchProductsBottom.style.display = 'none'
  searchProductsBottom.querySelectorAll('div').forEach(element => element.remove())
  if (event.target.value.trim() === '') return

  clearTimeout(timerBottom)
  timerBottom = setTimeout(async function() {
    const response = await fetch('/data/search', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ query: event.target.value})
    })
    if (!response.ok) throw new Error(`Response status: ${response.status}`)
    const {data} = await response.json()

    searchProductsBottom.style.display = ''

    data.forEach((element) => {
      const div = document.createElement('div')
      div.classList.add('product')
      div.innerHTML = `
        <a 
          style="width: 65%; display:flex; align-items:center; justify-content:start; gap:5px"
          id="product-name"
          href="/all-products/product/${element._id}"
        >
          <img src="${element.img.path}" alt="${element.name}" loading="lazy" loading="lazy"> 
          ${element.name}
        </a>  
        <p style="width: 10%; text-align:right" id="product-price">${formatNumber(element.price)}</p>
      `

      document.querySelector('headerBottom').querySelector('div#search-products').appendChild(div)
    })
  }, 1000)

  return
}

avatarBottom.onclick = function() {
  avatarMenuBottom.style.display === 'none' ? avatarMenuBottom.style.display = '': avatarMenuBottom.style.display = 'none'
}

checkUser()
updateCartCount()