const hotTopics = [
  'Mon ado fume du shit que faire ??',
  "Avez-vous essayé l'argile verte ??",
  'Régime soupe au chou résultats !!',
  'Astrologie : votre Mars en Scorpion',
  'Mon mari ronfle... divorcer ??',
]

export default function TopHotTopics() {
  return (
    <section>
      <h3>Sujets HOT cette semaine</h3>
      <ul>
        {hotTopics.map((topic, index) => (
          <li key={topic}>
            <a href="#" className="subforum-link" onClick={(event) => event.preventDefault()}>
              <span>{topic}</span>
              <span className="new-count">{47 + index * 23} 🔥</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}
