import React from "react";
import { Composition } from "remotion";
import { Reel } from "./Reel";
import { theme } from "./theme";

const FPS = 30;

export const Root: React.FC = () => (
  <Composition
    id="ReelCafe"
    component={Reel}
    durationInFrames={Math.round(theme.timing.sceneBeats.reduce((a, b) => a + b, 0) * (60 / theme.timing.bpm) * FPS)}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
