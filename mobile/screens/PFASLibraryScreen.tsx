import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal
} from 'react-native';
import { PFASCompound } from '../types';
import { api } from '../services/api';

interface PFASLibraryScreenProps {
  onRefresh?: () => void;
}

export const PFASLibraryScreen: React.FC<PFASLibraryScreenProps> = () => {
  const [compounds, setCompounds] = useState<PFASCompound[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [carbonFilter, setCarbonFilter] = useState<'All' | 'Short' | 'Long'>('All');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // New Compound Modal State
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [formName, setFormName] = useState<string>('');
  const [formAcronym, setFormAcronym] = useState<string>('');
  const [formCas, setFormCas] = useState<string>('');
  const [formFormula, setFormFormula] = useState<string>('');
  const [formSmiles, setFormSmiles] = useState<string>('');
  const [formMw, setFormMw] = useState<string>('414.07');
  const [formCarbons, setFormCarbons] = useState<string>('8');
  const [formFluorines, setFormFluorines] = useState<string>('15');
  const [formSources, setFormSources] = useState<string>('PubChem / EPA CompTox');
  const [formNotes, setFormNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    fetchCompounds();
  }, [searchQuery, carbonFilter]);

  const fetchCompounds = async () => {
    try {
      setLoading(true);
      setError(null);
      let minC: number | undefined;
      let maxC: number | undefined;

      if (carbonFilter === 'Short') {
        minC = 1;
        maxC = 6;
      } else if (carbonFilter === 'Long') {
        minC = 7;
        maxC = 20;
      }

      const data = await api.getPFASCompounds(searchQuery || undefined, minC, maxC);
      setCompounds(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load PFAS library.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCompound = async () => {
    if (!formName.trim() || !formAcronym.trim() || !formFormula.trim()) {
      setFormError('Common name, acronym, and chemical formula are mandatory.');
      return;
    }
    const mw = parseFloat(formMw);
    const c = parseInt(formCarbons, 10);
    const f = parseInt(formFluorines, 10);
    if (isNaN(mw) || isNaN(c) || isNaN(f) || c <= 0 || f <= 0) {
      setFormError('Molecular weight, carbons, and fluorines must be valid positive numbers.');
      return;
    }

    try {
      setSubmitting(true);
      setFormError(null);
      await api.createPFASCompound({
        common_name: formName.trim(),
        acronym: formAcronym.trim().toUpperCase(),
        cas_number: formCas.trim() || undefined,
        chemical_formula: formFormula.trim(),
        smiles: formSmiles.trim() || undefined,
        molecular_weight: mw,
        num_carbons: c,
        num_fluorines: f,
        property_sources: formSources.trim() || undefined,
        notes: formNotes.trim() || undefined
      });
      setModalVisible(false);
      resetForm();
      fetchCompounds();
    } catch (err: any) {
      setFormError(err.message || 'Failed to register PFAS compound.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormName('');
    setFormAcronym('');
    setFormCas('');
    setFormFormula('');
    setFormSmiles('');
    setFormMw('414.07');
    setFormCarbons('8');
    setFormFluorines('15');
    setFormNotes('');
    setFormError(null);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Top Banner / Forensics Notice */}
      <View style={styles.noticeCard}>
        <View style={styles.noticeHeader}>
          <Text style={styles.noticeIcon}>🧬</Text>
          <Text style={styles.noticeTitle}>PFAS Compound Knowledge Base</Text>
        </View>
        <Text style={styles.noticeBody}>
          Normalized library of anthropogenic organofluorine contaminants. Stores verified chemical structures,
          thermodynamic properties, analytical CAS identifiers, and carbon-fluorine inventories critical for
          accurate mass-balance recovery calculations.
        </Text>
      </View>

      {/* Action / Search Bar */}
      <View style={styles.controlsRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, acronym (e.g. PFOA, GenX), or CAS..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#94A3B8"
        />
        <TouchableOpacity style={styles.newButton} onPress={() => setModalVisible(true)}>
          <Text style={styles.newButtonText}>+ Add PFAS</Text>
        </TouchableOpacity>
      </View>

      {/* Carbon Filter Chips */}
      <View style={styles.filterRow}>
        <Text style={styles.filterLabel}>Chain Length:</Text>
        {(['All', 'Short', 'Long'] as const).map((filter) => {
          const isActive = carbonFilter === filter;
          return (
            <TouchableOpacity
              key={filter}
              style={[styles.chip, isActive && styles.activeChip]}
              onPress={() => setCarbonFilter(filter)}
            >
              <Text style={[styles.chipText, isActive && styles.activeChipText]}>
                {filter === 'All' ? 'All Homologues' : filter === 'Short' ? 'Short-chain (C1-C6)' : 'Long-chain (C7+)'}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Loading & Error States */}
      {loading && (
        <View style={styles.centeredBlock}>
          <ActivityIndicator size="large" color="#0284C7" />
          <Text style={styles.loadingText}>Querying normalized PFAS records...</Text>
        </View>
      )}

      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorTitle}>Database Query Error</Text>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Compound List */}
      {!loading && !error && compounds.length === 0 && (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No matching PFAS compounds found</Text>
          <Text style={styles.emptySubtitle}>Try adjusting your search query or carbon chain filter.</Text>
        </View>
      )}

      {!loading && !error && compounds.map((c) => {
        const isExpanded = expandedId === c.id;
        return (
          <View key={c.id} style={styles.card}>
            <TouchableOpacity
              style={styles.cardHeader}
              onPress={() => setExpandedId(isExpanded ? null : c.id)}
            >
              <View style={styles.cardHeaderLeft}>
                <View style={styles.acronymBadge}>
                  <Text style={styles.acronymText}>{c.acronym}</Text>
                </View>
                <View style={styles.cardTitles}>
                  <Text style={styles.compoundName}>{c.common_name}</Text>
                  <Text style={styles.formulaText}>{c.chemical_formula} • CAS: {c.cas_number || 'N/A'}</Text>
                </View>
              </View>
              <Text style={styles.expandChevron}>{isExpanded ? '▲' : '▼'}</Text>
            </TouchableOpacity>

            {/* Quick Metrics Pill Row */}
            <View style={styles.metricsPillsRow}>
              <View style={styles.metricPill}>
                <Text style={styles.metricPillLabel}>Molecular Wt</Text>
                <Text style={styles.metricPillVal}>{c.molecular_weight.toFixed(2)} g/mol</Text>
              </View>
              <View style={styles.metricPill}>
                <Text style={styles.metricPillLabel}>Carbons</Text>
                <Text style={styles.metricPillVal}>{c.num_carbons} carbons</Text>
              </View>
              <View style={styles.metricPill}>
                <Text style={styles.metricPillLabel}>Fluorines</Text>
                <Text style={styles.metricPillVal}>{c.num_fluorines} F atoms</Text>
              </View>
              <View style={styles.metricPill}>
                <Text style={styles.metricPillLabel}>pKa</Text>
                <Text style={styles.metricPillVal}>{c.pka !== null && c.pka !== undefined ? c.pka : 'N/A'}</Text>
              </View>
            </View>

            {/* Expanded Detailed Attributes */}
            {isExpanded && (
              <View style={styles.expandedContent}>
                <View style={styles.divider} />
                
                {c.smiles && (
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Canonical SMILES:</Text>
                    <Text style={styles.monoCode}>{c.smiles}</Text>
                  </View>
                )}

                <View style={styles.detailGrid}>
                  <View style={styles.gridCell}>
                    <Text style={styles.detailLabel}>Water Solubility:</Text>
                    <Text style={styles.detailVal}>
                      {c.water_solubility_mg_l ? `${c.water_solubility_mg_l.toLocaleString()} mg/L` : 'Not reported'}
                    </Text>
                  </View>
                  <View style={styles.gridCell}>
                    <Text style={styles.detailLabel}>Data Provenance:</Text>
                    <Text style={styles.detailVal}>{c.property_sources || 'Curated scientific literature'}</Text>
                  </View>
                </View>

                {c.notes && (
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Forensic / Degradation Note:</Text>
                    <Text style={styles.notesText}>{c.notes}</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        );
      })}

      {/* Modal for creating a new validated PFAS */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Register PFAS Compound</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            {formError && <Text style={styles.modalError}>{formError}</Text>}

            <ScrollView style={styles.modalScroll}>
              <Text style={styles.inputLabel}>Common Chemical Name *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. Perfluorooctanoic acid"
                value={formName}
                onChangeText={setFormName}
              />

              <View style={styles.modalRow}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.inputLabel}>Acronym *</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="e.g. PFOA"
                    value={formAcronym}
                    onChangeText={setFormAcronym}
                    autoCapitalize="characters"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>CAS Registry #</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="e.g. 335-67-1"
                    value={formCas}
                    onChangeText={setFormCas}
                  />
                </View>
              </View>

              <Text style={styles.inputLabel}>Chemical Formula *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. C8HF15O2"
                value={formFormula}
                onChangeText={setFormFormula}
              />

              <View style={styles.modalRow}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.inputLabel}>Molecular Wt (g/mol) *</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="414.07"
                    keyboardType="numeric"
                    value={formMw}
                    onChangeText={setFormMw}
                  />
                </View>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.inputLabel}>Carbons *</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="8"
                    keyboardType="numeric"
                    value={formCarbons}
                    onChangeText={setFormCarbons}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Fluorines *</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="15"
                    keyboardType="numeric"
                    value={formFluorines}
                    onChangeText={setFormFluorines}
                  />
                </View>
              </View>

              <Text style={styles.inputLabel}>SMILES String</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. OC(=O)C(F)(F)..."
                value={formSmiles}
                onChangeText={setFormSmiles}
              />

              <Text style={styles.inputLabel}>Property Sources</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. PubChem CID 9554; EPA CompTox"
                value={formSources}
                onChangeText={setFormSources}
              />

              <Text style={styles.inputLabel}>Researcher Notes & C-F Cleavage Characteristics</Text>
              <TextInput
                style={[styles.modalInput, styles.multilineInput]}
                placeholder="Terminal C-F bond dissociation energy ~116 kcal/mol..."
                multiline
                numberOfLines={3}
                value={formNotes}
                onChangeText={setFormNotes}
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
                onPress={handleCreateCompound}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.submitBtnText}>Save to Knowledge Base</Text>
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
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: '#0F172A',
    marginRight: 8
  },
  newButton: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8
  },
  newButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700'
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginRight: 8
  },
  chip: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 6
  },
  activeChip: {
    backgroundColor: '#0284C7'
  },
  chipText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600'
  },
  activeChipText: {
    color: '#FFFFFF'
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  acronymBadge: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 10
  },
  acronymText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13
  },
  cardTitles: {
    flex: 1
  },
  compoundName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A'
  },
  formulaText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2
  },
  expandChevron: {
    fontSize: 12,
    color: '#94A3B8',
    marginLeft: 8
  },
  metricsPillsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9'
  },
  metricPill: {
    alignItems: 'center'
  },
  metricPillLabel: {
    fontSize: 10,
    color: '#64748B',
    textTransform: 'uppercase',
    fontWeight: '600'
  },
  metricPillVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 2
  },
  expandedContent: {
    marginTop: 10
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 10
  },
  detailItem: {
    marginBottom: 8
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 2
  },
  detailVal: {
    fontSize: 12,
    color: '#0F172A'
  },
  monoCode: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: '#0284C7',
    backgroundColor: '#F0F9FF',
    padding: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#BAE6FD'
  },
  detailGrid: {
    flexDirection: 'row',
    marginBottom: 8
  },
  gridCell: {
    flex: 1
  },
  notesText: {
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
    marginVertical: 12
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
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 20
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569'
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
    marginBottom: 12,
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
    minHeight: 60,
    textAlignVertical: 'top'
  },
  modalRow: {
    flexDirection: 'row'
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
