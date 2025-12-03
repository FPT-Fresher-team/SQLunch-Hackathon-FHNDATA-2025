importLinkCss('/css/user/home.css');
importLinkCss('/css/user/advertise.css');

/* ====================== UTILS ====================== */
const delay = (ms) => new Promise(res => setTimeout(res, ms));

/* Wait for global flags (isLoggedIn & recommend_url) */
async function waitForGlobals() {
  while (
    typeof window.isLoggedIn === 'undefined' ||
    typeof window.recommend_url === 'undefined'
  ) {
    await delay(50);
  }
}

/* ====================== PRODUCT RENDERER ====================== */
function renderProducts(containerSelector, productsData) {
  const container = document.querySelector(containerSelector);
  if (!container) return;

  const productEls = container.querySelectorAll('div.product');

  productEls.forEach((el, index) => {
    const item = productsData[index];

    // Hide extra placeholders if we have fewer items than slots
    if (!item) {
      el.closest('a')?.setAttribute('href', '#');
      el.style.display = 'none';
      return;
    }

    // Discount badge
    const discount = item.oldPrice && item.price
      ? (item.oldPrice - item.price) / item.oldPrice * 100
      : 0;
    const badge = el.querySelector('span.discount-badge');
    if (badge) badge.textContent = formatPercentage(discount);

    // Image
    const img = el.querySelector('img');
    if (img) {
      img.src = item.img?.path || '/images/placeholder.jpg';
      img.alt = item.img?.name || item.name || 'Product';
    }

    // Prices
    const oldPriceEl = el.querySelector('p#old-price');
    const priceEl = el.querySelector('p#price');
    if (oldPriceEl) oldPriceEl.textContent = formatNumber(item.oldPrice || 0);
    if (priceEl) priceEl.textContent = formatNumber(item.price || 0);

    // Name & sales
    const nameEl = el.querySelector('p#name');
    if (nameEl) nameEl.textContent = item.name || 'Unknown Product';

    const saleEl = el.querySelector('p#sale-number');
    if (saleEl) saleEl.textContent = `Sold: ${item.saleNumber || 0}`;

    // Rating stars
    const rateScoreEl = el.querySelector('span#rate-score');
    const score = item.rate ? parseFloat(item.rate) : 0;
    if (rateScoreEl) rateScoreEl.textContent = formatRate(score);

    el.querySelectorAll('i').forEach((star, i) => {
      star.style.color = i < Math.floor(score) ? 'orange' : '';
    });

    // Link
    const link = el.closest('a');
    if (link) link.href = `/all-products/product/${item._id || item.id}`;

    // Hide loading spinner
    const loading = el.querySelector('div.loading');
    if (loading) loading.style.display = 'none';

    el.style.display = ''; // ensure visible
  });
}

/* ====================== DATA LOADERS ====================== */

async function getVouchers() {
  await waitForGlobals();
  if (!window.isLoggedIn) return;

  const board = document.querySelector('div.vouchers-board#voucher');
  if (!board) return;
  board.style.display = 'flex';

  try {
    const res = await fetch('/data/vouchers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const { data } = await res.json();
    const voucherEls = board.querySelectorAll('div.v"All"');

    voucherEls.forEach((v, i) => {
      const voucher = data[i];
      if (!voucher) {
        v.style.display = 'none';
        return;
      }

      v.querySelector('p#name').textContent = voucher.name;
      v.querySelector('p#description').textContent = voucher.description;
      v.querySelector('p#end-date').textContent = formatDate(voucher.endDate);
      v.querySelector('p#code').textContent = 'Code: ' + voucher.code;

      const loading = v.querySelector('div.loading');
      if (loading) loading.style.display = 'none';

      // Link to voucher detail
      v.closest('a')?.setAttribute('href', `/all-vouchers/voucher/${voucher._id}`);

      // Copy button
      const btn = v.querySelector('button');
      if (btn) {
        btn.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          navigator.clipboard.writeText(voucher.code).then(() => {
            pushNotification(`Code copied: ${voucher.code}`, 'success');
          }).catch(() => {
            pushNotification('Failed to copy code', 'error');
          });
        };
      }

      v.style.display = '';
    });
  } catch (err) {
    console.error(err);
    pushNotification('Failed to load vouchers');
  }
}

async function getFavProducts() {
  await waitForGlobals();
  if (!window.isLoggedIn) return;

  const board = document.querySelector('div.products-board#favorite');
  if (!board) return;
  board.style.display = 'flex';

  try {
    const res = await fetch('/recommend/', {  // relative URL – works in production
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'rating' }),
      credentials: 'include'
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const { data } = await res.json();

    renderProducts('div.products-board#favorite', data);
  } catch (err) {
    console.error(err);
    pushNotification('Failed to load recommended products');
  }
}

async function getProducts() {
  try {
    const res = await fetch('/data/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const { flashSale, newArrival, topSale, all } = await res.json();

    renderProducts('div.flash-deal-board#flash-deal', flashSale);
    renderProducts('div.products-board#top-sale', topSale);
    renderProducts('div.products-board#new-arrival', newArrival);
    renderProducts('div.products-board#all', all);
  } catch (err) {
    console.error(err);
    pushNotification('Failed to load products');
  }
}

async function getBrands() {
  try {
    const res = await fetch('/data/brands', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const { data } = await res.json();

    const brandImgs = document.querySelectorAll('div.famous-brand-board#brand img');
    brandImgs.forEach((img, i) => {
      const brand = data[i];
      if (!brand) {
        img.closest('a')?.setAttribute('href', '#');
        img.style.display = 'none';
        return;
      }

      img.src = brand.img?.path || '/images/brand-placeholder.png';
      img.alt = brand.name || 'Brand';
      img.closest('a')?.setAttribute('href', `/all-brands/brand/${brand._id}`);
      img.style.display = '';
    });
  } catch (err) {
    console.error(err);
    pushNotification('Failed to load brands');
  }
}

/* ====================== MAIN LOADER WITH RETRY ====================== */
async function loadHomeData(attempts = 5) {
  try {
    await Promise.allSettled([
      getVouchers(),
      getFavProducts(),
      getProducts(),
      getBrands()
    ]);

    console.log('Homepage data loaded successfully');
  } catch (err) {
    if (attempts > 1) {
      pushNotification(`Retrying... (${attempts - 1} attempts left)`);
      await delay(2000);
      return loadHomeData(attempts - 1);
    } else {
      console.error('Failed to load homepage after multiple attempts:', err);
      pushNotification('Failed to load content. Please refresh the page.');
    }
  }
}

/* ====================== START ====================== */
loadHomeData(5);