import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { Buffer } from 'buffer';

// @ts-ignore
window.Buffer = Buffer;
// @ts-ignore
window.global = window;
// @ts-ignore
window.process = { env: {} };

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
