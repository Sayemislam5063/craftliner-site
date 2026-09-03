// Global Selected Files Array
window.selectedFiles = [];

document.addEventListener('DOMContentLoaded', () => {
  loadCategoriesSelect();
  setupCategoryForm();
  setupDragAndDrop();
  setupProductForm();
});

// ---------- ১. ক্যাটাগরি লোড করা ----------
async function loadCategoriesSelect() {
  const selectEl = document.getElementById('prodCategory');
  const adminListEl = document.getElementById('categoryAdminList');

  try {
    const { data: categories, error } = await supabaseClient
      .from('categories')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // ড্রপডাউন অপশন
    if (selectEl) {
      if (!categories || categories.length === 0) {
        selectEl.innerHTML = '<option value="">কোনো ক্যাটাগরি পাওয়া যায়নি</option>';
      } else {
        selectEl.innerHTML = categories.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
      }
    }

    // বিদ্যমান ক্যাটাগরি লিস্ট
    if (adminListEl) {
      if (!categories || categories.length === 0) {
        adminListEl.innerHTML = '<p style="color:#888; font-size:14px;">এখনও কোনো ক্যাটাগরি যোগ করা হয়নি।</p>';
      } else {
        adminListEl.innerHTML = categories.map(c => `
          <div style="display: flex; align-items: center; gap: 8px; background: #f3f3f3; padding: 6px 12px; border-radius: 20px; border: 1px solid #ddd;">
            <img src="${c.image_url}" alt="${c.name}" style="width: 30px; height: 30px; border-radius: 50%; object-fit: cover;">
            <span style="font-weight: 600; font-size: 13px; color: #333;">${c.name}</span>
            <button onclick="deleteCategory(${c.id})" type="button" style="background: #ff4d4d; color: white; border: none; border-radius: 50%; width: 20px; height: 20px; cursor: pointer; font-size: 11px; margin-left: 5px;">✕</button>
          </div>
        `).join('');
      }
    }
  } catch (err) {
    console.error('Category error:', err);
    if (adminListEl) {
      adminListEl.innerHTML = `<p style="color:red; font-size:12px;">ক্যাটাগরি লোড হতে সমস্যা হয়েছে (Supabase Table তৈরি আছে তো?)</p>`;
    }
  }
}

// ---------- ২. ক্যাটাগরি সেভ লজিক ----------
function setupCategoryForm() {
  const catForm = document.getElementById('categoryForm');
  if (!catForm) return;

  catForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const saveCatBtn = document.getElementById('saveCatBtn');
    const catName = document.getElementById('catName').value.trim();
    const catImgInput = document.getElementById('catImage');
    const catImgFile = catImgInput.files[0];

    if (!catName || !catImgFile) return alert('ক্যাটাগরির নাম এবং ছবি দুটোই দিন');

    saveCatBtn.disabled = true;
    saveCatBtn.innerText = 'সেভ হচ্ছে...';

    try {
      const fileName = `cat_${Date.now()}_${catImgFile.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
      
      // Upload Image to Supabase Storage
      const { error: upErr } = await supabaseClient.storage.from('products').upload(fileName, catImgFile);
      if (upErr) throw upErr;

      const { data: urlData } = supabaseClient.storage.from('products').getPublicUrl(fileName);

      // Save to categories Table
      const { error: dbErr } = await supabaseClient.from('categories').insert([
        { name: catName, image_url: urlData.publicUrl }
      ]);
      if (dbErr) throw dbErr;

      alert('ক্যাটাগরি সফলভাবে যোগ হয়েছে!');
      catForm.reset();
      loadCategoriesSelect();

    } catch (err) {
      alert('ত্রুটি: ' + err.message);
    } finally {
      saveCatBtn.disabled = false;
      saveCatBtn.innerText = 'ক্যাটাগরি সেভ করুন';
    }
  });
}

// ক্যাটাগরি ডিলিট
async function deleteCategory(id) {
  if (!confirm('আপনি কি এই ক্যাটাগরি ডিলিট করতে চান?')) return;
  const { error } = await supabaseClient.from('categories').delete().eq('id', id);
  if (error) {
    alert('ডিলিট করা যায়নি: ' + error.message);
  } else {
    loadCategoriesSelect();
  }
}

// ---------- ৩. Drag & Drop ফাইল আপলোড ----------
function setupDragAndDrop() {
  const dropZone = document.getElementById('dropZone');
  const fileInput = document.getElementById('prodImages');

  if (!dropZone || !fileInput) return;

  dropZone.onclick = () => fileInput.click();

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
    window.selectedFiles.push(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = document.createElement('img');
      img.src = e.target.result;
      img.style.cssText = 'width:70px; height:70px; object-fit:cover; border-radius:6px; border:2px solid #5c061c;';
      if (preview) preview.appendChild(img);
    };
    reader.readAsDataURL(file);
  }
}

// ---------- ৪. প্রোডাক্ট সেভ লজিক ----------
function setupProductForm() {
  const productForm = document.getElementById('productForm');
  if (!productForm) return;

  productForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const saveBtn = document.getElementById('saveBtn');
    const formError = document.getElementById('formError');

    if (!window.selectedFiles || window.selectedFiles.length === 0) {
      alert('কমপক্ষে ১টি প্রোডাক্টের ছবি সিলেক্ট করুন');
      return;
    }

    saveBtn.disabled = true;
    saveBtn.innerText = 'আপলোড হচ্ছে...';

    try {
      let uploadedUrls = [];
      for (let file of window.selectedFiles) {
        const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
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
