import { useEffect, useRef } from 'react'

/**
 * Curvas de nível animadas (inspirado no Topography do React Bits), numa versão enxuta: um único fragment shader
 * em tela cheia (WebGL2, sem malha 3D nem passes de brilho). O terreno é visto em perspectiva (ruído fractal que
 * avança devagar, como um sobrevoo); as linhas vêm do `fract` da altura, a cada 5ª mais forte, os picos brilham
 * e o cursor "levanta" o relevo ao redor.
 * Custo controlado: dpr ≤ 1, ~30 quadros/s, e o laço só roda com a seção na tela e a aba visível.
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
float fbm(vec2 p) { float a = .5, s = 0.; for (int i = 0; i < 3; i++) { s += a * n(p); p = p * 2.03 + 17.; a *= .5; } return s; }
const float HOR = .68;
// plano do terreno em perspectiva: quanto mais perto do horizonte, mais comprimido
vec2 ground(float qy, float qx, float asp) { float d = 1. / (max(HOR - qy, .02) + .1); return vec2((qx - .5) * asp * d * .8, d * 1.6); }
float height(vec2 g) { return fbm(g * .55 + vec2(0., uTime * .05)) * 1.3; }
void main() {
  vec2 q = gl_FragCoord.xy / uRes;
  float asp = uRes.x / uRes.y;
  vec2 dm = (q - uMouse) * vec2(asp, 1.);
  float lift = .55 * exp(-dot(dm, dm) * 16.);   // o cursor levanta o terreno
  float y0 = q.y, z = 0.;
  for (int i = 0; i < 3; i++) { z = height(ground(y0, q.x, asp)) + lift; y0 = q.y - z * .17; }
  float v = z * 14.;
  float g = abs(fract(v - .5) - .5) / max(fwidth(v), .0001);
  float line = 1. - smoothstep(0., 1.4, g);
  float major = step(mod(floor(v + .5), 5.), .5);
  float peak = smoothstep(.45, 1.1, z);
  float fade = smoothstep(0., .16, HOR - y0) * smoothstep(-.02, .14, q.y);
  vec3 col = mix(uColor, vec3(.65, 1., .86), peak * .85);
  float a = (line * (.2 + .3 * major + .5 * peak) + .06 * peak) * fade;
  o = vec4(col * a, a);
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

    const mouse = { x: 0.5, y: 0.4, tx: 0.5, ty: 0.4 }
    let pointer = false
    let w = 1, h = 1, raf = 0, last = 0, visible = false
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1)
      w = Math.max(1, Math.round(host.clientWidth * dpr)); h = Math.max(1, Math.round(host.clientHeight * dpr))
      canvas.width = w; canvas.height = h
      gl.viewport(0, 0, w, h)
      gl.uniform2f(uRes, w, h)
    }
    const frame = (t: number) => {
      raf = requestAnimationFrame(frame)
      if (t - last < 33) return
      last = t
      // sem ponteiro (celular, ou antes de mexer o mouse) o relevo sobe sozinho num passeio lento
      if (!pointer) { mouse.tx = 0.5 + 0.28 * Math.sin(t / 3400); mouse.ty = 0.34 + 0.1 * Math.cos(t / 2700) }
      mouse.x += (mouse.tx - mouse.x) * 0.08; mouse.y += (mouse.ty - mouse.y) * 0.08
      gl.uniform1f(uTime, t / 1000)
      gl.uniform2f(uMouse, mouse.x, mouse.y)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    }
    const sync = () => {
      const run = visible && !document.hidden
      if (run && !raf) raf = requestAnimationFrame(frame)
      else if (!run && raf) { cancelAnimationFrame(raf); raf = 0 }
    }
    const onMove = (e: PointerEvent) => {
      const r = host.getBoundingClientRect()
      pointer = true
      mouse.tx = (e.clientX - r.left) / r.width; mouse.ty = 1 - (e.clientY - r.top) / r.height
    }
    const ro = new ResizeObserver(resize)
    ro.observe(host)
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; sync() })
    io.observe(host)
    // o canvas fica atrás do conteúdo (pointer-events: none): o ponteiro é lido na seção inteira
    const hover = host.closest('section') ?? host
    hover.addEventListener('pointermove', onMove, { passive: true })
    document.addEventListener('visibilitychange', sync)
    resize()
    return () => {
      cancelAnimationFrame(raf); ro.disconnect(); io.disconnect()
      hover.removeEventListener('pointermove', onMove); document.removeEventListener('visibilitychange', sync)
      // sem loseContext: o StrictMode remonta o efeito no mesmo canvas, e um contexto perdido não volta
      gl.deleteProgram(prog); gl.deleteBuffer(buf)
    }
  }, [color])

  return <canvas ref={ref} className="fx-topo" aria-hidden="true" />
}
