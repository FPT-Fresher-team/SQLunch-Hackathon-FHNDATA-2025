// ok
importLinkCss('/css/user/profile.css')

const content           = document.querySelector('div.profile-container').querySelector('div.content')
const infoBtn           = document.querySelector('span.profile')
const orderBtn          = document.querySelector('span.order')
const rateOrderBtn      = document.querySelector('span.rate-order')
const voucherBtn        = document.querySelector('span.voucher')
const userVoucherBtn    = document.querySelector('span.user-voucher')
const resetPasswordBtn  = document.querySelector('span.reset-password')
const feedbackBtn       = document.querySelector('span.feedBack')
const urlSlug           = location.href.match(/([^\/]*)\/*$/)[1]

function resetFormat(button) {
  document.querySelector('div.tag').querySelectorAll('span').forEach((span) => {
    span.classList.remove('current')
  })
  button.classList.add('current')
}

function resetContent() {
  document.querySelector('div.content').querySelector('div').remove()
}

async function getUser() {
  const response = await fetch('/profile/data/user', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
  })
  if (!response.ok) throw new Error(`Response status: ${response.status}`)
  const {data, member} = await response.json()

  const p = document.createElement('p')
  p.textContent = 'Personal Information'

  const form = document.createElement('form')
  form.innerHTML = `
    <div class="form-group">
      <label for="name">Customer Name</label>
      <input type="text" name="name" value="${data.name}">
    </div>

    <div class="form-group">
      <label for="gender">Gender</label>
      <div>
        <input type="radio" name="gender" value="male">
        <label for="gender">Male</label>
        
        <input type="radio" name="gender" value="female">
        <label for="gender">Female</label>
      </div>
    </div>

    <div class="form-group">
      <label for="name">Customer Email</label>
      <input type="text" name="email" value="${data.email}" disabled>
    </div>

    <div class="form-group">
      <label for="phone">Phone Number</label>
      <input type="text" name="phone" value="${data.phone}">
    </div>

    <div class="form-group">
      <label for="dob">Date of Birth</label>
      <input type="date" name="dob" value="${data.dob?.split('T')[0] || null}">
    </div>

    <div class="form-group">
      <label for="address">Delivery Address</label>
      <input type="text" name="address" value="${data.address}">
    </div>
    
    <div class="form-group">
      <label for="address">Order Quantity</label>
      <input type="text" name="quantity" value="${data.quantity}" disabled>
    </div>
    
    <div class="form-group">
      <label for="address">Total Expenditure</label>
      <input type="text" name="revenue" value="${formatNumber(data.revenue) }" disabled>
    </div>

    <div class="form-group">
      <label for="member">Member Rank</label>
      <input type="text" name="member" value="${member.name}" disabled>
    </div>
    
    <div class="form-group">
      <label for="address">Account Created Date</label>
      <input type="text" name="createdAt" value="${formatDate(data.createdAt)}" disabled>
    </div>
  `
  form.querySelectorAll('input[name="gender"]').forEach((input) => {
    if (input.value === data.gender) input.checked = true
  })

  const submitButton = document.createElement('div')
  submitButton.classList.add('submit-button')

  const button = document.createElement('button')
  button.type = 'submit'
  button.textContent = 'Update'
  button.onclick = async function updateUser() {
    const name    = document.querySelector('input[name="name"]').value
    const gender  = document.querySelector('input[name="gender"]:checked').value
    const phone   = document.querySelector('input[name="phone"]').value
    const address = document.querySelector('input[name="address"]').value
    const dob     = document.querySelector('input[name="dob"]').value

    if (
      name    === data.name    &&
      phone   === data.phone   &&
      address === data.address &&
      gender  === data.gender  &&
      dob     === data.dob.split('T')[0]
    ) return pushNotification('Please update your information')

    const response = await fetch('/profile/updated', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        id      : data._id,
        name    : name,
        gender  : gender,
        phone   : phone,
        address : address,
        dob     : dob
      })
    })

    if (!response.ok) throw new Error(`Response status: ${response.status}`)
    const {isValid, message} = await response.json()
    pushNotification(message)

    if (!isValid) return
    setTimeout(() => window.location.reload(), 3000)
  }
  submitButton.appendChild(button)

  const div = document.createElement('div')
  div.appendChild(p)
  div.appendChild(form)
  div.appendChild(submitButton)

  content.appendChild(div)

  document.querySelector('span.user-name').textContent = data.name
}

async function getOrders() {
  const response = await fetch('/profile/data/orders', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
  })
  if (!response.ok) throw new Error(`Response status: ${response.status}`)
  const {data} = await response.json()

  const p = document.createElement('p')
  p.textContent = 'Order Information'

  const thead = document.createElement('thead')
  thead.innerHTML = `
    <tr>
      <td style="width: 10%">No</td>
      <td style="width: 15%">Recipient</td>
      <td style="width: 25%">Total Amount</td>
      <td style="width: 20%">Date</td>
      <td style="width: 20%">Status</td>
      <td style="width: 10%"></td>
    </tr>
  `

  const tbody = document.createElement('tbody')
  let index = 1
  data.forEach((order) => {
    const tr = document.createElement('tr')
    tr.innerHTML = `
      <td style="text-align:center" >${index}</td>
      <td style="text-align:left"   >${order.customerInfo.name}</td>
      <td style="text-align:right"  >${formatNumber(order.totalNewOrderPrice)}</td>
      <td style="text-align:right"  >${formatDate(order.createdAt)}</td>
      <td style="text-align:left"   >${order.orderStatus.name}</td>
      <td style="text-align:center">
        ${
          order.orderStatus.code === 'delivered' && order.isPaid === true
          ? `<button onclick="orderAction('${order._id}')">Details</button>`
          : `<a target="_blank" rel="noopener noreferrer" href="/all-orders/order/${order._id}">Details</a>`
        }
      </td>
    `
    index++
    tbody.appendChild(tr)
  })

  const table = document.createElement('table')
  table.appendChild(thead)
  table.appendChild(tbody)

  const div = document.createElement('div')
  div.appendChild(p)
  div.appendChild(table)

  content.appendChild(div)
}

async function getDoneOrders() {
  const response = await fetch('/profile/data/done-orders', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
  })
  if (!response.ok) throw new Error(`Response status: ${response.status}`)
  const {data} = await response.json()

  const p = document.createElement('p')
  p.textContent = 'Rate Orders'

  const thead = document.createElement('thead')
  thead.innerHTML = `
    <tr>
      <td style="width: 10%">No.</td>
      <td style="width: 15%">Recipient</td>
      <td style="width: 25%">Total Amount</td>
      <td style="width: 20%">Date</td>
      <td style="width: 20%">Status</td>
      <td style="width: 10%"></td>
    </tr>
  `

  const tbody = document.createElement('tbody')
  let index = 1
  data.forEach((order) => {
    const tr = document.createElement('tr')
    tr.innerHTML = `
      <td style="text-align:center" >${index}</td>
      <td style="text-align:left"   >${order.customerInfo.name}</td>
      <td style="text-align:right"  >${formatNumber(order.totalNewOrderPrice)}</td>
      <td style="text-align:right"  >${formatDate(order.createdAt)}</td>
      <td style="text-align:left"   >${order.orderStatus.name}</td>
      <td style="text-align:center" ><a target="_blank" rel="noopener noreferrer" href="/all-orders/order/rate/${order._id}">Details</a></td>
    `
    index++
    tbody.appendChild(tr)
  })

  const table = document.createElement('table')
  table.appendChild(thead)
  table.appendChild(tbody)

  const div = document.createElement('div')
  div.appendChild(p)
  div.appendChild(table)

  content.appendChild(div)
}

async function getVouchers() {
  const response = await fetch('/profile/data/vouchers', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
  })
  if (!response.ok) throw new Error(`Response status: ${response.status}`)
  const {data, error} = await response.json()
  if (error) return pushNotification(error)

  const p = document.createElement('p')
  p.textContent = 'Voucher Information'

  const thead = document.createElement('thead')
  thead.innerHTML = `
    <tr>
      <td style="width: 10%">No</td>
      <td style="width: 15%">Code</td>
      <td style="width: 25%">Discount Rate</td>
      <td style="width: 20%">Status</td>
      <td style="width: 15%">End Date</td>
      <td style="width: 15%"></td>
    </tr>
  `

  const tbody = document.createElement('tbody')
  let index = 1
  data.forEach((voucher) => {
    const tr = document.createElement('tr')
    tr.innerHTML = `
      <td style="text-align:center" >${index}</td>
      <td style="text-align:left"   >${voucher.code}</td>
      <td style="text-align:right"  >${voucher.discount}%</td>
      <td style="text-align:right"  >${voucher.status === 'active' ? 'Active' : voucher.status === 'used' ? 'Used' : 'Expired'}</td>
      <td style="text-align:left"   >${formatDate(voucher.endDate)}</td>
      <td style="text-align:center" ><a target="_blank" rel="noopener noreferrer" href="/all-vouchers/voucher/${voucher._id}">Chi Tiết</a></td>
    `
    index++
    tbody.appendChild(tr)
  })

  const table = document.createElement('table')
  table.appendChild(thead)
  table.appendChild(tbody)

  const div = document.createElement('div')
  div.appendChild(p)
  div.appendChild(table)

  content.appendChild(div)
}

async function getUserVouchers() {
  const response = await fetch('/profile/data/user-vouchers', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
  })
  if (!response.ok) throw new Error(`Response status: ${response.status}`)
  const {data} = await response.json()

  const p = document.createElement('p')
  p.textContent = 'My Vouchers'

  const thead = document.createElement('thead')
  thead.innerHTML = `
    <tr>
      <td style="width: 10%">No</td>
      <td style="width: 15%">Code</td>
      <td style="width: 25%">Discount Amount</td>
      <td style="width: 20%">Status</td>
      <td style="width: 15%">End Date</td>
      <td style="width: 15%"></td>
    </tr>
  `

  const tbody = document.createElement('tbody')
  let index = 1
  data.forEach((voucher) => {
    const tr = document.createElement('tr')
    tr.innerHTML = `
      <td style="text-align:center" >${index}</td>
      <td style="text-align:left"   >${voucher.code}</td>
      <td style="text-align:right"  >${formatNumber(voucher.discount)}</td>
      <td style="text-align:right"  >${voucher.status === 'active' ? 'Active' : voucher.status === 'used' ? 'Used' : 'Expired'}</td>
      <td style="text-align:left"   >${formatDate(voucher.endDate)}</td>
      <td style="text-align:center" ><a target="_blank" rel="noopener noreferrer" href="/all-vouchers/voucher/user/${voucher._id}">Chi Tiết</a></td>
    `
    index++
    tbody.appendChild(tr)
  })

  const table = document.createElement('table')
  table.appendChild(thead)
  table.appendChild(tbody)

  const div = document.createElement('div')
  div.appendChild(p)
  div.appendChild(table)

  content.appendChild(div)
}

async function resetPassword() {
  try {
    const p = document.createElement('p')
    p.textContent = 'Change Password'
  
    const form = document.createElement('form')
    form.innerHTML = `
      <div class="form-group">
        <label for="oldPassword">Old Password</label>
        <input type="password" name="oldPassword">
      </div>
  
      <div class="form-group">
        <label for="newPassword">New Password</label>
        <input type="password" name="newPassword">
      </div>
  
      <div class="form-group">
        <label for="confirmPassword">Confirm New Password</label>
        <input type="password" name="confirmPassword">
      </div>
    `
  
    const submitButton = document.createElement('div')
    submitButton.classList.add('submit-button')
  
    const button = document.createElement('button')
    button.type = 'submit'
    button.textContent = 'Update'
    button.onclick = async function updatePassword() {
      const oldPassword = document.querySelector('input[name="oldPassword"]').value
      const newPassword = document.querySelector('input[name="newPassword"]').value
      const confirmPassword = document.querySelector('input[name="confirmPassword"]').value
  
      if (newPassword !== confirmPassword) return pushNotification('New passwords do not match')
      if (newPassword.length < 6) return pushNotification('New password must be at least 6 characters')

      console.log('123')
  
      const response = await fetch('/profile/password-updated', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          oldPassword : oldPassword,
          newPassword : newPassword
        })
      })
  
      if (!response.ok) throw new Error(`Response status: ${response.status}`)
      const {isValid, message} = await response.json()
      pushNotification(message)
  
      if (!isValid) return
      setTimeout(() => window.location.reload(), 3000)
    }
    submitButton.appendChild(button)
  
    const div = document.createElement('div')
    div.appendChild(p)
    div.appendChild(form)
    div.appendChild(submitButton)
  
    content.appendChild(div)
  } catch (error) {
    console.error("Error updating password:", error)
    pushNotification(`Error updating password: ${error}. Please try again later`)
  }
}

async function getFeedback() {
  const p = document.createElement('p')
  p.textContent = 'Feedback'

  const form = document.createElement('form')
  form.innerHTML = `
    <div class="form-group">
      <label for="phone">Do you have any suggestions for us? Please share your feedback</label>
      <input 
        type="text" 
        class="form-control" 
        id="phone" 
        name="phone" 
      >
    </div>
  `

  const submitButton = document.createElement('div')
  submitButton.classList.add('submit-button')
  submitButton.innerHTML = `
    <button type="submit">Update</button>
  `

  const div = document.createElement('div')
  div.appendChild(p)
  div.appendChild(form)
  div.appendChild(submitButton)

  content.appendChild(div)

}

function orderAction(orderId) {
  const actionBox = document.createElement('div')
  actionBox.setAttribute('class', 'action-box')
  actionBox.innerHTML = `
    <div class="actions">
      <button class="confirmation-button">Confirm Order Received</button>
      <a target="_blank" rel="noopener noreferrer" href="/all-orders/order/${orderId}">Xem Chi Tiết</a>
      <button 
        id="delete-button" 
        type="button" 
        class="deletebtn"
        onclick="document.querySelector('div.action-box').remove()"
      ">Huỷ</button>
    </div>
  `
  document.body.appendChild(actionBox)

  document.querySelector('button.confirmation-button').onclick = async function() {
    try {
      const response = await fetch('/profile/order/updated', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ id: orderId })
      })
      if (!response.ok) throw new Error(`Response status: ${response.status}`)
      const {isValid, message} = await response.json()
      pushNotification(message)

      if (!isValid) return
      setTimeout(() => window.location.reload(), 3000)
    } catch (error) {
      console.error("Error confirming order:", error)
      pushNotification(`Error confirming order: ${error}. Please try again later`)
    }
  }

  return
}

infoBtn.onclick = function() {
  if (infoBtn.classList.contains('current')) return
  resetFormat(infoBtn)
  resetContent()
  getUser()
}

orderBtn.onclick = function() {
  if (orderBtn.classList.contains('current')) return
  resetContent()
  resetFormat(orderBtn)
  getOrders()
}

rateOrderBtn.onclick = function() {
  if (rateOrderBtn.classList.contains('current')) return
  getDoneOrders()
  resetFormat(rateOrderBtn)
  resetContent()
}

voucherBtn.onclick = function() {
  if (voucherBtn.classList.contains('current')) return
  getVouchers()
  resetFormat(voucherBtn)
  resetContent()
}

userVoucherBtn.onclick = function() {
  if (userVoucherBtn.classList.contains('current')) return
  getUserVouchers()
  resetFormat(userVoucherBtn)
  resetContent()
}

resetPasswordBtn.onclick = function() {
  if (resetPasswordBtn.classList.contains('current')) return
  resetPassword()
  resetFormat(resetPasswordBtn)
  resetContent()
}

feedbackBtn.onclick = function() {
  resetFormat(feedbackBtn)
  resetContent()
  getFeedback()
}

async function loadData(retriesLeft) {
  try {
    getUser()
    resetFormat(infoBtn)
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

// setTimeout(() => {
//   getLog(
//     topic = 'page-view', 
//     value = {
//       "user_id"   : window.uid,
//       "page_type" : 'profile',
//       "timestamp" : new Date(),
//     }
//   )
// }, 1000)