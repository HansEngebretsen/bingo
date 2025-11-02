import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

function mountApp() {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error("Could not find root element to mount to");
  }

  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

// Fetch and inject SVG symbols, then mount the React app.
// Using a relative path 'symbols.svg' for better deployment flexibility.
fetch('symbols.svg')
  .then(response => {
    if (!response.ok) {
      // Log more details on failure
      throw new Error(`Failed to fetch symbols.svg: ${response.status} ${response.statusText}`);
    }
    return response.text();
  })
  .then(data => {
    const svgContainer = document.getElementById('svg-container');
    if (svgContainer) {
      svgContainer.innerHTML = data;
    }
  })
  .catch(error => {
    console.error('Error loading SVG symbols:', error);
    // Still try to mount the app so the UI is not completely broken
  })
  .finally(() => {
    mountApp();
  });