// بيانات الموقع العامة في نسخة واحدة متخزنة على Vercel (توفير قراءات Firestore)
// الموقع وصفحة الحجز بيقروا من هنا بدل ما كل زائر يقرا ~140 مستند من Firestore.
// النسخة بتتحدّث كل نص ساعة بالكتير (s-maxage)، ولوحة التحكم بتفضل تقرا مباشر من Firestore.
const PROJECT = 'new-era-dental-center';
const FS = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`;
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
const getJSON = async (url, opt) => { const r = await fetch(url, opt); if (!r.ok) throw new Error(url.split('/documents')[1] + ' ' + r.status); return r.json(); };
const listAll = async col => { let out = [], tok = ''; for (let i = 0; i < 10; i++) { const j = await getJSON(`${FS}/${col}?pageSize=300${tok ? '&pageToken=' + encodeURIComponent(tok) : ''}`); out = out.concat(j.documents || []); if (!j.nextPageToken) break; tok = j.nextPageToken; } return out.map(d => ({ id: d.name.split('/').pop(), ...obj(d.fields) })); };

let CACHE = { t: 0, body: null };
async function build() {
  if (CACHE.body && Date.now() - CACHE.t < 10 * 60 * 1000) return CACHE.body;
  const [site, branches, faqRows, doctors, services, specialties] = await Promise.all([
    getJSON(`${FS}/settings/site`).then(d => obj(d.fields)).catch(() => null),
    listAll('branches'),
    getJSON(`${FS}:runQuery`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ structuredQuery: { from: [{ collectionId: 'faqs' }], where: { fieldFilter: { field: { fieldPath: 'published' }, op: 'EQUAL', value: { booleanValue: true } } }, limit: 500 } }) }),
    listAll('public_doctors'),
    listAll('services'),
    listAll('specialties')
  ]);
  const faqs = (Array.isArray(faqRows) ? faqRows : []).filter(r => r.document).map(r => ({ id: r.document.name.split('/').pop(), ...obj(r.document.fields) }));
  const body = JSON.stringify({ ok: true, at: new Date().toISOString(), site, branches, faqs, doctors, services: services.filter(x => x.active !== false), specialties });
  CACHE = { t: Date.now(), body };
  return body;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  try {
    const body = await build();
    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=1800, stale-while-revalidate=86400');
    res.status(200).send(body);
  } catch (e) {
    res.setHeader('Cache-Control', 'no-store');
    res.status(503).send(JSON.stringify({ ok: false, error: String(e && e.message || e) }));
  }
};
