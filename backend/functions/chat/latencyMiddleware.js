/**
 * Simulates network latency for testing purposes
 * @param {number} minMs - Minimum latency in milliseconds
 * @param {number} maxMs - Maximum latency in milliseconds
 * @returns {Promise} - Resolves after random delay between minMs and maxMs
 */
const simulateLatency = (minMs = 50, maxMs = 500) => {
  return new Promise(resolve => {
    const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
    setTimeout(resolve, delay);
  });
};

module.exports = { simulateLatency };