function formatNumber(number) {
  return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") + ' ₫'
}

function formatPercentage(number) {
  return number.toFixed(0).toString() + '%'
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
    let cursorPos = e.target.selectionStart

    // Remove formatting and currency symbol
    let value = e.target.value.replace(/\./g, '').replace(/\₫/g, '').trim()

    // If not numeric, return
    if (!/^\d*$/.test(value)) return

    // Format with dots
    let formatted = Number(value).toLocaleString('de-DE')

    // Add the ₫ symbol
    e.target.value = `${formatted} ₫`

    // Move cursor before the currency symbol
    e.target.setSelectionRange(e.target.value.length - 2, e.target.value.length - 2)
  })
}

function deFormatNumber(number) {
  if (number === undefined) return undefined
  return parseInt(number.toString().replace(/\./g, '').replace(/\s?₫$/, ''))
}