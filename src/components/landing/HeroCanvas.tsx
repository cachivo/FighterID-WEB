import { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * HeroCanvas — animated Perlin-noise grain field rendered into a fullscreen
 * WebGL triangle. Background runs only while the canvas is in viewport.
 * Self-contained — no R3F dependency.
 */
const VERT = /* glsl */ `
attribute vec2 a_pos;
void main() {
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`;

const FRAG = /* glsl */ `
precision highp float;
uniform float u_time;
uniform vec2 u_res;
uniform vec2 u_mouse;
#define SEED 2.71828

float hash11(float x) {
  x = fract(x * 362.437);
  return fract(x * x * 7.13) * 4.72;
}

float hash21(vec2 p) {
  vec2 p2 = fract(p * vec2(5.3983, 5.4427));
  p2.x += dot(p2.yx, p2.xy + vec2(21.5351, 14.8137));
  return fract(p2.x * p2.x * 7.13);
}

float vnoise(vec3 p) {
  float skew = 0.3333333;
  float rs = 0.1666667;
  mat3 m = mat3(1.0,0.0,rs, 0.0,1.0,rs, rs,rs,1.0);
  vec3 sp = p + skew * (p.x + p.y + p.z);
  vec3 ip = floor(sp);
  vec3 fp = fract(sp);
  bool a = fp.x >= fp.y;
  bool b = fp.x >= fp.z;
  bool c = fp.y >= fp.z;
  vec3 i1 = a ? vec3(1.0,0.0,0.0) : vec3(0.0,1.0,0.0);
  vec3 i2;
  if (b) {
    i2 = vec3(1.0,0.0,0.0);
  } else if (c) {
    i2 = vec3(0.0,1.0,0.0);
  } else {
    i2 = vec3(0.0,0.0,1.0);
  }
  vec3 p0 = p - ip * m[0].x;
  vec3 p1 = p0 - i1 * m[1].y;
  vec3 p2 = p0 - i2 * m[2].z;
  vec3 p3 = p0 - vec3(1.0);
  float h0 = hash11(dot(ip, vec3(7.13,3.71,9.19)) + SEED);
  float h1 = hash11(dot(ip + i1, vec3(7.13,3.71,9.19)) + SEED);
  float h2 = hash11(dot(ip + i2, vec3(7.13,3.71,9.19)) + SEED);
  float h3 = hash11(dot(ip + vec3(1.0), vec3(7.13,3.71,9.19)) + SEED);
  float t0 = h0 * 6.2831853;
  float t1 = h1 * 6.2831853;
  float t2 = h2 * 6.2831853;
  float t3 = h3 * 6.2831853;
  vec3 g0 = vec3(cos(t0), sin(t0), cos(t0*0.7)*sin(t0*0.7));
  vec3 g1 = vec3(cos(t1), sin(t1), cos(t1*0.7)*sin(t1*0.7));
  vec3 g2 = vec3(cos(t2), sin(t2), cos(t2*0.7)*sin(t2*0.7));
  vec3 g3 = vec3(cos(t3), sin(t3), cos(t3*0.7)*sin(t3*0.7));
  float v0 = dot(g0, p0);
  float v1 = dot(g1, p1);
  float v2 = dot(g2, p2);
  float v3 = dot(g3, p3);
  float w0 = max(0.5 - dot(p0,p0), 0.0);
  float w1 = max(0.5 - dot(p1,p1), 0.0);
  float w2 = max(0.5 - dot(p2,p2), 0.0);
  float w3 = max(0.5 - dot(p3,p3), 0.0);
  w0 *= w0; w1 *= w1; w2 *= w2; w3 *= w3;
  return 70.0 * (v0*w0 + v1*w1 + v2*w2 + v3*w3) * rs + 0.5;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  float aspect = u_res.x / u_res.y;
  vec3 p = vec3(uv * vec2(aspect, 1.0) * 6.0, u_time * 0.00018);
  float n1 = vnoise(p);
  float n2 = vnoise(p * 2.0 + vec3(5.7, 3.1, 0.0));
  float sub = fract(n1 * 6.0);
  float f = smoothstep(0.45, 0.55, sub) * n2;
  float mouseInfluence = 1.0 - smoothstep(0.0, 0.25, distance(uv, u_mouse));
  f += mouseInfluence * 0.1;
  gl_FragColor = vec4(vec3(1.0) * f * 0.03, 1.0);
}
`;

export default function HeroCanvas() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let renderer: THREE.WebGLRenderer | null = null;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false });
    } catch {
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array([-1, -1, 3, -1, -1, 3]);
    geometry.setAttribute('a_pos', new THREE.BufferAttribute(positions, 2));

    const uniforms = {
      u_time: { value: 0 },
      u_res: { value: new THREE.Vector2(1, 1) },
      u_mouse: { value: new THREE.Vector2(0.5, 0.5) },
    };

    const material = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms,
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const resize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      renderer!.setSize(w, h, false);
      uniforms.u_res.value.set(w * renderer!.getPixelRatio(), h * renderer!.getPixelRatio());
    };
    resize();
    window.addEventListener('resize', resize);

    const targetMouse = new THREE.Vector2(0.5, 0.5);
    const onPointer = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      targetMouse.set((e.clientX - rect.left) / rect.width, 1 - (e.clientY - rect.top) / rect.height);
    };
    container.addEventListener('pointermove', onPointer);

    let visible = true;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => (visible = e.isIntersecting)),
      { threshold: 0.01 },
    );
    io.observe(container);

    let raf = 0;
    const start = performance.now();
    const loop = () => {
      raf = requestAnimationFrame(loop);
      if (!visible) return;
      uniforms.u_time.value = performance.now() - start;
      uniforms.u_mouse.value.lerp(targetMouse, 0.08);
      renderer!.render(scene, camera);
    };
    loop();

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener('resize', resize);
      container.removeEventListener('pointermove', onPointer);
      geometry.dispose();
      material.dispose();
      renderer!.dispose();
      if (renderer!.domElement.parentNode === container) {
        container.removeChild(renderer!.domElement);
      }
    };
  }, []);

  return <div ref={containerRef} className="absolute inset-0 z-0" aria-hidden />;
}
