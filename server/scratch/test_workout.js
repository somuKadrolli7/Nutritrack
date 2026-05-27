const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

dotenv.config({ path: path.join(__dirname, '../.env') });

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/nutritrack';

const Workout = require('../models/Workout');
const User = require('../models/User');

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

async function testWorkout() {
  await mongoose.connect(uri);
  console.log('Connected to DB');
  
  // Find a user
  const user = await User.findOne();
  if (!user) {
    console.log('No user found in DB');
    process.exit(1);
  }

  const copilotTools = [
    {
      functionDeclarations: [
        {
          name: 'add_workout',
          description: 'Logs a new physical exercise or workout performed by the user to their daily logs.',
          parameters: {
            type: 'OBJECT',
            properties: {
              name: { type: 'STRING', description: 'The name of the workout or exercise (e.g., Treadmill Run, Bench Press).' },
              duration: { type: 'NUMBER', description: 'Duration of the exercise in minutes.' },
              caloriesBurned: { type: 'NUMBER', description: 'Estimated calories burned during this exercise.' },
              category: { type: 'STRING', description: 'Optional workout category: cardio, strength, or flexibility.' },
              notes: { type: 'STRING', description: 'Optional workout notes or details.' }
            },
            required: ['name', 'duration', 'caloriesBurned']
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
    
    console.log('Sending prompt: "Log a 45 min weightlifting session burning 300 calories"');
    const response = await chat.sendMessage('Log a 45 min weightlifting session burning 300 calories');
    
    const functionCalls = response.response.functionCalls;
    if (functionCalls && functionCalls.length > 0) {
      console.log('SUCCESS! Model requested function call:', functionCalls[0].name, 'with args:', functionCalls[0].args);
      
      const args = functionCalls[0].args;
      const todayStr = new Date().toISOString().split('T')[0];
      const newWorkout = await Workout.create({
        userId: user._id,
        date: todayStr,
        name: args.name,
        exercises: [{
          name: args.name,
          category: args.category || 'strength',
          duration: Number(args.duration),
          caloriesBurned: Number(args.caloriesBurned),
          notes: args.notes
        }],
        notes: args.notes
      });
      console.log('Workout created in DB:', newWorkout);

    } else {
      console.log('Model did not request function call. Reply:', response.response.text());
    }
  } catch (err) {
    console.error('Test failed:', err.message);
  }
  process.exit(0);
}

testWorkout();
