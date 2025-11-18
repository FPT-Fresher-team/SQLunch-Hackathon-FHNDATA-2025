importLinkCss('/css/user/ordersChecking.css')

const submitButton   = document.querySelector('button')
const orderContainer = document.querySelector('div.order-checking-container')
const errorMessage   = document.querySelector('span.error-message')

async function getOrder(id) {
  const response = await fetch('/all-orders/data/order', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({id: id})
  })
  if (!response.ok) throw new Error(`Response status: ${response.status}`)
  const {data, status} = await response.json()

  return {data: data, status: status}
}

function appendOrder(data, status) {
  const table = document.querySelector('table')
  if (table) table.remove()
  document.querySelector('span.error-message').textContent = ''
  const orderProcess = document.createElement('div')
  orderProcess.setAttribute('class', 'order-process')
  orderProcess.innerHTML = `
    <table>
      <thead>
        <tr>
          <td style="width: 40%">Order Date</td>
          <td style="width: 40%">Order Code</td>
          <td style="width: 20%">Details</td>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>${formatDate(data.createdAt)}</td>
          <td>${data._id}</td>
          <td><a href="/all-orders/order/${data._id}">Xem</td>
        </tr>
      </tbody>
    </table>            
  `
  orderContainer.appendChild(orderProcess)
  submitButton.classList.remove('loading')
}

// when submit, the form will push the input value from user to the URL for backend
submitButton.onclick = async function () {
  submitButton.classList.add('loading')
  const orderCode = document.querySelector('input#order-checking').value
  const regex = /^[a-f\d]{24}$/i
  if (regex.test(orderCode)) {
    const {data, status}  = await getOrder(orderCode)
    if (data) return appendOrder(data, status)
    errorMessage.innerText = 'Order Not Found'
    errorMessage.style.color = 'red'
    const table = document.querySelector('table')
    if (table) table.remove()
  }
  else {
    // if not matched, prevent submit, enter again
    errorMessage.innerText = 'Order Code Is Incorrect'
    errorMessage.style.color = 'red'
    const table = document.querySelector('table')
    if (table) table.remove()
  }
  submitButton.classList.remove('loading')
}