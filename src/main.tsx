import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Add error handling for initialization
try {
  const rootElement = document.getElementById("root");
  if (!rootElement) {
    throw new Error("Root element not found");
  }

  console.log("Initializing app with base URL:", import.meta.env.BASE_URL);
  createRoot(rootElement).render(<App />);
} catch (error) {
  console.error("Failed to initialize app:", error);
  // Display error on page for debugging
  document.body.innerHTML = `
    <div style="padding: 20px; font-family: monospace; color: #0f0; background: #000;">
      <h1>App Initialization Error</h1>
      <p>${error instanceof Error ? error.message : String(error)}</p>
      <p>Base URL: ${import.meta.env.BASE_URL}</p>
      <p>Check browser console for details.</p>
    </div>
  `;
}
