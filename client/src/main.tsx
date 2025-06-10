import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initializeAmplitude } from './lib/amplitude'

// Initialize Amplitude analytics
initializeAmplitude();

createRoot(document.getElementById("root")!).render(<App />);
