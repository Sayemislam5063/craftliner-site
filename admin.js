let selectedFiles = [];

// DOM লোড হওয়ার পর স্ক্রিপ্ট কাজ শুরু করবে
document.addEventListener('DOMContentLoaded', () => {
  loadCategoriesSelect();
  setupCategoryForm();
  setupDragAndDrop();
  setupProductForm();
});

// ---------- ১. ডাইনামিক ক্যাটাগরি ড্রপডাউন ও লিস্ট লোড করা ----------
async function loadCategoriesSelect() {
  const selectEl = document.getElementById('prodCategory');
  const adminListEl = document.getElementById('categoryAdminList');

  const { data: categories, error } = await supabaseClient
    .from('categories')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Category Fetch Error:', error);
    if (selectEl) selectEl.innerHTML = '<option value="">ক্যাটাগরি পাওয়া যায়নি</option>';
    return;
  }

  // ড্রপডাউন আপডেট
  if (selectEl) {
    if (categories.length === 0) {
      selectEl.innerHTML = '<option value="">কোনো ক্যাটাগরি তৈরি করা নেই</option>';
    } else {
      selectEl.innerHTML = categories.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
    }
  }

  // অ্যাডমিন প্যানেলে ক্যাটাগরি ছবিসহ লিস্ট দেখানো
  if (adminListEl) {
    if (categories.length === 0) {
      adminListEl.innerHTML = '<p style="color:#777;">এখনও কোনো ক্যাটাগরি যোগ করা হয়নি।</p>';
    } else {
      adminListEl.innerHTML = categories.map(c => `
        <div style="display: flex; align-items: center; gap: 10px; background: #f9f9f9; padding: 8px 12px; border-radius: 30px; border: 1px solid #ddd;">
          <img src="${c.image_url}" alt="${c.name}" style="width: 35px; height: 35px; border-radius: 50%; object-fit: cover;">
          <span style="font-weight: 600; font-size: 14px;">${c.name}</span>
          <button onclick="deleteCategory(${c.id})" style="background: #ff4d4d; color: white; border: none; border-radius: 50%; width: 22px; height: 22px; cursor: pointer; font-size: 12px; line-height: 1;">✕</button>
        </div>
      `).join('');
    }
  }
}

// ---------- ২. ক্যাটাগরি তৈরি করার লজিক ----------
function setupCategoryForm() {
  const catForm = document.getElementById('categoryForm');
  if (!catForm) return;

  catForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const saveCatBtn = document.getElementById('saveCatBtn');
    const catName = document.getElementById('catName').value.trim();
    const catImgFile = document.getElementById('catImage').files[0];

    if (!catName || !catImgFile) return alert('ক্যাটাগরি নাম ও ছবি দুটোই দিন');

    saveCatBtn.disabled = true;
    saveCatBtn.innerText = 'সেভ হচ্ছে...';

    try {
      // ছবি স্টোরেজে আপলোড
      const fileName = `cat_${Date.now()}_${catImgFile.name.replace(/\s+/g, '_')}`;
      const { error: upErr } = await supabaseClient.storage.from('products').upload(fileName, catImgFile);
      if (upErr) throw upErr;

      const { data: urlData } = supabaseClient.storage.from('products').getPublicUrl(fileName);

      // ডাটাবেজে সেভ
      const { error: dbErr } = await supabaseClient.from('categories').insert([
        { name: catName, image_url: urlData.publicUrl }
      ]);
      if (dbErr) throw dbErr;

      alert('নতুন ক্যাটাগরি সফলভাবে তৈরি হয়েছে!');
      document.getElementById('catName').value = '';
      document.getElementById('catImage').value = '';
      loadCategoriesSelect(); // লিস্ট রিফ্রেশ

    } catch (err) {
      alert('ক্যাটাগরি সেভ করতে সমস্যা হয়েছে: ' + err.message);
    } finally {
      saveCatBtn.disabled = false;
      saveCatBtn.innerText = 'ক্যাটাগরি সেভ করুন';
    }
  });
}

// ক্যাটাগরি ডিলিট করার ফাংশন
async function deleteCategory(id) {
  if (!confirm('আপনি কি এই ক্যাটাগরি ডিলিট করতে চান?')) return;
  const { error } = await supabaseClient.from('categories').delete().eq('id', id);
  if (error) {
    alert('ডিলিট করা যায়নি: ' + error.message);
  } else {
    loadCategoriesSelect();
  }
}

// ---------- ৩. Drag & Drop এবং ফাইল সিলেক্ট লজিক ----------
function setupDragAndDrop() {
  const dropZone = document.getElementById('dropZone');
  const fileInput = document.getElementById('prodImages');

  if (!dropZone || !fileInput) return;

  // ক্লিক করলে ফাইল ম্যানেজার খুলবে
  dropZone.onclick = (e) => {
    if (e.target !== fileInput) {
      fileInput.click();
    }
  };

  dropZone.ondragover = (e) => {
    e.preventDefault();
    dropZone.style.background = '#f5eae1';
  };

  dropZone.ondragleave = () => {
    dropZone.style.background = '#fffaf7';
  };

  dropZone.ondrop = (e) => {
    e.preventDefault();
    dropZone.style.background = '#fffaf7';
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  fileInput.onchange = (e) => {
    if (e.target.files) handleFiles(e.target.files);
  };
}

function handleFiles(files) {
  const preview = document.getElementById('imagePreview');
  for (let file of files) {
    selectedFiles.push(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = document.createElement('img');
      img.src = e.target.result;
      img.style.cssText = 'width:75px; height:75px; object-fit:cover; border-radius:6px; border:2px solid #5c061c;';
      if (preview) preview.appendChild(img);
    };
    reader.readAsDataURL(file);
  }
}

// ---------- ৪. প্রোডাক্ট সেভ করার লজিক ----------
function setupProductForm() {
  const productForm = document.getElementById('productForm');
  if (!productForm) return;

  productForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const saveBtn = document.getElementById('saveBtn');
    const formError = document.getElementById('formError');

    if (selectedFiles.length === 0) {
      alert('কমপক্ষে ১টি প্রোডাক্টের ছবি সিলেক্ট করুন');
      return;
    }

    saveBtn.disabled = true;
    saveBtn.innerText = 'আপলোড হচ্ছে...';

    try {
      let uploadedUrls = [];
      for (let file of selectedFiles) {
        const fileName = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
        const { error: upErr } = await supabaseClient.storage.from('products').upload(fileName, file);
        if (upErr) throw upErr;

        const { data: urlData } = supabaseClient.storage.from('products').getPublicUrl(fileName);
        uploadedUrls.push(urlData.publicUrl);
      }

      const colorsArr = document.getElementById('prodColors').value
        ? document.getElementById('prodColors').value.split(',').map(s => s.trim())
        : [];

      const regPrice = Number(document.getElementById('prodRegPrice').value);
      const offerPrice = Number(document.getElementById('prodOfferPrice').value) || regPrice;

      const payload = {
        name: document.getElementById('prodName').value.trim(),
        category: document.getElementById('prodCategory').value,
        regular_price: regPrice,
        offer_price: offerPrice,
        price: offerPrice,
        promo_allowed: document.getElementById('pPromoAllowed').value === 'true',
        price_with_blouse: Number(document.getElementById('priceWithBlouse').value) || null,
        price_without_blouse: Number(document.getElementById('priceWithoutBlouse').value) || null,
        colors: colorsArr,
        description: document.getElementById('prodDesc').value.trim(),
        image_urls: uploadedUrls,
        image_url: uploadedUrls[0]
      };

      const { error: dbErr } = await supabaseClient.from('products').insert([payload]);
      if (dbErr) throw dbErr;

      alert('প্রোডাক্ট সফলভাবে যুক্ত করা হয়েছে!');
      window.location.reload();

    } catch (err) {
      if (formError) {
        formError.textContent = 'ত্রুটি: ' + err.message;
        formError.style.display = 'block';
      }
      alert('ত্রুটি হয়েছে: ' + err.message);
      saveBtn.disabled = false;
      saveBtn.innerText = 'প্রোডাক্ট সেভ করুন';
    }
  });
}
