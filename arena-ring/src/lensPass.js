// Custom post-processing pass: radial lens distortion + chromatic aberration.
// This is the "lens-distortion" / "chromatic-aberration" shader the original
// bzorsystems POC layers over its 3D scene via EffectComposer.
export const LensDistortionShader = {
  uniforms: {
    tDiffuse:     { value: null },
    uAberration:  { value: 0.85 }, // chromatic split strength
    uDistortion:  { value: 0.35 }, // barrel distortion at edges
    uVignette:    { value: 0.35 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uAberration;
    uniform float uDistortion;
    uniform float uVignette;
    varying vec2 vUv;

    // barrel-distort a uv around center
    vec2 distort(vec2 uv, float k) {
      vec2 c = uv - 0.5;
      float r2 = dot(c, c);
      return 0.5 + c * (1.0 + k * r2);
    }

    void main() {
      vec2 dir = vUv - 0.5;
      float r = length(dir) * 2.0;            // 0 center -> ~1.4 corner
      float k = uDistortion;

      // per-channel offset scales with distance from center -> CA grows at edges
      float a = uAberration * 0.01 * r;
      vec2 ruv = distort(vUv + dir * a,        k);
      vec2 guv = distort(vUv,                   k);
      vec2 buv = distort(vUv - dir * a,        k);

      float cr = texture2D(tDiffuse, ruv).r;
      float cg = texture2D(tDiffuse, guv).g;
      float cb = texture2D(tDiffuse, buv).b;
      vec3 col = vec3(cr, cg, cb);

      // soft vignette
      col *= 1.0 - uVignette * smoothstep(0.5, 1.3, r);

      gl_FragColor = vec4(col, 1.0);
    }
  `,
};
