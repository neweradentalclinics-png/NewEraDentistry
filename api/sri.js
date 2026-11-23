const crypto = require('crypto');
module.exports = async (req, res) => {
  const urls = ['https://unpkg.com/react@18.3.1/umd/react.production.min.js','https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js','https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js','https://www.gstatic.com/firebasejs/10.8.0/firebase-auth-compat.js','https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore-compat.js','https://www.gstatic.com/firebasejs/10.8.0/firebase-storage-compat.js'];
  const out = {};
  for (const u of urls) { const r = await fetch(u); const b = Buffer.from(await r.arrayBuffer()); out[u] = { status: r.status, final: r.url, acao: r.headers.get('access-control-allow-origin'), sri: 'sha384-' + crypto.createHash('sha384').update(b).digest('base64') }; }
  res.json(out);
};
