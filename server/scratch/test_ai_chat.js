const { GoogleGenerativeAI } = require('@google/generative-ai');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

const SYSTEM_PROMPT = `You are NutriBot, an expert AI nutrition and fitness assistant for NutriTrack.
Help users with meal planning, calorie tracking, workout suggestions, and health tips.
Be friendly, concise (under 200 words), and evidence-based.
Never diagnose medical conditions — always recommend consulting a doctor for medical concerns.`;

async function testChat() {
  const chatHistory = [
    { role: 'user',  parts: [{ text: SYSTEM_PROMPT }] },
    { role: 'model', parts: [{ text: 'Hello! I am NutriBot. How can I help you today?' }] },
  ];

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    console.log('Starting chat...');
    const chat = model.startChat({ history: chatHistory });
    console.log('Sending message "Hello"...');
    const result = await chat.sendMessage('Hello');
    console.log('Response:', result.response.text());
  } catch (err) {
    console.error('Chat failed:', err.message);
  }
}

testChat();
