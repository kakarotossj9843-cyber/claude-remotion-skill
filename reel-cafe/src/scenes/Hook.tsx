import React from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";
import { Breathe, KenBurns, Kicker, SceneShell, Scrim, WordReveal } from "../components/Motion";
import { TextExit } from "../components/TextExit";
import { theme } from "../theme";

// Escena 1 — HOOK: granos tostados + afirmación
export const Hook: React.FC<{ duration: number }> = ({ duration }) => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill>
      <SceneShell duration={duration} enter={false}>
        <KenBurns src="beans.png" duration={duration} from={1.04} to={1.14} panY={-40} />
        <Scrim side="bottom" size={0.62} />
      </SceneShell>
      <TextExit duration={duration}>
        <AbsoluteFill
          style={{
            justifyContent: "flex-end",
            alignItems: "center",
            paddingBottom: 360,
            paddingLeft: 80,
            paddingRight: 80,
            gap: 36,
          }}
        >
          <Kicker text="CAFÉ DE ESPECIALIDAD" delay={Math.round(fps * 0.1)} />
          <Breathe amp={4}>
            <WordReveal
              text="No todo el café es igual."
              heroWord="igual."
              delay={Math.round(fps * 0.3)}
              per={4}
              style={{
                fontFamily: theme.fonts.display,
                fontWeight: 700,
                fontSize: 132,
                lineHeight: 1.05,
                letterSpacing: "-0.03em",
                color: theme.colors.text,
                textAlign: "center",
              }}
            />
          </Breathe>
        </AbsoluteFill>
      </TextExit>
    </AbsoluteFill>
  );
};
