import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptsDir = path.dirname(fileURLToPath(import.meta.url))
export const projectRoot = path.resolve(scriptsDir, '..', '..')
export const outDir = path.resolve(scriptsDir, '..')

export const BASE_URL = process.env.CASE_STUDY_BASE_URL || 'http://localhost:5173'

// Compte de démo dédié au case study (adresse en +alias de la boîte de l'utilisateur,
// pour recevoir l'email de confirmation Supabase si la confirmation par email est activée).
export const DEMO_EMAIL = process.env.CASE_STUDY_EMAIL || 'b23design23+casestudy@outlook.com'
export const DEMO_PASSWORD = process.env.CASE_STUDY_PASSWORD || 'CaseStudyDemo2026!'

export function readEnvLocal() {
  const envPath = path.join(projectRoot, '.env.local')
  const content = fs.readFileSync(envPath, 'utf-8')
  const env = {}
  for (const line of content.split('\n')) {
    const match = line.match(/^([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (match) env[match[1]] = match[2].trim()
  }
  return env
}
