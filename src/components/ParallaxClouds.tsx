import React, { useEffect, useRef } from 'react';

const vertexShaderSource = `#version 300 es
in vec2 position;
out vec2 vUv;
void main() {
  vUv = vec2(position.x * 0.5 + 0.5, 0.5 - position.y * 0.5);
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const fragmentShaderSource = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 outColor;
uniform sampler2D uImage;
uniform sampler2D uDepth;
uniform vec2 uScale;
uniform vec2 uOffset;
uniform vec3 uSun;
uniform float uAspect;
uniform float uTime;
uniform vec3 uWarm;

void main() {
  vec2 base = vUv * uScale + uOffset;
  float depth = texture(uDepth, base).r;
  float rise = sin(uTime * 0.7 + base.x * 3.0) * 0.65 + sin(uTime * 0.47 - base.x * 6.0 + 1.7) * 0.35;
  float sway = sin(uTime * 0.3 + base.y * 2.0);
  vec2 shift = vec2(sway * 0.011, rise * 0.028) * smoothstep(0.15, 1.0, depth);
  vec3 tone = texture(uImage, clamp(base + shift, 0.001, 0.999)).rgb;
  float lum = dot(tone, vec3(0.299, 0.587, 0.114));
  vec2 delta = (vUv - uSun.xy) * vec2(uAspect, 1.0);
  float glow = exp(-dot(delta, delta) * 11.0);
  float light = glow * uSun.z * smoothstep(0.1, 0.55, lum) * (0.55 + depth * 0.45);
  tone += uWarm * light * 0.16;
  tone = mix(tone, tone * vec3(1.15, 1.06, 0.92), light * 0.45);

  outColor = vec4(tone, 1.0);
}
`;

export const ParallaxClouds: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl2', { alpha: true, antialias: true, depth: false });
    if (!gl) return;

    function createShader(gl: WebGL2RenderingContext, type: number, source: string) {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    }

    const vs = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fs = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    if (!vs || !fs) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(program));
      return;
    }

    gl.useProgram(program);

    const quadVao = gl.createVertexArray();
    gl.bindVertexArray(quadVao);

    const posBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );

    const posLoc = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const uImageLoc = gl.getUniformLocation(program, 'uImage');
    const uDepthLoc = gl.getUniformLocation(program, 'uDepth');
    const uScaleLoc = gl.getUniformLocation(program, 'uScale');
    const uOffsetLoc = gl.getUniformLocation(program, 'uOffset');
    const uSunLoc = gl.getUniformLocation(program, 'uSun');
    const uAspectLoc = gl.getUniformLocation(program, 'uAspect');
    const uTimeLoc = gl.getUniformLocation(program, 'uTime');
    const uWarmLoc = gl.getUniformLocation(program, 'uWarm');

    gl.uniform1i(uImageLoc, 0);
    gl.uniform1i(uDepthLoc, 1);
    gl.uniform3f(uWarmLoc, 1.0, 0.68, 0.38);

    function loadTexture(gl: WebGL2RenderingContext, url: string, unit: number) {
      const tex = gl.createTexture();
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, tex);

      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        1,
        1,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        new Uint8Array([10, 10, 14, 255])
      );

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        gl.activeTexture(gl.TEXTURE0 + unit);
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      };
      img.src = url;
      return tex;
    }

    loadTexture(gl, '/media/clouds.webp', 0);
    loadTexture(gl, '/media/clouds-depth.webp', 1);

    let sunTargetX = 0.45;
    let sunTargetY = 0.55;
    let sunCurrentX = 0.45;
    let sunCurrentY = 0.55;
    let sunIntensity = 1.3;

    const onPointerMove = (e: MouseEvent) => {
      sunTargetX = e.clientX / window.innerWidth;
      sunTargetY = e.clientY / window.innerHeight;
      sunIntensity = 1.5;
    };

    window.addEventListener('mousemove', onPointerMove, { passive: true });

    let animationFrameId: number;
    const startTime = performance.now();

    const resize = () => {
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        gl.viewport(0, 0, canvas.width, canvas.height);
      }
    };

    const render = () => {
      resize();

      const time = (performance.now() - startTime) * 0.001;
      sunCurrentX += (sunTargetX - sunCurrentX) * 0.05;
      sunCurrentY += (sunTargetY - sunCurrentY) * 0.05;

      const aspect = canvas.width / (canvas.height || 1);
      const imgAspect = 3840 / 2160;

      let scaleX = 1;
      let scaleY = 1;
      let offsetX = 0;
      let offsetY = 0;

      if (aspect > imgAspect) {
        scaleY = imgAspect / aspect;
        offsetY = (1 - scaleY) * 0.5;
      } else {
        scaleX = aspect / imgAspect;
        offsetX = (1 - scaleX) * 0.5;
      }

      gl.useProgram(program);
      gl.bindVertexArray(quadVao);

      gl.uniform2f(uScaleLoc, scaleX, scaleY);
      gl.uniform2f(uOffsetLoc, offsetX, offsetY);
      gl.uniform3f(uSunLoc, sunCurrentX, sunCurrentY, sunIntensity);
      gl.uniform1f(uAspectLoc, aspect);
      gl.uniform1f(uTimeLoc, time);

      gl.drawArrays(gl.TRIANGLES, 0, 6);

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', onPointerMove);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteBuffer(posBuffer);
      gl.deleteVertexArray(quadVao);
    };
  }, []);

  return (
    <div
      data-clouds="true"
      className="absolute inset-x-0 bottom-0 h-[46vh] sm:h-[48vh] min-h-[320px] pointer-events-none z-0 overflow-hidden"
    >
      <div className="absolute inset-0 [mask-image:linear-gradient(180deg,transparent_6%,black_45%)]">
        {/* Base Cloud Texture */}
        <img
          src="/media/clouds.webp"
          alt=""
          className="absolute inset-0 w-full h-full object-cover object-[50%_65%] scale-[1.04]"
        />
        {/* WebGL Depth Displacement Layer */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-cover object-[50%_65%] block opacity-90"
        />
      </div>
    </div>
  );
};
