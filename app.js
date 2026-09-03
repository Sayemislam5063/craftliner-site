document.getElementById('year').textContent = new Date().getFullYear();

let currentProduct = null;

// ---------- Load products from Supabase & Build Grid + 3D Slider ----------
async function loadProducts() {
  const grid = document.getElementById('product-grid');
  const sliderContainer = document.getElementById('hero3dSlider');
  const dotsContainer = document.getElementById('dotsContainer');

  const { data, error } = await supabaseClient
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    grid.innerHTML = `<div class="empty-state">প্রোডাক্ট লোড করা যায়নি। একটু পরে আবার চেষ্টা করুন।</div>`;
    console.error(error);
    return;
  }

  if (!data || data.length === 0) {
    grid.innerHTML = `<div class="empty-state">এই মুহূর্তে কোনো প্রোডাক্ট নেই। শীঘ্রই নতুন সংগ্রহ আসছে।</div>`;
    sliderContainer.innerHTML = `<div class="slider-loading">শীঘ্রই নতুন সংগ্রহ আসছে...</div>`;
    return;
  }

  // Render Product Grid
  grid.innerHTML = data.map(p => `
    <div class="card">
      <div class="card-image">
        <img src="${p.image_url || 'assets/logo.png'}" alt="${escapeHtml(p.name)}">
      </div>
      <div class="card-body">
        <h3>${escapeHtml(p.name)}</h3>
        <div class="desc">${escapeHtml(p.description || '')}</div>
        <div class="card-footer">
          <div class="price">৳${Number(p.price).toLocaleString('en-BD')}</div>
          <button class="buy-btn" onclick='openModal(${JSON.stringify(p).replace(/'/g, "&apos;")})'>Buy Now</button>
        </div>
      </div>
    </div>
  `).join('');

  // ---------- Generate 3D Slider from Database Products ----------
  const bestSellers = data.slice(0, 5);

  sliderContainer.innerHTML = bestSellers.map((p, index) => `
    <div class="card-3d ${index === 0 ? 'active' : index === 1 ? 'next' : index === bestSellers.length - 1 ? 'prev' : ''}" data-title="${escapeHtml(p.name)}">
      <div class="card-img-wrapper">
        <img src="${p.image_url || 'assets/logo.png'}" alt="${escapeHtml(p.name)}">
      </div>
      <div class="card-info">
        <span class="card-tag">BEST SELLING</span>
        <h3>${escapeHtml(p.name)}</h3>
        <button class="card-3d-btn" onclick='openModal(${JSON.stringify(p).replace(/'/g, "&apos;")})'>অর্ডার করুন ৳${Number(p.price).toLocaleString('en-BD')}</button>
      </div>
    </div>
  `).join('');

  dotsContainer.innerHTML = bestSellers.map((_, idx) => `<span class="dot ${idx === 0 ? 'active' : ''}"></span>`).join('');

  init3DSliderLogic();
}

// ---------- 3D Slider Dynamic Logic ----------
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

    dots.forEach((dot, idx) => {
      dot.classList.toggle('active', idx === currentIndex);
    });
  }

  if (nextBtn) {
    nextBtn.onclick = () => {
      currentIndex = (currentIndex + 1) % cards.length;
      updateSlider();
    };
  }

  if (prevBtn) {
    prevBtn.onclick = () => {
      currentIndex = (currentIndex - 1 + cards.length) % cards.length;
      updateSlider();
    };
  }

  setInterval(() => {
    currentIndex = (currentIndex + 1) % cards.length;
    updateSlider();
  }, 4500);

  updateSlider();
}

// ---------- Water Balloon Soft Physics Logo Logic (desktop hover) ----------
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

document.getElementById('year').textContent = new Date().getFullYear();

let currentProduct = null;
let selectedBlouseOption = 'regular'; // ব্লাউজ অপশন ট্র্যাক করার ভ্যারিয়েন্ট

// ---------- ১. Supabase থেকে প্রোডাক্ট লোড ও ৩ডি স্লাইডার বিল্ড করা ----------
async function loadProducts() {
  const grid = document.getElementById('product-grid');
  const sliderContainer = document.getElementById('hero3dSlider');
  const dotsContainer = document.getElementById('dotsContainer');

  const { data, error } = await supabaseClient
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    if (grid) grid.innerHTML = `<div class="empty-state">প্রোডাক্ট লোড করা যায়নি। একটু পরে আবার চেষ্টা করুন।</div>`;
    console.error(error);
    return;
  }

  if (!data || data.length === 0) {
    if (grid) grid.innerHTML = `<div class="empty-state">এই মুহূর্তে কোনো প্রোডাক্ট নেই। শীঘ্রই নতুন সংগ্রহ আসছে।</div>`;
    if (sliderContainer) sliderContainer.innerHTML = `<div class="slider-loading">শীঘ্রই নতুন সংগ্রহ আসছে...</div>`;
    return;
  }

  // প্রোডাক্ট গ্রিড রেন্ডার করা
  renderProductsGrid(data);

  // ৩ডি স্লাইডার জেনারেট করা (ডাটাবেজ থেকে শীর্ষ ৫টি)
  const bestSellers = data.slice(0, 5);

  if (sliderContainer) {
    sliderContainer.innerHTML = bestSellers.map((p, index) => `
      <div class="card-3d ${index === 0 ? 'active' : index === 1 ? 'next' : index === bestSellers.length - 1 ? 'prev' : ''}" data-title="${escapeHtml(p.name)}">
        <div class="card-img-wrapper">
          <img src="${p.image_url || 'assets/logo.png'}" alt="${escapeHtml(p.name)}">
        </div>
        <div class="card-info">
          <span class="card-tag">BEST SELLING</span>
          <h3>${escapeHtml(p.name)}</h3>
          <button class="card-3d-btn" onclick='openModal(${JSON.stringify(p).replace(/'/g, "&apos;")})'>অর্ডার করুন ৳${Number(p.price).toLocaleString('en-BD')}</button>
        </div>
      </div>
    `).join('');
  }

  if (dotsContainer) {
    dotsContainer.innerHTML = bestSellers.map((_, idx) => `<span class="dot ${idx === 0 ? 'active' : ''}"></span>`).join('');
  }

  init3DSliderLogic();
}

// প্রোডাক্ট গ্রিড রেন্ডার করার ফাংশন
function renderProductsGrid(products) {
  const grid = document.getElementById('product-grid');
  if (!grid) return;

  if (!products || products.length === 0) {
    grid.innerHTML = `<div class="empty-state">এই ক্যাটাগরিতে কোনো প্রোডাক্ট পাওয়া যায়নি।</div>`;
    return;
  }

  grid.innerHTML = products.map(p => `
    <div class="card">
      <div class="card-image">
        <img src="${p.image_url || 'assets/logo.png'}" alt="${escapeHtml(p.name)}">
      </div>
      <div class="card-body">
        <h3>${escapeHtml(p.name)}</h3>
        <div class="desc">${escapeHtml(p.description || '')}</div>
        <div class="card-footer">
          <div class="price">৳${Number(p.price).toLocaleString('en-BD')}</div>
          <button class="buy-btn" onclick='openModal(${JSON.stringify(p).replace(/'/g, "&apos;")})'>Buy Now</button>
        </div>
      </div>
    </div>
  `).join('');
}

// ---------- ২. ৩ডি স্লাইডার ডাইনামিক লজিক ----------
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

    dots.forEach((dot, idx) => {
      dot.classList.toggle('active', idx === currentIndex);
    });
  }

  if (nextBtn) {
    nextBtn.onclick = () => {
      currentIndex = (currentIndex + 1) % cards.length;
      updateSlider();
    };
  }

  if (prevBtn) {
    prevBtn.onclick = () => {
      currentIndex = (currentIndex - 1 + cards.length) % cards.length;
      updateSlider();
    };
  }

  setInterval(() => {
    currentIndex = (currentIndex + 1) % cards.length;
    updateSlider();
  }, 4500);

  updateSlider();
}

// ---------- ৩. গোল (Round) ক্যাটাগরি লোড ও ফিল্টারিং লজিক ----------
async function loadCategoriesUI() {
  const container = document.getElementById('categoryCircleList');
  if (!container) return;

  const { data: categories, error } = await supabaseClient.from('categories').select('*').order('name');
  if (error || !categories) return;

  let html = `
    <div onclick="filterProductByCategory('all')" style="text-align: center; cursor: pointer; flex-shrink: 0;">
      <div style="width: 75px; height: 75px; border-radius: 50%; border: 2.5px solid #5c061c; overflow: hidden; margin: 0 auto 6px; background: #fffaf7; display: flex; align-items: center; justify-content: center; font-weight: bold; color: #5c061c; font-size: 13px;">
        সবগুলো
      </div>
      <span style="font-size: 12px; font-weight: 600; color: #333;">সব শাড়ি</span>
    </div>
  `;

  categories.forEach(cat => {
    html += `
      <div onclick="filterProductByCategory('${cat.name}')" style="text-align: center; cursor: pointer; flex-shrink: 0;">
        <div style="width: 75px; height: 75px; border-radius: 50%; border: 2.5px solid #5c061c; overflow: hidden; margin: 0 auto 6px; background: #f9f9f9;">
          <img src="${cat.image_url}" alt="${cat.name}" style="width: 100%; height: 100%; object-fit: cover;">
        </div>
        <span style="font-size: 12px; font-weight: 600; color: #333;">${cat.name}</span>
      </div>
    `;
  });

  container.innerHTML = html;
}

// গোল ক্যাটাগরিতে ক্লিক করলে শাড়ি ফিল্টার হবে
async function filterProductByCategory(categoryName) {
  const grid = document.getElementById('product-grid');
  if (grid) grid.innerHTML = `<div class="empty-state">ফিল্টার হচ্ছে...</div>`;

  let query = supabaseClient.from('products').select('*');
  if (categoryName !== 'all') {
    query = query.eq('category', categoryName);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    if (grid) grid.innerHTML = `<div class="empty-state">ডাটা ফিল্টার করতে সমস্যা হয়েছে।</div>`;
    return;
  }

  renderProductsGrid(data);
}

// ---------- ৪. ওয়াটার বেলুন ফিজিক্স লোগো লজিক ----------
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

// ---------- ৫. মোডাল ও অর্ডার লজিক ----------
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

  // প্রোমো কোড ফিল্ড অন/অফ হ্যান্ডলিং
  const promoWrap = document.getElementById('promoWrap');
  if (promoWrap) {
    promoWrap.style.display = (product.promo_allowed === false) ? 'none' : 'block';
  }

  // কালার ড্রপডাউন ডাইনামিক সেট করা
  const colorWrap = document.getElementById('colorWrap');
  const colorSelect = document.getElementById('custColor');
  if (colorWrap && colorSelect) {
    if (product.colors && product.colors.length > 0) {
      colorWrap.style.display = 'block';
      colorSelect.innerHTML = product.colors.map(c => `<option value="${c}">${c}</option>`).join('');
    } else {
      colorWrap.style.display = 'none';
    }
  }

  // ব্লাউজ সিলেক্ট অপশন হ্যান্ডলিং
  const blouseWrap = document.getElementById('blouseWrap');
  const blouseSelect = document.getElementById('blouseOption');
  if (blouseWrap) {
    if (product.price_with_blouse || product.price_without_blouse) {
      blouseWrap.style.display = 'block';
      if (blouseSelect) blouseSelect.value = 'regular';
    } else {
      blouseWrap.style.display = 'none';
    }
  }

  selectedBlouseOption = 'regular';
  orderFormWrap.style.display = 'block';
  confirmWrap.style.display = 'none';
  updateSummary();
  overlay.classList.add('open');
}

function closeModal() {
  overlay.classList.remove('open');
}

const closeModalBtn = document.getElementById('closeModal');
if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);

const closeConfirmBtn = document.getElementById('closeConfirmBtn');
if (closeConfirmBtn) closeConfirmBtn.addEventListener('click', closeModal);

if (overlay) {
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });
}

// ডেলিভারি জোন বা প্রোমো কোড ফিল্ডে চেঞ্জ লিসেনার
['deliveryZone', 'promoCode'].forEach(id => {
  const el = document.getElementById(id);
  if (el) {
    el.addEventListener('input', updateSummary);
    el.addEventListener('change', updateSummary);
  }
});

// ব্লাউজ সিলেক্ট অপশন চেঞ্জ
const blouseSelectEl = document.getElementById('blouseOption');
if (blouseSelectEl) {
  blouseSelectEl.addEventListener('change', (e) => {
    selectedBlouseOption = e.target.value;
    updateSummary();
  });
}

function getDiscountPercent() {
  if (currentProduct && currentProduct.promo_allowed === false) return 0;
  const promoEl = document.getElementById('promoCode');
  if (!promoEl) return 0;

  const code = promoEl.value.trim().toUpperCase();
  const errEl = document.getElementById('promoError');
  if (!code) { if (errEl) errEl.style.display = 'none'; return 0; }

  if (typeof PROMO_CODES !== 'undefined' && PROMO_CODES[code] !== undefined) {
    if (errEl) errEl.style.display = 'none';
    return PROMO_CODES[code];
  }
  if (errEl) errEl.style.display = 'block';
  return 0;
}

function updateSummary() {
  if (!currentProduct) return;

  // ব্লাউজের ডাইনামিক প্রাইসিং
  let price = Number(currentProduct.price);
  if (selectedBlouseOption === 'with_blouse' && currentProduct.price_with_blouse) {
    price = Number(currentProduct.price_with_blouse);
  } else if (selectedBlouseOption === 'without_blouse' && currentProduct.price_without_blouse) {
    price = Number(currentProduct.price_without_blouse);
  }

  const zoneEl = document.getElementById('deliveryZone');
  const zone = zoneEl ? zoneEl.value : 'dhaka';
  const delivery = (typeof DELIVERY_CHARGES !== 'undefined') ? (DELIVERY_CHARGES[zone] || 0) : 0;
  const discountPercent = getDiscountPercent();
  const discountAmount = Math.round((price * discountPercent) / 100);
  const total = price + delivery - discountAmount;

  const sumPrice = document.getElementById('sumPrice');
  const sumDelivery = document.getElementById('sumDelivery');
  const sumTotal = document.getElementById('sumTotal');

  if (sumPrice) sumPrice.textContent = `৳${price.toLocaleString('en-BD')}`;
  if (sumDelivery) sumDelivery.textContent = `৳${delivery.toLocaleString('en-BD')}`;

  const discRow = document.getElementById('sumDiscountRow');
  const sumDiscount = document.getElementById('sumDiscount');
  if (discountAmount > 0) {
    if (discRow) discRow.style.display = 'flex';
    if (sumDiscount) sumDiscount.textContent = `-৳${discountAmount.toLocaleString('en-BD')}`;
  } else {
    if (discRow) discRow.style.display = 'none';
  }

  if (sumTotal) sumTotal.textContent = `৳${total.toLocaleString('en-BD')}`;
}

function generateTrackingId() {
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  const time = Date.now().toString(36).toUpperCase();
  return `SC-${time}${rand}`;
}

// ---------- ৬. অর্ডার কনফার্ম সাবমিট লজিক ----------
const confirmOrderBtn = document.getElementById('confirmOrderBtn');
if (confirmOrderBtn) {
  confirmOrderBtn.addEventListener('click', async () => {
    const name = document.getElementById('custName').value.trim();
    const phone = document.getElementById('custPhone').value.trim();
    const district = document.getElementById('custDistrict').value.trim();
    const upazila = document.getElementById('custUpazila').value.trim();
    const address = document.getElementById('custAddress').value.trim();
    const zone = document.getElementById('deliveryZone').value;
    
    // সিলেক্টেড কালার
    const colorSelect = document.getElementById('custColor');
    const selectedColor = (colorSelect && colorSelect.value) ? colorSelect.value : null;

    const promoAllowed = currentProduct.promo_allowed !== false;
    const promo = promoAllowed ? document.getElementById('promoCode').value.trim().toUpperCase() : '';

    const formError = document.getElementById('formError');
    if (!name || !phone || !district || !upazila || !address) {
      if (formError) formError.style.display = 'block';
      return;
    }
    if (formError) formError.style.display = 'none';

    // ব্লাউজ অনুযায়ী ফাইনাল প্রাইস হিসাব
    let price = Number(currentProduct.price);
    if (selectedBlouseOption === 'with_blouse' && currentProduct.price_with_blouse) {
      price = Number(currentProduct.price_with_blouse);
    } else if (selectedBlouseOption === 'without_blouse' && currentProduct.price_without_blouse) {
      price = Number(currentProduct.price_without_blouse);
    }

    const delivery = (typeof DELIVERY_CHARGES !== 'undefined') ? (DELIVERY_CHARGES[zone] || 0) : 0;
    const discountPercent = (promo && typeof PROMO_CODES !== 'undefined' && PROMO_CODES[promo] !== undefined) ? PROMO_CODES[promo] : 0;
    const discountAmount = Math.round((price * discountPercent) / 100);
    const total = price + delivery - discountAmount;
    const trackingId = generateTrackingId();

    confirmOrderBtn.disabled = true;
    confirmOrderBtn.textContent = 'অপেক্ষা করুন...';

    const itemDetails = {
      id: currentProduct.id,
      name: currentProduct.name,
      price: price,
      qty: 1,
      color: selectedColor,
      blouse_option: selectedBlouseOption
    };

    const { error } = await supabaseClient.from('orders').insert({
      tracking_id: trackingId,
      customer_name: name,
      phone: phone,
      district: district,
      upazila: upazila,
      full_address: address,
      items: [itemDetails],
      product_total: price,
      delivery_charge: delivery,
      promo_code: promo || null,
      discount: discountAmount,
      total_price: total,
      status: 'pending',
      sent_to_telegram: false
    });

    confirmOrderBtn.disabled = false;
    confirmOrderBtn.textContent = 'অর্ডার কনফার্ম করুন';

    if (error) {
      console.error(error);
      if (formError) {
        formError.textContent = 'দুঃখিত, অর্ডার সাবমিট করা যায়নি। আবার চেষ্টা করুন।';
        formError.style.display = 'block';
      }
      return;
    }

    document.getElementById('trackIdShow').textContent = trackingId;
    orderFormWrap.style.display = 'none';
    confirmWrap.style.display = 'block';
  });
}

// অ্যাপ রান হওয়া শুরু করবে
loadProducts();
loadCategoriesUI();
