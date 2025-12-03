importLinkCss('/css/admin/all/employees.css')

// MAIN TABLE
const thead         = document.querySelector('table thead')
const tbody         = document.querySelector('table tbody')
const changeColumns = document.querySelector('i.fi.fi-rr-objects-column')
const sortOptions   = {}
const filterOptions = {}
const currentPage   = { page: 1 }
const dataSize      = { size: 0 }
const searchInput   = document.querySelector('input#search-input')

function generateColumns() {
  const columnsGroup = document.querySelector('div.checkbox-group')
  const inputList = `
    <label><input type="checkbox" value="_id" checked> Employee ID</label>
    <label><input type="checkbox" value="email" checked> Email</label>
    <label><input type="checkbox" value="role"> Position</label>
    <label><input type="checkbox" value="name" checked> Full Name</label>
    <label><input type="checkbox" value="phone"> Phone</label>
    <label><input type="checkbox" value="dob"> Date of Birth</label>
    <label><input type="checkbox" value="gender"> Gender</label>
    <label><input type="checkbox" value="address" checked> Address</label>
    <label><input type="checkbox" value="isActive"> Status</label>
  `
  columnsGroup.insertAdjacentHTML('beforeend', inputList)
}

async function getFilter() {
  const response = await fetch('/admin/all-employees/data/filter', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  })
  if (!response.ok) throw new Error(`Response status: ${response.status}`)
  const { position, error } = await response.json()
  if (error) return pushNotification(error)

  const roleSelect = document.querySelectorAll('select#role')
  if (roleSelect) {
    position.forEach(p => {
      const opt = document.createElement('option')
      opt.value = p.code
      opt.textContent = p.name
      roleSelect.forEach(select => select.appendChild(opt.cloneNode(true)))
    })
  }
}

async function getEmployees(sortOptions, filterOptions, currentPage, itemsPerPage) {
  // Show loading on "No" column
  tbody.querySelectorAll('tr').forEach(tr => {
    const firstTd = tr.querySelector('td:nth-child(1)');
    if (firstTd) {
      firstTd.textContent = '';
      firstTd.classList.add('loading');
    }
  });

  const payload = {
    page: currentPage,
    itemsPerPage: itemsPerPage,
    sort: sortOptions,
    filter: filterOptions
  };

  if (searchInput.value.trim()) payload.searchQuery = searchInput.value.trim();

  const response = await fetch('/admin/all-employees/data/employees', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) throw new Error(`Response status: ${response.status}`);
  const { data, data_size, error } = await response.json();
  if (error) return pushNotification(error);

  // Update total count
  dataSize.size = data_size;
  document.querySelector('div.board-title p').textContent = 'Employees: ' + dataSize.size;

  const selected = Array.from(document.querySelectorAll('.checkbox-group input[type="checkbox"]'))
    .slice(1)  // Skip the very first checkbox (the "Select All")
    .filter(cb => cb.checked)
    .map(cb => ({
      value: cb.value,
      name: cb.closest("label").innerText.trim()
    }));

  thead.querySelectorAll('tr').forEach((tr, index) => {
    tr.remove()
  })

  // HEADER
  const trHead = document.createElement("tr")

  const headData = document.createElement('td')
  headData.textContent = 'No'
  trHead.appendChild(headData)

  selected.forEach(col => {
    const td = document.createElement("td")
    td.textContent = col.name
    trHead.appendChild(td)
  })

  const headLink = document.createElement('td')
  headLink.textContent = 'Actions'
  trHead.appendChild(headLink)

  thead.appendChild(trHead)

  // BODY
  tbody.querySelectorAll('tr').forEach((tr, index) => {
    tr.remove()
  })

  data.forEach((emp, index) => {
    const tr = document.createElement('tr');

    // No column
    const tdNo = document.createElement('td');
    tdNo.textContent = index + (currentPage - 1) * itemsPerPage + 1;
    tr.appendChild(tdNo);

    // Dynamic selected columns
    selected.forEach(col => {
      const td = document.createElement("td");
      const value = emp[col.value];

      if (col.value === 'dob') {
        td.textContent = value ? formatDate(value) : '-';
        td.style.textAlign = 'center';
      }
      else if (col.value === 'gender') {
        td.textContent = value === 'male' ? 'Male' : value === 'female' ? 'Female' : '-';
      }
      else if (col.value === 'isActive') {
        const isOnline = !!value;
        td.textContent = isOnline ? 'Online' : 'Offline';
        td.style.color = isOnline ? 'green' : 'red';
        td.style.fontWeight = 'bold';
        td.style.textAlign = 'center';
      }
      else if (col.value === 'role') {
        td.textContent = emp.roleInfo?.name || emp.role || '-';
      }
      else if (col.value === 'avatar' || col.value === 'profileImage') {
        const imgSrc = emp.avatar?.path || emp.profileImage?.path;
        td.innerHTML = imgSrc
          ? `<img src="${imgSrc}" alt="avatar" style="width:40px;height:40px;border-radius:50%;object-fit:cover;">`
          : '<div style="width:40px;height:40px;background:#ddd;border-radius:50%;"></div>';
        td.style.textAlign = 'center';
      }
      else {
        td.textContent = value ?? '-';
      }

      tr.appendChild(td);
    });

    // Actions column
    const tdActions = document.createElement('td');
    tdActions.style.textAlign = 'center';
    tdActions.innerHTML = `
      <button class="view-btn" id="${emp._id}"><i class="fi fi-rr-eye"></i></button>
    `;

    tdActions.querySelector('.view-btn').onclick = () => openEmployeeDetail(emp._id);

    tr.appendChild(tdActions);
    tbody.appendChild(tr);
  });

  // Update pagination
  pagination(getEmployees, sortOptions, filterOptions, currentPage, dataSize.size);
}

// Toggle column selector
changeColumns.onclick = () => {
  const panel = document.querySelector('div.checkbox-group')
  panel.style.display = panel.style.display === 'none' ? 'block' : 'none'
}

// DETAIL MODAL
const detailModal     = document.querySelector('#detail-modal')
const closeBtn        = detailModal.querySelector('.close-modal')
const updateBtn       = detailModal.querySelector('button[type="submit"]')
let currentEmployee   = null

closeBtn.onclick = () => detailModal.classList.remove('show')
detailModal.onclick = e => { if (e.target === detailModal) detailModal.classList.remove('show') }

async function openEmployeeDetail(id) {
  try {
    detailModal.classList.add('show')

    const res = await fetch('/admin/all-employees/data/employee', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    })

    if (!res.ok) throw new Error(`Status: ${res.status}`)
    const { error, employeeInfo, positionsInfo } = await res.json()
    if (error) throw new Error(error)

    document.title = `${employeeInfo.name} - Employee Detail`

    // Fill basic info
    detailModal.querySelector('#id').value       = employeeInfo._id
    detailModal.querySelector('#name').value     = employeeInfo.name
    detailModal.querySelector('#email').value    = employeeInfo.email
    detailModal.querySelector('#phone').value    = employeeInfo.phone
    detailModal.querySelector('#address').value  = employeeInfo.address
    detailModal.querySelector('#dob').value      = employeeInfo.dob ? employeeInfo.dob.split('T')[0] : ''
    detailModal.querySelector('#date').value     = formatDate(employeeInfo.createdAt)

    // Gender radio
    detailModal.querySelectorAll('input[name="gender"]').forEach(radio => {
      radio.checked = radio.value === employeeInfo.gender
    })

    // Role + Salary
    const roleSelect = detailModal.querySelector('select#role')
    roleSelect.innerHTML = ''
    let currentWage = 0

    positionsInfo.forEach(pos => {
      const opt = document.createElement('option')
      opt.value = pos.code
      opt.textContent = pos.name
      if (pos.code === employeeInfo.role) {
        opt.selected = true
        currentWage = pos.wage || 0
      }
      roleSelect.appendChild(opt)
    })

    detailModal.querySelector('input#wage').value = formatNumber(currentWage)

    // Update salary display when role changes
    roleSelect.onchange = () => {
      const selected = positionsInfo.find(p => p.code === roleSelect.value)
      detailModal.querySelector('input#wage').value = formatNumber(selected?.wage || 0)
    }

    // Save for comparison on update
    currentEmployee = { ...employeeInfo, dob: employeeInfo.dob?.split('T')[0] || null }

  } catch (err) {
    console.error(err)
    pushNotification('Failed to load employee data')
    detailModal.classList.remove('show')
  }
}

async function updateEmployee() {
  try {
    if (!currentEmployee) return
  
    const name    = detailModal.querySelector('#name').value.trim()
    const role    = detailModal.querySelector('#role').value
    const phone   = detailModal.querySelector('#phone').value.trim()
    const address = detailModal.querySelector('#address').value.trim()
    const gender  = detailModal.querySelector('input[name="gender"]:checked')?.value
    const dob     = detailModal.querySelector('#dob').value || null
  
    // Check if anything changed
    if (
      name    === currentEmployee.name &&
      role    === currentEmployee.role &&
      phone   === currentEmployee.phone &&
      address === currentEmployee.address &&
      gender  === currentEmployee.gender &&
      dob     === currentEmployee.dob
    ) {
      return pushNotification('No changes detected')
    }
  
    updateBtn.classList.add('loading')
    const res = await fetch('/admin/all-employees/employee/updated', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: currentEmployee._id, name, role, phone, address, gender, dob })
    })
  
    if (!res.ok) throw new Error('Updated Failed')
  
    const { error, message } = await res.json()
    if (error) throw new Error(error)
  
    pushNotification(message)
    detailModal.classList.remove('show')
    updateBtn.classList.remove('loading')
    await getEmployees(sortOptions, filterOptions, currentPage.page, 10)
    
  } catch (error) {
    console.error('Error updating employee:', error)
    pushNotification("Employee update failed")
    updateBtn.classList.remove('loading')
  }
}

updateBtn.onclick = updateEmployee

// CREATE MODAL
const createModal     = document.querySelector('#create-modal')
const createBtn       = document.querySelector('.create-btn')
const createCloseBtn  = createModal?.querySelector('.close-modal')
const createSubmitBtn = createModal?.querySelector('button[type="submit"]')

createBtn.onclick = () => createModal.classList.add('show')
createCloseBtn.onclick = () => createModal.classList.remove('show')
createModal.onclick = e => { if (e.target === createModal) createModal.classList.remove('show') }

async function createEmployee() {
  try {
    const role            = createModal.querySelector('select[name="role"]')?.value
    const name            = createModal.querySelector('#name')?.value.trim()
    const email           = createModal.querySelector('#email')?.value.trim()
    const phone           = createModal.querySelector('#phone')?.value.trim()
    const address         = createModal.querySelector('#address')?.value.trim()
    const password        = createModal.querySelector('#password')?.value
    const confirmPassword = createModal.querySelector('#password-confirm')?.value
  
    if (password !== confirmPassword) return pushNotification('Passwords do not match!')
  
    if (!role || !name || !email || !phone || !address || !password) return pushNotification('Please fill in all required fields!')
  
    createSubmitBtn.classList.add('loading')
    const res = await fetch('/admin/all-employees/employee/created', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role, name, email, phone, address, password })
    })
  
    if (!res.ok) throw new Error('Created Failed')
    const { error, message } = await res.json()
    if (error) throw new Error(error)
  
    pushNotification(message)
    createModal.classList.remove('show')
    createSubmitBtn.classList.remove('loading')
    await getEmployees(sortOptions, filterOptions, currentPage.page, 10)
    
  } catch (error) {
    console.error('Error creating employee:', error)
    pushNotification("Employee creation failed")
    createSubmitBtn.classList.remove('loading')
  }
}

createSubmitBtn.onclick = createEmployee

// INIT
window.addEventListener('DOMContentLoaded', async () => {
  try {
    generateColumns()
    await getFilter()
    await getEmployees(sortOptions, filterOptions, currentPage.page, 10)
    await sortAndFilter(getEmployees, sortOptions, filterOptions, currentPage.page)
    await exportJs('EMPLOYEE LIST REPORT')
  } catch (err) {
    console.error(err)
    pushNotification('Failed to load data')
  }
})