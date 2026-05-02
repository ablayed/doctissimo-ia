const SMILEY_MAP: Record<string, string> = {
  ':bounce:': 'bounce',
  ':love:': 'love',
  ':hello:': 'hello',
  ':jap:': 'jap',
  ':fou:': 'fou',
  ':sweat:': 'sweat',
  ':sleep:': 'sleep',
  ':non:': 'non',
  ':whistle:': 'whistle',
  ':sol:': 'sol',
  ':kaola:': 'kaola',
  ':eek:': 'eek',
}

function svgData(label: string, bg: string, fg: string, width = 18, height = 18) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="100%" height="100%" rx="1" ry="1" fill="${bg}"/><text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" font-family="Verdana" font-size="8" fill="${fg}">${label}</text></svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

export function placeholderAd(text: string, bg: string, fg: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="468" height="60"><rect width="100%" height="100%" fill="${bg}" stroke="#CC0066"/><text x="50%" y="32" text-anchor="middle" font-family="Verdana" font-size="16" font-weight="bold" fill="${fg}">${text}</text></svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

export function placeholderBadge(text: string, bg: string, fg: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="88" height="31"><rect width="100%" height="100%" fill="${bg}" stroke="${fg}"/><text x="50%" y="19" text-anchor="middle" font-family="Verdana" font-size="9" font-weight="bold" fill="${fg}">${text}</text></svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

export function placeholderAvatar(pseudo: string) {
  const initial = pseudo.slice(0, 2).toUpperCase()
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100%" height="100%" fill="#FFCCE5" stroke="#CC0066" stroke-width="2"/><circle cx="50" cy="38" r="18" fill="#FFFFFF"/><rect x="22" y="62" width="56" height="22" fill="#FFFFFF"/><text x="50%" y="94" text-anchor="middle" font-family="Verdana" font-size="12" font-weight="bold" fill="#CC0066">${initial}</text></svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

function smileySrc(name: string) {
  const palette: Record<string, [string, string]> = {
    bounce: ['#FFFF99', '#CC0066'],
    love: ['#FFCCE5', '#CC0066'],
    hello: ['#CCE6FF', '#003366'],
    jap: ['#FFF2CC', '#996600'],
    fou: ['#FFD9E8', '#800040'],
    sweat: ['#E6F7FF', '#006699'],
    sleep: ['#E6E6FF', '#4B4B99'],
    non: ['#FFE6E6', '#CC0000'],
    whistle: ['#F3E6FF', '#663399'],
    sol: ['#FFF7CC', '#CC6600'],
    kaola: ['#E6FFE6', '#008000'],
    eek: ['#FFEEEE', '#990000'],
  }
  const [bg, fg] = palette[name] || ['#FFFFFF', '#000000']
  return svgData(name.slice(0, 2).toUpperCase(), bg, fg)
}

export function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export function renderSmileysAndQuotes(text: string, linkifyUrls: boolean): string {
  let html = escapeHtml(text)

  html = html.replace(
    /\[quote=([^\]]+)\]([\s\S]*?)\[\/quote\]/g,
    (_match, author, content) =>
      `<div class="quote-block"><div class="quote-header">Citation : ${escapeHtml(author)} a ecrit :</div>${escapeHtml(content)}</div>`,
  )

  for (const [code, name] of Object.entries(SMILEY_MAP)) {
    const re = new RegExp(code.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')
    html = html.replace(re, `<img src="${smileySrc(name)}" class="smiley" alt="${code}"/>`)
  }

  html = html.replace(/\b([A-ZÀÁÂÄÇÈÉÊËÎÏÔÖÙÛÜŸ]{3,})\b/g, '<strong>$1</strong>')

  if (linkifyUrls) {
    html = html.replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>')
  }

  html = html.replace(/\n/g, '<br/>')
  return html
}
