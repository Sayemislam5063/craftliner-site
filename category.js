const params = new URLSearchParams(window.location.search);
const categoryId = params.get('id');

const titleEl = document.getElementById('categoryTitle');
const descriptionEl = document.getElementById('categoryDescription');
const productsGrid = document.getElementById('categoryProductsGrid');

let categoryProducts = [];

async function loadCategory() {
  if (!categoryId) {
    showCategoryError('ক্যাটাগরি পাওয়া যায়নি।');
    return;
  }

  const { data: category, error: categoryError } = await supabaseClient
    .from('categories')
    .select('*')
    .eq('id', categoryId)
    .single();

  if (categoryError || !category) {
    console.error('Category load failed:', categoryError);
    showCategoryError('ক্যাটাগরি পাওয়া যায়নি।');
    return;
  }

  titleEl.textContent = category.name;

  descriptionEl.textContent =
    `এই ক্যাটাগরির সকল ${category.name} দেখুন`;

  const { data: products, error: productsError } = await supabaseClient
    .from('products')
    .select('*')
    .eq('category_id', categoryId)
    .order('created_at', { ascending: false });

  if (productsError) {
    console.error('Category products load failed:', productsError);
    showCategoryError('এই ক্যাটাগরির প্রোডাক্ট লোড করা যায়নি।');
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

  if (descriptionEl) {
    descriptionEl.textContent = '';
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
