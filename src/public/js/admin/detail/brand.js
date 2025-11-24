importLinkCss('/css/admin/detail/brand.css')

const urlSlug = location.href.match(/([^\/]*)\/*$/)[1]

async function getBrand() {
  const response = await fetch('/admin/all-brands/data/brand', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({id: urlSlug})
  })
  if (!response.ok) throw new Error(`Response status: ${response.status}`)
  const {error, brandInfo, productsInfo} = await response.json()
  if (error) return pushNotification('An error occurred')

  document.title = brandInfo.name

  document.querySelector('input#id').value        = brandInfo._id
  document.querySelector('input#name').value      = brandInfo.name
  document.querySelector('input#quantity').value  = brandInfo.totalProduct
  document.querySelector('input#total').value     = brandInfo.totalRevenue
  document.querySelector('input#details').value   = brandInfo.details

  productsInfo.forEach((product) => {
    const tr = document.createElement('tr')
    tr.innerHTML = `
      <td></td>
      <td style="
        display: flex; 
        justify-content: start;
        align-items: center;
        gap: 5px"
      >
        <img src="${product.img.path}" alt="${product.name}" loading="lazy">
        ${product.name}
      </td>
      <td>${product.quantity}</td>
      <td>${formatNumber(product.price)}</td>
      <td><a href="/admin/all-products/product/${product._id}">Xem</a></td>
  `
    document.querySelector('table#table-2').querySelector('tbody').appendChild(tr)
  })

  return brandInfo
}

async function updateBrand(brandInfo) {
  const details = document.querySelector('input#details').value

  if (
    details === brandInfo.details
  ) return pushNotification('Please update the information')

  const response = await fetch('/admin/all-brands/brand/updated', {
    method: 'PUT',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      id      : urlSlug,
      details : details,
    })
  })
  if (!response.ok) throw new Error(`Response status: ${response.status}`)
  const {isValid, message} = await response.json()

  pushNotification(message)

  if (!isValid) return
  setTimeout(() => window.location.reload(), 3000)
}

window.addEventListener('DOMContentLoaded', async function loadData() {
  try {
    const brandInfo = await getBrand()
  
    document.querySelector('button[type="submit"]').onclick = function() {
      updateBrand(brandInfo)
    }
  } catch (error) {
    console.error('An error occurred:', error)
    pushNotification('An error occurred')
  }
})