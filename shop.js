async function loadShopItems() {
  const response = await fetch('data/products.json');
  const products = await response.json();
  const tbody = document.querySelector('#shop-table tbody');
  const searchInput = document.getElementById('shop-search');

  function renderRows(list) {
    tbody.innerHTML = '';
    list.forEach((item) => {
      const row = document.createElement('tr');
      row.innerHTML = `<td>${item.name}</td><td>${item.category}</td><td>$${item.price}</td>`;
      tbody.appendChild(row);
    });
  }

  renderRows(products);

  searchInput.addEventListener('input', () => {
    const term = searchInput.value.toLowerCase().trim();
    const filtered = products.filter((item) => `${item.name} ${item.category}`.toLowerCase().includes(term));
    renderRows(filtered);
  });
}

loadShopItems();
