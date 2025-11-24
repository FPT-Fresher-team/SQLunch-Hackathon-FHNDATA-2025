importLinkCss('/css/admin/detail/supplier.css')

const urlSlug = location.href.match(/([^\/]*)\/*$/)[1]

async function getSupplier() {
  const response = await fetch('/admin/all-suppliers/data/supplier', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({id: urlSlug})
  })
  if (!response.ok) throw new Error(`Response status: ${response.status}`)
  const {error, supplierInfo, purchaseInfo} = await response.json()
  if (error) return pushNotification('An error occurred')

  document.title = supplierInfo.name

  document.querySelector('input#id').value       = supplierInfo._id
  document.querySelector('input#name').value     = supplierInfo.name
  document.querySelector('input#email').value    = supplierInfo.email
  document.querySelector('input#phone').value    = supplierInfo.phone
  document.querySelector('input#address').value  = supplierInfo.address
  document.querySelector('input#quantity').value = supplierInfo.quantity
  document.querySelector('input#total').value    = formatNumber(supplierInfo.totalCost) 
  
  purchaseInfo.forEach((purchase) => {
    const tr = document.createElement('tr')
    tr.innerHTML = `
      <td></td>
      <td>${formatNumber(purchase.totalPurchasePrice)}</td>
      <td>${formatDate(purchase.purchaseDate)}</td>
      <td><a href="/admin/all-purchases/purchase/${purchase._id}">Xem</a></td>
    `
    document.querySelector('table#table-2').querySelector('tbody').appendChild(tr)
  })

  return supplierInfo
}

async function updateSupplier(supplierInfo) {
  const name    = document.querySelector('input#name').value
  const phone   = document.querySelector('input#phone').value
  const address = document.querySelector('input#address').value

  if (
    name    === supplierInfo.name    &&
    phone   === supplierInfo.phone   &&
    address === supplierInfo.address
  ) return pushNotification('Please update the information')

  const response = await fetch('/admin/all-suppliers/supplier/updated', {
    method: 'PUT',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      id      : urlSlug,
      name    : name,
      phone   : phone,
      address : address,
    })
  })
  if (!response.ok) throw new Error(`Response status: ${response.status}`)
  const {error, message} = await response.json()
  if (error) return pushNotification(error)
  pushNotification(message)

  setTimeout(() => window.location.reload(), 3000)
}

window.addEventListener('DOMContentLoaded', async function loadData() {
  try {
    const supplierInfo = await getSupplier()

    document.querySelector('button[type="submit"]').onclick = function() {
      updateSupplier(supplierInfo)
    }
  } catch (error) {
    console.error('An error occurred:', error)
    pushNotification('An error occurred')
  }
})