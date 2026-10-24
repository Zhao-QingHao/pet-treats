// Reproducible, code-native product packaging illustrations. No external tools required.
import { writeFile } from 'node:fs/promises';
import { products } from '../store.mjs';
const paw = `<g fill="currentColor"><ellipse cx="5" cy="8" rx="2.5" ry="3.3" transform="rotate(-24 5 8)"/><ellipse cx="10.5" cy="4.5" rx="2.4" ry="3.1"/><ellipse cx="16" cy="6" rx="2.4" ry="3.1"/><ellipse cx="19.5" cy="11" rx="2.3" ry="3"/><path d="M5 16c2-2 3-6 6-6s4 4 6 6c3 4-1 6-4 4-2-1-3 0-4 0-4 2-7-1-4-4Z"/></g>`;
const english = ['CHICKEN BITES', 'DUCK JERKY', 'SALMON BITES', 'DENTAL CHEWS', 'QUAIL EGG YOLKS', 'BEEF TRAINING BITES', 'SHRIMP BITES', 'CHICKEN &amp; SWEET POTATO'];
const doodle = pet => pet === 'cat'
  ? `<path d="m-23-3-4-27 20 14h14l20-14-4 27c7 33-53 33-46 0Z"/><path d="m-13 0 4 1m18-1 4 1m-15 9h4m-2 0v5m-25-8-13-3m14 10-13 2m54-9 13-3m-14 10 13 2"/>`
  : `<path d="M-20-14c12-16 28-16 40 0l14 1 4 29-16-1c-1 24-43 24-44 0l-16 1 4-29 14-1Z"/><path d="m-20-14-2 29m42-29 2 29m-33-13h1m20 0h1M-3 11h6m-3 0v9"/>`;
function snacks(index) {
  let result = '';
  for (let i = 0; i < 11; i++) {
    const x = 100 + (i * 23 % 78), y = 230 + (i * 17 % 43), rotation = i * 47 % 140;
    const colors = ['#dca76e', '#a05d34', '#dc9474', '#c59144', '#e7b84f', '#9e6649', '#e4b897', '#b37d48'];
    if (index === 3 || index === 7) result += `<rect x="${x - 10}" y="${y - 3}" width="30" height="7" rx="3" fill="${colors[index]}" stroke="#8a5a2e55" transform="rotate(${rotation} ${x} ${y})"/>`;
    else if (index === 4) result += `<circle cx="${x}" cy="${y}" r="9" fill="${colors[index]}" stroke="#c79b38"/><circle cx="${x - 2}" cy="${y - 3}" r="3" fill="#f6d87c" opacity=".6"/>`;
    else if (index === 6) result += `<path d="M${x-7} ${y-9}q22-7 14 13-8 9-14-1 18 7 13-8-2-7-13-4Z" fill="${colors[index]}" stroke="#c88d6955"/>`;
    else result += `<path d="M${x-7} ${y-9}l15 2 3 13-15 4-6-9Z" fill="${colors[index]}" stroke="#8a5a2e44" transform="rotate(${rotation} ${x} ${y})"/><path d="M${x-5} ${y-6}l9 1" stroke="#ffebc355" stroke-width="2"/>`;
  }
  return result;
}
for (const [index, p] of products.entries()) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="270" height="330" viewBox="0 0 270 330">
  <defs><linearGradient id="bag" x1="0" x2="1"><stop stop-color="#e9dfc7"/><stop offset=".13" stop-color="#fff8e7"/><stop offset=".55" stop-color="#fff9e9"/><stop offset=".95" stop-color="#eadfc9"/><stop offset="1" stop-color="#d8cbb1"/></linearGradient><linearGradient id="color" x1="0" x2="1"><stop stop-color="${p.color}"/><stop offset=".7" stop-color="${p.color}"/><stop offset="1" stop-color="#6b5233" stop-opacity=".3"/></linearGradient><linearGradient id="window" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#bdae9755"/><stop offset=".5" stop-color="#efe3c277"/><stop offset="1" stop-color="#a68a6055"/></linearGradient><clipPath id="bag-clip"><path d="M62 19Q135 15 208 19l-6 30 11 250q-77 16-154 0L68 49Z"/></clipPath><clipPath id="food-clip"><rect x="84" y="220" width="104" height="59" rx="19"/></clipPath></defs>
  <ellipse cx="136" cy="308" rx="76" ry="6" fill="#6d513d" opacity=".08"/>
  <path d="M62 19Q135 15 208 19l-6 30 11 250q-77 16-154 0L68 49Z" fill="url(#bag)" stroke="#bba88d" stroke-width=".7"/>
  <g clip-path="url(#bag-clip)"><path d="M59 80q76 14 154 0v137q-79 13-154 0Z" fill="url(#color)"/>
  <path d="M65 22q69-3 140 0m-139 6q69-3 138 0" stroke="#c7b899" stroke-width="1"/><path d="M70 49h130" stroke="#b9aa8f" stroke-width="1.1"/>
  <text x="136" y="66" text-anchor="middle" fill="#71634c" font-family="Arial,sans-serif" font-size="6.8" letter-spacing="2.1">LITTLE TREATS, BIG LOVE</text>
  <g transform="translate(123 91) scale(.95)" color="#fff8e9">${paw}</g>
  <text x="135" y="131" text-anchor="middle" fill="#504835" font-family="Microsoft YaHei,PingFang SC,sans-serif" font-weight="700" font-size="16" letter-spacing="2">爪爪零食铺</text>
  <text x="135" y="143" text-anchor="middle" fill="#625842" font-family="Arial,sans-serif" font-size="5.6" letter-spacing="2">PAW PAW PANTRY</text>
  <g transform="translate(135 178) scale(.57)" fill="none" stroke="#fff8e9" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round">${doodle(p.pet)}</g>
  <text x="135" y="207" text-anchor="middle" fill="#554932" font-family="Arial,sans-serif" font-size="6.1" font-weight="600" letter-spacing="1">${english[index]}</text>
  <rect x="84" y="220" width="104" height="59" rx="19" fill="url(#window)" stroke="#bbab8a" stroke-width=".6"/>
  <g clip-path="url(#food-clip)">${snacks(index)}</g><path d="M91 232q4-6 13-6h65" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width="2"/>
  <text x="135" y="293" text-anchor="middle" fill="#8b7b60" font-family="Microsoft YaHei,sans-serif" font-size="6.5" letter-spacing="1.2">${p.weight} · 为爱挑选</text>
  <path d="m67 52-5 242m138-241 8 239" stroke="#fff" stroke-opacity=".55" stroke-width="1.3"/>
  </g><path d="m59 299 9-9m145 9-9-9" stroke="#c6b698" stroke-width="1"/>
  </svg>`;
  await writeFile(new URL(`./${p.id}.svg`, import.meta.url), svg);
}
console.log('Generated 8 product packaging illustrations.');
