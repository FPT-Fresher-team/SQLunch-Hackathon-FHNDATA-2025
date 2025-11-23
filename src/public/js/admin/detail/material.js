importLinkCss('/css/admin/detail/product.css')

const urlSlug = location.href.match(/([^\/]*)\/*$/)[1]

async function getMaterial() {
  const response = await fetch('/admin/all-materials/data/material', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({id: urlSlug})
  })
  if (!response.ok) throw new Error(`Response status: ${response.status}`)
  const {error, materialInfo} = await response.json()
  if (error) return pushNotification('An error occurred')

  document.title = materialInfo.name

  document.querySelector('input#id').value = materialInfo._id
  document.querySelector('input#code').value = materialInfo.code
  document.querySelector('input#name').value = materialInfo.name
  document.querySelector('input#category').value = materialInfo.category
  document.querySelector('input#description').value = materialInfo.description
  document.querySelector('input#unit').value = materialInfo.unit
  document.querySelector('input#quantity').value = materialInfo.quantity
  document.querySelector('input#price').value = formatNumber(materialInfo.price)
  document.querySelector('input#supplierId').value = materialInfo.supplierId
  document.querySelector('input#expiry_date').value = materialInfo.expiry_date === null ? null : materialInfo.expiry_date.split('T')[0]
  document.querySelector('input#certifications').value = materialInfo.certifications

  return materialInfo
}

async function updateMaterial(materialInfo) {
  const code          = document.querySelector('input#code').value
  const name          = document.querySelector('input#name').value
  const category      = document.querySelector('input#category').value
  const description   = document.querySelector('input#description').value
  const unit          = document.querySelector('input#unit').value
  const quantity      = document.querySelector('input#quantity').value
  const price         = document.querySelector('input#price').value
  const supplierId    = document.querySelector('input#supplierId').value
  const expiry_date   = document.querySelector('input#expiry_date').value
  const certifications= document.querySelector('input#certifications').value

  const initialExpiryDate = materialInfo.expiry_date === null ? null : materialInfo.expiry_date.split('T')[0]

  if (
    code            === materialInfo.code                 &&
    name            === materialInfo.name                 &&
    category        === materialInfo.category             &&
    description     === materialInfo.description          &&
    unit            === materialInfo.unit                 &&
    quantity        === materialInfo.quantity             &&
    price           === formatNumber(materialInfo.price)  &&
    supplierId      === materialInfo.supplierId           &&
    expiry_date     === initialExpiryDate                 &&
    certifications  === materialInfo.certifications      
  ) return pushNotification('Please update the information')

  const response = await fetch('/admin/all-materials/material/updated', {
    method: 'PUT',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      id              : urlSlug,
      code            : code,
      name            : name,
      category        : category,
      description     : description,
      unit            : unit,
      quantity        : quantity,
      price           : price,
      supplierId      : supplierId,
      expiry_date     : expiry_date,
      certifications  : certifications,
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
    const materialInfo = await getMaterial()
    
    formatInputNumber(document.querySelector('input#price'))

    document.querySelector('button[type="submit"]').onclick = function() {
      updateMaterial(materialInfo)
    }
  } catch (error) {
    console.error('An error occurred:', error)
    pushNotification('An error occurred')
  }
})