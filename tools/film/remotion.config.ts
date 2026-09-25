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
// Сцены рисуются в 1920×1080, для сайта хватает 1280×720 (scale 2/3).
// Плоские заливки хорошо сжимаются: crf 27 даёт чистую линию и небольшой файл.
Config.setScale(2 / 3);
Config.setCodec("h264");
Config.setCrf(27);
Config.setX264Preset("slow");
Config.setPixelFormat("yuv420p");
Config.setAudioBitrate("96k");
