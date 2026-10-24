export const products = [
  { id: 'chicken', name: '鲜切鸡胸肉冻干', subtitle: '一口纯肉，满分心动', pet: 'cat', price: 3290, original: 3990, weight: '50g / 袋', flavor: '鸡肉', tag: '人气 TOP 1', color: '#f2b993', background: '#f9eee5', image: 'assets/chicken.svg', ingredients: '鸡胸肉 100%', description: '选用鸡胸肉，低温冻干保留肉香。酥脆小块，既能直接奖励，也可复水后拌粮。', feeding: '适合 3 月龄以上猫咪。初次少量尝试，每日建议 3–8g，并备足饮水。' },
  { id: 'duck', name: '慢烘鸭胸肉干', subtitle: '好好磨牙，慢慢享受', pet: 'dog', price: 3690, original: 4590, weight: '80g / 袋', flavor: '鸭肉', tag: '狗狗挚爱', color: '#a5b99b', background: '#eff2e9', image: 'assets/duck.svg', ingredients: '鸭胸肉 100%', description: '轻薄切片，慢火烘制。浓浓肉香与有嚼劲的口感，陪伴狗狗的每一次快乐训练。', feeding: '适合 6 月龄以上犬。按体型每日建议 5–15g，喂食时请在旁看护。' },
  { id: 'salmon', name: '深海三文鱼冻干', subtitle: '来自大海的鲜美奖励', pet: 'cat', price: 4590, original: 5290, weight: '45g / 袋', flavor: '三文鱼', tag: '鲜味推荐', color: '#e9a49a', background: '#f9eae6', image: 'assets/salmon.svg', ingredients: '三文鱼 100%', description: '满满鱼肉的自然鲜香，轻盈酥脆。小块冻干适合互动奖励，也可以捏碎撒在主粮上。', feeding: '适合 3 月龄以上猫咪。每日建议 2–6g，对鱼类敏感的猫咪请勿食用。' },
  { id: 'dental', name: '南瓜鸡肉洁齿棒', subtitle: '把快乐嚼进每一天', pet: 'dog', price: 2490, original: 2990, weight: '100g / 袋', flavor: '南瓜鸡肉', tag: '', color: '#e4bc72', background: '#fbf3df', image: 'assets/dental.svg', ingredients: '鸡肉、南瓜、红薯淀粉、植物纤维', description: '南瓜与鸡肉的香甜搭配，做成好握的小棒形状。日常咀嚼小奖励，让陪伴多一点乐趣。', feeding: '适合 6 月龄以上犬，每日 1–2 根。请根据犬只体型选择，避免整根吞咽；不能代替刷牙。' },
  { id: 'quail', name: '整颗鹌鹑蛋黄冻干', subtitle: '小小一颗，大大满足', pet: 'cat', price: 2990, original: 3590, weight: '40g / 袋', flavor: '蛋黄', tag: '', color: '#d9bc78', background: '#f8f1df', image: 'assets/quail.svg', ingredients: '鹌鹑蛋黄 100%', description: '金黄饱满的蛋黄，低温冻干后香酥易碎。掰成小块分享，让平凡的一餐也有惊喜。', feeding: '适合 3 月龄以上猫咪，每日建议半颗至 1 颗，蛋类敏感宠物请勿食用。' },
  { id: 'beef', name: '原切牛肉训练粒', subtitle: '每一次进步，都值得奖励', pet: 'dog', price: 3990, original: 4890, weight: '70g / 袋', flavor: '牛肉', tag: '训练好搭档', color: '#bb927d', background: '#f2e9e2', image: 'assets/beef.svg', ingredients: '牛肉 100%', description: '小颗粒，大肉香。原切牛肉烘干制成，随身携带方便，是散步与训练时的小小默契。', feeding: '适合 6 月龄以上犬，每日建议 5–12g。首次喂食少量观察，牛肉敏感宠物请勿食用。' },
  { id: 'shrimp', name: '鲜甜白虾冻干', subtitle: '一口鲜甜，喵不可言', pet: 'cat', price: 4290, original: 4990, weight: '35g / 袋', flavor: '白虾', tag: '', color: '#c2b6ce', background: '#f1edf5', image: 'assets/shrimp.svg', ingredients: '去壳白虾 100%', description: '去壳白虾冻干，酥脆鲜甜。可直接喂食，也可用温水复水，享受不同口感。', feeding: '适合 3 月龄以上猫咪，每日建议 1–3 只，甲壳类敏感宠物请勿食用。' },
  { id: 'sweetpotato', name: '鸡肉缠绕红薯条', subtitle: '肉香与香甜，双倍喜欢', pet: 'dog', price: 2790, original: 3390, weight: '80g / 袋', flavor: '鸡肉红薯', tag: '新口味', color: '#d5a277', background: '#f7eee3', image: 'assets/sweetpotato.svg', ingredients: '鸡胸肉、红薯', description: '鸡肉缠绕红薯，肉香与自然甜味相遇。慢烘制作，陪狗狗享受午后的悠闲时光。', feeding: '适合 6 月龄以上犬，每日建议 1–3 条。请全程看护，零食热量不宜超过每日总热量的 10%。' },
];

export function selectProducts({ category = 'all', query = '', sort = 'featured' } = {}, catalog = products) {
  const text = query.trim().toLocaleLowerCase();
  const selected = catalog.filter(p => (category === 'all' || p.pet === category) && p.name.toLocaleLowerCase().includes(text));
  if (sort === 'price-asc') selected.sort((a, b) => a.price - b.price);
  if (sort === 'price-desc') selected.sort((a, b) => b.price - a.price);
  return selected;
}

const STORAGE_KEY = 'paw-pantry-cart-v1';
export class ShopCart {
  constructor(storage, catalog = products) {
    this.storage = storage;
    this.catalog = catalog;
    this.quantities = {};
    try {
      const saved = JSON.parse(storage?.getItem(STORAGE_KEY) || '{}');
      if (saved && typeof saved === 'object' && !Array.isArray(saved)) {
        for (const p of catalog) {
          const qty = saved[p.id];
          if (Number.isInteger(qty) && qty > 0) this.quantities[p.id] = Math.min(qty, 99);
        }
      }
    } catch { /* Storage is optional; the in-memory cart stays available. */ }
  }
  get items() { return this.catalog.filter(p => this.quantities[p.id]).map(product => ({ product, quantity: this.quantities[product.id] })); }
  get count() { return this.items.reduce((sum, item) => sum + item.quantity, 0); }
  get total() { return this.items.reduce((sum, item) => sum + item.product.price * item.quantity, 0); }
  save() { try { this.storage?.setItem(STORAGE_KEY, JSON.stringify(this.quantities)); } catch { /* Private mode or quota limits must not interrupt shopping. */ } }
  add(id, quantity = 1) {
    if (!this.catalog.some(p => p.id === id) || !Number.isInteger(quantity) || quantity <= 0) return;
    this.quantities[id] = Math.min((this.quantities[id] || 0) + quantity, 99);
    this.save();
  }
  setQuantity(id, quantity) {
    if (!this.catalog.some(p => p.id === id) || !Number.isInteger(quantity) || quantity < 0) return;
    if (quantity === 0) delete this.quantities[id];
    else this.quantities[id] = Math.min(quantity, 99);
    this.save();
  }
  remove(id) { delete this.quantities[id]; this.save(); }
  clear() { this.quantities = {}; this.save(); }
}
