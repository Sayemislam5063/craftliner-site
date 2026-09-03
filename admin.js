const loginScreen = document.getElementById('loginScreen');
const adminPanel = document.getElementById('adminPanel');

let categoriesList = [];
let colorsArray = [];
let imagesArray = [];
let newCategoryImageUrl = null;

async function checkSession() {
  const { data } = await supabaseClient.auth.getSession();
  if (data.session) { showAdmin(); } else { showLogin(); }
}
function showLogin() { loginScreen.style.display = 'flex'; adminPanel.style.display = 'none'; }
function showAdmin() {
  loginScreen.style.display = 'none';
  adminPanel.style.display = 'block';
  loadCategories();
  loadProducts();
}

document.getElementById('loginBtn').addEventListener('click', async () => {
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const errEl = document.getElementById('loginError');
  errEl.style.display = 'none';
  const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) { errEl.style.display = 'block'; return; }
  showAdmin();
});
document.getElementById('logoutBtn').addEventListener('click', async () => {
  await supabaseClient.auth.signOut();
  showLogin();
});

// ================= ক্যাটাগরি =================
async function loadCategories() {
  const { data, error } = await supabaseClient.from('categories').select('*').order('name');
  if (error) { console.error(error); return; }
  categoriesList = data || [];
  renderCategoryChips();
  renderCategoryOptions();
}

function renderCategoryChips() {
  const wrap = document.getElementById('categoryChips');
  if (!categoriesList.length) { wrap.innerHTML = `<span style="font-size:13px;color:var(--maroon-soft);">এখনো কোনো ক্যাটাগরি নেই</span>`; return; }
  wrap.innerHTML = categoriesList.map(c => `
    <div class="category-chip">
      ${c.image_url ? `<img class="chip-thumb" src="${c.image_url}" alt="">` : ''}
      <span>${escapeHtml(c.name)}</span>
      <button data-id="${c.id}" title="ডিলিট">×</button>
    </div>
  `).join('');
  wrap.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => deleteCategory(btn.dataset.id));
  });
}

function renderCategoryOptions() {
  const sel = document.getElementById('pCategory');
  const current = sel.value;
  sel.innerHTML = `<option value="">-- ক্যাটাগরি বেছে নিন --</option>` +
    categoriesList.map(c => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join('');
  sel.value = current;
}

// ক্যাটাগরির ছবি আপলোড
const categoryImgUpload = document.getElementById('categoryImgUpload');
const categoryImgInput = document.getElementById('categoryImgInput');
const categoryImgPreview = document.getElementById('categoryImgPreview');
const categoryImgPlaceholder = document.getElementById('categoryImgPlaceholder');

categoryImgUpload.addEventListener('click', () => categoryImgInput.click());
categoryImgInput.addEventListener('change', async () => {
  const file = categoryImgInput.files[0];
  if (!file) return;
  categoryImgPlaceholder.textContent = '...';

  const safeName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
  const filePath = `category_${Date.now()}_${safeName}`;
  const { error } = await supabaseClient.storage.from('products').upload(filePath, file, { cacheControl: '3600', upsert: false });

  if (error) {
    console.error(error);
    categoryImgPlaceholder.textContent = '+';
    alert('ক্যাটাগরির ছবি আপলোড করা যায়নি।');
    return;
  }
  const { data } = supabaseClient.storage.from('products').getPublicUrl(filePath);
  newCategoryImageUrl = data.publicUrl;
  categoryImgPreview.src = newCategoryImageUrl;
  categoryImgPreview.style.display = 'block';
  categoryImgPlaceholder.style.display = 'none';
});

document.getElementById('addCategoryBtn').addEventListener('click', async () => {
  const input = document.getElementById('newCategoryInput');
  const errEl = document.getElementById('categoryError');
  const name = input.value.trim();
  errEl.style.display = 'none';
  if (!name) return;

  const { error } = await supabaseClient.from('categories').insert({ name, image_url: newCategoryImageUrl });
  if (error) { errEl.style.display = 'block'; console.error(error); return; }

  input.value = '';
  newCategoryImageUrl = null;
  categoryImgPreview.style.display = 'none';
  categoryImgPreview.src = '';
  categoryImgPlaceholder.style.display = 'block';
  categoryImgPlaceholder.textContent = '+';
  categoryImgInput.value = '';
  loadCategories();
});

async function deleteCategory(id) {
  if (!confirm('এই ক্যাটাগরিটি ডিলিট করতে চান? এই ক্যাটাগরির প্রোডাক্টগুলো "ক্যাটাগরিহীন" হয়ে যাবে।')) return;
  const { error } = await supabaseClient.from('categories').delete().eq('id', id);
  if (error) { alert('ডিলিট করা যায়নি।'); console.error(error); return; }
  loadCategories();
  loadProducts();
}

// ================= কালার ট্যাগ =================
function renderColorChips() {
  const wrap = document.getElementById('colorChips');
  wrap.innerHTML = colorsArray.map((c, i) => `
    <div class="chip"><span>${escapeHtml(c)}</span><button data-i="${i}">×</button></div>
  `).join('');
  wrap.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => { colorsArray.splice(Number(btn.dataset.i), 1); renderColorChips(); });
  });
}
document.getElementById('colorInputField').addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ',') {
    e.preventDefault();
    const val = e.target.value.trim().replace(/,$/, '');
    if (val && !colorsArray.includes(val)) { colorsArray.push(val); renderColorChips(); }
    e.target.value = '';
  }
});

// ================= ব্লাউজ টগল =================
const pHasBlouse = document.getElementById('pHasBlouse');
const blousePriceFields = document.getElementById('blousePriceFields');
pHasBlouse.addEventListener('change', () => { blousePriceFields.classList.toggle('open', pHasBlouse.checked); });

// ================= প্রোডাক্ট ফর্ম ফিল্ড =================
const pName = document.getElementById('pName');
const pPrice = document.getElementById('pPrice');
const pOfferPrice = document.getElementById('pOfferPrice');
const pStock = document.getElementById('pStock');
const pPriceWithBlouse = document.getElementById('pPriceWithBlouse');
const pPriceWithoutBlouse = document.getElementById('pPriceWithoutBlouse');
const pCategory = document.getElementById('pCategory');
const pDesc = document.getElementById('pDesc');
const pPromoAllowed = document.getElementById('pPromoAllowed');
const editId = document.getElementById('editId');
const formTitle = document.getElementById('formTitle');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const formError = document.getElementById('formError');

function resetForm() {
  editId.value = '';
  pName.value = '';
  pPrice.value = '';
  pOfferPrice.value = '';
  pStock.value = '';
  pHasBlouse.checked = false;
  blousePriceFields.classList.remove('open');
  pPriceWithBlouse.value = '';
  pPriceWithoutBlouse.value = '';
  pCategory.value = '';
  pDesc.value = '';
  pPromoAllowed.checked = true;
  colorsArray = [];
  renderColorChips();
  imagesArray = [];
  renderImagePreviewStrip();
  formTitle.textContent = 'নতুন প্রোডাক্ট যোগ করুন';
  cancelEditBtn.style.display = 'none';
  formError.style.display = 'none';
}
cancelEditBtn.addEventListener('click', resetForm);

// ================= মাল্টি ইমেজ আপলোড =================
const imageDropzone = document.getElementById('imageDropzone');
const imageFileInput = document.getElementById('imageFileInput');
const dropzoneText = document.getElementById('dropzoneText');
const imageError = document.getElementById('imageError');

imageDropzone.addEventListener('click', () => imageFileInput.click());
imageDropzone.addEventListener('dragover', (e) => { e.preventDefault(); imageDropzone.classList.add('drag-over'); });
imageDropzone.addEventListener('dragleave', () => imageDropzone.classList.remove('drag-over'));
imageDropzone.addEventListener('drop', (e) => {
  e.preventDefault();
  imageDropzone.classList.remove('drag-over');
  if (e.dataTransfer.files && e.dataTransfer.files.length) handleImageFiles(e.dataTransfer.files);
});
imageFileInput.addEventListener('change', () => {
  if (imageFileInput.files && imageFileInput.files.length) handleImageFiles(imageFileInput.files);
  imageFileInput.value = '';
});

async function handleImageFiles(fileList) {
  imageError.style.display = 'none';
  const files = Array.from(fileList).filter(f => f.type.startsWith('image/'));
  if (!files.length) {
    imageError.textContent = 'শুধুমাত্র ছবি ফাইল (jpg, png ইত্যাদি) দেওয়া যাবে।';
    imageError.style.display = 'block';
    return;
  }
  dropzoneText.textContent = `আপলোড হচ্ছে (0/${files.length})...`;
  dropzoneText.classList.add('uploading');

  let done = 0;
  for (const file of files) {
    const safeName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
    const filePath = `${Date.now()}_${Math.random().toString(36).slice(2,7)}_${safeName}`;
    const { error: uploadError } = await supabaseClient.storage.from('products').upload(filePath, file, { cacheControl: '3600', upsert: false });
    if (uploadError) { console.error(uploadError); continue; }
    const { data } = supabaseClient.storage.from('products').getPublicUrl(filePath);
    imagesArray.push(data.publicUrl);
    done++;
    dropzoneText.textContent = `আপলোড হচ্ছে (${done}/${files.length})...`;
  }
  dropzoneText.textContent = 'ছবি এখানে ড্র্যাগ করুন, অথবা ক্লিক করে একাধিক ছবি বেছে নিন';
  dropzoneText.classList.remove('uploading');
  renderImagePreviewStrip();
}

function renderImagePreviewStrip() {
  const strip = document.getElementById('imagePreviewStrip');
  strip.innerHTML = imagesArray.map((url, i) => `
    <div class="img-thumb">
      ${i === 0 ? '<span class="thumb-badge">থাম্বনেইল</span>' : `<button class="set-thumb-btn" data-i="${i}">থাম্বনেইল করুন</button>`}
      <img src="${url}" alt="">
      <button class="thumb-remove" data-i="${i}">×</button>
    </div>
  `).join('');
  strip.querySelectorAll('.thumb-remove').forEach(btn => {
    btn.addEventListener('click', () => { imagesArray.splice(Number(btn.dataset.i), 1); renderImagePreviewStrip(); });
  });
  strip.querySelectorAll('.set-thumb-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const i = Number(btn.dataset.i);
      const [moved] = imagesArray.splice(i, 1);
      imagesArray.unshift(moved);
      renderImagePreviewStrip();
    });
  });
}

// ================= সেভ =================
document.getElementById('saveBtn').addEventListener('click', async () => {
  const name = pName.value.trim();
  const price = Number(pPrice.value);
  if (!name || !price) {
    formError.textContent = 'নাম ও সাধারণ দাম দেওয়া আবশ্যক';
    formError.style.display = 'block';
    return;
  }
  formError.style.display = 'none';

  const payload = {
    name: name,
    price: price,
    offer_price: pOfferPrice.value ? Number(pOfferPrice.value) : null,
    stock: pStock.value ? Number(pStock.value) : 0,
    has_blouse_option: pHasBlouse.checked,
    price_with_blouse: pHasBlouse.checked && pPriceWithBlouse.value ? Number(pPriceWithBlouse.value) : null,
    price_without_blouse: pHasBlouse.checked && pPriceWithoutBlouse.value ? Number(pPriceWithoutBlouse.value) : null,
    category_id: pCategory.value || null,
    image_url: imagesArray[0] || null,
    images: imagesArray,
    colors: colorsArray,
    description: pDesc.value.trim() || null,
    promo_allowed: pPromoAllowed.checked
  };

  const saveBtn = document.getElementById('saveBtn');
  saveBtn.disabled = true;
  saveBtn.textContent = 'সেভ হচ্ছে...';

  let error;
  if (editId.value) {
    ({ error } = await supabaseClient.from('products').update(payload).eq('id', editId.value));
  } else {
    ({ error } = await supabaseClient.from('products').insert(payload));
  }
  saveBtn.disabled = false;
  saveBtn.textContent = 'প্রোডাক্ট সেভ করুন';

  if (error) {
    formError.textContent = 'সেভ করা যায়নি। আবার চেষ্টা করুন।';
    formError.style.display = 'block';
    console.error(error);
    return;
  }
  resetForm();
  loadProducts();
});

// ================= প্রোডাক্ট লিস্ট =================
async function loadProducts() {
  const listEl = document.getElementById('productList');
  const { data, error } = await supabaseClient.from('products').select('*').order('created_at', { ascending: false });
  if (error) { listEl.innerHTML = `<div class="admin-empty">প্রোডাক্ট লোড করা যায়নি।</div>`; console.error(error); return; }
  if (!data || data.length === 0) { listEl.innerHTML = `<div class="admin-empty">এখনো কোনো প্রোডাক্ট যোগ করা হয়নি।</div>`; return; }

  const catMap = {};
  categoriesList.forEach(c => catMap[c.id] = c.name);

  listEl.innerHTML = data.map(p => {
    const imgCount = (p.images && p.images.length) || (p.image_url ? 1 : 0);
    const priceHtml = p.offer_price
      ? `<span class="old-price">৳${Number(p.price).toLocaleString('en-BD')}</span><span class="offer-price">৳${Number(p.offer_price).toLocaleString('en-BD')}</span>`
      : `৳${Number(p.price).toLocaleString('en-BD')}`;
    return `
    <div class="product-row">
      <div class="thumb-wrap">
        <img src="${p.image_url || 'assets/logo.png'}" alt="${escapeHtml(p.name)}">
        ${imgCount > 1 ? `<span class="img-count-badge">+${imgCount - 1}</span>` : ''}
      </div>
      <div class="info">
        ${p.category_id && catMap[p.category_id] ? `<div class="cat-tag">${escapeHtml(catMap[p.category_id])}</div>` : ''}
        <h4>${escapeHtml(p.name)}</h4>
        <div class="meta">${priceHtml}</div>
      </div>
      <span class="promo-tag ${p.promo_allowed ? '' : 'off'}">${p.promo_allowed ? 'প্রোমো চালু' : 'প্রোমো বন্ধ'}</span>
      <div class="row-actions">
        <button class="edit-btn" onclick='editProduct(${JSON.stringify(p).replace(/'/g, "&apos;")})'>এডিট</button>
        <button class="delete-btn" data-id="${p.id}">ডিলিট</button>
      </div>
    </div>
  `; }).join('');

  listEl.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', () => deleteProduct(btn.dataset.id));
  });
}

function editProduct(p) {
  editId.value = p.id;
  pName.value = p.name;
  pPrice.value = p.price;
  pOfferPrice.value = p.offer_price || '';
  pStock.value = p.stock ?? 0;
  pHasBlouse.checked = !!p.has_blouse_option;
  blousePriceFields.classList.toggle('open', !!p.has_blouse_option);
  pPriceWithBlouse.value = p.price_with_blouse || '';
  pPriceWithoutBlouse.value = p.price_without_blouse || '';
  pCategory.value = p.category_id || '';
  pDesc.value = p.description || '';
  pPromoAllowed.checked = !!p.promo_allowed;
  colorsArray = Array.isArray(p.colors) ? [...p.colors] : [];
  renderColorChips();
  imagesArray = Array.isArray(p.images) && p.images.length ? [...p.images] : (p.image_url ? [p.image_url] : []);
  renderImagePreviewStrip();
  formTitle.textContent = 'প্রোডাক্ট এডিট করুন';
  cancelEditBtn.style.display = 'inline-block';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function deleteProduct(id) {
  if (!confirm('এই প্রোডাক্টটি ডিলিট করতে চান?')) return;
  const { error } = await supabaseClient.from('products').delete().eq('id', id);
  if (error) { alert('ডিলিট করা যায়নি।'); console.error(error); return; }
  loadProducts();
}

function escapeHtml(str) {
  const d = document.createElement('div');
  d.textContent = str || '';
  return d.innerHTML;
}

checkSession();
