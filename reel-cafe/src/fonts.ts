import { continueRender, delayRender, staticFile } from "remotion";
import { theme } from "./theme";

const faces: [string, string, string, string][] = [
  [theme.fonts.display, "fonts/fraunces-latin-700-normal.woff2", "700", "normal"],
  [theme.fonts.display, "fonts/fraunces-latin-600-italic.woff2", "600", "italic"],
  [theme.fonts.body, "fonts/inter-latin-500-normal.woff2", "500", "normal"],
  [theme.fonts.body, "fonts/inter-latin-700-normal.woff2", "700", "normal"],
];

const handle = delayRender("Cargando fuentes");
Promise.all(
  faces.map(([family, file, weight, style]) => {
    const f = new FontFace(family, `url(${staticFile(file)}) format("woff2")`, {
      weight,
      style,
    });
    return f.load().then((loaded) => (document.fonts as unknown as Set<FontFace>).add(loaded));
  }),
)
  .then(() => continueRender(handle))
  .catch((e) => {
    console.error(e);
    continueRender(handle);
  });
