const { GoogleGenerativeAI } = require('@google/generative-ai');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const apiKey = process.env.GEMINI_API_KEY;
console.log('Using API key:', apiKey);

if (!apiKey) {
  console.error('No GEMINI_API_KEY found in .env!');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function test() {
  const models = ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-flash-latest'];
  for (const modelName of models) {
    try {
      console.log(`Testing model: ${modelName}...`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent('Say hello back in exactly 3 words.');
      console.log(`Success with ${modelName}! Reply:`, result.response.text().trim());
      return;
    } catch (err) {
      console.error(`Failed for ${modelName}:`, err.message);
    }
  }
}

test();
