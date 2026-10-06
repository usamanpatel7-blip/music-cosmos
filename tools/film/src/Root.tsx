import React from "react";
import { Composition, Folder } from "remotion";
import { Film } from "./comic/Film";
import { Film as PeepsFilm } from "./peeps/Film";
import { END, FPS } from "./comic/kit";
import { Probe } from "./peeps/Probe";
import { Probe as ComicProbe, Strip as ComicStrip } from "./comic/Probe";
import { CatalogBodies, CatalogFaces, CatalogHair } from "./lab/Catalog";
import { loadFonts } from "./fonts";

loadFonts();

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Film" component={Film} durationInFrames={END * FPS} fps={FPS} width={1920} height={1080} defaultProps={{ subtitles: true }} />
    <Folder name="sketches">
      <Composition id="PeepsFilm" component={PeepsFilm} durationInFrames={END * FPS} fps={FPS} width={1920} height={1080} defaultProps={{ subtitles: true }} />
      <Composition id="ComicStrip" component={ComicStrip} defaultProps={{ times: [1, 2] }} calculateMetadata={({ props }) => ({ durationInFrames: props.times.length })} durationInFrames={2} fps={FPS} width={1920} height={1080} />
      <Composition id="ComicProbe" component={ComicProbe} defaultProps={{ t: 12 }} durationInFrames={1} fps={FPS} width={1920} height={1080} />
      <Composition id="Probe" component={Probe} defaultProps={{ t: 12 }} durationInFrames={1} fps={FPS} width={1920} height={1080} />
      <Composition id="CatalogBodies" component={CatalogBodies} defaultProps={{ page: 0 }} durationInFrames={1} fps={FPS} width={1920} height={1080} />
      <Composition id="CatalogFaces" component={CatalogFaces} durationInFrames={1} fps={FPS} width={1920} height={1080} />
      <Composition id="CatalogHair" component={CatalogHair} durationInFrames={1} fps={FPS} width={1920} height={1080} />
    </Folder>
  </>
);
