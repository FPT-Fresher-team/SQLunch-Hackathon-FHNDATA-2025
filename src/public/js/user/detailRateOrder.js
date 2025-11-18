// ok
importLinkCss('/css/user/detailRateOrder.css')

const submitBtn = document.querySelector("button[type='submit']")
const urlSlug = location.href.match(/([^\/]*)\/*$/)[1]

async function rateStar() {
  const rateDiv = document.querySelectorAll('div.rate-star')
  rateDiv.forEach((div) => {
    const stars = div.querySelectorAll('i')
    const score = div.querySelector('span.rate-score')
    stars.forEach((star, index) => {
      star.addEventListener('click', function() {
        score.innerText = index+1
        for (var i = 0; i < stars.length; i++) {
          if (i <= index) stars[i].style.color = 'orange'
          else stars[i].style.color = 'black'
        }
      })
    })
  })
}

async function submitRate(data) {
  submitBtn.onclick = async function() {
    try {
      if (data.isRated) return
      
      const rateProducts = document.querySelectorAll('td.rate-product')
      const Ids = []
      const comments = []
      const rates = []
      rateProducts.forEach((product) => {
        Ids.push(product.querySelector('input').id)
        comments.push(product.querySelector('input').value)
        rates.push(product.querySelector('span.rate-score').innerText.trim())
      })
  
      const response = await fetch('/all-orders/order/rate/updated', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          orderId: urlSlug,
          senderId: data.customerInfo.userId,
          productId: Ids, 
          productComment: comments, 
          productRate: rates})
      })
      if (!response.ok) throw new Error(`Response status: ${response.status}`)
      const {message, error} = await response.json()
      if (error) throw new Error(error)
  
      if (message) {
        pushNotification('Rated order successfully')
        setTimeout(() => window.location.reload(), 3000)
      } 
    }
    catch (err) {
      console.error("Error submitting rate:", err)
      pushNotification(`Error submitting rate: ${err}. Please try again later`)
    }
  }
}

async function getOrder() {
  const response = await fetch('/all-orders/data/order-rated', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({id: urlSlug})
  })
  if (!response.ok) throw new Error(`Response status: ${response.status}`)
  const {data, status} = await response.json()

  document.querySelector('td#id').textContent = data._id
  document.querySelector('td#date').textContent = formatDate(data.createdAt)
  document.querySelector('td#name').textContent = data.customerInfo.name
  document.querySelector('td#phone').textContent = data.customerInfo.phone
  document.querySelector('td#address').textContent = data.customerInfo.address
  document.querySelector('td#note').textContent = data.customerInfo.note
  document.querySelector('td#total-price').textContent = formatNumber(data.totalOrderPrice) 
  document.querySelector('td#status').textContent = status.name
  document.querySelector('td#isPaid').textContent = data.isPaid ? 'Paid' : 'Unpaid'

  if (data.isRated) {
    submitBtn.innerText = 'Rated'
    submitBtn.style.cursor = 'not-allowed'
    submitBtn.style.opacity = '0.5'
    submitBtn.disabled = true
  }

  data.products.forEach((product) => {
    // tr1
    const tr = document.createElement('tr')

    const nameGroup = document.createElement('td')
    const img = document.createElement('img')
    img.setAttribute('src', product.image)

    const name = document.createElement('a')
    name.setAttribute('href', '/all-products/product/' + product.id)
    name.textContent = product.name
    nameGroup.appendChild(img)
    nameGroup.appendChild(name)
    nameGroup.classList.add('name-group')

    const price = document.createElement('td')
    price.textContent = formatNumber(product.price) 

    const quantity = document.createElement('td')
    quantity.textContent = product.quantity

    const totalPrice = document.createElement('td')
    totalPrice.textContent = formatNumber(product.totalPrice) 

    tr.appendChild(nameGroup)
    tr.appendChild(price)
    tr.appendChild(quantity)
    tr.appendChild(totalPrice)

    // tr2
    const tr2 = document.createElement('tr')
    const td = document.createElement('td')
    td.setAttribute('colspan', 4)
    td.setAttribute('class', 'rate-product')

    const input = document.createElement('input')
    input.setAttribute('type', 'text')
    input.setAttribute('id', product.id)
    if (data.isRated) {
      input.setAttribute('value', product.comment)
      input.setAttribute('disabled', 'true')
    }

    const rateStar = document.createElement('div')
    if (data.isRated) {
      rateStar.innerHTML = `
        <div class="rate-star">
          <span>${product.rate}</span>
          <span>/</span>
          <span>5</span>
          <i class="fi fi-ss-star" style="color: orange"></i>
        </div>
      `
    } else {
      rateStar.innerHTML = `
        <div class="rate-star">
        <i class="fi fi-ss-star"></i>
        <i class="fi fi-ss-star"></i>
        <i class="fi fi-ss-star"></i>
        <i class="fi fi-ss-star"></i>
        <i class="fi fi-ss-star"></i>
        <span class="rate-score">0</span>
        <span>/</span>
        <span>5</span>
        </div>
      `
    }

    td.appendChild(input)
    td.appendChild(rateStar)
    tr2.appendChild(td)

    document.querySelector('table.all-products').querySelector('tbody').appendChild(tr)
    document.querySelector('table.all-products').querySelector('tbody').appendChild(tr2)
  })

  return data
}

async function loadData(retriesLeft) {
  try {
    const data = await getOrder()
    await rateStar()
    await submitRate(data)
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