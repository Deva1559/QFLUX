import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Pathway } from '../types';
import { api } from '../services/api';

interface PathwayScreenProps {
  activeProjectId?: number;
}

export const PathwayScreen: React.FC<PathwayScreenProps> = ({ activeProjectId }) => {
  const [pathways, setPathways] = useState<Pathway[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPathways();
  }, [activeProjectId]);

  const loadPathways = async () => {
    setLoading(true);
    try {
      const data = await api.getPathways(activeProjectId);
      setPathways(data);
    } catch (_) {
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.sectionHeader}>DEGRADATION PATHWAY & REACTION STEPS</Text>

      {pathways.map((pw) => (
        <View key={pw.id} style={styles.pathwayCard}>
          <Text style={styles.pathwayTitle}>{pw.title}</Text>
          <Text style={styles.targetText}>
            Target Compound: <Text style={styles.bold}>{pw.target_compound}</Text>
          </Text>
          {pw.description && <Text style={styles.descText}>{pw.description}</Text>}
          {pw.reference_doi && (
            <Text style={styles.doiText}>Primary Reference: DOI {pw.reference_doi}</Text>
          )}

          <Text style={styles.stepsHeader}>Stepwise Elementary Transformations:</Text>

          {pw.steps.map((st) => (
            <View key={st.id} style={styles.stepCard}>
              <View style={styles.stepHeaderRow}>
                <View style={styles.stepNumberBadge}>
                  <Text style={styles.stepNumberText}>Step {st.step_number}</Text>
                </View>
                <View style={styles.tagRow}>
                  {st.is_experimentally_observed && (
                    <View style={styles.tagExp}>
                      <Text style={styles.tagText}>Observed</Text>
                    </View>
                  )}
                  {st.is_computationally_proposed && (
                    <View style={styles.tagComp}>
                      <Text style={styles.tagText}>DFT Proposed</Text>
                    </View>
                  )}
                </View>
              </View>

              <Text style={styles.reactionFormula}>
                {st.reactant_name} ➔ {st.product_name}
              </Text>

              <Text style={styles.stepDesc}>{st.transformation_description}</Text>

              {st.bond_changes && (
                <Text style={styles.stepDetail}>
                  <Text style={styles.bold}>Bond Changes: </Text>
                  {st.bond_changes}
                </Text>
              )}

              {st.chemical_conditions && (
                <Text style={styles.stepDetail}>
                  <Text style={styles.bold}>Conditions: </Text>
                  {st.chemical_conditions}
                </Text>
              )}

              {st.reported_intermediates && (
                <Text style={styles.stepDetail}>
                  <Text style={styles.bold}>Intermediates: </Text>
                  {st.reported_intermediates}
                </Text>
              )}

              <View style={styles.quantumStatusBox}>
                <Text style={styles.quantumStatusLabel}>Quantum Calculation Status:</Text>
                <Text style={styles.quantumStatusVal}>{st.quantum_calc_status}</Text>
              </View>
            </View>
          ))}
        </View>
      ))}
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
  pathwayCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1
  },
  pathwayTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4
  },
  targetText: {
    fontSize: 12,
    color: '#0284C7',
    marginBottom: 4
  },
  descText: {
    fontSize: 11,
    color: '#475569',
    marginBottom: 4,
    lineHeight: 15
  },
  doiText: {
    fontSize: 10,
    color: '#64748B',
    fontFamily: 'monospace',
    marginBottom: 12
  },
  bold: {
    fontWeight: '700',
    color: '#0F172A'
  },
  stepsHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#334155',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 4
  },
  stepCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginBottom: 10
  },
  stepHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6
  },
  stepNumberBadge: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4
  },
  stepNumberText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700'
  },
  tagRow: {
    flexDirection: 'row'
  },
  tagExp: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 4
  },
  tagComp: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 4
  },
  tagText: {
    color: '#166534',
    fontSize: 9,
    fontWeight: '700'
  },
  reactionFormula: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0284C7',
    marginBottom: 6
  },
  stepDesc: {
    fontSize: 11,
    color: '#334155',
    marginBottom: 6,
    lineHeight: 15
  },
  stepDetail: {
    fontSize: 10,
    color: '#475569',
    marginBottom: 3
  },
  quantumStatusBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F1F5F9',
    padding: 6,
    borderRadius: 4,
    marginTop: 6
  },
  quantumStatusLabel: {
    fontSize: 9,
    color: '#64748B',
    fontWeight: '600'
  },
  quantumStatusVal: {
    fontSize: 9,
    color: '#D97706',
    fontWeight: '700'
  }
});
