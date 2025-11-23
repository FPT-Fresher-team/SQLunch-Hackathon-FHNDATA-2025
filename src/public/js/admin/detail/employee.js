importLinkCss('/css/admin/detail/employee.css')

const urlSlug = location.href.match(/([^\/]*)\/*$/)[1]

async function getEmployee() {
  const response = await fetch('/admin/all-employees/data/employee', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({id: urlSlug})
  })
  if (!response.ok) throw new Error(`Response status: ${response.status}`)
  const {error, employeeInfo, storesInfo, positionsInfo} = await response.json()
  if (error) return pushNotification('An error occurred')

  document.title = employeeInfo.name

  document.querySelector('input#id').value       = employeeInfo._id
  document.querySelector('input#name').value     = employeeInfo.name

  positionsInfo.forEach((element, index) => {
    const option = document.createElement('option')
    option.value = element.code
    option.textContent = element.name
    if (element.code === employeeInfo.role) {
      option.selected = true
      document.querySelector('input#wage').value = formatNumber(element.wage)
    } 

    document.querySelector('select#role').appendChild(option)
  })


  document.querySelector('input#email').value    = employeeInfo.email
  document.querySelector('input#phone').value    = employeeInfo.phone
  document.querySelector('input#address').value  = employeeInfo.address
  document.querySelector('input#dob').value      = employeeInfo.dob === null ? null : employeeInfo.dob.split('T')[0]
  document.querySelectorAll('input[name="gender"]').forEach((input) => {
    if (input.value === employeeInfo.gender) input.checked = true
  })

  document.querySelector('input#date').value = formatDate(employeeInfo.createdAt)

  return employeeInfo
}

async function updateEmployee(employeeInfo) {
  const name    = document.querySelector('input#name').value
  const role    = document.querySelector('select#role').value
  const phone   = document.querySelector('input#phone').value
  const address = document.querySelector('input#address').value
  const gender  = document.querySelector('input[name="gender"]:checked').value
  const dob     = document.querySelector('input#dob').value

  const initialDob = employeeInfo.dob === null ? null : customerInfo.dob.split('T')[0] 

  if (
    name    === employeeInfo.name    &&
    role    === employeeInfo.role    &&
    phone   === employeeInfo.phone   &&
    address === employeeInfo.address &&
    gender  === employeeInfo.gender  &&
    dob     === initialDob
  ) return pushNotification('Please update the information')

  const response = await fetch('/admin/all-employees/employee/updated', {
    method: 'PUT',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      id      : urlSlug,
      name    : name,
      role    : role,
      phone   : phone,
      address : address,
      gender  : gender,
      dob     : dob
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
    const employeeInfo = await getEmployee()

    document.querySelector('button[type="submit"]').onclick = function() {
      updateEmployee(employeeInfo)
    }
  } catch (error) {
    console.error('An error occurred:', error)
    pushNotification('An error occurred')
  }
})