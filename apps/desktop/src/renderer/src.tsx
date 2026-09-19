import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Welcome } from './features/welcome';
import './theme/global.css';

const root = document.getElementById('root');
if (!root) throw new Error('Missing application root');
createRoot(root).render(
  <StrictMode>
    <Welcome />
  </StrictMode>,
);
