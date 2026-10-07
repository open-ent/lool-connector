import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { EdificeThemeProvider } from "@open-ent/react";
// Le bootstrap openent n'est plus bundlé : il est chargé au runtime via
// <link href="/assets/themes/openent-bootstrap/index.css"> dans index.html
// (cf. README-THEME). Permet de changer le look sans recompiler le module.
import { RouterProvider } from "react-router-dom";
import "./styles/main.css";
import { Providers } from "./providers";
import i18n from "./i18n";
import { I18nextProvider } from "react-i18next";
import { router } from "./routes";

// React application entry point
const rootElement = document.getElementById("root");

if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <Providers>
        <I18nextProvider i18n={i18n}>
          <EdificeThemeProvider>
            <RouterProvider router={router} />
          </EdificeThemeProvider>
        </I18nextProvider>
      </Providers>
    </StrictMode>
  );
}
