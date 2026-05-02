const tabs = ['Forums', 'Sante', 'Famille', 'Nutrition', 'Beauté', 'Psychologie', 'Le Bistrot']

export default function NavTabs() {
  return (
    <nav className="nav-tabs">
      {tabs.map((tab, index) => (
        <a href="#" className={index === 0 ? 'active' : ''} key={tab} onClick={(event) => event.preventDefault()}>
          {tab}
        </a>
      ))}
    </nav>
  )
}
