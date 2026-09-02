const loginScreen = document.getElementById('loginScreen');
const adminPanel = document.getElementById('adminPanel');

// ---------- Session check ----------
async function checkSession() {
  const { data } = await supabaseClient.auth.getSession();
  if (data && data.session) {
    showAdmin();
  } else {
    showLogin();
  }
}

function showLogin() {
  if (loginScreen) loginScreen.style.display = 'flex';
  if (adminPanel) adminPanel.style.display = 'none';
}

function showAdmin() {
  if (loginScreen) loginScreen.style.display = 'none';
  if (adminPanel) adminPanel.style.display = 'block';
  loadProducts();
}

// ---------- Login / Logout ----------
const loginBtn = document.getElementById('loginBtn');
if (loginBtn) {
  loginBtn.addEventListener('click', async () => {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const errEl = document.getElementById('loginError');
    if (errEl) errEl.style.display = 'none';

    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) {
      if (errEl) errEl.style.display = 'block';
      return;
    }
    showAdmin();
  });
}

const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', async () => {
    await supabaseClient.auth.signOut();
    showLogin();
  });
}

// ---------- Drag & Drop File Upload Handling ----------
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('prodImages');
const preview = document.getElementById('imagePreview');
let selectedFiles = [];

if (dropZone && fileInput) {
  dropZone.addEventListener('click', () => fileInput.click());

  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.style.background = '#f0e6d2';
  });

  dropZone.addEventListener('dragleave', () => {
    dropZone.style.background = '#fffaf0';
  });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.style.background = '#fffaf0';
    handleFiles(e.dataTransfer.files);
  });

  fileInput.addEventListener('change', (e) => {
    handleFiles(e.target.files);
  });
}

function handleFiles(files) {
  for (let file of files) {
    selectedFiles.push(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = document.createElement('img');
      img.src = e.target.result;
      img.style.width = '70px';
      img.style.height = '70px';
      img.style.objectFit = 'cover';
      img.style.borderRadius = '5px';
      img.style.border = '1px solid #800020';
      if (preview) preview.appendChild(img);
    };
    reader.readAsDataURL(file);
  }
}

// ---------- Product Form Handling ----------
const editId = document.getElementById('editId');
const formTitle = document.getElementById('formTitle');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const formError = document.getElementById('formError');

function resetForm() {
  if (editId) editId.value = '';
  document.getElementById('prodName').value = '';
  document.getElementById('prodCategory').value = 'আফসান প্রিন্ট';
  document.getElementById('prodRegPrice').value = '';
  document.getElementById('prodOfferPrice').value = '';
  document.getElementById('prodDesc').value = '';
  
  selectedFiles = [];
  if (preview) preview.innerHTML = '';
  
  if (formTitle) formTitle.textContent = 'নতুন প্রোডাক্ট যোগ করুন';
  if (cancelEditBtn) cancelEditBtn.style.display = 'none';
  if (formError) formError.style.display = 'none';
}

if (cancelEditBtn) {
  cancelEditBtn.addEventListener('click', resetForm);
}

const saveBtn = document.getElementById('saveBtn');
if (saveBtn) {
  saveBtn.addEventListener('click', async (e) => {
    e.preventDefault();

    const name = document.getElementById('prodName').value.trim();
    const category = document.getElementById('prodCategory').value;
    const regPrice = Number(document.getElementById('prodRegPrice').value);
    const offerPrice = Number(document.getElementById('prodOfferPrice').value) || regPrice;
    const desc = document.getElementById('prodDesc').value.trim();

    if (!name || !regPrice) {
      if (formError) {
        formError.textContent = 'প্রোডাক্টের নাম ও রেগুলার দাম দেওয়া আবশ্যক';
        formError.style.display = 'block';
      }
      return;
    }

    saveBtn.disabled = true;
    saveBtn.textContent = 'সেভ হচ্ছে...';

    try {
      let uploadedUrls = [];

      // নতুন ছবি সিলেক্ট করা থাকলে Supabase Storage-এ আপলোড হবে
      if (selectedFiles.length > 0) {
        for (let file of selectedFiles) {
          const fileName = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
          const { data, error: uploadErr } = await supabaseClient.storage
            .from('products')
            .upload(fileName, file);

          if (uploadErr) throw uploadErr;

          const { data: urlData } = supabaseClient.storage
            .from('products')
            .getPublicUrl(fileName);

          uploadedUrls.push(urlData.publicUrl);
        }
      }

      const payload = {
        name: name,
        category: category,
        regular_price: regPrice,
        offer_price: offerPrice,
        price: offerPrice, // আগের ফিল্ড সাপোর্টের জন্য
        description: desc || null
      };

      // যদি নতুন ছবি আপলোড হয় তবেই ছবির লিংক আপডেট হবে
      if (uploadedUrls.length > 0) {
        payload.image_urls = uploadedUrls;
        payload.image_url = uploadedUrls[0];
      }

      let error;
      if (editId && editId.value) {
        ({ error } = await supabaseClient.from('products').update(payload).eq('id', editId.value));
      } else {
        ({ error } = await supabaseClient.from('products').insert([payload]));
      }

      if (error) throw error;

      resetForm();
      loadProducts();

    } catch (err) {
      if (formError) {
        formError.textContent = 'সেভ করা যায়নি: ' + err.message;
        formError.style.display = 'block';
      }
      console.error(err);
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = 'প্রোডাক্ট সেভ করুন';
    }
  });
}

// ---------- Product List ----------
async function loadProducts() {
  const listEl = document.getElementById('productList');
  if (!listEl) return;

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
        <h4>${escapeHtml(p.name)} <span style="font-size:12px; color:#888;">(${escapeHtml(p.category || 'সাধারণ')})</span></h4>
        <div class="meta">
          ${p.regular_price ? `<del style="color:#888; font-size:13px; margin-right:5px;">৳${Number(p.regular_price).toLocaleString('en-BD')}</del>` : ''}
          <b>৳${Number(p.offer_price || p.price || 0).toLocaleString('en-BD')}</b>
        </div>
      </div>
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
  if (editId) editId.value = p.id;
  document.getElementById('prodName').value = p.name || '';
  if (document.getElementById('prodCategory')) document.getElementById('prodCategory').value = p.category || 'আফসান প্রিন্ট';
  if (document.getElementById('prodRegPrice')) document.getElementById('prodRegPrice').value = p.regular_price || p.price || '';
  if (document.getElementById('prodOfferPrice')) document.getElementById('prodOfferPrice').value = p.offer_price || p.price || '';
  document.getElementById('prodDesc').value = p.description || '';
  
  if (formTitle) formTitle.textContent = 'প্রোডাক্ট এডিট করুন';
  if (cancelEditBtn) cancelEditBtn.style.display = 'inline-block';
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
