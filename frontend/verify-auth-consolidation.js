#!/usr/bin/env node

/**
 * Authentication Consolidation Verification Script
 * 
 * This script verifies that the auth system consolidation was successful
 * by checking file structure and import patterns.
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Authentication System Consolidation...\n');

let errors = 0;
let warnings = 0;
let checks = 0;

function check(condition, message, severity = 'error') {
  checks++;
  if (condition) {
    console.log(`✅ ${message}`);
    return true;
  } else {
    if (severity === 'error') {
      console.log(`❌ ${message}`);
      errors++;
    } else {
      console.log(`⚠️  ${message}`);
      warnings++;
    }
    return false;
  }
}

// Check 1: AuthContext.js exists and is valid
const authContextPath = path.join(__dirname, 'src/contexts/AuthContext.js');
check(
  fs.existsSync(authContextPath),
  'AuthContext.js exists in contexts/'
);

// Check 2: useAuth.js exists and is simplified
const useAuthPath = path.join(__dirname, 'src/hooks/useAuth.js');
if (fs.existsSync(useAuthPath)) {
  const useAuthContent = fs.readFileSync(useAuthPath, 'utf8');
  check(
    useAuthContent.includes('export { useAuth, AuthProvider }') &&
    useAuthContent.includes('../contexts/AuthContext'),
    'useAuth.js correctly re-exports from AuthContext'
  );
  check(
    useAuthContent.split('\n').length < 20,
    'useAuth.js is simplified (< 20 lines)'
  );
  check(
    !useAuthContent.includes('const AuthContext = createContext'),
    'useAuth.js does not create its own context'
  );
}

// Check 3: AuthContext has required exports
if (fs.existsSync(authContextPath)) {
  const authContextContent = fs.readFileSync(authContextPath, 'utf8');
  
  check(
    authContextContent.includes('export function useAuth()'),
    'AuthContext exports useAuth hook'
  );
  
  check(
    authContextContent.includes('export function AuthProvider'),
    'AuthContext exports AuthProvider component'
  );
  
  check(
    authContextContent.includes('handleSignInWithGoogle') &&
    !authContextContent.includes('const signInWithGoogle = async () => {'),
    'Google OAuth recursive bug is fixed (uses handleSignInWithGoogle)'
  );
  
  check(
    authContextContent.includes('login: signIn') &&
    authContextContent.includes('logout: signOut') &&
    authContextContent.includes('signup: signUp'),
    'AuthContext provides compatibility aliases (login, logout, signup)'
  );
  
  check(
    authContextContent.includes('user: currentUser') &&
    authContextContent.includes('userProfile: currentUser?.profile'),
    'AuthContext provides user and userProfile accessors'
  );
}

// Check 4: index.js uses the correct AuthProvider
const indexPath = path.join(__dirname, 'src/index.js');
if (fs.existsSync(indexPath)) {
  const indexContent = fs.readFileSync(indexPath, 'utf8');
  check(
    indexContent.includes("from './contexts/AuthContext'"),
    'index.js imports from contexts/AuthContext'
  );
  check(
    indexContent.includes('<AuthProvider>'),
    'index.js wraps app with AuthProvider'
  );
}

// Check 5: App.jsx structure
const appPath = path.join(__dirname, 'src/App.jsx');
if (fs.existsSync(appPath)) {
  const appContent = fs.readFileSync(appPath, 'utf8');
  check(
    !appContent.includes('<ProtectedRoute>') || 
    appContent.includes('// import ProtectedRoute'),
    'Protected routes are disabled for demo (as expected)'
  );
}

// Summary
console.log('\n' + '='.repeat(50));
console.log(`📊 Verification Summary:`);
console.log(`   Total Checks: ${checks}`);
console.log(`   ✅ Passed: ${checks - errors - warnings}`);
console.log(`   ❌ Errors: ${errors}`);
console.log(`   ⚠️  Warnings: ${warnings}`);
console.log('='.repeat(50) + '\n');

if (errors === 0 && warnings === 0) {
  console.log('🎉 SUCCESS! Authentication system consolidation is complete and verified!\n');
  console.log('Next steps:');
  console.log('1. Start the dev server: npm start');
  console.log('2. Test login/signup flows');
  console.log('3. Test Google OAuth');
  console.log('4. Verify session persistence');
  process.exit(0);
} else if (errors === 0) {
  console.log('✅ Authentication consolidation is complete with minor warnings.\n');
  process.exit(0);
} else {
  console.log('❌ Authentication consolidation has issues that need to be fixed.\n');
  process.exit(1);
}

