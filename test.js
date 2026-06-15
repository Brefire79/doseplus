/* =============================================================
 * DoseCheck Plus v2 — Suite de testes (Node, zero-dependência)
 * Executa: node test.js
 *
 * Extrai o JS inline de <script id="app-script"> do index.html e
 * roda em sandbox `vm` com stubs de DOM + IndexedDB em memória.
 * Funções/vars de topo (function esc / var Store…) ficam no global.
 *
 * Cobertura por lote:
 *   LOTE A → esc() vs XSS, validação de ranges                 [ATIVO]
 *   LOTE B → migrações 1→4, rollback da escrita dupla          [ATIVO]
 *   LOTE C → checksum export/import, regressão analyzeCase()   [SCAFFOLD]
 * ============================================================= */

'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

/* ---------- harness (sync + async) ---------- */
let pass = 0, fail = 0, skipped = 0;
const failures = [];
const delay = (ms) => new Promise(r => setTimeout(r, ms));

async function test(name, fn) {
  try { await fn(); pass++; console.log(`  ✓ ${name}`); }
  catch (err) { fail++; failures.push({ name, err }); console.log(`  ✗ ${name}\n      ${err.message}`); }
}
function todo(name) { skipped++; console.log(`  ○ ${name}  (TODO — lote correspondente)`); }
function eq(a, e, msg) { if (a !== e) throw new Error(`${msg || 'esperado igual'}: esperado ${JSON.stringify(e)}, recebido ${JSON.stringify(a)}`); }
function ok(c, msg) { if (!c) throw new Error(msg || 'esperado verdadeiro'); }
function notContains(h, n, msg) { if (String(h).includes(n)) throw new Error(`${msg || 'não deveria conter'}: ${JSON.stringify(n)} em ${JSON.stringify(h)}`); }
function section(t) { console.log(`\n── ${t} ──`); }

/* ---------- fake IndexedDB (em memória, callbacks assíncronos reais) ---------- */
function makeFakeIDB() {
  const dbs = {};
  function FDB(name) { this.name = name; this.objectStoreNames = { _s: {}, contains(n) { return !!this._s[n]; } }; this._data = {}; }
  FDB.prototype.createObjectStore = function (n) { this.objectStoreNames._s[n] = true; this._data[n] = this._data[n] || {}; };
  FDB.prototype.transaction = function (store) {
    const db = this;
    const tx = { oncomplete: null, onerror: null };
    tx.objectStore = (n) => ({
      put(val, key) { db._data[n] = db._data[n] || {}; db._data[n][key] = val; setTimeout(() => tx.oncomplete && tx.oncomplete(), 0); return {}; },
      get(key) { const rq = { onsuccess: null, onerror: null, result: undefined }; setTimeout(() => { rq.result = (db._data[n] || {})[key]; rq.onsuccess && rq.onsuccess(); }, 0); return rq; },
    });
    return tx;
  };
  return {
    open(name) {
      const req = { onupgradeneeded: null, onsuccess: null, onerror: null, result: null };
      setTimeout(() => {
        const fresh = !dbs[name];
        const db = dbs[name] || (dbs[name] = new FDB(name));
        req.result = db;
        if (fresh && req.onupgradeneeded) req.onupgradeneeded();
        req.onsuccess && req.onsuccess();
      }, 0);
      return req;
    },
    _dbs: dbs,
  };
}

/* ---------- stubs de DOM ---------- */
function makeNode() {
  const n = { style: {}, dataset: {}, classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } }, children: [], attributes: {}, _html: '', _text: '' };
  Object.defineProperty(n, 'innerHTML', { set(v) { this._html = String(v); }, get() { return this._html; } });
  Object.defineProperty(n, 'textContent', { set(v) { this._text = String(v); }, get() { return this._text; } });
  Object.assign(n, { appendChild(c) { this.children.push(c); return c; }, setAttribute(k, v) { this.attributes[k] = String(v); }, getAttribute(k) { return this.attributes[k]; }, addEventListener() {}, removeEventListener() {}, querySelector() { return makeNode(); }, querySelectorAll() { return []; }, getContext() { return {}; }, focus() {}, click() {}, insertAdjacentHTML() {}, closest() { return null; }, remove() {}, replaceChild() {} });
  return n;
}
function buildSandbox() {
  const storage = new Map();
  let failNextSet = false;
  const localStorageStub = {
    getItem: (k) => (storage.has(k) ? storage.get(k) : null),
    setItem: (k, v) => { if (failNextSet) { failNextSet = false; throw new Error('QuotaExceeded (simulado)'); } storage.set(k, String(v)); },
    removeItem: (k) => storage.delete(k),
    clear: () => storage.clear(),
    key: (i) => Array.from(storage.keys())[i] ?? null,
    get length() { return storage.size; },
  };
  const documentStub = { getElementById: () => makeNode(), querySelector: () => makeNode(), querySelectorAll: () => [], createElement: () => makeNode(), addEventListener: () => {}, body: makeNode(), documentElement: makeNode() };
  const sandbox = {
    console, document: documentStub, localStorage: localStorageStub,
    navigator: { userAgent: 'node', storage: { persist: async () => false, persisted: async () => false }, share: undefined },
    location: { href: '', search: '', hash: '' },
    setTimeout: (fn) => { try { fn(); } catch (_) {} return 0; }, clearTimeout: () => {},
    setInterval: () => 0, clearInterval: () => {},
    requestAnimationFrame: (fn) => { try { fn(); } catch (_) {} return 0; },
    indexedDB: makeFakeIDB(),
    crypto: globalThis.crypto, fetch: async () => { throw new Error('offline'); },
    Chart: undefined, jspdf: undefined, Papa: undefined,
    alert: () => {}, confirm: () => true, prompt: () => null,
    URL, Blob: globalThis.Blob, TextEncoder, TextDecoder,
    __storage: storage, __failNextLocalStorageSet: () => { failNextSet = true; },
  };
  sandbox.window = sandbox; sandbox.globalThis = sandbox; sandbox.self = sandbox;
  return sandbox;
}

function loadApp() {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const m = html.match(/<script id="app-script">([\s\S]*?)<\/script>/);
  if (!m) throw new Error('Não encontrei <script id="app-script"> no index.html');
  const sandbox = buildSandbox();
  vm.createContext(sandbox);
  try { vm.runInContext(m[1], sandbox, { filename: 'app-script.js', timeout: 5000 }); }
  catch (err) { /* init pode falhar sem DOM real — funções já estão no global */ }
  return sandbox;
}

/* ============================================================= */
async function main() {
  console.log('DoseCheck Plus v2 — test suite\n==============================');
  const app = loadApp();

  /* ---------------- LOTE A ---------------- */
  section('LOTE A · esc() contra XSS');
  const XSS = [
    { raw: `<img src=x onerror=alert(1)>`, banned: ['<', '>'] },
    { raw: `<script>alert(1)</script>`, banned: ['<', '>'] },
    { raw: `"><svg/onload=alert(1)>`, banned: ['<', '>', '"'] },
    { raw: `'><iframe src=javascript:alert(1)>`, banned: ['<', '>', "'"] },
    { raw: `& < > " '`, banned: ['<', '>', '"'] },
  ];
  if (typeof app.esc === 'function') {
    await test('esc() escapa os 5 caracteres perigosos', () => eq(app.esc(`& < > " '`), '&amp; &lt; &gt; &quot; &#39;'));
    for (let i = 0; i < XSS.length; i++) {
      await test(`esc() neutraliza payload #${i + 1}`, () => XSS[i].banned.forEach(b => notContains(app.esc(XSS[i].raw), b, `cru não escapado (${b})`)));
    }
    await test('esc() idempotente em texto seguro', () => eq(app.esc('Paciente 123'), 'Paciente 123'));
    await test('esc() trata não-string', () => ok(app.esc(undefined) === '' && app.esc(null) === '' && app.esc(42) === '42'));
  } else todo('esc() — Lote A');

  section('LOTE A · validação de ranges');
  const V = app.clampSave;
  if (V) {
    await test('peso fora de 20–400 vira null', () => { const r = V({ peso: 999 }); ok(r.peso == null); });
    await test('peso válido preservado', () => eq(V({ peso: 85 }).peso, 85));
    await test('nome > 120 truncado', () => ok(V({ nome: 'x'.repeat(500) }).nome.length === 120));
    await test('notes > 500 truncado', () => ok(V({ notes: 'y'.repeat(900) }).notes.length === 500));
  } else todo('clampSave — Lote A');

  /* ---------------- LOTE B ---------------- */
  section('LOTE B · migrações 1→4 (sem perda de dados)');
  if (app.MIGRATIONS && typeof app.SCHEMA_VERSION === 'number' && typeof app.migrate === 'function') {
    await test('SCHEMA_VERSION === 4', () => eq(app.SCHEMA_VERSION, 4));

    // Fixtures reais de cada versão legada
    const fx1 = { cfg: { nome: 'Ana' }, apps: [{ date: '2024-01-01', time: '08:00', dose: '5', local: 'abdomen' }], pesos: [{ date: '2024-01-01', valor: 90 }] };
    const fx2 = { cfg: { nome: 'Bia', sexo: 'F' }, apps: [{ date: '2024-03-01', time: '09:00', dose: '2.5', local: 'coxa' }], pesos: [{ date: '2024-03-01', valor: 78 }] };
    const fx3 = { cfg: { nome: 'Cid', drugId: 'ozempic' }, apps: [{ drugId: 'ozempic', date: '2024-05-01', time: '07:00', dose: '1', local: 'abdomen' }], pesos: [{ date: '2024-05-01', valor: 102 }], medidas: [{ date: '2024-05-01', altura: 170 }], quizes: [] };

    await test('v1→v4: estampa _v, drugId, sexo default; preserva nome/apps/pesos', () => {
      const r = app.migrate(JSON.parse(JSON.stringify(fx1)), 1);
      eq(r._v, 4); eq(r.cfg.nome, 'Ana'); eq(r.cfg.drugId, 'mounjaro'); eq(r.cfg.sexo, 'M');
      eq(r.apps.length, 1); eq(r.apps[0].drugId, 'mounjaro'); eq(r.pesos[0].valor, 90);
      ok(Array.isArray(r.medidas) && Array.isArray(r.quizes) && Array.isArray(r.medHistory));
    });
    await test('v2→v4: preserva sexo=F, adiciona drugId; sem perda', () => {
      const r = app.migrate(JSON.parse(JSON.stringify(fx2)), 2);
      eq(r._v, 4); eq(r.cfg.sexo, 'F'); eq(r.cfg.drugId, 'mounjaro'); eq(r.apps[0].drugId, 'mounjaro'); eq(r.pesos[0].valor, 78);
    });
    await test('v3→v4: preserva drugId=ozempic, auto-altura, alertas; sem perda', () => {
      const r = app.migrate(JSON.parse(JSON.stringify(fx3)), 3);
      eq(r._v, 4); eq(r.cfg.drugId, 'ozempic'); eq(r.cfg.altura_cm, 170);
      ok(r.cfg.alertas && r.cfg.alertas.janela_min === 60); eq(r.apps[0].drugId, 'ozempic'); eq(r.pesos[0].valor, 102);
    });
    await test('migração é idempotente (v4→v4 estável)', () => {
      const once = app.migrate(JSON.parse(JSON.stringify(fx3)), 3);
      const twice = app.migrate(JSON.parse(JSON.stringify(once)), once._v);
      eq(JSON.stringify(once), JSON.stringify(twice));
    });
    await test('migração com fixture inválida não destrói (read-only fallback)', () => {
      const r = app.migrate(null, 1); ok(r && typeof r === 'object'); // defaultState, não lança
    });
  } else todo('LOTE B — expor MIGRATIONS/SCHEMA_VERSION/migrate');

  section('LOTE B · PATCH D — rollback da escrita dupla');
  if (app.Store && typeof app.Store.save === 'function') {
    // round-trip IndexedDB (fonte da verdade)
    await test('Store.save grava e Store.load recupera via IndexedDB', async () => {
      const st = { _v: 4, cfg: { nome: 'Dora', drugId: 'mounjaro' }, apps: [], pesos: [{ date: '2024-06-01', valor: 70 }], medidas: [], quizes: [], medHistory: [] };
      app.state = st; app.Store.save(st); await delay(30);
      const back = await app.Store.load();
      eq(back.cfg.nome, 'Dora'); eq(back.pesos[0].valor, 70); eq(back._v, 4);
    });
    // falha parcial: localStorage falha, IndexedDB ok → integridade preservada
    await test('localStorage falha no save → IndexedDB mantém estado íntegro', async () => {
      const prev = { _v: 4, cfg: { nome: 'Eva', drugId: 'mounjaro' }, apps: [], pesos: [], medidas: [], quizes: [], medHistory: [] };
      app.state = prev; app.Store.save(prev); await delay(30);
      const next = { _v: 4, cfg: { nome: 'Eva2', drugId: 'mounjaro' }, apps: [], pesos: [], medidas: [], quizes: [], medHistory: [] };
      app.__failNextLocalStorageSet();
      let threw = false; try { app.Store.save(next); } catch (e) { threw = true; }
      await delay(30);
      ok(!threw, 'Store.save não deve propagar exception');
      const back = await app.Store.load(); // IndexedDB primário
      ok(back.cfg.nome === 'Eva2' || back.cfg.nome === 'Eva', 'estado íntegro, nunca híbrido');
      eq(back._v, 4);
    });
  } else todo('LOTE B — expor Store.save/load');

  /* ---------------- LOTE C ---------------- */
  section('LOTE C · integridade de export/import (envelope + checksum)');
  if (typeof app.buildExportEnvelope === 'function' && typeof app.parseImportEnvelope === 'function') {
    const sample = { _v: 4, cfg: { nome: 'Fá', drugId: 'mounjaro' }, apps: [{ date: '2024-01-01', dose: '10' }], pesos: [{ date: '2024-01-01', valor: 90 }], medidas: [], quizes: [], medHistory: [] };
    await test('envelope tem app/schema/checksum/data', async () => {
      const env = await app.buildExportEnvelope(sample);
      eq(env.app, 'dosecheck-plus'); eq(env.schema, 4); ok(typeof env.checksum === 'string' && env.checksum.length === 64); ok(!!env.data);
    });
    await test('roundtrip export→import preserva dados', async () => {
      const env = await app.buildExportEnvelope(sample);
      const res = await app.parseImportEnvelope(env);
      ok(res.ok, res.error); eq(res.data.cfg.nome, 'Fá'); eq(res.data.pesos[0].valor, 90);
    });
    await test('checksum adulterado é detectado', async () => {
      const env = await app.buildExportEnvelope(sample);
      env.checksum = env.checksum.replace(/.$/, env.checksum.slice(-1) === '0' ? '1' : '0');
      const res = await app.parseImportEnvelope(env);
      ok(!res.ok && /checksum/i.test(res.error), 'deveria rejeitar checksum inválido');
    });
    await test('data adulterada (sem refazer checksum) é detectada', async () => {
      const env = await app.buildExportEnvelope(sample);
      env.data.pesos[0].valor = 999; // adultera sem recalcular checksum
      const res = await app.parseImportEnvelope(env);
      ok(!res.ok, 'payload adulterado deveria falhar a verificação');
    });
    await test('schema mais novo que o app é rejeitado', async () => {
      const env = await app.buildExportEnvelope(sample); env.schema = 99;
      const res = await app.parseImportEnvelope(env);
      ok(!res.ok, 'schema futuro não pode ser importado');
    });
  } else todo('LOTE C — expor buildExportEnvelope/parseImportEnvelope');

  section('LOTE C · regressão analyzeCase() — Mounjaro platô → 12,5 mg');
  if (typeof app.analyzeCase === 'function') {
    await test('27 semanas em 10mg com platô recomenda escalada para 12.5mg', () => {
      const iso = (daysAgo) => new Date(Date.now() - daysAgo * 86400000).toISOString().slice(0, 10);
      app.state = {
        _v: 4,
        cfg: { drugId: 'mounjaro', nome: 'Reg', sexo: 'M', indic: 'obesidade', peso_inicial: 100, inicio: iso(189), altura_cm: 170, alertas: {} },
        apps: [
          { drugId: 'mounjaro', date: iso(120), time: '08:00', dose: '7.5', local: 'abdomen' },
          { drugId: 'mounjaro', date: iso(60), time: '08:00', dose: '10', local: 'abdomen' },
          { drugId: 'mounjaro', date: iso(32), time: '08:00', dose: '10', local: 'abdomen' },
          { drugId: 'mounjaro', date: iso(4), time: '08:00', dose: '10', local: 'abdomen' },
        ],
        pesos: [
          { date: iso(189), valor: 100 }, { date: iso(120), valor: 92 },
          { date: iso(60), valor: 88 }, { date: iso(30), valor: 87.5 }, { date: iso(1), valor: 87.4 },
        ],
        medidas: [], quizes: [], medHistory: [],
      };
      const r = app.analyzeCase();
      ok(r.plateau && r.plateau.isPlateau, 'platô deveria ser detectado');
      ok(r.doseRec && r.doseRec.acao === 'escalar', 'recomendação deveria ser escalar, veio: ' + JSON.stringify(r.doseRec && r.doseRec.acao));
      ok(/12\.5/.test(r.doseRec.texto), 'deveria sugerir 12.5mg, texto: ' + (r.doseRec && r.doseRec.texto || '').slice(0, 80));
    });
  } else todo('LOTE C — analyzeCase()/DRUGS indisponíveis');

  /* ---------------- SUMMARY ---------------- */
  console.log(`\n==============================`);
  console.log(`Passou: ${pass}  |  Falhou: ${fail}  |  Pendente (TODO): ${skipped}`);
  if (fail > 0) { console.log('\nFalhas:'); failures.forEach(f => console.log(`  ✗ ${f.name}\n    ${f.err.message}`)); process.exit(1); }
  console.log('✓ Tudo verde (testes ativos).');
  process.exit(0);
}
main();
