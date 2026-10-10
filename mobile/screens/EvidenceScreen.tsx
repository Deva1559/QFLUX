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
import { EvidenceRecord } from '../types';
import { api } from '../services/api';

interface EvidenceScreenProps {
  evidence: EvidenceRecord[];
  activeProjectId?: number;
  onRefresh: () => void;
}

export const EvidenceScreen: React.FC<EvidenceScreenProps> = ({
  evidence,
  activeProjectId,
  onRefresh
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [showAdd, setShowAdd] = useState(false);

  // Form states
  const [compoundName, setCompoundName] = useState('PFOA');
  const [studyTitle, setStudyTitle] = useState('');
  const [authors, setAuthors] = useState('');
  const [pubYear, setPubYear] = useState('2024');
  const [doi, setDoi] = useState('');
  const [method, setMethod] = useState('');
  const [parentLoss, setParentLoss] = useState('');
  const [defluor, setDefluor] = useState('');
  const [mineral, setMineral] = useState('');
  const [byproducts, setByproducts] = useState('');
  const [category, setCategory] = useState('Published experimental result');
  const [submitting, setSubmitting] = useState(false);

  const categories = [
    'All',
    'Published experimental result',
    'Published computational result',
    'User-entered hypothetical scenario'
  ];

  const filteredEvidence = evidence.filter((e) => {
    if (selectedCategory === 'All') return true;
    return e.evidence_category === selectedCategory;
  });

  const handleCreate = async () => {
    if (!studyTitle.trim() || !compoundName.trim()) {
      Alert.alert('Required Fields', 'Please enter a study title and compound name.');
      return;
    }
    setSubmitting(true);
    try {
      await api.createEvidence({
        project_id: activeProjectId,
        compound_name: compoundName,
        study_title: studyTitle,
        authors: authors || undefined,
        publication_year: pubYear ? parseInt(pubYear, 10) : undefined,
        doi_or_url: doi || undefined,
        method: method || undefined,
        parent_removal_pct: parentLoss ? parseFloat(parentLoss) : undefined,
        defluorination_pct: defluor ? parseFloat(defluor) : undefined,
        mineralization_pct: mineral ? parseFloat(mineral) : undefined,
        reported_byproducts: byproducts || undefined,
        evidence_category: category,
        verification_status:
          category === 'User-entered hypothetical scenario'
            ? 'Simulated/Hypothetical'
            : 'Needs verification'
      });
      setShowAdd(false);
      setStudyTitle('');
      onRefresh();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to save evidence');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionHeader}>PFAS DEGRADATION EVIDENCE EXPLORER</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAdd(!showAdd)}
        >
          <Text style={styles.addButtonText}>{showAdd ? '✕ Cancel' : '+ Add Study'}</Text>
        </TouchableOpacity>
      </View>

      {/* Category Filter Pills */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.filterPill, selectedCategory === cat && styles.activeFilterPill]}
            onPress={() => setSelectedCategory(cat)}
          >
            <Text style={[styles.filterText, selectedCategory === cat && styles.activeFilterText]}>
              {cat === 'All' ? 'All Studies' : cat.replace(' result', '')}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Add Evidence Form */}
      {showAdd && (
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Record Literature / Experimental Evidence</Text>
          
          <Text style={styles.inputLabel}>Study Title *</Text>
          <TextInput
            style={styles.input}
            value={studyTitle}
            onChangeText={setStudyTitle}
            placeholder="e.g., UV/Sulfite Photochemical PFAS Degradation"
            placeholderTextColor="#64748B"
          />

          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 6 }}>
              <Text style={styles.inputLabel}>Compound Name</Text>
              <TextInput
                style={styles.input}
                value={compoundName}
                onChangeText={setCompoundName}
                placeholder="PFOA, PFOS..."
                placeholderTextColor="#64748B"
              />
            </View>
            <View style={{ flex: 1, marginLeft: 6 }}>
              <Text style={styles.inputLabel}>Publication Year</Text>
              <TextInput
                style={styles.input}
                value={pubYear}
                onChangeText={setPubYear}
                keyboardType="numeric"
                placeholder="2024"
                placeholderTextColor="#64748B"
              />
            </View>
          </View>

          <Text style={styles.inputLabel}>Authors / DOI</Text>
          <TextInput
            style={styles.input}
            value={doi}
            onChangeText={setDoi}
            placeholder="10.1021/acs.est.3c10617"
            placeholderTextColor="#64748B"
          />

          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 4 }}>
              <Text style={styles.inputLabel}>Parent Loss (%)</Text>
              <TextInput
                style={styles.input}
                value={parentLoss}
                onChangeText={setParentLoss}
                keyboardType="numeric"
                placeholder="100.0"
                placeholderTextColor="#64748B"
              />
            </View>
            <View style={{ flex: 1, marginHorizontal: 4 }}>
              <Text style={styles.inputLabel}>Defluor. (%)</Text>
              <TextInput
                style={styles.input}
                value={defluor}
                onChangeText={setDefluor}
                keyboardType="numeric"
                placeholder="13.0"
                placeholderTextColor="#64748B"
              />
            </View>
            <View style={{ flex: 1, marginLeft: 4 }}>
              <Text style={styles.inputLabel}>Mineral. (%)</Text>
              <TextInput
                style={styles.input}
                value={mineral}
                onChangeText={setMineral}
                keyboardType="numeric"
                placeholder="0.0"
                placeholderTextColor="#64748B"
              />
            </View>
          </View>

          <Text style={styles.inputLabel}>Reported Byproducts</Text>
          <TextInput
            style={styles.input}
            value={byproducts}
            onChangeText={setByproducts}
            placeholder="e.g., PFHpA, PFHxA, short-chain fluorocarbons"
            placeholderTextColor="#64748B"
          />

          <TouchableOpacity
            style={[styles.submitButton, submitting && { opacity: 0.6 }]}
            onPress={handleCreate}
            disabled={submitting}
          >
            <Text style={styles.submitButtonText}>
              {submitting ? 'Saving Evidence...' : 'Save Evidence Record'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Evidence Cards List */}
      {filteredEvidence.map((ev) => {
        const isVerified = ev.verification_status?.includes('Verified') ?? false;
        const gap =
          ev.parent_removal_pct !== undefined && ev.defluorination_pct !== undefined
            ? ev.parent_removal_pct - ev.defluorination_pct
            : null;

        return (
          <View key={ev.id} style={styles.evidenceCard}>
            <View style={styles.cardHeaderRow}>
              <View style={[styles.verifBadge, { backgroundColor: isVerified ? '#DCFCE7' : '#FEF3C7' }]}>
                <Text style={[styles.verifBadgeText, { color: isVerified ? '#166534' : '#92400E' }]}>
                  {ev.verification_status}
                </Text>
              </View>
              <Text style={styles.categoryBadgeText}>{ev.evidence_category}</Text>
            </View>

            <Text style={styles.studyTitle}>{ev.study_title}</Text>
            {ev.authors && (
              <Text style={styles.authorText}>
                {ev.authors} ({ev.publication_year || 'n.d.'})
              </Text>
            )}
            {ev.doi_or_url && (
              <Text style={styles.doiText}>DOI: {ev.doi_or_url}</Text>
            )}

            {/* Metrics Triplet */}
            <View style={styles.tripletRow}>
              <View style={styles.tripletCol}>
                <Text style={styles.tripletLabel}>Parent Loss</Text>
                <Text style={styles.tripletVal}>
                  {ev.parent_removal_pct !== null && ev.parent_removal_pct !== undefined
                    ? `${ev.parent_removal_pct.toFixed(1)}%`
                    : 'N/A'}
                </Text>
              </View>
              <View style={styles.tripletCol}>
                <Text style={styles.tripletLabel}>Defluorination</Text>
                <Text style={[styles.tripletVal, { color: '#D97706' }]}>
                  {ev.defluorination_pct !== null && ev.defluorination_pct !== undefined
                    ? `${ev.defluorination_pct.toFixed(1)}%`
                    : 'N/A'}
                </Text>
              </View>
              <View style={styles.tripletCol}>
                <Text style={styles.tripletLabel}>Mineralization</Text>
                <Text style={[styles.tripletVal, { color: '#059669' }]}>
                  {ev.mineralization_pct !== null && ev.mineralization_pct !== undefined
                    ? `${ev.mineralization_pct.toFixed(1)}%`
                    : '0.0%'}
                </Text>
              </View>
            </View>

            {gap !== null && gap > 30 && (
              <View style={styles.gapWarningBox}>
                <Text style={styles.gapWarningText}>
                  ⚠️ Defluorination Gap: {gap.toFixed(1)}% of parent compound is un-defluorinated organofluorine intermediate!
                </Text>
              </View>
            )}

            {ev.reported_byproducts && (
              <Text style={styles.byproductText}>
                <Text style={styles.bold}>Reported Byproducts: </Text>
                {ev.reported_byproducts}
              </Text>
            )}

            {ev.limitations && (
              <Text style={styles.limitationText}>
                <Text style={styles.bold}>Limitation: </Text>
                {ev.limitations}
              </Text>
            )}
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
    marginBottom: 8
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 0.8
  },
  addButton: {
    backgroundColor: '#0284C7',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2
  },
  addButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF'
  },
  filterScroll: {
    marginBottom: 12
  },
  filterPill: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 1,
    elevation: 1
  },
  activeFilterPill: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7'
  },
  filterText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600'
  },
  activeFilterText: {
    color: '#FFFFFF',
    fontWeight: '700'
  },
  evidenceCard: {
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
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  verifBadge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 12
  },
  verifBadgeText: {
    fontSize: 10,
    fontWeight: '700'
  },
  categoryBadgeText: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600'
  },
  studyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 18,
    marginBottom: 4
  },
  authorText: {
    fontSize: 11,
    color: '#475569',
    marginBottom: 2
  },
  doiText: {
    fontSize: 10,
    color: '#0284C7',
    fontFamily: 'monospace',
    marginBottom: 8
  },
  tripletRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
    padding: 8,
    marginBottom: 8
  },
  tripletCol: {
    flex: 1,
    alignItems: 'center'
  },
  tripletLabel: {
    fontSize: 9,
    color: '#64748B',
    fontWeight: '700',
    textTransform: 'uppercase'
  },
  tripletVal: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2
  },
  gapWarningBox: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FCD34D',
    borderWidth: 1,
    borderRadius: 6,
    padding: 8,
    marginBottom: 8
  },
  gapWarningText: {
    color: '#92400E',
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 15
  },
  byproductText: {
    fontSize: 11,
    color: '#475569',
    marginBottom: 4
  },
  limitationText: {
    fontSize: 11,
    color: '#64748B',
    fontStyle: 'italic'
  },
  bold: {
    fontWeight: '700',
    color: '#0F172A'
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1
  },
  formTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 10
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
  submitButton: {
    backgroundColor: '#10B981',
    paddingVertical: 9,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 4,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12
  }
});
