import test from 'node:test';
import assert from 'node:assert/strict';
import { selectProducts, ShopCart } from '../store.mjs';

const catalog = [
  { id: 'a', name: '冻干鸡胸肉', pet: 'cat', price: 3290 },
  { id: 'b', name: '鸡肉洁齿棒', pet: 'dog', price: 1990 },
  { id: 'c', name: '冻干三文鱼', pet: 'cat', price: 4590 },
];
function memoryStorage(initial = null) {
  let value = initial;
  return { getItem: () => value, setItem: (_key, next) => { value = next; } };
}

test('分类、名称查询与价格排序组合，并且不改变原始商品顺序', () => {
  assert.deepEqual(selectProducts({ category: 'cat', query: ' 冻干 ', sort: 'price-desc' }, catalog).map(p => p.id), ['c', 'a']);
  assert.deepEqual(selectProducts({ category: 'all', query: '鸡', sort: 'price-asc' }, catalog).map(p => p.id), ['b', 'a']);
  assert.deepEqual(catalog.map(p => p.id), ['a', 'b', 'c']);
});
test('无匹配商品返回空结果，重置后恢复全部', () => {
  assert.deepEqual(selectProducts({ query: '不存在' }, catalog), []);
  assert.equal(selectProducts({}, catalog).length, 3);
});
test('同商品合并，数量变化精确计算分值总额，删除与清空生效', () => {
  const cart = new ShopCart(memoryStorage(), catalog);
  cart.add('a', 2); cart.add('a'); cart.add('b');
  assert.equal(cart.count, 4); assert.equal(cart.total, 11860);
  cart.setQuantity('a', 1);
  assert.equal(cart.total, 5280);
  cart.remove('b'); assert.equal(cart.total, 3290);
  cart.clear(); assert.equal(cart.count, 0); assert.equal(cart.total, 0);
});
test('购物车刷新后从持久化数据恢复', () => {
  const storage = memoryStorage();
  const cart = new ShopCart(storage, catalog); cart.add('b', 3);
  const restored = new ShopCart(storage, catalog);
  assert.equal(restored.count, 3); assert.equal(restored.total, 5970);
  assert.equal(restored.items[0].product.name, '鸡肉洁齿棒');
});
test('忽略未知商品与非法数量，并将数量限制为 99', () => {
  const cart = new ShopCart(memoryStorage(), catalog);
  cart.add('unknown'); cart.add('a', -1); cart.add('a', NaN); cart.add('a', 1.5);
  assert.equal(cart.count, 0);
  cart.add('a', 1000); assert.equal(cart.count, 99);
  cart.setQuantity('a', 0); assert.equal(cart.count, 0);
});
test('损坏或非法存储不影响初始化，已过期的商品被忽略', () => {
  assert.equal(new ShopCart(memoryStorage('{bad json'), catalog).count, 0);
  assert.equal(new ShopCart(memoryStorage('null'), catalog).count, 0);
  const cart = new ShopCart(memoryStorage(JSON.stringify({ a: 2, b: -3, c: '2', unknown: 1 })), catalog);
  assert.equal(cart.count, 2); assert.equal(cart.total, 6580);
});
test('浏览器阻止存储时仍可正常添加与结算清空', () => {
  const blocked = { getItem() { throw Error('blocked'); }, setItem() { throw Error('blocked'); } };
  const cart = new ShopCart(blocked, catalog);
  cart.add('a'); assert.equal(cart.total, 3290);
  cart.clear(); assert.equal(cart.count, 0);
});
