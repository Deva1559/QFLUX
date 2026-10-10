import React, { useState, useEffect } from 'react';
import { SafeAreaView, StatusBar, StyleSheet, View } from 'react-native';
import { Header } from './components/Header';
import { TabBar, ScreenTab } from './components/TabBar';
import { OverviewScreen } from './screens/OverviewScreen';
import { CatalystCatalogueScreen } from './screens/CatalystCatalogueScreen';
import { CatalystComparisonScreen } from './screens/CatalystComparisonScreen';
import { MolecularChemistryScreen } from './screens/MolecularChemistryScreen';
import { CatalystPrioritizationScreen } from './screens/CatalystPrioritizationScreen';
import { QuantumLabScreen } from './screens/QuantumLabScreen';
import { FluorineBalanceScreen } from './screens/FluorineBalanceScreen';
import { PathwayScreen } from './screens/PathwayScreen';
import { EvidenceScreen } from './screens/EvidenceScreen';
import { ProjectsScreen } from './screens/ProjectsScreen';
import { InsightsScreen } from './screens/InsightsScreen';
import { ReportsScreen } from './screens/ReportsScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { Project, OverviewStats, EvidenceRecord, QuantumBenchmarkResponse } from './types';
import { api } from './services/api';

export default function App() {
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
        return { title: 'Research Workspace', subtitle: 'Executive overview & critical limitations' };
      case 'catalysts':
        return { title: 'Catalyst Catalogue', subtitle: 'Evidence-backed candidates: removal vs measured defluorination' };
      case 'compare':
        return { title: 'Catalyst Comparison', subtitle: 'Cross-paradigm side-by-side trade-off matrix' };
      case 'chemistry':
        return { title: 'PFAS Molecular SCF', subtitle: 'Ab-initio RHF electronic structure, HOMO-LUMO gap & ΔErxn' };
      case 'prioritization':
        return { title: 'Catalyst Prioritization', subtitle: '10-dimension multi-criteria scoring & sensitivity analysis' };
      case 'quantum':
        return { title: 'Quantum VQE Lab', subtitle: 'Reduced C-F active space (2-qubit Jordan-Wigner) vs exact solver' };
      case 'fluorine':
        return { title: 'Fluorine Accounting', subtitle: 'Mass balance closure & missing fraction detection' };
      case 'pathway':
        return { title: 'Pathway Explorer', subtitle: 'Documented elementary reaction transformations' };
      case 'evidence':
        return { title: 'Literature Evidence', subtitle: 'Degradation, defluorination & mineralization benchmarks' };
      case 'projects':
        return { title: 'Research Studies', subtitle: 'Persisted project dossiers in SQLite' };
      case 'insights':
        return { title: 'Research Advisor', subtitle: 'Rule-based evaluation of uncertainties & next experiments' };
      case 'reports':
        return { title: 'Scientific Reports', subtitle: 'Publication-grade ReportLab PDF generation' };
      case 'settings':
        return { title: 'System Settings', subtitle: 'API endpoint, SQLite status & seed data' };
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
        {currentTab === 'insights' && (
          <InsightsScreen activeProjectId={activeProject?.id} />
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
    </SafeAreaView>
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
