importLinkCss('/css/admin/detail/order.css')

const urlSlug = location.href.match(/([^\/]*)\/*$/)[1]

async function getOrder() {
  const response = await fetch('/admin/all-orders/data/order', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({id: urlSlug})
  })
  if (!response.ok) throw new Error(`Response status: ${response.status}`)
  const {error, orderInfo, orderStatuses, paymentMethods, userRole} = await response.json()
  if (error) return pushNotification('Có lỗi xảy ra')

  document.title = 'Đơn hàng ' + orderInfo.customerInfo.name

  document.querySelector('input#id').value      = orderInfo._id
  document.querySelector('input#date').value    = formatDate(orderInfo.createdAt) 
  document.querySelector('input#name').value    = orderInfo.customerInfo.name
  document.querySelector('a#customer-link').href = `/admin/all-customers/customer/${orderInfo.customerInfo.userId}`
  document.querySelector('input#phone').value   = orderInfo.customerInfo.phone
  document.querySelector('input#address').value = orderInfo.customerInfo.address
  document.querySelector('input#note').value    = orderInfo.customerInfo.note

  if (orderInfo.customerInfo.userId === 'guest') {
    document.querySelector('a#customer-link').style.display = 'none'
  }

  orderStatuses.forEach((element, index) => {
    const option = document.createElement('option')
    option.value = element.code
    option.textContent = element.name
    option.disabled = true
    if (element.code === orderInfo.status) option.selected = true
    if (userRole === 'employee' && element.code === 'preparing') option.disabled = false
    if (userRole === 'merchandise' && element.code === 'out_for_delivery') option.disabled = false
    if (userRole === 'shipper' && element.code === 'delivering') option.disabled = false
    if (userRole === 'shipper' && element.code === 'delivered') option.disabled = false
    if (userRole === 'manager' && element.code === 'cancel') option.disabled = false
    // if (userRole === 'admin') option.disabled = false

    document.querySelector('select#status').appendChild(option)
  })
  
  paymentMethods.forEach((element, index) => {
    const option = document.createElement('option')
    option.value = element.code
    option.textContent = element.name
    option.disabled = true
    if (element.code === orderInfo.paymentMethod) option.selected = true
    
    document.querySelector('select#paymentMethod').appendChild(option)
  })

  document.querySelector('input#total').value = formatNumber(orderInfo.totalOrderPrice)
  document.querySelector('input#new-total').value = formatNumber(orderInfo.totalNewOrderPrice)
  document.querySelector('input#isRated').value = orderInfo.isRated ? 'Đã đánh giá' : 'Chưa đánh giá'

  document.querySelector('select#isPaid').value = orderInfo.isPaid
  if (userRole === 'accountant') {
    document.querySelector('select#isPaid').querySelectorAll('option').forEach((option) => option.disabled = false)
  }

  const submitButton = document.querySelector('button[type="submit"]')
  if (orderInfo.status === 'done' || orderInfo.status === 'cancel') {
    document.querySelector('select#paymentMethod').disabled = true
    document.querySelector('select#paymentMethod').style.cursor = 'not-allowed'
    
    document.querySelector('select#status').disabled = true
    document.querySelector('select#status').style.cursor = 'not-allowed'
    submitButton.style.display = 'none'
  }

  orderInfo.products.forEach((product) => {
    const tr = document.createElement('tr')
    tr.innerHTML = `
      <td></td>
      <td style="
        display: flex; 
        justify-content: start;
        align-items: center;
        gap: 5px"
      >
        <img src="${product.image}" alt="${product.name}" loading="lazy">
        ${product.name}
      </td>
      <td>${product.quantity}</td>
      <td>${formatNumber(product.price)}</td>
      <td><a href="/admin/all-products/product/${product.id}">Xem</a></td>
    `
    document.querySelector('table#table-2').querySelector('tbody').appendChild(tr)
  })

  return orderInfo
}

async function updateOrder(orderInfo) {
  const paymentMethod  = document.querySelector('select#paymentMethod').value
  const status         = document.querySelector('select#status').value
  const isPaid         = document.querySelector('select#isPaid').value

  if (
    paymentMethod === orderInfo.paymentMethod    &&
    status        === orderInfo.status           &&
    isPaid        === orderInfo.isPaid
  ) return pushNotification('Hãy cập nhật thông tin')

  const response = await fetch('/admin/all-orders/order/updated', {
    method: 'PUT',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      id            : urlSlug,
      paymentMethod : paymentMethod,
      status        : status,
      isPaid        : isPaid
    })
  })
  if (!response.ok) throw new Error(`Response status: ${response.status}`)
  const {error, message} = await response.json()
  if (error) return pushNotification(error)
  pushNotification(message)

  setTimeout(() => window.location.reload(), 3000)
}

async function exportOrderExcel(title) {
  document.getElementById("export-js").addEventListener("click", function () {
    // Clone tables so we don't affect the DOM
    const table1 = document.querySelector("#table-1").cloneNode(true);
    const table2 = document.querySelector("#table-2").cloneNode(true);

    // --- Convert inputs/selects into plain text ---
    function replaceFormElements(table) {
      table.querySelectorAll("input, select").forEach(el => {
        let text = "";
        if (el.tagName === "INPUT") {
          text = el.value || el.innerText || "";
        } else if (el.tagName === "SELECT") {
          const selected = el.options[el.selectedIndex];
          text = selected ? selected.text : "";
        }
        const span = document.createElement("span");
        span.textContent = text;
        el.parentNode.replaceChild(span, el);
      });
    }
    replaceFormElements(table1);
    replaceFormElements(table2);

    // --- Create a wrapper table to merge both ---
    const wrapper = document.createElement("table");

    // --- Add header rows ---
    const row1 = document.createElement("tr");
    row1.innerHTML = `
      <td colspan="3" style="font-weight: bold; text-align: center;">
        Công ty TNHH Cosmetic Garden
      </td>
      <td></td>
      <td colspan="2" style="font-weight: bold; text-align: center;">
        Cộng hoà xã hội chủ nghĩa Việt Nam
      </td>`;

    const row2 = document.createElement("tr");
    row2.innerHTML = `
      <td></td><td></td><td></td><td></td>
      <td colspan="2" style="text-align: center;">
        Độc lập - Tự do - Hạnh phúc
      </td>`;

    const row3 = document.createElement("tr");
    row3.innerHTML = `
      <td></td><td></td>
      <td colspan="2" style="text-align: center;">
        ${title}
      </td>
      <td></td><td></td>`;

    wrapper.appendChild(row1);
    wrapper.appendChild(row2);
    wrapper.appendChild(row3);
    wrapper.appendChild(document.createElement("tr")); // empty row

    // --- Append table-1 rows ---
    table1.querySelectorAll("tr").forEach(r => {
      wrapper.appendChild(r.cloneNode(true));
    });

    // --- Empty row ---
    wrapper.appendChild(document.createElement("tr"));

    // --- Append table-2 rows ---
    table2.querySelectorAll("tr").forEach(r => {
      wrapper.appendChild(r.cloneNode(true));
    });

    // --- Export with SheetJS ---
    const wb = XLSX.utils.table_to_book(wrapper);
    XLSX.writeFile(wb, "OrderDetail.xlsx");
  });
}

window.addEventListener('DOMContentLoaded', async function loadData() {
  try {
    const orderInfo = await getOrder()

    document.querySelector('button[type="submit"]').onclick = function() {
      updateOrder(orderInfo)
    }
    exportOrderExcel("CHI TIẾT ĐƠN HÀNG");

  } catch (error) {
    console.error('Có lỗi xảy ra:', error)
    pushNotification('Có lỗi xảy ra')
  }
})