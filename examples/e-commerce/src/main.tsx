import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { RoleProvider } from "./providers/RoleProvider";
import { QueryProvider } from "./providers/QueryProvider";
import { CartProvider } from "./providers/CartProvider";
import App from "./App";
import "./styles/index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <QueryProvider>
        <RoleProvider>
          <CartProvider>
            <App />
          </CartProvider>
        </RoleProvider>
      </QueryProvider>
    </BrowserRouter>
  </StrictMode>
);
