import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert
} from 'react-native';
import { QuantumBenchmarkResponse } from '../types';
import { WarningBanner } from '../components/WarningBanner';
import { api } from '../services/api';

interface QuantumLabScreenProps {
  activeProjectId?: number;
  latestRun: QuantumBenchmarkResponse | null;
  onBenchmarkComplete: (res: QuantumBenchmarkResponse) => void;
}

export const QuantumLabScreen: React.FC<QuantumLabScreenProps> = ({
  activeProjectId,
  latestRun,
  onBenchmarkComplete
}) => {
  const [modelType, setModelType] = useState<'Reduced C-F Active Space' | 'Pedagogical Toy Benchmark'>('Reduced C-F Active Space');
  const [optimizer, setOptimizer] = useState<'Nelder-Mead' | 'COBYLA' | 'BFGS'>('Nelder-Mead');
  const [maxIter, setMaxIter] = useState('2500');
  const [seed, setSeed] = useState('42');
  const [coeffZ0, setCoeffZ0] = useState('-1.05');
  const [coeffZ1, setCoeffZ1] = useState('-0.75');
  const [coeffXX, setCoeffXX] = useState('0.35');
  const [coeffZZ, setCoeffZZ] = useState('0.20');
  const [loading, setLoading] = useState(false);

  const handleRun = async () => {
    setLoading(true);
    try {
      const res = await api.runQuantumBenchmark({
        project_id: activeProjectId,
        run_name: `${modelType} (${optimizer})`,
        model_type: modelType,
        optimizer,
        max_iter: parseInt(maxIter, 10) || 2500,
        tolerance: 1e-8,
        random_seed: seed ? parseInt(seed, 10) : undefined,
        coeff_z0: parseFloat(coeffZ0) || -1.05,
        coeff_z1: parseFloat(coeffZ1) || -0.75,
        coeff_xx: parseFloat(coeffXX) || 0.35,
        coeff_zz: parseFloat(coeffZZ) || 0.20
      });
      onBenchmarkComplete(res);
    } catch (e: any) {
      Alert.alert('Computation Error', e.message || 'Quantum benchmark execution failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.sectionHeader}>HYBRID QUANTUM-CLASSICAL BENCHMARK ENGINE</Text>

      {/* Dynamic Scientific Disclaimer Banner */}
      <WarningBanner
        type={modelType === 'Reduced C-F Active Space' ? 'warning' : 'critical'}
        title={modelType === 'Reduced C-F Active Space' ? 'REDUCED MOLECULAR ACTIVE-SPACE HAMILTONIAN' : 'MANDATORY SCIENTIFIC GOVERNANCE RESTRICTION'}
        message={
          modelType === 'Reduced C-F Active Space'
            ? 'Reduced C-F Active Space: 2-orbital / 2-qubit Jordan-Wigner mapped model of terminal C-F bond sigma/sigma* orbitals. Demonstrates exact solver agreement for reduced model. Does NOT include catalyst surface adsorption or solvent polarization.'
            : 'Toy Hamiltonian benchmark: demonstrates quantum-algorithm workflow only. Does NOT predict PFAS reaction chemistry, activation barriers, or commercial performance.'
        }
      />

      {/* Model Selection */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>SELECT QUANTUM PROBLEM FORMULATION</Text>
        <View style={styles.optRow}>
          <TouchableOpacity
            style={[styles.optButton, modelType === 'Reduced C-F Active Space' && styles.activeOptButton, { flex: 1.2 }]}
            onPress={() => setModelType('Reduced C-F Active Space')}
          >
            <Text style={[styles.optText, modelType === 'Reduced C-F Active Space' && styles.activeOptText]}>
              ⚛️ Reduced C-F Bond (Molecular)
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.optButton, modelType === 'Pedagogical Toy Benchmark' && styles.activeOptButton, { flex: 1 }]}
            onPress={() => setModelType('Pedagogical Toy Benchmark')}
          >
            <Text style={[styles.optText, modelType === 'Pedagogical Toy Benchmark' && styles.activeOptText]}>
              🛠️ Toy Matrix
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.explanationText}>
          {modelType === 'Reduced C-F Active Space'
            ? '• Active Space: 2 electrons in 2 orbitals (C-F sigma/sigma*)\n• Mapping: Jordan-Wigner transformation to 2 qubits\n• Hamiltonian: H_CF = -1.825(II) - 0.680(Z0) - 0.440(Z1) + 0.220(Z0Z1) + 0.185(X0X1) + 0.185(Y0Y1)'
            : '• Mathematical Test Model: 2-qubit parametric test matrix\n• Hamiltonian: H_toy = c_z0(Z0) + c_z1(Z1) + c_xx(XX) + c_zz(ZZ)'}
        </Text>
      </View>

      {/* Benchmark Parameters Form */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>EXECUTION CONFIGURATION</Text>

        <Text style={styles.inputLabel}>Classical Optimizer</Text>
        <View style={styles.optRow}>
          {(['Nelder-Mead', 'COBYLA', 'BFGS'] as const).map((opt) => (
            <TouchableOpacity
              key={opt}
              style={[styles.optButton, optimizer === opt && styles.activeOptButton]}
              onPress={() => setOptimizer(opt)}
            >
              <Text style={[styles.optText, optimizer === opt && styles.activeOptText]}>
                {opt}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.row}>
          <View style={{ flex: 1, marginRight: 6 }}>
            <Text style={styles.inputLabel}>Max Iterations</Text>
            <TextInput
              style={styles.input}
              value={maxIter}
              onChangeText={setMaxIter}
              keyboardType="numeric"
            />
          </View>
          <View style={{ flex: 1, marginLeft: 6 }}>
            <Text style={styles.inputLabel}>Reproducibility Seed</Text>
            <TextInput
              style={styles.input}
              value={seed}
              onChangeText={setSeed}
              keyboardType="numeric"
            />
          </View>
        </View>

        {modelType === 'Pedagogical Toy Benchmark' && (
          <>
            <Text style={styles.inputLabel}>Toy Coefficients</Text>
            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 3 }}>
                <Text style={styles.microLabel}>Z0</Text>
                <TextInput style={styles.input} value={coeffZ0} onChangeText={setCoeffZ0} />
              </View>
              <View style={{ flex: 1, marginHorizontal: 3 }}>
                <Text style={styles.microLabel}>Z1</Text>
                <TextInput style={styles.input} value={coeffZ1} onChangeText={setCoeffZ1} />
              </View>
              <View style={{ flex: 1, marginHorizontal: 3 }}>
                <Text style={styles.microLabel}>XX</Text>
                <TextInput style={styles.input} value={coeffXX} onChangeText={setCoeffXX} />
              </View>
              <View style={{ flex: 1, marginLeft: 3 }}>
                <Text style={styles.microLabel}>ZZ</Text>
                <TextInput style={styles.input} value={coeffZZ} onChangeText={setCoeffZZ} />
              </View>
            </View>
          </>
        )}

        <TouchableOpacity
          style={[styles.runButton, loading && { opacity: 0.7 }]}
          onPress={handleRun}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.runButtonText}>⚡ Execute VQE vs Exact Benchmark</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Benchmark Results Display */}
      {latestRun && (
        <View style={styles.resultsCard}>
          <View style={styles.resultsHeaderRow}>
            <Text style={styles.resultsTitle}>BENCHMARK EXECUTION RESULTS</Text>
            <View style={styles.badgeSuccess}>
              <Text style={styles.badgeSuccessText}>
                {latestRun.optimizer_converged ? 'CONVERGED' : 'DID NOT CONVERGE'}
              </Text>
            </View>
          </View>

          <View style={styles.resultRow}>
            <Text style={styles.resLabel}>Exact Diagonalization Energy</Text>
            <Text style={styles.resValue}>{latestRun.exact_energy.toFixed(8)} a.u.</Text>
          </View>

          <View style={styles.resultRow}>
            <Text style={styles.resLabel}>VQE Estimated Energy</Text>
            <Text style={styles.resValue}>{latestRun.vqe_energy.toFixed(8)} a.u.</Text>
          </View>

          <View style={[styles.resultRow, styles.highlightRow]}>
            <Text style={[styles.resLabel, { color: '#0284C7', fontWeight: '700' }]}>
              Absolute Energy Error (|ΔE|)
            </Text>
            <Text style={[styles.resValue, { color: '#0284C7', fontWeight: '800' }]}>
              {latestRun.absolute_error.toExponential(4)} a.u.
            </Text>
          </View>

          <View style={styles.resultRow}>
            <Text style={styles.resLabel}>Optimizer Iterations / Evals</Text>
            <Text style={styles.resValue}>
              {latestRun.iterations} iters ({latestRun.function_evaluations} evals)
            </Text>
          </View>

          <View style={styles.resultRow}>
            <Text style={styles.resLabel}>Execution Latency</Text>
            <Text style={styles.resValue}>{latestRun.execution_time_ms.toFixed(2)} ms</Text>
          </View>

          {/* Optimal Parameters Vector */}
          <Text style={styles.paramLabel}>Optimal Circuit Parameters [θ1, θ2, θ3, θ4]:</Text>
          <View style={styles.codeBlock}>
            <Text style={styles.codeBlockText}>
              [{latestRun.optimal_parameters.map((p) => p.toFixed(4)).join(', ')}]
            </Text>
          </View>

          {/* Extension Point Notice */}
          <View style={styles.extensionBox}>
            <Text style={styles.extensionTitle}>Future Research Extension Point:</Text>
            <Text style={styles.extensionText}>{latestRun.extension_note}</Text>
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
  sectionHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 0.8,
    marginBottom: 8
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
  formulaText: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#0F172A',
    backgroundColor: '#F1F5F9',
    padding: 8,
    borderRadius: 6,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  explanationText: {
    fontSize: 11,
    color: '#475569',
    lineHeight: 16
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 4
  },
  microLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 2
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
  optRow: {
    flexDirection: 'row',
    marginBottom: 10
  },
  optButton: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    marginRight: 4
  },
  activeOptButton: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7'
  },
  optText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600'
  },
  activeOptText: {
    color: '#FFFFFF',
    fontWeight: '700'
  },
  row: {
    flexDirection: 'row'
  },
  runButton: {
    backgroundColor: '#0284C7',
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 6,
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2
  },
  runButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13
  },
  resultsCard: {
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
  resultsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  resultsTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 0.6
  },
  badgeSuccess: {
    backgroundColor: '#DCFCE7',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 12
  },
  badgeSuccessText: {
    color: '#166534',
    fontSize: 10,
    fontWeight: '700'
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0'
  },
  highlightRow: {
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 8,
    borderRadius: 4,
    marginVertical: 4
  },
  resLabel: {
    fontSize: 11,
    color: '#475569'
  },
  resValue: {
    fontSize: 12,
    fontFamily: 'monospace',
    fontWeight: '700',
    color: '#0F172A'
  },
  paramLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
    marginTop: 10,
    marginBottom: 4
  },
  codeBlock: {
    backgroundColor: '#F8FAFC',
    padding: 8,
    borderRadius: 6,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  codeBlockText: {
    fontFamily: 'monospace',
    color: '#047857',
    fontSize: 11
  },
  extensionBox: {
    backgroundColor: '#F0F9FF',
    borderColor: '#BAE6FD',
    borderWidth: 1,
    borderRadius: 6,
    padding: 8,
    marginTop: 4
  },
  extensionTitle: {
    color: '#0284C7',
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 2
  },
  extensionText: {
    color: '#0369A1',
    fontSize: 10,
    lineHeight: 14
  }
});
