import "./utils/slashSafeUrls";
import { StrictMode } from "react";
import { createRoot } from 'react-dom/client'
import { BrowserRouter as Router } from "react-router-dom";
import './styles/global.css'
import { store } from "./features/store";
import { Provider } from "react-redux";
import { ToastProvider } from "./components/UI/toast";
import App from "./App";
import AuthErrorProvider from "./components/Modals/AuthErrorProvider";
import ErrorBoundary from "./components/ErrorBoundary";

createRoot(document.getElementById("root")!).render(
  <Router>
    <StrictMode>
      <Provider store={store}>
        <ToastProvider>
          <AuthErrorProvider>
            <ErrorBoundary>
              <App />
            </ErrorBoundary>
          </AuthErrorProvider>
        </ToastProvider>
      </Provider>
    </StrictMode>
  </Router>
);
