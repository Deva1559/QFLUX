import React, { useState, useEffect } from 'react';
import { SafeAreaView, StatusBar, StyleSheet, View, Modal } from 'react-native';
import { Header } from './components/Header';
import { TabBar, ScreenTab } from './components/TabBar';
import { OverviewScreen } from './screens/OverviewScreen';
import { PFASLibraryScreen } from './screens/PFASLibraryScreen';
import { LiteratureWorkspaceScreen } from './screens/LiteratureWorkspaceScreen';
import { CatalystCatalogueScreen } from './screens/CatalystCatalogueScreen';
import { CatalystComparisonScreen } from './screens/CatalystComparisonScreen';
import { MolecularChemistryScreen } from './screens/MolecularChemistryScreen';
import { CatalystPrioritizationScreen } from './screens/CatalystPrioritizationScreen';
import { QuantumLabScreen } from './screens/QuantumLabScreen';
import { FluorineBalanceScreen } from './screens/FluorineBalanceScreen';
import { ExperimentPlannerScreen } from './screens/ExperimentPlannerScreen';
import { RecommendationsScreen } from './screens/RecommendationsScreen';
import { PathwayScreen } from './screens/PathwayScreen';
import { EvidenceScreen } from './screens/EvidenceScreen';
import { ProjectsScreen } from './screens/ProjectsScreen';
import { InsightsScreen } from './screens/InsightsScreen';
import { ReportsScreen } from './screens/ReportsScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { AuthScreen } from './screens/AuthScreen';
import { AuthProvider } from './services/auth';
import { Project, OverviewStats, EvidenceRecord, QuantumBenchmarkResponse } from './types';
import { api } from './services/api';

function MainApp() {
  const [authModalVisible, setAuthModalVisible] = useState<boolean>(false);
  const [currentTab, setCurrentTab] = useState<ScreenTab>('overview');
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [evidence, setEvidence] = useState<EvidenceRecord[]>([]);
  const [latestQuantumRun, setLatestQuantumRun] = useState<QuantumBenchmarkResponse | null>(null);
  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(false);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      const health = await api.getHealth();
      setIsBackendConnected(health.database_connected);

      // Load Projects
      const projs = await api.getProjects();
      setProjects(projs);
      if (projs.length > 0 && !activeProject) {
        setActiveProject(projs[0]);
      }

      // Load Stats
      const overviewStats = await api.getOverviewStats(activeProject?.id);
      setStats(overviewStats);

      // Load Evidence
      const evs = await api.getEvidence(activeProject?.id);
      setEvidence(evs);
    } catch (_) {
      setIsBackendConnected(false);
    }
  };

  const handleSelectProject = (project: Project) => {
    setActiveProject(project);
    loadAllData();
  };

  const handleQuantumBenchmarkComplete = (res: QuantumBenchmarkResponse) => {
    setLatestQuantumRun(res);
    loadAllData();
  };

  const getScreenTitle = (tab: ScreenTab) => {
    switch (tab) {
      case 'overview':
        return { title: 'Dashboard', subtitle: 'Executive research overview & forensic mass-balance indicators' };
      case 'pfas':
        return { title: 'PFAS Library', subtitle: 'Normalized chemical properties, molecular formulas, CAS & structures' };
      case 'literature':
        return { title: 'Literature Workspace', subtitle: 'Source-grounded research assistant, paper chunks & claim verification' };
      case 'catalysts':
        return { title: 'Catalyst Explorer', subtitle: 'Evidence-backed candidates: removal vs measured defluorination' };
      case 'compare':
        return { title: 'Catalyst Comparison', subtitle: 'Cross-paradigm side-by-side trade-off matrix' };
      case 'chemistry':
        return { title: 'Molecular Chemistry Lab', subtitle: 'Ab-initio RHF electronic structure, HOMO-LUMO gap & ΔErxn' };
      case 'prioritization':
        return { title: 'Catalyst Prioritization', subtitle: '10-dimension multi-criteria scoring & defluorination penalty' };
      case 'quantum':
        return { title: 'Quantum VQE Lab', subtitle: 'Reduced C-F active space (2-qubit Jordan-Wigner) vs exact solver' };
      case 'fluorine':
        return { title: 'Fluorine Accounting', subtitle: 'Mass balance closure & volatile organofluorine deficit detection' };
      case 'pathway':
        return { title: 'Pathway Explorer', subtitle: 'Documented elementary reaction transformations' };
      case 'experiments':
        return { title: 'Experiment Planner', subtitle: 'Uncertainty reduction protocols & bulk CSV dataset imports' };
      case 'recommendations':
        return { title: 'Research Recommendations', subtitle: 'Transparent catalyst prioritization, citations & next experiment' };
      case 'projects':
        return { title: 'Projects & Reports', subtitle: 'Persisted project dossiers in SQLite & publication export' };
      case 'reports':
        return { title: 'Scientific Reports', subtitle: 'Publication-grade ReportLab PDF generation' };
      case 'evidence':
        return { title: 'Literature Evidence', subtitle: 'Degradation, defluorination & mineralization benchmarks' };
      case 'settings':
        return { title: 'System Settings', subtitle: 'API connectivity, SQLite status, seed data & backup snapshots' };
    }
  };

  const screenInfo = getScreenTitle(currentTab);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* Persistent App Header */}
      <Header
        title={screenInfo.title}
        subtitle={screenInfo.subtitle}
        activeProjectTitle={activeProject?.title}
        isBackendConnected={isBackendConnected}
        onRefresh={loadAllData}
        onOpenAuth={() => setAuthModalVisible(true)}
      />

      {/* Screen Body */}
      <View style={styles.screenContainer}>
        {currentTab === 'overview' && (
          <OverviewScreen
            stats={stats}
            activeProject={activeProject}
            onNavigate={setCurrentTab}
            onRefresh={loadAllData}
          />
        )}
        {currentTab === 'pfas' && (
          <PFASLibraryScreen onRefresh={loadAllData} />
        )}
        {currentTab === 'literature' && (
          <LiteratureWorkspaceScreen onRefresh={loadAllData} />
        )}
        {currentTab === 'catalysts' && (
          <CatalystCatalogueScreen
            onRefresh={loadAllData}
            onSelectForComparison={() => setCurrentTab('compare')}
          />
        )}
        {currentTab === 'compare' && (
          <CatalystComparisonScreen />
        )}
        {currentTab === 'chemistry' && (
          <MolecularChemistryScreen />
        )}
        {currentTab === 'prioritization' && (
          <CatalystPrioritizationScreen />
        )}
        {currentTab === 'quantum' && (
          <QuantumLabScreen
            activeProjectId={activeProject?.id}
            latestRun={latestQuantumRun}
            onBenchmarkComplete={handleQuantumBenchmarkComplete}
          />
        )}
        {currentTab === 'fluorine' && (
          <FluorineBalanceScreen
            activeProjectId={activeProject?.id}
            onRefresh={loadAllData}
          />
        )}
        {currentTab === 'pathway' && (
          <PathwayScreen activeProjectId={activeProject?.id} />
        )}
        {currentTab === 'experiments' && (
          <ExperimentPlannerScreen activeProjectId={activeProject?.id} />
        )}
        {currentTab === 'recommendations' && (
          <RecommendationsScreen activeProjectId={activeProject?.id} />
        )}
        {currentTab === 'evidence' && (
          <EvidenceScreen
            evidence={evidence}
            activeProjectId={activeProject?.id}
            onRefresh={loadAllData}
          />
        )}
        {currentTab === 'projects' && (
          <ProjectsScreen
            projects={projects}
            activeProject={activeProject}
            onSelectProject={handleSelectProject}
            onRefresh={loadAllData}
          />
        )}
        {currentTab === 'reports' && (
          <ReportsScreen activeProjectId={activeProject?.id} />
        )}
        {currentTab === 'settings' && (
          <SettingsScreen onRefresh={loadAllData} />
        )}
      </View>

      {/* Bottom Tab Navigation */}
      <TabBar currentTab={currentTab} onSelectTab={setCurrentTab} />

      {/* Authentication Modal */}
      <Modal
        visible={authModalVisible}
        animationType="slide"
        onRequestClose={() => setAuthModalVisible(false)}
      >
        <AuthScreen
          onSuccess={() => {
            setAuthModalVisible(false);
            loadAllData();
          }}
          onCancel={() => setAuthModalVisible(false)}
          onNavigateToSettings={() => {
            setAuthModalVisible(false);
            setCurrentTab('settings');
          }}
        />
      </Modal>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC'
  },
  screenContainer: {
    flex: 1
  }
});

