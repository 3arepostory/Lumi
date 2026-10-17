import { createRoot } from 'react-dom/client';
import {lazy,Suspense} from 'react';
import LinkApp from './link/LinkApp';
import './style.css';
const MatrixApp=lazy(()=>import('./App'));
createRoot(document.getElementById('root')!).render(new URLSearchParams(location.search).get('modo')==='matrix'?<Suspense fallback={<p>Preparando o Lumi…</p>}><MatrixApp/></Suspense>:<LinkApp/>);
if ('serviceWorker' in navigator && import.meta.env.PROD) navigator.serviceWorker.register('/sw.js').catch(() => {});
