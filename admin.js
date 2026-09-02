const loginScreen = document.getElementById('loginScreen');
const adminPanel = document.getElementById('adminPanel');

// ---------- Session check ----------
async function checkSession() {
  const { data } = await supabaseClient.auth.getSession();
  if (data.session) {
    showAdmin();
  } else {
    showLogin();
  }
}

function showLogin() {
  loginScreen.style.display = 'flex';
  adminPanel.style.display = 'none';
}

function showAdmin() {
  loginScreen.style.display = 'none';
  adminPanel.style.display = 'block';
  loadProducts();
}

// ---------- Login ----------
document.getElementById('loginBtn').addEventListener('click', async () => {
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const errEl = document.getElementById('loginError');
  errEl.style.display = 'none';

  const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) {
    errEl.style.display = 'block';
    return;
  }
  showAdmin();
});

document.getElementById('logoutBtn').addEventListener('click', async () => {
  await supabaseClient.auth.signOut();
  showLogin();
});

// ---------- Product form ----------
const pName = document.getElementById('pName');
const pPrice = document.getElementById('pPrice');
const pImage = document.getElementById('pImage');
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
  pImage.value = '';
  pDesc.value = '';
  pPromoAllowed.checked = true;
  formTitle.textContent = 'নতুন প্রোডাক্ট যোগ করুন';
  cancelEditBtn.style.display = 'none';
  formError.style.display = 'none';
}

cancelEditBtn.addEventListener('click', resetForm);

document.getElementById('saveBtn').addEventListener('click', async () => {
  const name = pName.value.trim();
  const price = Number(pPrice.value);

  if (!name || !price) {
    formError.textContent = 'নাম ও দাম দেওয়া আবশ্যক';
    formError.style.display = 'block';
    return;
  }

  const payload = {
    name: name,
    price: price,
    image_url: pImage.value.trim() || null,
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

// ---------- Product list ----------
async function loadProducts() {
  const listEl = document.getElementById('productList');
  const { data, error } = await supabaseClient
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    listEl.innerHTML = `<div class="admin-empty">প্রোডাক্ট লোড করা যায়নি।</div>`;
    console.error(error);
    return;
  }

  if (!data || data.length === 0) {
    listEl.innerHTML = `<div class="admin-empty">এখনো কোনো প্রোডাক্ট যোগ করা হয়নি।</div>`;
    return;
  }

  listEl.innerHTML = data.map(p => `
    <div class="product-row">
      <img src="${p.image_url || 'assets/logo.png'}" alt="${escapeHtml(p.name)}">
      <div class="info">
        <h4>${escapeHtml(p.name)}</h4>
        <div class="meta">৳${Number(p.price).toLocaleString('en-BD')}</div>
      </div>
      <span class="promo-tag ${p.promo_allowed ? '' : 'off'}">${p.promo_allowed ? 'প্রোমো চালু' : 'প্রোমো বন্ধ'}</span>
      <div class="row-actions">
        <button class="edit-btn" onclick='editProduct(${JSON.stringify(p).replace(/'/g, "&apos;")})'>এডিট</button>
        <button class="delete-btn" data-id="${p.id}">ডিলিট</button>
      </div>
    </div>
  `).join('');

  listEl.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', () => deleteProduct(btn.dataset.id));
  });
}

function editProduct(p) {
  editId.value = p.id;
  pName.value = p.name;
  pPrice.value = p.price;
  pImage.value = p.image_url || '';
  pDesc.value = p.description || '';
  pPromoAllowed.checked = !!p.promo_allowed;
  formTitle.textContent = 'প্রোডাক্ট এডিট করুন';
  cancelEditBtn.style.display = 'inline-block';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function deleteProduct(id) {
  if (!confirm('এই প্রোডাক্টটি ডিলিট করতে চান?')) return;
  const { error } = await supabaseClient.from('products').delete().eq('id', id);
  if (error) {
    alert('ডিলিট করা যায়নি।');
    console.error(error);
    return;
  }
  loadProducts();
}

function escapeHtml(str) {
  const d = document.createElement('div');
  d.textContent = str || '';
  return d.innerHTML;
}

checkSession();
