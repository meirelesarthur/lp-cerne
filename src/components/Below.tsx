import { useEffect } from 'react'
import {
  ContactSection, EditionsSection, FaqSection, Footer, PlansSection, ProblemSection,
  ProfilesSection, SystemSection, TrailerSection, TwinSection,
} from './Sections'
import { initHeaderTone, initReveal } from '../lib/reveal'
import { ScrollTrigger } from '../lib/scroll'

/** Tudo abaixo do Hero (e do Escopo). Fica em um chunk à parte, baixado e montado na primeira interação. */
export default function Below() {
  useEffect(() => {
    const a = initReveal(), b = initHeaderTone()
    ScrollTrigger.sort()
    const id = requestAnimationFrame(() => {
      ScrollTrigger.refresh()
      // aberto com âncora (/#contato): só agora a seção existe e a altura final da página está calculada
      const target = window.location.hash && document.getElementById(decodeURIComponent(window.location.hash.slice(1)))
      if (target) requestAnimationFrame(() => target.scrollIntoView({ block: 'start' }))
    })
    return () => { cancelAnimationFrame(id); a(); b() }
  }, [])
  return (
    <>
      <ProblemSection />
      <SystemSection />
      <TrailerSection />
      <EditionsSection />
      <ProfilesSection />
      <TwinSection />
      <PlansSection />
      <FaqSection />
      <ContactSection />
    </>
  )
}
export { Footer }
