importLinkCss('/css/admin/home.css')

async function getFinance(fetchBody) {
  const response = await fetch('/admin/all/data/finance', fetchBody)
  if (!response.ok) throw new Error(`Response status: ${response.status}`)
  const {revenue, cost, wage} = await response.json()

  const table = document.createElement('table')
  table.innerHTML = `
    <thead>
      <tr><td colspan="3">FINANCIAL MANAGEMENT</td></tr>
    </thead>
    <tbody>
      <tr>
        <td>Revenue</td>
        <td>${formatNumber(revenue)}</td>
      </tr>
      <tr>
        <td>Cost of Goods</td>
        <td>${formatNumber(cost)}</td>
      </tr>
      <tr>
        <td>Wage Expense</td>
        <td>${formatNumber(wage)}</td>
      </tr>
      <tr>
        <td>Profit</td>
        <td>${formatNumber(revenue-cost-wage)}</td>
      </tr>
    </tbody>
  `

  if (document.querySelector('div.finance').contains(document.querySelector("table"))) {
    document.querySelector("table").remove()
  }

  document.querySelector('div.finance').appendChild(table)
}

async function getOrders(fetchBody) {
  const response = await fetch('/admin/all/data/orders', fetchBody)
  if (!response.ok) throw new Error(`Response status: ${response.status}`)
  const {data, status} = await response.json()

  const table = document.createElement('table')
  table.innerHTML = `
    <thead>
      <tr><td colspan="3">ORDER MANAGEMENT</td></tr>
    </thead>
    <tbody>
      <tr>
        <td>Order Quantity</td>
        <td>${data.length}</td>
        <td><a href="/admin/all-orders">Details</a></td>
      </tr>
    </tbody>
  `

  const orderDiv = document.querySelector('div.order')
  const oldTable = orderDiv.querySelector("table")

  if (oldTable) oldTable.remove()
  orderDiv.appendChild(table)

  const orderStatusCtx = document.getElementById("order-status")
  Chart.getChart(orderStatusCtx)?.destroy()
  new Chart(orderStatusCtx, {
    type: 'doughnut',
    options: {
      plugins: {
        legend: {
          display: false
        },
        title: {
          display: true,
          text: 'ORDER STATUS'
        }
      }
    },
    data: {
      labels: Array.from(status.map((status) => status.name)),
      datasets: [{
        data: status.map((status) => {
          return data.filter((order) => order.status === status.code).length
        }),
        borderWidth: 1,
      }]
    }
  })
  
  const orderCtx = document.getElementById("order")
  Chart.getChart(orderCtx)?.destroy()
  
  // Prepare data for line chart
  const orderDates = Array.from(new Set(data.map(order => formatDate(order.createdAt))))
  const orderCounts = orderDates.map(date => 
    data.filter(order => formatDate(order.createdAt) === date).length
  )
  
  new Chart(orderCtx, {
    type: 'line',
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: false
        },
        title: {
          display: true,
          text: 'ORDERS OVER TIME',
          font: {
            size: 14,
            weight: 'bold'
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1
          }
        }
      }
    },
    data: {
      labels: orderDates,
      datasets: [{
        label: 'Number of Orders',
        data: orderCounts,
        borderColor: '#4E79A7',
        backgroundColor: 'rgba(78, 121, 167, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointRadius: 5,
        pointBackgroundColor: '#4E79A7',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointHoverRadius: 7
      }]
    }
  })
}

async function getCustomers(fetchBody) {
  const response = await fetch('/admin/all/data/customers', fetchBody)
  if (!response.ok) throw new Error(`Response status: ${response.status}`)
  const {data, members} = await response.json()

  const table = document.createElement('table')
  table.innerHTML = `
    <thead>
      <tr><td colspan="3">CUSTOMER MANAGEMENT</td></tr>
    </thead>
    <tbody>
      <tr>
        <td>Số lượng khách hàng</td>
        <td>${data.length}</td>
        <td><a href="/admin/all-customers">Details</a></td>
      </tr>
    </tbody>
  `

  const customerDiv = document.querySelector('div.customer')
  const oldTable = customerDiv.querySelector("table")

  if (oldTable) oldTable.remove()
  customerDiv.appendChild(table)

  const customerMembershipCtx = document.getElementById("customer-membership")
  Chart.getChart(customerMembershipCtx)?.destroy()
  new Chart(customerMembershipCtx, {
    type: 'pie',
    options: {
      plugins: {
        legend: {
          display: false
        },
        title: {
          display: true,
          text: 'HẠNG THÀNH VIÊN'
        }
      }
    },
    data: {
      labels: Array.from(members.map((member) => member.name)),
      datasets: [{
        data: members.map((member) => {
          return data.filter((user) => user.memberCode === member.code).length
        }),
        borderWidth: 1,
      }]
    }
  })

  const customerCtx = document.getElementById("customer")
  Chart.getChart(customerCtx)?.destroy()
  
  // Prepare data for line chart
  const customerDates = Array.from(new Set(data.map(user => formatDate(user.createdAt))))
  const customerCounts = customerDates.map(date => 
    data.filter(user => formatDate(user.createdAt) === date).length
  )
  
  new Chart(customerCtx, {
    type: 'line',
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: false
        },
        title: {
          display: true,
          text: 'KHÁCH HÀNG THEO THỜI GIAN',
          font: {
            size: 14,
            weight: 'bold'
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1
          }
        }
      }
    },
    data: {
      labels: customerDates,
      datasets: [{
        label: 'Number of Customers',
        data: customerCounts,
        borderColor: '#F28E2B',
        backgroundColor: 'rgba(242, 142, 43, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointRadius: 5,
        pointBackgroundColor: '#F28E2B',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointHoverRadius: 7
      }]
    }
  })
}

async function getEmployees(fetchBody) {
  const response = await fetch('/admin/all/data/employees', fetchBody)
  if (!response.ok) throw new Error(`Response status: ${response.status}`)
  const {data, positions} = await response.json()

  const table = document.createElement('table')
  table.innerHTML = `
    <thead>
      <tr><td colspan="3">EMPLOYEE MANAGEMENT</td></tr>
    </thead>
    <tbody>
      <tr>
        <td>Số lượng nhân sự</td>
        <td>${data.length}</td>
        <td><a href="/admin/all-employees">Details</a></td>
      </tr>
    </tbody>
  `

  const employeeDiv = document.querySelector('div.employee')
  const oldTable = employeeDiv.querySelector("table")

  if (oldTable) oldTable.remove()
  employeeDiv.appendChild(table)

  const employeeRoleCtx = document.getElementById("employee-role")
  Chart.getChart(employeeRoleCtx)?.destroy()
  new Chart(employeeRoleCtx, {
    type: 'doughnut',
    options: {
      plugins: {
        legend: {
          display: false
        },
        title: {
          display: true,
          text: 'VỊ TRÍ NHÂN SỰ'
        }
      }
    },
    data: {
      labels: Array.from(positions.map((position) => position.name)),
      datasets: [{
        data: positions.map((position) => {
          return data.filter((user) => user.role === position.code).length
        }),
        borderWidth: 1,
      }]
    }
  })

  const employeeCtx = document.getElementById("employee")
  Chart.getChart(employeeCtx)?.destroy()
  new Chart(employeeCtx, {
    type: 'bar',
    options: {
      plugins: {
        legend: {
          display: false
        },
        title: {
          display: true,
          text: 'NHÂN SỰ THEO THỜI GIAN'
        }
      }
    },
    data: {
      labels: Array.from(new Set(data.map(user => formatDate(user.createdAt)))),
      datasets: [{
        data: data.map(user => user.createdAt).reduce((acc, date) => {
          const formattedDate = formatDate(date)
          acc[formattedDate] = (acc[formattedDate] || 0) + 1
          return acc
        }, {}),
        borderWidth: 1,
        backgroundColor: '#E15759'
      }]
    }
  })
}

async function getProducts() {
  const response = await fetch('/admin/all/data/products')
  if (!response.ok) throw new Error(`Response status: ${response.status}`)
  const {data} = await response.json()

  const table = document.createElement('table')
  table.innerHTML = `
    <thead>
      <tr><td colspan="3">PRODUCT MANAGEMENT</td></tr>
    </thead>
    <tbody>
      <tr>
        <td>Số lượng sản phẩm</td>
        <td>${data.length}</td>
        <td><a href="/admin/all-products/?page=&type=">Details</a></td>
      </tr>
    </tbody>
  `

  const productDiv = document.querySelector('div.product')
  const oldTable = productDiv.querySelector("table")

  if (oldTable) oldTable.remove()
  productDiv.appendChild(table)

  const productCtx = document.getElementById("product")
  Chart.getChart(productCtx)?.destroy()
  new Chart(productCtx, {
    type: 'bar',
    options: {
      plugins: {
        legend: {
          display: false
        },
        title: {
          display: true,
          text: 'SẢN PHẨM THEO DANH MỤC'
        }
      }
    },
    data: {
      labels: ['Skincare', 'Makeup'],
      datasets: [{
        data: [
          data.filter(product => product.categories === 'skincare').length, 
          data.filter(product => product.categories === 'makeup').length
        ],
        borderWidth: 1,
        backgroundColor: '#76B7B2'
      }]
    }
  })

  const productCategoryCtx = document.getElementById("product-category")
  Chart.getChart(productCategoryCtx)?.destroy()
  new Chart(productCategoryCtx, {
    type: 'pie',
    options: {
      plugins: {
        legend: {
          display: false
        },
        title: {
          display: true,
          text: 'TỈ LỆ DOANH THU'
        }
      }
    },
    data: {
      labels: ['Skincare', 'Makeup'],
      datasets: [{
        data: [
          data.filter(product => product.categories === 'skincare').reduce((acc, product) => acc + product.price * product.saleNumber, 0), 
          data.filter(product => product.categories === 'makeup').reduce((acc, product) => acc + product.price * product.saleNumber, 0)
        ],
        borderWidth: 1,
      }]
    }
  })
}

async function getProductAnalytics() {
  try {
    // Load summary metrics
    const summaryRes = await fetch('/admin/analytics/summary')
    const summaryData = await summaryRes.json()
    if (summaryData.success) {
      document.getElementById('home-total-views').textContent = summaryData.data.totalViews.toLocaleString('vi-VN')
      document.getElementById('home-total-sales').textContent = summaryData.data.totalSales.toLocaleString('vi-VN')
    }

    // Load top viewed
    const viewedRes = await fetch('/admin/analytics/top-viewed?limit=5')
    const viewedData = await viewedRes.json()
    if (viewedData.success) {
      renderHomeTopProducts('home-top-viewed', viewedData.data, 'viewed')
    }

    // Load top purchased
    const purchasedRes = await fetch('/admin/analytics/top-purchased?limit=5')
    const purchasedData = await purchasedRes.json()
    if (purchasedData.success) {
      renderHomeTopProducts('home-top-purchased', purchasedData.data, 'purchased')
    }
  } catch (error) {
    console.error('Error loading product analytics:', error)
  }
}

async function getOrderAnalytics() {
  try {
    // Payment success rate + by method
    const paymentRes = await fetch('/admin/analytics/payment-success-rate-by-method')
    const paymentData = await paymentRes.json()
    if (paymentData.success && paymentData.data) {
      const overall = paymentData.data.overallRate || 0
      document.getElementById('home-payment-success-rate').textContent = `${Number(overall).toFixed(2)}%`
      const methods = paymentData.data.rateByMethod || []
      renderPaymentMethods('home-add-to-cart-by-method', methods)
    }

    // Add-to-cart overall rate (uses add-to-cart by product endpoint for overall rate)
    const addRes = await fetch('/admin/analytics/add-to-cart-rate-by-product')
    const addData = await addRes.json()
    if (addData.success && addData.data) {
      const overallAdd = addData.data.overallRate || 0
      document.getElementById('home-add-to-cart-rate').textContent = `${Number(overallAdd).toFixed(2)}%`
    }
  } catch (error) {
    console.error('Error loading order analytics:', error)
  }
}

function renderPaymentMethods(elementId, items) {
  const container = document.getElementById(elementId)
  if (!items || items.length === 0) {
    container.innerHTML = '<p style="color: #999;">No data</p>'
    return
  }

  let html = `
    <table style="width:100%; border-collapse: collapse;">
      <thead style="background: linear-gradient(90deg, #2c7a7b, #6fb3b8); color: #fff;">
        <tr>
          <th style="text-align:left; padding:8px;">PAYMENT METHOD</th>
          <th style="text-align:center; padding:8px;">TOTAL ORDERS</th>
          <th style="text-align:center; padding:8px;">SUCCESSFUL</th>
          <th style="text-align:center; padding:8px;">SUCCESS RATE</th>
        </tr>
      </thead>
      <tbody>
  `

  items.forEach(item => {
    const method = item.paymentMethod || 'Unknown'
    const total = item.total ?? 0
    const successful = item.successful ?? 0
    const rate = item.rate ?? 0
    const color = rate >= 60 ? '#28a745' : (rate >= 30 ? '#ffc107' : '#e74c3c')

    html += `
      <tr style="border-bottom: 1px solid #f0f0f0;">
        <td style="padding:8px">${method}</td>
        <td style="text-align:center; padding:8px">${total}</td>
        <td style="text-align:center; padding:8px">${successful}</td>
        <td style="text-align:center; padding:8px; color:${color};"><strong>${Number(rate).toFixed(2)}%</strong></td>
      </tr>
    `
  })

  html += `</tbody></table>`
  container.innerHTML = html
}

function renderHomeTopProducts(elementId, items, type) {
  const container = document.getElementById(elementId)
  if (items.length === 0) {
    container.innerHTML = '<p style="color: #999;">No data</p>'
    return
  }

  let html = '<ul style="list-style: none; padding: 0; margin: 0;">'
  items.forEach(item => {
    const count = type === 'viewed' ? item.viewCount : item.purchaseCount
    html += `
      <li style="padding: 4px 0; border-bottom: 1px solid #f0f0f0;">
        <small><strong>${item.name}</strong></small><br>
        <small style="color: #666;">${count} ${type === 'viewed' ? 'views' : 'sold'}</small>
      </li>
    `
  })
  html += '</ul>'
  container.innerHTML = html
}

async function getSuppliers() {
  const response = await fetch('/admin/all/data/suppliers')
  if (!response.ok) throw new Error(`Response status: ${response.status}`)
  const {data} = await response.json()

  const table = document.createElement('table')
  table.innerHTML = `
    <thead>
      <tr><td colspan="3">SUPPLIER MANAGEMENT</td></tr>
    </thead>
    <tbody>
      <tr>
        <td>Số lượng nhà cung cấp</td>
        <td>${data.length}</td>
        <td><a href="/admin/all-suppliers">Details</a></td>
      </tr>
    </tbody>
  `

  document.querySelector('div.supplier').appendChild(table)

  new Chart(supplier, {
    type: 'bar',
    options: {
      plugins: {
        legend: {
          display: false
        },
        title: {
          display: true,
          text: 'NHÀ CUNG CẤP THEO THỜI GIAN'
        }
      }
    },
    data: {
      labels: Array.from(new Set(data.map(supplier => formatDate(supplier.createdAt)))),
      datasets: [{
        data: data.map(supplier => supplier.createdAt).reduce((acc, date) => {
          const formattedDate = formatDate(date)
          acc[formattedDate] = (acc[formattedDate] || 0) + 1
          return acc
        }, {}),
        borderWidth: 1,
        backgroundColor: '#59A14F'
      }]
    }
  })
}

async function getBrands() {
  const response = await fetch('/admin/all/data/brands')
  if (!response.ok) throw new Error(`Response status: ${response.status}`)
  const {data} = await response.json()

  const table = document.createElement('table')
  table.innerHTML = `
    <thead>
      <tr><td colspan="3">BRAND MANAGEMENT</td></tr>
    </thead>
    <tbody>
      <tr>
        <td>Number of Brands</td>
        <td>${data.length}</td>
        <td><a href="/admin/all-brands">Details</a></td>
      </tr>
    </tbody>
  `

  document.querySelector('div.brand').appendChild(table)
}

async function getPurchases(fetchBody) {
  const response = await fetch('/admin/all/data/purchases', fetchBody)
  if (!response.ok) throw new Error(`Response status: ${response.status}`)
  const {data} = await response.json()

  const table = document.createElement('table')
  table.innerHTML = `
    <thead>
      <tr><td colspan="3">PURCHASE ORDER MANAGEMENT</td></tr>
    </thead>
    <tbody>
      <tr>
        <td>Import Order Quantity</td>
        <td>${data.length}</td>
        <td><a href="/admin/all-purchases">Details</a></td>
      </tr>
    </tbody>
  `

  const purchaseDiv = document.querySelector('div.purchase')
  const oldTable = purchaseDiv.querySelector("table")

  if (oldTable) oldTable.remove()
  purchaseDiv.appendChild(table)

  const purchaseCtx = document.getElementById("purchase")
  Chart.getChart(purchaseCtx)?.destroy()
  new Chart(purchaseCtx, {
    type: 'bar',
    data: {
      labels: Array.from(new Set(data.map(purchase => formatDate(purchase.createdAt)))),
      datasets: [{
        label: 'IMPORTS OVER TIME',
        data: data.map(purchase => purchase.createdAt).reduce((acc, date) => {
          const formattedDate = formatDate(date)
          acc[formattedDate] = (acc[formattedDate] || 0) + 1
          return acc
        }, {}),
        borderWidth: 1,
        backgroundColor: '#5ab868'
      }]
    }
  })
}

async function getStores() {
  const response = await fetch('/admin/all/data/stores')
  if (!response.ok) throw new Error(`Response status: ${response.status}`)
  const {data} = await response.json()

  const table = document.createElement('table')
  table.innerHTML = `
    <thead>
      <tr><td colspan="3">DISTRIBUTOR MANAGEMENT</td></tr>
    </thead>
    <tbody>
      <tr>
        <td>Số lượng đại lý</td>
        <td>${data.length}</td>
        <td><a href="/admin/all-stores">Details</a></td>
      </tr>
    </tbody>
  `

  document.querySelector('div.store').appendChild(table)
}

async function getAll() {
  try {
    const date = new Date();
    const y = date.getFullYear()
    const m = date.getMonth()

    const firstDay = new Date(y, m, 1)
    const lastDay = new Date(y, m + 1, 0)

    const formatDate = (d) => {
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      return `${d.getFullYear()}-${month}-${day}`
    };

    const startDate = document.querySelector('input#start-date')
    const endDate   = document.querySelector('input#end-date')

    startDate.value =  formatDate(firstDay)
    endDate.value   =  formatDate(lastDay)

    const fetchBody = {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        startDate: firstDay,
        endDate: lastDay
      })
    }

    await getFinance(fetchBody)
    await getOrders(fetchBody)
    await getCustomers(fetchBody)
    await getEmployees(fetchBody)
    await getSuppliers()
    await getProducts()
    await getProductAnalytics()
    await getOrderAnalytics()
    await getStores()
    // await getPurchases(fetchBody)
    // await getBrands()
  } catch (error) {
    console.error('An error occurred:', error)
    pushNotification('An error occurred')
  }
}

document.querySelector('button[type="submit"]').addEventListener('click', async function() {
  const startDate = document.querySelector('input#start-date').value
  const endDate = document.querySelector('input#end-date').value

  if (startDate === '' || endDate === '') return pushNotification('Please select start and end dates')

  if (new Date(startDate) > new Date(endDate)) return pushNotification('Start date cannot be greater than end date')

  const fetchBody = {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      startDate: startDate,
      endDate: endDate
    })
  }
  await getFinance(fetchBody)
  await getOrders(fetchBody)
  await getCustomers(fetchBody)
  await getEmployees(fetchBody)
  // await getPurchases(fetchBody)
})

window.addEventListener('DOMContentLoaded', async function loadData() {
  await getAll()
})