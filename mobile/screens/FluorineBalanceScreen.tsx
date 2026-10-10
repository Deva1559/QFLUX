import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert
} from 'react-native';
import { FluorineBalanceCalculateResponse } from '../types';
import { WarningBanner } from '../components/WarningBanner';
import { api } from '../services/api';

interface FluorineBalanceScreenProps {
  activeProjectId?: number;
  onRefresh: () => void;
}

export const FluorineBalanceScreen: React.FC<FluorineBalanceScreenProps> = ({
  activeProjectId,
  onRefresh
}) => {
  const [initialInv, setInitialInv] = useState('100.0');
  const [units, setUnits] = useState('mg/L');
  const [inorganicF, setInorganicF] = useState('13.0');
  const [organicF, setOrganicF] = useState('87.0');
  const [otherF, setOtherF] = useState('0.0');
  const [scenarioName, setScenarioName] = useState('Custom Fluorine Mass Balance');
  
  const [result, setResult] = useState<FluorineBalanceCalculateResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const loadSmithPreset = () => {
    setInitialInv('100.0');
    setUnits('mg/L');
    setInorganicF('13.0');
    setOrganicF('87.0');
    setOtherF('0.0');
    setScenarioName('Smith et al. (2024) Literature Benchmark');
  };

  const loadDeficitPreset = () => {
    setInitialInv('100.0');
    setUnits('mg/L');
    setInorganicF('35.0');
    setOrganicF('25.0');
    setOtherF('5.0');
    setScenarioName('Unaccounted Fluorine Deficit Study');
  };

  const handleCalculate = async (saveScenario = false) => {
    const initVal = parseFloat(initialInv);
    if (isNaN(initVal) || initVal <= 0) {
      Alert.alert('Validation Error', 'Initial fluorine inventory must be strictly greater than zero.');
      return;
    }

    setLoading(true);
    try {
      const calcData = {
        initial_fluorine_inventory: initVal,
        inventory_basis_units: units,
        measured_inorganic_fluoride: inorganicF !== '' ? parseFloat(inorganicF) : undefined,
        remaining_organic_fluorine: organicF !== '' ? parseFloat(organicF) : undefined,
        other_identified_fluorine: otherF !== '' ? parseFloat(otherF) : 0.0
      };

      const res = await api.calculateFluorineBalance(calcData);
      setResult(res);

      if (saveScenario) {
        await api.createFluorineScenario({
          ...calcData,
          project_id: activeProjectId,
          scenario_name: scenarioName || 'Fluorine Mass Balance Scenario',
          data_source_category: 'User-entered calculation'
        });
        Alert.alert('Scenario Saved', 'Fluorine mass balance scenario persisted to local SQLite database.');
        onRefresh();
      }
    } catch (e: any) {
      Alert.alert('Calculation Error', e.message || 'Failed to calculate fluorine balance');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.sectionHeader}>FLUORINE MASS-BALANCE CALCULATOR</Text>

      {/* Preset Buttons */}
      <View style={styles.presetRow}>
        <TouchableOpacity style={styles.presetBtn} onPress={loadSmithPreset}>
          <Text style={styles.presetBtnText}>📖 Load Smith et al. (2024) Benchmark</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.presetBtn} onPress={loadDeficitPreset}>
          <Text style={styles.presetBtnText}>⚠️ Load 35% Deficit Scenario</Text>
        </TouchableOpacity>
      </View>

      {/* Inputs Form */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>FLUORINE INVENTORY INPUTS</Text>

        <Text style={styles.inputLabel}>Scenario Title</Text>
        <TextInput
          style={styles.input}
          value={scenarioName}
          onChangeText={setScenarioName}
          placeholder="e.g., UV-Sulfite Trial Run #03"
          placeholderTextColor="#64748B"
        />

        <View style={styles.row}>
          <View style={{ flex: 2, marginRight: 6 }}>
            <Text style={styles.inputLabel}>Initial Fluorine Inventory *</Text>
            <TextInput
              style={styles.input}
              value={initialInv}
              onChangeText={setInitialInv}
              keyboardType="numeric"
            />
          </View>
          <View style={{ flex: 1, marginLeft: 6 }}>
            <Text style={styles.inputLabel}>Basis Units</Text>
            <TextInput
              style={styles.input}
              value={units}
              onChangeText={setUnits}
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={{ flex: 1, marginRight: 6 }}>
            <Text style={styles.inputLabel}>Measured Free Fluoride (F-)</Text>
            <TextInput
              style={styles.input}
              value={inorganicF}
              onChangeText={setInorganicF}
              keyboardType="numeric"
              placeholder="Leave blank if unmeasured"
              placeholderTextColor="#64748B"
            />
          </View>
          <View style={{ flex: 1, marginLeft: 6 }}>
            <Text style={styles.inputLabel}>Measured Organofluorine</Text>
            <TextInput
              style={styles.input}
              value={organicF}
              onChangeText={setOrganicF}
              keyboardType="numeric"
              placeholder="Leave blank if unmeasured"
              placeholderTextColor="#64748B"
            />
          </View>
        </View>

        <Text style={styles.inputLabel}>Other Identified Fluorine Species (optional)</Text>
        <TextInput
          style={styles.input}
          value={otherF}
          onChangeText={setOtherF}
          keyboardType="numeric"
          placeholder="0.0"
          placeholderTextColor="#64748B"
        />

        <View style={styles.btnRow}>
          <TouchableOpacity
            style={[styles.calcBtn, loading && { opacity: 0.7 }]}
            onPress={() => handleCalculate(false)}
            disabled={loading}
          >
            <Text style={styles.calcBtnText}>⚡ Calculate Balance</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.saveBtn, loading && { opacity: 0.7 }]}
            onPress={() => handleCalculate(true)}
            disabled={loading}
          >
            <Text style={styles.saveBtnText}>💾 Save to SQLite</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Calculated Results */}
      {result && (
        <View style={styles.resultCard}>
          <View style={styles.resultHeaderRow}>
            <Text style={styles.resultTitle}>ACCOUNTING BREAKDOWN</Text>
            <View
              style={[
                styles.closureBadge,
                result.closure_status?.includes('Acceptable')
                  ? styles.badgeGood
                  : styles.badgeWarning
              ]}
            >
              <Text style={styles.closureBadgeText}>{result.closure_status}</Text>
            </View>
          </View>

          {/* Metric Outputs Triplet */}
          <View style={styles.metricsRow}>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Apparent Defluorination</Text>
              <Text style={[styles.metricVal, { color: '#F59E0B' }]}>
                {result.apparent_defluorination_pct !== null && result.apparent_defluorination_pct !== undefined
                  ? `${result.apparent_defluorination_pct.toFixed(1)}%`
                  : 'N/A'}
              </Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Remaining Organic F</Text>
              <Text style={styles.metricVal}>
                {result.remaining_organic_pct !== null && result.remaining_organic_pct !== undefined
                  ? `${result.remaining_organic_pct.toFixed(1)}%`
                  : 'N/A'}
              </Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Total Mass Closure</Text>
              <Text
                style={[
                  styles.metricVal,
                  {
                    color:
                      result.mass_balance_closure_pct &&
                      result.mass_balance_closure_pct >= 90 &&
                      result.mass_balance_closure_pct <= 105
                        ? '#10B981'
                        : '#EF4444'
                  }
                ]}
              >
                {result.mass_balance_closure_pct !== null && result.mass_balance_closure_pct !== undefined
                  ? `${result.mass_balance_closure_pct.toFixed(1)}%`
                  : 'Incomplete'}
              </Text>
            </View>
          </View>

          {/* Graphical Partition Bar */}
          <Text style={styles.partitionLabel}>Fluorine Inventory Partitioning:</Text>
          <View style={styles.partitionBar}>
            <View
              style={[
                styles.barSegment,
                {
                  flex: Math.max(1, result.chart_data.percentages[0]),
                  backgroundColor: '#F59E0B'
                }
              ]}
            />
            <View
              style={[
                styles.barSegment,
                {
                  flex: Math.max(1, result.chart_data.percentages[1]),
                  backgroundColor: '#0284C7'
                }
              ]}
            />
            <View
              style={[
                styles.barSegment,
                {
                  flex: Math.max(1, result.chart_data.percentages[3]),
                  backgroundColor: '#DC2626'
                }
              ]}
            />
          </View>

          <View style={styles.legendRow}>
            <Text style={styles.legendText}>🟨 Defluorinated F⁻ ({result.chart_data.percentages[0].toFixed(0)}%)</Text>
            <Text style={styles.legendText}>🟦 Organic F ({result.chart_data.percentages[1].toFixed(0)}%)</Text>
            <Text style={styles.legendText}>🟥 Unaccounted ({result.chart_data.percentages[3].toFixed(0)}%)</Text>
          </View>

          {/* Uncertainty Warnings */}
          {result.uncertainty_flags.length > 0 && (
            <View style={styles.flagContainer}>
              <Text style={styles.flagHeader}>Uncertainty & Quality Flags:</Text>
              {result.uncertainty_flags.map((flag, idx) => (
                <Text key={idx} style={styles.flagItem}>
                  • {flag}
                </Text>
              ))}
            </View>
          )}

          {/* Scientific Interpretation */}
          <Text style={styles.interpHeader}>Scientific Context & Caveats:</Text>
          <Text style={styles.interpText}>{result.scientific_interpretation}</Text>
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
  sectionHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 0.8,
    marginBottom: 8
  },
  presetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10
  },
  presetBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    marginRight: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 1,
    elevation: 1
  },
  presetBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0284C7',
    textAlign: 'center'
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0284C7',
    letterSpacing: 0.6,
    marginBottom: 8
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 3
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    color: '#0F172A',
    fontSize: 12,
    marginBottom: 8
  },
  row: {
    flexDirection: 'row'
  },
  btnRow: {
    flexDirection: 'row',
    marginTop: 6
  },
  calcBtn: {
    flex: 1,
    backgroundColor: '#0284C7',
    paddingVertical: 9,
    borderRadius: 6,
    alignItems: 'center',
    marginRight: 4,
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2
  },
  calcBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12
  },
  saveBtn: {
    flex: 1,
    backgroundColor: '#10B981',
    paddingVertical: 9,
    borderRadius: 6,
    alignItems: 'center',
    marginLeft: 4,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12
  },
  resultCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    padding: 14,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1
  },
  resultHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  resultTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 0.6
  },
  closureBadge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 12
  },
  badgeGood: {
    backgroundColor: '#DCFCE7'
  },
  badgeWarning: {
    backgroundColor: '#FEF3C7'
  },
  closureBadgeText: {
    color: '#166534',
    fontSize: 10,
    fontWeight: '700'
  },
  metricsRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
    padding: 10,
    marginBottom: 12
  },
  metricItem: {
    flex: 1,
    alignItems: 'center'
  },
  metricLabel: {
    fontSize: 9,
    color: '#64748B',
    fontWeight: '700',
    textAlign: 'center'
  },
  metricVal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2
  },
  partitionLabel: {
    fontSize: 10,
    color: '#475569',
    fontWeight: '700',
    marginBottom: 4
  },
  partitionBar: {
    flexDirection: 'row',
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: '#E2E8F0',
    marginBottom: 6
  },
  barSegment: {
    height: '100%'
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10
  },
  legendText: {
    fontSize: 9,
    color: '#475569',
    fontWeight: '500'
  },
  flagContainer: {
    backgroundColor: '#FEF3C7',
    padding: 8,
    borderRadius: 6,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B'
  },
  flagHeader: {
    fontSize: 10,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 2
  },
  flagItem: {
    fontSize: 10,
    color: '#78350F',
    lineHeight: 14
  },
  interpHeader: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
    marginTop: 4,
    marginBottom: 2
  },
  interpText: {
    fontSize: 10,
    color: '#334155',
    lineHeight: 14
  }
});
