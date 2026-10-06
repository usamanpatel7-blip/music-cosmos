import React from "react";
import { Composition, Folder } from "remotion";
import { Film } from "./comic/Film";
import { Film as PeepsFilm } from "./peeps/Film";
import { FPS } from "./comic/kit";
import { END } from "./lib/data";
import { Probe } from "./peeps/Probe";
import { Probe as ComicProbe, Strip as ComicStrip } from "./comic/Probe";
import { CatalogBodies, CatalogFaces, CatalogHair } from "./lab/Catalog";
import { loadFonts } from "./fonts";
import { LibFilm } from "./lib/Film";

loadFonts();

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Film" component={LibFilm} durationInFrames={Math.round(END * FPS)} fps={FPS} width={1920} height={1080} defaultProps={{ subtitles: true }} />
    <Folder name="sketches">
      <Composition id="ComicFilm" component={Film} durationInFrames={Math.round(END * FPS)} fps={FPS} width={1920} height={1080} defaultProps={{ subtitles: true }} />
      <Composition id="Strip" component={LibFilm} durationInFrames={2} fps={FPS} width={1920} height={1080} defaultProps={{ subtitles: true, at: [1, 2] as number[] }} calculateMetadata={({ props }) => ({ durationInFrames: props.at?.length ?? 1 })} />
      <Composition id="PeepsFilm" component={PeepsFilm} durationInFrames={Math.round(END * FPS)} fps={FPS} width={1920} height={1080} defaultProps={{ subtitles: true }} />
      <Composition id="ComicStrip" component={ComicStrip} defaultProps={{ times: [1, 2] }} calculateMetadata={({ props }) => ({ durationInFrames: props.times.length })} durationInFrames={2} fps={FPS} width={1920} height={1080} />
      <Composition id="ComicProbe" component={ComicProbe} defaultProps={{ t: 12 }} durationInFrames={1} fps={FPS} width={1920} height={1080} />
      <Composition id="Probe" component={Probe} defaultProps={{ t: 12 }} durationInFrames={1} fps={FPS} width={1920} height={1080} />
      <Composition id="CatalogBodies" component={CatalogBodies} defaultProps={{ page: 0 }} durationInFrames={1} fps={FPS} width={1920} height={1080} />
      <Composition id="CatalogFaces" component={CatalogFaces} durationInFrames={1} fps={FPS} width={1920} height={1080} />
      <Composition id="CatalogHair" component={CatalogHair} durationInFrames={1} fps={FPS} width={1920} height={1080} />
    </Folder>
  </>
);
