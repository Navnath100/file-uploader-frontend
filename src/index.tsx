import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { GoogleOAuthProvider } from '@react-oauth/google';
const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
const CLIENT_ID: any = process.env.REACT_APP_CLIENT_ID;
console.log("CLIENT_ID : ", CLIENT_ID);

root.render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={CLIENT_ID}>
      <App />
    </GoogleOAuthProvider>
  </React.StrictMode>
);
reportWebVitals();