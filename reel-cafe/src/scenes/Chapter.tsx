import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Breathe, Entrance, Footage, KenBurns, Kicker, Scrim, WordReveal } from "../components/Motion";
import { TextExit } from "../components/TextExit";
import { clamp, theme } from "../theme";

export type ChapterProps = {
  duration: number;
  image?: string;
  video?: string;
  pan?: { from: number; to: number; x: number; y: number };
  kicker?: string;
  headline: string;
  heroWord?: string;
  underlineWord?: string;
  headlineSize?: number;
  counter?: { to: number; suffix: string; delay: number; thousands?: boolean };
  chips?: { label: string; at: number }[];
  sub?: { text: string; at: number };
  cta?: { label: string; at: number };
  position: "top" | "bottom";
  isLast?: boolean;
};

const fmt = (n: number, thousands?: boolean) =>
  thousands ? Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") : String(Math.round(n));

const Counter: React.FC<NonNullable<ChapterProps["counter"]>> = ({ to, suffix, delay, thousands }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = interpolate(frame, [delay, delay + fps * 0.9], [0, 1], { ...clamp, easing: theme.ease.out });
  const pop = spring({ frame: frame - delay, fps, config: theme.spring.bouncy });
  return (
    <div
      style={{
        fontFamily: theme.fonts.display,
        fontWeight: 700,
        fontSize: 230,
        lineHeight: 1,
        letterSpacing: "-0.04em",
        fontVariantNumeric: "tabular-nums",
        color: theme.colors.primary,
        textShadow: `0 0 60px ${theme.colors.primary}66, 0 0 120px ${theme.colors.primary}33`,
        opacity: interpolate(pop, [0, 0.5], [0, 1], clamp),
        transform: `scale(${interpolate(pop, [0, 1], [0.7, 1])}) translateY(${interpolate(pop, [0, 1], [40, 0])}px)`,
        display: "flex",
        alignItems: "baseline",
      }}
    >
      {fmt(to * t, thousands)}
      <span style={{ fontSize: 110, marginLeft: 14, letterSpacing: "-0.02em" }}>{suffix}</span>
    </div>
  );
};

const Chip: React.FC<{ label: string; at: number }> = ({ label, at }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - at, fps, config: theme.spring.bouncy });
  return (
    <div
      style={{
        padding: "14px 30px",
        borderRadius: 999,
        border: `3px solid ${theme.colors.accent}`,
        background: "rgba(26, 18, 11, 0.55)",
        color: theme.colors.accent,
        fontFamily: theme.fonts.body,
        fontWeight: 700,
        fontSize: 40,
        opacity: interpolate(p, [0, 0.4], [0, 1], clamp),
        transform: `translateY(${interpolate(p, [0, 1], [30, 0])}px) scale(${interpolate(p, [0, 1], [0.7, 1])})`,
      }}
    >
      {label}
    </div>
  );
};

const Sub: React.FC<{ text: string; at: number }> = ({ text, at }) => (
  <Entrance delay={at}>
    <div
      style={{
        fontFamily: theme.fonts.body,
        fontWeight: 500,
        fontSize: 46,
        color: theme.colors.textDim,
        textAlign: "center",
      }}
    >
      {text}
    </div>
  </Entrance>
);

const CTA: React.FC<{ label: string; at: number }> = ({ label, at }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - at, fps, config: theme.spring.bouncy });
  const settled = interpolate(p, [0.8, 1], [0, 1], clamp);
  const pulse = 1 + Math.sin((frame - at) / (fps * 0.18)) * 0.012 * settled;
  const arrow = interpolate(frame, [at + fps * 0.3, at + fps * 0.7], [-20, 0], { ...clamp, easing: theme.ease.out });
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
        boxShadow: `0 0 60px ${theme.colors.primary}66, 0 0 120px ${theme.colors.primary}33`,
        opacity: interpolate(p, [0, 0.4], [0, 1], clamp),
        transform: `translateY(${interpolate(p, [0, 1], [50, 0])}px) scale(${interpolate(p, [0, 1], [0.8, 1]) * pulse})`,
      }}
    >
      {label}
      <svg
        width="40"
        height="40"
        viewBox="0 0 24 24"
        style={{ transform: `translateX(${arrow}px)`, opacity: interpolate(arrow, [-20, 0], [0, 1]) }}
      >
        <path d="M4 12h15M13 5l7 7-7 7" fill="none" stroke={theme.colors.bg} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
};

export const Chapter: React.FC<ChapterProps> = (props) => {
  const { duration, position, isLast } = props;
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  // El asset "se asienta" mientras el café se drena
  const settle = interpolate(frame, [0, fps * theme.timing.pourDrain * 1.6], [1.08, 1], {
    ...clamp,
    easing: theme.ease.out,
  });
  const pan = props.pan ?? { from: 1.02, to: 1.1, x: 0, y: -30 };
  const textStart = Math.round(fps * theme.timing.pourDrain * 0.55);

  const content = (
    <AbsoluteFill
      style={{
        justifyContent: position === "top" ? "flex-start" : "flex-end",
        alignItems: "center",
        paddingTop: position === "top" ? 290 : 0,
        paddingBottom: position === "bottom" ? 330 : 0,
        paddingLeft: 80,
        paddingRight: 80,
        gap: 30,
      }}
    >
      {props.kicker ? <Kicker text={props.kicker} delay={textStart} /> : null}
      {props.counter ? (
        <Breathe amp={5}>
          <Counter {...props.counter} />
        </Breathe>
      ) : null}
      <Breathe amp={4}>
        <WordReveal
          text={props.headline}
          heroWord={props.heroWord}
          underlineWord={props.underlineWord}
          delay={textStart + Math.round(fps * (props.counter ? 0.45 : 0.15))}
          per={4}
          gap={props.headlineSize && props.headlineSize < 100 ? 18 : 24}
          style={{
            fontFamily: theme.fonts.display,
            fontWeight: 700,
            fontSize: props.headlineSize ?? 120,
            lineHeight: 1.06,
            letterSpacing: "-0.03em",
            color: theme.colors.text,
            textAlign: "center",
            maxWidth: 920,
          }}
        />
      </Breathe>
      {props.chips ? (
        <div style={{ display: "flex", gap: 18, flexWrap: "wrap", justifyContent: "center", marginTop: 10 }}>
          {props.chips.map((c) => (
            <Chip key={c.label} label={c.label} at={c.at} />
          ))}
        </div>
      ) : null}
      {props.sub ? <Sub {...props.sub} /> : null}
      {props.cta ? (
        <div style={{ marginTop: 20 }}>
          <CTA {...props.cta} />
        </div>
      ) : null}
    </AbsoluteFill>
  );

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ transform: `scale(${settle})` }}>
        {props.video ? (
          <Footage src={props.video} duration={duration} startFrom={Math.round(fps * 0.3)} />
        ) : (
          <KenBurns src={props.image!} duration={duration} from={pan.from} to={pan.to} panX={pan.x} panY={pan.y} />
        )}
        <Scrim side={position} size={position === "top" ? 0.58 : 0.66} />
      </AbsoluteFill>
      {isLast ? content : <TextExit duration={duration}>{content}</TextExit>}
    </AbsoluteFill>
  );
};
