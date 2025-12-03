async function pagination(getDataFunction, sortOptions, filterOptions, currentPage, data_size) {
  const container = document.querySelector('span.pagination');
  if (!container) return;

  // Clear previous pagination
  container.innerHTML = '';

  const itemsPerPage = parseInt(document.querySelector('select#pagination')?.value, 10) || 10;
  if (data_size <= 0 || itemsPerPage <= 0) return;

  const totalPages = Math.ceil(data_size / itemsPerPage);
  if (totalPages <= 1) return;

  // Helper: create page button (p element)
  const createPage = (number, isCurrent = false) => {
    const p = document.createElement('p');
    p.textContent = number;
    if (isCurrent) p.classList.add('current');
    p.onclick = () => {
      getDataFunction(sortOptions, filterOptions, number, itemsPerPage);
      window.scrollTo({ top: document.querySelector('.header').offsetTop - 10, behavior: 'smooth' })
    };
    return p;
  };

  // 1. Always show First Page
  container.appendChild(createPage(1, currentPage === 1));
  
  // 2. Left "..." — show only if current page > 4
  if (currentPage > 4) {
    const dots = document.createElement('p');
    dots.textContent = '...';
    dots.style.pointerEvents = 'none';
    dots.style.border = 'none';
    dots.style.background = 'transparent';
    container.appendChild(dots);
  }

  // 3. Dynamic range: show 3 pages before and after current page
  const startPage = Math.max(2, currentPage - 3);
  const endPage = Math.min(totalPages - 1, currentPage + 3);

  for (let i = startPage; i <= endPage; i++) {
    container.appendChild(createPage(i, i === currentPage));
  }

  // 4. Right "..." — show only if there's a gap before last page
  if (currentPage < totalPages - 3) {
    const dots = document.createElement('p');
    dots.textContent = '...';
    dots.style.pointerEvents = 'none';
    dots.style.border = 'none';
    container.appendChild(dots);
  }

  // 5. Always show Last Page (if more than 1 page)
  if (totalPages > 1) {
    container.appendChild(createPage(totalPages, currentPage === totalPages));
  }

  // 6. Optional: Add "First" and "Last" buttons (styled as <p> too)
  const firstBtn = document.createElement('p');
  firstBtn.textContent = 'First';
  firstBtn.style.fontWeight = '600';
  if (currentPage === 1) firstBtn.style.opacity = '0.5';
  firstBtn.onclick = () => getDataFunction(sortOptions, filterOptions, 1, itemsPerPage);
  container.prepend(firstBtn);

  const lastBtn = document.createElement('p');
  lastBtn.textContent = 'Last';
  lastBtn.style.fontWeight = '600';
  if (currentPage === totalPages) lastBtn.style.opacity = '0.5';
  lastBtn.onclick = () => getDataFunction(sortOptions, filterOptions, totalPages, itemsPerPage);
  container.appendChild(lastBtn);
}