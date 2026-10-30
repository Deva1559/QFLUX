import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { RecommendationItem } from '../types';
import { api } from '../services/api';

interface RecommendationsScreenProps {
  activeProjectId?: number;
}

export const RecommendationsScreen: React.FC<RecommendationsScreenProps> = ({ activeProjectId }) => {
  const [targetPfas, setTargetPfas] = useState<string>('PFOA');
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRecommendations();
  }, [targetPfas, activeProjectId]);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getRecommendations(targetPfas, activeProjectId);
      setRecommendations(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch recommendations.');
    } finally {
      setLoading(false);
    }
  };

  const getConfidenceBadgeColor = (conf: string) => {
    if (conf.includes('High')) return { bg: '#DCFCE7', text: '#166534' };
    if (conf.includes('Moderate')) return { bg: '#E0F2FE', text: '#0369A1' };
    return { bg: '#FEF3C7', text: '#92400E' };
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Forensic Transparency Notice */}
      <View style={styles.noticeCard}>
        <View style={styles.noticeHeader}>
          <Text style={styles.noticeIcon}>💡</Text>
          <Text style={styles.noticeTitle}>Explainable Research Recommendations</Text>
        </View>
        <Text style={styles.noticeBody}>
          Every catalyst recommendation synthesizes stored empirical degradation literature, ab-initio
          electronic structure calculations (RHF/STO-3G), and a mandatory defluorination penalty.
          The engine explicitly reports remaining uncertainties, missing measurements, and the precise experiment
          required to reduce uncertainty.
        </Text>
      </View>

      {/* Target PFAS Selector Chips */}
      <View style={styles.pfasSelectorRow}>
        <Text style={styles.selectorLabel}>Target PFAS:</Text>
        {(['PFOA', 'PFOS', 'GenX'] as const).map((pfas) => (
          <TouchableOpacity
            key={pfas}
            style={[styles.pfasChip, targetPfas === pfas && styles.activePfasChip]}
            onPress={() => setTargetPfas(pfas)}
          >
            <Text style={[styles.pfasChipText, targetPfas === pfas && styles.activePfasChipText]}>
              {pfas}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Loading & Error States */}
      {loading && (
        <View style={styles.centeredBlock}>
          <ActivityIndicator size="large" color="#0284C7" />
          <Text style={styles.loadingText}>Synthesizing evidence & calculating priority rankings...</Text>
        </View>
      )}

      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorTitle}>Recommendation Engine Error</Text>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Recommendations Cards */}
      {!loading && !error && recommendations.map((rec) => {
        const confBadge = getConfidenceBadgeColor(rec.confidence_assessment);

        return (
          <View key={rec.rank} style={styles.recCard}>
            {/* Header: Rank + Candidate Name + Score */}
            <View style={styles.recHeaderRow}>
              <View style={styles.rankBadge}>
                <Text style={styles.rankText}>#{rec.rank}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.candidateName}>{rec.candidate_name}</Text>
                <Text style={styles.targetSub}>Target: {rec.target_pfas}</Text>
              </View>
              <View style={styles.scoreContainer}>
                <Text style={styles.scoreVal}>{(rec.composite_score * 100).toFixed(1)}</Text>
                <Text style={styles.scoreLabel}>Score / 100</Text>
              </View>
            </View>

            {/* Confidence Assessment Badge */}
            <View style={styles.confidenceRow}>
              <View style={[styles.confidencePill, { backgroundColor: confBadge.bg }]}>
                <Text style={[styles.confidencePillText, { color: confBadge.text }]}>
                  {rec.confidence_assessment}
                </Text>
              </View>
            </View>

            {/* Defluorination Penalty Box */}
            <View style={[
              styles.penaltyBox,
              rec.defluorination_penalty_applied ? styles.penaltyActive : styles.penaltyInactive
            ]}>
              <Text style={styles.penaltyTitle}>
                {rec.defluorination_penalty_applied ? '⚠️ Defluorination Penalty Enforced' : '✓ Stoichiometric Defluorination Verified'}
              </Text>
              <Text style={styles.penaltyText}>{rec.penalty_explanation}</Text>
            </View>

            {/* Supporting Literature Evidence */}
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionBlockTitle}>Primary Experimental Evidence:</Text>
              {rec.supporting_evidence.map((ev, i) => (
                <View key={i} style={styles.evidenceItem}>
                  <Text style={styles.evidenceLine}>
                    • <Text style={{ fontWeight: '700' }}>{ev.treatment_method}</Text>: {ev.reported_parent_removal_pct}% parent removal
                    {ev.reported_defluorination_pct !== null && ev.reported_defluorination_pct !== undefined ? (
                      <Text style={{ color: '#059669', fontWeight: '700' }}> | {ev.reported_defluorination_pct}% defluorination</Text>
                    ) : (
                      <Text style={{ color: '#DC2626', fontWeight: '700' }}> | Defluorination missing</Text>
                    )}
                  </Text>
                  {ev.doi_or_url && (
                    <Text style={styles.evidenceDoi}>Citation / DOI: {ev.doi_or_url}</Text>
                  )}
                </View>
              ))}
            </View>

            {/* Molecular Mechanistic Chemistry */}
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionBlockTitle}>Molecular Mechanistic Insights (RHF SCF):</Text>
              <Text style={styles.mechanisticText}>{rec.molecular_mechanistic_insights}</Text>
            </View>

            {/* Missing Measurements */}
            {rec.missing_measurements && rec.missing_measurements.length > 0 && (
              <View style={styles.sectionBlock}>
                <Text style={styles.sectionBlockTitle}>Critical Unresolved Analytical Gaps:</Text>
                {rec.missing_measurements.map((m, idx) => (
                  <Text key={idx} style={styles.missingItemText}>❌ {m}</Text>
                ))}
              </View>
            )}

            {/* Proposed Next Experiment */}
            <View style={styles.nextExpCard}>
              <Text style={styles.nextExpTitle}>🧪 Proposed Experiment to Reduce Uncertainty:</Text>
              <Text style={styles.nextExpBody}>{rec.proposed_next_experiment}</Text>
            </View>

            {/* Conditions under which recommendation holds */}
            <View style={styles.boundaryCard}>
              <Text style={styles.boundaryTitle}>⚖️ Validity Boundary Conditions:</Text>
              <Text style={styles.boundaryBody}>{rec.conditions_under_which_recommendation_holds}</Text>
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
  contentContainer: {
    padding: 16,
    paddingBottom: 40
  },
  noticeCard: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16
  },
  noticeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6
  },
  noticeIcon: {
    fontSize: 18,
    marginRight: 8
  },
  noticeTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E40AF'
  },
  noticeBody: {
    fontSize: 12,
    color: '#3B82F6',
    lineHeight: 18
  },
  pfasSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16
  },
  selectorLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    marginRight: 10
  },
  pfasChip: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8
  },
  activePfasChip: {
    backgroundColor: '#0284C7'
  },
  pfasChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569'
  },
  activePfasChipText: {
    color: '#FFFFFF',
    fontWeight: '700'
  },
  recCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2
  },
  recHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10
  },
  rankBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#0284C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  rankText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14
  },
  candidateName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A'
  },
  targetSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2
  },
  scoreContainer: {
    alignItems: 'flex-end'
  },
  scoreVal: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0284C7'
  },
  scoreLabel: {
    fontSize: 10,
    color: '#64748B',
    textTransform: 'uppercase'
  },
  confidenceRow: {
    flexDirection: 'row',
    marginBottom: 10
  },
  confidencePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4
  },
  confidencePillText: {
    fontSize: 10,
    fontWeight: '700'
  },
  penaltyBox: {
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1
  },
  penaltyActive: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A'
  },
  penaltyInactive: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0'
  },
  penaltyTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2
  },
  penaltyText: {
    fontSize: 11,
    color: '#334155',
    lineHeight: 16
  },
  sectionBlock: {
    marginBottom: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8
  },
  sectionBlockTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    marginBottom: 4
  },
  evidenceItem: {
    marginBottom: 4
  },
  evidenceLine: {
    fontSize: 12,
    color: '#1E293B',
    lineHeight: 16
  },
  evidenceDoi: {
    fontSize: 10,
    color: '#0284C7',
    marginLeft: 10
  },
  mechanisticText: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 18
  },
  missingItemText: {
    fontSize: 11,
    color: '#DC2626',
    marginTop: 2
  },
  nextExpCard: {
    backgroundColor: '#F0F9FF',
    borderRadius: 8,
    padding: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#0284C7',
    marginTop: 8
  },
  nextExpTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0369A1',
    marginBottom: 3
  },
  nextExpBody: {
    fontSize: 12,
    color: '#0C4A6E',
    lineHeight: 16
  },
  boundaryCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#64748B',
    marginTop: 8
  },
  boundaryTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 3
  },
  boundaryBody: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 16
  },
  centeredBlock: {
    padding: 40,
    alignItems: 'center'
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: '#64748B'
  },
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderColor: '#F87171',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 14
  },
  errorTitle: {
    color: '#B91C1C',
    fontWeight: '700',
    fontSize: 13
  },
  errorText: {
    color: '#991B1B',
    fontSize: 12,
    marginTop: 2
  }
});
