// scripts/seed-landing-features.js
// Usage: node scripts/seed-landing-features.js
// Seeds Firestore collection `landingFeatures` with a small set of feature cards
// Requires Firebase Admin service account at scripts/firebase-admin-key.json (not committed)

const path = require('path');
const fs = require('fs');
const admin = require('firebase-admin');

const DEFAULT_KEY = path.join(__dirname, 'firebase-admin-key.json');
function resolveAdminKeyPath() {
  if (fs.existsSync(DEFAULT_KEY)) return DEFAULT_KEY;
  // Try to auto-detect a service account JSON in scripts/
  const files = fs.readdirSync(__dirname).filter(f => f.endsWith('.json'));
  const candidate = files.find(f => /firebase-adminsdk/i.test(f));
  if (candidate) return path.join(__dirname, candidate);
  // Fallback: if only one json exists, use it
  if (files.length === 1) return path.join(__dirname, files[0]);
  return null;
}

(async function main() {
  try {
    const ADMIN_KEY_PATH = resolveAdminKeyPath();
    if (!ADMIN_KEY_PATH || !fs.existsSync(ADMIN_KEY_PATH)) {
      console.error('Missing Firebase Admin key. Add scripts/firebase-admin-key.json or a service account JSON (e.g., *firebase-adminsdk*.json) in scripts/.');
      process.exit(1);
    }

    const serviceAccount = require(ADMIN_KEY_PATH);
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    }

    const db = admin.firestore();
    const col = db.collection('landingFeatures');

    const features = [
      {
        id: 'learn',
        title: 'Plain Language Learning',
        text: 'Learn with clear explanations, not confusing jargon. Every term has a simple definition.'
      },
      {
        id: 'practice',
        title: 'Real Practice',
        text: 'Try budgeting, saving, and investing with safe simulations before using real money.'
      },
      {
        id: 'guidance',
        title: 'Smart Guidance',
        text: 'Get personalized tips based on your goals and current situation, not generic advice.'
      },
      {
        id: 'track',
        title: 'Track Your Progress',
        text: 'Measure growth with a friendly dashboard, badges, and learning milestones.'
      }
    ];

    for (const f of features) {
      await col.doc(String(f.id)).set({ ...f, updatedAt: new Date() }, { merge: true });
      console.log(`Seeded landingFeatures/${f.id}`);
    }

    console.log('✅ landingFeatures seeding complete.');
    process.exit(0);
  } catch (err) {
    console.error('Seeding landingFeatures failed:', err);
    process.exit(1);
  }
})();
