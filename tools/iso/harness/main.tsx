// Bancada da figura isolada: mesmos tokens e fonte da LP, sem o resto da página.
import { createRoot } from 'react-dom/client'
import '../../../src/styles/tokens.css'
import { FazendaCerne } from '../../../src/figures/fazenda/FazendaCerne'

document.body.style.cssText = 'margin:0;background:var(--canvas);color:var(--text);font-family:var(--font)'
createRoot(document.getElementById('root')!).render(
  <main style={{ width: 'min(1100px, 100% - 32px)', margin: '40px auto' }}>
    <FazendaCerne />
  </main>,
)
