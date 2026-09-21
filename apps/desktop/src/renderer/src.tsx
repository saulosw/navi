import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './features/app';
import './theme/global.css';

const root = document.getElementById('root');

if (!root) throw new Error('Missing application root');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
