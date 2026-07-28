import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Resvg } from '@resvg/resvg-js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const files = join(root, 'files')
const logoPath = join(files, 'osm-street-space-editor-logo-2026.svg')
const parkraumSocial = join(files, 'social-sharing-osm-parkraum-2025.svg')

const logoSvg = readFileSync(logoPath, 'utf8')
const parkraum = readFileSync(parkraumSocial, 'utf8')

// Extract background shell from parkraum (everything before <g id="Logo">)
const bgEnd = parkraum.indexOf('<g id="Logo">')
const bgStart = parkraum.indexOf('<g style="isolation:isolate">')
if (bgEnd < 0 || bgStart < 0) throw new Error('Could not find parkraum shell markers')

let shellHead = parkraum.slice(0, bgEnd)
if (!shellHead.includes('xmlns:xlink')) {
  shellHead = shellHead.replace(
    '<svg xmlns="http://www.w3.org/2000/svg"',
    '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"',
  )
}
// Keep drop-shadow filter + background; drop parkraum-specific logo styles that we don't need
const logoInner = logoSvg
  .replace(/^[\s\S]*?<svg[^>]*>/, '')
  .replace(/<\/svg>\s*$/, '')
  // Avoid ID clashes with shell clip paths
  .replaceAll('id="karte"', 'id="sse-karte"')
  .replaceAll('url(#karte)', 'url(#sse-karte)')
  .replaceAll('id="lupe-glas"', 'id="sse-lupe-glas"')
  .replaceAll('url(#lupe-glas)', 'url(#sse-lupe-glas)')
  .replaceAll('id="karte-inhalt"', 'id="sse-karte-inhalt"')
  .replaceAll('href="#karte-inhalt"', 'href="#sse-karte-inhalt"')
  .replaceAll('xlink:href="#karte-inhalt"', 'xlink:href="#sse-karte-inhalt"')

// Match existing social logo placement: lens centre (696.53,257.01) r=176.4
// Logo lens: (198.13,114.13) r=88.79 → scale ≈ 1.9865, translate ≈ (302.93, 30.11)
const scale = 176.4 / 88.79
const tx = 696.53 - 198.13 * scale
const ty = 257.01 - 114.13 * scale

const socialSvg = `${shellHead}<g id="Logo" transform="translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${scale.toFixed(4)})" filter="url(#drop-shadow-1)">
${logoInner}
    </g>
  </g>
</svg>
`

const socialPath = join(files, 'social-sharing-osm-street-space-editor-2026.svg')
writeFileSync(socialPath, socialSvg)
console.log('wrote', socialPath)

function renderPng(svgPath, outPath, { width, height }) {
  const svg = readFileSync(svgPath)
  const resvg = new Resvg(svg, {
    fitTo: height
      ? { mode: 'height', value: height }
      : { mode: 'width', value: width },
    background: 'rgba(0,0,0,0)',
  })
  const png = resvg.render().asPng()
  writeFileSync(outPath, png)
  console.log('wrote', outPath, `(${png.length} bytes)`)
}

renderPng(logoPath, join(files, 'osm-street-space-editor-logo-2026.png'), {
  width: 600,
  height: 570,
})
renderPng(socialPath, join(files, 'social-sharing-osm-street-space-editor-2026.png'), {
  width: 1600,
  height: 840,
})
