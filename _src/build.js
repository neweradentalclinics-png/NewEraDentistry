// بناء الموقع: بيترجم _src/website.jsx ويحطه في index.html، ويولّد CSS بتاع Tailwind من الكلاسات المستخدمة.
// الاستخدام: node _src/build.js   (محتاج esbuild + playwright — موجودين في /opt/npm-tools)
// المصدر مش بيتنشر مع الموقع (فولدر _src متجاهل في .vercelignore).
const fs = require('fs'), path = require('path');
const NM = process.env.NM || '/opt/npm-tools/node_modules';
const esbuild = require(NM + '/esbuild');
const ROOT = path.join(__dirname, '..');
const SRC = path.join(__dirname, 'website.jsx'), OUT = path.join(ROOT, 'index.html');

async function tailwind(src) {
  const { chromium } = require(NM + '/playwright');
  const toks = [...new Set(src.split(/[\s"'`{};]+/).filter(t => t && t.length < 120 && /^[!a-z0-9@\[\-:\/.%#_&>~*=+]/i.test(t) && !/^https?:/.test(t)))];
  const b = await chromium.launch(); const p = await b.newPage();
  await p.setContent('<!doctype html><html><head></head><body><div id="all"></div></body></html>');
  await p.addScriptTag({ path: path.join(__dirname, 'tw-play-3.js') });
  await p.evaluate(c => { (0, eval)(c); }, fs.readFileSync(path.join(__dirname, 'tailwind.config.js'), 'utf8'));
  await p.evaluate(t => { const d = document.getElementById('all'); for (let i = 0; i < t.length; i += 400) { const e = document.createElement('i'); e.className = t.slice(i, i + 400).join(' '); d.appendChild(e); } }, toks);
  let css = '', last = -1;
  for (let i = 0; i < 40; i++) { await p.waitForTimeout(250); css = await p.evaluate(() => [...document.querySelectorAll('style')].map(s => s.textContent).join('\n')); if (css.length && css.length === last) break; last = css.length; }
  await b.close();
  if (css.length < 5000) throw new Error('tailwind css too small');
  return css;
}

(async () => {
  const src = fs.readFileSync(SRC, 'utf8');
  let html = fs.readFileSync(OUT, 'utf8');
  const js = esbuild.transformSync(src, { loader: 'jsx', minify: true, target: 'es2019', charset: 'utf8' }).code.replace(/<\/script/gi, '<\\/script').trim();
  const a = html.indexOf('    <script>const{'), b = html.indexOf('</script>', a);
  if (a < 0 || b < 0) throw new Error('app script not found in index.html');
  html = html.slice(0, a) + '    <script>' + js + html.slice(b);
  if (!process.argv.includes('--no-css')) {
    const css = (await tailwind(src)).replace(/<\/style/gi, '<\\/style');
    html = html.replace(/<style id="tw">[\s\S]*?<\/style>/, () => '<style id="tw">' + css + '</style>');
  }
  if (/x-jsx-source/.test(html)) throw new Error('source must not be embedded in index.html');
  fs.writeFileSync(OUT, html);
  const v = (src.match(/SITE_VERSION = '([^']+)'/) || [])[1];
  console.log('built index.html', html.length, 'bytes, v' + v);
})().catch(e => { console.error(e); process.exit(1); });
