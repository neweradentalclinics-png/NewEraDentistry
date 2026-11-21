// صفحات حقيقية لجوجل: صفحة لكل فرع وصفحة لكل خدمة + sitemap.xml
// البيانات بتتسحب من نفس قاعدة البيانات (الفروع من السيستم، الخدمات والأسئلة من لوحة الموقع)
// والصفحة بتتخزن على سيرفرات Vercel ساعة، فأي تعديل في البيانات بيبان خلال ساعة بالكتير.
const { SVC_SLUG, AREA_SLUG, S } = require('./_content.js');

const PROJECT = 'new-era-dental-center';
const FS = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`;
const SITE = 'https://neweradentalcenter.com';
const BRAND = 'نيو إيرا لطب الأسنان';
const BRAND_EN = 'New Era Dental Center';
const LOGO = 'https://i.ibb.co/qLw7Tcqv/logo-Dr-shahenda-original.png';
const PAGES_VERSION = '1.0';

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

let CACHE = { t: 0, data: null };
async function loadData() {
  if (CACHE.data && Date.now() - CACHE.t < 5 * 60 * 1000) return CACHE.data;
  const [siteDoc, brs, faqRows] = await Promise.all([
    getJSON(`${FS}/settings/site`).catch(() => null),
    getJSON(`${FS}/branches?pageSize=100`).catch(() => ({ documents: [] })),
    getJSON(`${FS}:runQuery`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ structuredQuery: { from: [{ collectionId: 'faqs' }], where: { fieldFilter: { field: { fieldPath: 'published' }, op: 'EQUAL', value: { booleanValue: true } } }, limit: 400 } })
    }).catch(() => [])
  ]);
  const cfg = siteDoc ? obj(siteDoc.fields) : {};
  const branches = (brs.documents || []).map(d => ({ id: d.name.split('/').pop(), ...obj(d.fields) }))
    .filter(b => b.name && b.active !== false && b.hidden !== true)
    .sort((a, b) => (a.order ?? 999) - (b.order ?? 999) || String(a.name).localeCompare(String(b.name), 'ar'));
  const faqs = (Array.isArray(faqRows) ? faqRows : []).filter(r => r.document).map(r => obj(r.document.fields)).filter(f => f.q && f.a);
  const usedB = new Set();
  branches.forEach(b => { let s = branchSlug(b); while (usedB.has(s)) s += '-2'; usedB.add(s); b.slug = s; });
  const services = (Array.isArray(cfg.services) && cfg.services.length ? cfg.services : Object.keys(S).filter(k => !['rootcanal', 'endo'].includes(k)).map(id => ({ id, title: S[id].kw })))
    .filter(s => s && s.id && !s.hidden && (s.title || (S[s.id] && S[s.id].kw)));
  const usedS = new Set(branches.map(b => b.slug));
  services.forEach(s => { let sl = svcSlug(s); while (usedS.has(sl)) sl += '-2'; usedS.add(sl); s.slug = sl; });
  const data = { cfg, branches, services, faqs };
  CACHE = { t: Date.now(), data };
  return data;
}

// ---------- الروابط ----------
const latin = s => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
function branchSlug(b) {
  if (b.slug && latin(b.slug)) return latin(b.slug);
  const n = String(b.name || '');
  const hit = AREA_SLUG.find(([ar]) => n.includes(ar));
  return hit ? hit[1] : 'branch-' + latin(b.id).slice(0, 12);
}
function svcSlug(s) {
  if (s.slug && latin(s.slug)) return latin(s.slug);
  if (SVC_SLUG[s.id]) return SVC_SLUG[s.id];
  const t = String(s.title || '');
  if (/عصب/.test(t)) return 'root-canal';
  return latin(s.titleEn) || latin(s.id) || 'service';
}
const areaName = b => String(b.name || '').replace(/^فرع\s*/, '').trim();
const contentFor = s => S[s.id] || (/عصب/.test(s.title || '') ? S['root-canal'] : null);

// ---------- أدوات ----------
const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const clip = (s, n) => { s = String(s || '').replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n - 1).replace(/\s+\S*$/, '') + '…' : s; };
const joinAr = a => a.length <= 1 ? (a[0] || '') : a.slice(0, -1).join('، ') + ' و' + a[a.length - 1];
const telOf = p => String(p || '').replace(/[^\d+]/g, '').replace(/^0/, '+20');
const waOf = cfg => 'https://wa.me/' + String(cfg.whatsapp || '201121593393').replace(/\D/g, '');
const phonesOf = (cfg, b) => [...new Set([b && b.phone, ...((cfg.phones || []))].filter(Boolean).map(String))];
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

function layout({ title, desc, path, h1, lead, crumb, body, schema, data, image }) {
  const { cfg, branches, services } = data;
  const ph = phonesOf(cfg)[0];
  const url = SITE + path;
  return `<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title><meta name="description" content="${esc(desc)}"><link rel="canonical" href="${url}">
<meta property="og:type" content="website"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${url}"><meta property="og:locale" content="ar_EG"><meta property="og:image" content="${esc(image || LOGO)}">
<link rel="icon" href="${LOGO}"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@500;700;800;900&display=swap" rel="stylesheet">
<style>${CSS}</style>${schema.map(s => `<script type="application/ld+json">${JSON.stringify(s).replace(/</g, '\\u003c')}</script>`).join('')}</head><body>
<header><div class="w"><a href="/"><img src="${LOGO}" alt="${BRAND}" width="120" height="42"></a><nav><a href="/">الرئيسية</a><a href="/#services">الخدمات</a>${ph ? `<a href="tel:${telOf(ph)}">اتصل بنا</a>` : ''}<a class="b" href="/#book">احجز موعد</a></nav></div></header>
<div class="hero"><div class="w"><div class="crumb">${crumb}</div><h1>${esc(h1)}</h1><p>${esc(lead)}</p>
<div class="cta"><a class="c1" href="/#book">📅 احجز موعدك أونلاين</a><a class="c2" href="${waOf(cfg)}" rel="nofollow">💬 واتساب</a>${ph ? `<a class="c3" href="tel:${telOf(ph)}">📞 ${esc(ph)}</a>` : ''}</div></div></div>
<main class="w">${body}</main>
<footer><div class="w"><div><b style="color:#fff">فروعنا:</b> ${branches.map(b => `<a href="/${b.slug}">فرع ${esc(areaName(b))}</a>`).join('')}</div>
<div><b style="color:#fff">خدماتنا:</b> ${services.map(s => `<a href="/${s.slug}">${esc(s.title)}</a>`).join('')}</div>
<div class="v">© ${BRAND_EN} · v${PAGES_VERSION}</div></div></footer></body></html>`;
}

const faqBlock = (list, title) => list.length ? `<section><h2>${esc(title)}</h2>${list.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</section>` : '';
const faqSchema = list => list.length ? [{ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: list.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) }] : [];
const crumbSchema = items => ({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: items.map(([name, path], i) => ({ '@type': 'ListItem', position: i + 1, name, item: SITE + path })) });

function dentistSchema(b, cfg) {
  const s = {
    '@context': 'https://schema.org', '@type': 'Dentist', '@id': SITE + '/' + b.slug + '#clinic',
    name: `${BRAND} - فرع ${areaName(b)}`, alternateName: `${BRAND_EN} - ${b.slug}`, url: SITE + '/' + b.slug, image: LOGO, logo: LOGO,
    telephone: phonesOf(cfg, b).map(telOf)[0],
    address: { '@type': 'PostalAddress', streetAddress: b.address || areaName(b), addressLocality: areaName(b), addressCountry: 'EG' },
    parentOrganization: { '@type': 'Organization', name: BRAND, url: SITE }
  };
  if (b.mapsLink) s.hasMap = b.mapsLink;
  const ll = String(b.mapsLink || '').match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (ll) s.geo = { '@type': 'GeoCoordinates', latitude: Number(ll[1]), longitude: Number(ll[2]) };
  if (b.hours || (cfg.hours && cfg.hours.ar)) s.description = 'مواعيد العمل: ' + (b.hours || cfg.hours.ar);
  const sameAs = Object.values(cfg.socials || {}).filter(x => /^https?:/.test(String(x)));
  if (sameAs.length) s.sameAs = sameAs;
  return s;
}

// ---------- صفحة الفرع ----------
function branchPage(b, data) {
  const { cfg, branches, services } = data;
  const area = areaName(b);
  const top = services.slice(0, 6).map(s => s.title);
  const ph = phonesOf(cfg, b);
  const hours = b.hours || (cfg.hours && cfg.hours.ar) || '';
  const others = branches.filter(x => x.id !== b.id);
  const title = `دكتور أسنان في ${area} | ${BRAND} - فرع ${area}`;
  const desc = clip(`مركز ${BRAND} فرع ${area}${b.address ? ' - ' + b.address : ''}. ${joinAr(top.slice(0, 4))} وأكتر. ${hours ? 'المواعيد: ' + hours + '. ' : ''}احجز أونلاين أو كلمنا.`, 158);
  const faqs = [
    [`فين عنوان ${BRAND} فرع ${area}؟`, b.address ? `العنوان: ${b.address}. وتقدر تفتح الموقع على خرائط جوجل من الخريطة اللي في الصفحة.` : `فرعنا في ${area}، وتقدر تفتح مكانه على خرائط جوجل من الخريطة اللي في الصفحة.`],
    hours && [`مواعيد فرع ${area} إيه؟`, `مواعيد العمل: ${hours}. ويفضّل الحجز المسبق عشان ميكونش في انتظار.`],
    b.consultFee && [`سعر الكشف في فرع ${area} كام؟`, `سعر الكشف: ${b.consultFee}. وبعد الكشف بتاخد خطة علاج مكتوبة فيها التكلفة المتوقعة قبل ما تبدأ.`],
    [`إزاي أحجز في فرع ${area}؟`, `تقدر تحجز أونلاين من زرار "احجز موعدك" وتختار فرع ${area} واليوم والوقت المناسب، أو تكلمنا${ph[0] ? ' على ' + ph[0] : ''} أو تبعتلنا واتساب.`],
    [`الخدمات المتاحة في فرع ${area} إيه؟`, `${joinAr(services.map(s => s.title))}. ولو محتاج خدمة معينة اسألنا قبل الحجز عشان نأكدلك مواعيدها في الفرع.`]
  ].filter(Boolean);
  const body = `
<section><h2>عن فرع ${esc(area)}</h2>
<p>فرع ${esc(area)} من ${BRAND} بيقدّم خدمات طب وتجميل الأسنان للكبار والأطفال، من الكشف والحشو وعلاج العصب لحد الزراعة والتقويم وابتسامة هوليود. لو بتدوّر على دكتور أسنان في ${esc(area)} قريب منك، تقدر تحجز ميعادك أونلاين في دقيقة وتختار اليوم والوقت اللي يناسبك.</p>
<p>في كل زيارة بنبدأ بكشف وتشخيص واضح، وبنشرحلك حالتك ونكتبلك خطة علاج بالترتيب والتكلفة المتوقعة قبل أي خطوة، عشان تبقى عارف هتعمل إيه وليه. وبنهتم بالتعقيم واستخدام أدوات معقمة لكل مريض.</p>
<p>ولو عندك سؤال قبل الحجز، ابعتلنا على واتساب أو استخدم الاستشارة الأونلاين المجانية من الموقع، والدكتور هيرد عليك.</p></section>
<section><h2>بيانات الفرع</h2><div class="info">
${b.address ? `<div><small>العنوان</small><strong>${esc(b.address)}</strong></div>` : ''}
${hours ? `<div><small>المواعيد</small><strong>${esc(hours)}</strong></div>` : ''}
${ph.length ? `<div><small>التليفون</small><strong dir="ltr">${ph.map(p => `<a href="tel:${telOf(p)}">${esc(p)}</a>`).join('<br>')}</strong></div>` : ''}
${b.consultFee ? `<div><small>سعر الكشف</small><strong>${esc(b.consultFee)}</strong></div>` : ''}
${b.waitTime ? `<div><small>متوسط وقت الانتظار</small><strong>${esc(b.waitTime)}</strong></div>` : ''}
</div><iframe class="map" title="خريطة فرع ${esc(area)}" src="${esc(mapSrc(b))}" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe>
${b.mapsLink ? `<p style="margin-top:8px"><a href="${esc(b.mapsLink)}" rel="noopener" target="_blank">📍 افتح الموقع على خرائط جوجل</a></p>` : ''}</section>
<section><h2>خدماتنا في فرع ${esc(area)}</h2><div class="grid">${services.map(s => `<a class="card" href="/${s.slug}"><b>${esc(s.title)}</b><span>${esc(clip(s.desc || (contentFor(s) || {}).desc || '', 110))}</span></a>`).join('')}</div></section>
${faqBlock(faqs, `أسئلة شائعة عن فرع ${area}`)}
${others.length ? `<section><h2>فروعنا التانية</h2><div class="tags">${others.map(o => `<a href="/${o.slug}">فرع ${esc(areaName(o))}</a>`).join('')}</div></section>` : ''}`;
  return layout({
    title, desc, path: '/' + b.slug, h1: `${BRAND} — فرع ${area}`, lead: `دكتور أسنان في ${area}: ${joinAr(top.slice(0, 4))} وأكتر. احجز ميعادك أونلاين.`,
    crumb: `<a href="/">الرئيسية</a> › فرع ${esc(area)}`, body, data,
    schema: [dentistSchema(b, cfg), crumbSchema([['الرئيسية', '/'], ['فرع ' + area, '/' + b.slug]]), ...faqSchema(faqs)]
  });
}

// ---------- صفحة الخدمة ----------
function servicePage(s, data) {
  const { cfg, branches, services, faqs: allFaqs } = data;
  const C = contentFor(s);
  const kw = s.title || (C && C.kw);
  const areas = branches.map(areaName);
  const where = areas.length ? ' في ' + joinAr(areas) : '';
  const title = `${kw}${where} | ${BRAND}`;
  const desc = clip((C ? C.desc : s.desc) + (areas.length ? ` متاحة في فروع ${joinAr(areas)}.` : '') + ' احجز أونلاين.', 158);
  const dbFaqs = allFaqs.filter(f => faqForSvc(f, s)).map(f => [f.q, f.a]);
  const faqs = [...(C ? C.faqs : []), ...dbFaqs].filter((f, i, a) => a.findIndex(x => x[0] === f[0]) === i).slice(0, 12);
  const img = s.image && /^https?:/.test(s.image) ? s.image : '';
  const body = `
<section>${img ? `<img class="img" src="${esc(img)}" alt="${esc(kw)} - ${BRAND}" loading="eager" width="960" height="360">` : ''}
<h2>${esc(kw)} في ${BRAND}</h2>${s.desc ? `<p>${esc(s.desc)}</p>` : ''}
${C ? '' : `<p>بنقدّم خدمة ${esc(kw)} بعد كشف وتشخيص دقيق، وبنشرحلك الخطوات والتكلفة المتوقعة قبل البدء. تقدر تحجز أونلاين أو تسألنا على واتساب.</p>`}</section>
${C ? C.body.map(([h, ps]) => `<section><h2>${esc(h)}</h2>${ps.map(p => `<p>${esc(p)}</p>`).join('')}</section>`).join('') : ''}
${branches.length ? `<section><h2>${esc(kw)} في فروعنا</h2><p>الخدمة متاحة في فروع ${esc(joinAr(areas))}. اختار الفرع الأقرب ليك واعرف عنوانه ومواعيده:</p><div class="tags">${branches.map(b => `<a href="/${b.slug}">${esc(kw)} في ${esc(areaName(b))}</a>`).join('')}</div></section>` : ''}
${faqBlock(faqs, `أسئلة شائعة عن ${kw}`)}
<section><h2>خدمات تانية ممكن تهمك</h2><div class="tags">${services.filter(x => x.slug !== s.slug).map(x => `<a href="/${x.slug}">${esc(x.title)}</a>`).join('')}</div></section>`;
  const proc = { '@context': 'https://schema.org', '@type': 'MedicalWebPage', name: title, url: SITE + '/' + s.slug, inLanguage: 'ar', about: { '@type': 'MedicalProcedure', name: kw, description: C ? C.desc : (s.desc || kw) }, publisher: { '@type': 'Dentist', name: BRAND, url: SITE, logo: LOGO } };
  return layout({
    title, desc, path: '/' + s.slug, h1: `${kw}${where}`, lead: C ? C.desc : clip(s.desc || '', 180), image: img,
    crumb: `<a href="/">الرئيسية</a> › <a href="/#services">الخدمات</a> › ${esc(kw)}`, body, data,
    schema: [proc, crumbSchema([['الرئيسية', '/'], [kw, '/' + s.slug]]), ...faqSchema(faqs)]
  });
}

function sitemap(data) {
  const d = new Date().toISOString().slice(0, 10);
  const urls = [['/', '1.0'], ...data.branches.map(b => ['/' + b.slug, '0.9']), ...data.services.map(s => ['/' + s.slug, '0.8'])];
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(([p, pr]) => `  <url><loc>${SITE}${p === '/' ? '/' : p}</loc><lastmod>${d}</lastmod><priority>${pr}</priority></url>`).join('\n')}\n</urlset>\n`;
}

function notFound(data) {
  return layout({
    title: `الصفحة مش موجودة | ${BRAND}`, desc: BRAND, path: '/', h1: 'الصفحة دي مش موجودة', lead: 'جرّب واحدة من الصفحات دي:', crumb: '<a href="/">الرئيسية</a>', data, schema: [],
    body: `<section><h2>فروعنا</h2><div class="tags">${data.branches.map(b => `<a href="/${b.slug}">فرع ${esc(areaName(b))}</a>`).join('')}</div><h2 style="margin-top:14px">خدماتنا</h2><div class="tags">${data.services.map(s => `<a href="/${s.slug}">${esc(s.title)}</a>`).join('')}</div></section>`
  });
}

async function handler(req, res) {
  try {
    const q = req.query || {};
    const data = await loadData();
    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400');
    if (q.sitemap) { res.setHeader('Content-Type', 'application/xml; charset=utf-8'); return res.status(200).send(sitemap(data)); }
    const slug = latin(q.slug);
    const b = data.branches.find(x => x.slug === slug);
    const s = !b && data.services.find(x => x.slug === slug);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    if (b) return res.status(200).send(branchPage(b, data));
    if (s) return res.status(200).send(servicePage(s, data));
    res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=600');
    return res.status(404).send(notFound(data));
  } catch (e) {
    res.setHeader('Cache-Control', 'no-store');
    res.status(500).send('<!doctype html><meta charset="utf-8"><p style="font-family:sans-serif">حصل خطأ مؤقت. <a href="/">ارجع للرئيسية</a></p>');
  }
}

module.exports = handler;
module.exports.loadData = loadData;
module.exports._t = { branchPage, servicePage, sitemap, notFound, branchSlug, svcSlug, setData: d => { CACHE = { t: Date.now(), data: d }; } };
