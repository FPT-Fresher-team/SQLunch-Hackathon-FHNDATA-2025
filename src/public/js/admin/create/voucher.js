importLinkCss('/css/admin/create/voucher.css')

const submitButton = document.querySelector('button[type="submit"]')

formatInputNumber(document.querySelector('input[name="discount"]'))
formatInputNumber(document.querySelector('input[name="maxDiscount"]'))
formatInputNumber(document.querySelector('input[name="minOrder"]'))

async function getMembers() {
  const response = await fetch('/admin/all-vouchers/data/members', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
  })
  if (!response.ok) throw new Error(`Response status: ${response.status}`)
  const {data, error} = await response.json()
  if (error) return pushNotification(error)

  data.forEach((element) => {
    const option = document.createElement('option')
    option.value = element.code
    option.textContent = element.name
    document.querySelector('select[name="memberCode"]').appendChild(option) 
  })

  return
}

async function createVoucher() {
  try {
    const name        = document.querySelector('input#name').value
    const description = document.querySelector('input#description').value
    const memberCode  = document.querySelector('select#memberCode').value
    const discount    = deFormatNumber(document.querySelector('input#discount').value)
    const maxDiscount = deFormatNumber(document.querySelector('input#maxDiscount').value)
    const minOrder    = deFormatNumber(document.querySelector('input#minOrder').value)
    const startDate   = document.querySelector('input#start-date').value
    const endDate     = document.querySelector('input#end-date').value
  
    if (
      !name         || 
      !description  || 
      !memberCode   || 
      !discount     || 
      !maxDiscount  || 
      !minOrder     || 
      !startDate    || 
      !endDate
    ) {
      pushNotification("Please fill in all information!")
      return
    }
  
    const response = await fetch('/admin/all-vouchers/voucher/created', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        name        : name,
        description : description,
        memberCode  : memberCode,
        discount    : discount,
        maxDiscount : maxDiscount,
        minOrder    : minOrder,
        startDate   : startDate,
        endDate     : endDate
      })
    })
    if (!response.ok) throw new Error(`Response status: ${response.status}`)
    const {error, message} = await response.json()
    if (error) return pushNotification(error)
    pushNotification(message)
  
    setTimeout(() => window.location.reload(), 2000)
  } catch (error) {
    console.error('Error creating customer:', error)
    pushNotification("An error occurred.")
  }
}

submitButton.onclick = function() {
  createVoucher()
}

window.addEventListener('DOMContentLoaded', async function loadData() {
  getMembers()
})