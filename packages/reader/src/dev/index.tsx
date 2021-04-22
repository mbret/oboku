import ReactDOM from "react-dom";
import React from 'react';
import { App } from "./App";

console.log(navigator.serviceWorker)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('SW registered: ', registration);
        ReactDOM.render(
          <App />,
          document.getElementById('app')
        )
      })
      .catch(registrationError => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

