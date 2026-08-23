import React from 'react';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { UIPreferencesProvider } from './context/UIPreferencesContext';
import AppContent from './AppContent';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <UIPreferencesProvider>
          <AppContent />
        </UIPreferencesProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;