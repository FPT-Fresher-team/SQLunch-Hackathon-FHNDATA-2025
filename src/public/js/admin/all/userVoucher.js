importLinkCss('/css/admin/all/userVouchers.css')

const tbody         = document.querySelector('table').querySelector('tbody')
const thead         = document.querySelector('table').querySelector('thead')
const changeColumns = document.querySelector('i.fi.fi-rr-objects-column')
const sortOptions   = {}
const filterOptions = {}
const currentPage   = { page: 1 }
const dataSize      = { size: 0 }

function generateColumns() {
  const columnsGroup = document.querySelector('div.checkbox-group')
  const inputList = `
    <label><input type="checkbox" value="userId" checked> Customer Code</label>
    <label><input type="checkbox" value="orderId"> Order Code</label>
    <label><input type="checkbox" value="code"> Discount Code</label>
    <label><input type="checkbox" value="description" checked> Description</label>
    <label><input type="checkbox" value="voucherType" checked> Voucher Type</label>
    <label><input type="checkbox" value="discount"> Discount Amount</label>
    <label><input type="checkbox" value="minOrder"> Minimum Order</label>
    <label><input type="checkbox" value="status"> Status</label>
    <label><input type="checkbox" value="startDate" checked> Start Date</label>
    <label><input type="checkbox" value="endDate"> End Date</label>
    <label><input type="checkbox" value="usedAt"> Used Date</label>
  `
  columnsGroup.insertAdjacentHTML('beforeend', inputList)
} 

async function getFilter() {
  // const response = await fetch('/admin/all-u-vouchers/data/filter', {
  //   method: 'POST',
  //   headers: {'Content-Type': 'application/json'},
  // })
  // if (!response.ok) throw new Error(`Response status: ${response.status}`)
  // const json = await response.json()
  // if (json.error) return pushNotification(error)
  
  // json.memberShip.forEach((element, index) => {
  //   const option = document.createElement('option')
  //   option.value = element.code
  //   option.textContent = element.name
  //   document.querySelector('select#memberCode').appendChild(option)
  // })
}

async function getVouchers(sortOptions, filterOptions, currentPage, itemsPerPage) {
  tbody.querySelectorAll('tr').forEach((tr, index) => {
    tr.querySelector('td:nth-child(1)').textContent = ''
    tr.querySelector('td:nth-child(1)').classList.add('loading')
  })

  const response = await fetch('/admin/all-u-vouchers/data/vouchers', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      sort  : sortOptions, 
      filter: filterOptions, 
      page  : currentPage,
      itemsPerPage: itemsPerPage
    })
  })
  if (!response.ok) throw new Error(`Response status: ${response.status}`)
  const {data, data_size, error} = await response.json()
  if (error) return pushNotification(error)

  dataSize.size = data_size

  document.querySelector('div.board-title').querySelector('p').textContent = 'Voucher: ' + dataSize.size

  const selected = Array.from(document.querySelectorAll('.checkbox-group input:checked')).map(cb => ({
    value: cb.value,
    name: cb.closest("label").innerText.trim()
  }))

  window.setTimeout(function() {
    thead.querySelectorAll('tr').forEach((tr, index) => {
      tr.remove()
    })

    // header
    const trHead = document.createElement("tr")

    const headData = document.createElement('td')
    headData.textContent = 'STT'
    trHead.appendChild(headData)

    selected.forEach(col => {
      const td = document.createElement("td")
      td.textContent = col.name
      trHead.appendChild(td)
    })

    const headLink = document.createElement('td')
    headLink.textContent = 'Details'
    trHead.appendChild(headLink)

    thead.appendChild(trHead)

    // body
    tbody.querySelectorAll('tr').forEach((tr, index) => {
      tr.remove()
    })

    let itemIndex = (currentPage - 1) * itemsPerPage + 1

    data.forEach((item, index) => {
      const newTr = document.createElement('tr')

      const itemData = document.createElement('td')
      itemData.textContent = itemIndex
      newTr.appendChild(itemData)

      selected.forEach(col => {
        const td = document.createElement("td")
        td.textContent = item[col.value]

        // voucherType
        // discount
        // minOrder
        // startDate
        // endDate
        // usedAt

        if (['discount', 'minOrder', 'startDate', 'endDate', 'usedAt'].includes(col.value) ) td.style.textAlign = 'right'
        if (['discount', 'minOrder'].includes(col.value)) td.textContent = formatNumber(item[col.value])
        if (['voucherType'].includes(col.value)) td.textContent = item[col.value] === 'order' ? 'Đặt đơn' : 'Sinh nhật'
        if (['startDate', 'endDate', 'usedAt'].includes(col.value)) td.textContent = formatDate(item[col.value])

        newTr.appendChild(td)
      })

      const link = document.createElement('td')
      link.innerHTML = `<a target="_blank" rel="noopener noreferrer" href="/admin/all-u-vouchers/voucher/${item._id}">View</a>`
      newTr.appendChild(link)
      tbody.appendChild(newTr)
      itemIndex++
    })
  }, 1000)
  
  pagination(getVouchers, sortOptions, filterOptions, currentPage, dataSize.size)
}

changeColumns.onclick = function() {
  const columnLists = document.querySelector('div.checkbox-group')
  columnLists.style.display === 'none' ? columnLists.style.display = 'block' : columnLists.style.display = 'none'
}

window.addEventListener('DOMContentLoaded', async function loadData() {
  try {
    generateColumns()
    await getFilter()
    await getVouchers(sortOptions, filterOptions, currentPage.page, 10)
    await sortAndFilter(getVouchers, sortOptions, filterOptions, currentPage.page)
    await exportJs('VOUCHER LIST REPORT')
  } catch (error) {
    console.error('Error loading data:', error)
    pushNotification(error)
  }
})