const tabs = [
  { label: 'Forums', message: "Erreur 404\n\nLa page d'accueil des forums est deja sous vos yeux.\n\nMerci de ne pas cliquer trop fort.\n\n-- Webmaster" },
  { label: 'Sante', message: 'Erreur 404\n\nLa categorie Sante est en construction permanente depuis 2003.\n\nReessayez en 2025.\n\n-- Webmaster' },
  { label: 'Famille', message: 'Erreur 0x80004005\n\nCette categorie est temporairement fermee.\n\nLe webmaster est parti chercher du pain.' },
  { label: 'Nutrition', message: 'Page indisponible\n\nLa moderatrice de ce forum suit un regime soupe au chou.\n\nReessayez apres le dejeuner.' },
  { label: 'Beaute', message: "Connexion expiree\n\nVotre session a ete deconnectee par votre fournisseur d'acces Internet.\n\nVeuillez vous reconnecter avec votre modem 56k." },
  { label: 'Psychologie', message: 'Erreur grave\n\nLa psychologue est en burn-out.\n\nCliquez sur OK pour continuer (ou pas).' },
  { label: 'Le Bistrot', message: 'Acces refuse\n\nLa fonctionnalite Bistrot est reservee aux membres VIP+ (cotisation 9,99 F/mois).\n\nDisponible uniquement les jours en R.' },
]

export default function NavTabs() {
  return (
    <nav className="nav-tabs">
      {tabs.map((tab, index) => (
        <button type="button" className={`nav-tab${index === 0 ? ' active' : ''}`} key={tab.label} onClick={() => alert(tab.message)}>
          {tab.label}
        </button>
      ))}
    </nav>
  )
}
