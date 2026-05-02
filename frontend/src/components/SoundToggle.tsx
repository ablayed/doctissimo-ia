export default function SoundToggle({
  muted,
  onToggle,
}: {
  muted: boolean
  onToggle: () => void
}) {
  return (
    <button
      className="sound-toggle"
      onClick={onToggle}
      type="button"
      title={muted ? 'Activer le son' : 'Couper le son'}
    >
      {muted ? '[son off]' : '[son on]'}
    </button>
  )
}
