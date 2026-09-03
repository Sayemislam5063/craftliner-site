// ---------- ১. ডাইনামিক ক্যাটাগরি ড্রপডাউনে লোড করা ----------
async function loadCategoriesSelect() {
  const selectEl = document.getElementById('prodCategory');
  if (!selectEl) return;

  const { data: categories, error } = await supabaseClient.from('categories').select('*').order('name');
  if (error || !categories || categories.length === 0) {
    selectEl.innerHTML = '<option value="">কোনো ক্যাটাগরি পাওয়া যায়নি</option>';
    return;
  }

  selectEl.innerHTML = categories.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
}

// ---------- ২. নতুন ক্যাটাগরি তৈরি করার লজিক ----------
const catForm = document.getElementById('categoryForm');
if (catForm) {
  catForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const saveCatBtn = document.getElementById('saveCatBtn');
    const catName = document.getElementById('catName').value.trim();
    const catImgFile = document.getElementById('catImage').files[0];

    if (!catName || !catImgFile) return alert('ক্যাটাগরি নাম ও ছবি দুটোই দিন');

    saveCatBtn.disabled = true;
    saveCatBtn.innerText = 'সেভ হচ্ছে...';

    try {
      const fileName = `cat_${Date.now()}_${catImgFile.name.replace(/\s+/g, '_')}`;
      const { error: upErr } = await supabaseClient.storage.from('products').upload(fileName, catImgFile);
      if (upErr) throw upErr;

      const { data: urlData } = supabaseClient.storage.from('products').getPublicUrl(fileName);

      const { error: dbErr } = await supabaseClient.from('categories').insert([
        { name: catName, image_url: urlData.publicUrl }
      ]);
      if (dbErr) throw dbErr;

      alert('নতুন ক্যাটাগরি সফলভাবে তৈরি হয়েছে!');
      document.getElementById('catName').value = '';
      document.getElementById('catImage').value = '';
      loadCategoriesSelect(); // নতুন ক্যাটাগরি লিস্টে আপডেট হবে
    } catch (err) {
      alert('ক্যাটাগরি সেভ করতে সমস্যা হয়েছে: ' + err.message);
    } finally {
      saveCatBtn.disabled = false;
      saveCatBtn.innerText = 'ক্যাটাগরি সেভ করুন';
    }
  });
}

// ---------- ৩. Drag & Drop ফাইল আপলোড হ্যান্ডলার ----------
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('prodImages');
const preview = document.getElementById('imagePreview');
let selectedFiles = [];

if (dropZone && fileInput) {
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
  for (let file of files) {
    selectedFiles.push(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = document.createElement('img');
      img.src = e.target.result;
      img.style.cssText = 'width:70px; height:70px; object-fit:cover; border-radius:6px; border:2px solid #5c061c; margin-right:5px; margin-top:5px;';
      if (preview) preview.appendChild(img);
    };
    reader.readAsDataURL(file);
  }
}

// ---------- ৪. প্রোডাক্ট সেভ করার লজিক ----------
const productForm = document.getElementById('productForm');
if (productForm) {
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

// পেজ লোড হলে ক্যাটাগরি লোড হবে
loadCategoriesSelect();
