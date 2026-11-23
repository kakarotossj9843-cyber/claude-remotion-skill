import React from "react";
import {
  AbsoluteFill,
  Img,
  OffthreadVideo,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { clamp, theme } from "../theme";

// Entrada premium: opacidad + subida + escala (nunca un fade solo)
export const Entrance: React.FC<{
  delay?: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ delay = 0, children, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - delay, fps, config: theme.spring.smooth });
  return (
    <div
      style={{
        opacity: p,
        transform: `translateY(${interpolate(p, [0, 1], [40, 0])}px) scale(${interpolate(p, [0, 1], [0.94, 1])})`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

// Revelado palabra por palabra (gap en px, nunca em)
export const WordReveal: React.FC<{
  text: string;
  delay?: number;
  per?: number;
  heroWord?: string;
  underlineWord?: string;
  gap?: number;
  style?: React.CSSProperties;
}> = ({ text, delay = 0, per = 3, heroWord, underlineWord, gap = 22, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const words = text.split(" ");
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        columnGap: gap,
        rowGap: 0,
        justifyContent: "center",
        ...style,
      }}
    >
      {words.map((word, i) => {
        const start = delay + i * per;
        const p = spring({ frame: frame - start, fps, config: theme.spring.snappy });
        const isHero = heroWord !== undefined && word === heroWord;
        const isUnder = underlineWord !== undefined && word === underlineWord;
        // El subrayado entra 5 frames después de que aterriza la palabra
        const u = interpolate(
          frame,
          [start + Math.round(fps * 0.35), start + Math.round(fps * 0.75)],
          [0, 1],
          { ...clamp, easing: theme.ease.out },
        );
        return (
          <span
            key={i}
            style={{
              position: "relative",
              display: "inline-block",
              opacity: p,
              transform: `translateY(${interpolate(p, [0, 1], [46, 0])}px) scale(${interpolate(p, [0, 1], [0.9, 1])})`,
              filter: `blur(${interpolate(p, [0, 1], [8, 0], clamp)}px)`,
              color: isHero ? theme.colors.primary : undefined,
              fontStyle: isHero || isUnder ? "italic" : undefined,
              fontWeight: isHero || isUnder ? 600 : undefined,
              textShadow: isHero
                ? `0 0 60px ${theme.colors.primary}66, 0 0 120px ${theme.colors.primary}33`
                : undefined,
            }}
          >
            {word}
            {isUnder ? (
              <span
                style={{
                  position: "absolute",
                  left: 0,
                  bottom: "0.02em",
                  height: 8,
                  width: "100%",
                  borderRadius: 8,
                  background: theme.colors.accent,
                  transform: `scaleX(${u})`,
                  transformOrigin: "0% 50%",
                  opacity: 0.85,
                }}
              />
            ) : null}
          </span>
        );
      })}
    </div>
  );
};

// Kicker: línea que se dibuja + etiqueta en mayúsculas con letras escalonadas
export const Kicker: React.FC<{ text: string; delay?: number }> = ({
  text,
  delay = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const line = interpolate(frame, [delay, delay + fps * 0.6], [0, 1], {
    ...clamp,
    easing: theme.ease.out,
  });
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
      <div
        style={{
          width: 64,
          height: 3,
          background: theme.colors.textDim,
          transform: `scaleX(${line})`,
          transformOrigin: "100% 50%",
        }}
      />
      <div
        style={{
          fontFamily: theme.fonts.body,
          fontWeight: 700,
          fontSize: 30,
          letterSpacing: "0.32em",
          color: theme.colors.textDim,
          display: "flex",
        }}
      >
        {text.split("").map((ch, i) => {
          const p = spring({
            frame: frame - delay - 3 - i * 0.6,
            fps,
            config: theme.spring.snappy,
          });
          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                whiteSpace: "pre",
                opacity: p,
                transform: `translateY(${interpolate(p, [0, 1], [18, 0])}px)`,
              }}
            >
              {ch}
            </span>
          );
        })}
      </div>
      <div
        style={{
          width: 64,
          height: 3,
          background: theme.colors.textDim,
          transform: `scaleX(${line})`,
          transformOrigin: "0% 50%",
        }}
      />
    </div>
  );
};

// Micro-movimiento para elementos en pantalla > 2 s
export const Breathe: React.FC<{
  children: React.ReactNode;
  amp?: number;
  speed?: number;
}> = ({ children, amp = 6, speed = 1 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = (frame / fps) * speed;
  return (
    <div
      style={{
        transform: `translateY(${Math.sin(t * 2.1) * amp}px) scale(${1 + Math.sin(t * 1.4) * 0.006})`,
      }}
    >
      {children}
    </div>
  );
};

// Ken Burns para fotos + zoom de entrada (transición entre escenas)
export const KenBurns: React.FC<{
  src: string;
  duration: number;
  from?: number;
  to?: number;
  panX?: number;
  panY?: number;
}> = ({ src, duration, from = 1, to = 1.08, panX = 0, panY = -30 }) => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [0, duration], [0, 1], {
    ...clamp,
    easing: theme.ease.inOut,
  });
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Img
        src={staticFile(src)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `scale(${interpolate(t, [0, 1], [from, to])}) translate(${panX * t}px, ${panY * t}px)`,
        }}
      />
    </AbsoluteFill>
  );
};

export const Footage: React.FC<{
  src: string;
  duration: number;
  startFrom?: number;
}> = ({ src, duration, startFrom = 0 }) => {
  const frame = useCurrentFrame();
  const s = interpolate(frame, [0, duration], [1.02, 1.1], {
    ...clamp,
    easing: theme.ease.inOut,
  });
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <OffthreadVideo
        src={staticFile(src)}
        startFrom={startFrom}
        muted
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `scale(${s})`,
        }}
      />
    </AbsoluteFill>
  );
};

// Transición: el asset entra con zoom + desenfoque y sale rápido
export const SceneShell: React.FC<{
  duration: number;
  enter?: boolean;
  exit?: boolean;
  children: React.ReactNode;
}> = ({ duration, enter = true, exit = true, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const inP = enter
    ? spring({ frame, fps, config: theme.spring.smooth, durationInFrames: Math.round(fps * 0.5) })
    : 1;
  const exitLen = Math.round(fps * theme.timing.exit);
  const out = exit
    ? interpolate(frame, [duration - exitLen, duration], [0, 1], {
        ...clamp,
        easing: theme.ease.in,
      })
    : 0;
  return (
    <AbsoluteFill
      style={{
        opacity: interpolate(inP, [0, 0.6], [0, 1], clamp) * (1 - out),
        transform: `scale(${interpolate(inP, [0, 1], [1.14, 1]) * interpolate(out, [0, 1], [1, 0.96])})`,
        filter: `blur(${interpolate(inP, [0, 1], [14, 0], clamp) + out * 10}px)`,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

// Scrim para legibilidad del texto sobre el asset
export const Scrim: React.FC<{ side: "top" | "bottom"; size?: number }> = ({
  side,
  size = 0.6,
}) => (
  <AbsoluteFill
    style={{
      background: `linear-gradient(${side === "bottom" ? "0deg" : "180deg"}, ${theme.colors.scrim} 0%, ${theme.colors.scrim.replace("0.86", "0.55")} ${size * 55}%, transparent ${size * 100}%)`,
    }}
  />
);
