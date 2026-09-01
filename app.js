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
        <img src="${p.image_url || 'assets/logo.jpg'}" alt="${escapeHtml(p.name)}">
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
  const bestSellers = data.slice(0, 5); // Take top 5 products for 3D Banner
  
  sliderContainer.innerHTML = bestSellers.map((p, index) => `
    <div class="card-3d ${index === 0 ? 'active' : index === 1 ? 'next' : index === bestSellers.length - 1 ? 'prev' : ''}" data-title="${escapeHtml(p.name)}">
      <div class="card-img-wrapper">
        <img src="${p.image_url || 'assets/logo.jpg'}" alt="${escapeHtml(p.name)}">
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

// ---------- Water Balloon Soft Physics Logo Logic ----------
const logoBox = document.getElementById('logoBalloon');
if (logoBox) {
  const logoImg = logoBox.querySelector('.balloon-logo');
  
  logoBox.addEventListener('mousemove', (e) => {
    const rect = logoBox.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;

    const stretchX = 1 + Math.abs(x) / 100;
    const stretchY = 1 + Math.abs(y) / 100;

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
  orderFormWrap.style.display = 'block';
  confirmWrap.style.display = 'none';
  updateSummary();
  overlay.classList.add('open');
}

function closeModal() {
  overlay.classList.remove('open');
}

document.getElementById('closeModal').addEventListener('click', closeModal);
document.getElementById('closeConfirmBtn').addEventListener('click', closeModal);
overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });

['deliveryZone', 'promoCode'].forEach(id => {
  document.getElementById(id).addEventListener('input', updateSummary);
  document.getElementById(id).addEventListener('change', updateSummary);
});

function getDiscountPercent() {
  const code = document.getElementById('promoCode').value.trim().toUpperCase();
  const errEl = document.getElementById('promoError');
  if (!code) { errEl.style.display = 'none'; return 0; }
  if (PROMO_CODES[code] !== undefined) {
    errEl.style.display = 'none';
    return PROMO_CODES[code];
  }
  errEl.style.display = 'block';
  return 0;
}

function updateSummary() {
  if (!currentProduct) return;
  const price = Number(currentProduct.price);
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
  const promo = document.getElementById('promoCode').value.trim().toUpperCase();

  const formError = document.getElementById('formError');
  if (!name || !phone || !district || !upazila || !address) {
    formError.style.display = 'block';
    return;
  }
  formError.style.display = 'none';

  const price = Number(currentProduct.price);
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

  document.getElementById('trackIdShow').textContent = trackingId;
  orderFormWrap.style.display = 'none';
  confirmWrap.style.display = 'block';
});

loadProducts();
