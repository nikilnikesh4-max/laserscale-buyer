const WHATSAPP = '0705588760';
const CURRENCY = 'LKR';

let products = [];
let categories = [];
let cart = [];
let currentFilter = '';

const grid = document.getElementById('products-grid');
const empty = document.getElementById('empty');
const search = document.getElementById('search');
const searchBtn = document.getElementById('search-btn');
const categoryList = document.getElementById('category-list');
const cartToggle = document.getElementById('cart-toggle');
const cartDrawer = document.getElementById('cart-drawer');
const cartClose = document.getElementById('cart-close');
const overlay = document.getElementById('overlay');
const cartItems = document.getElementById('cart-items');
const cartCount = document.getElementById('cart-count');
const cartTotal = document.getElementById('cart-total');
const drawerTotal = document.getElementById('drawer-total');
const checkoutBtn = document.getElementById('checkout-btn');
const modal = document.getElementById('modal');
const modalClose = document.getElementById('modal-close');

function fmt(num) {
  return new Intl.NumberFormat('en-LK', { style: 'currency', currency: CURRENCY }).format(num || 0);
}

function loadCart() {
  try { cart = JSON.parse(localStorage.getItem('lstCart') || '[]'); } catch { cart = []; }
  updateCartUI();
}

function saveCart() {
  localStorage.setItem('lstCart', JSON.stringify(cart));
  updateCartUI();
}

function updateCartUI() {
  const total = cart.reduce((s, i) => s + (Number(i.price) || 0) * (i.qty || 1), 0);
  const count = cart.reduce((s, i) => s + (i.qty || 1), 0);
  cartCount.textContent = count;
  cartTotal.textContent = fmt(total);
  drawerTotal.textContent = fmt(total);
  renderCartItems();
}

async function loadData() {
  try { products = await fetch('data/products.json?t=' + Date.now()).then(r => r.ok ? r.json() : []); } catch { products = []; }
  try { categories = await fetch('data/categories.json?t=' + Date.now()).then(r => r.ok ? r.json() : []); } catch { categories = []; }
  deriveCategories();
  render();
}

function deriveCategories() {
  const existing = new Set(categories.map(c => typeof c === 'string' ? c : c.name).filter(Boolean));
  products.forEach(p => {
    if (p.category && !existing.has(p.category)) {
      categories.push({ name: p.category, image: p.image });
      existing.add(p.category);
    }
  });
}

function renderCategories() {
  categoryList.innerHTML = '<a href="#" data-cat="" class="active">All</a>';
  categories.forEach(c => {
    const name = typeof c === 'string' ? c : c.name;
    if (!name) return;
    const a = document.createElement('a');
    a.href = '#';
    a.dataset.cat = name;
    a.textContent = name;
    if (name === currentFilter) a.classList.add('active');
    categoryList.appendChild(a);
  });
  categoryList.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      currentFilter = a.dataset.cat;
      render();
    });
  });
}

function render() {
  const term = search.value.toLowerCase().trim();
  const filtered = products.filter(p => {
    const matchesTerm = !term ||
      (p.name || '').toLowerCase().includes(term) ||
      (p.description || '').toLowerCase().includes(term) ||
      (p.sku || '').toLowerCase().includes(term);
    const matchesCat = !currentFilter || (p.category || '') === currentFilter;
    return matchesTerm && matchesCat;
  });

  grid.innerHTML = '';
  empty.style.display = filtered.length ? 'none' : 'block';

  filtered.forEach(p => addProductCard(p));
  renderCategories();
}

function addProductCard(p) {
  const card = document.createElement('div');
  card.className = 'card';
  const badge = p.badge ? `<span class="badge">${p.badge}</span>` : '';
  const image = p.image || 'assets/logo.png';
  card.innerHTML = `
    ${badge}
    <img src="${image}" alt="${p.name}" loading="lazy" />
    <div class="card-body">
      <p class="categories">${p.category || 'Uncategorized'}</p>
      <h3>${p.name}</h3>
      <p class="sku">${p.sku || ''}</p>
      <p class="price">${fmt(p.price)}</p>
      <div class="card-actions">
        <button class="btn add-cart" data-id="${p.id}">Add to Cart</button>
        <a class="btn btn-secondary buy-now" href="${whatsappLink(p)}" target="_blank">Buy Now</a>
      </div>
    </div>
  `;
  card.querySelector('img').addEventListener('click', () => showProduct(p));
  card.querySelector('h3').addEventListener('click', () => showProduct(p));
  card.querySelector('.add-cart').addEventListener('click', e => { e.stopPropagation(); addToCart(p); });
  grid.appendChild(card);
}

function whatsappLink(p) {
  const text = encodeURIComponent(`Hi, I want to buy ${p.name} (SKU: ${p.sku || 'N/A'}). Is it available?`);
  return `https://wa.me/${WHATSAPP}?text=${text}`;
}

function showProduct(p) {
  document.getElementById('modal-img').src = p.image || 'assets/logo.png';
  document.getElementById('modal-title').textContent = p.name;
  document.getElementById('modal-categories').textContent = p.category || 'Uncategorized';
  document.getElementById('modal-sku').textContent = p.sku ? `SKU: ${p.sku}` : '';
  document.getElementById('modal-price').textContent = fmt(p.price);
  document.getElementById('modal-stock').textContent = p.stock != null ? `In stock: ${p.stock}` : '';
  document.getElementById('modal-desc').textContent = p.description || '';
  const badge = document.getElementById('modal-badge');
  badge.textContent = p.badge || '';
  badge.style.display = p.badge ? 'inline-block' : 'none';
  document.getElementById('modal-whatsapp').href = whatsappLink(p);
  document.getElementById('modal-add').onclick = () => { addToCart(p); modal.style.display = 'none'; };
  modal.style.display = 'flex';
}

function addToCart(p) {
  const existing = cart.find(i => i.id === p.id);
  if (existing) existing.qty = (existing.qty || 1) + 1;
  else cart.push({ id: p.id, name: p.name, price: Number(p.price) || 0, image: p.image || 'assets/logo.png', qty: 1 });
  saveCart();
  cartDrawer.classList.add('open');
  overlay.classList.add('show');
}

function renderCartItems() {
  if (!cart.length) {
    cartItems.innerHTML = '<p class="empty">Your cart is empty.</p>';
    return;
  }
  cartItems.innerHTML = '';
  cart.forEach(item => {
    const div = document.createElement('div');
    div.className = 'cart-item';
    div.innerHTML = `
      <img src="${item.image}" alt="" />
      <div class="info">
        <strong>${item.name}</strong>
        <div>${fmt(item.price)}</div>
        <div class="qty-controls">
          <button data-id="${item.id}" data-d="1">-</button>
          <span>${item.qty}</span>
          <button data-id="${item.id}" data-a="1">+</button>
        </div>
      </div>
      <button data-id="${item.id}" data-r="1" style="background:none;border:none;color:#ef4444;font-weight:bold;cursor:pointer">&times;</button>
    `;
    cartItems.appendChild(div);
  });
  cartItems.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const item = cart.find(i => i.id === id);
      if (!item) return;
      if (btn.dataset.d) item.qty = Math.max(1, (item.qty || 1) - 1);
      if (btn.dataset.a) item.qty = (item.qty || 1) + 1;
      if (btn.dataset.r) cart = cart.filter(i => i.id !== id);
      saveCart();
    });
  });
}

function openDrawer() { cartDrawer.classList.add('open'); overlay.classList.add('show'); }
function closeDrawer() { cartDrawer.classList.remove('open'); overlay.classList.remove('show'); }

cartToggle.addEventListener('click', openDrawer);
cartClose.addEventListener('click', closeDrawer);
overlay.addEventListener('click', closeDrawer);

modalClose.addEventListener('click', () => modal.style.display = 'none');
modal.addEventListener('click', e => { if (e.target === modal) modal.style.display = 'none'; });

search.addEventListener('input', render);
searchBtn.addEventListener('click', render);

document.getElementById('view-all').addEventListener('click', e => {
  e.preventDefault();
  currentFilter = '';
  search.value = '';
  render();
});

checkoutBtn.addEventListener('click', () => {
  if (!cart.length) return;
  const lines = cart.map(i => `- ${i.name} x${i.qty} @ ${fmt(i.price)}`);
  const total = fmt(cart.reduce((s, i) => s + i.price * i.qty, 0));
  const text = encodeURIComponent(`Hi, I want to place an order:\n${lines.join('\n')}\nTotal: ${total}`);
  window.open(`https://wa.me/${WHATSAPP}?text=${text}`, '_blank');
});

function setTopLinks() {
  document.getElementById('top-whatsapp').href = `https://wa.me/${WHATSAPP}`;
  document.getElementById('hero-whatsapp').href = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent('Hi, I want to order from LASER SCALE TECH.')}`;
}

loadCart();
loadData();
setTopLinks();
