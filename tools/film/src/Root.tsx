import React from "react";
import { Composition, Folder } from "remotion";
import { Cast } from "./Chapter";
import { Cast2 } from "./v2/Cast2";
import { FrameNow, FrameRoom, FrameStage } from "./v2/Frames";
import { Film } from "./Film";
import { FILM_END } from "./engine";
import { loadFonts } from "./fonts";

loadFonts();

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="Film"
      component={Film}
      durationInFrames={Math.round(FILM_END * 24)}
      fps={24}
      width={1280}
      height={720}
      defaultProps={{ subtitles: true }}
    />
    <Folder name="sketches">
      <Composition id="FrameRoom" component={FrameRoom} durationInFrames={48} fps={24} width={1920} height={1080} />
      <Composition id="FrameStage" component={FrameStage} durationInFrames={48} fps={24} width={1920} height={1080} />
      <Composition id="FrameNow" component={FrameNow} durationInFrames={48} fps={24} width={1920} height={1080} />
      <Composition id="Cast2" component={Cast2} durationInFrames={48} fps={24} width={1920} height={1080} />
      <Composition
        id="Cast"
        component={Cast}
        durationInFrames={48}
        fps={24}
        width={1600}
        height={900}
      />
    </Folder>
  </>
);
