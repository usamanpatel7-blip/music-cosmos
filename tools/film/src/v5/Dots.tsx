import React, { useLayoutEffect, useMemo } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";

/* Точки-записи: плоские круглые диски, как на сайте, но в 3D и с настоящей
   глубиной резкости — вне фокуса точка расплывается в мягкий кружок (боке).
   Размер задаётся в единицах мира; цвет — sRGB, как в CSS. */
const VERT = /* glsl */ `
  attribute float size;
  attribute float alpha;
  attribute vec3 color;
  uniform float uScale;   // пикселей на единицу мира на расстоянии 1
  uniform float uFocus;   // расстояние резкости
  uniform float uAperture;
  uniform float uMaxBlur;
  varying vec3 vColor;
  varying float vAlpha;
  varying float vSoft;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    float dist = max(0.1, -mv.z);
    float px = size * uScale / dist;
    float blur = min(uMaxBlur, abs(dist - uFocus) * uAperture * uScale / dist * 0.08);
    float total = px + blur;
    gl_PointSize = max(1.0, total + 2.0);
    vColor = color;
    // энергия точки сохраняется: расплылась — стала прозрачнее
    vAlpha = alpha * clamp((px * px) / (total * total), 0.05, 1.0);
    vSoft = clamp((blur + 1.2) / (total + 2.0), 0.02, 1.0);
    gl_Position = projectionMatrix * mv;
  }
`;
const FRAG = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  varying float vSoft;
  void main() {
    vec2 c = gl_PointCoord * 2.0 - 1.0;
    float r = length(c);
    float a = 1.0 - smoothstep(1.0 - vSoft, 1.0, r);
    if (a <= 0.003) discard;
    gl_FragColor = vec4(vColor, a * vAlpha);
  }
`;

export type DotData = { p: Float32Array; c: Float32Array; s: Float32Array; a?: Float32Array };

export const Dots: React.FC<{ data: DotData; focus?: number; aperture?: number; maxBlur?: number; additive?: boolean; renderOrder?: number }> = ({ data, focus = 12, aperture = 0, maxBlur = 60, additive = false, renderOrder = 0 }) => {
  const { gl, size, camera } = useThree();
  const n = data.s.length;
  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    g.setAttribute("color", new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    g.setAttribute("size", new THREE.BufferAttribute(new Float32Array(n), 1));
    g.setAttribute("alpha", new THREE.BufferAttribute(new Float32Array(n), 1));
    return g;
  }, [n]);
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: VERT,
        fragmentShader: FRAG,
        transparent: true,
        depthWrite: false,
        blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
        uniforms: { uScale: { value: 1 }, uFocus: { value: focus }, uAperture: { value: aperture }, uMaxBlur: { value: maxBlur } },
      }),
    [additive], // eslint-disable-line react-hooks/exhaustive-deps
  );
  useLayoutEffect(() => {
    const fov = (camera as THREE.PerspectiveCamera).fov ?? 45;
    mat.uniforms.uScale.value = (size.height * gl.getPixelRatio()) / (2 * Math.tan((fov * Math.PI) / 360));
    mat.uniforms.uFocus.value = focus;
    mat.uniforms.uAperture.value = aperture;
    mat.uniforms.uMaxBlur.value = maxBlur;
    (geom.attributes.position as THREE.BufferAttribute).set(data.p);
    (geom.attributes.color as THREE.BufferAttribute).set(data.c);
    (geom.attributes.size as THREE.BufferAttribute).set(data.s);
    (geom.attributes.alpha as THREE.BufferAttribute).set(data.a ?? new Float32Array(n).fill(1));
    for (const k of ["position", "color", "size", "alpha"]) geom.attributes[k].needsUpdate = true;
    geom.computeBoundingSphere();
  }, [data, focus, aperture, maxBlur, geom, mat, gl, size, camera, n]);
  return <points geometry={geom} material={mat} frustumCulled={false} renderOrder={renderOrder} />;
};
