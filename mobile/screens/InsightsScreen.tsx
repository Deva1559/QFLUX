import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { ResearchInsight } from '../types';
import { api } from '../services/api';

interface InsightsScreenProps {
  activeProjectId?: number;
}

export const InsightsScreen: React.FC<InsightsScreenProps> = ({ activeProjectId }) => {
  const [insights, setInsights] = useState<ResearchInsight[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadInsights();
  }, [activeProjectId]);

  const loadInsights = async () => {
    setLoading(true);
    try {
      const data = await api.getInsights(activeProjectId);
      setInsights(data);
    } catch (_) {
    } finally {
      setLoading(false);
    }
  };

  const getSeverityStyle = (severity: string) => {
    switch (severity) {
      case 'Critical':
        return { bg: '#FEF2F2', border: '#EF4444', text: '#991B1B' };
      case 'Warning':
        return { bg: '#FFFBEB', border: '#F59E0B', text: '#92400E' };
      default:
        return { bg: '#F0F9FF', border: '#0284C7', text: '#0369A1' };
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionHeader}>EVIDENCE-AWARE RESEARCH DECISION SUPPORT</Text>
        <TouchableOpacity style={styles.refreshBtn} onPress={loadInsights}>
          <Text style={styles.refreshBtnText}>🔄 Re-evaluate</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.subtext}>
        Deterministic scientific rules triggered by current evidence, accounting balances, and quantum benchmarks.
      </Text>

      {loading && <ActivityIndicator color="#0284C7" style={{ marginVertical: 20 }} />}

      {insights.map((ins, idx) => {
        const sev = getSeverityStyle(ins.severity);
        return (
          <View key={idx} style={[styles.card, { borderColor: sev.border }]}>
            <View style={styles.cardTop}>
              <View style={[styles.sevBadge, { backgroundColor: sev.bg, borderColor: sev.border }]}>
                <Text style={[styles.sevText, { color: sev.text }]}>{ins.severity.toUpperCase()}</Text>
              </View>
              <Text style={styles.ruleId}>{ins.rule_id}</Text>
            </View>

            <Text style={styles.title}>{ins.title}</Text>

            {/* Triggered Inputs */}
            <View style={styles.box}>
              <Text style={styles.boxLabel}>Trigger Condition / Evidence:</Text>
              <Text style={styles.boxContent}>
                {JSON.stringify(ins.triggered_inputs, null, 2)}
              </Text>
              {ins.supporting_evidence_citation && (
                <Text style={styles.citationText}>
                  Citation: {ins.supporting_evidence_citation}
                </Text>
              )}
            </View>

            {/* Remaining Uncertainty */}
            <View style={styles.sectionBlock}>
              <Text style={styles.blockLabel}>Remaining Scientific Uncertainty:</Text>
              <Text style={styles.blockText}>{ins.remaining_uncertainty}</Text>
            </View>

            {/* Actionable Next Step */}
            <View style={styles.actionBlock}>
              <Text style={styles.actionBlockLabel}>Recommended Next Action:</Text>
              <Text style={styles.actionBlockText}>{ins.recommended_action}</Text>
            </View>
          </View>
        );
      })}
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 0.6,
    flex: 1
  },
  refreshBtn: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 1,
    elevation: 1
  },
  refreshBtnText: {
    fontSize: 10,
    color: '#0284C7',
    fontWeight: '700'
  },
  subtext: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 12
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6
  },
  sevBadge: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    borderWidth: 1
  },
  sevText: {
    fontSize: 9,
    fontWeight: '800'
  },
  ruleId: {
    fontSize: 9,
    color: '#64748B',
    fontFamily: 'monospace'
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8
  },
  box: {
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
    padding: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  boxLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    marginBottom: 2
  },
  boxContent: {
    fontFamily: 'monospace',
    fontSize: 10,
    color: '#1E293B'
  },
  citationText: {
    fontSize: 9,
    color: '#0284C7',
    marginTop: 4,
    fontStyle: 'italic'
  },
  sectionBlock: {
    marginBottom: 6
  },
  blockLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B45309'
  },
  blockText: {
    fontSize: 11,
    color: '#334155',
    lineHeight: 15
  },
  actionBlock: {
    backgroundColor: '#DCFCE7',
    borderRadius: 6,
    padding: 8,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#86EFAC'
  },
  actionBlockLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#166534'
  },
  actionBlockText: {
    fontSize: 11,
    color: '#14532D',
    lineHeight: 15,
    marginTop: 2
  }
});
