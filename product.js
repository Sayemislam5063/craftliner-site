const params = new URLSearchParams(window.location.search);
const productId = params.get('id');

let cartItems = JSON.parse(localStorage.getItem('shareeCraftlineCart') || '[]');

const loadingEl = document.getElementById('productLoading');
const detailsEl = document.getElementById('productDetails');
const errorEl = document.getElementById('productError');

let currentDetailProduct = null;
let selectedDetailColor = null;
let selectedDetailBlouse = null;
let detailQuantity = 1;

async function loadProduct() {
  if (!productId) {
    loadingEl.style.display = 'none';
    errorEl.style.display = 'block';
    return;
  }

  const { data: product, error } = await supabaseClient
    .from('products')
    .select('*')
    .eq('id', productId)
    .single();

  if (error || !product) {
    console.error(error);
    loadingEl.style.display = 'none';
    errorEl.style.display = 'block';
    return;
  }

  console.log('Product loaded:', product);
  currentDetailProduct = product;

  const images = (Array.isArray(product.images) && product.images.length)
    ? product.images
    : [product.image_url || 'assets/logo.png'];

  const category = product.category_id
    ? await supabaseClient
        .from('categories')
        .select('name')
        .eq('id', product.category_id)
        .single()
    : { data: null };

  const categoryName = category.data?.name || '';

  document.getElementById('productMainImage').src = images[0];
  document.getElementById('productMainImage').alt = product.name;

  document.getElementById('productTitle').textContent = product.name;
  document.getElementById('productCategory').textContent = categoryName;

  document.getElementById('productDescription').textContent =
    product.description || 'এই প্রোডাক্টের কোনো বিস্তারিত বিবরণ এখনো যোগ করা হয়নি।';

  const stock = Number(product.stock ?? 0);
  const stockEl = document.getElementById('productStock');

  if (stock > 0) {
    stockEl.textContent = `স্টকে আছে (${stock} টি)`;
  } else {
    stockEl.textContent = 'Sold Out';
  }

  const priceEl = document.getElementById('productPrice');

  if (product.offer_price) {
    priceEl.innerHTML = `
      <span class="old-price">
        ৳${Number(product.price).toLocaleString('en-BD')}
      </span>
      <span class="offer-price">
        ৳${Number(product.offer_price).toLocaleString('en-BD')}
      </span>
    `;
  } else {
    priceEl.textContent = `৳${Number(product.price).toLocaleString('en-BD')}`;
  }

  const optionsEl = document.getElementById('productOptions');

const colors = Array.isArray(product.colors) ? product.colors : [];

if (colors.length || product.has_blouse_option) {
  let optionsHtml = '';

  if (colors.length) {
    selectedDetailColor = colors[0];

    optionsHtml += `
      <div class="detail-option-group">
        <label>রঙ বেছে নিন</label>
        <div class="detail-color-options">
          ${colors.map((color, index) => `
            <button
              type="button"
              class="detail-color-option ${index === 0 ? 'active' : ''}"
              data-color="${escapeHtml(color)}">
              ${escapeHtml(color)}
            </button>
          `).join('')}
        </div>
      </div>
    `;
  }

  if (product.has_blouse_option) {
    selectedDetailBlouse = 'with';

    optionsHtml += `
      <div class="detail-option-group">
        <label>ব্লাউজ পিস</label>
        <div class="detail-blouse-options">
          <label class="detail-radio-option">
            <input type="radio" name="detailBlouse" value="with" checked>
            <span>ব্লাউজ পিস সহ</span>
          </label>

          <label class="detail-radio-option">
            <input type="radio" name="detailBlouse" value="without">
            <span>ব্লাউজ পিস ছাড়া</span>
          </label>
        </div>
      </div>
    `;
  }

  optionsEl.innerHTML = optionsHtml;
} else {
  optionsEl.innerHTML = '';
}

const qtyMinus = document.getElementById('qtyMinus');
const qtyPlus = document.getElementById('qtyPlus');
const qtyEl = document.getElementById('productQty');

qtyEl.textContent = detailQuantity;

qtyMinus.addEventListener('click', () => {
  if (detailQuantity <= 1) return;

  detailQuantity -= 1;
  qtyEl.textContent = detailQuantity;
});

qtyPlus.addEventListener('click', () => {
  const stock = Number(product.stock ?? 0);

  if (detailQuantity >= stock) return;

  detailQuantity += 1;
  qtyEl.textContent = detailQuantity;
});

optionsEl.querySelectorAll('.detail-color-option').forEach(button => {
  button.addEventListener('click', () => {
    selectedDetailColor = button.dataset.color;

    optionsEl
      .querySelectorAll('.detail-color-option')
      .forEach(item => item.classList.remove('active'));

    button.classList.add('active');
  });
});

optionsEl.querySelectorAll('input[name="detailBlouse"]').forEach(radio => {
  radio.addEventListener('change', () => {
    selectedDetailBlouse = radio.value;
  });
});

  const thumbnailsEl = document.getElementById('productThumbnails');

  thumbnailsEl.innerHTML = images.map((image, index) => `
    <button
      type="button"
      class="product-thumbnail ${index === 0 ? 'active' : ''}"
      data-image="${image}">
      <img src="${image}" alt="">
    </button>
  `).join('');

  thumbnailsEl.querySelectorAll('.product-thumbnail').forEach(button => {
    button.addEventListener('click', () => {
      document.getElementById('productMainImage').src =
        button.dataset.image;

      thumbnailsEl
        .querySelectorAll('.product-thumbnail')
        .forEach(item => item.classList.remove('active'));

      button.classList.add('active');
    });
  });

  loadingEl.style.display = 'none';
  detailsEl.style.display = 'block';
}
function escapeHtml(str) {
  const d = document.createElement('div');
  d.textContent = str || '';
  return d.innerHTML;
}
loadProduct();
