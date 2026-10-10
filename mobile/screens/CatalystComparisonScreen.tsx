import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { Catalyst, CatalystComparisonResponse } from '../types';
import { api } from '../services/api';

export const CatalystComparisonScreen: React.FC = () => {
  const [allCatalysts, setAllCatalysts] = useState<Catalyst[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([1, 2]); // default to ZVI and In2O3
  const [comparisonData, setComparisonData] = useState<CatalystComparisonResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [comparing, setComparing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCatalysts();
  }, []);

  const loadCatalysts = async () => {
    try {
      setLoading(true);
      setError(null);
      const list = await api.getCatalysts();
      setAllCatalysts(list);
      if (list.length >= 2) {
        runComparison([list[0].id, list[1].id]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load catalysts');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (id: number) => {
    let next: number[];
    if (selectedIds.includes(id)) {
      if (selectedIds.length <= 1) return; // Keep at least one
      next = selectedIds.filter((x) => x !== id);
    } else {
      next = [...selectedIds, id];
    }
    setSelectedIds(next);
    runComparison(next);
  };

  const runComparison = async (ids: number[]) => {
    try {
      setComparing(true);
      const res = await api.compareCatalysts(ids);
      setComparisonData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to compare candidates');
    } finally {
      setComparing(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerBox}>
        <Text style={styles.title}>Cross-System Catalyst Comparison</Text>
        <Text style={styles.subtitle}>
          Compare candidates across distinct chemical paradigms. Note: Photocatalytic, electrochemical,
          and reductive iron systems operate under radically different reaction conditions and must not be
          conflated without condition normalization.
        </Text>
      </View>

      {/* Candidate Selector Badges */}
      <Text style={styles.sectionHeading}>Select Candidates to Compare:</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectorScroll}>
        {allCatalysts.map((c) => {
          const isSelected = selectedIds.includes(c.id);
          return (
            <TouchableOpacity
              key={c.id}
              style={[styles.selectorChip, isSelected && styles.activeSelectorChip]}
              onPress={() => toggleSelect(c.id)}
            >
              <Text style={[styles.selectorText, isSelected && styles.activeSelectorText]}>
                {isSelected ? '✓ ' : '+ '}{c.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#0284C7" />
          <Text style={styles.loadingText}>Loading catalyst catalogue...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>Error: {error}</Text>
        </View>
      ) : !comparisonData ? (
        <View style={styles.centerBox}>
          <Text style={styles.emptyText}>Select candidates to view comparison</Text>
        </View>
      ) : (
        <View>
          {/* Scientific Tradeoff Callout */}
          <View style={styles.tradeoffBox}>
            <Text style={styles.tradeoffTitle}>🔬 Scientific Trade-off Analysis</Text>
            <Text style={styles.tradeoffText}>{comparisonData.tradeoff_summary}</Text>
          </View>

          {/* Side-by-Side Comparison Matrix */}
          <Text style={styles.sectionHeading}>Side-by-Side Specification Matrix:</Text>
          <View style={styles.matrixContainer}>
            {(comparisonData.comparison_table || []).map((row, idx) => {
              if (!row) return null;
              return (
                <View key={idx} style={[styles.matrixRow, idx % 2 === 1 && styles.matrixRowAlt]}>
                  <View style={styles.matrixColLabel}>
                    <Text style={styles.matrixLabelText}>{row.property || 'Specification'}</Text>
                    {row.description ? <Text style={styles.matrixDescText}>{row.description}</Text> : null}
                  </View>
                  <View style={styles.matrixColValues}>
                    {comparisonData.catalysts.map((cat) => {
                      const val = row.values ? row.values[cat.name] : (row as any)?.[cat.name];
                      const isMissing = val === null || val === undefined || val === 'MISSING' || val === 'Not reported' || val === 'NOT REPORTED';
                      const isHighVal = typeof val === 'number' && val > 80;

                      return (
                        <View key={cat.id} style={styles.matrixValBox}>
                          <Text style={styles.catHeaderSmall}>{cat.name}</Text>
                          <Text
                            style={[
                              styles.matrixValText,
                              isMissing && styles.missingValText,
                              isHighVal && styles.highValText
                            ]}
                          >
                            {val !== null && val !== undefined ? String(val) : 'MISSING'}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      )}
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
    marginBottom: 16,
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
  sectionHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
    marginTop: 6
  },
  selectorScroll: {
    marginBottom: 16
  },
  selectorChip: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 1,
    elevation: 1
  },
  activeSelectorChip: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7'
  },
  selectorText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600'
  },
  activeSelectorText: {
    color: '#FFFFFF',
    fontWeight: '700'
  },
  centerBox: {
    padding: 32,
    alignItems: 'center'
  },
  loadingText: {
    color: '#64748B',
    marginTop: 8
  },
  emptyText: {
    color: '#64748B'
  },
  errorBox: {
    padding: 14,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#F87171',
    borderRadius: 8,
    marginBottom: 12
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13
  },
  tradeoffBox: {
    backgroundColor: '#F0F9FF',
    borderRadius: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    marginBottom: 16
  },
  tradeoffTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0284C7',
    marginBottom: 6
  },
  tradeoffText: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 18
  },
  matrixContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1
  },
  matrixRow: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0'
  },
  matrixRowAlt: {
    backgroundColor: '#F8FAFC'
  },
  matrixColLabel: {
    marginBottom: 8
  },
  matrixLabelText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A'
  },
  matrixDescText: {
    fontSize: 10,
    color: '#64748B'
  },
  matrixColValues: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  matrixValBox: {
    flex: 1,
    minWidth: 120,
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
    padding: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  catHeaderSmall: {
    fontSize: 10,
    color: '#0284C7',
    fontWeight: '600',
    marginBottom: 2
  },
  matrixValText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B'
  },
  missingValText: {
    color: '#DC2626',
    fontWeight: '700'
  },
  highValText: {
    color: '#059669',
    fontWeight: '700'
  }
});
