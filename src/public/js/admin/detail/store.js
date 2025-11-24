importLinkCss('/css/admin/detail/store.css')

const urlSlug = location.href.match(/([^\/]*)\/*$/)[1]

async function getStore() {
  const response = await fetch('/admin/all-stores/data/store', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({id: urlSlug})
  })
  if (!response.ok) throw new Error(`Response status: ${response.status}`)
  const {error, storeInfo} = await response.json()
  if (error) return pushNotification('An error occurred')

  document.title = storeInfo.name

  document.querySelector('input#id').value      = storeInfo._id
  document.querySelector('input#name').value    = storeInfo.name
  document.querySelector('input#address').value = storeInfo.address
  document.querySelector('input#details').value = storeInfo.details
  document.querySelector('input#total').value   = formatNumber(storeInfo.revenue) 

  return storeInfo
}

async function updateStore(storeInfo) {
  const name    = document.querySelector('input#name').value
  const address = document.querySelector('input#address').value
  const details = document.querySelector('input#details').value

  if (
    name    === storeInfo.name    &&
    address === storeInfo.address &&
    details === storeInfo.details   
  ) return pushNotification('Please update the information')

  const response = await fetch('/admin/all-stores/store/updated', {
    method: 'PUT',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      id      : urlSlug,
      name    : name,
      address : address,
      details : details,
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
    const storeInfo = await getStore()

    document.querySelector('button[type="submit"]').onclick = function() {
      updateStore(storeInfo)
    }
  } catch (error) {
    console.error('An error occurred:', error)
    pushNotification('An error occurred')
  }  
})