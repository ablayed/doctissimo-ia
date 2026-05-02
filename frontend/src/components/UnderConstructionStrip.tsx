import { placeholderBadge } from '../utils/smileys'

export default function UnderConstructionStrip() {
  return (
    <div className="construction-strip">
      <img src={placeholderBadge('Under Construction', '#FFFFCC', '#CC0066')} alt="Under Construction" />
      <img src={placeholderBadge('Work In Progress', '#FFF2B3', '#CC6600')} alt="Work In Progress" />
      <img src={placeholderBadge('Bulldozer.gif', '#E6FFE6', '#008000')} alt="Digger" />
    </div>
  )
}
