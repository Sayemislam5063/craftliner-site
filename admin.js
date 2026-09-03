// Supabase সেটআপ
const supabase = window.supabase.createClient(
  window.SUPABASE_URL,
  window.SUPABASE_ANON_KEY
);

// DOM রেফারেন্স
const form = document.getElementById('product-form');
const categorySelect = document.getElementById('product-category');
const fileInput = document.getElementById('file-input');
const dropZone = document.getElementById('drop-zone');
const previewGrid = document.getElementById('preview-grid');
const productList = document.getElementById('product-list');
const categoryList = document.getElementById('category-list');
const toast = document.getElementById('toast');

let uploadedFiles = [];

// টোস্ট
function showToast(msg, type = 'success') {
  toast.textContent = msg;
  toast.className = 'toast ' + type;
  toast.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('show'), 3000);
}

// ক্যাটাগরি লোড
async function loadCategories() {
  try {
    const { data, error } = await supabase.from('categories').select('*').order('name');
    if (error) throw error;

    categorySelect.innerHTML = '<option value="">— ক্যাটাগরি নির্বাচন করুন —</option>';
    data.forEach(c => {
      categorySelect.innerHTML += `<option value="${c.id}">${c.name}</option>`;
    });

    categoryList.innerHTML = data.map(c => `
      <span class="category-chip">
        ${c.name}
        <button onclick="deleteCategory('${c.id}')"><i class="fas fa-times"></i></button>
      </span>
    `).join('');
  } catch (error) {
    showToast('ক্যাটাগরি লোডে সমস্যা', 'error');
  }
}

// ক্যাটাগরি যোগ
document.getElementById('add-category-btn').addEventListener('click', async () => {
  const input = document.getElementById('category-input');
  const name = input.value.trim();
  if (!name) return showToast('ক্যাটাগরির নাম দিন', 'error');

  try {
    const { error } = await supabase.from('categories').insert({ name });
    if (error) throw error;
    input.value = '';
    showToast('✅ ক্যাটাগরি যোগ হয়েছে');
    loadCategories();
  } catch (error) {
    showToast('❌ ' + error.message, 'error');
  }
});

// ক্যাটাগরি ডিলিট
window.deleteCategory = async (id) => {
  if (!confirm('ক্যাটাগরি ডিলিট করবেন?')) return;
  try {
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) throw error;
    showToast('🗑️ ক্যাটাগরি ডিলিট হয়েছে');
    loadCategories();
  } catch (error) {
    showToast('❌ ' + error.message, 'error');
  }
};

// ইমেজ আপলোড (Supabase Storage)
async function uploadImages(files) {
  const urls = [];
  for (const file of files) {
    const fileName = `${Date.now()}_${file.name}`;
    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(fileName, file);

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from('product-images')
      .getPublicUrl(fileName);

    urls.push(urlData.publicUrl);
  }
  return urls;
}

// ড্রপ জোন
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
    uploadedFiles.push(f);
    const reader = new FileReader();
    reader.onload = ev => {
      const img = document.createElement('img');
      img.src = ev.target.result;
      img.style.width = '100%';
      img.style.height = '100%';
      img.style.objectFit = 'cover';
      
      const div = document.createElement('div');
      div.className = 'preview-item';
      div.appendChild(img);
      
      const btn = document.createElement('button');
      btn.className = 'remove-img';
      btn.innerHTML = '<i class="fas fa-times"></i>';
      btn.onclick = () => {
        const idx = uploadedFiles.indexOf(f);
        if (idx > -1) {
          uploadedFiles.splice(idx, 1);
          div.remove();
        }
      };
      div.appendChild(btn);
      previewGrid.appendChild(div);
    };
    reader.readAsDataURL(f);
  }
  fileInput.value = '';
}

// পণ্য আপলোড
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
  if (uploadedFiles.length === 0) {
    return showToast('কমপক্ষে একটি ছবি আপলোড করুন', 'error');
  }

  try {
    const imageUrls = await uploadImages(uploadedFiles);

    const { error } = await supabase.from('products').insert({
      name,
      price,
      offer_price: offerPrice,
      category_id: categoryId,
      colors,
      price_with_blouse: priceWithBlouse,
      price_without_blouse: priceWithoutBlouse,
      images: imageUrls,
    });

    if (error) throw error;

    showToast('🎉 পণ্য সফলভাবে সংরক্ষিত!');
    form.reset();
    uploadedFiles = [];
    previewGrid.innerHTML = '';
    loadProducts();
  } catch (error) {
    showToast('❌ ' + error.message, 'error');
  }
});

// পণ্য লোড
async function loadProducts() {
  try {
    const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (error) throw error;

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
  } catch (error) {
    showToast('পণ্য লোডে সমস্যা', 'error');
  }
}

// রিফ্রেশ
document.getElementById('refresh-products').addEventListener('click', loadProducts);

// ট্যাব সুইচ
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

// শুরু
loadCategories();
loadProducts();
