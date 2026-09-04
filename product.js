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

  loadingEl.style.display = 'none';
  detailsEl.style.display = 'block';
}

loadProduct();
