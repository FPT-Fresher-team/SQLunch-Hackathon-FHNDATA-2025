importLinkCss('/css/user/allProducts.css')

// Category dropdown toggle functionality
const categoryHeader = document.querySelector('.category-header')
const categoryContent = document.querySelector('.category-content')

if (categoryHeader && categoryContent) {
  categoryHeader.addEventListener('click', function() {
    categoryHeader.classList.toggle('collapsed')
    categoryContent.classList.toggle('collapsed')
  })
}

// URL tracking - show/hide categories
const currentUrl = window.location.pathname
const skincareCategory = document.querySelector('div.all-category-skincare')
const makeupCategory = document.querySelector('div.all-category-makeup')

// Show categories based on URL
if (currentUrl.includes('skincare')) {
  skincareCategory.style.display = 'block'
  makeupCategory.style.display = 'none'
} else if (currentUrl.includes('makeup')) {
  makeupCategory.style.display = 'block'
  skincareCategory.style.display = 'none'
} else {
  skincareCategory.style.display = 'block'
  makeupCategory.style.display = 'block'
}

const mainTitle        = document.querySelector('div.main-title').querySelector('b')
const pagination       = document.querySelector('span.pagination')
const urlSlug          = new URL(window.location).pathname.split('/').slice(1).filter(slug => slug !== 'all-products')
let sortOptions        = {}
const filterOptions    = { deletedAt: null, [urlSlug[0]]: urlSlug[1] }
const currentPage      = { page: 1 }

const titles = {
  'xit-khoang': 'Mineral Mist Products',
  'mat-na': 'Mask Products',
  'serum': 'Serum Products',
  'bha': 'BHA Products',
  'tay-da-chet': 'Exfoliator Products',
  'duong-da': 'Moisturizer Products',
  'toner': 'Toner Products',
  'nuoc-tay-trang': 'Cleansing Water Products',
  'cham-mun': 'Spot Treatment Products',
  'kem-duong-am': 'Moisturizing Cream Products',
  'sua-rua-mat': 'Facial Cleanser Products',
  'phan-ma': 'Blush Products',
  'mascara': 'Mascara Products',
  'ke-mat': 'Eyeliner Products',
  'kem-chong-nang': 'Sunscreen Products',
  'che-khuyet-diem': 'Concealer Products',
  'son': 'Lipstick Products',
  'makeup': 'Makeup Products',
  'skincare': 'Skincare Products',
}

if (urlSlug[1] === 'true') {
  if (urlSlug[0] === 'isFlashDeal') {
    mainTitle.innerText = 'Flash Deal Products'
  } else if (urlSlug[0] === 'isNewArrival') {
    mainTitle.innerText = 'New Arrival Products'
  } else if (urlSlug[0] === 'isTopSelling') {
    mainTitle.innerText = 'TopSelling Products'
  }
}

if (titles[urlSlug[1]]) {
  mainTitle.innerText = titles[urlSlug[1]]
  document.title = titles[urlSlug[1]]
} 

if (urlSlug.includes('skincare')) {
  skincareCategory.style.display = ''
}
if (urlSlug.includes('makeup')) {
  makeupCategory.style.display = ''
}

async function paginatingProducts(getDataFunction, sortOptions, filterOptions, data_size) {
  const container = document.querySelector('span.pagination');
  if (!container) return;

  container.innerHTML = ''; // Clear old buttons

  const itemsPerPage = parseInt(document.querySelector('select#items-per-page')?.value, 10) || 10;
  if (data_size <= 0 || itemsPerPage <= 0) return;

  const totalPages = Math.ceil(data_size / itemsPerPage);
  if (totalPages <= 1) return;

  // Auto-correct current page
  if (currentPage.page > totalPages) currentPage.page = totalPages;
  if (currentPage.page < 1) currentPage.page = 1;

  const createPage = (num, isCurrent = false) => {
    const p = document.createElement('p');
    p.textContent = num;
    if (isCurrent) p.classList.add('current');
    p.style.cursor = 'pointer';
    p.onclick = () => {
      currentPage.page = num;
      getDataFunction(sortOptions, filterOptions, num, itemsPerPage);
      window.scrollTo({ top: document.querySelector('.user-all-products-container').offsetTop - 100, behavior: 'smooth' })
    };
    return p;
  };

  // First
  const firstBtn = document.createElement('p');
  firstBtn.textContent = 'First';
  firstBtn.style.fontWeight = '600';
  firstBtn.style.opacity = currentPage.page === 1 ? '0.5' : '1';
  firstBtn.style.cursor = currentPage.page === 1 ? 'default' : 'pointer';
  firstBtn.onclick = currentPage.page !== 1 ? () => {
    currentPage.page = 1;
    getDataFunction(sortOptions, filterOptions, 1, itemsPerPage);
  } : null;
  container.appendChild(firstBtn);

  // Page 1
  container.appendChild(createPage(1, currentPage.page === 1));

  // Left ...
  if (currentPage.page > 4) {
    const dots = document.createElement('p');
    dots.textContent = '...';
    dots.style.pointerEvents = 'none';
    container.appendChild(dots);
  }

  // Middle pages (±3)
  const start = Math.max(2, currentPage.page - 3);
  const end = Math.min(totalPages - 1, currentPage.page + 3);
  for (let i = start; i <= end; i++) {
    container.appendChild(createPage(i, i === currentPage.page));
  }

  // Right ...
  if (currentPage.page < totalPages - 3) {
    const dots = document.createElement('p');
    dots.textContent = '...';
    dots.style.pointerEvents = 'none';
    container.appendChild(dots);
  }

  // Last page
  if (totalPages > 1) {
    container.appendChild(createPage(totalPages, currentPage.page === totalPages));
  }

  // Last button
  const lastBtn = document.createElement('p');
  lastBtn.textContent = 'Last';
  lastBtn.style.fontWeight = '600';
  lastBtn.style.opacity = currentPage.page === totalPages ? '0.5' : '1';
  lastBtn.style.cursor = currentPage.page === totalPages ? 'default' : 'pointer';
  lastBtn.onclick = currentPage.page !== totalPages ? () => {
    currentPage.page = totalPages;
    getDataFunction(sortOptions, filterOptions, totalPages, itemsPerPage);
  } : null;
  container.appendChild(lastBtn);
}

const itemsPerPage = document.querySelector('select#items-per-page')
itemsPerPage.onchange = function () {
  const selectedValue = parseInt(itemsPerPage.value)
  getProducts(sortOptions, filterOptions, currentPage.page, selectedValue)
}


async function checkingClearButton(clearSortBtn, clearFilterBtn) {
  if (Object.keys(sortOptions).length > 0) clearSortBtn.style.display = ''
  if (Object.keys(filterOptions).length > 2) clearFilterBtn.style.display = ''
}

async function getProducts(sortOptions, filterOptions, page = currentPage.page, itemsPerPage) {
  const allProducts = document.querySelector('div[class="products"]').querySelectorAll('a')
  allProducts.forEach(p => p.querySelector('div.loading').style.display = '');

  const response = await fetch('/all-products/data/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sort: sortOptions,
      filter: filterOptions,
      page: page,
      limit: itemsPerPage
    })
  });

  if (!response.ok) throw new Error(`HTTP ${response.status}`);

  const { data, data_size } = await response.json();

  allProducts.forEach((div, index) => {
    div.remove()
  })

  // Fill visible cards, hide extras
  data.forEach(item => {
    // Create the <a> link wrapper
    const link = document.createElement('a');
    link.href = `/all-products/product/${item._id}`;
    link.className = 'product-link'; // optional styling

    // Create the product div
    const product = document.createElement('div');
    product.className = 'product';

    // Build inner HTML structure
    product.innerHTML = `
      <div class="loading"></div>
      <span class="discount-badge"></span>
      <img loading="lazy" src="${item.img?.path || '/images/placeholder.jpg'}" alt="${item.img?.name || item.name || 'Product'}">
      
      ${item.oldPrice > item.price ? `
        <del><p id="old-price">${formatNumber(item.oldPrice)}</p></del>
        <span class="discount-badge">${formatPercentage(
          ((item.oldPrice - item.price) / item.oldPrice) * 100
        )}</span>
      ` : ''}
      
      <p id="price">${formatNumber(item.price)}</p>
      <p id="name">${item.name || 'Unnamed Product'}</p>
      
      <p id="rate">
        <i class="fi fi-ss-star"></i>
        <i class="fi fi-ss-star"></i>
        <i class="fi fi-ss-star"></i>
        <i class="fi fi-ss-star"></i>
        <i class="fi fi-ss-star"></i>
        <span id="rate-score">${formatRate(item.rate)}</span>
      </p>
      
      <p id="sale-number">Sold: ${item.saleNumber || 0}</p>
    `;

    // === Apply star rating colors ===
    const rating = Math.floor(parseFloat(item.rate) || 0);
    const stars = product.querySelectorAll('#rate i');
    stars.forEach((star, idx) => {
      star.style.color = idx < rating ? 'orange' : '#ccc';
    });

    // === Show discount badge only if there's a real discount ===
    const discountBadge = product.querySelector('.discount-badge');
    if (item.oldPrice && item.oldPrice > item.price) {
      const discountPercent = Math.round(((item.oldPrice - item.price) / item.oldPrice) * 100);
      discountBadge.textContent = `-${discountPercent}%`;
      discountBadge.style.display = 'block';
    } else {
      discountBadge.style.display = 'none';
    }

    // Hide loading spinner
    product.querySelector('.loading').style.display = 'none';

    // Append product to link, then link to container
    link.appendChild(product);
    document.querySelector('div[class="products"]').appendChild(link);
  });

  // Update current page & rebuild pagination
  currentPage.page = page;
  paginatingProducts(getProducts, sortOptions, filterOptions, data_size);
}

function calcLeftPosition(value) {
  return (value - minPrice)/(maxPrice - minPrice) * 100
}

// ——————— SORT ———————
const sortSelects = document.querySelectorAll('div.sort select');
sortSelects.forEach(select => {
  select.onchange = function () {
    // Reset all other sort selects
    sortSelects.forEach(other => {
      if (other !== this) other.value = '0';
    });

    const sortType = this.id;
    const sortValue = parseInt(this.value, 10);

    if (sortValue === 0) {
      sortOptions = {};
    } else {
      sortOptions = { [sortType]: sortValue };
    }

    currentPage.page = 1; // Critical: Reset to first page!
    const itemsPerPage = parseInt(document.querySelector('select#items-per-page')?.value, 9) || 9;
    getProducts(sortOptions, filterOptions, 1, itemsPerPage);

    checkingClearButton(clearSortBtn, clearFilterBtn);
  };
})

const clearSortBtn = document.querySelector('div.sort button#clear-sort');
clearSortBtn.onclick = () => {
  sortOptions = {};
  sortSelects.forEach(sel => sel.value = '0');
  clearSortBtn.style.display = 'none';

  currentPage.page = 1;
  const itemsPerPage = parseInt(document.querySelector('select#items-per-page')?.value, 9) || 9;
  getProducts(sortOptions, filterOptions, itemsPerPage);
}

// ——————— FILTER (Price Range) ———————
const minPrice = 10000;
const maxPrice = 1000000;

const rangeMin = document.querySelector('div.filter input#rangeMin');
const rangeMax = document.querySelector('div.filter input#rangeMax');
const thumbMin = document.querySelector('div.filter span#thumbMin');
const thumbMax = document.querySelector('div.filter span#thumbMax');
const displayMin = document.querySelector('div.filter span#min');
const displayMax = document.querySelector('div.filter span#max');
const line = document.querySelector('div.filter div#line');

function updateSlider(minVal, maxVal) {
  thumbMin.style.left = calcLeftPosition(minVal) + '%';
  displayMin.textContent = formatNumber(minVal);
  rangeMin.value = minVal;

  thumbMax.style.left = calcLeftPosition(maxVal) + '%';
  displayMax.textContent = formatNumber(maxVal);
  rangeMax.value = maxVal;

  line.style.left = calcLeftPosition(minVal) + '%';
  line.style.right = (100 - calcLeftPosition(maxVal)) + '%';
}

// Slider input handlers
rangeMin.addEventListener('input', e => {
  let val = parseInt(e.target.value);
  if (val >= parseInt(rangeMax.value)) val = parseInt(rangeMax.value) - 1000;
  updateSlider(val, parseInt(rangeMax.value));
});

rangeMax.addEventListener('input', e => {
  let val = parseInt(e.target.value);
  if (val <= parseInt(rangeMin.value)) val = parseInt(rangeMin.value) + 1000;
  updateSlider(parseInt(rangeMin.value), val);
});

// Submit filter
document.querySelector('div.filter button#submit-filter').addEventListener('click', () => {
  const min = parseInt(rangeMin.value);
  const max = parseInt(rangeMax.value);

  // Only apply if different from default
  if (min === minPrice && max === maxPrice) {
    delete filterOptions.price;
  } else {
    filterOptions.price = `${min}-${max}`;
  }

  currentPage.page = 1; // Always go to page 1 on filter
  const itemsPerPage = parseInt(document.querySelector('select#items-per-page')?.value, 9) || 9;
  getProducts(sortOptions, filterOptions, 1, itemsPerPage);

  checkingClearButton(clearSortBtn, clearFilterBtn);
});

// Clear filter
const clearFilterBtn = document.querySelector('div.filter button#clear-filter');
clearFilterBtn.onclick = () => {
  delete filterOptions.price;
  clearFilterBtn.style.display = 'none';

  updateSlider(minPrice, maxPrice); // Reset UI
  currentPage.page = 1;
  const itemsPerPage = parseInt(document.querySelector('select#items-per-page')?.value, 9) || 9;
  getProducts(sortOptions, filterOptions, 1, itemsPerPage);
};

async function loadData(retriesLeft) {
  try {
    getProducts(sortOptions, filterOptions, currentPage.page, 9)
  } catch (err) {
    if (retriesLeft > 1) {
      console.error(`Retrying... Attempts left: ${retriesLeft - 1}`)
      pushNotification('Error loading data. Retrying...')
      window.setTimeout(async function() {
        loadData(retriesLeft - 1)
      }, 2000)
    } else {
      console.error("Failed to fetch products after multiple attempts:", err)
      pushNotification(`Error loading data: ${err}. Please try again later`)
    }
  }
}

loadData(5)

// setTimeout(() => {
//   getLog(
//     topic = 'page-view',
//     value = {
//       user_id: window.uid,
//       page_type: urlSlug[1],
//       timestamp: new Date(),
//     }
//   );
// }, 1000)