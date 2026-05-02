import AdRotator from './AdRotator'

export default function Header({ onLogoClick }: { onLogoClick: () => void }) {
  return (
    <header className="header">
      <span className="logo" onClick={onLogoClick} title="Doctissimo.IA v2.3.7 - propulse par phpBB (avec un peu d'IA cachee :whistle:)">
        Doctissimo<span className="ia-suffix">.IA</span>
      </span>
      <div className="tagline">Vos questions sante, dans le ton de 2003 :bounce:</div>
      <div className="banner-ad-leaderboard">
        <AdRotator slot="leaderboard" />
      </div>
    </header>
  )
}
