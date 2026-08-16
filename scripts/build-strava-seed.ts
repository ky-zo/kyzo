import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { fetchStravaEffort } from '../lib/strava/sync'

const outputPath = path.join(process.cwd(), 'data/strava/effort.seed.json')

async function main() {
  const history = await fetchStravaEffort()
  await mkdir(path.dirname(outputPath), { recursive: true })
  await writeFile(outputPath, `${JSON.stringify({ ...history, lastSync: undefined }, null, 2)}\n`)
  console.log(`Wrote ${history.points.length} strava effort points (total ${history.totalEffort}) to ${path.relative(process.cwd(), outputPath)}`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
