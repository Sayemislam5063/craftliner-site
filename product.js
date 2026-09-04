const params = new URLSearchParams(window.location.search);
const productId = params.get('id');

const loadingEl = document.getElementById('productLoading');
const detailsEl = document.getElementById('productDetails');
const errorEl = document.getElementById('productError');

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

loadProduct();
