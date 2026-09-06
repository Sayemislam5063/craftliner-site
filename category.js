const params = new URLSearchParams(window.location.search);
const categoryId = params.get('id');

const titleEl = document.getElementById('categoryTitle');
const productsGrid = document.getElementById('categoryProductsGrid');
const heroBanner = document.getElementById('categoryHeroBanner');
const bubblesScroll = document.getElementById('categoryBubblesScroll');

let categoryProducts = [];

async function loadCategory() {
  if (!categoryId) {
    showCategoryError('ক্যাটাগরি পাওয়া যায়নি।');
    return;
  }

  // ১. ওপরের বাবল স্লাইডারের ডাটা লোড
  const { data: categories } = await supabaseClient
    .from('categories')
    .select('*')
    .order('name');

  if (categories && categories.length && bubblesScroll) {
    bubblesScroll.innerHTML = categories.map(cat => {
      const isActive = cat.id == categoryId ? 'active' : '';
      const catImage = cat.image_url || 'assets/logo.png';
      return `
        <a href="category.html?id=${cat.id}" class="category-bubble-item ${isActive}">
          <div class="bubble-img-wrap">
            <img src="${catImage}" alt="${escapeHtml(cat.name)}">
          </div>
          <span>${escapeHtml(cat.name)}</span>
        </a>
      `;
    }).join('');
  }

  // ২. বর্তমান ক্যাটাগরির নাম ও ব্যানার লোড
  const { data: category, error: categoryError } = await supabaseClient
    .from('categories')
    .select('*')
    .eq('id', categoryId)
    .single();

  if (categoryError || !category) {
    console.error('Category load failed:', categoryError);
    showCategoryError('ক্যাটাগরি পাওয়া যায়নি।');
    return;
  }

  if (titleEl) titleEl.textContent = category.name;

  // ব্যানারের ব্যাকগ্রাউন্ড ছবি সেট
  if (category.image_url && heroBanner) {
    heroBanner.style.backgroundImage = `linear-gradient(rgba(0, 0, 0, 0.35), rgba(0, 0, 0, 0.35)), url('${category.image_url}')`;
  }

  // ৩. প্রোডাক্ট লোড করা
  const { data: products, error: productsError } = await supabaseClient
    .from('products')
    .select('*')
    .eq('category_id', categoryId)
    .order('created_at', { ascending: false });

  if (productsError) {
    console.error('Category products load failed:', productsError);
    showCategoryError('এই ক্যাটাগরির প্রোডাক্ট লোড করা যায়নি।');
    return;
  }

  categoryProducts = products || [];

  if (!categoryProducts.length) {
    productsGrid.innerHTML = `
      <div class="empty-state">
        এই ক্যাটাগরিতে এখনো কোনো প্রোডাক্ট নেই।
      </div>
    `;
    return;
  }

  renderCategoryProducts();
}

function renderCategoryProducts() {
  productsGrid.innerHTML = categoryProducts.map(product => {

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
      : `৳${Number(product.price).toLocaleString('en-BD')}`;

    const soldOut = Number(product.stock ?? 0) <= 0;

    return `
      <div class="category-product-card">

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
                  class="sold-out-btn"
                  disabled>
                  Sold Out
                </button>
              `
              : `
                <button
                  class="choose-product-btn"
                  onclick="window.location.href='product.html?id=${product.id}'">
                  বেছে নিন
                </button>
              `
          }

        </div>

      </div>
    `;
  }).join('');
}

function showCategoryError(message) {
  if (titleEl) {
    titleEl.textContent = 'ক্যাটাগরি';
  }

  if (productsGrid) {
    productsGrid.innerHTML = `
      <div class="empty-state">
        ${escapeHtml(message)}
      </div>
    `;
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

loadCategory();
