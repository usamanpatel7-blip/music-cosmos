import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

// Шрифты fontsource (OFL): кириллица и латиница отдельными файлами.
const RANGES = {
  cyrillic: "U+0301,U+0400-045F,U+0490-0491,U+04B0-04B1,U+2116",
  latin:
    "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+2000-206F,U+20AC,U+2122,U+2190-2199,U+2212,U+2215,U+266A",
};
const FONTS = [
  { family: "Caveat", weight: "700", stem: "caveat" },
  { family: "Golos Text", weight: "600", stem: "golos-text" },
  { family: "Rubik Mono One", weight: "400", stem: "rubik-mono-one" },
];

export const loadFonts = () =>
  Promise.all(
    FONTS.flatMap(({ family, weight, stem }) =>
      (Object.keys(RANGES) as (keyof typeof RANGES)[]).map((sub) =>
        loadFont({
          family,
          weight,
          url: staticFile(`fonts/${stem}-${sub}-${weight}-normal.woff2`),
          unicodeRange: RANGES[sub],
          display: "block",
        }),
      ),
    ),
  );
