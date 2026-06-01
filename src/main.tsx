import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/global.css';

// NOTE: we intentionally do NOT wrap in <StrictMode>. Strict mode mounts,
// unmounts, and remounts effects in development, which would create and
// dispose the single WebGL context twice on the same <canvas> — the second
// renderer fails to acquire a context. One mount, one context.
const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Root element #root not found');

createRoot(rootEl).render(<App />);
