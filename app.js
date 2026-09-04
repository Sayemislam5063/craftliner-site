document.getElementById('year').textContent = new Date().getFullYear();

let currentProduct = null;
let allProducts = [];
let allCategories = [];
let activeCategoryId = '';
let selectedColor = null;
let selectedBlouseOption = null;

// ---------- ক্যাটাগরি + প্রোডাক্ট লোড ----------
async function loadProducts() {
  const grid = document.getElementById('product-grid');
  const sliderContainer = document.getElementById('hero3dSlider');
  const dotsContainer = document.getElementById('dotsContainer');

  const [{ data: catData, error: catError }, { data, error }] = await Promise.all([
    supabaseClient.from('categories').select('*').order('name'),
    supabaseClient.from('products').select('*').order('created_at', { ascending: false })
  ]);

  if (!catError) allCategories = catData || [];
  renderCategoryFilter();

  if (error) {
    grid.innerHTML = `<div class="empty-state">প্রোডাক্ট লোড করা যায়নি। একটু পরে আবার চেষ্টা করুন।</div>`;
    console.error(error);
    return;
  }

  allProducts = data || [];

  if (!allProducts.length) {
    grid.innerHTML = `<div class="empty-state">এই মুহূর্তে কোনো প্রোডাক্ট নেই। শীঘ্রই নতুন সংগ্রহ আসছে।</div>`;
    sliderContainer.innerHTML = `<div class="slider-loading">শীঘ্রই নতুন সংগ্রহ আসছে...</div>`;
    return;
  }

  renderGrid();

  const bestSellers = allProducts.slice(0, 5);
  sliderContainer.innerHTML = bestSellers.map((p, index) => `
    <div class="card-3d ${index === 0 ? 'active' : index === 1 ? 'next' : index === bestSellers.length - 1 ? 'prev' : ''}" data-title="${escapeHtml(p.name)}">
      <div class="card-img-wrapper">
        <img src="${p.image_url || 'assets/logo.png'}" alt="${escapeHtml(p.name)}">
      </div>
      <div class="card-info">
        <span class="card-tag">BEST SELLING</span>
        <h3>${escapeHtml(p.name)}</h3>
        <button class="card-3d-btn" onclick='openModal(${JSON.stringify(p).replace(/'/g, "&apos;")})'>অর্ডার করুন ৳${Number(p.offer_price || p.price).toLocaleString('en-BD')}</button>
      </div>
    </div>
  `).join('');

  dotsContainer.innerHTML = bestSellers.map((_, idx) => `<span class="dot ${idx === 0 ? 'active' : ''}"></span>`).join('');
  init3DSliderLogic();
}

// ---------- ক্যাটাগরি ফিল্টার বার ----------
function renderCategoryFilter() {
  const bar = document.getElementById('categoryFilterBar');
  if (!bar || !allCategories.length) { if (bar) bar.innerHTML = ''; return; }

  bar.innerHTML = `
    <button class="cat-chip ${activeCategoryId === '' ? 'active' : ''}" data-cat="">
      <span class="cat-chip-icon">সব</span><span>সব প্রোডাক্ট</span>
    </button>
  ` + allCategories.map(c => `
    <button class="cat-chip ${activeCategoryId === c.id ? 'active' : ''}" data-cat="${c.id}">
      ${c.image_url ? `<img src="${c.image_url}" class="cat-chip-icon">` : `<span class="cat-chip-icon">${escapeHtml((c.name || '?')[0])}</span>`}
      <span>${escapeHtml(c.name)}</span>
    </button>
  `).join('');

  bar.querySelectorAll('.cat-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      activeCategoryId = btn.dataset.cat;
      renderCategoryFilter();
      renderGrid();
    });
  });
}

// ---------- প্রোডাক্ট গ্রিড (ফিল্টার সহ) ----------
function renderGrid() {
  const grid = document.getElementById('product-grid');
  const catMap = {};
  allCategories.forEach(c => catMap[c.id] = c.name);

  const filtered = activeCategoryId ? allProducts.filter(p => p.category_id === activeCategoryId) : allProducts;

  if (!filtered.length) {
    grid.innerHTML = `<div class="empty-state">এই ক্যাটাগরিতে এখনো কোনো প্রোডাক্ট নেই।</div>`;
    return;
  }

  grid.innerHTML = filtered.map(p => {
    const images = (Array.isArray(p.images) && p.images.length) ? p.images : [p.image_url || 'assets/logo.png'];
    const colors = Array.isArray(p.colors) ? p.colors : [];
    const catName = p.category_id ? catMap[p.category_id] : null;
    const soldOut = Number(p.stock ?? 0) <= 0;
    const priceHtml = p.offer_price
      ? `<span class="old-price">৳${Number(p.price).toLocaleString('en-BD')}</span><span class="offer-price">৳${Number(p.offer_price).toLocaleString('en-BD')}</span>`
      : `৳${Number(p.price).toLocaleString('en-BD')}`;

return `
<div class="card">
      <div class="card-image">
        ${p.offer_price ? `<span class="offer-badge">অফার</span>` : ''}
        <img src="${images[0]}" alt="${escapeHtml(p.name)}" class="card-img-active" data-images='${JSON.stringify(images).replace(/'/g, "&apos;")}'>
        ${images.length > 1 ? `<div class="card-img-dots">${images.map((_, i) => `<span class="img-dot ${i === 0 ? 'active' : ''}" data-i="${i}"></span>`).join('')}</div>` : ''}
      </div>
      <div class="card-body">
        ${catName ? `<div class="card-cat-tag" data-category="${p.category_id}">${escapeHtml(catName)}</div>` : ''}
        <h3>${escapeHtml(p.name)}</h3>
        <div class="desc">${escapeHtml(p.description || '')}</div>
        ${colors.length ? `<div class="card-colors">${colors.map(c => `<span class="color-chip-mini">${escapeHtml(c)}</span>`).join('')}</div>` : ''}
        <div class="card-footer">
          <div class="price">${priceHtml}</div>
          ${soldOut
            ? `<button class="buy-btn sold-out-btn" disabled>Sold Out</button>`
            : `<button class="buy-btn" onclick='openModal(${JSON.stringify(p).replace(/'/g, "&apos;")})'>Buy Now</button>`
          }
          ${soldOut
            ? ''
            : `<button class="add-cart-btn" onclick='addToCart(${JSON.stringify(p).replace(/'/g, "&apos;")})'>Add to Cart</button>`
          }
        </div>
      </div>
    </div>
  `;
}).join('');

  grid.querySelectorAll('.card-cat-tag').forEach(tag => {
  tag.addEventListener('click', () => {
    activeCategoryId = tag.dataset.category;
    renderCategoryFilter();
    renderGrid();
    document.getElementById('collection').scrollIntoView({ behavior: 'smooth' });
  });
});

  grid.querySelectorAll('.card-image').forEach(wrap => {
    const img = wrap.querySelector('.card-img-active');
    const images = JSON.parse(img.dataset.images.replace(/&apos;/g, "'"));
    wrap.querySelectorAll('.img-dot').forEach(dot => {
      dot.addEventListener('click', (e) => {
        e.stopPropagation();
        const i = Number(dot.dataset.i);
        img.src = images[i];
        wrap.querySelectorAll('.img-dot').forEach(d => d.classList.remove('active'));
        dot.classList.add('active');
      });
    });
  });
}

// ---------- 3D Slider ----------
function init3DSliderLogic() {
  const cards = document.querySelectorAll('.card-3d');
  const bgTitle = document.getElementById('bgTitle');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const dots = document.querySelectorAll('#dotsContainer .dot');
  if (!cards.length) return;

  let currentIndex = 0;
  function updateSlider() {
    cards.forEach((card, index) => {
      card.classList.remove('active', 'prev', 'next');
      if (index === currentIndex) {
        card.classList.add('active');
        if (bgTitle) bgTitle.innerText = card.getAttribute('data-title');
      } else if (index === (currentIndex - 1 + cards.length) % cards.length) {
        card.classList.add('prev');
      } else if (index === (currentIndex + 1) % cards.length) {
        card.classList.add('next');
      }
    });
    dots.forEach((dot, idx) => dot.classList.toggle('active', idx === currentIndex));
  }
  if (nextBtn) nextBtn.onclick = () => { currentIndex = (currentIndex + 1) % cards.length; updateSlider(); };
  if (prevBtn) prevBtn.onclick = () => { currentIndex = (currentIndex - 1 + cards.length) % cards.length; updateSlider(); };
  setInterval(() => { currentIndex = (currentIndex + 1) % cards.length; updateSlider(); }, 4500);
  updateSlider();
}

// ---------- লোগো হোভার ----------
const logoBox = document.getElementById('logoBalloon');
if (logoBox) {
  const logoImg = logoBox.querySelector('.balloon-logo');
  logoBox.addEventListener('mousemove', (e) => {
    const rect = logoBox.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    const stretchX = 1 + Math.abs(x) / 100;
    logoImg.style.transform = `translate3d(${x * 0.4}px, ${y * 0.4}px, 0) scale(${stretchX}, ${1 / stretchX}) rotate(${x * 0.2}deg)`;
  });
  logoBox.addEventListener('mouseleave', () => {
    logoImg.style.transform = 'translate3d(0, 0, 0) scale(1, 1) rotate(0deg)';
  });
}

function escapeHtml(str) {
  const d = document.createElement('div');
  d.textContent = str || '';
  return d.innerHTML;
}

let cartItems = [];

function addToCart(product) {
  const existing = cartItems.find(item => item.id === product.id);

  if (existing) {
    if (existing.qty < Number(product.stock ?? 0)) {
      existing.qty += 1;
    }
  } else {
    cartItems.push({
      id: product.id,
      name: product.name,
      price: Number(product.offer_price || product.price),
      image_url: product.image_url,
      qty: 1
    });
  }

  updateCartBadge();
  renderCart();
}

function updateCartBadge() {
  const badge = document.getElementById('cartBadge');
  const totalQty = cartItems.reduce((sum, item) => sum + item.qty, 0);

  if (badge) {
    badge.textContent = totalQty;
    badge.style.display = totalQty > 0 ? 'flex' : 'none';
  }
}

function renderCart() {
  const itemsEl = document.getElementById('cartItems');
  const emptyEl = document.getElementById('cartEmpty');
  const footerEl = document.getElementById('cartFooter');
  const totalEl = document.getElementById('cartTotal');

  if (!cartItems.length) {
    itemsEl.innerHTML = '';
    emptyEl.style.display = 'block';
    footerEl.style.display = 'none';
    return;
  }

  emptyEl.style.display = 'none';
  footerEl.style.display = 'block';

  itemsEl.innerHTML = cartItems.map(item => `
    <div class="cart-item">
      <img src="${item.image_url || 'assets/logo.png'}" alt="${escapeHtml(item.name)}">
      <div class="cart-item-info">
        <h4>${escapeHtml(item.name)}</h4>
        <div>৳${item.price.toLocaleString('en-BD')} × ${item.qty}</div>
      </div>
    </div>
  `).join('');

  const total = cartItems.reduce((sum, item) => sum + (item.price * item.qty), 0);
  totalEl.textContent = `৳${total.toLocaleString('en-BD')}`;
}

const cartBtn = document.getElementById('cartBtn');
const cartPanel = document.getElementById('cartPanel');
const closeCartBtn = document.getElementById('closeCartBtn');

cartBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  cartPanel.classList.toggle('open');
});

closeCartBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  cartPanel.classList.remove('open');
});

cartPanel.addEventListener('click', (e) => {
  e.stopPropagation();
});

document.addEventListener('click', () => {
  cartPanel.classList.remove('open');
});

// ---------- Modal & Order Logic ----------
const overlay = document.getElementById('overlay');
const orderFormWrap = document.getElementById('orderFormWrap');
const confirmWrap = document.getElementById('confirmWrap');

function openModal(product) {
  currentProduct = product;
  document.getElementById('productNameField').value = product.name;
  document.getElementById('custName').value = '';
  document.getElementById('custPhone').value = '';
  document.getElementById('custDistrict').value = '';
  document.getElementById('custUpazila').value = '';
  document.getElementById('custAddress').value = '';
  document.getElementById('promoCode').value = '';
  document.getElementById('deliveryZone').value = 'dhaka';
  document.getElementById('promoError').style.display = 'none';
  document.getElementById('formError').style.display = 'none';

  const promoWrap = document.getElementById('promoWrap');
  promoWrap.style.display = (product.promo_allowed === false) ? 'none' : 'block';

  // রঙ
  const colorWrap = document.getElementById('colorFieldWrap');
  const colorRow = document.getElementById('colorSelectRow');
  const colors = Array.isArray(product.colors) ? product.colors : [];
  if (colors.length) {
    colorWrap.style.display = 'block';
    selectedColor = colors[0];
    colorRow.innerHTML = colors.map((c, i) => `<button type="button" class="color-opt ${i === 0 ? 'selected' : ''}" data-color="${escapeHtml(c)}">${escapeHtml(c)}</button>`).join('');
    colorRow.querySelectorAll('.color-opt').forEach(btn => {
      btn.addEventListener('click', () => {
        selectedColor = btn.dataset.color;
        colorRow.querySelectorAll('.color-opt').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
      });
    });
  } else {
    colorWrap.style.display = 'none';
    selectedColor = null;
  }

  // ব্লাউজ পিস
  const blouseWrap = document.getElementById('blouseFieldWrap');
  if (product.has_blouse_option) {
    blouseWrap.style.display = 'block';
    selectedBlouseOption = 'with';
    const withRadio = document.querySelector('input[name="blouseOption"][value="with"]');
    const withoutRadio = document.querySelector('input[name="blouseOption"][value="without"]');
    withRadio.checked = true;
    withoutRadio.checked = false;
    [withRadio, withoutRadio].forEach(r => { r.onchange = () => { selectedBlouseOption = r.value; updateSummary(); }; });
  } else {
    blouseWrap.style.display = 'none';
    selectedBlouseOption = null;
  }

  orderFormWrap.style.display = 'block';
  confirmWrap.style.display = 'none';
  updateSummary();
  overlay.classList.add('open');
}

function closeModal() { overlay.classList.remove('open'); }

document.getElementById('closeModal').addEventListener('click', closeModal);
document.getElementById('closeConfirmBtn').addEventListener('click', closeModal);
overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });

['deliveryZone', 'promoCode'].forEach(id => {
  document.getElementById(id).addEventListener('input', updateSummary);
  document.getElementById(id).addEventListener('change', updateSummary);
});

function getDiscountPercent() {
  if (currentProduct && currentProduct.promo_allowed === false) return 0;
  const code = document.getElementById('promoCode').value.trim().toUpperCase();
  const errEl = document.getElementById('promoError');
  if (!code) { errEl.style.display = 'none'; return 0; }
  if (PROMO_CODES[code] !== undefined) { errEl.style.display = 'none'; return PROMO_CODES[code]; }
  errEl.style.display = 'block';
  return 0;
}

// প্রতি ইউনিটের দাম (ব্লাউজ অপশন > অফার প্রাইস > সাধারণ দাম — এই অগ্রাধিকারে)
function getUnitPrice() {
  if (!currentProduct) return 0;
  if (currentProduct.has_blouse_option && selectedBlouseOption) {
    if (selectedBlouseOption === 'with' && currentProduct.price_with_blouse) return Number(currentProduct.price_with_blouse);
    if (selectedBlouseOption === 'without' && currentProduct.price_without_blouse) return Number(currentProduct.price_without_blouse);
  }
  return currentProduct.offer_price ? Number(currentProduct.offer_price) : Number(currentProduct.price);
}

function updateSummary() {
  if (!currentProduct) return;
  const price = getUnitPrice();
  const zone = document.getElementById('deliveryZone').value;
  const delivery = DELIVERY_CHARGES[zone] || 0;
  const discountPercent = getDiscountPercent();
  const discountAmount = Math.round((price * discountPercent) / 100);
  const total = price + delivery - discountAmount;

  document.getElementById('sumPrice').textContent = `৳${price.toLocaleString('en-BD')}`;
  document.getElementById('sumDelivery').textContent = `৳${delivery.toLocaleString('en-BD')}`;

  const discRow = document.getElementById('sumDiscountRow');
  if (discountAmount > 0) {
    discRow.style.display = 'flex';
    document.getElementById('sumDiscount').textContent = `-৳${discountAmount.toLocaleString('en-BD')}`;
  } else {
    discRow.style.display = 'none';
  }
  document.getElementById('sumTotal').textContent = `৳${total.toLocaleString('en-BD')}`;
}

function generateTrackingId() {
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  const time = Date.now().toString(36).toUpperCase();
  return `SC-${time}${rand}`;
}

document.getElementById('confirmOrderBtn').addEventListener('click', async () => {
  const name = document.getElementById('custName').value.trim();
  const phone = document.getElementById('custPhone').value.trim();
  const district = document.getElementById('custDistrict').value.trim();
  const upazila = document.getElementById('custUpazila').value.trim();
  const address = document.getElementById('custAddress').value.trim();
  const zone = document.getElementById('deliveryZone').value;
  const promoAllowed = currentProduct.promo_allowed !== false;
  const promo = promoAllowed ? document.getElementById('promoCode').value.trim().toUpperCase() : '';

  const formError = document.getElementById('formError');
  if (!name || !phone || !district || !upazila || !address) {
    formError.style.display = 'block';
    return;
  }
  formError.style.display = 'none';

  if (!currentProduct || Number(currentProduct.stock ?? 0) <= 0) {
    formError.textContent = 'দুঃখিত, এই প্রোডাক্টটি বর্তমানে স্টক আউট।';
    formError.style.display = 'block';
    return;
  }

  const price = getUnitPrice();
  const delivery = DELIVERY_CHARGES[zone] || 0;
  const discountPercent = promo && PROMO_CODES[promo] !== undefined ? PROMO_CODES[promo] : 0;
  const discountAmount = Math.round((price * discountPercent) / 100);
  const total = price + delivery - discountAmount;
  const trackingId = generateTrackingId();

  const btn = document.getElementById('confirmOrderBtn');
  btn.disabled = true;
  btn.textContent = 'অপেক্ষা করুন...';

  const { error } = await supabaseClient.from('orders').insert({
    tracking_id: trackingId,
    customer_name: name,
    phone: phone,
    district: district,
    upazila: upazila,
    full_address: address,
    items: [{ id: currentProduct.id, name: currentProduct.name, price: price, qty: 1 }],
    product_total: price,
    delivery_charge: delivery,
    promo_code: promo || null,
    discount: discountAmount,
    total_price: total,
    selected_color: selectedColor || null,
    blouse_option: selectedBlouseOption || null,
    status: 'pending',
    sent_to_telegram: false
  });

  btn.disabled = false;
  btn.textContent = 'অর্ডার কনফার্ম করুন';

  if (error) {
    console.error(error);
    formError.textContent = 'দুঃখিত, অর্ডার সাবমিট করা যায়নি। আবার চেষ্টা করুন।';
    formError.style.display = 'block';
    return;
  }

  const { data: stockUpdated, error: stockError } = await supabaseClient
    .rpc('decrease_product_stock', { product_id: currentProduct.id });

  if (stockError || !stockUpdated) {
    console.error(stockError || 'Stock update failed');
  }

  document.getElementById('trackIdShow').textContent = trackingId;
  orderFormWrap.style.display = 'none';
  confirmWrap.style.display = 'block';
});

loadProducts();
