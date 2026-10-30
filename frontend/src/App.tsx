import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar, TabKey } from './components/Sidebar';
import { PipelineStepper } from './components/PipelineStepper';
import { WarningBanner } from './components/WarningBanner';
import { OverviewView } from './views/OverviewView';
import { CatalystView } from './views/CatalystView';
import { ChemistryView } from './views/ChemistryView';
import { QuantumView } from './views/QuantumView';
import { PrioritizationView } from './views/PrioritizationView';
import { FluorineBalanceView } from './views/FluorineBalanceView';
import { PathwaysView } from './views/PathwaysView';
import { EvidenceView } from './views/EvidenceView';
import { PFASLibraryView } from './views/PFASLibraryView';
import { LiteratureWorkspaceView } from './views/LiteratureWorkspaceView';
import { ExperimentPlannerView } from './views/ExperimentPlannerView';
import { RecommendationsView } from './views/RecommendationsView';
import { ProjectsReportsView } from './views/ProjectsReportsView';
import { SettingsView } from './views/SettingsView';
import { ToastContainer, ToastMessage } from './components/Toast';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { AuthModal } from './components/AuthModal';
import { api } from './services/api';

const AppContent: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<TabKey>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [apiOnline, setApiOnline] = useState<boolean>(true);
  const [seeding, setSeeding] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: 'success' | 'error' | 'info', message: string, title?: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message, title }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const checkHealth = async () => {
    try {
      const res = await api.getHealth();
      setApiOnline(res.status === 'healthy' || res.database_connected);
    } catch {
      setApiOnline(false);
    }
  };

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleSelectTab = (tab: TabKey) => {
    setCurrentTab(tab);
    setMobileMenuOpen(false); // automatically close drawer on selection
  };

  const handleTriggerSeed = async () => {
    setSeeding(true);
    try {
      const res = await api.triggerSeed();
      addToast('success', res.message || 'Verified research dataset and models synchronized.', 'Repository Synchronized');
    } catch (err: any) {
      addToast('error', `Repository sync failed: ${err.message}`, 'Sync Failed');
    } finally {
      setSeeding(false);
    }
  };

  const renderActiveView = () => {
    switch (currentTab) {
      case 'overview':
        return <OverviewView onNavigate={handleSelectTab} />;
      case 'pfas':
        return <PFASLibraryView onNavigate={handleSelectTab} />;
      case 'literature':
        return <LiteratureWorkspaceView onNavigate={handleSelectTab} />;
      case 'catalysts':
        return <CatalystView onNavigate={handleSelectTab} />;
      case 'chemistry':
        return <ChemistryView onNavigate={handleSelectTab} />;
      case 'quantum':
        return <QuantumView onNavigate={handleSelectTab} />;
      case 'fluorine':
        return <FluorineBalanceView onNavigate={handleSelectTab} />;
      case 'experiments':
        return <ExperimentPlannerView onNavigate={handleSelectTab} />;
      case 'recommendations':
        return <RecommendationsView onNavigate={handleSelectTab} />;
      case 'reports':
        return <ProjectsReportsView onNavigate={handleSelectTab} />;
      case 'settings':
        return <SettingsView />;
      case 'pathways':
        return <PathwaysView onNavigate={handleSelectTab} />;
      case 'prioritization':
        return <PrioritizationView onNavigate={handleSelectTab} />;
      case 'evidence':
        return <EvidenceView onNavigate={handleSelectTab} />;
      default:
        return <OverviewView onNavigate={handleSelectTab} />;
    }
  };

  return (
    <div className="app-layout">
      {/* Mobile Drawer Overlay */}
      <div
        className={`sidebar-overlay ${mobileMenuOpen ? 'mobile-open' : ''}`}
        onClick={() => setMobileMenuOpen(false)}
      />

      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={handleSelectTab}
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="main-content">
        <Navbar
          apiOnline={apiOnline}
          onRefreshHealth={checkHealth}
          onTriggerSeed={handleTriggerSeed}
          seeding={seeding}
          onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
          mobileMenuOpen={mobileMenuOpen}
        />

        <main className="page-container">
          <PipelineStepper currentTab={currentTab} onSelectTab={handleSelectTab} />
          <WarningBanner />
          <div className="view-fade-in" key={currentTab}>
            {renderActiveView()}
          </div>
        </main>
      </div>

        <ToastContainer toasts={toasts} onDismiss={removeToast} />
        <AuthModal />
      </div>
  );
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
