importLinkCss('/css/admin/home.css')

// Dashboard Navigator Setup
function initDashboardNavigator() {
  const dashboardBtns = document.querySelectorAll('.dashboard-btn')
  const tables = document.querySelectorAll('.admin-home-container div.table')
  const tableGroups = document.querySelectorAll('.admin-home-container div.tables')

  dashboardBtns.forEach(btn => {
    btn.addEventListener('click', async function() {
      const dashboard = this.dataset.dashboard

      // Remove active class from all buttons
      dashboardBtns.forEach(b => b.classList.remove('active'))
      // Add active class to clicked button
      this.classList.add('active')

      // Hide all tables
      tables.forEach(table => table.classList.remove('active'))
      tableGroups.forEach(group => group.classList.remove('active'))

      // Show selected dashboard table
      const targetTable = document.querySelector(`.admin-home-container div.table.${dashboard}`)
      const targetGroup = document.querySelector(`.admin-home-container div.tables.${dashboard}`)

      if (targetTable) targetTable.classList.add('active')
      if (targetGroup) targetGroup.classList.add('active')

      // Load data for the selected dashboard
      await loadDashboardData(dashboard)
    })
  })

  // Set finance as default active
  const financeBtn = document.querySelector('.dashboard-btn[data-dashboard="finance"]')
  if (financeBtn) financeBtn.click()
}

// Load data based on selected dashboard
async function loadDashboardData(dashboard) {
  try {
    // Show loading overlay for the active table
    const tableElement = document.querySelector(`.admin-home-container div.table.${dashboard}, .admin-home-container div.tables.${dashboard}`)
    if (tableElement) {
      const overlay = tableElement.querySelector('.loading-overlay')
      if (overlay) overlay.style.display = 'flex'
    }

    const startDate = document.querySelector('input#start-date').value
    const endDate = document.querySelector('input#end-date').value

    const fetchBody = {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        startDate: startDate,
        endDate: endDate
      })
    }

    switch(dashboard) {
      case 'finance':
        await getFinance(fetchBody)
        break
      case 'order':
        await getOrders(fetchBody)
        await getOrderAnalytics(fetchBody)
        break
      case 'customer':
        await getCustomers(fetchBody)
        break
      case 'employee':
        await getEmployees(fetchBody)
        break
      case 'product':
        await getProducts()
        await getProductAnalytics(fetchBody)
        break
      case 'supplier':
        await getSuppliers()
        break
      case 'purchase':
        await getPurchases(fetchBody)
        break
      case 'store':
        await getStores()
        break
      case 'brand':
        await getBrands()
        break
    }

    // Hide loading overlay after data is loaded
    if (tableElement) {
      const overlay = tableElement.querySelector('.loading-overlay')
      if (overlay) overlay.style.display = 'none'
    }
  } catch (error) {
    console.error('Error loading dashboard data:', error)
    pushNotification('An error occurred while loading data')

    // Hide loading overlay even on error
    const tableElement = document.querySelector(`.admin-home-container div.table.${dashboard}, .admin-home-container div.tables.${dashboard}`)
    if (tableElement) {
      const overlay = tableElement.querySelector('.loading-overlay')
      if (overlay) overlay.style.display = 'none'
    }
  }
}

async function getFinance(fetchBody) {
  const response = await fetch('/admin/all/data/finance', fetchBody)
  if (!response.ok) throw new Error(`Response status: ${response.status}`)
  const {revenue, cost, wage, dailyRevenue, revenueByBrand, revenueByCategory, revenueBySubcategory} = await response.json()
  
  console.log('[getFinance] Response data:', {revenueByBrand, revenueByCategory, revenueBySubcategory})
  console.log('[getFinance] Brand data length:', revenueByBrand?.length || 0)
  console.log('[getFinance] Category data length:', revenueByCategory?.length || 0)
  console.log('[getFinance] Subcategory data length:', revenueBySubcategory?.length || 0)

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

  if (document.querySelector('div.table.finance').querySelector('div.finance').contains(document.querySelector("table"))) {
    document.querySelector("table").remove()
  }

  const financeDiv = document.querySelector('div.table.finance').querySelector('div.finance')
  financeDiv.appendChild(table)

  // Render daily revenue chart if data exists
  if (dailyRevenue && Array.isArray(dailyRevenue) && dailyRevenue.length > 0) {
    const dailyRevenueContainer = document.getElementById('daily-revenue-container')
    dailyRevenueContainer.innerHTML = '' // Clear old content

    const canvas = document.createElement('canvas')
    canvas.id = 'revenue-chart'
    canvas.height = '150'
    dailyRevenueContainer.appendChild(canvas)

    const labels = dailyRevenue.map(r => r.date)
    const values = dailyRevenue.map(r => Number(r.revenue || 0))

    const revenueCtx = document.getElementById('revenue-chart')
    Chart.getChart(revenueCtx)?.destroy()
    new Chart(revenueCtx, {
      type: 'line',
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { display: false },
          title: { 
            display: true, 
            text: '💰 Daily Revenue Trend', 
            font: { size: 16, weight: 'bold' },
            color: '#2c3e50',
            padding: 20
          },
          filler: { propagate: true }
        },
        scales: { 
          y: { 
            beginAtZero: true, 
            ticks: { 
              callback: function(value){ return '₫' + value.toLocaleString('en-US', {maximumFractionDigits: 0}); },
              color: '#666'
            },
            grid: { color: 'rgba(0, 0, 0, 0.05)' }
          },
          x: {
            ticks: { color: '#666' },
            grid: { color: 'rgba(0, 0, 0, 0.05)' }
          }
        },
        interaction: { mode: 'index', intersect: false }
      },
      data: {
        labels: labels,
        datasets: [{
          label: 'Revenue',
          data: values,
          borderColor: '#2ca02c',
          backgroundColor: 'rgba(44,160,44,0.15)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointRadius: 5,
          pointBackgroundColor: '#2ca02c',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointHoverRadius: 7
        }]
      }
    })
  }

  // Get existing chart containers from HTML
  const brandChartWrapper = document.getElementById('brand-chart-wrapper')
  const categoryChartWrapper = document.getElementById('category-chart-wrapper')
  const subcategoryChartWrapper = document.getElementById('subcategory-chart-wrapper')

  // Render revenue by brand horizontal bar chart
  if (revenueByBrand && Array.isArray(revenueByBrand) && revenueByBrand.length > 0) {
    console.log('[renderCharts] Rendering brand chart...')
    renderSideBySideChart('revenue-brand-chart', revenueByBrand, 'brand', '🏢 Revenue by Brand', brandChartWrapper)
  }

  // Render revenue by category horizontal bar chart
  if (revenueByCategory && Array.isArray(revenueByCategory) && revenueByCategory.length > 0) {
    console.log('[renderCharts] Rendering category chart...')
    renderSideBySideChart('revenue-category-chart', revenueByCategory, 'category', '📦 Revenue by Category', categoryChartWrapper)
  }

  // Render revenue by subcategory horizontal bar chart
  if (revenueBySubcategory && Array.isArray(revenueBySubcategory) && revenueBySubcategory.length > 0) {
    console.log('[renderCharts] Rendering subcategory chart...')
    renderSideBySideChart('revenue-subcategory-chart', revenueBySubcategory, 'subcategory', '🏷️ Revenue by Subcategory', subcategoryChartWrapper)
  }
}

// Helper function to render horizontal bar charts side by side
function renderSideBySideChart(chartId, data, key, title, container) {
  console.log(`[renderSideBySideChart] Creating ${chartId} with ${data.length} items`)
  
  container.innerHTML = '' // Clear old content
  
  // Create title
  const titleDiv = document.createElement('div')
  titleDiv.style.marginBottom = '12px'
  titleDiv.style.fontSize = '13px'
  titleDiv.style.fontWeight = 'bold'
  titleDiv.style.color = '#2c3e50'
  titleDiv.textContent = title
  container.appendChild(titleDiv)

  const canvas = document.createElement('canvas')
  canvas.id = chartId
  canvas.height = '250'
  container.appendChild(canvas)

  // Extract labels and revenue values
  const labels = data.map(item => item[key])
  const values = data.map(item => Number(item.revenue || 0))
  
  console.log(`[renderSideBySideChart] Labels: ${labels.join(', ')}, Values: ${values.join(', ')}`)

  setTimeout(() => {
    const ctx = document.getElementById(chartId)
    if (!ctx) {
      console.error(`[renderSideBySideChart] Canvas not found: ${chartId}`)
      return
    }
    
    console.log(`[renderSideBySideChart] Creating chart for ${chartId}`)
    Chart.getChart(ctx)?.destroy()
    new Chart(ctx, {
      type: 'bar',
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 12,
            titleFont: { size: 12, weight: 'bold' },
            bodyFont: { size: 12 },
            callbacks: {
              label: function(context) {
                return '₫' + context.parsed.x.toLocaleString('en-US', {maximumFractionDigits: 0})
              }
            }
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            ticks: { 
              callback: function(value){ return '₫' + (value / 1000000).toFixed(1) + 'M'; },
              color: '#666',
              font: { size: 10 }
            },
            grid: { color: 'rgba(0, 0, 0, 0.05)' }
          },
          y: {
            ticks: { 
              color: '#666',
              font: { size: 11 }
            },
            grid: { display: false }
          }
        }
      },
      data: {
        labels: labels,
        datasets: [{
          label: 'Revenue',
          data: values,
          backgroundColor: ['#4E79A7', '#F28E2B', '#E15759', '#59A14F', '#AF8FD3', '#FF9DA7'],
          borderColor: '#2c3e50',
          borderWidth: 1,
          borderRadius: 4
        }]
      }
    })
    console.log(`[renderSideBySideChart] Chart ${chartId} created successfully`)
  }, 100)
}

async function getOrders(fetchBody) {
  const response = await fetch('/admin/all/data/orders', fetchBody)
  if (!response.ok) throw new Error(`Response status: ${response.status}`)
  const {allData, data, status} = await response.json()

  const table = document.createElement('table')
  table.innerHTML = `
    <thead>
      <tr><td colspan="2">ORDER MANAGEMENT</td></tr>
    </thead>
    <tbody>
      <tr>
        <td>Total Orders</td>
        <td>${allData}</td>
      </tr>
      <tr>
        <td>Filtered Orders</td>
        <td>${data.length}</td>
      </tr>
    </tbody>
  `

  const orderDiv = document.querySelector('div.table.order').querySelector('div.order')
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
          text: 'Order Status'
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
          text: 'Orders Over Time',
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
  const {allData, data, members} = await response.json()

  const table = document.createElement('table')
  table.innerHTML = `
    <thead>
      <tr><td colspan="2">CUSTOMER MANAGEMENT</td></tr>
    </thead>
    <tbody>
      <tr>
        <td>Total Customers</td>
        <td>${allData}</td>
      </tr>
      <tr>
        <td>Filtered Customers</td>
        <td>${data.length}</td>
      </tr>
    </tbody>
  `

  const customerDiv = document.querySelector('div.table.customer').querySelector('div.customer')
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
          text: 'Member Rank'
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
          text: 'Customers Over Time',
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
  const {allData, data, positions} = await response.json()

  const table = document.createElement('table')
  table.innerHTML = `
    <thead>
      <tr><td colspan="2">EMPLOYEE MANAGEMENT</td></tr>
    </thead>
    <tbody>
      <tr>
        <td>Total Employees</td>
        <td>${allData}</td>
      </tr>
      <tr>
        <td>Filtered Employees</td>
        <td>${data.length}</td>
      </tr>
    </tbody>
  `

  const employeeDiv = document.querySelector('div.table.employee').querySelector('div.employee')
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
          text: 'EMPLOYEES POSITION'
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
          text: 'NEW EMPLOYEES BY TIME'
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
  const {allData, data} = await response.json()

  const table = document.createElement('table')
  table.innerHTML = `
    <thead>
      <tr><td colspan="2">PRODUCT MANAGEMENT</td></tr>
    </thead>
    <tbody>
      <tr>
        <td>Total Products</td>
        <td>${data.length}</td>
      </tr>
    </tbody>
  `

  const productDiv = document.querySelector('div.table.product').querySelector('div.product')
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
          text: 'PRODUCTS BY CATEGORY'
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
}

async function getProductAnalytics(fetchBody = {}) {
  try {
    // Extract dates from fetchBody
    let dateParams = {}
    if (fetchBody.body) {
      dateParams = JSON.parse(fetchBody.body)
    }
    console.log('[getProductAnalytics] Date params:', dateParams)

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

    // Load top purchased with date filtering
    const purchasedRes = await fetch('/admin/analytics/top-purchased?limit=5', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(dateParams)
    })
    console.log('[getProductAnalytics] Top purchased response status:', purchasedRes.status)
    
    const purchasedData = await purchasedRes.json()
    console.log('[getProductAnalytics] Top purchased data:', purchasedData)
    
    if (purchasedData.success) {
      renderHomeTopProducts('home-top-purchased', purchasedData.data, 'purchased')
    }
  } catch (error) {
    console.error('Error loading product analytics:', error)
  }
}

async function getOrderAnalytics(fetchBody = {}) {
  try {
    // Extract dates from fetchBody - fetchBody.body is already a JSON string
    let dateParams = {}
    if (fetchBody.body) {
      dateParams = JSON.parse(fetchBody.body)
    }
    console.log('[getOrderAnalytics] Date params:', dateParams)
    
    // Payment success rate + by method with date filtering
    const paymentRes = await fetch('/admin/analytics/payment-success-rate-by-method', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(dateParams)
    })
    console.log('[getOrderAnalytics] Payment response status:', paymentRes.status)
    
    if (!paymentRes.ok) {
      console.error('[getOrderAnalytics] Payment response not ok:', paymentRes.statusText)
      throw new Error(`Payment API returned ${paymentRes.status}: ${paymentRes.statusText}`)
    }
    
    const paymentData = await paymentRes.json()
    console.log('[getOrderAnalytics] Payment data:', paymentData)
    
    if (paymentData.success && paymentData.data) {
      const overall = paymentData.data.overallRate || 0
      document.getElementById('home-payment-success-rate').textContent = `${Number(overall).toFixed(2)}%`
      const methods = paymentData.data.rateByMethod || []
      renderPaymentMethods('home-add-to-cart-by-method', methods)
    } else {
      console.warn('[getOrderAnalytics] Payment data missing success or data field:', paymentData)
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


async function getSessionKPIs(fetchBody) {
  try {
    const response = await fetch('/api/analytics/session-kpis', fetchBody)
    if (!response.ok) throw new Error(`Response status: ${response.status}`)
    
    const { success, data } = await response.json()
    
    if (success) {
      document.getElementById('home-long-sessions-ratio').textContent = 
        `${data.longSessionRatio}%`
      document.getElementById('home-comeback-rate').textContent = 
        `${data.comebackRate}%`
    }
  } catch (error) {
    console.error('Error loading session KPIs:', error)
    document.getElementById('home-long-sessions-ratio').textContent = 'Error'
    document.getElementById('home-comeback-rate').textContent = 'Error'
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
        <td>Total Brands</td>
        <td>${data.length}</td>
        <td><a href="/admin/all-brands">Details</a></td>
      </tr>
    </tbody>
  `

  const brandDiv = document.querySelector('div.table.brand').querySelector('div.brand')
  const oldTable = brandDiv.querySelector("table")

  if (oldTable) oldTable.remove()
  brandDiv.appendChild(table)
}

async function getStores() {
  const response = await fetch('/admin/all/data/stores')
  if (!response.ok) throw new Error(`Response status: ${response.status}`)
  const {data} = await response.json()

  const table = document.createElement('table')
  table.innerHTML = `
    <thead>
      <tr><td colspan="2">STORES MANAGEMENT</td></tr>
    </thead>
    <tbody>
      <tr>
        <td>Total Stores</td>
        <td>${data.length}</td>
      </tr>
    </tbody>
  `

  const storeDiv = document.querySelector('div.table.store').querySelector('div.store')
  const oldTable = storeDiv.querySelector("table")

  if (oldTable) oldTable.remove()
  storeDiv.appendChild(table)
  const storeCtx = document.getElementById("product")
  Chart.getChart(storeCtx)?.destroy()
}

async function getPurchases(fetchBody) {
  const response = await fetch('/admin/all/data/purchases', fetchBody)
  if (!response.ok) throw new Error(`Response status: ${response.status}`)
  const {data} = await response.json()

  const table = document.createElement('table')
  table.innerHTML = `
    <thead>
      <tr><td colspan="2">PURCHASE ORDER MANAGEMENT</td></tr>
    </thead>
    <tbody>
      <tr>
        <td>Total Purchase Orders</td>
        <td>${data.length}</td>
      </tr>
    </tbody>
  `

  const purchaseDiv = document.querySelector('div.table.purchase').querySelector('div.purchase')
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
        label: 'NEW PURCHASE ORDER BY TIME',
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

async function getSuppliers() {
  const response = await fetch('/admin/all/data/suppliers')
  if (!response.ok) throw new Error(`Response status: ${response.status}`)
  const {data} = await response.json()

  const table = document.createElement('table')
  table.innerHTML = `
    <thead>
      <tr><td colspan="2">SUPPLIER MANAGEMENT</td></tr>
    </thead>
    <tbody>
      <tr>
        <td>Total Suppliers</td>
        <td>${data.length}</td>
      </tr>
    </tbody>
  `

  const supplierDiv = document.querySelector('div.table.supplier').querySelector('div.supplier')
  const oldTable = supplierDiv.querySelector("table")

  if (oldTable) oldTable.remove()
  supplierDiv.appendChild(table)
  const supplierCtx = document.getElementById("supplier")
  Chart.getChart(supplierCtx)?.destroy()
  new Chart(supplierCtx, {
    type: 'bar',
    options: {
      plugins: {
        legend: {
          display: false
        },
        title: {
          display: true,
          text: 'NEW SUPPLIER BY TIME'
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

    // Only load finance data on initial page load
    await getFinance(fetchBody)
    await getOrders(fetchBody)
    await getOrderAnalytics()
    await getSessionKPIs(fetchBody)
    await getCustomers(fetchBody)
    await getEmployees(fetchBody)
    await getProducts()
    await getProductAnalytics()
    // await getStores()
    // await getSuppliers()
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

  // Get the currently active dashboard
  const activeBtn = document.querySelector('.dashboard-btn.active')
  const activeDashboard = activeBtn ? activeBtn.dataset.dashboard : 'finance'

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
  await getSessionKPIs(fetchBody)
  await getCustomers(fetchBody)
  await getEmployees(fetchBody)
  // await getPurchases(fetchBody)

  // Reload data for the currently active dashboard
  await loadDashboardData(activeDashboard)
})

window.addEventListener('DOMContentLoaded', async function loadData() {
  initDashboardNavigator()
  await getAll()
})



// ===============================================
// ACTIVE USERS REAL-TIME TRACKING
// ===============================================

// let activeUsersHistory = [];
// let activeUsersChart = null;

// async function getActiveUsers() {
//   try {
//     const response = await fetch('/admin/all/data/active-users');
//     const { current } = await response.json();

//     const now = new Date();

//     activeUsersHistory.push({
//       timestamp: now,
//       count: current
//     });

//     // Keep last 24 hours
//     const cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);
//     activeUsersHistory = activeUsersHistory.filter(x => x.timestamp > cutoff);

//     updateActiveUsersChart();

//   } catch (err) {
//     console.error("Error getting active users:", err);
//   }
// }

// function updateActiveUsersChart() {
//   const labels = activeUsersHistory.map(p => p.timestamp.toLocaleTimeString());
//   const data = activeUsersHistory.map(p => p.count);

//   // if (activeUsersChart) activeUsersChart.destroy();

//   const activeUsersChart = document.getElementById("customer-online")
//   Chart.getChart(activeUsersChart)?.destroy()
//   new Chart(activeUsersChart, {
//     type: 'line',
//     data: {
//       labels,
//       datasets: [{
//         label: "Active Users",
//         data,
//         borderColor: '#4CAF50',
//         backgroundColor: 'rgba(76,175,80,0.2)',
//         borderWidth: 2,
//         tension: 0.3,
//         fill: true
//       }]
//     },
//     options: {
//       responsive: true,
//       maintainAspectRatio: false
//     }
//   })
// }

// // Update every 3 seconds
// setInterval(() => {
//   getActiveUsers();
// }, 3000);

// // Initial startup
// window.addEventListener('DOMContentLoaded', () => {
//   getActiveUsers();
// });


const WINDOW_SIZE = 28800;   // 24h window @ 3s interval
const SAMPLE_INTERVAL = 3000;

// ===============================
// Circular Buffer (stores {value, ts})
// ===============================
class CircularBuffer {
  constructor(size) {
    this.size = size;
    this.buf = new Array(size).fill(null);
    this.idx = 0;
    this.full = false;
  }

  add(value, customTs = Date.now()) {  // ✅ Accept optional timestamp
    this.buf[this.idx] = {
      value,
      ts: customTs  // ✅ Use provided timestamp or default to now
    };
    this.idx = (this.idx + 1) % this.size;
    if (this.idx === 0) this.full = true;
  }

  toArray() {
    if (!this.full) return this.buf.slice(0, this.idx);
    return [
      ...this.buf.slice(this.idx),
      ...this.buf.slice(0, this.idx)
    ];
  }
}

const windowBuf = new CircularBuffer(WINDOW_SIZE);

// ===============================
// Fetch active users from backend
// ===============================
async function getActiveUsers() {
  try {
    const response = await fetch("/admin/all/data/active-users");
    const { current, timestamp } = await response.json();

    windowBuf.add(current);  // This will use the timestamp we pass
    updateActiveUsersChart();

  } catch (err) {
    console.error("Error getting active users:", err);
  }
}

// ===============================
// Render beautiful time-series chart
// ===============================
function updateActiveUsersChart() {
  const arr = windowBuf.toArray().filter(x => x !== null);

  const timestamps = arr.map(item => item.ts);
  const values = arr.map(item => item.value);

  // Create hour-based bins: show label every hour
  const labels = timestamps.map((ts, idx) => {
    const hour = Math.floor(idx / (3600000 / SAMPLE_INTERVAL)); // samples per hour
    const date = new Date(ts);
    if (idx === 0 || idx % Math.ceil(3600000 / SAMPLE_INTERVAL) === 0) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }
    return '';
  });

  const canvas = document.getElementById("customer-online");
  Chart.getChart(canvas)?.destroy();

new Chart(canvas, {
  type: "line",
  data: {
    datasets: [{
      label: "Active Users",
      data: arr.map(item => ({
        x: item.ts,    // REAL timestamp
        y: item.value  // Active user count
      })),
      borderColor: "#4CAF50",
      backgroundColor: "rgba(76,175,80,0.1)",
      borderWidth: 2,
      tension: 0.4,
      fill: true,
      pointRadius: 0,
      pointHoverRadius: 4
    }]
  },

  options: {
    responsive: true,
    maintainAspectRatio: false,

    scales: {
      x: {
        type: "time",
        time: {
          unit: "hour",
          stepSize: 1,
          displayFormats: {
            hour: "HH:mm"
          }
        },
        ticks: {
          autoSkip: true,
          maxTicksLimit: 10   // fewer timestamps shown
        }
      },

      y: {
        beginAtZero: true,
        grace: 0.1
      }
    },

    plugins: {
      legend: {
        display: true,
        position: 'top'
      }
    }
  }
});
}

// ===============================
setInterval(getActiveUsers, SAMPLE_INTERVAL);
window.addEventListener("DOMContentLoaded", getActiveUsers);
