import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
  Alert
} from 'react-native';
import { ExperimentPlan, PFASCompound, Catalyst } from '../types';
import { api } from '../services/api';

interface ExperimentPlannerScreenProps {
  activeProjectId?: number;
}

export const ExperimentPlannerScreen: React.FC<ExperimentPlannerScreenProps> = ({ activeProjectId }) => {
  const [plans, setPlans] = useState<ExperimentPlan[]>([]);
  const [compounds, setCompounds] = useState<PFASCompound[]>([]);
  const [catalysts, setCatalysts] = useState<Catalyst[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // New Experiment Plan Modal
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [title, setTitle] = useState<string>('');
  const [selectedPfasId, setSelectedPfasId] = useState<number | null>(null);
  const [selectedCatalystId, setSelectedCatalystId] = useState<number | null>(null);
  const [treatmentMethod, setTreatmentMethod] = useState<string>('Photocatalytic (UV-C/In2O3)');
  const [proposedConditions, setProposedConditions] = useState<string>('pH 7.0, 25°C, 0.5 g/L catalyst, 254 nm UV-C lamp, closed batch reactor');
  const [plannedControls, setPlannedControls] = useState<string>('Dark control (no light), photolysis blank (UV without catalyst), anion matrix control');
  const [expectedMeasurements, setExpectedMeasurements] = useState<string>('Parent disappearance (LC-MS/MS), stoichiometric inorganic fluoride (IC), head-space volatile PFCAs');
  const [analyticalMethods, setAnalyticalMethods] = useState<string>('LC-MS/MS, Ion Chromatography (IC), Combustion IC (CIC)');
  const [detectionLimits, setDetectionLimits] = useState<string>('0.01 mg/L for F-, 0.05 ug/L for PFOA');
  const [safetyHazards, setSafetyHazards] = useState<string>('UV-C irradiation eye/skin hazard; acidic rinse handling');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [activeProjectId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [plansData, pfasData, catsData] = await Promise.all([
        api.getExperimentPlans(activeProjectId),
        api.getPFASCompounds(),
        api.getCatalysts()
      ]);
      setPlans(plansData);
      setCompounds(pfasData);
      setCatalysts(catsData);
      if (pfasData.length > 0 && !selectedPfasId) {
        setSelectedPfasId(pfasData[0].id);
      }
      if (catsData.length > 0 && !selectedCatalystId) {
        setSelectedCatalystId(catsData[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load experiment planner records.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlan = async () => {
    if (!title.trim() || !selectedPfasId || !treatmentMethod.trim() || !proposedConditions.trim()) {
      setFormError('Title, target PFAS, treatment method, and conditions are required.');
      return;
    }

    try {
      setSubmitting(true);
      setFormError(null);
      await api.createExperimentPlan({
        project_id: activeProjectId,
        title: title.trim(),
        target_pfas_id: selectedPfasId,
        catalyst_id: selectedCatalystId || undefined,
        treatment_method: treatmentMethod.trim(),
        proposed_conditions: proposedConditions.trim(),
        planned_controls: plannedControls.trim() || undefined,
        expected_measurements: expectedMeasurements.trim() || undefined,
        analytical_methods: analyticalMethods.trim() || undefined,
        detection_limits: detectionLimits.trim() || undefined,
        safety_hazards: safetyHazards.trim() || undefined,
        experiment_status: 'Scheduled'
      });
      setModalVisible(false);
      resetForm();
      loadData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to schedule experiment.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (planId: number, newStatus: 'Draft' | 'Scheduled' | 'Completed' | 'Cancelled') => {
    try {
      await api.updateExperimentPlan(planId, { experiment_status: newStatus });
      loadData();
    } catch (err: any) {
      Alert.alert('Status Update Error', err.message);
    }
  };

  const resetForm = () => {
    setTitle('');
    setFormError(null);
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'Completed':
        return { bg: '#DCFCE7', text: '#166534' };
      case 'Scheduled':
        return { bg: '#E0F2FE', text: '#0369A1' };
      case 'Cancelled':
        return { bg: '#FEE2E2', text: '#991B1B' };
      default:
        return { bg: '#F1F5F9', text: '#475569' };
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Forensics Guidance Notice */}
      <View style={styles.noticeCard}>
        <View style={styles.noticeHeader}>
          <Text style={styles.noticeIcon}>📋</Text>
          <Text style={styles.noticeTitle}>Experiment Planning & Uncertainty Reduction</Text>
        </View>
        <Text style={styles.noticeBody}>
          Every experimental plan is engineered to close empirical uncertainty gaps—specifically targeting
          inorganic fluoride release (F-), intermediate mass balance, and reusability under real water matrix conditions.
          Proposed experiments are clearly distinguished from completed research findings.
        </Text>
      </View>

      {/* Action Header */}
      <View style={styles.actionHeaderRow}>
        <View>
          <Text style={styles.sectionTitle}>Planned Degradation Experiments</Text>
          <Text style={styles.sectionSubtitle}>
            {plans.length} experimental protocol{plans.length === 1 ? '' : 's'} registered
          </Text>
        </View>
        <TouchableOpacity style={styles.scheduleButton} onPress={() => setModalVisible(true)}>
          <Text style={styles.scheduleButtonText}>+ Plan Experiment</Text>
        </TouchableOpacity>
      </View>

      {/* Loading & Error */}
      {loading && (
        <View style={styles.centeredBlock}>
          <ActivityIndicator size="large" color="#0284C7" />
          <Text style={styles.loadingText}>Loading scheduled experiments...</Text>
        </View>
      )}

      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Experiment Plans List */}
      {!loading && !error && plans.length === 0 && (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No experiment plans currently scheduled</Text>
          <Text style={styles.emptySubtitle}>
            Click "+ Plan Experiment" to design an experimental protocol addressing specific catalyst uncertainty.
          </Text>
        </View>
      )}

      {!loading && !error && plans.map((plan) => {
        const badge = getStatusBadgeStyle(plan.experiment_status);
        const pfasMatch = compounds.find((c) => c.id === plan.target_pfas_id);
        const catMatch = catalysts.find((c) => c.id === plan.catalyst_id);

        return (
          <View key={plan.id} style={styles.planCard}>
            <View style={styles.planHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.planTitle}>{plan.title}</Text>
                <Text style={styles.planSub}>
                  Target: {pfasMatch ? pfasMatch.acronym : 'PFAS'} • Catalyst: {catMatch ? catMatch.name : 'Candidate'}
                </Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
                <Text style={[styles.statusBadgeText, { color: badge.text }]}>
                  {plan.experiment_status.toUpperCase()}
                </Text>
              </View>
            </View>

            <View style={styles.detailBlock}>
              <Text style={styles.detailLabel}>Treatment Method & Conditions:</Text>
              <Text style={styles.detailValue}>{plan.treatment_method} — {plan.proposed_conditions}</Text>
            </View>

            {plan.planned_controls && (
              <View style={styles.detailBlock}>
                <Text style={styles.detailLabel}>Planned Scientific Controls:</Text>
                <Text style={styles.detailValue}>{plan.planned_controls}</Text>
              </View>
            )}

            {plan.expected_measurements && (
              <View style={styles.detailBlock}>
                <Text style={styles.detailLabel}>Target Measurements & Methods:</Text>
                <Text style={styles.detailValue}>{plan.expected_measurements} ({plan.analytical_methods || 'LC-MS/MS, IC'})</Text>
              </View>
            )}

            {plan.safety_hazards && (
              <View style={styles.hazardBox}>
                <Text style={styles.hazardLabel}>Safety / Lab Hazards:</Text>
                <Text style={styles.hazardText}>{plan.safety_hazards}</Text>
              </View>
            )}

            {/* Status Change Buttons */}
            <View style={styles.statusButtonsRow}>
              <Text style={styles.changeStatusLabel}>Update Status:</Text>
              {(['Draft', 'Scheduled', 'Completed', 'Cancelled'] as const).map((st) => (
                <TouchableOpacity
                  key={st}
                  style={[
                    styles.statusChangeBtn,
                    plan.experiment_status === st && styles.activeStatusChangeBtn
                  ]}
                  onPress={() => handleUpdateStatus(plan.id, st)}
                >
                  <Text style={[
                    styles.statusChangeBtnText,
                    plan.experiment_status === st && styles.activeStatusChangeBtnText
                  ]}>
                    {st}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );
      })}

      {/* CSV Dataset Import Template Reference Card */}
      <View style={styles.csvCard}>
        <View style={styles.csvHeader}>
          <Text style={styles.csvIcon}>📥</Text>
          <View>
            <Text style={styles.csvTitle}>Bulk CSV Experimental Dataset Import</Text>
            <Text style={styles.csvSubtitle}>Standardized CSV column templates with transactional rollback</Text>
          </View>
        </View>
        <Text style={styles.csvDescription}>
          To import batch experimental datasets from laboratory runs, use our validated CSV format.
          Columns include: target_pfas, catalyst, treatment_method, initial_conc_mg_l, duration_min, parent_removal_pct, defluorination_pct, doi, study_title, year, journal.
        </Text>
        <View style={styles.csvActionRow}>
          <Text style={styles.csvEndpointLabel}>API Template Endpoint: /api/v1/literature/csv-template</Text>
        </View>
      </View>

      {/* Modal for creating a new experiment plan */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Plan Degradation Experiment</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            {formError && <Text style={styles.modalError}>{formError}</Text>}

            <ScrollView style={styles.modalScroll}>
              <Text style={styles.inputLabel}>Experiment Plan Title *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. In2O3 fluoride recovery under sulfate anion matrix"
                value={title}
                onChangeText={setTitle}
              />

              <Text style={styles.inputLabel}>Target PFAS Compound *</Text>
              <View style={styles.chipsSelectorRow}>
                {compounds.map((c) => (
                  <TouchableOpacity
                    key={c.id}
                    style={[styles.selectorChip, selectedPfasId === c.id && styles.activeSelectorChip]}
                    onPress={() => setSelectedPfasId(c.id)}
                  >
                    <Text style={[styles.selectorChipText, selectedPfasId === c.id && styles.activeSelectorChipText]}>
                      {c.acronym}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Candidate Catalyst</Text>
              <View style={styles.chipsSelectorRow}>
                {catalysts.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[styles.selectorChip, selectedCatalystId === cat.id && styles.activeSelectorChip]}
                    onPress={() => setSelectedCatalystId(cat.id)}
                  >
                    <Text style={[styles.selectorChipText, selectedCatalystId === cat.id && styles.activeSelectorChipText]}>
                      {cat.name.split(' ')[0]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Treatment Method *</Text>
              <TextInput
                style={styles.modalInput}
                value={treatmentMethod}
                onChangeText={setTreatmentMethod}
              />

              <Text style={styles.inputLabel}>Proposed Experimental Conditions *</Text>
              <TextInput
                style={[styles.modalInput, styles.multilineInput]}
                multiline
                numberOfLines={3}
                value={proposedConditions}
                onChangeText={setProposedConditions}
              />

              <Text style={styles.inputLabel}>Planned Scientific Controls</Text>
              <TextInput
                style={[styles.modalInput, styles.multilineInput]}
                multiline
                numberOfLines={2}
                value={plannedControls}
                onChangeText={setPlannedControls}
              />

              <Text style={styles.inputLabel}>Target Measurements (Fluoride, Parent, Intermediates)</Text>
              <TextInput
                style={[styles.modalInput, styles.multilineInput]}
                multiline
                numberOfLines={2}
                value={expectedMeasurements}
                onChangeText={setExpectedMeasurements}
              />

              <Text style={styles.inputLabel}>Analytical Methods & Detection Limits</Text>
              <TextInput
                style={styles.modalInput}
                value={analyticalMethods}
                onChangeText={setAnalyticalMethods}
              />

              <Text style={styles.inputLabel}>Lab Safety Hazards & Countermeasures</Text>
              <TextInput
                style={styles.modalInput}
                value={safetyHazards}
                onChangeText={setSafetyHazards}
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setModalVisible(false)}
                disabled={submitting}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleCreatePlan}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.submitBtnText}>Schedule Experiment</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  actionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A'
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2
  },
  scheduleButton: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8
  },
  scheduleButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700'
  },
  planCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10
  },
  planTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A'
  },
  planSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800'
  },
  detailBlock: {
    marginBottom: 8
  },
  detailLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase'
  },
  detailValue: {
    fontSize: 12,
    color: '#1E293B',
    lineHeight: 16,
    marginTop: 2
  },
  hazardBox: {
    backgroundColor: '#FEF2F2',
    padding: 8,
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#EF4444',
    marginBottom: 10
  },
  hazardLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B91C1C'
  },
  hazardText: {
    fontSize: 11,
    color: '#991B1B',
    marginTop: 2
  },
  statusButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
    marginTop: 4
  },
  changeStatusLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginRight: 6
  },
  statusChangeBtn: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  activeStatusChangeBtn: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7'
  },
  statusChangeBtnText: {
    fontSize: 10,
    color: '#475569',
    fontWeight: '600'
  },
  activeStatusChangeBtnText: {
    color: '#FFFFFF',
    fontWeight: '700'
  },
  csvCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 10
  },
  csvHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  csvIcon: {
    fontSize: 20,
    marginRight: 10
  },
  csvTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A'
  },
  csvSubtitle: {
    fontSize: 11,
    color: '#64748B'
  },
  csvDescription: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
    marginBottom: 10
  },
  csvActionRow: {
    backgroundColor: '#FFFFFF',
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  csvEndpointLabel: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: '#0284C7'
  },
  centeredBlock: {
    padding: 30,
    alignItems: 'center'
  },
  loadingText: {
    marginTop: 8,
    fontSize: 12,
    color: '#64748B'
  },
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderColor: '#F87171',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 12
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569'
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
    textAlign: 'center'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    maxHeight: '90%',
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 8
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A'
  },
  modalClose: {
    fontSize: 18,
    color: '#64748B',
    fontWeight: 'bold',
    paddingHorizontal: 8
  },
  modalError: {
    backgroundColor: '#FEF2F2',
    color: '#B91C1C',
    padding: 8,
    borderRadius: 6,
    fontSize: 12,
    marginBottom: 10
  },
  modalScroll: {
    marginBottom: 10
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 4,
    marginTop: 6
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    fontSize: 12,
    color: '#0F172A'
  },
  multilineInput: {
    minHeight: 50,
    textAlignVertical: 'top'
  },
  chipsSelectorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 4
  },
  selectorChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    marginRight: 6,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1'
  },
  activeSelectorChip: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7'
  },
  selectorChipText: {
    fontSize: 11,
    color: '#334155'
  },
  activeSelectorChipText: {
    color: '#FFFFFF',
    fontWeight: '700'
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 10
  },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 6,
    marginRight: 8,
    backgroundColor: '#E2E8F0'
  },
  cancelBtnText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '600'
  },
  submitBtn: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 6
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700'
  }
});
