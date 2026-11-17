const GeminiProvider = require('./GeminiProvider');
const MockAIProvider = require('./MockAIProvider');

let currentProvider = null;

function getAIProvider() {
  const providerType = (process.env.AI_PROVIDER || 'gemini').toLowerCase().trim();

  if (providerType === 'gemini') {
    if (!process.env.GEMINI_API_KEY) {
      console.warn('[AI Service] AI_PROVIDER=gemini but GEMINI_API_KEY is not set in .env. Falling back to MockAIProvider for offline testing.');
      return new MockAIProvider();
    }
    if (!currentProvider || !(currentProvider instanceof GeminiProvider)) {
      currentProvider = new GeminiProvider(process.env.GEMINI_API_KEY, process.env.GEMINI_MODEL || 'gemini-2.5-flash');
    }
    return currentProvider;
  }

  // Default / Mock
  if (!currentProvider || !(currentProvider instanceof MockAIProvider)) {
    currentProvider = new MockAIProvider();
  }
  return currentProvider;
}

module.exports = {
  getAIProvider,
  GeminiProvider,
  MockAIProvider,
};
