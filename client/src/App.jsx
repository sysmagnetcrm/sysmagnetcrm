import React from 'react';
import GlobalErrorBoundary from './components/GlobalErrorBoundary';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { UIPreferencesProvider } from './context/UIPreferencesContext';
import AppContent from './AppContent';

function App() {
  return (
    <GlobalErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <UIPreferencesProvider>
            <AppContent />
          </UIPreferencesProvider>
        </AuthProvider>
      </ThemeProvider>
    </GlobalErrorBoundary>
  );
}

export default App;