import { products, selectProducts, ShopCart } from './store.mjs';

const $ = selector => document.querySelector(selector);
const icon = name => `<svg class="icon" aria-hidden="true"><use href="#i-${name}"/></svg>`;
const money = cents => (cents / 100).toFixed(2);
const price = (cents, original) => `<span class="price"><small>¥</small>${money(cents)}${original ? `<span class="original-price">¥${money(original)}</span>` : ''}</span>`;
let storage;
try { storage = window.localStorage; } catch { /* Restricted browsers use memory only. */ }
const cart = new ShopCart(storage);
const filters = { category: 'all', query: '', sort: 'featured' };
const detailDialog = $('#detail-dialog');
const cartDialog = $('#cart-dialog');
const checkoutDialog = $('#checkout-dialog');
let detailProduct;
let detailQuantity = 1;
let toastTimeout;
let modalOpener;

// Native dialogs provide focus trapping, inert background content and Escape handling.
function openDialog(dialog, opener = document.activeElement) {
  const activeDialog = document.querySelector('dialog[open]');
  if (!activeDialog) modalOpener = opener;
  else activeDialog.close();
  dialog.showModal();
}
function closeDialog(dialog) { dialog.close(); }
for (const dialog of document.querySelectorAll('dialog')) {
  dialog.addEventListener('click', event => {
    if (event.target.closest('[data-close]')) closeDialog(dialog);
    else if (event.target === dialog) {
      const r = dialog.getBoundingClientRect();
      if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) closeDialog(dialog);
    }
  });
  dialog.addEventListener('close', () => {
    requestAnimationFrame(() => {
      if (!document.querySelector('dialog[open]') && modalOpener?.isConnected) modalOpener.focus({ preventScroll: true });
    });
  });
}

function imageFallback(image) {
  if (image instanceof HTMLImageElement && !image.dataset.fallback) {
    image.dataset.fallback = 'true';
    image.src = 'assets/placeholder.svg';
    image.classList.add('image-fallback');
  }
}
document.addEventListener('error', event => imageFallback(event.target), true);
// Initial HTML images may finish failing before the deferred module executes.
for (const image of document.images) {
  if (image.complete && image.naturalWidth === 0) imageFallback(image);
}

function toast(message) {
  clearTimeout(toastTimeout);
  $('#toast').textContent = message;
  $('#toast').classList.add('visible');
  toastTimeout = setTimeout(() => $('#toast').classList.remove('visible'), 2500);
}

function renderProducts() {
  const selected = selectProducts(filters);
  $('#product-grid').innerHTML = selected.map((p, index) => `<article class="product-card" style="--card-bg:${p.background}">
    <button class="product-visual" data-detail="${p.id}" aria-label="查看${p.name}详情">
      ${p.tag ? `<span class="product-badge ${p.id === 'chicken' ? 'popular' : ''}">${p.tag}</span>` : ''}
      <img src="${p.image}" alt="${p.name}包装图" width="270" height="330" loading="lazy">
      <span class="visual-number">PAW PAW / ${String(index + 1).padStart(2, '0')}</span>
    </button>
    <div class="product-info"><div class="product-meta"><span class="pet-label">${icon(p.pet)}${p.pet === 'cat' ? '猫咪零食' : '狗狗零食'}</span><span>${p.weight}</span></div>
    <h3><button class="product-name" data-detail="${p.id}">${p.name}</button></h3><p class="product-subtitle">${p.subtitle}</p>
    <div class="product-rating">${icon('heart')} 小爪推荐 <span>· ${p.flavor}风味</span></div>
    <div class="product-bottom">${price(p.price, p.original)}<button class="quick-add" data-add="${p.id}" aria-label="添加${p.name}到购物车">${icon('plus')}</button></div></div>
  </article>`).join('');
  $('#result-count').textContent = selected.length ? `为你精选 ${selected.length} 款美味` : '找到 0 款美味';
  $('#empty-results').hidden = selected.length > 0;
}

function updateCartBadge() {
  $('#cart-count').textContent = cart.count;
  $('#cart-title-count').textContent = `${cart.count} 件`;
  $('#open-cart').setAttribute('aria-label', `打开购物车，${cart.count} 件商品`);
}
function addProduct(id, quantity = 1) {
  const p = products.find(p => p.id === id);
  const previous = cart.count;
  cart.add(id, quantity);
  updateCartBadge();
  toast(cart.count === previous ? '这款零食最多可以装入 99 件哦' : `已把「${p.name}」装进快乐购物袋`);
}

$('#product-grid').addEventListener('click', event => {
  const detail = event.target.closest('[data-detail]');
  const add = event.target.closest('[data-add]');
  if (detail) showDetail(detail.dataset.detail);
  if (add) addProduct(add.dataset.add);
});
document.querySelectorAll('[data-category]').forEach(button => button.addEventListener('click', () => {
  filters.category = button.dataset.category;
  document.querySelectorAll('[data-category]').forEach(tab => {
    const selected = tab === button;
    tab.classList.toggle('selected', selected);
    tab.setAttribute('aria-pressed', selected);
  });
  renderProducts();
}));
$('#product-search').addEventListener('input', event => { filters.query = event.target.value; renderProducts(); });
$('#sort').addEventListener('change', event => { filters.sort = event.target.value; renderProducts(); });
$('#reset-filters').addEventListener('click', () => {
  Object.assign(filters, { category: 'all', query: '', sort: 'featured' });
  $('#product-search').value = '';
  $('#sort').value = 'featured';
  document.querySelector('[data-category="all"]').click();
  $('#product-search').focus({ preventScroll: true });
});
$('#jump-search').addEventListener('click', () => {
  $('#shop').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  $('#product-search').focus({ preventScroll: true });
});

function quantityControl(quantity, prefix, disabledMinus = false) {
  return `<div class="quantity-control"><button data-${prefix}="minus" aria-label="减少数量" ${disabledMinus ? 'disabled' : ''}>${icon('minus')}</button><output aria-label="商品数量">${quantity}</output><button data-${prefix}="plus" aria-label="增加数量" ${quantity >= 99 ? 'disabled' : ''}>${icon('plus')}</button></div>`;
}
function showDetail(id) {
  detailProduct = products.find(p => p.id === id);
  detailQuantity = 1;
  const p = detailProduct;
  $('#detail-content').innerHTML = `<div class="detail-layout"><div class="detail-image" style="--card-bg:${p.background}"><img src="${p.image}" alt="${p.name}包装" width="270" height="330"></div><div class="detail-copy"><span class="eyebrow">A LITTLE TREAT, A LOT OF LOVE</span><h2 id="detail-title">${p.name}</h2><p>${p.description}</p><div class="detail-price">${price(p.price, p.original)}</div><dl><dt>适用</dt><dd>${p.pet === 'cat' ? '猫咪' : '狗狗'} · ${p.weight}</dd><dt>原料</dt><dd>${p.ingredients}</dd><dt>保存</dt><dd>阴凉干燥处密封保存，开封后尽快食用。</dd></dl><p class="detail-feeding"><strong>喂养小贴士</strong><br>${p.feeding}</p><div class="detail-actions"><div id="detail-quantity">${quantityControl(1, 'detail-qty', true)}</div><button class="button primary" id="detail-add">${icon('bag')}加入购物袋</button></div></div></div>`;
  openDialog(detailDialog);
}
detailDialog.addEventListener('click', event => {
  const quantity = event.target.closest('[data-detail-qty]');
  if (quantity) {
    detailQuantity = Math.max(1, Math.min(99, detailQuantity + (quantity.dataset.detailQty === 'plus' ? 1 : -1)));
    const controls = $('#detail-quantity');
    controls.querySelector('output').value = detailQuantity;
    controls.querySelector('[data-detail-qty="minus"]').disabled = detailQuantity <= 1;
    controls.querySelector('[data-detail-qty="plus"]').disabled = detailQuantity >= 99;
  }
  if (event.target.closest('#detail-add')) {
    addProduct(detailProduct.id, detailQuantity);
    closeDialog(detailDialog);
  }
});

function renderCart() {
  updateCartBadge();
  const items = cart.items;
  $('#cart-items').innerHTML = items.length ? items.map(({ product: p, quantity }) => `<article class="cart-item" data-cart-id="${p.id}"><img class="cart-item-image" style="--card-bg:${p.background}" src="${p.image}" alt="${p.name}" width="80" height="103"><div><div class="cart-item-title"><h3>${p.name}</h3><button class="remove-item" data-remove="${p.id}" aria-label="移除${p.name}">移除</button></div><p>${p.weight} · ${p.pet === 'cat' ? '猫咪零食' : '狗狗零食'}</p><div class="cart-item-bottom">${price(p.price)}${quantityControl(quantity, 'cart-qty')}</div><p>小计 ¥${money(p.price * quantity)}</p></div></article>`).join('') : `<div class="cart-empty">${icon('bag')}<h3>快乐购物袋还是空的</h3><p>给毛孩子挑一点心动的小零食吧。</p><button class="button primary" id="continue-shopping">去发现小美味${icon('arrow')}</button></div>`;
  $('#cart-footer').innerHTML = `<div class="cart-subtotal"><span>商品合计（${cart.count} 件）</span>${price(cart.total)}</div><p>每一份小奖励，都装着你的大大宠爱。</p><button id="checkout-button" class="button primary" ${!items.length ? 'disabled' : ''}>模拟结算${icon('arrow')}</button><p class="cart-demo">仅供前端演示，不收取任何费用</p>`;
}
$('#open-cart').addEventListener('click', () => { renderCart(); openDialog(cartDialog); });
cartDialog.addEventListener('click', event => {
  if (event.target.closest('#continue-shopping')) {
    closeDialog(cartDialog);
    $('#shop').scrollIntoView();
  }
  const remove = event.target.closest('[data-remove]');
  const quantityButton = event.target.closest('[data-cart-qty]');
  if (remove || quantityButton) {
    const row = event.target.closest('[data-cart-id]');
    const id = row.dataset.cartId;
    const index = cart.items.findIndex(item => item.product.id === id);
    const quantity = cart.items[index].quantity;
    const action = quantityButton?.dataset.cartQty;
    if (remove) cart.remove(id);
    else cart.setQuantity(id, quantity + (action === 'plus' ? 1 : -1));
    renderCart();
    // Re-rendering must not leave keyboard focus on a removed DOM node.
    const rows = [...cartDialog.querySelectorAll('[data-cart-id]')];
    const nextRow = rows.find(row => row.dataset.cartId === id) || rows[Math.min(index, rows.length - 1)];
    const nextControl = nextRow?.querySelector(remove ? '[data-remove]' : `[data-cart-qty="${action}"]:not(:disabled)`);
    (nextControl || nextRow?.querySelector('button') || $('#continue-shopping')).focus();
  }
  if (event.target.closest('#checkout-button') && cart.count) showCheckout();
});

function showCheckout() {
  $('#checkout-content').innerHTML = `<span class="eyebrow">READY FOR A LITTLE HAPPINESS?</span><h2 id="checkout-title">确认这份小幸福</h2><p class="checkout-intro">看看给毛孩子挑选的美味清单。</p><p class="demo-alert">这是模拟订单，不会付款、发货或产生真实交易。</p><div class="order-lines">${cart.items.map(({ product: p, quantity }) => `<div class="order-line"><span>${p.name}<small>${p.weight} × ${quantity}</small></span><span>¥${money(p.price * quantity)}</span></div>`).join('')}</div><div class="cart-subtotal"><span>合计 ${cart.count} 件</span>${price(cart.total)}</div><div class="checkout-actions"><button class="button secondary" id="back-to-cart">返回购物袋</button><button class="button primary" id="confirm-order">确认模拟下单${icon('check')}</button></div>`;
  openDialog(checkoutDialog);
}
checkoutDialog.addEventListener('click', event => {
  if (event.target.closest('#back-to-cart')) { renderCart(); openDialog(cartDialog); }
  if (event.target.closest('#confirm-order') && cart.count) {
    const count = cart.count;
    const total = cart.total;
    cart.clear();
    updateCartBadge();
    const orderId = `PAW-${Date.now().toString(36).toUpperCase()}`;
    $('#checkout-content').innerHTML = `<div class="success-state"><span class="success-icon">${icon('check')}</span><span class="eyebrow">LOVE IS ON THE WAY</span><h2 id="checkout-title" tabindex="-1">快乐，已成功打包！</h2><p>${count} 件小美味 · 合计 ¥${money(total)}<br>谢谢你，认真宠爱每一个小日常。</p><div class="order-number">演示订单 ${orderId}</div><p>本次为模拟下单，未付款，也不会实际发货。</p><button class="button primary" id="finish-order">继续逛逛${icon('arrow')}</button></div>`;
    $('#checkout-title').focus();
  }
  if (event.target.closest('#finish-order')) closeDialog(checkoutDialog);
});

renderProducts();
updateCartBadge();
