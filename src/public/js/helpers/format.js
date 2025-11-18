function formatNumber(number) {
  return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") + ' ₫'
}

function formatPercentage(number) {
  return number.toString() + '%'
}

function formatQuantity(number) {
  return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")
}

function formatRate(number) {
  return number.toFixed(1).toString()
}

function formatDate(date) {
  const newDate = new Date(date);
  const day = newDate.getUTCDate();
  const month = newDate.getUTCMonth() + 1; // Months are zero-based
  const year = newDate.getUTCFullYear();
  
  return `${day}/${month}/${year}`;
}

function formatDateTime(date) {
  const newDate = new Date(date);

  const day = String(newDate.getDate()).padStart(2, "0");
  const month = String(newDate.getMonth() + 1).padStart(2, "0");
  const year = newDate.getFullYear();

  const hours = String(newDate.getHours()).padStart(2, "0");
  const minutes = String(newDate.getMinutes()).padStart(2, "0");

  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

function formatInputNumber(input) {
  input.addEventListener('input', function (e) {
    // Lấy giá trị số, loại bỏ dấu chấm cũ
    let value = e.target.value.replace(/\./g, '')
    
    // Kiểm tra nếu không phải số thì return
    if (!/^\d*$/.test(value)) return
    
    // Định dạng số với dấu chấm (.) phân tách hàng nghìn
    e.target.value = Number(value).toLocaleString('de-DE') // 'de-DE' dùng dấu chấm
  })
}

function deFormatNumber(number) {
  if (number === undefined) return undefined
  return parseInt(number.replace(/\./g, '').replace(/\s?VND$/, ''))
}