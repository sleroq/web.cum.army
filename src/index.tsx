import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { StatusProvider } from './providers/StatusProvider';
import { SettingsProvider } from './providers/SettingsProvider';
import { SITE_NAME } from './config/site';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element #root not found');
}

document.title = SITE_NAME;

const root = ReactDOM.createRoot(rootElement);
const path = import.meta.env.PUBLIC_URL;

root.render(
  <React.StrictMode>
    <BrowserRouter basename={path}>
      <StatusProvider>
        <SettingsProvider>
          <App />
        </SettingsProvider>
      </StatusProvider>
    </BrowserRouter>
  </React.StrictMode>
);
