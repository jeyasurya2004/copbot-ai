# CopBot AI

A modern AI-powered chat application with voice input and theme support, built with React, TypeScript, and Firebase.

## 🚀 Features

- 💬 Real-time chat interface
- 🎙️ Voice input functionality
- 🌓 Light/Dark theme support
- 🔒 User authentication
- 📱 Responsive design
- ⚡ Built with Vite for fast development

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Context API
- **Authentication**: Firebase Auth
- **Backend**: Firebase Services
- **Build Tool**: Vite

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or later)
- npm or yarn
- Firebase project (for authentication and other Firebase services)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/jeyasurya2004/copbot-ai.git
   cd copbot-ai
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn
   ```

3. Create a `.env` file in the root directory and add your Firebase configuration:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

4. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. Open [http://localhost:5173](http://localhost:5173) to view it in the browser.

## 🏗️ Project Structure

```
src/
├── components/     # Reusable UI components
├── contexts/      # React context providers
├── hooks/         # Custom React hooks
├── lib/           # Third-party library configurations
├── services/      # API and service integrations
├── types/         # TypeScript type definitions
├── App.tsx        # Main application component
└── main.tsx       # Application entry point
```

## 🎨 Theming

The application supports both light and dark themes. The theme can be toggled using the theme toggle button in the interface.

## 🎤 Voice Input

The chat interface includes voice input functionality. Click the microphone button and speak to convert your speech to text.

## 📦 Building for Production

To create a production build:

```bash
npm run build
# or
yarn build
```

The build artifacts will be stored in the `dist/` directory.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

Built with ❤️ by Jeyasurya
