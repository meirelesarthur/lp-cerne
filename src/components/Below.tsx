import { useEffect } from 'react'
import {
  ContactSection, EditionsSection, FaqSection, Footer, ProblemSection,
  ProfilesSection, SystemSection, TrailerSection, TrustSection, TwinSection,
} from './Sections'
import { initHeaderTone, initReveal } from '../lib/reveal'
import { ScrollTrigger } from '../lib/scroll'

/** Tudo abaixo do Hero (e do Escopo). Fica em um chunk à parte, baixado e montado na primeira interação. */
export default function Below() {
  useEffect(() => {
    const a = initReveal(), b = initHeaderTone()
    ScrollTrigger.sort()
    const id = requestAnimationFrame(() => ScrollTrigger.refresh())
    return () => { cancelAnimationFrame(id); a(); b() }
  }, [])
  return (
    <>
      <ProblemSection />
      <TrailerSection />
      <SystemSection />
      <EditionsSection />
      <ProfilesSection />
      <TwinSection />
      <TrustSection />
      <ContactSection />
      <FaqSection />
    </>
  )
}
export { Footer }
