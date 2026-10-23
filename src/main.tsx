import { hydrateRoot, createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import App from './App';
import './style.css';
import './case-theme.css';
const root = document.getElementById('root');
if (!root) throw new Error('Missing application root');
const app = (
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
if (root.querySelector('main')) hydrateRoot(root, app);
else createRoot(root).render(app);
