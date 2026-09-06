const bubblesScroll = document.getElementById('categoryBubblesScroll');
const productsGrid = document.getElementById('allProductsGrid');

async function initAllProductsPage() {
  // ১. বটম নেভিগেশন লোড করা
  loadBottomNav();

  // ২. ক্যাটাগরি বাবল স্লাইডার লোড করা
  loadCategoryBubbles();

  // ৩. সকল প্রোডাক্ট ডাটাবেস থেকে লোড করা
  loadAllProducts();
}

// বটম নেভিগেশন লোড করার ফাংশন
function loadBottomNav() {
  const placeholder = document.getElementById('bottomNavPlaceholder');
  if (!placeholder) return;

  fetch('bottom-nav.html')
    .then(response => response.text())
    .then(html => {
      placeholder.innerHTML = html;
      // একটিভ লিঙ্ক হাইলাইট (যদি প্রয়োজন হয়)
      const navLinks = placeholder.querySelectorAll('.bottom-nav-item');
      navLinks.forEach(link => {
        if (link.getAttribute('href') === 'products.html') {
          link.classList.add('active');
        }
      });
    })
    .catch(err => console.error('Bottom nav load error:', err));
}

// বাবল স্লাইডার লোড
async function loadCategoryBubbles() {
  const { data: categories } = await supabaseClient
    .from('categories')
    .select('*')
    .order('name');

  if (categories && categories.length && bubblesScroll) {
    bubblesScroll.innerHTML = categories.map(cat => {
      const catImage = cat.image_url || 'assets/logo.png';
      return `
        <a href="category.html?id=${cat.id}" class="category-bubble-item">
          <div class="bubble-img-wrap">
            <img src="${catImage}" alt="${escapeHtml(cat.name)}">
          </div>
          <span>${escapeHtml(cat.name)}</span>
        </a>
      `;
    }).join('');
  }
}

// সকল শাড়ি/প্রোডাক্ট লোড
async function loadAllProducts() {
  const { data: products, error } = await supabaseClient
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Products load failed:', error);
    productsGrid.innerHTML = `<div class="empty-state">প্রোডাক্ট লোড করা যায়নি।</div>`;
    return;
  }

  if (!products || !products.length) {
    productsGrid.innerHTML = `<div class="empty-state">কোনো প্রোডাক্ট পাওয়া যায়নি।</div>`;
    return;
  }

  renderProducts(products);
}

// প্রোডাক্ট কার্ড রেন্ডার করা
function renderProducts(products) {
  productsGrid.innerHTML = products.map(product => {
    const images = (Array.isArray(product.images) && product.images.length)
      ? product.images
      : [product.image_url || 'assets/logo.png'];

    const priceHtml = product.offer_price
      ? `
        <span class="old-price">৳${Number(product.price).toLocaleString('en-BD')}</span>
        <span class="offer-price">৳${Number(product.offer_price).toLocaleString('en-BD')}</span>
      `
      : `৳${Number(product.price).toLocaleString('en-BD')}`;

    const soldOut = Number(product.stock ?? 0) <= 0;

    return `
      <div class="category-product-card">
        <div class="category-product-image">
          ${product.offer_price ? `<span class="offer-badge">অফার</span>` : ''}
          <img src="${images[0]}" alt="${escapeHtml(product.name)}">
        </div>
        <div class="category-product-body">
          <h3>${escapeHtml(product.name)}</h3>
          <div class="category-product-price">${priceHtml}</div>
          ${
            soldOut
              ? `<button class="sold-out-btn" disabled>Sold Out</button>`
              : `<button class="choose-product-btn" onclick="window.location.href='product.html?id=${product.id}'">বেছে নিন</button>`
          }
        </div>
      </div>
    `;
  }).join('');
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

// পেজ লোড হলে রান হবে
initAllProductsPage();
