const cartKey = 'zenithCart';

function getCart() {
  try {
    return JSON.parse(localStorage.getItem(cartKey)) || [];
  } catch {
    return [];
  }
}

function setCart(items) {
  localStorage.setItem(cartKey, JSON.stringify(items));
}

function renderCart() {
  const cartList = document.getElementById('cart-list');
  const cartTotal = document.getElementById('cart-total');
  const items = getCart();
  const total = items.reduce((sum, item) => sum + Number(item.price), 0);

  cartList.innerHTML = items.length
    ? items.map((item) => `<li>${item.name} — $${Number(item.price).toFixed(2)}</li>`).join('')
    : '<li>No items yet. Add products from the table above.</li>';

  cartTotal.textContent = `Total: $${total.toFixed(2)}`;
}

async function loadShopItems() {
  const response = await fetch('data/products.json');
  const products = await response.json();
  const tbody = document.querySelector('#shop-table tbody');
  const searchInput = document.getElementById('shop-search');
  const categorySelect = document.getElementById('shop-category');

  const categories = [...new Set(products.map((item) => item.category))];
  categories.forEach((category) => {
    const option = document.createElement('option');
    option.value = category;
    option.textContent = category;
    categorySelect.appendChild(option);
  });

  function addToCart(item) {
    const cart = getCart();
    cart.push(item);
    setCart(cart);
    renderCart();
  }

  function renderRows(list) {
    tbody.innerHTML = '';

    list.forEach((item) => {
      const row = document.createElement('tr');
      row.innerHTML = `<td>${item.name}</td><td>${item.category}</td><td>$${Number(item.price).toFixed(2)}</td><td><button class="mini-button" data-id="${item.id}">Add</button></td>`;
      tbody.appendChild(row);
    });

    tbody.querySelectorAll('button[data-id]').forEach((button) => {
      button.addEventListener('click', () => {
        const selected = products.find((item) => String(item.id) === button.dataset.id);
        if (selected) addToCart(selected);
      });
    });
  }

  function applyFilters() {
    const term = searchInput.value.toLowerCase().trim();
    const category = categorySelect.value;
    const filtered = products.filter((item) => {
      const matchesTerm = `${item.name} ${item.category}`.toLowerCase().includes(term);
      const matchesCategory = category === 'all' || item.category === category;
      return matchesTerm && matchesCategory;
    });
    renderRows(filtered);
  }

  renderRows(products);
  renderCart();

  searchInput.addEventListener('input', applyFilters);
  categorySelect.addEventListener('change', applyFilters);
}

loadShopItems();
