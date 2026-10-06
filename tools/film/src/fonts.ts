import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

// Шрифты fontsource (OFL): кириллица и латиница отдельными файлами.
const RANGES = {
  cyrillic: "U+0301,U+0400-045F,U+0490-0491,U+04B0-04B1,U+2116",
  latin:
    "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+2000-206F,U+20AC,U+2122,U+2190-2199,U+2212,U+2215,U+266A",
};
const FONTS: { family: string; weight: string; stem: string; style?: "normal" | "italic" }[] = [
  { family: "Caveat", weight: "700", stem: "caveat" },
  { family: "Golos Text", weight: "600", stem: "golos-text" },
  { family: "Rubik Mono One", weight: "400", stem: "rubik-mono-one" },
  { family: "Pangolin", weight: "400", stem: "pangolin" },
  { family: "Playfair Display", weight: "900", stem: "playfair-display" },
  { family: "Oswald", weight: "700", stem: "oswald" },
  { family: "Press Start 2P", weight: "400", stem: "press-start-2p" },
  { family: "Russo One", weight: "400", stem: "russo-one" },
  { family: "Old Standard TT", weight: "700", stem: "old-standard-tt" },
  { family: "Unbounded", weight: "800", stem: "unbounded" },
  { family: "Ruslan Display", weight: "400", stem: "ruslan-display" },
  { family: "JetBrains Mono", weight: "700", stem: "jetbrains-mono" },
  { family: "Amatic SC", weight: "700", stem: "amatic-sc" },
  // шрифт сайта: заголовки, цифры, подписи
  { family: "Cormorant Garamond", weight: "400", stem: "cormorant-garamond" },
  { family: "Cormorant Garamond", weight: "500", stem: "cormorant-garamond" },
  { family: "Cormorant Garamond", weight: "600", stem: "cormorant-garamond" },
  { family: "Cormorant Garamond", weight: "400", stem: "cormorant-garamond", style: "italic" },
  { family: "Cormorant Garamond", weight: "500", stem: "cormorant-garamond", style: "italic" },
  { family: "Cormorant Garamond", weight: "600", stem: "cormorant-garamond", style: "italic" },
];

export const loadFonts = () =>
  Promise.all(
    FONTS.flatMap(({ family, weight, stem, style = "normal" }) =>
      (Object.keys(RANGES) as (keyof typeof RANGES)[]).map((sub) =>
        loadFont({
          family,
          weight,
          url: staticFile(`fonts/${stem}-${sub}-${weight}-${style}.woff2`),
          style,
          unicodeRange: RANGES[sub],
          display: "block",
        }),
      ),
    ),
  );
