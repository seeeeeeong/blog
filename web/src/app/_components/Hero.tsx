import './hero.css'
import { HeroArt } from '@/app/_components/HeroArt'

/** The blue glow and grid at the top of the home, with the wave over them. */
export function Hero() {
  return (
    <section className="hero" aria-hidden="true">
      <HeroArt />
    </section>
  )
}
