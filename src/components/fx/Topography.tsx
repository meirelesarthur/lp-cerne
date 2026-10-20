import { useEffect, useRef } from 'react'

/**
 * Curvas de nível animadas (inspirado no Topography do React Bits), numa versão enxuta: um único fragment shader
 * em tela cheia (WebGL2, sem malha 3D nem passes de brilho). O relevo é ruído fractal que deriva devagar; as
 * linhas vêm do `fract` da altura, a cada 5ª mais forte, e o cursor "levanta" o terreno ao redor.
 * Custo controlado: dpr ≤ 1.25, ~30 quadros/s, e o laço só roda com a seção na tela e a aba visível.
 */
const VERT = `#version 300 es
in vec2 p; void main() { gl_Position = vec4(p, 0., 1.); }`

const FRAG = `#version 300 es
precision mediump float;
uniform vec2 uRes; uniform float uTime; uniform vec2 uMouse; uniform vec3 uColor;
out vec4 o;
float h(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float n(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + vec2(1, 1)), f.x), f.y); }
float fbm(vec2 p) { float a = .5, s = 0.; for (int i = 0; i < 4; i++) { s += a * n(p); p = p * 2.03 + 17.; a *= .5; } return s; }
void main() {
  vec2 uv = gl_FragCoord.xy / uRes.y;
  float m = distance(uv, uMouse);
  float z = fbm(uv * 2.4 + vec2(uTime * .018, uTime * .011)) + .26 * exp(-m * m * 9.);
  float v = z * 15.;
  float g = abs(fract(v - .5) - .5) / max(fwidth(v), .0001);
  float line = 1. - smoothstep(0., 1.3, g);
  float major = step(mod(floor(v + .5), 5.), .5);
  vec2 q = gl_FragCoord.xy / uRes;
  float fade = smoothstep(0., .25, q.y) * smoothstep(0., .2, q.x) * smoothstep(0., .2, 1. - q.x);
  float a = line * (.16 + .26 * major) * fade;
  o = vec4(uColor * a, a);
}`

function compile(gl: WebGL2RenderingContext, type: number, src: string) {
  const s = gl.createShader(type)!
  gl.shaderSource(s, src)
  gl.compileShader(s)
  if (gl.getShaderParameter(s, gl.COMPILE_STATUS)) return s
  if (import.meta.env.DEV) console.warn('[topography] shader', gl.getShaderInfoLog(s))
  return null
}

export default function Topography({ color = [0.29, 0.87, 0.5] }: { color?: [number, number, number] }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    const host = canvas?.parentElement
    const gl = canvas?.getContext('webgl2', { alpha: true, antialias: false, powerPreference: 'low-power' })
    if (!canvas || !host || !gl) return
    const vs = compile(gl, gl.VERTEX_SHADER, VERT), fs = compile(gl, gl.FRAGMENT_SHADER, FRAG)
    if (!vs || !fs) return
    const prog = gl.createProgram()!
    gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog)
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return
    gl.useProgram(prog)
    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    const loc = gl.getAttribLocation(prog, 'p')
    gl.enableVertexAttribArray(loc)
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)
    const uRes = gl.getUniformLocation(prog, 'uRes'), uTime = gl.getUniformLocation(prog, 'uTime')
    const uMouse = gl.getUniformLocation(prog, 'uMouse'), uColor = gl.getUniformLocation(prog, 'uColor')
    gl.uniform3f(uColor, ...color)

    const mouse = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 }
    let w = 1, h = 1, raf = 0, last = 0, visible = false
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.25)
      w = Math.max(1, Math.round(host.clientWidth * dpr)); h = Math.max(1, Math.round(host.clientHeight * dpr))
      canvas.width = w; canvas.height = h
      gl.viewport(0, 0, w, h)
      gl.uniform2f(uRes, w, h)
    }
    const frame = (t: number) => {
      raf = requestAnimationFrame(frame)
      if (t - last < 33) return
      last = t
      mouse.x += (mouse.tx - mouse.x) * 0.08; mouse.y += (mouse.ty - mouse.y) * 0.08
      gl.uniform1f(uTime, t / 1000)
      gl.uniform2f(uMouse, mouse.x * (w / h), mouse.y)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    }
    const sync = () => {
      const run = visible && !document.hidden
      if (run && !raf) raf = requestAnimationFrame(frame)
      else if (!run && raf) { cancelAnimationFrame(raf); raf = 0 }
    }
    const onMove = (e: PointerEvent) => {
      const r = host.getBoundingClientRect()
      mouse.tx = (e.clientX - r.left) / r.height; mouse.ty = 1 - (e.clientY - r.top) / r.height
    }
    const ro = new ResizeObserver(resize)
    ro.observe(host)
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; sync() })
    io.observe(host)
    host.addEventListener('pointermove', onMove, { passive: true })
    document.addEventListener('visibilitychange', sync)
    resize()
    return () => {
      cancelAnimationFrame(raf); ro.disconnect(); io.disconnect()
      host.removeEventListener('pointermove', onMove); document.removeEventListener('visibilitychange', sync)
      // sem loseContext: o StrictMode remonta o efeito no mesmo canvas, e um contexto perdido não volta
      gl.deleteProgram(prog); gl.deleteBuffer(buf)
    }
  }, [color])

  return <canvas ref={ref} className="fx-topo" aria-hidden="true" />
}
