// Run with node tools/check-navigation.cjs. No dependencies or network required.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const library = read('src/11-library.html');
function extract(name) {
  const start = library.indexOf('function ' + name + '(');
  assert.ok(start >= 0, name);
  const end = library.indexOf('\n}', start) + 2;
  return library.slice(start, end);
}
const catalog = JSON.parse(read('data/catalog.json'));
const d = catalog.dict;
const ctx = vm.createContext({
  YMIN: 1600, YMAX: 2026, TLY0: 1600, TLY1: 2026,
  EPOCH: d.epoch, ARTIST: d.artist, SUB: d.sub, INST: d.inst,
  AGES: catalog.ages, PICKS: {young: {}, radical: {}},
  location: {hash: ''}, elQ: {value: ''},
  document: {getElementById: () => ({value: ''})}
});
vm.runInContext(extract('blank') + '\n' + extract('loadHash') + '\n' + extract('sameHit'), ctx);
function load(hash) {
  ctx.location.hash = hash;
  vm.runInContext("F=blank(); SORT='rel'; MODE=0; loadHash();", ctx);
  return JSON.parse(vm.runInContext('JSON.stringify({F,SORT,MODE})', ctx));
}
assert.equal(load('#m=0').MODE, 0);
assert.equal(load('#m=1').MODE, 1);
assert.equal(load('#m=2').MODE, 2);
let result = load('#q=%E0%A4%A&m=2&art=23');
assert.equal(result.MODE, 2); // Broken text must not prevent later filters.
assert.equal(result.F.art[23], 1);
result = load('#art=999999.nope.-1.23&ep=999999&age=999&__proto__=polluted&r=7&s=bad&m=1.5');
assert.deepEqual(result.F.art, {'23': 1});
assert.deepEqual(result.F.ep, {});
assert.deepEqual(result.F.age, {});
assert.equal(result.F.realm, null);
assert.equal(result.SORT, 'rel');
assert.equal(result.MODE, 0);
assert.equal(vm.runInContext('({}).polluted', ctx), undefined);
result = load('#y=2020-1800');
assert.equal(result.F.y0, 1800);
assert.equal(result.F.y1, 2020);
assert.equal(load('#replay=0').F.rep, false);
assert.equal(load('#replay=1').F.rep, true);
assert.equal(load('#tl=9999').F.tl, 0);
assert.equal(load('#pick=young').F.pick, 'young');
assert.equal(load('#pick=toString').F.pick, '');
assert.equal(load('#pick=__proto__').F.pick, '');
const author = d.artist.findIndex(n => n.includes('Себастьян Бах'));
result = load('#art='+author+'&q='+encodeURIComponent('Toccata & Fugue'));
assert.equal(result.F.art[author], 1);
assert.equal(result.F.q, 'Toccata & Fugue');
// Undefined properties previously made *different tracks and suns* compare equal.
const sunA = {}, sunB = {};
assert.equal(ctx.sameHit({kind:'track',i:1}, {kind:'track',i:2}), false);
assert.equal(ctx.sameHit({kind:'sun',s:sunA}, {kind:'sun',s:sunB}), false);
assert.equal(ctx.sameHit({kind:'sun',s:sunA}, {kind:'sun',s:sunA}), true);
for (const [kind,key] of [['epoch','e'],['band','b'],['row','r'],['year','y']]) {
  assert.equal(ctx.sameHit({kind,[key]:1}, {kind,[key]:2}), false);
  assert.equal(ctx.sameHit({kind,[key]:1}, {kind,[key]:1}), true);
}
assert.equal(ctx.sameHit(null, null), true);

for (const name of ['08-cosmos','11-library','index']) {
  const src = read('src/'+name+'.html');
  const doc = read('docs/'+name+'.html');
  assert.ok(doc.includes(src), name+': docs must match src');
  let count = 0;
  for (const script of doc.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)) {
    new vm.Script(script[1], {filename: name+'-'+count+++'.js'});
  }
  for (const link of doc.matchAll(/href="([^"#?]+\.html)(?:[?#][^"]*)?"/g)) {
    assert.ok(fs.existsSync(path.join(root, 'docs', link[1])), name+': '+link[1]);
  }
}
// The no-WebGL route must run with the embedded data and keep real catalog links.
const mapScript = [...read('docs/08-cosmos.html').matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)][0][1];
const wrap = {innerHTML: ''};
const fallback = vm.createContext({document: {getElementById: id =>
  id === 'wrap' ? wrap : {getContext: () => null}}});
vm.runInContext(mapScript, fallback);
assert.ok(wrap.innerHTML.includes('Открыть полный каталог'));
assert.ok(wrap.innerHTML.includes('11-library.html#ep='));
assert.ok(wrap.innerHTML.includes('11-library.html#art='));
console.log('PASS: URL validation, hover identity, script syntax, local links, generated pages, no-WebGL fallback');
