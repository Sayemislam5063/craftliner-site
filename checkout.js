const cartItems = JSON.parse(
  localStorage.getItem('shareeCraftlineCart') || '[]'
);

const checkoutItemsEl = document.getElementById('checkoutItems');
const subtotalEl = document.getElementById('checkoutSubtotal');
const deliveryEl = document.getElementById('checkoutDelivery');
const totalEl = document.getElementById('checkoutTotal');
const zoneEl = document.getElementById('checkoutZone');

const deliveryCharges = {
  dhaka: 80,
  outside: 130
};

function renderCheckout() {
  if (!cartItems.length) {
    checkoutItemsEl.innerHTML = `
      <div class="empty-state">
        আপনার কার্ট এখনো খালি।
      </div>
    `;

    subtotalEl.textContent = '৳0';
    deliveryEl.textContent = '৳0';
    totalEl.textContent = '৳0';

    return;
  }

  checkoutItemsEl.innerHTML = cartItems.map(item => `
    <div class="checkout-item">

      <img
        src="${item.image_url || 'assets/logo.png'}"
        alt="${escapeHtml(item.name)}"
        class="checkout-item-image"
      >

      <div class="checkout-item-info">
        <h3>${escapeHtml(item.name)}</h3>

        ${item.color
          ? `<p>রঙ: ${escapeHtml(item.color)}</p>`
          : ''
        }

        ${item.blouse
          ? `<p>${item.blouse === 'with'
              ? 'ব্লাউজ পিস সহ'
              : 'ব্লাউজ পিস ছাড়া'}
          </p>`
          : ''
        }

        <div class="checkout-item-meta">
          <span>৳${Number(item.price).toLocaleString('en-BD')} × ${item.qty}</span>

          <strong>
            ৳${(
              Number(item.price) * Number(item.qty)
            ).toLocaleString('en-BD')}
          </strong>
        </div>
      </div>

    </div>
  `).join('');

  const subtotal = cartItems.reduce(
    (sum, item) =>
      sum + (Number(item.price) * Number(item.qty)),
    0
  );

  const delivery = deliveryCharges[zoneEl.value] || 0;
  const total = subtotal + delivery;

  subtotalEl.textContent =
    `৳${subtotal.toLocaleString('en-BD')}`;

  deliveryEl.textContent =
    `৳${delivery.toLocaleString('en-BD')}`;

  totalEl.textContent =
    `৳${total.toLocaleString('en-BD')}`;
}

zoneEl.addEventListener('change', renderCheckout);

function escapeHtml(str) {
  const d = document.createElement('div');
  d.textContent = str || '';
  return d.innerHTML;
}

function generateTrackingId() {
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  const time = Date.now().toString(36).toUpperCase();
  return `SC-${time}${rand}`;
}

document.getElementById('placeOrderBtn').addEventListener('click', async () => {
  const name = document.getElementById('checkoutName').value.trim();
  const phone = document.getElementById('checkoutPhone').value.trim();
  const district = document.getElementById('checkoutDistrict').value.trim();
  const upazila = document.getElementById('checkoutUpazila').value.trim();
  const address = document.getElementById('checkoutAddress').value.trim();
  const zone = zoneEl.value;

  const errorEl = document.getElementById('checkoutError');

  if (!cartItems.length) {
    errorEl.textContent = 'আপনার কার্টে কোনো প্রোডাক্ট নেই।';
    errorEl.style.display = 'block';
    return;
  }

  if (!name || !phone || !district || !upazila || !address) {
    errorEl.textContent = 'নাম, মোবাইল, জেলা, উপজেলা ও সম্পূর্ণ ঠিকানা দিন।';
    errorEl.style.display = 'block';
    return;
  }

  errorEl.style.display = 'none';

  const subtotal = cartItems.reduce(
    (sum, item) => sum + (Number(item.price) * Number(item.qty)),
    0
  );

  const delivery = deliveryCharges[zone] || 0;
  const total = subtotal + delivery;
  const trackingId = generateTrackingId();

  const items = cartItems.map(item => ({
    id: item.id,
    name: item.name,
    price: Number(item.price),
    qty: Number(item.qty),
    color: item.color || null,
    blouse: item.blouse || null
  }));

  const btn = document.getElementById('placeOrderBtn');
  btn.disabled = true;
  btn.textContent = 'অর্ডার হচ্ছে...';

  const { error } = await supabaseClient
    .from('orders')
    .insert({
      tracking_id: trackingId,
      customer_name: name,
      phone: phone,
      district: district,
      upazila: upazila,
      full_address: address,
      items: items,
      product_total: subtotal,
      delivery_charge: delivery,
      promo_code: null,
      discount: 0,
      total_price: total,
      selected_color: items.length === 1 ? items[0].color : null,
      blouse_option: items.length === 1 ? items[0].blouse : null,
      status: 'pending',
      sent_to_telegram: false
    });

  if (error) {
    console.error(error);
    errorEl.textContent = 'অর্ডার করা যায়নি। আবার চেষ্টা করুন।';
    errorEl.style.display = 'block';
    btn.disabled = false;
    btn.textContent = 'অর্ডার প্লেস করুন';
    return;
  }

  localStorage.removeItem('shareeCraftlineCart');

  btn.disabled = false;
  btn.textContent = 'অর্ডার প্লেস করুন';

  alert(`আপনার অর্ডার সফল হয়েছে।\nTracking ID: ${trackingId}`);

  window.location.href = 'index.html';
});

renderCheckout();
