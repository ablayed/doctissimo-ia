const categories = ['Santé', 'Forme & Sport', 'Beauté', 'Nutrition', 'Psychologie', 'Sexualité', 'Grossesse', 'Bébé', 'Famille', 'Médicaments', 'Le Bistrot', 'Astrologie']

export default function SubForumSidebar() {
  return (
    <div className="sidebar-box">
      <h3>Catégories</h3>
      <ul className="sidebar-list">
        {categories.map((item, index) => (
          <li key={item}>
            <button type="button" onClick={() => window.location.assign('/')}>
              {item} <span>{12 + index * 3} new</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
