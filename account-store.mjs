export const ACCOUNT_KEY = 'paw-pantry-accounts-v1';
export const SESSION_KEY = 'paw-pantry-session-v1';
export const addressFields = [
  { name: 'recipient', label: '收货人', min: 1, max: 30, autocomplete: 'shipping name', placeholder: '请填写收货人姓名' },
  { name: 'phone', label: '手机号', min: 11, max: 11, autocomplete: 'shipping tel', placeholder: '中国大陆 11 位手机号', type: 'tel' },
  { name: 'province', label: '省 / 直辖市', min: 1, max: 30, autocomplete: 'shipping address-level1', placeholder: '如：广东省' },
  { name: 'city', label: '市', min: 1, max: 30, autocomplete: 'shipping address-level2', placeholder: '如：广州市' },
  { name: 'district', label: '区 / 县', min: 1, max: 30, autocomplete: 'shipping address-level3', placeholder: '如：天河区' },
  { name: 'detail', label: '详细地址', min: 5, max: 120, autocomplete: 'shipping street-address', placeholder: '街道、门牌号、楼栋及房间号（5–120 字）' },
];
export function validateAddress(raw = {}) {
  const value = {}, errors = {};
  for (const field of addressFields) {
    const text = typeof raw?.[field.name] === 'string' ? raw[field.name].trim() : '';
    value[field.name] = text;
    if (!text) errors[field.name] = `请填写${field.label}`;
    else if (field.name === 'phone' && !/^1[3-9]\d{9}$/.test(text)) errors.phone = '请填写有效的中国大陆 11 位手机号';
    else if ([...text].length < field.min || [...text].length > field.max) errors[field.name] = `${field.label}需为 ${field.min}–${field.max} 字`;
  }
  return { value, errors };
}

export class AccountError extends Error {
  constructor(code, message) { super(message); this.name = 'AccountError'; this.code = code; }
}
const failure = (code, message) => new AccountError(code, message);
const validEmail = email => email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const normalizeEmail = email => typeof email === 'string' ? email.trim().toLowerCase() : '';
const hex = bytes => [...bytes].map(n => n.toString(16).padStart(2, '0')).join('');

export class AccountStore {
  constructor(local, session, crypto = globalThis.crypto) {
    this.local = local;
    this.session = session;
    this.crypto = crypto;
    this.lastError = null;
  }
  storageAction(storage, action, ...args) {
    try {
      if (!storage || typeof storage[action] !== 'function') throw Error('Unavailable');
      return storage[action](...args);
    } catch { throw failure('STORAGE_UNAVAILABLE', '浏览器存储不可用，无法保存账号或登录状态。你仍可返回商城以游客身份下单。'); }
  }
  readUsers() {
    const text = this.storageAction(this.local, 'getItem', ACCOUNT_KEY);
    if (text === null) return [];
    try {
      const data = JSON.parse(text);
      if (data.version !== 1 || !Array.isArray(data.users)) throw Error('Invalid database');
      const ids = new Set(), emails = new Set();
      for (const user of data.users) {
        if (!user || typeof user.id !== 'string' || !user.id || typeof user.email !== 'string' || !validEmail(user.email) || user.email !== normalizeEmail(user.email) || typeof user.salt !== 'string' || typeof user.verifier !== 'string' || !/^[a-f0-9]{32}$/.test(user.salt) || !/^[a-f0-9]{64}$/.test(user.verifier) || ids.has(user.id) || emails.has(user.email)) throw Error('Invalid account');
        ids.add(user.id); emails.add(user.email);
      }
      return data.users;
    } catch { throw failure('STORAGE_CORRUPT', '本地账号数据无法读取，未覆盖原有内容。你仍可返回商城以游客身份下单。'); }
  }
  writeUsers(users) { this.storageAction(this.local, 'setItem', ACCOUNT_KEY, JSON.stringify({ version: 1, users })); }
  get currentUser() {
    this.lastError = null;
    try {
      const id = this.storageAction(this.session, 'getItem', SESSION_KEY);
      if (!id) return null;
      const user = this.readUsers().find(user => user.id === id);
      if (!user) return null;
      const address = user.address && Object.keys(validateAddress(user.address).errors).length === 0 ? validateAddress(user.address).value : null;
      return { id: user.id, email: user.email, address };
    } catch (error) { this.lastError = error; return null; }
  }
  async verifier(password, salt) {
    if (!this.crypto?.subtle || !this.crypto?.getRandomValues || !this.crypto?.randomUUID) throw failure('CRYPTO_UNAVAILABLE', '当前环境不支持账号演示所需功能，请通过本地预览地址或 HTTPS 打开页面。');
    const key = await this.crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
    const bytes = Uint8Array.from(salt.match(/../g), part => parseInt(part, 16));
    const result = await this.crypto.subtle.deriveBits({ name: 'PBKDF2', salt: bytes, iterations: 210000, hash: 'SHA-256' }, key, 256);
    return hex(new Uint8Array(result));
  }
  async register(rawEmail, password, confirmation) {
    const email = normalizeEmail(rawEmail);
    if (!validEmail(email)) throw failure('INVALID_EMAIL', '请填写有效的邮箱地址');
    if (typeof password !== 'string' || password.length < 8 || password.length > 64) throw failure('INVALID_PASSWORD', '密码需为 8–64 位');
    if (password !== confirmation) throw failure('PASSWORD_MISMATCH', '两次输入的密码不一致');
    const previousSession = this.storageAction(this.session, 'getItem', SESSION_KEY);
    if (this.readUsers().some(user => user.email === email)) throw failure('EMAIL_EXISTS', '这个邮箱已注册，请切换到登录');
    if (!this.crypto?.getRandomValues || !this.crypto?.randomUUID) throw failure('CRYPTO_UNAVAILABLE', '当前环境不支持账号演示，请使用本地预览地址或 HTTPS。');
    const salt = hex(this.crypto.getRandomValues(new Uint8Array(16)));
    const verifier = await this.verifier(password, salt);
    // Read again after asynchronous derivation so concurrent registrations cannot overwrite each other.
    const users = this.readUsers();
    if (users.some(user => user.email === email)) throw failure('EMAIL_EXISTS', '这个邮箱已注册，请切换到登录');
    const user = { id: this.crypto.randomUUID(), email, salt, verifier, address: null };
    this.storageAction(this.session, 'setItem', SESSION_KEY, user.id);
    try { this.writeUsers([...users, user]); }
    catch (error) {
      try {
        if (previousSession === null) this.storageAction(this.session, 'removeItem', SESSION_KEY);
        else this.storageAction(this.session, 'setItem', SESSION_KEY, previousSession);
      } catch { /* The original persistence error remains the useful error. */ }
      throw error;
    }
    return this.currentUser;
  }
  async login(rawEmail, password) {
    const email = normalizeEmail(rawEmail);
    const user = this.readUsers().find(user => user.email === email);
    if (!user || typeof password !== 'string' || password.length > 64 || await this.verifier(password, user.salt) !== user.verifier) throw failure('INVALID_CREDENTIALS', '邮箱或密码不正确');
    this.storageAction(this.session, 'setItem', SESSION_KEY, user.id);
    return this.currentUser;
  }
  logout() { this.storageAction(this.session, 'removeItem', SESSION_KEY); }
  saveAddress(raw) {
    const user = this.currentUser;
    if (this.lastError) throw this.lastError;
    if (!user) throw failure('NOT_SIGNED_IN', '请登录后保存收货地址');
    const { value, errors } = validateAddress(raw);
    if (Object.keys(errors).length) throw failure('INVALID_ADDRESS', Object.values(errors)[0]);
    const users = this.readUsers();
    this.writeUsers(users.map(record => record.id === user.id ? { ...record, address: value } : record));
    return value;
  }
}

export function browserAccounts() {
  let local, session;
  try { local = globalThis.localStorage; } catch { /* Access is checked when used. */ }
  try { session = globalThis.sessionStorage; } catch { /* Guest checkout remains available. */ }
  return new AccountStore(local, session);
}
