import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { OverviewStats, Project } from '../types';
import { MetricCard } from '../components/MetricCard';
import { WarningBanner } from '../components/WarningBanner';
import { ScreenTab } from '../components/TabBar';

interface OverviewScreenProps {
  stats: OverviewStats | null;
  activeProject: Project | null;
  onNavigate: (tab: ScreenTab) => void;
  onRefresh: () => void;
}

export const OverviewScreen: React.FC<OverviewScreenProps> = ({
  stats,
  activeProject,
  onNavigate,
  onRefresh
}) => {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Prominent Scientific Warning */}
      <WarningBanner
        type="warning"
        title="SCIENTIFIC LIMITATION NOTICE"
        message="Quantum VQE benchmarks evaluate a pedagogical toy Hamiltonian to validate algorithm mechanics. They do NOT calculate PFAS reaction energies or commercial catalyst performance. Parent compound removal != complete defluorination."
      />

      {/* Primary Metrics Grid */}
      <Text style={styles.sectionHeader}>RESEARCH INVENTORY</Text>
      <View style={styles.metricGrid}>
        <MetricCard
          label="Active Projects"
          value={stats?.total_projects ?? 0}
          badge="SQLite"
          badgeColor="#0284C7"
        />
        <MetricCard
          label="Evidence Records"
          value={stats?.total_evidence_records ?? 0}
          badge="Peer-Reviewed"
          badgeColor="#10B981"
        />
      </View>
      <View style={styles.metricGrid}>
        <MetricCard
          label="Quantum Runs"
          value={stats?.total_quantum_runs ?? 0}
          badge="VQE Hybrid"
          badgeColor="#8B5CF6"
        />
        <MetricCard
          label="Fluorine Scenarios"
          value={stats?.total_fluorine_scenarios ?? 0}
          badge="Mass Balance"
          badgeColor="#D97706"
        />
      </View>

      {/* Active Project Card */}
      {activeProject && (
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>CURRENT RESEARCH DOSSIER</Text>
            <View style={styles.statusPill}>
              <Text style={styles.statusPillText}>{activeProject.status}</Text>
            </View>
          </View>
          <Text style={styles.projectTitleText}>{activeProject.title}</Text>
          <Text style={styles.projectDetailText}>
            <Text style={styles.boldText}>Target Analyte: </Text>
            {activeProject.target_pfas}
          </Text>
          <Text style={styles.projectDetailText}>
            <Text style={styles.boldText}>Research Question: </Text>
            {activeProject.research_question}
          </Text>
          <Text style={styles.projectDetailText}>
            <Text style={styles.boldText}>Destruction Approach: </Text>
            {activeProject.destruction_approach || 'Unspecified'}
          </Text>
        </View>
      )}

      {/* Latest Quantum Benchmark Highlight */}
      {stats?.latest_quantum_run && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>LATEST QUANTUM BENCHMARK</Text>
          <Text style={styles.subTitleText}>{stats.latest_quantum_run.run_name}</Text>
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.miniLabel}>VQE Ground Energy</Text>
              <Text style={styles.codeText}>
                {stats.latest_quantum_run.vqe_energy.toFixed(6)} a.u.
              </Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.miniLabel}>Exact Energy</Text>
              <Text style={styles.codeText}>
                {stats.latest_quantum_run.exact_energy.toFixed(6)} a.u.
              </Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.miniLabel}>Absolute Error</Text>
              <Text style={[styles.codeText, { color: '#059669' }]}>
                {stats.latest_quantum_run.absolute_error.toExponential(3)}
              </Text>
            </View>
          </View>
          <Text style={styles.tagText}>
            Status: Statevector simulation ({stats.latest_quantum_run.execution_time_ms.toFixed(1)} ms)
          </Text>
        </View>
      )}

      {/* Quick Action Navigation Grid */}
      <Text style={styles.sectionHeader}>RESEARCH WORKFLOW MODULES</Text>
      <View style={styles.actionGrid}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onNavigate('pfas')}
        >
          <Text style={styles.actionIcon}>🧬</Text>
          <Text style={styles.actionTitle}>PFAS Library</Text>
          <Text style={styles.actionSubtitle}>Chemical properties & CAS</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onNavigate('catalysts')}
        >
          <Text style={styles.actionIcon}>⚗️</Text>
          <Text style={styles.actionTitle}>Catalyst Explorer</Text>
          <Text style={styles.actionSubtitle}>MCDA scoring & trade-offs</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onNavigate('chemistry')}
        >
          <Text style={styles.actionIcon}>🔬</Text>
          <Text style={styles.actionTitle}>Molecular Lab</Text>
          <Text style={styles.actionSubtitle}>RHF/STO-3G SCF & ΔErxn</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onNavigate('quantum')}
        >
          <Text style={styles.actionIcon}>⚛️</Text>
          <Text style={styles.actionTitle}>Quantum Lab</Text>
          <Text style={styles.actionSubtitle}>Run VQE vs exact solver</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onNavigate('fluorine')}
        >
          <Text style={styles.actionIcon}>⚖️</Text>
          <Text style={styles.actionTitle}>Fluorine Balance</Text>
          <Text style={styles.actionSubtitle}>Closure & deficit audit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onNavigate('literature')}
        >
          <Text style={styles.actionIcon}>📖</Text>
          <Text style={styles.actionTitle}>Literature Assistant</Text>
          <Text style={styles.actionSubtitle}>Grounded research Q&A</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onNavigate('experiments')}
        >
          <Text style={styles.actionIcon}>📋</Text>
          <Text style={styles.actionTitle}>Experiment Planner</Text>
          <Text style={styles.actionSubtitle}>Uncertainty reduction protocols</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onNavigate('recommendations')}
        >
          <Text style={styles.actionIcon}>💡</Text>
          <Text style={styles.actionTitle}>Recommendations</Text>
          <Text style={styles.actionSubtitle}>Explainable catalyst priority</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC'
  },
  content: {
    padding: 16,
    paddingBottom: 40
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 0.8,
    marginTop: 16,
    marginBottom: 8
  },
  metricGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0284C7',
    letterSpacing: 0.6
  },
  statusPill: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12
  },
  statusPillText: {
    color: '#166534',
    fontSize: 10,
    fontWeight: '700'
  },
  projectTitleText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6
  },
  projectDetailText: {
    fontSize: 12,
    color: '#475569',
    marginBottom: 4,
    lineHeight: 16
  },
  boldText: {
    fontWeight: '700',
    color: '#0F172A'
  },
  subTitleText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 10
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F1F5F9',
    padding: 10,
    borderRadius: 6,
    marginBottom: 8
  },
  col: {
    flex: 1
  },
  miniLabel: {
    fontSize: 9,
    color: '#64748B',
    textTransform: 'uppercase',
    fontWeight: '600'
  },
  codeText: {
    fontSize: 12,
    fontFamily: 'monospace',
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 2
  },
  tagText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500'
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 6
  },
  actionButton: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1
  },
  actionIcon: {
    fontSize: 22,
    marginBottom: 6
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2
  },
  actionSubtitle: {
    fontSize: 11,
    color: '#64748B'
  }
});
