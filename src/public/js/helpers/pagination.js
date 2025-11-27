async function pagination(getDataFunction, sortOptions, filterOptions, currentPage, data_size) {
  document.querySelector('span.pagination').querySelectorAll('p').forEach(p => p.remove())
  var totalPage = 1
  const itemsPerPage = parseInt(document.querySelector('select#pagination')?.value, 10)
  if (!itemsPerPage) return
  
  for (var i = 0; i < data_size; i += itemsPerPage) {
    const newPage = document.createElement('p')
    if (totalPage === currentPage) {
      newPage.classList.add('current')
    } else {
      newPage.classList.remove('current')
    }
    newPage.innerText = `${totalPage}`
    document.querySelector('span.pagination').appendChild(newPage)
    newPage.onclick = function() {
      // document.querySelector('span.pagination').querySelectorAll('p').forEach(t => t.classList.remove('current'))
      currentPage = parseInt(newPage.innerText)
      getDataFunction(sortOptions, filterOptions, currentPage, itemsPerPage)
    }
    totalPage++
  }
}