importLinkCss('/css/admin/attribute.css')

async function createAttribute(id, rowIndex) {
  const row = document.querySelector(`div.${id}`).querySelector('table').rows[rowIndex]
  const code = row.querySelector('input#code').value
  const name = row.querySelector('input#name').value
  const wage = deFormatNumber(row.querySelector('input#wage')?.value)
  const order = row.querySelector('input#order')?.value

  if (code === '' || name === '' || wage === '' || order === '') {
    return pushNotification('Please fill in all information.')
  }
  
  const response = await fetch(`/admin/all-attributes/create/${id}`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({code: code, name: name, wage: wage, order: order})
  })
  if (!response.ok) throw new Error(`Response status: ${response.status}`)
  const {error, message} = await response.json()
  
  if (error) return pushNotification(error)
  pushNotification(message)

  row.querySelector('input#code').disabled = true
  row.querySelector('input#name').disabled = true
  const wageInput = row.querySelector('input#wage')
  if (wageInput) wageInput.disabled = true
  const orderInput = row.querySelector('input#order')
  if (orderInput) orderInput.disabled = true

  row.querySelector('td:last-child').innerHTML = `
    <button id="${id}" onclick="updateAttribute(this.id, this.parentElement.parentElement.rowIndex)"><i class="fi fi-rr-refresh"></i></button>
    <button id="${id}" onclick="deleteAttribute(this.id, this.parentElement.parentElement.rowIndex)"><i class="fi fi-tr-trash-slash"></i></button>
  `
  return
}

async function deleteAttribute(id, rowIndex) {
  const row = document.querySelector(`div.${id}`).querySelector('table').rows[rowIndex]
  if (confirm('Are you sure you want to delete?')) {
    const code = row.querySelector('input#code').value
    const name = row.querySelector('input#name').value
    const response = await fetch(`/admin/all-attributes/delete/${id}`, {
      method: 'DELETE',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({code: code, name: name})
    })
    if (!response.ok) throw new Error(`Response status: ${response.status}`)
    const {error, message} = await response.json()
  
    if (error) return pushNotification(error)
    pushNotification(message)

    deleteRow(id, rowIndex)
  } 

  return
}

async function updateAttribute(id, rowIndex) {
  const row = document.querySelector(`div.${id}`).querySelector('table').rows[rowIndex]
  if (row.querySelector('input#name').disabled === true) {
    const button = document.createElement('button')
    button.innerHTML = `<i class="fi fi-rr-check"></i>`
    button.addEventListener('click', async function() {
      const code = row.querySelector('input#code').value
      const name = row.querySelector('input#name').value
      const wage = deFormatNumber(row.querySelector('input#wage')?.value)
      const order = deFormatNumber(row.querySelector('input#order')?.value)

      if (code === '' || name === '' || wage === '' || order === '') {
        return pushNotification('Please fill in all information.')
      }

      const response = await fetch(`/admin/all-attributes/update/${id}`, {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({code: code, name: name, wage: wage, order: order})
      })

      if (!response.ok) throw new Error(`Response status: ${response.status}`)
      const {error, message} = await response.json()
  
      if (error) return pushNotification(error)
      pushNotification(message)

      row.querySelector('input#name').disabled = true
      const wageInput = row.querySelector('input#wage')
      if (wageInput) wageInput.disabled = true

      const orderInput = row.querySelector('input#order')
      if (orderInput) orderInput.disabled = true

      row.querySelector('input#name').parentElement.querySelector('button').remove()
    })
    
    row.querySelector('input#name').disabled = false
    const wageInput = row.querySelector('input#wage')
    if (wageInput) wageInput.disabled = false

    const orderInput = row.querySelector('input#order')
    if (orderInput) orderInput.disabled = false

    row.querySelector('input#name').parentElement.appendChild(button)

  } else {
      row.querySelector('input#name').disabled = true
      const wageInput = row.querySelector('input#wage')
      if (wageInput) wageInput.disabled = true

      const orderInput = row.querySelector('input#order')
      if (orderInput) orderInput.disabled = true

    row.querySelector('input#name').parentElement.querySelector('button').remove()
  }
}

function deleteRow(id, rowIndex) {
  document.querySelector(`div.${id}`).querySelector('table').deleteRow(rowIndex)
}

function addRow(id) {
  const tbody = document.querySelector(`div.${id}`).querySelector('tbody')
  const tr = document.createElement('tr')
  if (id === 'position') {
    tr.innerHTML = `
      <td><input type="text" id="code" placeholder="Enter code"></td>
      <td><input type="text" id="wage" placeholder="Enter salary"></td>
      <td><input type="text" id="name" placeholder="Enter name"></td>
      <td data-id="${id}">
        <button id="create">
          <i class="fi fi-rr-check"></i>
        </button>
        <button id="delete" onclick="deleteRow(this.parentElement.dataset.id, this.parentElement.parentElement.rowIndex)"><i class="fi fi-rr-cross-small"></i></button>
      </td>
    `
  } else if (id === 'order-status') {
    tr.innerHTML = `
      <td><input type="text" id="order" placeholder="Enter order"></td>
      <td><input type="text" id="code" placeholder="Enter code"></td>
      <td><input type="text" id="name" placeholder="Enter name"></td>
      <td data-id="${id}">
        <button id="create">
          <i class="fi fi-rr-check"></i>
        </button>
        <button id="delete" onclick="deleteRow(this.parentElement.dataset.id, this.parentElement.parentElement.rowIndex)"><i class="fi fi-rr-cross-small"></i></button>
      </td>
    `
  } else {
    tr.innerHTML = `
      <td><input type="text" id="code" placeholder="Enter code"></td>
      <td><input type="text" id="name" placeholder="Enter name"></td>
      <td data-id="${id}">
        <button id="create">
          <i class="fi fi-rr-check"></i>
        </button>
        <button id="delete" onclick="deleteRow(this.parentElement.dataset.id, this.parentElement.parentElement.rowIndex)"><i class="fi fi-rr-cross-small"></i></button>
      </td>
    `
  }
  tbody.appendChild(tr)
 
  tr.querySelector("td[data-id]").querySelector('button#create').addEventListener("click", function () {
    createAttribute(this.parentElement.dataset.id, this.parentElement.parentElement.rowIndex)
  })
}

async function getMembership() {
  const response = await fetch('/admin/all-attributes/data/membership')
  if (!response.ok) throw new Error(`Response status: ${response.status}`)

  const {error, data} = await response.json()
  if (error) return pushNotification(error)

  const table = document.createElement('div')
  table.innerHTML = `
    <table>
      <thead>
        <tr><td colspan="3">MEMBER RANK</td></tr>
      </thead>
      <thead>
        <tr>
          <td>Code</td>
          <td>Name</td>
          <td>Action</td>
        </tr>
      <tbody>
        ${data.map(item => 
          `
            <tr>
              <td><input type="text" id="code" value="${item.code}" disabled></td>
              <td><input type="text" id="name" value="${item.name}" disabled></td>
              <td>
                <button id="membership" onclick="updateAttribute(this.id, this.parentElement.parentElement.rowIndex)"><i class="fi fi-rr-refresh"></i></button>
                <button id="membership" onclick="deleteAttribute(this.id, this.parentElement.parentElement.rowIndex)"><i class="fi fi-tr-trash-slash"></i></button>
              </td>
            </tr>
          `
        ).join("")}
      </tbody>
    </table>
    <div class="submit-button"><button id="membership" onclick="addRow(this.id)">Add</button></div>
  `

  document.querySelector('div.membership').appendChild(table)
}

async function getOrderStatus() {
  const response = await fetch('/admin/all-attributes/data/order-status')
  if (!response.ok) throw new Error(`Response status: ${response.status}`)
  
  const {error, data} = await response.json()
  if (error) return pushNotification(error)

  const table = document.createElement('div')
  table.innerHTML = `
    <table>
      <thead>
        <tr><td colspan="4">ORDER STATUS</td></tr>
      </thead>
      <thead>
        <tr>
          <td>Order</td>
          <td>Code</td>
          <td>Name</td>
          <td>Action</td>
        </tr>
      <tbody>
        ${data.map(item => 
          `
            <tr>
              <td><input type="text" id="order" value="${item.order}" disabled></td>
              <td><input type="text" id="code" value="${item.code}" disabled></td>
              <td><input type="text" id="name" value="${item.name}" disabled></td>
              <td>
                <button id="order-status" onclick="updateAttribute(this.id, this.parentElement.parentElement.rowIndex)"><i class="fi fi-rr-refresh"></i></button>
                <button id="order-status" onclick="deleteAttribute(this.id, this.parentElement.parentElement.rowIndex)"><i class="fi fi-tr-trash-slash"></i></button>
              </td>
            </tr>
          `
        ).join("")}
      </tbody>
    </table>
    <div class="submit-button"><button id="order-status" onclick="addRow(this.id)">Add</button></div>
  `

  document.querySelector('div.order-status').appendChild(table)
}

async function getPaymentMethod() {
  const response = await fetch('/admin/all-attributes/data/payment-method')
  if (!response.ok) throw new Error(`Response status: ${response.status}`)
  
  const {error, data} = await response.json()
  if (error) return pushNotification(error)

  const table = document.createElement('div')
  table.innerHTML = `
    <table>
      <thead>
        <tr><td colspan="3">PAYMENT METHOD</td></tr>
      </thead>
      <thead>
        <tr>
          <td>Code</td>
          <td>Name</td>
          <td>Action</td>
        </tr>
      <tbody>
        ${data.map(item => 
          `
            <tr>
              <td><input type="text" id="code" value="${item.code}" disabled></td>
              <td><input type="text" id="name" value="${item.name}" disabled></td>
              <td>
                <button id="payment-method" onclick="updateAttribute(this.id, this.parentElement.parentElement.rowIndex)"><i class="fi fi-rr-refresh"></i></button>
                <button id="payment-method" onclick="deleteAttribute(this.id, this.parentElement.parentElement.rowIndex)"><i class="fi fi-tr-trash-slash"></i></button>
              </td>
            </tr>
          `
        ).join("")}
      </tbody>
    </table>
    <div class="submit-button"><button id="payment-method" onclick="addRow(this.id)">Add</button></div>
  `

  document.querySelector('div.payment-method').appendChild(table)
}

async function getPosition() {
  const response = await fetch('/admin/all-attributes/data/position')
  if (!response.ok) throw new Error(`Response status: ${response.status}`)
  
  const {error, data} = await response.json()
  if (error) return pushNotification(error)

  const table = document.createElement('div')
  table.innerHTML = `
    <table>
      <thead>
        <tr><td colspan="4">JOB POSITION</td></tr>
      </thead>
      <thead>
        <tr>
          <td style="width: 23%;">Code</td>
          <td style="width: 30%;">Salary</td>
          <td style="width: 30%;">Name</td>
          <td style="width: 17%;">Action</td>
        </tr>
      <tbody>
        ${data.map(item => 
          `
            <tr>
              <td><input type="text" id="code" value="${item.code}" disabled></td>
              <td><input type="text" id="wage" value="${formatNumber(item.wage)}" disabled></td>
              <td><input type="text" id="name" value="${item.name}" disabled></td>
              <td>
                <button id="position" onclick="updateAttribute(this.id, this.parentElement.parentElement.rowIndex)"><i class="fi fi-rr-refresh"></i></button>
                <button id="position" onclick="deleteAttribute(this.id, this.parentElement.parentElement.rowIndex)"><i class="fi fi-tr-trash-slash"></i></button>
              </td>
            </tr>
          `
        ).join("")}
      </tbody>
    </table>
    <div class="submit-button"><button id="position" onclick="addRow(this.id)">Add</button></div>
  `

  document.querySelector('div.position').appendChild(table)
}

async function getProductStatus() {
  const response = await fetch('/admin/all-attributes/data/product-status')
  if (!response.ok) throw new Error(`Response status: ${response.status}`)
  
  const {error, data} = await response.json()
  if (error) return pushNotification(error)

  const table = document.createElement('div')
  table.innerHTML = `
    <table>
      <thead>
        <tr><td colspan="3">PRODUCT STATUS</td></tr>
      </thead>
      <thead>
        <tr>
          <td>Code</td>
          <td>Name</td>
          <td>Action</td>
        </tr>
      <tbody>
        ${data.map(item => 
          `
            <tr>
              <td><input type="text" id="code" value="${item.code}" disabled></td>
              <td><input type="text" id="name" value="${item.name}" disabled></td>
              <td>
                <button id="product-status" onclick="updateAttribute(this.id, this.parentElement.parentElement.rowIndex)"><i class="fi fi-rr-refresh"></i></button>
                <button id="product-status" onclick="deleteAttribute(this.id, this.parentElement.parentElement.rowIndex)"><i class="fi fi-tr-trash-slash"></i></button>
              </td>
            </tr>
          `
        ).join("")}
      </tbody>
    </table>
    <div class="submit-button"><button id="product-status" onclick="addRow(this.id)">Add</button></div>
  `

  document.querySelector('div.product-status').appendChild(table)
}

window.addEventListener('DOMContentLoaded', async function loadData() {
  try {
    await getMembership()
    await new Promise(r => setTimeout(r, 200))
    
    await getOrderStatus()
    await new Promise(r => setTimeout(r, 200))
    
    await getPaymentMethod()
    await new Promise(r => setTimeout(r, 200))
    
    await getPosition()
    await new Promise(r => setTimeout(r, 200))
    
    await getProductStatus()
  } catch (error) {
    console.error('An error occurred:', error)
    pushNotification('An error occurred')
  }
})