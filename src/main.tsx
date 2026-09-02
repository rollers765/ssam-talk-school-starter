import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";

import { schoolConfig } from "./lib/schoolConfig";

document.documentElement.style.setProperty("--coral", schoolConfig.branding.primaryColor);
document.documentElement.style.setProperty("--coral-dark", `color-mix(in srgb, ${schoolConfig.branding.primaryColor}, black 12%)`);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
