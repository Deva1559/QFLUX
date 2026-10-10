import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { PrioritizationRunResponse, PrioritizationRankingItem } from '../types';
import { api } from '../services/api';

export const CatalystPrioritizationScreen: React.FC = () => {
  const [prioritizationData, setPrioritizationData] = useState<PrioritizationRunResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [running, setRunning] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<PrioritizationRankingItem | null>(null);

  // 10 Dimension weights state (default equal or scientifically tuned)
  const [weights, setWeights] = useState<Record<string, number>>({
    defluorination: 0.25,
    parent_removal: 0.10,
    byproducts: 0.15,
    reusability: 0.10,
    mechanism_evidence: 0.15,
    energy_efficiency: 0.10,
    material_cost: 0.05,
    reaction_energetics: 0.05,
    experimental_confirmation: 0.05,
    evidence_completeness: 0.05
  });

  useEffect(() => {
    loadLatestPrioritization();
  }, []);

  const loadLatestPrioritization = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getLatestPrioritization();
      setPrioritizationData(data);
      if (data.rankings && data.rankings.length > 0) {
        setSelectedCandidate(data.rankings[0]);
      }
    } catch (err: any) {
      // If none run yet, run one
      handleRunPrioritization();
    } finally {
      setLoading(false);
    }
  };

  const handleRunPrioritization = async () => {
    try {
      setRunning(true);
      setError(null);
      const res = await api.runPrioritization(undefined, weights);
      setPrioritizationData(res);
      if (res.rankings && res.rankings.length > 0) {
        setSelectedCandidate(res.rankings[0]);
      }
    } catch (err: any) {
      setError(err.message || 'Prioritization run failed');
    } finally {
      setRunning(false);
    }
  };

  const adjustWeight = (dim: string, delta: number) => {
    setWeights((prev) => {
      const current = prev[dim] || 0.1;
      const updated = Math.max(0.0, Math.min(1.0, parseFloat((current + delta).toFixed(2))));
      return { ...prev, [dim]: updated };
    });
  };

  const getStatusColor = (status?: string) => {
    if (!status) return '#64748B';
    if (status.includes('Evidence-supported')) return '#059669';
    if (status.includes('Promising')) return '#D97706';
    if (status.includes('Mechanistically')) return '#2563EB';
    if (status.includes('Insufficient')) return '#DC2626';
    return '#64748B';
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerBox}>
        <Text style={styles.title}>10-Dimension Catalyst Prioritization</Text>
        <Text style={styles.subtitle}>
          Multi-criteria decision engine balancing parent removal, measured defluorination, byproduct toxicity,
          stability, and energy intensity. Strictly penalizes candidates with missing fluoride release.
        </Text>
      </View>

      {/* Action Button */}
      <TouchableOpacity
        style={[styles.runButton, running && styles.runButtonDisabled]}
        onPress={handleRunPrioritization}
        disabled={running}
      >
        {running ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <Text style={styles.runButtonText}>⚡ Recalculate Rankings & Sensitivity Analysis</Text>
        )}
      </TouchableOpacity>

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#0284C7" />
          <Text style={styles.loadingText}>Running prioritization algorithm...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>Error: {error}</Text>
        </View>
      ) : prioritizationData ? (
        <View>
          {/* Sensitivity Analysis Summary */}
          {prioritizationData.sensitivity_analysis && (
            <View style={styles.sensitivityBox}>
              <Text style={styles.sensTitle}>📊 Robustness & Sensitivity Analysis (±20% Weight Shift)</Text>
              <Text style={styles.sensStatus}>
                Stability: <Text style={{ color: '#059669', fontWeight: '700' }}>{prioritizationData.sensitivity_analysis.ranking_stability}</Text>
              </Text>
              <Text style={styles.sensAdvice}>{prioritizationData.sensitivity_analysis.advice}</Text>
            </View>
          )}

          {/* Ranking Cards */}
          <Text style={styles.sectionHeading}>Candidate Prioritization Standings:</Text>
          {prioritizationData.rankings.map((cand) => {
            const isSelected = selectedCandidate?.catalyst_id === cand.catalyst_id;
            const statusText = cand.status || (cand as any).category || 'Evaluated';
            const statusColor = getStatusColor(statusText);
            const scoreDisplay = cand.composite_score > 1 ? cand.composite_score.toFixed(1) : (cand.composite_score * 100).toFixed(1);

            return (
              <TouchableOpacity
                key={cand.catalyst_id}
                style={[styles.rankCard, isSelected && styles.activeRankCard]}
                onPress={() => setSelectedCandidate(cand)}
              >
                <View style={styles.rankCardHeader}>
                  <View style={styles.rankBadge}>
                    <Text style={styles.rankNumber}>#{cand.rank}</Text>
                  </View>
                  <View style={styles.rankMeta}>
                    <Text style={styles.candName}>{cand.name}</Text>
                    <Text style={styles.candType}>{cand.material_type} • Target: {cand.target_pfas || 'PFOA'}</Text>
                  </View>
                  <View style={styles.scoreBox}>
                    <Text style={styles.scoreVal}>{scoreDisplay}</Text>
                    <Text style={styles.scoreLabel}>Score / 100</Text>
                  </View>
                </View>

                {/* Status Badge */}
                <View style={[styles.statusBadge, { backgroundColor: statusColor + '15', borderColor: statusColor }]}>
                  <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
                </View>

                {cand.missing_defluorination_penalty_applied && (
                  <View style={styles.penaltyAlert}>
                    <Text style={styles.penaltyText}>
                      ⚠️ Missing Defluorination Penalty Applied: Unverified fluoride release restricts ranking.
                    </Text>
                  </View>
                )}

                <Text style={styles.rationaleText}>{cand.primary_rationale || (cand as any).eval_notes?.join(' | ') || ''}</Text>
              </TouchableOpacity>
            );
          })}

          {/* Selected Candidate Detailed Dimension Breakdown */}
          {selectedCandidate && (
            <View style={styles.breakdownCard}>
              <Text style={styles.breakdownTitle}>
                Dimension Breakdown: {selectedCandidate.name}
              </Text>
              <Text style={styles.breakdownSub}>
                Scores across individual evaluation criteria (Normalized 0.0 - 1.0)
              </Text>

              <View style={styles.dimGrid}>
                {Object.entries(selectedCandidate.dimension_scores || {}).map(([dim, score]) => {
                  const pct = score > 1 ? score : score * 100;
                  const norm = score > 1 ? score / 100 : score;
                  return (
                    <View key={dim} style={styles.dimRow}>
                      <View style={styles.dimLabelBox}>
                        <Text style={styles.dimName}>{dim.replace(/_/g, ' ')}</Text>
                        <Text style={styles.dimScoreVal}>{pct.toFixed(0)}%</Text>
                      </View>
                      <View style={styles.dimBarBg}>
                        <View
                          style={[
                            styles.dimBarFill,
                            { width: `${Math.min(100, Math.max(0, pct))}%` },
                            norm < 0.4 ? { backgroundColor: '#DC2626' } : norm > 0.75 ? { backgroundColor: '#059669' } : { backgroundColor: '#0284C7' }
                          ]}
                        />
                      </View>
                    </View>
                  );
                })}
              </View>

              <View style={styles.dimLimitationsBox}>
                <Text style={styles.dimLimTitle}>Key Bottlenecks & Limitations:</Text>
                <Text style={styles.dimLimText}>{selectedCandidate.limitations || (selectedCandidate as any).eval_notes?.join(' | ') || 'No major limitations documented.'}</Text>
              </View>
            </View>
          )}

          {/* Interactive Weight Controls */}
          <View style={styles.weightsBox}>
            <Text style={styles.weightsTitle}>⚙️ Multi-Criteria Dimension Weights</Text>
            <Text style={styles.weightsSub}>Adjust weights to test decision sensitivity:</Text>

            {Object.entries(weights).map(([dim, w]) => (
              <View key={dim} style={styles.weightRow}>
                <Text style={styles.weightName}>{dim.replace(/_/g, ' ')}</Text>
                <View style={styles.weightControls}>
                  <TouchableOpacity
                    style={styles.weightBtn}
                    onPress={() => adjustWeight(dim, -0.05)}
                  >
                    <Text style={styles.weightBtnText}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.weightVal}>{(w * 100).toFixed(0)}%</Text>
                  <TouchableOpacity
                    style={styles.weightBtn}
                    onPress={() => adjustWeight(dim, 0.05)}
                  >
                    <Text style={styles.weightBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        </View>
      ) : null}
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
  headerBox: {
    marginBottom: 14,
    padding: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderLeftWidth: 4,
    borderLeftColor: '#0284C7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4
  },
  subtitle: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 18
  },
  runButton: {
    backgroundColor: '#0284C7',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2
  },
  runButtonDisabled: {
    opacity: 0.6
  },
  runButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13
  },
  centerBox: {
    padding: 32,
    alignItems: 'center'
  },
  loadingText: {
    color: '#64748B',
    marginTop: 8
  },
  errorBox: {
    padding: 14,
    backgroundColor: '#FEF2F2',
    borderColor: '#F87171',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 14
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13
  },
  sensitivityBox: {
    backgroundColor: '#F0F9FF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#BAE6FD'
  },
  sensTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284C7',
    marginBottom: 4
  },
  sensStatus: {
    fontSize: 12,
    color: '#0F172A',
    marginBottom: 2
  },
  sensAdvice: {
    fontSize: 11,
    color: '#334155',
    lineHeight: 16
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8
  },
  rankCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1
  },
  activeRankCard: {
    borderColor: '#0284C7',
    backgroundColor: '#F0F9FF'
  },
  rankCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  rankBadge: {
    backgroundColor: '#F0F9FF',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#BAE6FD'
  },
  rankNumber: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0284C7'
  },
  rankMeta: {
    flex: 1
  },
  candName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A'
  },
  candType: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1
  },
  scoreBox: {
    alignItems: 'flex-end'
  },
  scoreVal: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0284C7'
  },
  scoreLabel: {
    fontSize: 9,
    color: '#64748B'
  },
  statusBadge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 4,
    paddingVertical: 2,
    paddingHorizontal: 6,
    marginBottom: 6
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700'
  },
  penaltyAlert: {
    backgroundColor: '#FEF2F2',
    borderRadius: 4,
    padding: 6,
    marginBottom: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#EF4444'
  },
  penaltyText: {
    fontSize: 10,
    color: '#991B1B',
    lineHeight: 14
  },
  rationaleText: {
    fontSize: 11,
    color: '#475569',
    lineHeight: 16
  },
  breakdownCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 14,
    marginTop: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1
  },
  breakdownTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A'
  },
  breakdownSub: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 12
  },
  dimGrid: {
    marginBottom: 10
  },
  dimRow: {
    marginBottom: 8
  },
  dimLabelBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3
  },
  dimName: {
    fontSize: 11,
    color: '#334155',
    textTransform: 'capitalize'
  },
  dimScoreVal: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F172A'
  },
  dimBarBg: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden'
  },
  dimBarFill: {
    height: '100%',
    borderRadius: 3
  },
  dimLimitationsBox: {
    backgroundColor: '#FFFBEB',
    padding: 10,
    borderRadius: 6,
    marginTop: 6
  },
  dimLimTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 2
  },
  dimLimText: {
    fontSize: 11,
    color: '#78350F',
    lineHeight: 15
  },
  weightsBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1
  },
  weightsTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A'
  },
  weightsSub: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 10
  },
  weightRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
  },
  weightName: {
    fontSize: 11,
    color: '#334155',
    textTransform: 'capitalize',
    flex: 1
  },
  weightControls: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  weightBtn: {
    backgroundColor: '#F1F5F9',
    width: 24,
    height: 24,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1'
  },
  weightBtnText: {
    color: '#0284C7',
    fontWeight: '700',
    fontSize: 14
  },
  weightVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    marginHorizontal: 8,
    width: 32,
    textAlign: 'center'
  }
});
