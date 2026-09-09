const yearEl = document.getElementById('year');

if (yearEl) {
  yearEl.textContent = new Date().getFullYear();
}

const productsGrid = document.getElementById('allProductsGrid');

let allProducts = [];
let cartItems = JSON.parse(
  localStorage.getItem('shareeCraftlineCart') || '[]'
);


// =========================================================
// HTML ESCAPE
// =========================================================

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}


// =========================================================
// LOAD ALL PRODUCTS
// =========================================================

async function loadAllProducts() {

  if (!productsGrid) return;

  productsGrid.innerHTML = `
    <div class="empty-state">
      সকল প্রোডাক্ট লোড হচ্ছে...
    </div>
  `;

  const { data, error } = await supabaseClient
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {

    console.error('All products load failed:', error);

    productsGrid.innerHTML = `
      <div class="empty-state">
        প্রোডাক্ট লোড করা যায়নি। একটু পরে আবার চেষ্টা করুন।
      </div>
    `;

    return;
  }

  allProducts = data || [];

  if (!allProducts.length) {

    productsGrid.innerHTML = `
      <div class="empty-state">
        এখনো কোনো প্রোডাক্ট নেই।
      </div>
    `;

    return;
  }

  renderAllProducts();
}


// =========================================================
// RENDER ALL PRODUCTS
// =========================================================

function renderAllProducts() {

  productsGrid.innerHTML = allProducts.map(product => {

    const images =
      (Array.isArray(product.images) && product.images.length)
        ? product.images
        : [product.image_url || 'assets/logo.png'];

    const priceHtml = product.offer_price
      ? `
        <span class="old-price">
          ৳${Number(product.price).toLocaleString('en-BD')}
        </span>

        <span class="offer-price">
          ৳${Number(product.offer_price).toLocaleString('en-BD')}
        </span>
      `
      : `
        ৳${Number(product.price).toLocaleString('en-BD')}
      `;

    const soldOut = Number(product.stock ?? 0) <= 0;

    return `
      <article class="category-product-card">

        <div class="category-product-image">

          ${
            product.offer_price
              ? `<span class="offer-badge">অফার</span>`
              : ''
          }

          <img
            src="${images[0]}"
            alt="${escapeHtml(product.name)}"
          >

        </div>

        <div class="category-product-body">

          <h3>
            ${escapeHtml(product.name)}
          </h3>

          <div class="category-product-price">
            ${priceHtml}
          </div>

          ${
            soldOut
              ? `
                <button
                  type="button"
                  class="sold-out-btn"
                  disabled>
                  Sold Out
                </button>
              `
              : `
                <button
                  type="button"
                  class="choose-product-btn"
                  data-product-id="${product.id}">
                  বেছে নিন
                </button>
              `
          }

        </div>

      </article>
    `;

  }).join('');


  // Product Details navigation

  productsGrid
    .querySelectorAll('.choose-product-btn')
    .forEach(button => {

      button.addEventListener('click', () => {

        const productId = button.dataset.productId;

        if (!productId) return;

        window.location.href =
          `product.html?id=${productId}`;

      });

    });
}


// =========================================================
// CART BADGE
// =========================================================

function updateCartBadge() {

  const badge = document.getElementById('cartBadge');

  const totalProducts = cartItems.length;

  if (badge) {

    badge.textContent = totalProducts;

    badge.style.display =
      totalProducts > 0 ? 'flex' : 'none';

  }
}


// =========================================================
// RENDER CART
// =========================================================

function renderCart() {

  const itemsEl = document.getElementById('cartItems');
  const emptyEl = document.getElementById('cartEmpty');
  const footerEl = document.getElementById('cartFooter');
  const totalEl = document.getElementById('cartTotal');

  if (!itemsEl || !emptyEl || !footerEl || !totalEl) {
    return;
  }

  if (!cartItems.length) {

    itemsEl.innerHTML = '';

    emptyEl.style.display = 'block';

    footerEl.style.display = 'none';

    return;
  }

  emptyEl.style.display = 'none';

  footerEl.style.display = 'block';


  itemsEl.innerHTML = cartItems.map((item, index) => `

    <div class="cart-item">

      <img
        src="${item.image_url || 'assets/logo.png'}"
        alt="${escapeHtml(item.name)}"
        class="cart-item-image"
      >

      <div class="cart-item-info">

        <h4>
          ${escapeHtml(item.name)}
        </h4>

        ${
          item.color
            ? `
              <div class="cart-item-option">
                রঙ: ${escapeHtml(item.color)}
              </div>
            `
            : ''
        }

        ${
          item.blouse
            ? `
              <div class="cart-item-option">
                ${
                  item.blouse === 'with'
                    ? 'ব্লাউজ পিস সহ'
                    : 'ব্লাউজ পিস ছাড়া'
                }
              </div>
            `
            : ''
        }

        <div class="cart-item-bottom">

          <div class="cart-item-qty">

            <button
              type="button"
              class="cart-qty-btn"
              data-index="${index}"
              data-action="minus">
              −
            </button>

            <span>
              ${item.qty}
            </span>

            <button
              type="button"
              class="cart-qty-btn"
              data-index="${index}"
              data-action="plus">
              +
            </button>

          </div>

          <strong class="cart-item-price">
            ৳${(
              Number(item.price) *
              Number(item.qty)
            ).toLocaleString('en-BD')}
          </strong>

        </div>

      </div>

      <button
        type="button"
        class="cart-remove-btn"
        data-index="${index}"
        title="সরিয়ে দিন">
        ×
      </button>

    </div>

  `).join('');


  const total = cartItems.reduce(
    (sum, item) =>
      sum +
      (
        Number(item.price) *
        Number(item.qty)
      ),
    0
  );


  totalEl.textContent =
    `৳${total.toLocaleString('en-BD')}`;


  // Quantity buttons

  itemsEl
    .querySelectorAll('.cart-qty-btn')
    .forEach(button => {

      button.addEventListener('click', () => {

        const index =
          Number(button.dataset.index);

        const action =
          button.dataset.action;

        const item =
          cartItems[index];

        if (!item) return;


        if (action === 'minus') {

          if (item.qty > 1) {
            item.qty -= 1;
          }

        }


        if (action === 'plus') {

          const product =
            allProducts.find(
              p => p.id === item.id
            );

          const stock =
            product
              ? Number(product.stock ?? 0)
              : 0;

          if (item.qty < stock) {
            item.qty += 1;
          }

        }


        localStorage.setItem(
          'shareeCraftlineCart',
          JSON.stringify(cartItems)
        );

        updateCartBadge();
        renderCart();

      });

    });


  // Remove buttons

  itemsEl
    .querySelectorAll('.cart-remove-btn')
    .forEach(button => {

      button.addEventListener('click', () => {

        const index =
          Number(button.dataset.index);

        if (Number.isNaN(index)) return;

        cartItems.splice(index, 1);

        localStorage.setItem(
          'shareeCraftlineCart',
          JSON.stringify(cartItems)
        );

        updateCartBadge();
        renderCart();

      });

    });

}


// =========================================================
// CART OPEN / CLOSE
// =========================================================

const cartBtn =
  document.getElementById('cartBtn');

const cartPanel =
  document.getElementById('cartPanel');

const closeCartBtn =
  document.getElementById('closeCartBtn');


if (cartBtn && cartPanel) {

  cartBtn.addEventListener('click', (e) => {

    e.stopPropagation();

    cartPanel.classList.toggle('open');

  });

}


if (closeCartBtn && cartPanel) {

  closeCartBtn.addEventListener('click', (e) => {

    e.stopPropagation();

    cartPanel.classList.remove('open');

  });

}


if (cartPanel) {

  cartPanel.addEventListener('click', (e) => {
    e.stopPropagation();
  });

}


document.addEventListener('click', () => {

  if (cartPanel) {
    cartPanel.classList.remove('open');
  }

});


// =========================================================
// CHECKOUT
// =========================================================

const cartCheckoutBtn =
  document.getElementById('cartCheckoutBtn');

if (cartCheckoutBtn) {

  cartCheckoutBtn.addEventListener('click', () => {

    if (!cartItems.length) {

      alert(
        'আপনার কার্টে কোনো প্রোডাক্ট নেই।'
      );

      return;
    }

    window.location.href =
      'checkout.html';

  });

}


// =========================================================
// INIT
// =========================================================

loadAllProducts();

updateCartBadge();

renderCart();
