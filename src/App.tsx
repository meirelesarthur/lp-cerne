import { useCallback, useEffect, useState } from 'react'
import { GroundSection } from './components/GroundSection'
import { Header } from './components/Header'
import { Hero, type HeroGeometry } from './components/Hero'
import {
  ContactSection, EditionsSection, FaqSection, Footer, ProblemSection,
  ProfilesSection, SystemSection, TrailerSection, TrustSection,
} from './components/Sections'
import { initHeaderTone, initReveal } from './lib/reveal'
import './styles/sections.css'

export default function App() {
  const [geo, setGeo] = useState<HeroGeometry | null>(null)
  const onGeometry = useCallback((g: HeroGeometry) => setGeo(g), [])
  useEffect(() => initReveal(), [])
  useEffect(() => initHeaderTone(), [])
  return (
    <>
      <Header />
      <main>
        <Hero onGeometry={onGeometry} />
        <GroundSection geo={geo} />
        <ProblemSection />
        <TrailerSection />
        <SystemSection />
        <EditionsSection />
        <ProfilesSection />
        <TrustSection />
        <ContactSection />
        <FaqSection />
      </main>
      <Footer />
    </>
  )
}
