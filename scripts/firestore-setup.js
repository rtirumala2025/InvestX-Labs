// Firestore Database Setup Script
// Run this in your browser console after setting up Firestore

// Initialize Firebase (you'll need to import this in your app)
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, setDoc, doc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBTQ1ILABXYEsyAt3D7ZyCYbsuCl4k1tao",
  authDomain: "investx-labs.firebaseapp.com",
  projectId: "investx-labs",
  storageBucket: "investx-labs.firebasestorage.app",
  messagingSenderId: "862968776151",
  appId: "1:862968776151:web:57825221401eb16f4ab792",
  measurementId: "G-WDYVXHYXK1"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Sample educational content
const educationalContent = [
  {
    id: "intro-to-investing",
    title: "Introduction to Investing",
    category: "beginner",
    content: "Learn the basics of investing, including stocks, bonds, and mutual funds.",
    difficulty: "beginner",
    estimatedTime: "15 minutes",
    tags: ["stocks", "bonds", "mutual funds", "basics"],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "portfolio-diversification",
    title: "Portfolio Diversification",
    category: "intermediate",
    content: "Understand how to diversify your portfolio to reduce risk.",
    difficulty: "intermediate",
    estimatedTime: "20 minutes",
    tags: ["diversification", "risk management", "portfolio"],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "risk-assessment",
    title: "Risk Assessment",
    category: "intermediate",
    content: "Learn how to assess your risk tolerance and investment goals.",
    difficulty: "intermediate",
    estimatedTime: "25 minutes",
    tags: ["risk", "assessment", "goals"],
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Sample market data structure
const marketData = {
  lastUpdated: new Date(),
  stocks: {
    "AAPL": {
      symbol: "AAPL",
      name: "Apple Inc.",
      price: 150.00,
      change: 2.50,
      changePercent: 1.69,
      volume: 50000000,
      marketCap: 2500000000000
    },
    "GOOGL": {
      symbol: "GOOGL",
      name: "Alphabet Inc.",
      price: 2800.00,
      change: -15.00,
      changePercent: -0.53,
      volume: 20000000,
      marketCap: 1800000000000
    }
  }
};

// Function to initialize the database
async function initializeFirestore() {
  try {
    console.log("Initializing Firestore database...");
    
    // Add educational content
    for (const content of educationalContent) {
      await setDoc(doc(db, "educational_content", content.id), content);
      console.log(`Added educational content: ${content.title}`);
    }
    
    // Add market data
    await setDoc(doc(db, "market_data", "current"), marketData);
    console.log("Added market data");
    
    console.log("Firestore initialization complete!");
    
  } catch (error) {
    console.error("Error initializing Firestore:", error);
  }
}

// Export for use in your app
export { initializeFirestore, db };
