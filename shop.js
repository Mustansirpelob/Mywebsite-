async function loadShopItems() {
  const response = await fetch('data/products.json');
  const products = await response.json();
  const tbody = document.querySelector('#shop-table tbody');

  products.forEach((item) => {
    const row = document.createElement('tr');
    row.innerHTML = `<td>${item.name}</td><td>${item.category}</td><td>$${item.price}</td>`;
    tbody.appendChild(row);
  });
}

loadShopItems();
