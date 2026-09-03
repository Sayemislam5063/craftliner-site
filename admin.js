// ===== Supabase সেটআপ =====
const supabase = window.supabase.createClient(
  window.SUPABASE_URL,
  window.SUPABASE_ANON_KEY
);

// ===== DOM রেফারেন্স =====
const form = document.getElementById('product-form');
const categorySelect = document.getElementById('product-category');
const fileInput = document.getElementById('file-input');
const dropZone = document.getElementById('drop-zone');
const previewGrid = document.getElementById('preview-grid');
const productList = document.getElementById('product-list');
const categoryList = document.getElementById('category-list');
const toast = document.getElementById('toast');

let uploadedImages = [];

// ===== ট্যাব সুইচ =====
document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
    if (btn.dataset.tab === 'manage-products') loadProducts();
    if (btn.dataset.tab === 'categories') loadCategories();
  });
});

// ===== টোস্ট =====
function showToast(msg, type = 'success') {
  toast.textContent = msg;
  toast.className = 'toast ' + type;
  toast.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('show'), 3000);
}

// ===== ক্যাটাগরি লোড =====
async function loadCategories() {
  const { data, error } = await supabase.from('categories').select('*').order('name');
  if (error) return showToast('ক্যাটাগরি লোডে সমস্যা', 'error');
  
  // ক্যাটাগরি সিলেক্টে দেখানো
  categorySelect.innerHTML = '<option value="">— ক্যাটাগরি নির্বাচন করুন —</option>';
  data.forEach(c => {
    categorySelect.innerHTML += `<option value="${c.id}">${c.name}</option>`;
  });

  // ক্যাটাগরি চিপস
  categoryList.innerHTML = data.map(c => `
    <span class="category-chip">
      ${c.name}
      <button onclick="deleteCategory('${c.id}')"><i class="fas fa-times"></i></button>
    </span>
  `).join('');
}

// ===== ক্যাটাগরি যোগ =====
document.getElementById('add-category-btn').addEventListener('click', async () => {
  const input = document.getElementById('category-input');
  const name = input.value.trim();
  if (!name) return showToast('ক্যাটাগরির নাম দিন', 'error');
  const { error } = await supabase.from('categories').insert({ name });
  if (error) return showToast(error.message, 'error');
  input.value = '';
  showToast('✅ ক্যাটাগরি যোগ হয়েছে');
  loadCategories();
});

window.deleteCategory = async (id) => {
  if (!confirm('ক্যাটাগরি ডিলিট করবেন?')) return;
  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) return showToast(error.message, 'error');
  showToast('🗑️ ক্যাটাগরি ডিলিট হয়েছে');
  loadCategories();
};

// ===== ড্রপ জোন =====
dropZone.addEventListener('click', () => fileInput.click());
dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('dragover'); });
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
dropZone.addEventListener('drop', e => {
  e.preventDefault();
  dropZone.classList.remove('dragover');
  if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
});
fileInput.addEventListener('change', e => handleFiles(e.target.files));

function handleFiles(files) {
  for (let f of files) {
    if (!f.type.startsWith('image/')) continue;
    const reader = new FileReader();
    reader.onload = ev => {
      uploadedImages.push(ev.target.result);
      renderPreviews();
    };
    reader.readAsDataURL(f);
  }
  fileInput.value = '';
}

function renderPreviews() {
  previewGrid.innerHTML = uploadedImages.map((src, i) => `
    <div class="preview-item">
      <img src="${src}" alt="preview">
      <button class="remove-img" onclick="removeImage(${i})"><i class="fas fa-times"></i></button>
    </div>
  `).join('');
}
window.removeImage = (idx) => {
  uploadedImages.splice(idx, 1);
  renderPreviews();
};

// ===== পণ্য আপলোড =====
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('product-name').value.trim();
  const price = parseFloat(document.getElementById('product-price').value);
  const offerPrice = parseFloat(document.getElementById('product-offer-price').value) || null;
  const categoryId = document.getElementById('product-category').value;
  const colors = document.getElementById('product-colors').value.split(',').map(s => s.trim()).filter(Boolean);
  const priceWithBlouse = parseFloat(document.getElementById('price-with-blouse').value) || null;
  const priceWithoutBlouse = parseFloat(document.getElementById('price-without-blouse').value) || null;

  if (!name || !price || !categoryId) {
    return showToast('নাম, দাম ও ক্যাটাগরি আবশ্যক', 'error');
  }
  if (uploadedImages.length === 0) {
    return showToast('কমপক্ষে একটি ছবি আপলোড করুন', 'error');
  }

  // সাপাবেসে সেভ
  const { data, error } = await supabase.from('products').insert({
    name,
    price,
    offer_price: offerPrice,
    category_id: categoryId,
    colors,
    price_with_blouse: priceWithBlouse,
    price_without_blouse: priceWithoutBlouse,
    images: uploadedImages,
  });

  if (error) return showToast('❌ ' + error.message, 'error');
  showToast('🎉 পণ্য সফলভাবে সংরক্ষিত!');
  form.reset();
  uploadedImages = [];
  renderPreviews();
  loadProducts();
});

// ===== পণ্য লোড =====
async function loadProducts() {
  const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
  if (error) return showToast('পণ্য লোডে সমস্যা', 'error');
  productList.innerHTML = data.map(p => `
    <div class="product-card">
      <img src="${p.images?.[0] || 'https://placehold.co/200x200?text=No+Image'}" alt="${p.name}">
      <h4>${p.name}</h4>
      <div>
        <span class="price">৳${p.price}</span>
        ${p.offer_price ? `<span class="offer">৳${p.offer_price}</span>` : ''}
      </div>
      <div style="font-size:0.8rem;color:#64748b;margin-top:0.3rem;">
        ${p.colors?.length ? p.colors.join(', ') : ''}
      </div>
    </div>
  `).join('');
}

// ===== রিফ্রেশ =====
document.getElementById('refresh-products').addEventListener('click', loadProducts);

// ===== ইনিশিয়াল লোড =====
loadCategories();
loadProducts();
