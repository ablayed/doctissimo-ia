import type { ReactNode } from 'react'

export const SMILEY_MAP: Record<string, string> = {
  ':bounce:': '/smileys/bounce.gif',
  ':love:': '/smileys/love.gif',
  ':hello:': '/smileys/hello.gif',
  ':jap:': '/smileys/jap.gif',
  ':fou:': '/smileys/fou.gif',
  ':sweat:': '/smileys/sweat.gif',
  ':sleep:': '/smileys/sleep.gif',
  ':non:': '/smileys/non.gif',
  ':whistle:': '/smileys/whistle.gif',
  ':sol:': '/smileys/sol.gif',
  ':kaola:': '/smileys/kaola.gif',
  ':eek:': '/smileys/eek.gif',
}

const SMILEY_PATTERN = /(:bounce:|:love:|:hello:|:jap:|:fou:|:sweat:|:sleep:|:non:|:whistle:|:sol:|:kaola:|:eek:)/g

export function renderSmileys(text: string): ReactNode[] {
  return text.split(SMILEY_PATTERN).map((part, index) => {
    const src = SMILEY_MAP[part]
    if (!src) {
      return part
    }
    return <img key={`${part}-${index}`} className="smiley" src={src} alt={part} />
  })
}
