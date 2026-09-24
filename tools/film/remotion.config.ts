/**
 * Настройки CLI Remotion (npx remotion studio / render / still).
 * https://remotion.dev/docs/config
 */
import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setJpegQuality(92);
Config.setOverwriteOutput(true);
// Свой Chromium: скачать Chrome Headless Shell удаётся не везде (например, за
// прокси). Путь задаётся переменной REMOTION_BROWSER; без неё Remotion скачает
// браузер сам.
if (process.env.REMOTION_BROWSER) {
  Config.setBrowserExecutable(process.env.REMOTION_BROWSER);
}
// Сжатие под сайт: бумага и «кипящие» линии дают много шума, поэтому перед
// кодированием кадры слегка сглаживаются (hqdn3d), а качество — crf 31.
Config.setCodec("h264");
Config.setCrf(31);
Config.setX264Preset("slow");
Config.setPixelFormat("yuv420p");
Config.setAudioBitrate("96k");
Config.overrideFfmpegCommand(({ type, args }) => {
  // только шаг кодирования: в шаге faststart поток копируется, фильтр там нельзя
  const i = args.indexOf("-c:v");
  if (type !== "stitcher" || i === -1 || args[i + 1] !== "libx264") return args;
  return [...args.slice(0, i), "-vf", "hqdn3d=3:3:4:4", "-tune", "animation", ...args.slice(i)];
});
