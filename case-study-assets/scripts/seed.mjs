// Crée (ou réutilise) un compte de démo Supabase Auth et y insère des clients
// et commandes fictifs mais réalistes, avec des statuts variés et au moins
// deux commandes "en relance" (J+15 et J+30) pour peupler le Dashboard.
//
// Usage : node case-study-assets/scripts/seed.mjs

import { createClient } from '@supabase/supabase-js'
import { readEnvLocal, DEMO_EMAIL, DEMO_PASSWORD } from './config.mjs'

function isoDate(daysAgo) {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  return d.toISOString().slice(0, 10)
}

function isoTimestamp(daysAgo) {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  return d.toISOString()
}

const CLIENTS = [
  {
    nom: 'Atelier Dupont Menuiserie',
    telephone: '06 12 34 56 78',
    email: 'contact@atelierdupont.fr',
    notes: 'Client fidèle depuis 2023. Préfère les devis détaillés par écrit.',
  },
  {
    nom: 'Boulangerie Martin',
    telephone: '06 98 76 54 32',
    email: 'boulangerie.martin@gmail.com',
    notes: 'Commandes récurrentes pour la communication saisonnière (Noël, Pâques).',
  },
  {
    nom: 'Studio Lefèvre Photographie',
    telephone: '07 45 12 89 63',
    email: 'hello@studiolefevre.com',
    notes: 'Shooting produit réalisé, refonte du site prévue au prochain trimestre.',
  },
  {
    nom: 'Café des Arts',
    telephone: '06 33 22 11 00',
    email: 'contact@cafedesarts.fr',
    notes: 'Toujours régler par virement, délai de paiement habituel de 30 jours.',
  },
  {
    nom: 'Techno Solutions SARL',
    telephone: '01 47 20 15 90',
    email: 'facturation@technosolutions.fr',
    notes: 'Grand compte. Interlocuteur : Mme Rousseau (comptabilité).',
  },
  {
    nom: 'Fleuriste Bellerose',
    telephone: '06 87 65 43 21',
    email: 'bellerose.fleurs@outlook.fr',
    notes: 'Petite structure, très réactive par téléphone.',
  },
]

// Commandes par nom de client. livre_le/date_commande calculés par rapport
// à "aujourd'hui" à chaque exécution du script, pour que les délais de relance
// affichés dans le Dashboard restent cohérents quelle que soit la date de lancement.
const COMMANDES_BY_CLIENT = {
  'Atelier Dupont Menuiserie': [
    { description: 'Réfection escalier bois', montant: 1450, statut: 'Payé', dateCommande: 60, livreLe: 55 },
    { description: 'Pose de parquet salon', montant: 890, statut: 'En cours', dateCommande: 5, livreLe: null },
  ],
  'Boulangerie Martin': [
    { description: 'Flyers campagne de Pâques', montant: 320, statut: 'Payé', dateCommande: 45, livreLe: 40 },
    { description: 'Affiches vitrine', montant: 180, statut: 'Livré', dateCommande: 25, livreLe: 20 }, // relance J+15
  ],
  'Studio Lefèvre Photographie': [
    { description: 'Shooting produit e-commerce', montant: 650, statut: 'Livré', dateCommande: 22, livreLe: 18 }, // relance J+15
    { description: 'Refonte du site vitrine', montant: 2100, statut: 'En cours', dateCommande: 8, livreLe: null },
  ],
  'Café des Arts': [
    { description: 'Carte menu + signalétique', montant: 410, statut: 'Payé', dateCommande: 30, livreLe: 28 },
    { description: 'Book photo ambiance', montant: 260, statut: 'Livré', dateCommande: 6, livreLe: 4 }, // livré récent, pas encore en relance
  ],
  'Techno Solutions SARL': [
    { description: "Refonte identité visuelle", montant: 3200, statut: 'Livré', dateCommande: 45, livreLe: 35 }, // relance ferme J+30
    { description: 'Maintenance mensuelle', montant: 590, statut: 'Payé', dateCommande: 10, livreLe: 9 },
    { description: 'Support technique urgent', montant: 150, statut: 'En cours', dateCommande: 2, livreLe: null },
  ],
  'Fleuriste Bellerose': [
    { description: 'Décoration vitrine printemps', montant: 275, statut: 'Payé', dateCommande: 20, livreLe: 18 },
  ],
}

async function ensureSession(supabase) {
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
  })
  if (!signInError && signInData.session) {
    console.log(`Connecté avec le compte existant ${DEMO_EMAIL}.`)
    return signInData.session
  }

  console.log(`Compte ${DEMO_EMAIL} introuvable ou mot de passe différent, création...`)
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
  })
  if (signUpError) {
    throw new Error(`Impossible de créer le compte de démo : ${signUpError.message}`)
  }
  if (signUpData.session) {
    console.log(`Compte ${DEMO_EMAIL} créé et connecté.`)
    return signUpData.session
  }

  console.warn(
    '\n⚠️  Le compte a été créé mais aucune session n\'a été retournée : la confirmation par email est probablement activée sur ce projet Supabase.\n' +
      `   -> Confirme le compte "${DEMO_EMAIL}" (lien reçu par email, ou manuellement dans Supabase Dashboard > Authentication > Users),\n` +
      '   puis relance ce script pour continuer le seed.\n'
  )
  process.exit(1)
}

async function upsertClient(supabase, clientData) {
  const { data: existing, error: findError } = await supabase
    .from('clients')
    .select('id')
    .eq('nom', clientData.nom)
    .maybeSingle()
  if (findError) throw new Error(`Lecture clients (${clientData.nom}) : ${findError.message}`)

  if (existing) {
    const { error: updateError } = await supabase
      .from('clients')
      .update(clientData)
      .eq('id', existing.id)
    if (updateError) throw new Error(`Mise à jour client ${clientData.nom} : ${updateError.message}`)
    return existing.id
  }

  const { data: inserted, error: insertError } = await supabase
    .from('clients')
    .insert(clientData)
    .select('id')
    .single()
  if (insertError) throw new Error(`Création client ${clientData.nom} : ${insertError.message}`)
  return inserted.id
}

async function reseedCommandes(supabase, clientId, clientNom) {
  const { error: deleteError } = await supabase.from('commandes').delete().eq('client_id', clientId)
  if (deleteError) throw new Error(`Suppression anciennes commandes de ${clientNom} : ${deleteError.message}`)

  const commandes = (COMMANDES_BY_CLIENT[clientNom] || []).map((c) => ({
    client_id: clientId,
    description: c.description,
    montant: c.montant,
    statut: c.statut,
    date_commande: isoDate(c.dateCommande),
    livre_le: c.livreLe === null ? null : isoTimestamp(c.livreLe),
  }))
  if (commandes.length === 0) return 0

  const { error: insertError } = await supabase.from('commandes').insert(commandes)
  if (insertError) throw new Error(`Insertion commandes de ${clientNom} : ${insertError.message}`)
  return commandes.length
}

async function main() {
  const env = readEnvLocal()
  const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY)

  await ensureSession(supabase)

  let totalCommandes = 0
  for (const clientData of CLIENTS) {
    const clientId = await upsertClient(supabase, clientData)
    const count = await reseedCommandes(supabase, clientId, clientData.nom)
    totalCommandes += count
    console.log(`✓ ${clientData.nom} — ${count} commande(s)`)
  }

  console.log(`\nSeed terminé : ${CLIENTS.length} clients, ${totalCommandes} commandes.`)
  console.log(`Identifiants de démo à utiliser pour la capture :`)
  console.log(`  email    : ${DEMO_EMAIL}`)
  console.log(`  password : ${DEMO_PASSWORD}`)
}

main().catch((err) => {
  console.error('\n❌', err.message)
  process.exit(1)
})
