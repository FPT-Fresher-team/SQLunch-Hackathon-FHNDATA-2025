importLinkCss('/css/user/allOrders.css')

const voucher           = document.querySelector('div.voucher')
const contactInfo       = document.querySelector('div.contact-info')
const paymentMethod     = document.querySelector('div.payment-method')
const voucherButton     = document.querySelector('button.voucher-submit-button')
const listVoucherButton = document.querySelector('button.voucher-list-button')
const nextButton        = document.querySelector('button.next-button')
const submitButton      = document.querySelector('button.submit-button')
const imgInput          = document.querySelector('input#img')
const tableBody         = document.querySelector('tbody')
const tableFooter       = document.querySelector('tfoot')
const userId            = {id: null}
const totalOrderPrice   = {total: 0}
const imgPath           = {path: ''}
const paymentOptions    = paymentMethod.querySelectorAll('input[type="radio"]')

async function checkUser() {
  try {
    const response = await fetch('/data/user')
    if (!response.ok) throw new Error(`Response status: ${response.status}`)

    const {error, uid, data} = await response.json()
    if (error) throw new Error(error)

    userId.id = uid
    if (!userId.id) return

    document.querySelector('input#name').value = data.name
    document.querySelector('input#phone').value = data.phone
    document.querySelector('input#address').value = data.address

    return
  } catch (error) {
    console.log(error)
    pushNotification(error)
  }
}

async function updateTableBody() {
  const getProductInfo  = JSON.parse(localStorage.getItem('product_cart_count')) || {}
  const productIds      = getProductInfo.productInfo.map(product => product.id)
  const productChecked  = getProductInfo.productInfo.map(product => product.isChecked)
  const tableBody       = document.querySelector('tbody')
  totalOrderPrice.total = 0

  const response = await fetch('/data/order-products', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({productIds: productIds})
  })
  if (!response.ok) throw new Error(`Response status: ${response.status}`)

  const {data} = await response.json()

  data.forEach((product, index) => {
    const newProductRow = document.createElement('tr')

    const newProductCheckBoxElement = document.createElement('td')
    const CheckBox = document.createElement('input')
    newProductCheckBoxElement.append(CheckBox)
    CheckBox.type = 'checkbox'
    CheckBox.id = product._id
    CheckBox.name = product.name

    const newProductImage = document.createElement('td')
    const productImage = document.createElement('img')
    productImage.setAttribute('src', `${product.img.path}`)
    productImage.setAttribute('style', 'text-align:center')
    newProductImage.appendChild(productImage)

    const newProductName = document.createElement('td')
    const newProductAnchorTag = document.createElement('a')
    newProductAnchorTag.setAttribute('href', `/all-products/product/${product._id}`)
    newProductAnchorTag.innerText = product.name
    newProductAnchorTag.style.paddingLeft = '5px'
    newProductName.appendChild(newProductAnchorTag)

    // create product price element
    const newProductPrice = document.createElement('td')
    newProductPrice.setAttribute('style', 'text-align:right')
    newProductPrice.innerText = formatNumber(product.price)

    // create product quantity element
    const newProductQuantity = document.createElement('td')
    newProductQuantity.setAttribute('style', 'text-align:center')

    const newProductQuantityInput = document.createElement('input')
    newProductQuantity.append(newProductQuantityInput)
    newProductQuantityInput.type = 'number'
    newProductQuantityInput.min = 1
    newProductQuantityInput.max = parseInt(product.quantity)

    newProductQuantityInput.onchange = function() {
      const currentValue = parseInt(newProductQuantityInput.value)
      const min = parseInt(newProductQuantityInput.min)
      const max = parseInt(newProductQuantityInput.max)

      if (currentValue < min) newProductQuantityInput.value = min
      if (currentValue > max) newProductQuantityInput.value = max

      if (CheckBox.checked) totalOrderPrice.total = totalOrderPrice.total + (newProductQuantityInput.value - CheckBox.value) * product.price

      CheckBox.value = newProductQuantityInput.value
      newProductTotalPrice.innerText = formatNumber(newProductQuantityInput.value * product.price)
      updateTableFooter()
      getProductInfo.productInfo.forEach((localProduct, index) => {
        if (localProduct.id === product._id) {
          localProduct.quantity = newProductQuantityInput.value
          localStorage.setItem('product_cart_count', JSON.stringify(getProductInfo))
        } 
      })
    }

    const newProductTotalPrice = document.createElement('td')
    newProductTotalPrice.setAttribute('style', 'text-align:right')
    getProductInfo.productInfo.forEach((localProduct, index) => {
      if (localProduct.id === product._id) {
        const quantity = parseInt(localProduct.quantity)
        newProductQuantityInput.value = quantity        
        newProductTotalPrice.innerText = formatNumber(quantity * product.price)
        CheckBox.value = quantity
      } 
    })

    const newProductDelete = document.createElement('td')
    newProductDelete.setAttribute('class', 'delete-button')
    newProductDelete.innerHTML = `
      <i class="fi fi-tr-trash-slash"></i>
    `

    newProductDelete.onclick = function() {
      getProductInfo.localCounting--
      getProductInfo.productInfo.forEach((localProduct, index) => {
        if (localProduct.id === product._id) getProductInfo.productInfo.splice(index, 1)
      })
      localStorage.setItem('product_cart_count', JSON.stringify(getProductInfo))
      document.dispatchEvent(new CustomEvent('cartUpdated'))
      deleteCartItem(tableBody)
      updateTableBody()
      preCheckAllProducts()
    }

    CheckBox.checked = productChecked[index] || false
    if (CheckBox.checked) {
      totalOrderPrice.total += parseInt(CheckBox.value) * parseInt(product.price)
    }

    CheckBox.onclick = function() {
      if (CheckBox.checked) {
        totalOrderPrice.total += parseInt(CheckBox.value) * parseInt(product.price)
      } else {
        totalOrderPrice.total -= parseInt(CheckBox.value) * parseInt(product.price)
      }
      updateTableFooter()
      getProductInfo.productInfo.forEach((localProduct, index) => {
        if (localProduct.id === product._id) {
          localProduct.isChecked = CheckBox.checked
          localStorage.setItem('product_cart_count', JSON.stringify(getProductInfo))
        } 
      })
    }

    // add each element to the row
    newProductRow.appendChild(newProductCheckBoxElement)
    newProductRow.appendChild(newProductImage)
    newProductRow.appendChild(newProductName)
    newProductRow.appendChild(newProductPrice)
    newProductRow.appendChild(newProductQuantity)
    newProductRow.appendChild(newProductTotalPrice)
    newProductRow.appendChild(newProductDelete)

    if (product.status === 'out-of-order') {
      newProductRow.querySelector('td:first-child').classList.add('unavailable')
      newProductRow.querySelector('td:first-child').textContent = 'Sorry, this product is out of stock'
    }

    tableBody.appendChild(newProductRow)
  })

  updateTableFooter()
}

function preCheckAllProducts() {
  const getProductInfo = JSON.parse(localStorage.getItem('product_cart_count')) || {}
  if (getProductInfo.localCounting === 0) {
    nextButton.style.display = 'none'
    const emptyCartNotice = document.createElement('td')
    emptyCartNotice.setAttribute('colspan', '6')
    emptyCartNotice.style.color = 'red'
    emptyCartNotice.style.fontWeight = 'bolder'
    emptyCartNotice.innerText = 'Your cart is empty'
    tableBody.appendChild(emptyCartNotice)
  }
}

function displayProcess() {
  function showWithAnimation(el) {
    el.style.display = "block"            // appear in flow
    requestAnimationFrame(() => {          // wait 1 frame
      el.classList.add("visible")       // trigger transition
    })
  }

  nextButton.onclick = function () {
    if (!voucher.classList.contains("show")) {
      voucher.classList.add("show")
      return showWithAnimation(voucher)
    }

    if (!contactInfo.classList.contains("show")) {
      contactInfo.classList.add("show")
      return showWithAnimation(contactInfo)
    }

    if (!paymentMethod.classList.contains("show")) {
      paymentMethod.classList.add("show")
      showWithAnimation(paymentMethod)

      nextButton.style.display = "none"
      submitButton.style.display = "block"
    }
  }
}

function updateTableFooter() {
  const totalOrderPriceElement = document.querySelector('tfoot').querySelector('td.total')
  const voucherOldPrice = document.querySelector('span.old-price-value')
  const voucherNewPrice = document.querySelector('span.new-price-value')

  totalOrderPriceElement.textContent = formatNumber(totalOrderPrice.total)
  voucherOldPrice.textContent = formatNumber(totalOrderPrice.total)
  voucherNewPrice.textContent = formatNumber(totalOrderPrice.total)
}

function deleteCartItem(tableElement) {
  while (tableElement.lastChild) {
    tableElement.removeChild(tableElement.lastChild)
  }
}

async function checkOutOfOrderProduct() {
  const response = await fetch('/data/out-of-order-products')
  if (!response.ok) throw new Error(`Response status: ${response.status}`)

  const {data} = await response.json()
  const outOfOrderProductIds = data.map(data => data._id)
  
  const getProductInfo = JSON.parse(localStorage.getItem('product_cart_count')) || {}
  getProductInfo.productInfo.forEach((productInfo, index) => {
    if (outOfOrderProductIds.includes(productInfo.id)) {
      productInfo.status = false
    }
  })
}

async function submitOrder() {
  const preloader = document.querySelector('div.preloader')
  try {
    preloader.classList.remove('inactive')

    const getProductInfo = JSON.parse(localStorage.getItem('product_cart_count')) || {}
    if (getProductInfo.productInfo.length === 0) throw Error('Your cart is empty')
      
    const checkedProducts = document.querySelectorAll('tbody input[type="checkbox"]:checked')
    const productIds = Array.from(checkedProducts).map((input) => {
      return {
        id: input.id,
        quantity: input.value
      }
    })

    if (productIds.length === 0) throw Error('Please select products')  

    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked')?.value
    const code          = document.querySelector('input[name="voucher-code"]').value
    const name          = document.querySelector('input[name="name"]').value
    const phone         = document.querySelector('input[name="phone"]').value
    const address       = document.querySelector('input[name="address"]').value
    const note          = document.querySelector('textarea[name="note"]').value || ''
    if (
      !name     || 
      !phone    || 
      !address 
    ) throw Error('Please fill in all personal information')  

    if (!paymentMethod) throw Error('Please select a payment method')
    if (paymentMethod === 'transfer' & !imgPath.path) throw Error('Please upload the transfer receipt')
      
    const response = await fetch('/all-orders/create-orders', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        productInfo   : productIds,
        paymentMethod : paymentMethod,
        userId        : userId.id || 'guest',
        code          : code.trim(),
        name          : name,
        phone         : phone,
        address       : address,
        note          : note,
        img           : imgPath.path,
      })
    })
    if (!response.ok) throw new Error(`Response status: ${response.status}`)
    const {id, payUrl, error} = await response.json()
    if (error) throw Error(error)

    socket.emit('order', { id: id})

    if (payUrl) {
      const momoPaymentMessage = document.createElement('div')
      momoPaymentMessage.setAttribute('class', 'order-successfully-message')
      momoPaymentMessage.innerHTML = `
        <h3>Your order has been created successfully, please click here to proceed with Momo payment</h3>
        <a class="momo-pay-btn" href="${payUrl}">Proceed to Payment</a>
      `
      document.body.appendChild(momoPaymentMessage)
      preloader.classList.add('inactive')
    } else {
      const orderSuccessfullyMessage = document.createElement('div')
      orderSuccessfullyMessage.setAttribute('class', 'order-successfully-message')
      orderSuccessfullyMessage.innerHTML = `
        <i class="fi fi-ss-check-circle"></i>
        <h3>Congratulations! Your order has been placed successfully!!!</h3>
        <h3>Your order code is: ${id}</h3>
        <h5>If you are a new customer, please save this code to track your order in the 'Orders' section</h5>
        <h5>If you already have an account, you can track your order in 'Personal Information' anytime</h5>
        <a href="/all-orders/order/${id}">View Order</a>
      `
      document.body.appendChild(orderSuccessfullyMessage)
      preloader.classList.add('inactive')
    }

    await fetch('/data/notification', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        message: `You have a new order: ${id}`,
        type: 'order'
      })
    })

    // After successful order, remove all ordered products from cart    
    // Extract only the IDs from the ordered products
    const orderedProductIds = productIds.map(p => p.id)

    // Filter out all ordered products
    const updatedCart = Array.from(getProductInfo.productInfo).filter(cartItem => 
      !orderedProductIds.includes(cartItem.id)
    )

    const newCartObject = {
      localCounting: updatedCart.length,
      productInfo: updatedCart
    }

    // Save updated cart
    localStorage.setItem('product_cart_count', JSON.stringify(newCartObject))

    // Trigger cart update event (for badge/count)
    document.dispatchEvent(new CustomEvent('cartUpdated'))

    return
  }
  catch (error) {
    preloader.classList.add('inactive')
    console.log(error)
    return pushNotification(error.message)
  }
}

async function loadData(retriesLeft) {
  try {
    updateTableBody()
    displayProcess()
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

function copyToClipboard(code) {
  navigator.clipboard.writeText(code)
  alert("Code copied successfully: " + code)
}

imgInput.onchange = function() {
  const file = img.files[0] // Get the selected file
  const reader = new FileReader()
  reader.onload = function () {
    imgPath.path = reader.result // Base64-encoded string
  }
  reader.readAsDataURL(file)
}

listVoucherButton.onclick = async function() {
  try {
    const response = await fetch('/all-orders/data/all-vouchers')
    if (!response.ok) throw new Error(`Response status: ${response.status}`)
  
    const {voucherInfo, userVoucherInfo, error} = await response.json()
    if (error) throw new Error(error)

    const vouchersBox = document.createElement('div')
    vouchersBox.setAttribute('class', 'vouchers-box')
    vouchersBox.innerHTML = `
      <table>
        <thead>
          <tr>
            <td style="width: 20%;">Mã Voucher</td>
            <td style="width: 40%;">Discount Level</td>
            <td style="width: 30%;">Expiry Date</td>
            <td style="width: 10%;"></td>
          </tr>
        </thead>
        <tbody>
          ${voucherInfo.map(voucher => `
            <tr>
              <td>${voucher.code}</td>
              <td style="text-align: right;">${voucher.discount}%</td>
              <td style="text-align: right;">${formatDate(voucher.endDate)}</td>
              <td><button class="copy-voucher-btn" onclick="copyToClipboard('${voucher.code}')">Copy</button></td>
            </tr>
          `).join('')}
          ${userVoucherInfo.map(voucher => `
            <tr>
              <td>${voucher.code}</td>
              <td style="text-align: right;">${formatNumber(voucher.discount)}</td>
              <td style="text-align: right;">${formatDate(voucher.endDate)}</td>
              <td><button class="copy-voucher-btn" onclick="copyToClipboard('${voucher.code}')">Copy</button></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <button 
        id="delete-button" 
        type="button" 
        class="deletebtn"
        onclick="document.querySelector('div.vouchers-box').remove()"
      ">Close</button>
    `
    document.body.appendChild(vouchersBox)
  } catch (error) {
    console.log(error)
    pushNotification(error.message)
  }
}

voucherButton.onclick = async function() {
  const voucherCode = document.querySelector('input#voucher-code').value
  if (!voucherCode) return pushNotification('Please enter a discount code')

  const response = await fetch('/all-orders/data/voucher', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({voucherCode: voucherCode.trim()})
  })
  if (!response.ok) throw new Error(`Response status: ${response.status}`)
  const {voucherInfo, discountType, error} = await response.json()

  if (error) return pushNotification(error)
  if (totalOrderPrice.total < voucherInfo.minOrder) return pushNotification(`Your order does not meet the minimum value for this discount code`)

  var discountValue = 0
  if (discountType === 'percentage') {
    discountValue = (totalOrderPrice.total * voucherInfo.discount) / 100
    if (discountValue > voucherInfo.maxDiscount) discountValue = voucherInfo.maxDiscount
  } 
  else if (discountType === 'value') {
    discountValue = voucherInfo.discount
  }
  
  const newPrice = totalOrderPrice.total - discountValue

  document.querySelector('span.new-price-value').textContent = formatNumber(newPrice)
  document.querySelector('span.form-message').textContent = voucherInfo.description
}

submitButton.onclick = async function() {
  try {
    const getProductInfo = JSON.parse(localStorage.getItem('product_cart_count')) || {}
    if (getProductInfo.productInfo.length === 0) throw Error('Your cart is empty')
      
    const checkedProducts = document.querySelectorAll('tbody input[type="checkbox"]:checked')
    const productIds = Array.from(checkedProducts).map((input) => {
      return {
        id: input.id,
        quantity: input.value
      }
    })

    if (productIds.length === 0) throw Error('Please select products')  

    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked')?.value
    const name          = document.querySelector('input[name="name"]').value
    const phone         = document.querySelector('input[name="phone"]').value
    const address       = document.querySelector('input[name="address"]').value
    if (
      !name     || 
      !phone    || 
      !address 
    ) throw Error('Please fill in all personal information')

    if (!paymentMethod) throw Error('Please select a payment method')
    if (paymentMethod === 'transfer' & !imgPath.path) throw Error('Hãy up bill chuyển khoản lên nha')
    
    const confirmMessage = document.createElement('div')
    confirmMessage.setAttribute('class', 'order-confirm-message')
    confirmMessage.innerHTML = `
      <h2>Do you want to confirm your order?</h2>
      <div class="actions">
        <button 
          id="delete-button" 
          type="button" 
          class="deletebtn"
          onclick="document.querySelector('div.order-confirm-message').remove()"
        ">Cancel</button>
        <button type="button" class="confirmbtn" onclick="submitOrder()">Confirm</button>
      </div>
    `
    document.body.appendChild(confirmMessage)
        
    return
  }
  catch (error) {
    return pushNotification(error.message)
  }
}

paymentOptions.forEach((option) => {
  option.onchange = function() {
    const bankAccountDiv = document.querySelector('div.bank-account')
    if (option.value === 'transfer') {
      bankAccountDiv.style.display = 'block'
    } else {
      bankAccountDiv.style.display = 'none'
    } 
  }
})

preCheckAllProducts()

checkOutOfOrderProduct()

checkUser()

loadData(5)

// setTimeout(() => {
//   getLog(
//     topic = 'page-view', 
//     value = {
//       "user_id"   : window.uid,
//       "page_type" : 'orders',
//       "timestamp" : new Date(),
//     }
//   )
// }, 1000)