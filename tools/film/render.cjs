// Покадровая съёмка фильма в MP4: node tools/film/render.cjs [процессов]
// Каждый процесс снимает свой отрезок в отдельный файл, потом они склеиваются
// и к ним подкладывается звук. Нужны Playwright (Chromium) и ffmpeg.
const { chromium } = require(process.env.PW || 'playwright');
const { spawn, execFileSync } = require('node:child_process');
const path = require('node:path'), fs = require('node:fs');
const OUT = path.join(__dirname, 'out'), FPS = 24, W = 1280, H = 720;
const FF = process.env.FFMPEG || 'ffmpeg';
async function part(a, b, file) {
  const br = await chromium.launch();
  const p = await br.newPage({ viewport: { width: W, height: H } });
  await p.goto('file://' + path.join(OUT, 'film.html'));
  await p.evaluate(() => document.fonts.ready);
  const ff = spawn(FF, ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '23', '-pix_fmt', 'yuv420p', '-tune', 'animation', file], { stdio: ['pipe', 'inherit', 'inherit'] });
  for (let i = a; i < b; i++) {
    await p.evaluate(t => renderAt(t), i / FPS);
    const buf = await p.screenshot({ type: 'jpeg', quality: 92 });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if ((i - a) % 240 === 0) console.log(file, i, '/', b);
  }
  ff.stdin.end(); await new Promise(r => ff.on('close', r)); await br.close();
}
(async () => {
  const n = +(process.argv[2] || 3);
  const end = await (async () => { const br = await chromium.launch(); const p = await br.newPage(); await p.goto('file://' + path.join(OUT, 'film.html')); const e = await p.evaluate(() => window.FILM_END); await br.close(); return e; })();
  const total = Math.round(end * FPS), step = Math.ceil(total / n), jobs = [], parts = [];
  for (let k = 0; k < n; k++) { const a = k * step, b = Math.min(total, a + step); const f = path.join(OUT, 'part' + k + '.mp4'); parts.push(f); jobs.push(part(a, b, f)); }
  await Promise.all(jobs);
  fs.writeFileSync(path.join(OUT, 'parts.txt'), parts.map(f => "file '" + f + "'").join('\n'));
  execFileSync(FF, ['-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', path.join(OUT, 'parts.txt'), '-i', path.join(OUT, 'film-audio.m4a'),
    '-c:v', 'copy', '-c:a', 'aac', '-b:a', '96k', '-shortest', '-movflags', '+faststart', path.join(OUT, 'film.mp4')]);
  console.log('готово:', path.join(OUT, 'film.mp4'));
})();
