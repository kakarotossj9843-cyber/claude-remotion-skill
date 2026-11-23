// theme.ts — única fuente de verdad (paleta "warm premium" para café).
// NUNCA hex, easing o springs inline en componentes.
import { Easing } from "remotion";

export const theme = {
  colors: {
    bg: "#1A120B",
    bgAlt: "#2A1C12",
    primary: "#E8A33D", // color héroe — máx. un elemento por frame
    accent: "#F4E9DA", // crema
    text: "#F4E9DA",
    textDim: "#CDBBA5",
    scrim: "rgba(18, 11, 6, 0.86)",
    glow: "rgba(232, 163, 61, 0.45)",
  },
  fonts: {
    display: "Fraunces",
    body: "Inter",
  },
  ease: {
    out: Easing.bezier(0.16, 1, 0.3, 1),
    inOut: Easing.bezier(0.83, 0, 0.17, 1),
    in: Easing.bezier(0.7, 0, 0.84, 0),
  },
  spring: {
    snappy: { damping: 14, stiffness: 160, mass: 0.6 },
    smooth: { damping: 20, stiffness: 90, mass: 1 },
    bouncy: { damping: 11, stiffness: 170, mass: 0.7 },
  },
  // Duraciones en segundos; se convierten a frames con fps.
  timing: {
    total: 10,
    scene: 10 / 3,
    overlap: 0.2,
    exit: 0.35,
  },
} as const;

export const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;
