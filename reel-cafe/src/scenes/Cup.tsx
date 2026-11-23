import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Breathe, KenBurns, SceneShell, Scrim, WordReveal } from "../components/Motion";
import { clamp, theme } from "../theme";

const CTA: React.FC<{ delay: number }> = ({ delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - delay, fps, config: theme.spring.bouncy });
  const pulse = 1 + Math.sin((frame - delay) / (fps * 0.18)) * 0.012 * interpolate(p, [0.8, 1], [0, 1], clamp);
  const arrow = interpolate(frame, [delay + fps * 0.3, delay + fps * 0.7], [-20, 0], { ...clamp, easing: theme.ease.out });
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 18,
        padding: "30px 60px",
        borderRadius: 999,
        background: theme.colors.primary,
        color: theme.colors.bg,
        fontFamily: theme.fonts.body,
        fontWeight: 700,
        fontSize: 50,
        letterSpacing: "-0.01em",
        boxShadow: `0 0 60px ${theme.colors.primary}66, 0 0 120px ${theme.colors.primary}33`,
        opacity: interpolate(p, [0, 0.4], [0, 1], clamp),
        transform: `translateY(${interpolate(p, [0, 1], [50, 0])}px) scale(${interpolate(p, [0, 1], [0.8, 1]) * pulse})`,
      }}
    >
      Pruébalo hoy
      <svg width="40" height="40" viewBox="0 0 24 24" style={{ transform: `translateX(${arrow}px)`, opacity: interpolate(arrow, [-20, 0], [0, 1]) }}>
        <path d="M4 12h15M13 5l7 7-7 7" fill="none" stroke={theme.colors.bg} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
};

// Escena 3 — PAYOFF + CTA: taza con latte art
export const Cup: React.FC<{ duration: number }> = ({ duration }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  // Fundido final a negro (últimos 0.35 s)
  const end = interpolate(frame, [duration - fps * 0.35, duration], [0, 1], { ...clamp, easing: theme.ease.in });
  return (
    <AbsoluteFill>
      <SceneShell duration={duration} exit={false}>
        <KenBurns src="latte.png" duration={duration} from={1.06} to={1.14} panX={-20} panY={-70} />
        <Scrim side="bottom" size={0.65} />
      </SceneShell>
      <AbsoluteFill
        style={{
          justifyContent: "flex-end",
          alignItems: "center",
          paddingBottom: 340,
          paddingLeft: 80,
          paddingRight: 80,
          gap: 56,
        }}
      >
        <Breathe amp={4}>
          <WordReveal
            text="Cada taza cuenta una historia."
            underlineWord="historia."
            delay={Math.round(fps * 0.2)}
            per={4}
            style={{
              fontFamily: theme.fonts.display,
              fontWeight: 700,
              fontSize: 112,
              lineHeight: 1.05,
              letterSpacing: "-0.03em",
              color: theme.colors.text,
              textAlign: "center",
            }}
          />
        </Breathe>
        <CTA delay={Math.round(fps * 1.2)} />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: theme.colors.bg, opacity: end }} />
    </AbsoluteFill>
  );
};
