// scripts/migrate-data-to-firestore.js
// Usage: node scripts/migrate-data-to-firestore.js
// This is a one-time local migration to seed Firestore from existing frontend src/assets data.
// Requires a Firebase Admin service account key JSON placed at scripts/firebase-admin-key.json (not committed).

const path = require('path');
const fs = require('fs');
const admin = require('firebase-admin');

const ADMIN_KEY_PATH = path.join(__dirname, 'firebase-admin-key.json');

function requireJsonModule(modulePath) {
  // Support both CommonJS exports and ES module default (transpiled) by checking module.exports or default
  const mod = require(modulePath);
  if (mod && typeof mod === 'object' && 'default' in mod) return mod.default;
  return mod;
}

(async function main() {
  if (!fs.existsSync(ADMIN_KEY_PATH)) {
    console.error('Missing scripts/firebase-admin-key.json. Place your Firebase Admin key there.');
    process.exit(1);
  }

  const serviceAccount = require(ADMIN_KEY_PATH);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  const db = admin.firestore();

  // Map asset files to Firestore collections
  const mapping = [
    { file: path.join('frontend', 'src', 'assets', 'investmentStrategies.js'), collections: { investmentStrategies: 'INVESTMENT_STRATEGIES' } },
    { file: path.join('frontend', 'src', 'assets', 'riskProfiles.js'), collections: { riskProfiles: 'RISK_PROFILES' } },
    { file: path.join('frontend', 'src', 'assets', 'educationalContent.js'), collections: { educationalContent: 'LEARNING_MODULES', articles: 'ARTICLES', quizzes: 'QUIZZES', badges: 'BADGES', glossary: 'GLOSSARY' } },
    { file: path.join('frontend', 'src', 'assets', 'mockData.js'), collections: { mockUserProfiles: 'MOCK_USER_PROFILES', mockPortfolios: 'MOCK_PORTFOLIOS', mockSuggestions: 'MOCK_SUGGESTIONS', mockMarketData: 'MOCK_MARKET_DATA', mockEducationalProgress: 'MOCK_EDUCATIONAL_PROGRESS', mockBadges: 'MOCK_BADGES', mockTransactions: 'MOCK_TRANSACTIONS', mockWatchlist: 'MOCK_WATCHLIST', mockPriceAlerts: 'MOCK_PRICE_ALERTS', mockSectorPerformance: 'MOCK_SECTOR_PERFORMANCE', mockEconomicIndicators: 'MOCK_ECONOMIC_INDICATORS', mockHistoricalData: 'MOCK_HISTORICAL_DATA', mockUserPreferences: 'MOCK_USER_PREFERENCES' } },
  ];

  async function writeDoc(collectionName, id, payload) {
    const docRef = db.collection(collectionName).doc(String(id));
    await docRef.set(payload, { merge: true });
    console.log(`Wrote ${collectionName}/${id}`);
  }

  async function migrateExportedObject(collectionName, objectValue) {
    // Object keyed by enum-like keys; inner has id fields
    for (const [key, item] of Object.entries(objectValue)) {
      const id = item.id || key;
      await writeDoc(collectionName, id, item);
    }
  }

  async function migrateArray(collectionName, arrayValue) {
    for (const item of arrayValue) {
      const id = item.id || item.slug || db.collection(collectionName).doc().id;
      await writeDoc(collectionName, id, item);
    }
  }

  for (const entry of mapping) {
    const absPath = path.join(__dirname, '..', entry.file);
    if (!fs.existsSync(absPath)) {
      console.warn(`Skip: ${absPath} not found`);
      continue;
    }

    const mod = require(absPath);

    for (const [collectionName, exportName] of Object.entries(entry.collections)) {
      const value = mod[exportName];
      if (!value) {
        console.warn(`Warning: export ${exportName} not found in ${entry.file}`);
        continue;
      }
      if (Array.isArray(value)) {
        await migrateArray(collectionName, value);
      } else if (typeof value === 'object') {
        await migrateExportedObject(collectionName, value);
      } else {
        console.warn(`Unsupported data type for ${exportName} in ${entry.file}`);
      }
    }
  }

  console.log('Migration complete.');
  process.exit(0);
})().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
