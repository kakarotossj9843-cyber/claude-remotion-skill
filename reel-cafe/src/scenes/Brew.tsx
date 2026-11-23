import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Breathe, Entrance, Footage, Kicker, SceneShell, Scrim, WordReveal } from "../components/Motion";
import { TextExit } from "../components/TextExit";
import { clamp, theme } from "../theme";

// Contador animado con cifras tabulares
const Counter: React.FC<{ to: number; delay: number; suffix: string }> = ({ to, delay, suffix }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = interpolate(frame, [delay, delay + fps * 0.9], [0, 1], { ...clamp, easing: theme.ease.out });
  const pop = spring({ frame: frame - delay, fps, config: theme.spring.bouncy });
  return (
    <div
      style={{
        fontFamily: theme.fonts.display,
        fontWeight: 700,
        fontSize: 260,
        lineHeight: 1,
        letterSpacing: "-0.04em",
        fontVariantNumeric: "tabular-nums",
        color: theme.colors.primary,
        textShadow: `0 0 60px ${theme.colors.primary}66, 0 0 120px ${theme.colors.primary}33`,
        opacity: interpolate(pop, [0, 0.5], [0, 1], clamp),
        transform: `scale(${interpolate(pop, [0, 1], [0.7, 1])}) translateY(${interpolate(pop, [0, 1], [40, 0])}px)`,
      }}
    >
      {Math.round(to * t)}
      <span style={{ fontSize: 140, marginLeft: 8 }}>{suffix}</span>
    </div>
  );
};

// Escena 2 — PROCESO: pour-over generado con video
export const Brew: React.FC<{ duration: number }> = ({ duration }) => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill>
      <SceneShell duration={duration}>
        <Footage src="pour.mp4" duration={duration} startFrom={Math.round(fps * 0.6)} />
        <Scrim side="top" size={0.55} />
      </SceneShell>
      <TextExit duration={duration}>
        <AbsoluteFill
          style={{
            justifyContent: "flex-start",
            alignItems: "center",
            paddingTop: 300,
            paddingLeft: 80,
            paddingRight: 80,
            gap: 18,
          }}
        >
          <Kicker text="EL MÉTODO" delay={Math.round(fps * 0.15)} />
          <Breathe amp={5}>
            <Counter to={93} delay={Math.round(fps * 0.25)} suffix="°C" />
          </Breathe>
          <Entrance delay={Math.round(fps * 0.6)}>
            <WordReveal
              text="Extracción lenta, sabor completo."
              underlineWord="completo."
              delay={Math.round(fps * 0.6)}
              per={3}
              gap={16}
              style={{
                fontFamily: theme.fonts.display,
                fontWeight: 700,
                fontSize: 76,
                lineHeight: 1.1,
                letterSpacing: "-0.02em",
                color: theme.colors.text,
                textAlign: "center",
                maxWidth: 860,
              }}
            />
          </Entrance>
        </AbsoluteFill>
      </TextExit>
    </AbsoluteFill>
  );
};
