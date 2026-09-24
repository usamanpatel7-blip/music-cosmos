import React from "react";
import { Composition, Folder } from "remotion";
import { Cast } from "./Chapter";
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
