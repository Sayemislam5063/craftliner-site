const categoriesGrid = document.getElementById('categoriesGrid');

let allCategories = [];

async function loadCategories() {
  if (!categoriesGrid) return;

  categoriesGrid.innerHTML = `
    <div class="empty-state">
      ক্যাটাগরি লোড হচ্ছে...
    </div>
  `;

  const { data, error } = await supabaseClient
    .from('categories')
    .select('*')
    .order('name');

  if (error) {
    console.error('Categories load failed:', error);

    categoriesGrid.innerHTML = `
      <div class="empty-state">
        ক্যাটাগরি লোড করা যায়নি।
      </div>
    `;

    return;
  }

  allCategories = data || [];

  if (!allCategories.length) {
    categoriesGrid.innerHTML = `
      <div class="empty-state">
        এখনো কোনো ক্যাটাগরি তৈরি করা হয়নি।
      </div>
    `;

    return;
  }

  categoriesGrid.innerHTML = allCategories.map(category => `
    <button
      type="button"
      class="category-page-card"
      data-category="${category.id}"
    >

      <div class="category-page-image">

        ${
          category.image_url
            ? `
              <img
                src="${category.image_url}"
                alt="${escapeHtml(category.name)}"
              >
            `
            : `
              <div class="category-page-placeholder">
                ${escapeHtml((category.name || '?')[0])}
              </div>
            `
        }

      </div>

      <div class="category-page-info">
        <h2>${escapeHtml(category.name)}</h2>
        <span>এই ক্যাটাগরি দেখুন →</span>
      </div>

    </button>
  `).join('');

  categoriesGrid
    .querySelectorAll('.category-page-card')
    .forEach(card => {

      card.addEventListener('click', () => {

        const categoryId = card.dataset.category;

        window.location.href =
          `category.html?id=${categoryId}`;

      });

    });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

loadCategories();
