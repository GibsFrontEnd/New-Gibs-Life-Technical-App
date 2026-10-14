import "./utils/slashSafeUrls";
import "./utils/sessionStore";
import { bootstrapSession } from "./utils/sessionStore";
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

// Ask the API who the session cookie belongs to before showing anything, so a reload keeps the user signed in.
bootstrapSession().finally(() => {
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
});
