import { browserAccounts } from './account-store.mjs';

const $ = selector => document.querySelector(selector);
const accounts = browserAccounts();
let mode = new URLSearchParams(location.search).get('mode') === 'register' ? 'register' : 'login';
let busy = false;
const fields = ['email', 'password', 'confirmation'];

function clearErrors() {
  $('#account-error').hidden = true;
  for (const name of fields) {
    $(`#${name}`).removeAttribute('aria-invalid');
    $(`#${name}-error`).hidden = true;
  }
}
function fieldError(name, message) {
  $(`#${name}`).setAttribute('aria-invalid', 'true');
  $(`#${name}-error`).textContent = message;
  $(`#${name}-error`).hidden = false;
}
function showError(message) { $('#account-error').textContent = message; $('#account-error').hidden = false; }
function showSession() {
  const user = accounts.currentUser;
  $('#current-session').hidden = !user;
  $('#session-email').textContent = user?.email || '';
  if (accounts.lastError) showError(accounts.lastError.message);
}
function switchMode(next, focus = false) {
  if (busy) return;
  mode = next;
  clearErrors();
  const registering = mode === 'register';
  for (const [name, active] of [['login', !registering], ['register', registering]]) {
    const tab = $(`#${name}-tab`);
    tab.setAttribute('aria-selected', String(active));
    tab.tabIndex = active ? 0 : -1;
    if (focus && active) tab.focus();
  }
  $('#auth-panel').setAttribute('aria-labelledby', `${mode}-tab`);
  $('#account-title').textContent = registering ? '给宠爱，一个专属账号' : '欢迎回来，小爪的朋友';
  $('#account-subtitle').textContent = registering ? '简单注册，为下一次的小幸福保存收货地址。' : '登录后，下次下单可以直接使用保存的地址。';
  $('#confirmation-field').hidden = !registering;
  $('#confirmation').disabled = !registering;
  $('#confirmation').required = registering;
  $('#confirmation').value = '';
  $('#password').value = '';
  $('#password').autocomplete = registering ? 'new-password' : 'current-password';
  $('#account-submit').textContent = registering ? '注册并返回商城 →' : '登录并返回商城 →';
  document.title = `${registering ? '注册' : '登录'} · 爪爪零食铺`;
  history.replaceState(null, '', registering ? 'account.html?mode=register' : 'account.html');
}
for (const name of ['login', 'register']) {
  $(`#${name}-tab`).addEventListener('click', () => switchMode(name));
  $(`#${name}-tab`).addEventListener('keydown', event => {
    if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
      event.preventDefault();
      switchMode(event.key === 'Home' ? 'login' : event.key === 'End' ? 'register' : mode === 'login' ? 'register' : 'login', true);
    }
  });
}
$('#account-form').addEventListener('submit', async event => {
  event.preventDefault();
  if (busy) return;
  clearErrors();
  const email = $('#email').value.trim().toLowerCase();
  const password = $('#password').value;
  const confirmation = $('#confirmation').value;
  $('#email').value = email;
  const errors = {};
  if (!email || !$('#email').validity.valid) errors.email = '请填写有效的邮箱地址';
  if (mode === 'register' && (password.length < 8 || password.length > 64)) errors.password = '密码需为 8–64 位';
  if (mode === 'login' && !password) errors.password = '请输入密码';
  if (mode === 'register' && password !== confirmation) errors.confirmation = '两次输入的密码不一致';
  for (const [name, message] of Object.entries(errors)) fieldError(name, message);
  if (Object.keys(errors).length) {
    showError('请检查标出的信息后再试。');
    $(`#${Object.keys(errors)[0]}`).focus();
    return;
  }
  busy = true;
  const submit = $('#account-submit');
  submit.disabled = true;
  $('#login-tab').disabled = true; $('#register-tab').disabled = true;
  submit.textContent = mode === 'register' ? '正在创建账号…' : '正在登录…';
  $('#account-form').setAttribute('aria-busy', 'true');
  try {
    if (mode === 'register') await accounts.register(email, password, confirmation);
    else await accounts.login(email, password);
    // Only a fixed same-site destination is used; query strings cannot redirect elsewhere.
    location.assign('index.html#shop');
  } catch (error) {
    showError(error.message || '暂时无法完成操作，请稍后重试。');
    const target = ({ INVALID_EMAIL: 'email', EMAIL_EXISTS: 'email', INVALID_PASSWORD: 'password', PASSWORD_MISMATCH: 'confirmation', INVALID_CREDENTIALS: 'password' })[error.code];
    if (target) { fieldError(target, error.message); $(`#${target}`).focus(); }
    else $('#account-error').scrollIntoView({ block: 'nearest' });
  } finally {
    busy = false;
    submit.disabled = false;
    $('#login-tab').disabled = false; $('#register-tab').disabled = false;
    submit.textContent = mode === 'register' ? '注册并返回商城 →' : '登录并返回商城 →';
    $('#account-form').removeAttribute('aria-busy');
  }
});
$('#account-logout').addEventListener('click', () => {
  if (busy) return;
  try { accounts.logout(); clearErrors(); showSession(); $('#password').value = ''; $('#confirmation').value = ''; $('#email').focus(); }
  catch (error) { showError(error.message); }
});
window.addEventListener('pageshow', showSession);
switchMode(mode);
showSession();
