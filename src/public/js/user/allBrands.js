importLinkCss('/css/user/allBrands.css')
const brands = document.querySelector('div.all-brands')

async function getBrands() {
  const response = await fetch('/all-brands/data/brands', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
  })
  if (!response.ok) throw new Error(`Response status: ${response.status}`)
  const {data} = await response.json()

  brands.querySelectorAll('div.brand').forEach((brand, index) => {
    brand.remove()
  })

  data.forEach((data) => {
    const container = document.createElement('div')
    container.classList.add('brand')

    const href = document.createElement('a')
    href.setAttribute('href', '/all-brands/brand/' + data._id)

    const img = document.createElement('img')
    img.setAttribute('src', data.img.path)
    img.setAttribute('alt', data.name)

    const span = document.createElement('span')
    span.textContent = data.name

    href.appendChild(img)
    href.appendChild(span)
    container.appendChild(href)
    brands.appendChild(container)
  })
}

async function loadData(retriesLeft) {
  try {
    getBrands()
  } catch (err) {
    if (retriesLeft > 1) {
      console.error(`Retrying... Attempts left: ${retriesLeft - 1}`)
      pushNotification('Error loading data. Retrying...')
      window.setTimeout(async function() {
        loadData(retriesLeft - 1)
      }, 2000)
    } else {
      console.error("Failed to fetch products after multiple attempts:", err)
      pushNotification(`Error loading data: ${err}. Please try again later`)
    }
  }
}

loadData(5)