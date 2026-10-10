import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { MolecularModel, ClassicalChemistryRunResponse } from '../types';
import { api } from '../services/api';

export const MolecularChemistryScreen: React.FC = () => {
  const [models, setModels] = useState<MolecularModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<MolecularModel | null>(null);
  const [calcResult, setCalcResult] = useState<ClassicalChemistryRunResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [calculating, setCalculating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getMolecularModels();
      setModels(data);
      if (data.length > 0) {
        setSelectedModel(data[0]);
        // Also load past runs if any
        const runs = await api.getClassicalChemistryRuns(data[0].id);
        if (runs.length > 0) {
          setCalcResult(runs[0]);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load molecular models');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectModel = async (model: MolecularModel) => {
    setSelectedModel(model);
    setCalcResult(null);
    try {
      const runs = await api.getClassicalChemistryRuns(model.id);
      if (runs.length > 0) {
        setCalcResult(runs[0]);
      }
    } catch (_) {}
  };

  const handleRunCalculation = async () => {
    if (!selectedModel) return;
    try {
      setCalculating(true);
      setError(null);
      const result = await api.runClassicalChemistry({
        model_id: selectedModel.id,
        run_name: `${selectedModel.name} RHF SCF Calculation`,
        basis_set: 'STO-3G',
        compute_reaction_energy: true
      });
      setCalcResult(result);
    } catch (err: any) {
      setError(err.message || 'Calculation failed');
    } finally {
      setCalculating(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerBox}>
        <Text style={styles.title}>PFAS Classical Electronic Structure</Text>
        <Text style={styles.subtitle}>
          Real molecular electronic-structure calculation for chemically justified PFAS fragments.
          Evaluates Cartesian geometry, nuclear repulsion, RHF/STO-3G SCF ground-state energy, orbital eigenvalues,
          and elementary reaction energy ΔE_rxn.
        </Text>
      </View>

      {/* Model Selection Tabs */}
      <Text style={styles.sectionHeading}>Select Chemically Justified Molecular Model:</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.modelScroll}>
        {models.map((m) => {
          const isSelected = selectedModel?.id === m.id;
          return (
            <TouchableOpacity
              key={m.id}
              style={[styles.modelCard, isSelected && styles.activeModelCard]}
              onPress={() => handleSelectModel(m)}
            >
              <Text style={[styles.modelCardTitle, isSelected && styles.activeModelText]}>
                {m.name}
              </Text>
              <Text style={styles.modelFormula}>{m.chemical_formula}</Text>
              <Text style={styles.modelMeta}>
                {m.num_atoms} Atoms • {m.num_electrons} e⁻ • Charge: {m.charge}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#0284C7" />
          <Text style={styles.loadingText}>Loading molecular models...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>Error: {error}</Text>
        </View>
      ) : selectedModel ? (
        <View>
          {/* Model Specification Card */}
          <View style={styles.specCard}>
            <Text style={styles.specTitle}>System Definition: {selectedModel.name}</Text>
            <Text style={styles.specScope}>{selectedModel.model_scope_description}</Text>

            <View style={styles.specGrid}>
              <View style={styles.specItem}>
                <Text style={styles.specLabel}>Basis Set</Text>
                <Text style={styles.specVal}>{selectedModel.basis_set}</Text>
              </View>
              <View style={styles.specItem}>
                <Text style={styles.specLabel}>Charge / Spin</Text>
                <Text style={styles.specVal}>q = {selectedModel.charge}, 2S+1 = {selectedModel.spin_multiplicity}</Text>
              </View>
              <View style={styles.specItem}>
                <Text style={styles.specLabel}>Electrons</Text>
                <Text style={styles.specVal}>{selectedModel.num_electrons} e⁻</Text>
              </View>
              <View style={styles.specItem}>
                <Text style={styles.specLabel}>Nuclear Atoms</Text>
                <Text style={styles.specVal}>{selectedModel.num_atoms}</Text>
              </View>
            </View>

            {/* Geometry Preview */}
            <Text style={styles.codeHeader}>Cartesian Coordinates (XYZ Å):</Text>
            <View style={styles.codeBox}>
              <Text style={styles.codeText}>{selectedModel.cartesian_coordinates_xyz.trim()}</Text>
            </View>

            <TouchableOpacity
              style={[styles.calcButton, calculating && styles.calcButtonDisabled]}
              onPress={handleRunCalculation}
              disabled={calculating}
            >
              {calculating ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.calcButtonText}>⚡ Compute Ab-Initio RHF Energy & Reaction ΔE</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Calculation Results Card */}
          {calcResult && (
            <View style={styles.resultCard}>
              <View style={styles.resultHeader}>
                <Text style={styles.resultTitle}>Electronic Structure Solution</Text>
                <View style={[styles.badgeSuccess]}>
                  <Text style={styles.badgeSuccessText}>SCF CONVERGED</Text>
                </View>
              </View>

              <View style={styles.resultGrid}>
                <View style={styles.resultItem}>
                  <Text style={styles.resultLabel}>Total SCF Energy (E_tot)</Text>
                  <Text style={[styles.resultVal, { color: '#0284C7' }]}>
                    {calcResult.total_scf_energy_au.toFixed(6)} a.u.
                  </Text>
                  <Text style={styles.resultSub}>Hartree</Text>
                </View>

                <View style={styles.resultItem}>
                  <Text style={styles.resultLabel}>Nuclear Repulsion (E_nuc)</Text>
                  <Text style={styles.resultVal}>
                    +{calcResult.nuclear_repulsion_energy_au.toFixed(6)} a.u.
                  </Text>
                  <Text style={styles.resultSub}>Exact Coulomb point-charge</Text>
                </View>

                <View style={styles.resultItem}>
                  <Text style={styles.resultLabel}>HOMO-LUMO Gap</Text>
                  <Text style={[styles.resultVal, { color: '#059669' }]}>
                    {calcResult.homo_lumo_gap_ev.toFixed(2)} eV
                  </Text>
                  <Text style={styles.resultSub}>
                    HOMO: {calcResult.homo_energy_ev.toFixed(2)} eV | LUMO: {calcResult.lumo_energy_ev.toFixed(2)} eV
                  </Text>
                </View>

                <View style={styles.resultItem}>
                  <Text style={styles.resultLabel}>Dipole Moment</Text>
                  <Text style={styles.resultVal}>
                    {calcResult.dipole_moment_debye.toFixed(3)} Debye
                  </Text>
                  <Text style={styles.resultSub}>Molecular polarity</Text>
                </View>
              </View>

              {/* Reaction Energetics */}
              {calcResult.reaction_name && calcResult.reaction_energy_kcal_mol !== null && calcResult.reaction_energy_kcal_mol !== undefined && (
                <View style={styles.rxnBox}>
                  <Text style={styles.rxnTitle}>Elementary Reaction Energetics:</Text>
                  <Text style={styles.rxnName}>{calcResult.reaction_name}</Text>
                  <View style={styles.rxnEnergyRow}>
                    <Text style={styles.rxnEnergyLabel}>Reaction Energy ΔE_rxn:</Text>
                    <Text style={[
                      styles.rxnEnergyVal,
                      calcResult.reaction_energy_kcal_mol < 0 ? { color: '#059669' } : { color: '#D97706' }
                    ]}>
                      {calcResult.reaction_energy_kcal_mol > 0 ? '+' : ''}
                      {calcResult.reaction_energy_kcal_mol.toFixed(2)} kcal/mol
                    </Text>
                  </View>
                  <Text style={styles.rxnNote}>{calcResult.energy_convention_note}</Text>
                </View>
              )}

              {/* Model Scope Limitation Callout */}
              <View style={styles.limitationsBox}>
                <Text style={styles.limitationsTitle}>⚠️ Physical Model Limitations & Scope</Text>
                <Text style={styles.limitationsText}>{calcResult.limitations}</Text>
                <Text style={styles.runtimeMeta}>
                  SCF Iterations: {calcResult.iterations} • Execution: {calcResult.runtime_ms.toFixed(1)} ms • Engine: {calcResult.software_version}
                </Text>
              </View>
            </View>
          )}
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
    marginBottom: 8
  },
  modelScroll: {
    marginBottom: 16
  },
  modelCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginRight: 10,
    width: 200,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 1,
    elevation: 1
  },
  activeModelCard: {
    borderColor: '#0284C7',
    backgroundColor: '#F0F9FF'
  },
  modelCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A'
  },
  activeModelText: {
    color: '#0284C7'
  },
  modelFormula: {
    fontSize: 12,
    color: '#0284C7',
    marginTop: 2,
    fontWeight: '600'
  },
  modelMeta: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 4
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
    borderRadius: 8
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13
  },
  specCard: {
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
  specTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4
  },
  specScope: {
    fontSize: 12,
    color: '#475569',
    marginBottom: 12,
    lineHeight: 16
  },
  specGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    flexWrap: 'wrap'
  },
  specItem: {
    width: '48%',
    backgroundColor: '#F1F5F9',
    padding: 8,
    borderRadius: 6,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  specLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600'
  },
  specVal: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
    marginTop: 2
  },
  codeHeader: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 4
  },
  codeBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 6,
    padding: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  codeText: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: '#047857',
    lineHeight: 16
  },
  calcButton: {
    backgroundColor: '#0284C7',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2
  },
  calcButtonDisabled: {
    opacity: 0.6
  },
  calcButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13
  },
  resultCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  resultTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A'
  },
  badgeSuccess: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
    borderRadius: 6,
    paddingVertical: 2,
    paddingHorizontal: 6
  },
  badgeSuccessText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#166534'
  },
  resultGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12
  },
  resultItem: {
    flex: 1,
    minWidth: '46%',
    backgroundColor: '#F1F5F9',
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  resultLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600'
  },
  resultVal: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 2
  },
  resultSub: {
    fontSize: 9,
    color: '#94A3B8',
    marginTop: 2
  },
  rxnBox: {
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 6,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  rxnTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569'
  },
  rxnName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
    marginTop: 2
  },
  rxnEnergyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6
  },
  rxnEnergyLabel: {
    fontSize: 12,
    color: '#475569',
    marginRight: 6
  },
  rxnEnergyVal: {
    fontSize: 14,
    fontWeight: '700'
  },
  rxnNote: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 4,
    lineHeight: 14
  },
  limitationsBox: {
    backgroundColor: '#FFFBEB',
    borderRadius: 6,
    padding: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B'
  },
  limitationsTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 2
  },
  limitationsText: {
    fontSize: 11,
    color: '#78350F',
    lineHeight: 15
  },
  runtimeMeta: {
    fontSize: 9,
    color: '#64748B',
    marginTop: 6
  }
});
