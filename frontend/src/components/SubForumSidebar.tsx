const categories = [
  'Sante',
  'Forme & Sport',
  'Beaute',
  'Nutrition',
  'Psychologie',
  'Sexualite',
  'Grossesse',
  'Bebe',
  'Famille',
  'Medicaments',
  'Le Bistrot',
  'Astrologie',
]

export default function SubForumSidebar() {
  return (
    <section>
      <h3>Categories</h3>
      <ul>
        {categories.map((item, index) => (
          <li key={item}>
            <a href="/" className="subforum-link" onClick={(event) => event.preventDefault()}>
              <span>{item}</span>
              <span className="new-count">{[47, 23, 89, 34, 67, 156, 234, 178, 45, 12, 312, 89][index]} new</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}
