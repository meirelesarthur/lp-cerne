import { Suspense, lazy, useCallback, useEffect, useState } from 'react'
import { GroundSection } from './components/GroundSection'
import { Header } from './components/Header'
import { Hero, type HeroGeometry } from './components/Hero'
import { onFirstInteraction } from './lib/defer'
import { initHeaderTone, initReveal } from './lib/reveal'
import './styles/sections.css'

const Below = lazy(() => import('./components/Below'))
const Footer = lazy(() => import('./components/Below').then((m) => ({ default: m.Footer })))

export default function App() {
  const [geo, setGeo] = useState<HeroGeometry | null>(null)
  const [below, setBelow] = useState(false)
  const onGeometry = useCallback((g: HeroGeometry) => setGeo(g), [])
  useEffect(() => initReveal(), [])
  useEffect(() => initHeaderTone(), [])
  // o restante da página (JS e mídia) só entra na primeira interação ou, no máximo, 6 s depois
  useEffect(() => onFirstInteraction(() => setBelow(true), 6000), [])
  return (
    <>
      <Header />
      <main>
        <Hero onGeometry={onGeometry} />
        <GroundSection geo={geo} />
        {below && (
          <Suspense fallback={null}>
            <Below />
          </Suspense>
        )}
      </main>
      {below && (
        <Suspense fallback={null}>
          <Footer />
        </Suspense>
      )}
    </>
  )
}
