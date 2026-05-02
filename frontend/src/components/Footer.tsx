import { placeholderBadge } from '../utils/smileys'

export default function Footer({ counter }: { counter: string }) {
  return (
    <div className="footer">
      <div>
        <a href="#">Aide</a> · <a href="#">Charte</a> · <a href="#">Mentions legales</a> · <a href="#">Plan du site</a> ·{' '}
        <a href="#">Contact webmaster</a>
      </div>
      <div style={{ marginTop: 6 }}>
        <span className="footer-counter">Vous etes le {counter}eme visiteur</span>
      </div>
      <div className="footer-badges">
        <img src={placeholderBadge('Under Construction', '#FFFFCC', '#CC0066')} alt="Under Construction" width={88} height={31} />
        <img src={placeholderBadge('Multimania', '#FFFFFF', '#003366')} alt="Heberge chez Multimania" width={88} height={31} />
        <img src={placeholderBadge('IE 5.5+', '#E6F4FF', '#000080')} alt="Best viewed in IE5" width={88} height={31} />
      </div>
      <div className="legal">
        Doctissimo.IA est un site PARODIQUE cree pour le hackathon DEFENDHACK 2026. Aucune des reponses des utilisateurs fictifs ne constitue un avis medical.<br />
        EN CAS D'URGENCE : 15 (SAMU) · 3114 (suicide) · 112 (Europe) · 114 (sourds) · 116 117 (medecin de garde)<br />
        Cette oeuvre s'inspire de Doctissimo.fr (marque deposee de Lagardere) mais n'est pas affiliee. Pour de la vraie info sante : ameli.fr · has-sante.fr.<br />
        © Doctissimo.IA 2026 · Heberge chez Multimania · Site optimise pour Internet Explorer 5.5+ en 800x600
      </div>
      <div className="frontpage-credit">Cette page a ete creee avec Frontpage 2003 et beaucoup d'amour</div>
    </div>
  )
}
