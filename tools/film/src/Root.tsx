import React from "react";
import { Composition, Folder } from "remotion";
import { Film } from "./peeps/Film";
import { END, FPS } from "./peeps/kit";
import { Probe } from "./peeps/Probe";
import { CatalogBodies, CatalogFaces, CatalogHair } from "./lab/Catalog";
import { loadFonts } from "./fonts";

loadFonts();

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Film" component={Film} durationInFrames={END * FPS} fps={FPS} width={1920} height={1080} defaultProps={{ subtitles: true }} />
    <Folder name="sketches">
      <Composition id="Probe" component={Probe} defaultProps={{ t: 12 }} durationInFrames={1} fps={FPS} width={1920} height={1080} />
      <Composition id="CatalogBodies" component={CatalogBodies} defaultProps={{ page: 0 }} durationInFrames={1} fps={FPS} width={1920} height={1080} />
      <Composition id="CatalogFaces" component={CatalogFaces} durationInFrames={1} fps={FPS} width={1920} height={1080} />
      <Composition id="CatalogHair" component={CatalogHair} durationInFrames={1} fps={FPS} width={1920} height={1080} />
    </Folder>
  </>
);
