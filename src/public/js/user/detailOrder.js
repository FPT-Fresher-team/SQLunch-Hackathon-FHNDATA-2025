importLinkCss('/css/user/detailOrder.css')

const urlSlug = location.href.match(/([^\/]*)\/*$/)[1]

async function getOrder() {
  const response = await fetch('/all-orders/data/order', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({id: urlSlug})
  })
  if (!response.ok) throw new Error(`Response status: ${response.status}`)
  const {data, status, method, error} = await response.json()

  if (error) return pushNotification(error)

  document.querySelector('td#id').textContent = data._id || ''
  document.querySelector('td#date').textContent = formatDate(data.createdAt) || ''
  document.querySelector('td#name').textContent = data.customerInfo.name || ''
  document.querySelector('td#phone').textContent = data.customerInfo.phone || ''
  document.querySelector('td#address').textContent = data.customerInfo.address || ''
  document.querySelector('td#note').textContent = data.customerInfo.note || ''
  document.querySelector('td#total-price').textContent = formatNumber(data.totalOrderPrice) || ''
  document.querySelector('td#total-new-price').textContent = formatNumber(data.totalNewOrderPrice) || ''
  document.querySelector('td#payment-method').textContent = method.name || ''
  document.querySelector('td#status').textContent = status.name || ''
  document.querySelector('td#isPaid').textContent = data.isPaid ? 'Đã thanh toán' : 'Chưa thanh toán'
  if (data.status === 'delivered' && data.isPaid) {
    const div = document.createElement("div")
    div.className = "button"

    const button = document.createElement("button")
    button.className = "submit-button"
    button.textContent = "Đã nhận hàng thành công"

    div.appendChild(button)

    document.querySelector('div.detail-order-container').appendChild(div)
    button.onclick = async function() {
      const confirmMessage = document.createElement('div')
      confirmMessage.setAttribute('class', 'update-order-message')
      confirmMessage.innerHTML = `
        <h2>Bạn xác nhận đã nhận hàng rồi chứ ?</h2>
        <div class="actions">
          <button 
            id="delete-button" 
            type="button" 
            class="deletebtn"
            onclick="document.querySelector('div.update-order-message').remove()"
          ">Huỷ</button>
          <button type="button" class="confirmbtn" onclick="updateOrder()">Đồng ý</button>
        </div>
      `
      document.body.appendChild(confirmMessage)
    }
  }

  data.products.forEach((product) => {
    const tr = document.createElement('tr')

    const nameGroup = document.createElement('td')
    const img = document.createElement('img')
    img.setAttribute('src', product.image || '')

    const name = document.createElement('a')
    name.setAttribute('href', '/all-products/product/' + product.id)
    name.textContent = product.name || ''
    nameGroup.appendChild(img)
    nameGroup.appendChild(name)
    nameGroup.classList.add('name-group')

    const price = document.createElement('td')
    price.setAttribute('style', 'text-align:right')
    price.textContent = formatNumber(product.price || '') 

    const quantity = document.createElement('td')
    quantity.setAttribute('style', 'text-align:right')
    quantity.textContent = product.quantity || ''

    const totalPrice = document.createElement('td')
    totalPrice.setAttribute('style', 'text-align:right')
    totalPrice.textContent = formatNumber(product.totalPrice || '') 

    tr.appendChild(nameGroup)
    tr.appendChild(price)
    tr.appendChild(quantity)
    tr.appendChild(totalPrice)

    document.querySelector('table.all-products').querySelector('tbody').appendChild(tr)
  })

  return
}

async function updateOrder() {
  try {
    const response = await fetch('/all-orders/order/updated', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({id: urlSlug})
    })
    if (!response.ok) throw new Error(`Response status: ${response.status}`)
    const {error, message} = await response.json()
    if (error) return pushNotification(error)
    pushNotification(message)

    setTimeout(() => window.location.reload(), 3000)
  } catch (err) {
    console.error("Error confirming order receipt:", err)
    pushNotification(`Error confirming order receipt: ${err}. Please try again later`)
  }
}

async function loadData(retriesLeft) {
  try {
    getOrder()
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