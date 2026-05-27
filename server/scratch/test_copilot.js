const { GoogleGenerativeAI } = require('@google/generative-ai');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const apiKey = process.env.GEMINI_API_KEY;
console.log('Testing Copilot connection using API key...');

const genAI = new GoogleGenerativeAI(apiKey);

async function testCopilotTools() {
  const copilotTools = [
    {
      functionDeclarations: [
        {
          name: 'get_dashboard_data',
          description: 'Retrieves today\'s statistics (calories consumed, protein, carbs, fat, and water glasses) and recent days calorie consumption history.',
        },
        {
          name: 'add_water',
          description: 'Adds a specified number of water glasses to the user\'s daily log.',
          parameters: {
            type: 'OBJECT',
            properties: {
              glasses: { type: 'NUMBER', description: 'Number of glasses of water to add.' }
            },
            required: ['glasses']
          }
        }
      ]
    }
  ];

  try {
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      tools: copilotTools
    });

    const chat = model.startChat();
    
    console.log('Sending tool invocation prompt: "Add 3 glasses of water for me"...');
    let response = await chat.sendMessage('Add 3 glasses of water for me');
    
    let functionCalls = response.response.functionCalls;
    if (functionCalls && functionCalls.length > 0) {
      console.log('SUCCESS! Model requested function call:', functionCalls[0].name, 'with args:', functionCalls[0].args);
    } else {
      console.log('Model did not request function call. Text reply:', response.response.text());
    }
  } catch (err) {
    console.error('Copilot test failed:', err.message);
  }
}

testCopilotTools();
