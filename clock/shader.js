// ─── WebGL Shader Module ────────────────────────────────────────────────────
// Extracted from prototype-01.html — Perlin noise field with palette transitions

const VS = `
attribute vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

const FS = `
precision highp float;

uniform float u_time;
uniform vec2  u_res;
uniform vec3  u_cA;
uniform vec3  u_cB;
uniform float u_blend;
uniform float u_bpm;
uniform int   u_wipe;

vec2 hash2(vec2 p) {
  p = vec2(dot(p,vec2(127.1,311.7)), dot(p,vec2(269.5,183.3)));
  return -1.0 + 2.0*fract(sin(p)*43758.5453123);
}
float gnoise(vec2 p) {
  vec2 i=floor(p), f=fract(p), u=f*f*(3.0-2.0*f);
  return mix(
    mix(dot(hash2(i),f), dot(hash2(i+vec2(1,0)),f-vec2(1,0)),u.x),
    mix(dot(hash2(i+vec2(0,1)),f-vec2(0,1)), dot(hash2(i+vec2(1,1)),f-vec2(1,1)),u.x),u.y);
}
float fbm(vec2 p) {
  float v=0.0,a=0.5;
  mat2 R=mat2(0.866,0.5,-0.5,0.866);
  for(int i=0;i<6;i++){v+=a*gnoise(p);p=R*p*2.1+vec2(5.2,1.3);a*=0.5;}
  return v;
}
float field(vec2 uv, float t) {
  vec2 q=vec2(fbm(uv+t*0.16),fbm(uv+vec2(5.2,1.3)+t*0.12));
  vec2 r=vec2(fbm(uv+1.8*q+vec2(1.7,9.2)+t*0.07),fbm(uv+1.8*q+vec2(8.3,2.8)+t*0.06));
  return fbm(uv+2.2*r+t*0.03);
}

vec2 crispWipe(float line, float p) {
  float EDGE  = 0.0028;
  float mask  = smoothstep(p-EDGE, p+EDGE, line);
  float ahead = line - p;
  float gleam = smoothstep(0.0, 0.022, ahead) * smoothstep(0.048, 0.022, ahead);
  return vec2(mask, gleam);
}

void main() {
  vec2 uv  = gl_FragCoord.xy / u_res;
  float ar = u_res.x / u_res.y;
  vec2 uvF = vec2(uv.x*ar, uv.y);

  float speed = 0.14 + (u_bpm/120.0)*0.18;
  float t     = u_time * speed;
  float f     = field(uvF*1.35, t)*0.5+0.5;

  vec3 cA = u_cA/255.0;
  vec3 cB = u_cB/255.0;
  vec3 colA = mix(cA*0.84, cA*1.05, f);
  vec3 colB = mix(cB*0.84, cB*1.05, f);

  float mask=0.0, gleam=0.0;
  vec2 wg;

  if (u_wipe==0) {
    mask = u_blend;
  } else if (u_wipe==1) {
    wg=crispWipe(uv.x, u_blend); mask=wg.x; gleam=wg.y;
  } else if (u_wipe==2) {
    wg=crispWipe(uv.y, u_blend); mask=wg.x; gleam=wg.y;
  } else if (u_wipe==3) {
    float d=(uv.x+(1.0-uv.y))*0.5;
    wg=crispWipe(d, u_blend); mask=wg.x; gleam=wg.y;
  } else if (u_wipe==4) {
    float dist=length(uv-vec2(0.5))*1.4142;
    wg=crispWipe(1.0-dist, u_blend); mask=wg.x; gleam=wg.y;
  } else {
    float band    = floor(uv.y*10.0)/10.0;
    float stagger = band*0.22;
    float lp      = clamp((u_blend-stagger)/(1.0-0.22), 0.0, 1.0);
    wg=crispWipe(uv.x, lp); mask=wg.x; gleam=wg.y;
  }

  vec3 col = mix(colA, colB, mask);
  col = col + gleam*(vec3(1.0)-col)*0.55;

  // Vignette
  vec2 v=uv*2.0-1.0;
  col *= 0.80+0.20*(1.0-smoothstep(0.5,1.3,length(v)));

  gl_FragColor = vec4(col,1.0);
}
`;

const PALETTE = [
  [228,212,196], [172,152,185], [132,172,152], [198,132,112],
  [112,142,198], [208,182,128], [148,195,208], [202,152,172],
  [ 98,122,158], [178,200,168], [218,175,142], [152,172,195],
];

export class Shader {
  constructor(canvas) {
    this.canvas = canvas;
    this.gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    this.idxA = 0;
    this.idxB = 1;
    this._setup();
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  _setup() {
    const gl = this.gl;
    const mkShader = (type, src) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(s));
      return s;
    };

    const prog = gl.createProgram();
    gl.attachShader(prog, mkShader(gl.VERTEX_SHADER, VS));
    gl.attachShader(prog, mkShader(gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const vbuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,1,1]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog, 'a_pos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    this.U = {
      time:  gl.getUniformLocation(prog, 'u_time'),
      res:   gl.getUniformLocation(prog, 'u_res'),
      cA:    gl.getUniformLocation(prog, 'u_cA'),
      cB:    gl.getUniformLocation(prog, 'u_cB'),
      blend: gl.getUniformLocation(prog, 'u_blend'),
      bpm:   gl.getUniformLocation(prog, 'u_bpm'),
      wipe:  gl.getUniformLocation(prog, 'u_wipe'),
    };
  }

  resize() {
    const gl = this.gl;
    const dpr = Math.min(devicePixelRatio, 2);
    this.canvas.width  = innerWidth  * dpr;
    this.canvas.height = innerHeight * dpr;
    this.canvas.style.width  = innerWidth  + 'px';
    this.canvas.style.height = innerHeight + 'px';
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
  }

  advancePalette() {
    this.idxA = this.idxB;
    this.idxB = (this.idxB + 1) % PALETTE.length;
  }

  render(elapsed, blend, bpm, wipeType) {
    const gl = this.gl;
    gl.uniform1f(this.U.time, elapsed);
    gl.uniform2f(this.U.res, this.canvas.width, this.canvas.height);
    gl.uniform3fv(this.U.cA, PALETTE[this.idxA]);
    gl.uniform3fv(this.U.cB, PALETTE[this.idxB]);
    gl.uniform1f(this.U.blend, blend);
    gl.uniform1f(this.U.bpm, bpm);
    gl.uniform1i(this.U.wipe, wipeType);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
}
