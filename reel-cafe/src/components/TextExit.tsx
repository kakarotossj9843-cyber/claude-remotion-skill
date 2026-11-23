import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { clamp, theme } from "../theme";

// Salida del texto: más rápida que la entrada (~10 frames), sube y se desvanece
export const TextExit: React.FC<{
  duration: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ duration, children, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const len = Math.round(fps * theme.timing.exit);
  const end = duration - Math.round(fps * theme.timing.overlap);
  const p = interpolate(frame, [end - len, end], [0, 1], { ...clamp, easing: theme.ease.in });
  return (
    <AbsoluteFill
      style={{
        opacity: 1 - p,
        transform: `translateY(${-50 * p}px)`,
        filter: `blur(${6 * p}px)`,
        ...style,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};
