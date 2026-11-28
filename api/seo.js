// صفحات حقيقية لجوجل: صفحة لكل فرع، صفحة لكل خدمة، وصفحة لكل "خدمة + فرع" (زي: زراعة أسنان حلوان) + sitemap.xml
// البيانات بتتسحب من نفس قاعدة البيانات: الفروع والأسعار من السيستم، الخدمات والأسئلة من لوحة الموقع.
// الصفحة بتتخزن على سيرفرات Vercel ساعة، فأي تعديل في البيانات بيبان خلال ساعة بالكتير.
const { BRANCH_TXT, SVC_SLUG, AREA_SLUG, TITLE_SLUG, S, KW_TITLE, PRICE_RE, EXTRA, COMBO, NEAR } = require('./_content.js');
const { POSTS } = require('./_blog.js');

const PROJECT = 'new-era-dental-center';
const FS = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`;
const SITE = 'https://neweradentalcenter.com';
const BRAND = 'نيو إيرا لطب الأسنان';
const BRAND_EN = 'New Era Dental Center';
const DEFAULT_LOGO = 'https://i.ibb.co/qLw7Tcqv/logo-Dr-shahenda-original.png';
let LOGO = DEFAULT_LOGO; // بيتغير من اللوحة (التسويق و SEO ← اللوجو)
const PAGES_VERSION = '1.9';

// ---------- قراءة قاعدة البيانات ----------
const val = v => {
  if (!v) return null;
  if ('stringValue' in v) return v.stringValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return v.doubleValue;
  if ('booleanValue' in v) return v.booleanValue;
  if ('timestampValue' in v) return v.timestampValue;
  if ('arrayValue' in v) return (v.arrayValue.values || []).map(val);
  if ('mapValue' in v) return obj(v.mapValue.fields || {});
  return null;
};
const obj = f => Object.fromEntries(Object.entries(f || {}).map(([k, v]) => [k, val(v)]));
const getJSON = async (url, opt) => { const r = await fetch(url, opt); if (!r.ok) throw new Error(url + ' ' + r.status); return r.json(); };
const listAll = async col => { let out = [], tok = ''; for (let i = 0; i < 10; i++) { const j = await getJSON(`${FS}/${col}?pageSize=300${tok ? '&pageToken=' + encodeURIComponent(tok) : ''}`); out = out.concat(j.documents || []); if (!j.nextPageToken) break; tok = j.nextPageToken; } return out; };

// ---------- الروابط ----------
const latin = s => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const areaHit = b => AREA_SLUG.find(([ar]) => String(b.name || '').includes(ar));
function branchSlug(b) {
  if (b.slug && latin(b.slug)) return latin(b.slug);
  const hit = areaHit(b);
  return hit ? hit[1] : 'branch-' + latin(b.id).slice(0, 12);
}
// اسم المنطقة القصير للعناوين (الإخصاص - الصف ← الصف)
const areaOf = b => { const h = areaHit(b); return h ? h[0].replace(/^اكتوبر$/, 'أكتوبر') : String(b.name || '').replace(/^فرع\s*/, '').trim(); };
const fullArea = b => String(b.name || '').replace(/^فرع\s*/, '').trim();
function svcSlug(s) {
  if (s.slug && latin(s.slug)) return latin(s.slug);
  if (SVC_SLUG[s.id]) return SVC_SLUG[s.id];
  const t = String(s.title || ''), hit = TITLE_SLUG.find(([re]) => re.test(t));
  if (hit) return hit[1];
  return latin(s.titleEn) || latin(s.id) || 'service';
}
const SLUG_KEY = Object.fromEntries(Object.entries(SVC_SLUG).filter(([id]) => S[id] && !['rootcanal', 'endo'].includes(id)).map(([id, sl]) => [sl, id]).concat([['veneers', 'veneers'], ['root-canal', 'root-canal'], ['clear-aligners', 'clear-aligners']]));
const keyOf = s => (S[s.id] && !['rootcanal', 'endo'].includes(s.id)) ? s.id : (SLUG_KEY[s.slug || svcSlug(s)] || s.id);

let CACHE = { t: 0, data: null };
// نسخة احتياطية ثابتة من البيانات (api/_snapshot.json): لو قاعدة البيانات مردتش (حصة القراءات خلصت أو عطل)
// الصفحات بتطلع عادي بدل ما جوجل يشوف 404 — وده كان سبب صفحات الـ 404 في Search Console.
let SNAP = null;
const snap = () => { if (SNAP) return SNAP; try { SNAP = require('./_snapshot.json'); } catch (e) { SNAP = {}; } return SNAP; };
const fsDoc = o => ({ fields: Object.fromEntries(Object.entries(o || {}).map(([k, v]) => [k, toFs(v)])) });
const toFs = v => v == null ? { nullValue: null } : Array.isArray(v) ? { arrayValue: { values: v.map(toFs) } } : typeof v === 'object' ? { mapValue: fsDoc(v) } : typeof v === 'number' ? { doubleValue: v } : typeof v === 'boolean' ? { booleanValue: v } : { stringValue: String(v) };
const asDocs = list => (list || []).map(x => ({ name: 'x/' + (x.id || ''), ...fsDoc(x) }));
async function loadData() {
  // ساعة كاملة (توفير قراءات قاعدة البيانات) — ولو القراءة فشلت بنكمّل بآخر بيانات سليمة أو بالنسخة الاحتياطية
  if (CACHE.data && Date.now() - CACHE.t < 60 * 60 * 1000 && !(CACHE.due && Date.now() >= CACHE.due)) return CACHE.data;
  let [siteDoc, brs, faqRows, prices, docs, specs] = await Promise.all([
    getJSON(`${FS}/settings/site`).catch(() => null),
    listAll('branches').catch(() => null),
    getJSON(`${FS}:runQuery`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ structuredQuery: { from: [{ collectionId: 'faqs' }], where: { fieldFilter: { field: { fieldPath: 'published' }, op: 'EQUAL', value: { booleanValue: true } } }, limit: 400 } })
    }).catch(() => null),
    listAll('services').catch(() => null),
    listAll('public_doctors').catch(() => null),
    listAll('specialties').catch(() => null)
  ]);
  const broken = !siteDoc || !brs || !brs.length;
  if (broken && CACHE.data) { CACHE.t = Date.now() - 55 * 60 * 1000; return CACHE.data; }
  const S0 = snap();
  if (!siteDoc) siteDoc = fsDoc(S0.site || {});
  if (!brs || !brs.length) brs = asDocs(S0.branches);
  if (!faqRows) faqRows = (S0.faqs || []).map(f => ({ document: fsDoc(f) }));
  if (!prices) prices = asDocs(S0.services);
  if (!docs) docs = asDocs(S0.doctors);
  if (!specs) specs = asDocs(S0.specialties);
  const cfg = siteDoc ? obj(siteDoc.fields) : {};
  cfg.seo = cfg.seo && typeof cfg.seo === 'object' ? cfg.seo : {};
  LOGO = /^https?:\/\//.test(String(cfg.seo.logo || '')) ? cfg.seo.logo : DEFAULT_LOGO;
  const branches = brs.map(d => ({ id: d.name.split('/').pop(), ...obj(d.fields) }))
    .filter(b => b.name && b.active !== false && b.hidden !== true)
    .sort((a, b) => (a.order ?? 999) - (b.order ?? 999) || String(a.name).localeCompare(String(b.name), 'ar'));
  const faqs = (Array.isArray(faqRows) ? faqRows : []).filter(r => r.document).map(r => obj(r.document.fields)).filter(f => f.q && f.a);
  const priceList = prices.map(d => obj(d.fields)).filter(p => p.name && p.active !== false && num(p.priceFrom) > 0);
  // التخصصات وأيامها في كل فرع (من غير أسماء الدكاترة — الدكاترة مش بيظهروا للزوار)
  const specName = Object.fromEntries(specs.map(d => [d.name.split('/').pop(), String(obj(d.fields).name || '')]));
  const doctors = docs.map(d => obj(d.fields)).map(d => ({ specs: (Array.isArray(d.specs) ? d.specs : []).map(x => specName[x]).filter(Boolean), days: d.days && typeof d.days === 'object' ? d.days : {} }));
  const used = new Set();
  const uniq = sl => { let x = sl; while (used.has(x)) x += '-2'; used.add(x); return x; };
  branches.forEach(b => { b.slug = uniq(branchSlug(b)); b.area = areaOf(b); b.page = ((cfg.branchPages || {})[b.id]) || {}; b.sched = schedOf(b, doctors); });
  let services = (Array.isArray(cfg.services) && cfg.services.length ? cfg.services : ['exam', 'xray', 'fillings', 'fixed-prosthetics', 'removable-prosthetics', 'ortho', 'implants', 'kids', 'whitening', 'jaw-surgery', 'hollywood'].map(id => ({ id, title: S[id].kw })))
    .filter(s => s && s.id && !s.hidden && (s.title || (S[s.id] && S[s.id].kw)))
    .map(s => ({ ...s }));
  services.forEach(s => { s.slug = uniq(svcSlug(s)); s.key = keyOf(s); });
  EXTRA.forEach(x => { if (!services.some(s => s.key === x.id || s.slug === x.slug)) { const s = { id: x.id, title: x.title, slug: uniq(x.slug), key: x.id, extra: true }; services.push(s); } });
  services.forEach(s => { s.kw = KW_TITLE[s.key] || s.title; s.price = priceOf(s.key, priceList); });
  const combos = [];
  COMBO.forEach(k => { const s = services.find(x => x.key === k); if (s) branches.forEach(b => combos.push({ s, b, slug: uniq(s.slug + '-' + b.slug) })); });
  const data = { cfg, branches, services, faqs, combos, examFee: (priceOf('exam', priceList) || {}).min || 0 };
  // لو اشتغلنا من النسخة الاحتياطية نجرّب قاعدة البيانات تاني بعد 5 دقايق
  // لو في مقال مجدول هينزل قبل ما الكاش يخلص، نقرا البيانات تاني في ميعاده بالظبط
  const due = nextDue(cfg);
  CACHE = { t: broken ? Date.now() - 55 * 60 * 1000 : Date.now(), data, due: due ? Date.now() + due : 0 };
  return data;
}

// أيام كل تخصص في الفرع (0 = الأحد)
const DAY_AR = ['الأحد', 'الاتنين', 'التلات', 'الأربع', 'الخميس', 'الجمعة', 'السبت'];
function schedOf(b, doctors) {
  const m = {};
  doctors.forEach(d => { const days = Array.isArray(d.days[b.id]) ? d.days[b.id] : []; if (!days.length) return; d.specs.forEach(sp => { m[sp] = m[sp] || new Set(); days.forEach(x => m[sp].add(Number(x))); }); });
  const off = new Set((b.daysOff || []).map(Number));
  return Object.entries(m).map(([sp, set]) => [sp, [...set].filter(x => x >= 0 && x < 7 && !off.has(x)).sort((a, c) => ((a + 1) % 7) - ((c + 1) % 7))]).filter(x => x[1].length).sort((a, c) => c[1].length - a[1].length);
}
const daysTxt = ds => ds.length >= 6 ? 'كل يوم' : joinAr(ds.map(x => DAY_AR[x]));
const offTxt = b => { const o = (b.daysOff || []).map(Number).filter(x => x >= 0 && x < 7); return o.length ? joinAr(o.map(x => DAY_AR[x])) + ' إجازة' : 'مفتوح كل أيام الأسبوع'; };

// ---------- الأسعار (من "الخدمات والأسعار" في السيستم) ----------
const num = v => { const n = Number(String(v == null ? '' : v).replace(/[^\d.]/g, '')); return isFinite(n) ? n : 0; };
const money = n => num(n).toLocaleString('en-US') + ' جنيه';
function priceOf(key, list) {
  const re = PRICE_RE[key]; if (!re) return null;
  let items = list.filter(p => re.test(String(p.name)));
  if (key === 'ortho') items = items.filter(p => !PRICE_RE['clear-aligners'].test(String(p.name))).concat(items.filter(p => PRICE_RE['clear-aligners'].test(String(p.name))));
  if (!items.length) return null;
  const min = Math.min(...items.map(p => num(p.priceFrom)));
  return { min, items: items.slice(0, 8) };
}
const priceText = p => { const a = num(p.priceFrom), b = num(p.priceTo); return (!b || b === a) ? money(a) : a.toLocaleString('en-US') + ' – ' + money(b); };
const fromTxt = s => s.price ? `تبدأ من ${money(s.price.min)}` : '';

// ---------- أدوات ----------
const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const clip = (s, n) => { s = String(s || '').replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n - 1).replace(/\s+\S*$/, '') + '…' : s; };
const joinAr = a => a.length <= 1 ? (a[0] || '') : a.slice(0, -1).join('، ') + ' و' + a[a.length - 1];
const telOf = p => String(p || '').replace(/[^\d+]/g, '').replace(/^0/, '+20');
const waOf = cfg => 'https://wa.me/' + String(cfg.whatsapp || '201121593393').replace(/\D/g, '');
const phonesOf = (cfg, b) => [...new Set([b && b.phone, ...((cfg.phones || []))].filter(Boolean).map(String))];
const hoursOf = (cfg, b) => (b && b.hours) || (cfg.hours && cfg.hours.ar) || '';
const mapSrc = b => {
  const e = String(b.mapEmbed || '').trim();
  const m = e.match(/src=["']([^"']+)["']/); if (m) return m[1];
  if (/^https:\/\/(www\.)?google\.[^/]+\/maps\/embed/.test(e)) return e;
  const ll = String(b.mapsLink || '').match(/@(-?\d+\.\d+),(-?\d+\.\d+)/) || String(b.mapsLink || '').match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);
  const q = ll ? ll[1] + ',' + ll[2] : [BRAND, b.name, b.address].filter(Boolean).join(' ');
  return 'https://maps.google.com/maps?q=' + encodeURIComponent(q) + '&z=16&hl=ar&output=embed';
};
const faqNorm = t => String(t || '').replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').replace(/^ال/, '').trim();
const faqForSvc = (f, sv) => {
  if (f.svc) return f.svc === sv.id;
  const tp = faqNorm(f.topic); if (tp.length < 3) return false;
  const ti = faqNorm(sv.title) + ' ' + faqNorm(sv.titleEn);
  return ti.split(/\s+/).some(w => { w = w.replace(/^ال/, ''); return w.length >= 3 && (tp.includes(w) || w.includes(tp)); });
};
const nearOf = b => NEAR[b.slug] || [];
const comboFor = (data, s, b) => data.combos.find(c => c.s === s && c.b === b);
const descOf = s => s.desc || (S[s.key] || {}).desc || '';

// ---------- الشكل ----------
const CSS = `*{box-sizing:border-box}body{margin:0;font-family:Tajawal,system-ui,sans-serif;background:#FDFCFB;color:#1f2937;line-height:1.9;font-size:16px}a{color:#B8941F}
.w{max-width:960px;margin:0 auto;padding:0 16px}header{background:#fff;border-bottom:1px solid #eee;position:sticky;top:0;z-index:5}
header .w{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 16px}header img{height:42px;width:auto}
nav a{color:#374151;font-weight:800;text-decoration:none;margin-inline-start:14px;font-size:14px}nav a.b{background:#D4AF37;color:#fff;padding:8px 14px;border-radius:12px}
.hero{background:linear-gradient(135deg,#111827,#1f2937);color:#fff;padding:36px 0 30px}.hero h1{font-size:30px;line-height:1.4;margin:6px 0 10px;font-weight:900}
.hero p{color:#d1d5db;margin:0 0 18px;font-weight:500}.crumb{font-size:13px;color:#9ca3af}.crumb a{color:#D4AF37;text-decoration:none}
.cta{display:flex;flex-wrap:wrap;gap:10px}.cta a{display:inline-flex;align-items:center;gap:6px;padding:11px 18px;border-radius:14px;font-weight:900;text-decoration:none;font-size:15px}
.c1{background:#D4AF37;color:#fff}.c2{background:#25D366;color:#fff}.c3{background:#fff;color:#111827}
main{padding:26px 0 10px}section{background:#fff;border:1px solid #f0f0f0;border-radius:20px;padding:20px 22px;margin-bottom:16px}
h2{font-size:21px;margin:0 0 8px;font-weight:900;color:#111827}h3{font-size:17px;margin:12px 0 4px;font-weight:800}p{margin:0 0 10px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px}.card{display:block;border:1px solid #eee;border-radius:16px;padding:14px;text-decoration:none;color:inherit;background:#fffdf7}
.card b{display:block;color:#111827;font-size:16px}.card span{font-size:13.5px;color:#6b7280;line-height:1.7}
.info{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:10px}.info div{background:#FDFCFB;border:1px solid #f0f0f0;border-radius:14px;padding:12px}
.info small{display:block;color:#9ca3af;font-weight:800;font-size:12px}.info strong{font-size:15px}
.map{border:0;width:100%;height:320px;border-radius:16px;margin-top:10px}.img{width:100%;max-height:360px;object-fit:cover;border-radius:16px;margin-bottom:12px;background:#f3f4f6}
details{border-bottom:1px solid #f1f1f1;padding:10px 0}summary{font-weight:800;cursor:pointer}details p{margin:8px 0 0;color:#4b5563}
.tags a{display:inline-block;background:#FFFBEB;border:1px solid #FDE68A;color:#92400e;border-radius:999px;padding:4px 12px;margin:4px 0 0 6px;font-size:14px;font-weight:700;text-decoration:none}
footer{background:#111827;color:#9ca3af;padding:22px 0;margin-top:20px;font-size:14px}footer a{color:#e5e7eb;text-decoration:none;margin-inline-end:12px;line-height:2.2}footer .v{font-size:11px;color:#4b5563;margin-top:8px}
ol,ul{margin:0 0 10px;padding-inline-start:22px}@media(max-width:640px){.hero h1{font-size:24px}nav a:not(.b){display:none}section{padding:16px}}`;

const CSS2 = `.price{display:flex;align-items:center;gap:12px;flex-wrap:wrap;background:#FFFBEB;border:1px solid #FDE68A;border-radius:16px;padding:14px 16px;margin:4px 0 12px}
.price b{font-size:22px;color:#92400e}.price small{color:#92400e;font-weight:700}.ptable{width:100%;border-collapse:collapse;font-size:15px}.ptable td{padding:8px 4px;border-bottom:1px solid #f3f3f3}.ptable td:last-child{text-align:left;font-weight:800;white-space:nowrap}.note{font-size:13px;color:#6b7280}`;

// ---------- أدوات القياس والتحقق (من اللوحة ← التسويق و SEO) ----------
const TRK = { ga4: /^G-[A-Z0-9]{4,}$/i, gtm: /^GTM-[A-Z0-9]{4,}$/i, pixel: /^\d{8,20}$/, tiktok: /^[A-Z0-9]{10,30}$/i, adsBook: /^AW-\d{6,}\/[\w-]{4,}$/i, adsContact: /^AW-\d{6,}\/[\w-]{4,}$/i };
const trkVal = (se, k) => { const v = String(se[k] || '').trim(); if (!TRK[k].test(v)) return ''; return k === 'pixel' ? v : k.startsWith('ads') ? 'AW-' + v.slice(3) : v.toUpperCase(); };
const attrOk = v => /^[A-Za-z0-9_\-.:=+/]{6,120}$/.test(String(v || '').trim()) ? String(v).trim() : '';
function headExtras(cfg) {
  const se = cfg.seo || {}, out = [];
  const g = attrOk(se.gsc), b = attrOk(se.bing);
  if (g) out.push(`<meta name="google-site-verification" content="${esc(g)}">`);
  if (b) out.push(`<meta name="msvalidate.01" content="${esc(b)}">`);
  const gtm = trkVal(se, 'gtm'), ga = trkVal(se, 'ga4'), px = trkVal(se, 'pixel'), tt = trkVal(se, 'tiktok');
  if (gtm) out.push(`<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s);j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtm}');</script>`);
  if (ga) out.push(`<script async src="https://www.googletagmanager.com/gtag/js?id=${ga}"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${ga}');</script>`);
  const ab = trkVal(se, 'adsBook'), ac = trkVal(se, 'adsContact'), aw = (ab || ac).split('/')[0];
  if (aw) out.push(`${ga ? '' : `<script async src="https://www.googletagmanager.com/gtag/js?id=${aw}"></script>`}<script>window.dataLayer=window.dataLayer||[];if(!window.gtag){window.gtag=function(){dataLayer.push(arguments);};gtag('js',new Date());}gtag('config','${aw}');window.__neAds={c:'${ac}'};</script>`);
  if (px) out.push(`<script>!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${px}');fbq('track','PageView');</script>`);
  if (tt) out.push(`<script>!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=['page','track','identify','instances','debug','on','off','once','ready','alias','group','enableCookie','disableCookie'];ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};ttq.load=function(e,n){var i='https://analytics.tiktok.com/i18n/pixel/events.js';ttq._i=ttq._i||{};ttq._i[e]=[];ttq._i[e]._u=i;ttq._t=ttq._t||{};ttq._t[e]=+new Date;ttq._o=ttq._o||{};ttq._o[e]=n||{};var o=d.createElement('script');o.async=!0;o.src=i+'?sdkid='+e+'&lib='+t;var a=d.getElementsByTagName('script')[0];a.parentNode.insertBefore(o,a)};ttq.load('${tt}');ttq.page();}(window,document,'ttq');</script>`);
  return out.join('');
}
// ضغطات الواتساب والاتصال بتتسجل كتحويلات
const trackClicks = cfg => { const se = cfg.seo || {}; if (!['ga4', 'gtm', 'pixel', 'tiktok', 'adsBook', 'adsContact'].some(k => trkVal(se, k))) return '';
  return `<script>document.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('a[href]');if(!a)return;var u=a.getAttribute('href')||'',k=/wa\\.me/.test(u)?'whatsapp':/^tel:/.test(u)?'call':/#book/.test(u)?'book_click':'';if(!k)return;try{window.dataLayer&&dataLayer.push({event:'ne_'+k});window.gtag&&gtag('event',k==='book_click'?'begin_checkout':'contact_'+k,{method:k});if(k!=='book_click'&&window.gtag&&window.__neAds&&__neAds.c)gtag('event','conversion',{send_to:__neAds.c});window.fbq&&fbq('track',k==='book_click'?'InitiateCheckout':'Contact');window.ttq&&ttq.track&&ttq.track(k==='book_click'?'ClickButton':'Contact')}catch(x){}},true);</script>`; };

function layout({ title, desc, path, h1, lead, crumb, body, schema, data, image }) {
  const { cfg, branches, services } = data;
  const ph = phonesOf(cfg)[0];
  const url = SITE + path;
  return `<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title><meta name="description" content="${esc(desc)}"><link rel="canonical" href="${url}">
<meta property="og:type" content="website"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${url}"><meta property="og:locale" content="ar_EG"><meta property="og:image" content="${esc(image || cfg.seo.ogImage || LOGO)}"><meta name="twitter:card" content="summary_large_image"><meta name="theme-color" content="#D4AF37">
<link rel="icon" href="${LOGO}">${headExtras(cfg)}<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@500;700;800;900&display=swap" rel="stylesheet">
<style>${CSS}${CSS2}</style>${schema.map(s => `<script type="application/ld+json">${JSON.stringify(s).replace(/</g, '\\u003c')}</script>`).join('')}</head><body>
<header><div class="w"><a href="/"><img src="${LOGO}" alt="${BRAND}" width="120" height="42"></a><nav><a href="/">الرئيسية</a><a href="/#services">الخدمات</a><a href="/blog">المدونة</a>${ph ? `<a href="tel:${telOf(ph)}">اتصل بنا</a>` : ''}<a class="b" href="/#book">احجز موعد</a></nav></div></header>
<div class="hero"><div class="w"><div class="crumb">${crumb}</div><h1>${esc(h1)}</h1><p>${esc(lead)}</p>
<div class="cta"><a class="c1" href="/#book">📅 احجز موعدك أونلاين</a><a class="c2" href="${waOf(cfg)}" rel="nofollow">💬 واتساب</a>${ph ? `<a class="c3" href="tel:${telOf(ph)}">📞 ${esc(ph)}</a>` : ''}</div></div></div>
<main class="w">${body}</main>
<footer><div class="w"><div><b style="color:#fff">فروعنا:</b> ${branches.map(b => `<a href="/${b.slug}">عيادة أسنان ${esc(b.area)}</a>`).join('')}</div>
<div><b style="color:#fff">خدماتنا:</b> ${services.map(s => `<a href="/${s.slug}">${esc(s.title)}</a>`).join('')}</div>
<div><b style="color:#fff">المدونة:</b> <a href="/blog">نصايح ومعلومات عن الأسنان</a></div>
<div class="v">© ${BRAND_EN} · v${PAGES_VERSION}</div></div></footer>${trackClicks(cfg)}</body></html>`;
}

const faqBlock = (list, title) => list.length ? `<section><h2>${esc(title)}</h2>${list.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</section>` : '';
const faqSchema = list => list.length ? [{ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: list.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) }] : [];
const crumbSchema = items => ({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: items.map(([name, path], i) => ({ '@type': 'ListItem', position: i + 1, name, item: SITE + path })) });
const PRICE_NOTE = 'الأسعار تقريبية وبتختلف حسب الحالة، والسعر النهائي بيتحدد بعد الكشف والأشعة وبيتكتبلك في خطة العلاج قبل ما تبدأ.';

function priceBox(s, where) {
  if (!s.price) return `<div class="price"><small>💰 سعر ${esc(s.kw)}${where ? ' ' + esc(where) : ''} بيتحدد بعد الكشف حسب حالتك — <a href="/#book">احجز كشف</a> أو اسألنا على واتساب.</small></div>`;
  return `<div class="price"><small>💰 أسعار ${esc(s.kw)}${where ? ' ' + esc(where) : ''} تبدأ من</small><b>${esc(money(s.price.min))}</b></div>`;
}
function priceTable(s) {
  if (!s.price) return '';
  return `<table class="ptable">${s.price.items.map(p => `<tr><td>${esc(p.name)}</td><td>${esc(priceText(p))}</td></tr>`).join('')}</table><p class="note">${PRICE_NOTE}</p>`;
}

function dentistSchema(b, cfg, path) {
  const s = {
    '@context': 'https://schema.org', '@type': 'Dentist', '@id': SITE + '/' + b.slug + '#clinic',
    name: `${BRAND} - فرع ${b.area}`, alternateName: `${BRAND_EN} - ${b.slug}`, url: SITE + '/' + b.slug, image: LOGO, logo: LOGO,
    telephone: phonesOf(cfg, b).map(telOf)[0], priceRange: '$$',
    address: { '@type': 'PostalAddress', streetAddress: b.address || fullArea(b), addressLocality: b.area, addressRegion: ['فيصل', 'الهرم'].includes(b.area) ? 'الجيزة' : 'القاهرة', addressCountry: 'EG' },
    areaServed: [b.area, ...nearOf(b)].map(n => ({ '@type': 'Place', name: n })),
    parentOrganization: { '@type': 'Organization', name: BRAND, url: SITE }
  };
  if (b.mapsLink) s.hasMap = b.mapsLink;
  const ll = String(b.mapsLink || '').match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (ll) s.geo = { '@type': 'GeoCoordinates', latitude: Number(ll[1]), longitude: Number(ll[2]) };
  const h = hoursOf(cfg, b); if (h) s.description = 'مواعيد العمل: ' + h + ' — ' + offTxt(b);
  if (/^\d{1,2}:\d{2}$/.test(String(b.bookFrom || '')) && /^\d{1,2}:\d{2}$/.test(String(b.bookTo || ''))) {
    const EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], off = (b.daysOff || []).map(Number);
    s.openingHoursSpecification = [{ '@type': 'OpeningHoursSpecification', dayOfWeek: EN.filter((x, i) => !off.includes(i)), opens: b.bookFrom, closes: b.bookTo }];
  }
  const pics = (b.page.photos || []).filter(x => /^https?:/.test(String(x)));
  if (pics.length) s.image = pics.slice(0, 5);
  const sameAs = Object.values(cfg.socials || {}).filter(x => /^https?:/.test(String(x)));
  if (sameAs.length) s.sameAs = sameAs;
  return s;
}
let EXAM_FEE = 0;
const feeOf = b => String(b.consultFee || '').trim() || (EXAM_FEE ? money(EXAM_FEE) : '');
const branchInfo = (b, cfg) => {
  const ph = phonesOf(cfg, b), hours = hoursOf(cfg, b);
  return `<div class="info">
${b.address ? `<div><small>العنوان</small><strong>${esc(b.address)}</strong></div>` : ''}
${hours ? `<div><small>المواعيد</small><strong>${esc(hours)}</strong></div>` : ''}
${ph.length ? `<div><small>التليفون</small><strong dir="ltr">${ph.map(p => `<a href="tel:${telOf(p)}">${esc(p)}</a>`).join('<br>')}</strong></div>` : ''}
${feeOf(b) ? `<div><small>سعر الكشف</small><strong>${esc(feeOf(b))}</strong></div>` : ''}
<div><small>أيام الإجازة</small><strong>${esc(offTxt(b))}</strong></div>
${b.waitTime ? `<div><small>متوسط وقت الانتظار</small><strong>${esc(b.waitTime)}</strong></div>` : ''}
</div><iframe class="map" title="خريطة فرع ${esc(b.area)}" src="${esc(mapSrc(b))}" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe>
${b.mapsLink ? `<p style="margin-top:8px"><a href="${esc(b.mapsLink)}" rel="noopener" target="_blank">📍 افتح الموقع على خرائط جوجل</a></p>` : ''}`;
};

// ---------- صفحة الفرع: "دكتور أسنان في …" / "عيادة أسنان …" ----------
function branchPage(b, data) {
  const { cfg, branches, services } = data;
  const area = b.area, near = nearOf(b), hours = hoursOf(cfg, b), ph = phonesOf(cfg, b), T = BRANCH_TXT[b.slug] || {}, P = b.page || {};
  const others = branches.filter(x => x.id !== b.id);
  const priced = services.filter(s => s.price).sort((x, y) => x.price.min - y.price.min);
  const fee = feeOf(b), imp = services.find(s => s.key === 'implants' && s.price);
  // العنوان: الكلمة + سعر حقيقي + "احجز دلوقتي" (عشان اللي يشوفنا في جوجل يضغط) — وممكن يتغير من اللوحة لكل فرع
  const title = String(P.title || '').trim() || `دكتور أسنان في ${area} | كشف ${fee ? fee.replace(/\s*جنيه/, 'ج') : 'بسعر بسيط'}${imp ? ' وزراعة من ' + imp.price.min.toLocaleString('en-US') + 'ج' : ''} — احجز دلوقتي`;
  const pk = k => services.find(s => s.key === k && s.price);
  const deals = ['implants', 'fillings', 'root-canal', 'whitening', 'fixed-prosthetics'].map(pk).filter(Boolean).slice(0, 2).map(s => `${s.kw.split(' (')[0].replace(' التجميلي', '').replace(' بدون ألم', '')} من ${s.price.min.toLocaleString('en-US')}ج`);
  const desc = String(P.desc || '').trim() ? clip(P.desc, 160) : clip(`${[fee && 'كشف ' + fee, ...deals].filter(Boolean).join('، ')}. عيادة أسنان ${area}${T.short ? ' ' + T.short : ''}${hours ? '، ' + hours : ''}. احجز دلوقتي أونلاين أو واتساب.`, 160);
  const sched = b.sched || [];
  const faqs = [
    [`فين أقرب دكتور أسنان في ${area}؟`, `${BRAND} فرع ${area}${b.address ? ' في ' + b.address : ''}. تقدر تفتح المكان على خرائط جوجل من الخريطة اللي في الصفحة وتحجز أونلاين.`],
    hours && [`مواعيد عيادة الأسنان في ${area} إيه؟`, `مواعيد العمل: ${hours} (${offTxt(b)}). ويفضّل الحجز المسبق عشان ميكونش في انتظار.`],
    fee && [`سعر كشف الأسنان في ${area} كام؟`, `سعر الكشف في فرع ${area}: ${fee}. وبعد الكشف بتاخد خطة علاج مكتوبة فيها التكلفة المتوقعة.`],
    sched.some(x => /تقويم|زراع/.test(x[0])) && [`التقويم والزراعة في فرع ${area} أيام إيه؟`, sched.filter(x => /تقويم|زراع/.test(x[0])).map(([sp, ds]) => `${sp}: ${daysTxt(ds)}`).join('. ') + '. ويفضّل تحجز قبلها عشان تضمن ميعادك.'],
    ...priced.filter(s => COMBO.includes(s.key)).sort((x, y) => COMBO.indexOf(x.key) - COMBO.indexOf(y.key)).slice(0, 3).map(s => [`سعر ${s.kw} في ${area} كام؟`, `أسعار ${s.kw} تبدأ من ${money(s.price.min)}، والسعر النهائي بيتحدد بعد الكشف حسب حالتك.`]),
    near.length && [`الفرع قريب من ${joinAr(near)}؟`, `أيوه، فرع ${area} قريب من ${joinAr(near)}. افتح الخريطة في الصفحة وشوف أسهل طريق ليك.`],
    [`إزاي أحجز في عيادة ${area}؟`, `من زرار "احجز موعدك" تختار فرع ${area} واليوم والوقت، أو تكلمنا${ph[0] ? ' على ' + ph[0] : ''} أو تبعتلنا واتساب.`]
  ].filter(Boolean);
  const pics = (P.photos || []).filter(x => /^https?:/.test(String(x))).slice(0, 8);
  const about = String(P.about || '').split(/\n\s*\n/).map(x => x.trim()).filter(Boolean);
  const STOP = new Set(['علاج', 'اسنان', 'طب', 'وجه', 'جراحه', 'الفم']);
  const words = t => faqNorm(t).split(/\s+/).map(w => w.replace(/^و?ال/, '').replace(/^و(?=..)/, '')).filter(w => w.length >= 3 && !STOP.has(w));
  const svcLink = sp => { const ws = words(sp); let best = null, sc = 0; services.forEach(s => { const t = words(s.kw + ' ' + s.title).join(' '); const n = ws.filter(w => t.includes(w)).length; if (n > sc) { sc = n; best = s; } }); if (!best) return esc(sp); const c = comboFor(data, best, b); return `<a href="/${c ? c.slug : best.slug}">${esc(sp)}</a>`; };
  const body = `
<section><h2>عيادة أسنان في ${esc(area)}</h2>
${T.intro ? `<p>${esc(T.intro)}</p>` : ''}
${about.map(x => `<p>${esc(x)}</p>`).join('')}
<p>فرع ${esc(area)} من ${BRAND} بيقدّم كل خدمات طب وتجميل الأسنان للكبار والأطفال: من الكشف والحشو وعلاج العصب لحد زراعة الأسنان والتقويم المعدني والشفاف وابتسامة هوليود. بنبدأ بكشف وتشخيص واضح، وبنكتبلك خطة علاج بالترتيب والتكلفة قبل أي خطوة، وبنستخدم أدوات معقمة لكل مريض.</p></section>
${pics.length ? `<section><h2>صور فرع ${esc(area)}</h2><div class="grid">${pics.map((u, i) => `<img class="img" style="height:200px;margin:0" src="${esc(u)}" alt="عيادة أسنان ${esc(area)} - ${BRAND} ${i + 1}" loading="lazy" width="400" height="200">`).join('')}</div></section>` : ''}
${T.why ? `<section><h2>ليه تختار فرع ${esc(area)}؟</h2><ul>${T.why.map(x => `<li>${esc(x)}</li>`).join('')}</ul></section>` : ''}
<section><h2>عنوان ومواعيد عيادة ${esc(area)}</h2>${T.reach ? `<ul>${T.reach.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}${branchInfo(b, cfg)}</section>
${sched.length ? `<section><h2>التخصصات المتاحة في فرع ${esc(area)} وأيامها</h2><p>كل تخصص ليه دكتور متخصص بييجي الفرع في أيام محددة، فاختار اليوم المناسب وانت بتحجز:</p><table class="ptable">${sched.map(([sp, ds]) => `<tr><td>${svcLink(sp)}</td><td>${esc(daysTxt(ds))}</td></tr>`).join('')}</table><p class="note">الأيام ممكن تتغير في المواسم والأجازات — صفحة الحجز بتوريك المواعيد الفاضية الحقيقية.</p></section>` : ''}
${priced.length ? `<section><h2>أسعار الأسنان في فرع ${esc(area)}</h2><table class="ptable">${priced.map(s => { const c = comboFor(data, s, b); return `<tr><td><a href="/${c ? c.slug : s.slug}">${esc(s.kw)}</a></td><td>تبدأ من ${esc(money(s.price.min))}</td></tr>`; }).join('')}</table><p class="note">${PRICE_NOTE}</p></section>` : ''}
<section><h2>خدمات الأسنان في ${esc(area)}</h2><div class="grid">${services.map(s => { const c = comboFor(data, s, b); return `<a class="card" href="/${c ? c.slug : s.slug}"><b>${esc(c ? s.kw + ' في ' + area : s.title)}</b><span>${esc(clip(descOf(s), 100))}${s.price ? ' — ' + esc(fromTxt(s)) : ''}</span></a>`; }).join('')}</div></section>
${faqBlock(faqs, `أسئلة شائعة عن عيادة الأسنان في ${area}`)}
${b.reviewLink ? `<section><h2>رأيك يهمنا</h2><p>اتعالجت في فرع ${esc(area)}؟ <a href="${esc(b.reviewLink)}" rel="noopener" target="_blank">⭐ اكتب تقييمك على جوجل</a> — بيساعد غيرك يلاقي دكتور أسنان كويس في ${esc(area)}.</p></section>` : ''}
${others.length ? `<section><h2>فروعنا التانية</h2><div class="tags">${others.map(o => `<a href="/${o.slug}">دكتور أسنان في ${esc(o.area)}</a>`).join('')}</div></section>` : ''}`;
  return layout({
    title, desc, path: '/' + b.slug, h1: `دكتور أسنان في ${area} — ${BRAND}`, lead: `عيادة أسنان ${area}${near.length ? ' قريبة من ' + joinAr(near) : ''}${fee ? ' — كشف ' + fee : ''}. زراعة، تقويم، علاج عصب، تجميل وأطفال. احجز دلوقتي أونلاين.`, image: pics[0],
    crumb: `<a href="/">الرئيسية</a> › عيادة أسنان ${esc(area)}`, body, data,
    schema: [dentistSchema(b, cfg), crumbSchema([['الرئيسية', '/'], ['عيادة أسنان ' + area, '/' + b.slug]]), ...faqSchema(faqs)]
  });
}

// ---------- صفحة الخدمة ----------
function servicePage(s, data) {
  const { branches, services, faqs: allFaqs } = data;
  const C = S[s.key];
  const kw = s.kw;
  const areas = branches.map(b => b.area);
  const title = String(s.seoTitle || '').trim() || `${kw} في ${joinAr(areas)}${s.price ? ' | الأسعار ' + fromTxt(s) : ''} | ${BRAND}`;
  const desc = String(s.seoDesc || '').trim() ? clip(s.seoDesc, 160) : clip((C ? C.desc : descOf(s)) + (s.price ? ` الأسعار ${fromTxt(s)}.` : '') + (areas.length ? ` في فروع ${joinAr(areas)}.` : '') + ' احجز أونلاين.', 160);
  const dbFaqs = allFaqs.filter(f => faqForSvc(f, s)).map(f => [f.q, f.a]);
  const priceFaq = [`سعر ${kw} كام؟`, s.price ? `أسعار ${kw} تبدأ من ${money(s.price.min)}، والسعر النهائي بيتحدد بعد الكشف حسب حالتك وعدد الأسنان والمادة المستخدمة.` : `سعر ${kw} بيتحدد بعد الكشف حسب حالتك، وبتاخد خطة علاج مكتوبة فيها التكلفة قبل ما تبدأ.`];
  const faqs = [priceFaq, ...(C ? C.faqs : []), ...dbFaqs].filter((f, i, a) => a.findIndex(x => x[0] === f[0]) === i).slice(0, 12);
  const img = s.image && /^https?:/.test(s.image) ? s.image : '';
  const combos = data.combos.filter(c => c.s === s);
  const body = `
<section>${img ? `<img class="img" src="${esc(img)}" alt="${esc(kw)} - ${BRAND}" loading="eager" width="960" height="360">` : ''}
<h2>${esc(kw)} في ${BRAND}</h2>${priceBox(s)}${s.desc ? `<p>${esc(s.desc)}</p>` : ''}
${C ? '' : `<p>بنقدّم ${esc(kw)} بعد كشف وتشخيص دقيق، وبنشرحلك الخطوات والتكلفة المتوقعة قبل البدء. تقدر تحجز أونلاين أو تسألنا على واتساب.</p>`}</section>
${C ? C.body.map(([h, ps]) => `<section><h2>${esc(h)}</h2>${ps.map(p => `<p>${esc(p)}</p>`).join('')}</section>`).join('') : ''}
${s.price ? `<section><h2>أسعار ${esc(kw)}</h2>${priceTable(s)}</section>` : ''}
${branches.length ? `<section><h2>${esc(kw)} في فروعنا</h2><p>اختار الفرع الأقرب ليك:</p><div class="tags">${branches.map(b => { const c = combos.find(x => x.b === b); return `<a href="/${c ? c.slug : b.slug}">${esc(kw)} ${esc(b.area)}</a>`; }).join('')}</div></section>` : ''}
${faqBlock(faqs, `أسئلة شائعة عن ${kw}`)}
<section><h2>خدمات تانية ممكن تهمك</h2><div class="tags">${services.filter(x => x !== s).map(x => `<a href="/${x.slug}">${esc(x.kw)}</a>`).join('')}</div></section>`;
  const proc = { '@context': 'https://schema.org', '@type': 'MedicalWebPage', name: title, url: SITE + '/' + s.slug, inLanguage: 'ar', about: { '@type': 'MedicalProcedure', name: kw, description: C ? C.desc : (descOf(s) || kw) }, publisher: { '@type': 'Dentist', name: BRAND, url: SITE, logo: LOGO } };
  return layout({
    title, desc, path: '/' + s.slug, h1: `${kw} في ${joinAr(areas)}`, lead: (C ? C.desc : clip(descOf(s), 180)) + (s.price ? ` — الأسعار ${fromTxt(s)}.` : ''), image: img,
    crumb: `<a href="/">الرئيسية</a> › <a href="/#services">الخدمات</a> › ${esc(kw)}`, body, data,
    schema: [proc, crumbSchema([['الرئيسية', '/'], [kw, '/' + s.slug]]), ...faqSchema(faqs)]
  });
}

// ---------- صفحة "خدمة + فرع" (زراعة أسنان حلوان) ----------
function comboPage(c, data) {
  const { cfg, branches } = data;
  const { s, b } = c, C = S[s.key], kw = s.kw, area = b.area, near = nearOf(b), ph = phonesOf(cfg, b);
  const title = `${kw} في ${area}${s.price ? ' | ' + fromTxt(s) : ''} | ${BRAND} فرع ${area}`;
  const desc = clip(`${kw} في ${area}${b.address ? ' — ' + b.address : ''}.${s.price ? ' الأسعار ' + fromTxt(s) + '.' : ''} كشف وخطة علاج واضحة قبل البدء. احجز أونلاين أو كلمنا.`, 160);
  const faqs = [
    [`سعر ${kw} في ${area} كام؟`, s.price ? `أسعار ${kw} في فرع ${area} تبدأ من ${money(s.price.min)}. السعر النهائي بيتحدد بعد الكشف والأشعة حسب حالتك، وبيتكتبلك قبل ما تبدأ.` : `السعر بيتحدد بعد الكشف حسب حالتك، وبتاخد خطة علاج مكتوبة فيها التكلفة قبل ما تبدأ.`],
    [`فين أعمل ${kw} في ${area}؟`, `في ${BRAND} فرع ${area}${b.address ? ': ' + b.address : ''}${near.length ? '، قريب من ' + joinAr(near) : ''}.`],
    hoursOf(cfg, b) && [`مواعيد فرع ${area} إيه؟`, `مواعيد العمل: ${hoursOf(cfg, b)}.`],
    ...(C ? C.faqs.slice(0, 3) : [])
  ].filter(Boolean);
  const others = data.combos.filter(x => x.s === s && x.b !== b);
  const body = `
<section><h2>${esc(kw)} في ${esc(area)}</h2>${priceBox(s, 'في ' + area)}
<p>لو بتدوّر على ${esc(kw)} في ${esc(area)}${near.length ? ' أو ' + esc(joinAr(near)) : ''}، تقدر تعمله في فرع ${esc(area)} من ${BRAND}${b.address ? ' (' + esc(b.address) + ')' : ''}. بنبدأ بكشف ${s.key === 'implants' || s.key === 'clear-aligners' || s.key === 'ortho' ? 'وأشعة ' : ''}عشان نحدد المناسب لحالتك، وبنكتبلك خطة العلاج والتكلفة قبل أي خطوة.</p>
${C ? `<p>${esc(C.desc)}</p>` : (s.desc ? `<p>${esc(s.desc)}</p>` : '')}</section>
${C ? C.body.slice(0, 2).map(([h, ps]) => `<section><h2>${esc(h)}</h2>${ps.map(p => `<p>${esc(p)}</p>`).join('')}</section>`).join('') : ''}
${s.price ? `<section><h2>أسعار ${esc(kw)} في ${esc(area)}</h2>${priceTable(s)}</section>` : ''}
<section><h2>عنوان فرع ${esc(area)} ومواعيده</h2>${branchInfo(b, cfg)}</section>
${faqBlock(faqs, `أسئلة عن ${kw} في ${area}`)}
<section><h2>اعرف أكتر</h2><div class="tags"><a href="/${s.slug}">كل التفاصيل عن ${esc(kw)}</a><a href="/${b.slug}">عيادة أسنان ${esc(area)}</a>${others.map(o => `<a href="/${o.slug}">${esc(kw)} ${esc(o.b.area)}</a>`).join('')}</div></section>`;
  const page = { '@context': 'https://schema.org', '@type': 'MedicalWebPage', name: title, url: SITE + '/' + c.slug, inLanguage: 'ar', about: { '@type': 'MedicalProcedure', name: kw }, publisher: { '@id': SITE + '/' + b.slug + '#clinic' } };
  return layout({
    title, desc, path: '/' + c.slug, h1: `${kw} في ${area}`, lead: `${kw} في ${BRAND} فرع ${area}${s.price ? ' — ' + fromTxt(s) : ''}. احجز كشفك أونلاين.`, image: s.image,
    crumb: `<a href="/">الرئيسية</a> › <a href="/${b.slug}">عيادة أسنان ${esc(area)}</a> › ${esc(kw)}`, body, data,
    schema: [page, dentistSchema(b, cfg), crumbSchema([['الرئيسية', '/'], ['عيادة أسنان ' + area, '/' + b.slug], [kw + ' في ' + area, '/' + c.slug]]), ...faqSchema(faqs)]
  });
}

// ---------- المدونة ----------
const BLOG_CSS = `.post{display:block;border:1px solid #eee;border-radius:16px;padding:16px;text-decoration:none;color:inherit;background:#fffdf7;margin-bottom:12px}.post b{display:block;color:#111827;font-size:18px;line-height:1.6}.post span{font-size:14px;color:#6b7280}.post time,.meta{font-size:12.5px;color:#9ca3af;font-weight:700}`;
// مقالات اللوحة (cfg.posts): العنوان الفرعي سطر بيبدأ بـ ## والفقرات بينها سطر فاضي، والأسئلة "س: ... / ج: ..."
function parseBody(t, title) {
  const secs = []; let cur = null, buf = [];
  const flush = () => { const x = buf.join(' ').trim(); if (x) { if (!cur) { cur = [title, []]; secs.push(cur); } cur[1].push(x); } buf = []; };
  String(t || '').replace(/\r/g, '').split('\n').forEach(l => {
    const m = l.match(/^\s*#{1,3}\s*(.+)$/);
    if (m) { flush(); cur = [m[1].trim(), []]; secs.push(cur); } else if (!l.trim()) flush(); else buf.push(l.trim());
  });
  flush(); return secs.filter(s => s[1].length);
}
function parseFaqs(t) {
  const out = []; let q = null;
  String(t || '').replace(/\r/g, '').split('\n').forEach(l => {
    const x = l.trim(); let m;
    if ((m = x.match(/^(?:س|سؤال|Q)\s*[:：\-]\s*(.+)$/i))) { q = [m[1].trim(), '']; out.push(q); }
    else if (q && (m = x.match(/^(?:ج|جواب|الإجابة|إجابة|A)\s*[:：\-]\s*(.+)$/i))) q[1] = (q[1] + ' ' + m[1]).trim();
    else if (x && q && q[1]) q[1] += ' ' + x;
  });
  return out.filter(f => f[0] && f[1]);
}
const cairoToday = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Cairo' });
// الوقت دلوقتي بتوقيت مصر "YYYY-MM-DD HH:MM" — عشان جدولة المقالات بالساعة
const cairoNow = () => { const f = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Cairo', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date()).map(x => [x.type, x.value])); return `${f.year}-${f.month}-${f.day} ${f.hour}:${f.minute}`; };
const postTime = p => /^\d{1,2}:\d{2}$/.test(String(p.time || '')) ? String(p.time).padStart(5, '0') : '00:00';
const stamp = t => { const m = String(t).match(/^(\d{4})-(\d\d)-(\d\d) (\d\d):(\d\d)$/); return m ? Date.UTC(+m[1], m[2] - 1, +m[3], +m[4], +m[5]) : 0; };
// كام ملي ثانية فاضلة على أقرب مقال مجدول (0 = مفيش)
const nextDue = cfg => { const now = cairoNow(); let best = 0; (Array.isArray(cfg.posts) ? cfg.posts : []).forEach(p => { if (!p || p.hidden || !/^\d{4}-\d{2}-\d{2}$/.test(String(p.date || ''))) return; const at = p.date + ' ' + postTime(p); if (at > now) { const ms = stamp(at) - stamp(now); if (!best || ms < best) best = ms; } }); return best; };
const dashPosts = cfg => (Array.isArray(cfg.posts) ? cfg.posts : [])
  .filter(p => p && !p.hidden && p.title && /^[a-z0-9][a-z0-9-]*$/.test(String(p.slug || '')) && p.slug !== 'index')
  .filter(p => !/^\d{4}-\d{2}-\d{2}$/.test(String(p.date || '')) || (p.date + ' ' + postTime(p)) <= cairoNow())
  .map(p => ({ slug: p.slug, date: /^\d{4}-\d{2}-\d{2}$/.test(String(p.date || '')) ? p.date : cairoToday(), updated: /^\d{4}-\d{2}-\d{2}$/.test(String(p.updated || '')) ? p.updated : undefined,
    title: String(p.title), desc: String(p.desc || '').trim() || clip(String(p.body || '').replace(/^\s*#.*$/mg, ''), 155), image: /^https?:\/\//.test(String(p.image || '')) ? p.image : '',
    services: Array.isArray(p.services) ? p.services : [], sections: parseBody(p.body, p.title), faqs: parseFaqs(p.faqs) }))
  .filter(p => p.date <= cairoToday() && p.sections.length);
const posts = data => {
  const own = new Set(POSTS.map(p => p.slug));
  const extra = dashPosts((data && data.cfg) || {}).filter((p, i, a) => !own.has(p.slug) && a.findIndex(x => x.slug === p.slug) === i);
  return POSTS.concat(extra).sort((a, b) => String(b.date).localeCompare(String(a.date)));
};
const arDate = d => { try { return new Date(d + 'T12:00:00Z').toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' }); } catch (e) { return d; } };
const svcByKey = (data, k) => data.services.find(s => s.key === k || s.id === k || s.slug === k);

function blogIndex(data) {
  const list = posts(data);
  const body = `<style>${BLOG_CSS}</style><section><h2>أحدث المقالات</h2>${list.map(p => `<a class="post" href="/blog/${p.slug}"><time datetime="${p.date}">${esc(arDate(p.date))}</time><b>${esc(p.title)}</b><span>${esc(p.desc)}</span></a>`).join('') || '<p>قريب هتلاقي هنا مقالات ونصايح عن صحة الأسنان.</p>'}</section>`;
  const schema = { '@context': 'https://schema.org', '@type': 'Blog', name: `مدونة ${BRAND}`, url: SITE + '/blog', inLanguage: 'ar', publisher: { '@type': 'Organization', name: BRAND, logo: LOGO }, blogPost: list.slice(0, 30).map(p => ({ '@type': 'BlogPosting', headline: p.title, url: SITE + '/blog/' + p.slug, datePublished: p.date })) };
  return layout({ title: `مدونة ${BRAND} | نصايح ومعلومات عن الأسنان`, desc: 'مقالات ونصايح من دكاترة نيو إيرا لطب الأسنان: زراعة، تقويم، علاج عصب، تنظيف جير وتجميل — في فيصل وحلوان والأخصاص.', path: '/blog', h1: `مدونة ${BRAND}`, lead: 'نصايح ومعلومات عن صحة وتجميل الأسنان من دكاترتنا.', crumb: '<a href="/">الرئيسية</a> › المدونة', body, data, schema: [schema, crumbSchema([['الرئيسية', '/'], ['المدونة', '/blog']])] });
}

function blogPost(p, data) {
  const rel = (p.services || []).map(k => svcByKey(data, k)).filter(Boolean);
  const more = posts(data).filter(x => x.slug !== p.slug).slice(0, 4);
  const body = `<style>${BLOG_CSS}</style><section><p class="meta">📅 ${esc(arDate(p.date))} · فريق ${BRAND}</p>${p.image ? `<img class="img" src="${esc(p.image)}" alt="${esc(p.title)}" width="960" height="360">` : ''}</section>
${(p.sections || []).map(([h, ps]) => `<section><h2>${esc(h)}</h2>${ps.map(x => `<p>${esc(x)}</p>`).join('')}</section>`).join('')}
${faqBlock(p.faqs || [], 'أسئلة شائعة')}
${rel.length ? `<section><h2>خدمات مرتبطة</h2><div class="tags">${rel.map(s => `<a href="/${s.slug}">${esc(s.kw)}</a>`).join('')}</div><div class="tags" style="margin-top:6px">${data.branches.map(b => `<a href="/${b.slug}">دكتور أسنان في ${esc(b.area)}</a>`).join('')}</div></section>` : ''}
${more.length ? `<section><h2>مقالات تانية</h2>${more.map(x => `<a class="post" href="/blog/${x.slug}"><b>${esc(x.title)}</b><span>${esc(x.desc)}</span></a>`).join('')}</section>` : ''}
<p class="note">المعلومات دي عامة ومش بديل عن الكشف؛ الدكتور بيحدد المناسب لحالتك بعد الفحص.</p>`;
  const art = { '@context': 'https://schema.org', '@type': 'BlogPosting', headline: p.title, description: p.desc, datePublished: p.date, dateModified: p.updated || p.date, inLanguage: 'ar', mainEntityOfPage: SITE + '/blog/' + p.slug, image: p.image || LOGO, author: { '@type': 'Organization', name: BRAND, url: SITE }, publisher: { '@type': 'Organization', name: BRAND, logo: { '@type': 'ImageObject', url: LOGO } } };
  return layout({ title: `${p.title} | ${BRAND}`, desc: clip(p.desc, 160), path: '/blog/' + p.slug, h1: p.title, lead: p.desc, image: p.image, crumb: `<a href="/">الرئيسية</a> › <a href="/blog">المدونة</a> › ${esc(clip(p.title, 40))}`, body, data, schema: [art, crumbSchema([['الرئيسية', '/'], ['المدونة', '/blog'], [p.title, '/blog/' + p.slug]]), ...faqSchema(p.faqs || [])] });
}

function sitemap(data) {
  const d = new Date().toISOString().slice(0, 10);
  const urls = [['/', '1.0'], ...data.branches.map(b => ['/' + b.slug, '0.9']), ...data.services.map(s => ['/' + s.slug, '0.8']), ...data.combos.map(c => ['/' + c.slug, '0.7']), ['/blog', '0.7'], ...posts(data).map(p => ['/blog/' + p.slug, '0.6'])];
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(([p, pr]) => `  <url><loc>${SITE}${p}</loc><lastmod>${d}</lastmod><priority>${pr}</priority></url>`).join('\n')}\n</urlset>\n`;
}

function notFound(data) {
  return layout({
    title: `الصفحة مش موجودة | ${BRAND}`, desc: BRAND, path: '/', h1: 'الصفحة دي مش موجودة', lead: 'جرّب واحدة من الصفحات دي:', crumb: '<a href="/">الرئيسية</a>', data, schema: [],
    body: `<section><h2>فروعنا</h2><div class="tags">${data.branches.map(b => `<a href="/${b.slug}">عيادة أسنان ${esc(b.area)}</a>`).join('')}</div><h2 style="margin-top:14px">خدماتنا</h2><div class="tags">${data.services.map(s => `<a href="/${s.slug}">${esc(s.kw)}</a>`).join('')}</div></section>`
  });
}

async function handler(req, res) {
  try {
    const q = req.query || {};
    const data = await loadData();
    EXAM_FEE = data.examFee;
    // لو في مقال مجدول قريب: الصفحات متتخزنش في Vercel بعد ميعاده عشان ينزل في الساعة المظبوطة
    const left = data.cfg ? nextDue(data.cfg) : 0;
    if (left && left < 3600 * 1000) { const sec = Math.max(30, Math.ceil(left / 1000)); res.setHeader('Cache-Control', `public, max-age=${Math.min(300, sec)}, s-maxage=${sec}, stale-while-revalidate=30`); }
    else res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400');
    if (q.gverify) { // ملف تحقق Search Console (اسمه بيتكتب في اللوحة)
      const f = String(q.gverify).toLowerCase(), want = String(data.cfg.seo.gscFile || '').trim().toLowerCase();
      if (want && f === want && /^google[a-z0-9]+\.html$/.test(want)) { res.setHeader('Content-Type', 'text/html; charset=utf-8'); return res.status(200).send('google-site-verification: ' + want); }
      res.setHeader('Cache-Control', 'no-store'); return res.status(404).send('not found');
    }
    if (q.sitemap) { res.setHeader('Content-Type', 'application/xml; charset=utf-8'); return res.status(200).send(sitemap(data)); }
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    if (q.blog) {
      const bs = latin(q.blog);
      if (bs === 'index' || bs === 'blog') return res.status(200).send(blogIndex(data));
      const p = posts(data).find(x => x.slug === bs); if (p) return res.status(200).send(blogPost(p, data));
    }
    const slug = latin(q.slug);
    if (slug === 'blog') return res.status(200).send(blogIndex(data));
    const b = data.branches.find(x => x.slug === slug); if (b) return res.status(200).send(branchPage(b, data));
    const s = data.services.find(x => x.slug === slug); if (s) return res.status(200).send(servicePage(s, data));
    const c = data.combos.find(x => x.slug === slug); if (c) return res.status(200).send(comboPage(c, data));
    // روابط قديمة: خدمة باسمها الداخلي (زي /s1791657855037) أو "خدمة-فرع" اتغيرت ← تحويل دائم للصفحة الصح بدل 404
    const go = to => { res.setHeader('Location', SITE + to); res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400'); return res.status(301).send(''); };
    const byId = data.services.find(x => latin(x.id) === slug || x.key === slug); if (byId) return go('/' + byId.slug);
    const br = data.branches.find(x => slug.endsWith('-' + x.slug));
    if (br) { const pre = slug.slice(0, -br.slug.length - 1), sv = data.services.find(x => x.slug === pre || latin(x.id) === pre || x.key === pre); const cc = sv && data.combos.find(x => x.s === sv && x.b === br); return go('/' + (cc ? cc.slug : sv ? sv.slug : br.slug)); }
    res.setHeader('Cache-Control', `public, max-age=60, s-maxage=${left && left < 600000 ? Math.max(30, Math.ceil(left / 1000)) : 600}`);
    return res.status(404).send(notFound(data));
  } catch (e) {
    res.setHeader('Cache-Control', 'no-store');
    res.status(500).send('<!doctype html><meta charset="utf-8"><p style="font-family:sans-serif">حصل خطأ مؤقت. <a href="/">ارجع للرئيسية</a></p>');
  }
}

module.exports = handler;
module.exports.loadData = loadData;
