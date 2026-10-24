import test from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import { AccountStore, ACCOUNT_KEY, SESSION_KEY, validateAddress } from '../account-store.mjs';

function memoryStorage() {
  const data = new Map();
  return { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, String(value)), removeItem: key => data.delete(key) };
}
const address = { recipient: ' 王小明 ', phone: ' 13800138000 ', province: ' 广东省 ', city: ' 广州市 ', district: ' 天河区 ', detail: ' 天河路123号101室 ' };
const setup = () => {
  const local = memoryStorage(), session = memoryStorage();
  return { local, session, store: new AccountStore(local, session, webcrypto) };
};

test('注册规范化邮箱、自动登录，并以不同盐保存密码校验值', async () => {
  const { store, local, session } = setup();
  await store.register('  HELLO@Example.com ', 'Treats123!', 'Treats123!');
  assert.equal(store.currentUser.email, 'hello@example.com');
  assert.ok(session.getItem(SESSION_KEY));
  const first = JSON.parse(local.getItem(ACCOUNT_KEY)).users[0];
  assert.equal(first.salt.length, 32); assert.equal(first.verifier.length, 64);
  assert.ok(!local.getItem(ACCOUNT_KEY).includes('Treats123!'));
  await store.register('other@example.com', 'Treats123!', 'Treats123!');
  const second = JSON.parse(local.getItem(ACCOUNT_KEY)).users[1];
  assert.notEqual(first.salt, second.salt); assert.notEqual(first.verifier, second.verifier);
});
test('重复邮箱、非法邮箱、密码长度和确认密码不一致均不能创建账号', async () => {
  const { store } = setup();
  await assert.rejects(store.register('bad', 'Treats123!', 'Treats123!'), { code: 'INVALID_EMAIL' });
  await assert.rejects(store.register('a@example.com', 'short', 'short'), { code: 'INVALID_PASSWORD' });
  await assert.rejects(store.register('a@example.com', 'x'.repeat(65), 'x'.repeat(65)), { code: 'INVALID_PASSWORD' });
  await assert.rejects(store.register('a@example.com', 'Treats123!', 'Different123'), { code: 'PASSWORD_MISMATCH' });
  await store.register('a@example.com', 'Treats123!', 'Treats123!');
  await assert.rejects(store.register(' A@example.com ', 'Treats123!', 'Treats123!'), { code: 'EMAIL_EXISTS' });
});
test('错误密码和不存在邮箱返回统一错误，正确登录可在同一会话刷新恢复', async () => {
  const { store, local, session } = setup();
  await store.register('a@example.com', 'Treats123!', 'Treats123!');
  store.logout();
  await assert.rejects(store.login('a@example.com', 'wrong123'), { code: 'INVALID_CREDENTIALS' });
  await assert.rejects(store.login('missing@example.com', 'wrong123'), { code: 'INVALID_CREDENTIALS' });
  assert.equal(store.currentUser, null);
  await store.login(' A@EXAMPLE.COM ', 'Treats123!');
  assert.equal(new AccountStore(local, session, webcrypto).currentUser.email, 'a@example.com');
  assert.equal(new AccountStore(local, memoryStorage(), webcrypto).currentUser, null);
});
test('地址去除首尾空白并校验所有字段，非法输入不会被静默修正', () => {
  const result = validateAddress(address);
  assert.deepEqual(result.errors, {});
  assert.equal(result.value.recipient, '王小明'); assert.equal(result.value.phone, '13800138000');
  const invalid = validateAddress({ recipient: '', phone: '123', province: '', city: '', district: '', detail: '短地址' });
  assert.deepEqual(Object.keys(invalid.errors), ['recipient', 'phone', 'province', 'city', 'district', 'detail']);
  assert.ok(validateAddress({ ...address, recipient: 'x'.repeat(31), detail: 'x'.repeat(121) }).errors.recipient);
  assert.ok(validateAddress({ ...address, detail: 'x'.repeat(121) }).errors.detail);
  assert.deepEqual(validateAddress({ ...address, detail: 'x'.repeat(5), recipient: '王', city: 'x'.repeat(30) }).errors, {});
});
test('一个账号只保存一个地址，更新后覆盖，两个账号互相隔离', async () => {
  const { store } = setup();
  await store.register('a@example.com', 'Treats123!', 'Treats123!');
  store.saveAddress(address);
  assert.equal(store.currentUser.address.city, '广州市');
  store.saveAddress({ ...address, city: '深圳市' });
  await store.register('b@example.com', 'Treats123!', 'Treats123!');
  assert.equal(store.currentUser.address, null);
  store.saveAddress({ ...address, recipient: '李小红' });
  await store.login('a@example.com', 'Treats123!');
  assert.equal(store.currentUser.address.city, '深圳市'); assert.equal(store.currentUser.address.recipient, '王小明');
});
test('游客不能持久化地址，非法地址不覆盖已有内容', async () => {
  const { store } = setup();
  assert.throws(() => store.saveAddress(address), { code: 'NOT_SIGNED_IN' });
  await store.register('a@example.com', 'Treats123!', 'Treats123!');
  store.saveAddress(address);
  assert.throws(() => store.saveAddress({ ...address, phone: 'bad' }), { code: 'INVALID_ADDRESS' });
  assert.equal(store.currentUser.address.phone, '13800138000');
  store.logout(); assert.equal(store.currentUser, null);
});
test('无法读写账号或会话存储时提示错误，不报告虚假的登录成功', async () => {
  const blocked = { getItem() { throw Error('blocked'); }, setItem() { throw Error('blocked'); }, removeItem() { throw Error('blocked'); } };
  const broken = new AccountStore(blocked, memoryStorage(), webcrypto);
  assert.equal(broken.currentUser, null);
  await assert.rejects(broken.register('a@example.com', 'Treats123!', 'Treats123!'), { code: 'STORAGE_UNAVAILABLE' });
  const local = memoryStorage();
  const noSession = new AccountStore(local, blocked, webcrypto);
  await assert.rejects(noSession.register('a@example.com', 'Treats123!', 'Treats123!'), { code: 'STORAGE_UNAVAILABLE' });
  assert.equal(local.getItem(ACCOUNT_KEY), null);
});
test('损坏账号数据不能被新注册覆盖，伪造会话不能恢复用户', async () => {
  const { store, local, session } = setup();
  local.setItem(ACCOUNT_KEY, '{bad');
  assert.equal(store.currentUser, null);
  await assert.rejects(store.register('a@example.com', 'Treats123!', 'Treats123!'), { code: 'STORAGE_CORRUPT' });
  assert.equal(local.getItem(ACCOUNT_KEY), '{bad');
  local.removeItem(ACCOUNT_KEY); session.setItem(SESSION_KEY, 'unknown');
  assert.equal(store.currentUser, null);
});

test('损坏的密码盐或校验值类型被识别为存储损坏，不能隐式转换通过校验', async () => {
  const { store, local } = setup();
  await store.register('a@example.com', 'Treats123!', 'Treats123!');
  const original = JSON.parse(local.getItem(ACCOUNT_KEY));
  for (const field of ['salt', 'verifier']) {
    const malformed = structuredClone(original);
    malformed.users[0][field] = [malformed.users[0][field]];
    local.setItem(ACCOUNT_KEY, JSON.stringify(malformed));
    await assert.rejects(store.login('a@example.com', 'Treats123!'), { code: 'STORAGE_CORRUPT' });
    assert.equal(store.currentUser, null);
  }
});

test('账号写入失败会恢复原会话，会话写入失败不创建残留账号', async () => {
  const local = memoryStorage(), session = memoryStorage();
  const writeBlocked = { ...local, setItem() { throw Error('quota'); } };
  const store = new AccountStore(writeBlocked, session, webcrypto);
  await assert.rejects(store.register('a@example.com', 'Treats123!', 'Treats123!'), { code: 'STORAGE_UNAVAILABLE' });
  assert.equal(session.getItem(SESSION_KEY), null);
  const sessionBlocked = { ...session, setItem() { throw Error('quota'); } };
  await assert.rejects(new AccountStore(local, sessionBlocked, webcrypto).register('b@example.com', 'Treats123!', 'Treats123!'), { code: 'STORAGE_UNAVAILABLE' });
  assert.equal(local.getItem(ACCOUNT_KEY), null);
});
