async function sortAndFilter(getDataFunction, sortOptions, filterOptions, currentPage) {
  const sortButton    = document?.querySelector('div.sort')?.querySelectorAll('select') ?? []
  const filterButton  = document?.querySelector('div.filter')?.querySelectorAll('select') ?? []
  const clearButton   = document.querySelector('button#clear-sort-filter')
  const searchInput   = document.querySelector('input#search-input')
  const startDate     = document.querySelector('input#start-date')
  const endDate       = document.querySelector('input#end-date')
  const dateFilterBtn = document.querySelector('div.date-filter button')
  const submitChange  = document.querySelector('button.generate-columns')
  const selectAll     = document.querySelector('input.select-all')
  const paginationBtn = document.querySelector('select[name="pagination"]')

  sortButton.forEach((button) => {
    button.onchange = function () {
      button.selectedIndex === 0 ? clearButton.style.display = 'none' : clearButton.style.display = ''
      const sortType = button.id
      const sortValue = parseInt(button.value)
      sortOptions[sortType] = sortValue
      if (!sortValue) delete sortOptions[sortType]
      const itemsPerPage = document.querySelector('select#pagination').value
      getDataFunction(sortOptions, filterOptions, currentPage, itemsPerPage)
    }
  }) 
  
  filterButton.forEach((button) => {
    button.onchange = function () {
      button.selectedIndex === 0 ? clearButton.style.display = 'none' : clearButton.style.display = ''
      const filterType = button.id
      const filterValue = button.value
      filterOptions[filterType] = filterValue
      if (!filterValue) delete filterOptions[filterType]
      const itemsPerPage = document.querySelector('select#pagination').value
      getDataFunction(sortOptions, filterOptions, currentPage, itemsPerPage)
    }
  }) 

  dateFilterBtn.onclick = function() {
    if (startDate.value && endDate.value) {
      clearButton.style.display = ''
      filterOptions.createdAt = { $gte: new Date(startDate.value), $lte: new Date(endDate.value) }
      const itemsPerPage = document.querySelector('select#pagination').value
      getDataFunction(sortOptions, filterOptions, currentPage, itemsPerPage)
    }
  }

  searchInput.addEventListener('keypress', function(e) {
    if (searchInput.value.trim() === '') return

    const searchType = document.querySelector('select#search-type').value
    if (e.key === "Enter") {
      filterOptions[searchType] = { $regex: searchInput.value.trim(), $options: "i" }
      clearButton.style.display = ''
      const itemsPerPage = document.querySelector('select#pagination').value
      getDataFunction(sortOptions, filterOptions, currentPage, itemsPerPage)
    }
  })

  clearButton.addEventListener('click', function() {
    sortButton.forEach((button) => button.selectedIndex = 0) 
    filterButton.forEach((button) => button.selectedIndex = 0) 
    searchInput.value = ''
    clearButton.style.display = 'none'
    sortOptions = {}
    filterOptions = {}
    currentPage = 1
    const itemsPerPage = document.querySelector('select#pagination').value
    getDataFunction(sortOptions, filterOptions, currentPage, itemsPerPage)
  })

  selectAll.onclick = function() {
    if (!this.checked) {
      document.querySelectorAll('div.checkbox-group input[type="checkbox"]').forEach((checkbox) => {
        checkbox.checked = false
        document.querySelector('span.select-all').innerHTML = '<b>Select All</b>'
      })
    } else {
      document.querySelectorAll('div.checkbox-group input[type="checkbox"]').forEach((checkbox) => {
        checkbox.checked = true
        document.querySelector('span.select-all').innerHTML = '<b>Remove All</b>'
      })
    }
  }

  submitChange.onclick = function() {
    if (document.querySelectorAll('div.checkbox-group input[type="checkbox"]:checked').length === 0) {
      pushNotification('Please select at least one column to display')
      return
    }
    const itemsPerPage = document.querySelector('select#pagination').value
    getDataFunction(sortOptions, filterOptions, currentPage, itemsPerPage)
  }

  paginationBtn.onchange = function () {
    const selectedValue = parseInt(paginationBtn.value)
    getDataFunction(sortOptions, filterOptions, currentPage, selectedValue)
  }
}