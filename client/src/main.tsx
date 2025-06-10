import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initializeAmplitude } from './lib/amplitude'
import { UserProvider } from './contexts/UserContext'

// Initialize Amplitude analytics
initializeAmplitude();

createRoot(document.getElementById("root")!).render(
  <UserProvider>
    <App />
  </UserProvider>
);
