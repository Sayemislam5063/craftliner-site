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

renderCheckout();
