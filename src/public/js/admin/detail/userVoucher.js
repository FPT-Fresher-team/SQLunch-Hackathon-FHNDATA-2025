importLinkCss('/css/admin/detail/userVoucher.css')

const urlSlug = location.href.match(/([^\/]*)\/*$/)[1]

async function getVoucher() {
  const response = await fetch('/admin/all-u-vouchers/data/voucher', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({id: urlSlug})
  })
  if (!response.ok) throw new Error(`Response status: ${response.status}`)
  const {error, voucherInfo, orderInfo} = await response.json()
  if (error) return pushNotification(error)

  document.title = voucherInfo.description

  document.querySelector('input#userId').value      = voucherInfo.userId
  document.querySelector('input#orderId').value     = voucherInfo.orderId
  document.querySelector('input#code').value        = voucherInfo.code
  document.querySelector('input#description').value = voucherInfo.description
  document.querySelector('select#voucherType').querySelectorAll('option').forEach(option => {
    if (option.value === voucherInfo.voucherType) option.selected = true
  })
  document.querySelector('input#discount').value    = formatNumber(voucherInfo.discount)
  document.querySelector('input#minOrder').value    = formatNumber(voucherInfo.minOrder)
  document.querySelector('select#status').querySelectorAll('option').forEach(option => {
    if (option.value === voucherInfo.status) option.selected = true
  })
  document.querySelector('input#startDate').value   = voucherInfo.startDate.split('T')[0]
  document.querySelector('input#endDate').value     = voucherInfo.endDate.split('T')[0]
  document.querySelector('input#usedAt').value      = voucherInfo.usedAt === null ? null : voucherInfo.usedAt.split('T')[0]

  let productIndex = 1
  orderInfo.forEach((order) => {
    const tr = document.createElement('tr')
    tr.innerHTML = `
      <td>${productIndex}</td>
      <td>${formatNumber(order.totalOrderPrice)}</td>
      <td>${order.paymentMethod.name}</td>
      <td>${order.orderStatus.name}</td>
      <td><a href="/admin/all-orders/order/${order._id}">Xem</a></td>
    `
    productIndex++
    document.querySelector('table#table-2').querySelector('tbody').appendChild(tr)
  })

  return voucherInfo
}

async function updateVoucher(voucherInfo) {
  const name        = document.querySelector('input#name').value
  const description = document.querySelector('input#description').value
  const status      = document.querySelector('select#status').value
  const startDate   = document.querySelector('input#start-date').value
  const endDate     = document.querySelector('input#end-date').value

  if (
    name        === voucherInfo.name        &&
    description === voucherInfo.description &&
    status      === voucherInfo.status      &&
    startDate   === voucherInfo.startDate.split('T')[0]   &&  
    endDate     === voucherInfo.endDate.split('T')[0]   
  ) return pushNotification('Please update the information')

  const response = await fetch('/admin/all-vouchers/voucher/updated', {
    method: 'PUT',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      id          : urlSlug,
      name        : name,
      description : description,
      status      : status,
      startDate   : startDate,
      endDate     : endDate,
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
    const voucherInfo = await getVoucher()

    document.querySelector('button[type="submit"]').onclick = function() {
      updateVoucher(voucherInfo)
    }
  } catch (error) {
    console.error(error)
    pushNotification(error)
  }  
})