# Nutritrack - Full-Stack Health & Fitness Application

A comprehensive full-stack application for tracking nutrition, fitness, and overall health. Built with Next.js on the frontend and Node.js/Express on the backend, with MongoDB for data persistence.

## 🌟 Features

- **User Authentication**: Secure login and registration system
- **Nutrition Tracking**: Log and monitor daily food intake with detailed nutritional information, including support for strict dietary preferences (Vegetarian, Vegan, Non-Vegetarian)
- **Workout Management**: Create, track, and analyze workout routines
- **Health Metrics**: Monitor vital health statistics and wellness metrics
- **AI Integration**: AI-powered meal planning and workout generation using Google Generative AI
- **Copilot Integration**: Intelligent assistant for personalized fitness recommendations
- **Voice-Activated Features**: Voice AI for hands-free nutrition and fitness logging
- **Disease/Risk Monitoring**: Track health risks and disease prevention
- **Sleep Tracking**: Monitor and improve sleep patterns
- **Real-time Updates**: WebSocket integration for live data updates

## 📁 Project Structure

```
project2/
├── client/                 # Next.js Frontend Application
│   ├── app/               # Next.js App Router
│   │   ├── ai/            # AI Assistant pages
│   │   ├── copilot/       # Copilot integration pages
│   │   ├── dashboard/     # Main dashboard
│   │   ├── health/        # Health tracking modules
│   │   ├── nutrition/     # Food & nutrition tracking
│   │   ├── fitness/       # Workout management
│   │   └── profile/       # User profile
│   ├── components/        # Reusable React components
│   ├── lib/              # Utility functions (API, socket, utils)
│   ├── store/            # Zustand state management
│   └── package.json      # Frontend dependencies
│
├── server/               # Node.js/Express Backend
│   ├── controllers/      # Business logic controllers
│   ├── models/          # MongoDB schemas & models
│   ├── routes/          # API endpoints
│   ├── middleware/      # Authentication & rate limiting
│   ├── utils/           # Helper utilities
│   ├── scratch/         # Development & test files
│   ├── index.js         # Server entry point
│   └── package.json     # Backend dependencies
│
├── sql/                  # Database schema files
├── backend/             # PHP backend files (legacy)
├── css/                 # Stylesheets
├── js/                  # JavaScript files
└── .gitignore          # Git ignore rules
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- MongoDB (local or Atlas)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/somuKadrolli7/nutritrack.git
   cd nutritrack
   ```

2. **Install server dependencies**
   ```bash
   cd server
   npm install
   ```

3. **Install client dependencies**
   ```bash
   cd ../client
   npm install
   ```

### Configuration

1. **Create `.env` file in `/server` directory**
   ```
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   GOOGLE_GENERATIVE_AI_API_KEY=your_google_api_key
   PORT=5000
   ```

2. **Create `.env.local` file in `/client` directory**
   ```
   NEXT_PUBLIC_API_URL=http://localhost:5000
   NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
   ```

### Running the Application

**Terminal 1 - Start Backend Server**
```bash
cd server
npm start
# Server runs on http://localhost:5000
```

**Terminal 2 - Start Frontend Development Server**
```bash
cd client
npm run dev
# Frontend runs on http://localhost:3000
```

Visit `http://localhost:3000` in your browser to access the application.

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user

### User Management
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update user profile

### Nutrition
- `GET /api/meals` - Get all meals
- `POST /api/meals` - Create new meal
- `DELETE /api/meals/:id` - Delete meal

### Workouts
- `GET /api/workouts` - Get all workouts
- `POST /api/workouts` - Create new workout
- `PUT /api/workouts/:id` - Update workout

### Health
- `GET /api/health/metrics` - Get health metrics
- `POST /api/health/metrics` - Record health metric

### AI Features
- `POST /api/ai/chat` - Chat with AI
- `POST /api/ai/meal-suggestions` - Generate tailored diet plans with dietary and regional constraints
- `POST /api/copilot/generate` - Generate fitness plan

## 🛠 Tech Stack

### Frontend
- **Next.js** - React framework with SSR/SSG
- **TypeScript** - Type-safe JavaScript
- **Zustand** - State management
- **Socket.io** - Real-time communication

### Backend
- **Node.js** - JavaScript runtime
- **Express** - Web framework
- **MongoDB** - NoSQL database
- **JWT** - Authentication
- **Google Generative AI** - AI/ML features
- **Socket.io** - Real-time updates

## 📝 Development

### Running Tests
```bash
cd server
npm test

cd ../client
npm test
```

### Build for Production
```bash
# Server
cd server
npm run build

# Client
cd client
npm run build
```

## 🔐 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Input validation and sanitization
- Rate limiting on API endpoints
- XSS protection
- CORS configuration

## 📦 Dependencies Management

Key packages used:
- **Backend**: express, mongoose, jsonwebtoken, dotenv, cors, socket.io
- **Frontend**: next, react, zustand, axios, socket.io-client

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## ⚠️ Important Notes

- **Large Files**: The repository includes MongoDB executable (73.96 MB) which exceeds GitHub's recommended limit. Consider using Git LFS for future large binary files.
- **Node Modules**: Node modules are in `.gitignore` - run `npm install` after cloning
- **Environment Variables**: Never commit `.env` files with sensitive data

## 📄 License

This project is open source and available under the MIT License.

## 👤 Author

**Somu Kadrolli**
- GitHub: [@somuKadrolli7](https://github.com/somuKadrolli7)

## 📞 Support

For issues and questions, please open an issue on the GitHub repository.

---

**Last Updated**: August 11, 2026
