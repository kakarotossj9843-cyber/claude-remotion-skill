// theme3.ts — "HIERRO". Warm-premium palette: one ember hero, one oxygen-blue accent.
import { Easing } from "remotion";

export const H = {
  colors: {
    bg: "#07060A",
    bgAlt: "#120D0B",
    hero: "#F08A3C", // the iron atom — max one hero element per frame
    heroGlow: "rgba(240, 138, 60, 0.55)",
    accent: "#7FB8D6", // oxygen
    blood: "#6E0F18",
    bloodDeep: "#2A0508",
    cell: "#B3262F",
    text: "#F4E9DA",
    textDim: "#A89A8A",
    starCore: "#FFF4D6",
    starMid: "#FFB347",
    starEdge: "#C2381F",
  },
  fonts: {
    serif: "Fraunces",
    display: "Space Grotesk",
    mono: "JetBrains Mono",
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
    slow: { damping: 26, stiffness: 40, mass: 1.2 },
  },
  // scene lengths in seconds
  scenes: { hook: 4.5, star: 6, nova: 4.5, nebula: 6, earth: 6, blood: 9, end: 7 },
  bpm: 72, // heartbeat
} as const;

export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
