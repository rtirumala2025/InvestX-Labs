// Using dynamic import for ESM modules in CommonJS
async function runTests() {
  const { checkSafety } = await import('./frontend/src/services/chat/safetyGuardrails.js');

  // Test 1: Specific stock
  const test1 = await checkSafety('Should I buy Tesla stock?');
  console.log('Test 1 (Tesla):', test1.detected ? '✅ DETECTED' : '❌ FAILED');
  console.log('  Type:', test1.type);
  console.log('  Response time:', test1.responseTime + 'ms');

  // Test 2: Crypto
  const test2 = await checkSafety('Should I invest in Bitcoin?');
  console.log('Test 2 (Crypto):', test2.detected ? '✅ DETECTED' : '❌ FAILED');
  console.log('  Type:', test2.type);

  // Test 3: Safe query
  const test3 = await checkSafety('What is compound interest?');
  console.log('Test 3 (Safe):', !test3.detected ? '✅ PASSED' : '❌ FAILED');
  
  console.log('\n✅ All safety tests completed!');
}

runTests().catch(console.error);
