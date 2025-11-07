import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryProvider } from './providers/QueryProvider';
import { RoleProvider } from './providers/RoleProvider';
import App from './App';
import './styles/index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <RoleProvider>
        <QueryProvider>
          <App />
        </QueryProvider>
      </RoleProvider>
    </BrowserRouter>
  </React.StrictMode>,
);