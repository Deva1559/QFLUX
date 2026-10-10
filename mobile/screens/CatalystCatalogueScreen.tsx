import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput
} from 'react-native';
import { Catalyst } from '../types';
import { api } from '../services/api';

interface CatalystCatalogueScreenProps {
  onRefresh?: () => void;
  onSelectForComparison?: (catalystId: number) => void;
}

export const CatalystCatalogueScreen: React.FC<CatalystCatalogueScreenProps> = ({
  onRefresh,
  onSelectForComparison
}) => {
  const [catalysts, setCatalysts] = useState<Catalyst[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filterMaterial, setFilterMaterial] = useState<string>('All');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    fetchCatalysts();
  }, []);

  const fetchCatalysts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getCatalysts();
      setCatalysts(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch catalyst database');
    } finally {
      setLoading(false);
    }
  };

  const materialTypes = ['All', 'Photocatalyst', 'Reductive Metal Surface', 'Electrocatalyst', 'Single-Atom Catalyst'];

  const filteredCatalysts = filterMaterial === 'All'
    ? catalysts
    : catalysts.filter((c) => c.material_type.toLowerCase().includes(filterMaterial.toLowerCase()));

  const getEvidenceBadgeColor = (category?: string) => {
    if (!category) return '#64748B';
    const lower = category.toLowerCase();
    if (lower.includes('experimental')) return '#059669';
    if (lower.includes('computational')) return '#2563EB';
    if (lower.includes('hypothetical')) return '#D97706';
    return '#64748B';
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerBox}>
        <Text style={styles.title}>Evidence-Backed Catalyst Catalogue</Text>
        <Text style={styles.subtitle}>
          Investigating literature-reported degradation vs measured fluoride release. Critical distinction:
          parent removal does not establish defluorination or complete mineralization.
        </Text>
      </View>

      {/* Filter Chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
        {materialTypes.map((m) => (
          <TouchableOpacity
            key={m}
            style={[styles.filterChip, filterMaterial === m && styles.activeFilterChip]}
            onPress={() => setFilterMaterial(m)}
          >
            <Text style={[styles.filterText, filterMaterial === m && styles.activeFilterText]}>
              {m}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#0284C7" />
          <Text style={styles.loadingText}>Querying SQLite catalyst records...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>Error: {error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchCatalysts}>
            <Text style={styles.retryBtnText}>Retry Connection</Text>
          </TouchableOpacity>
        </View>
      ) : filteredCatalysts.length === 0 ? (
        <View style={styles.centerBox}>
          <Text style={styles.emptyText}>No catalyst records found for this filter.</Text>
        </View>
      ) : (
        filteredCatalysts.map((cat) => {
          const isExpanded = expandedId === cat.id;
          const badgeColor = getEvidenceBadgeColor(cat.evidence_category);

          return (
            <View key={cat.id} style={styles.catalystCard}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <Text style={styles.catalystName}>{cat.name}</Text>
                  <Text style={styles.chemicalFormula}>{cat.chemical_formula} • {cat.material_type}</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: badgeColor + '15', borderColor: badgeColor }]}>
                  <Text style={[styles.badgeText, { color: badgeColor }]}>
                    {cat.evidence_category}
                  </Text>
                </View>
              </View>

              {/* Performance Metrics Grid */}
              <View style={styles.metricsGrid}>
                <View style={styles.metricBox}>
                  <Text style={styles.metricLabel}>Parent Removal</Text>
                  <Text style={styles.metricValue}>{cat.reported_parent_removal_pct}%</Text>
                  <Text style={styles.metricSub}>Target: {cat.target_pfas}</Text>
                </View>

                <View style={[
                  styles.metricBox,
                  cat.reported_defluorination_pct === null && styles.missingMetricBox
                ]}>
                  <Text style={styles.metricLabel}>Measured F⁻ Release</Text>
                  {cat.reported_defluorination_pct !== null && cat.reported_defluorination_pct !== undefined ? (
                    <Text style={[styles.metricValue, { color: '#059669' }]}>
                      {cat.reported_defluorination_pct}%
                    </Text>
                  ) : (
                    <Text style={[styles.metricValue, { color: '#DC2626' }]}>MISSING</Text>
                  )}
                  <Text style={styles.metricSub}>
                    {cat.reported_defluorination_pct === null ? 'Not reported in paper' : 'Inorganic F⁻'}
                  </Text>
                </View>

                <View style={styles.metricBox}>
                  <Text style={styles.metricLabel}>Mechanism</Text>
                  <Text style={styles.metricValueSmall} numberOfLines={2}>
                    {cat.treatment_mechanism}
                  </Text>
                  <Text style={styles.metricSub}>
                    {cat.solvent_medium}
                  </Text>
                </View>
              </View>

              {/* Critical Scientific Note on Missing Defluorination */}
              {cat.reported_defluorination_pct === null && (
                <View style={styles.warningCallout}>
                  <Text style={styles.warningTitle}>⚠️ Missing Defluorination Measurement</Text>
                  <Text style={styles.warningBody}>
                    Source reports high parent PFAS removal ({cat.reported_parent_removal_pct}%) but omitted
                    quantitative fluoride release. Parent loss may be due to surface sorption or partial defluorination
                    to fluorinated byproducts rather than true mineralization.
                  </Text>
                </View>
              )}

              {/* Expandable Details */}
              {isExpanded && (
                <View style={styles.expandedSection}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Reaction Conditions:</Text>
                    <Text style={styles.detailValue}>{cat.reaction_conditions}</Text>
                  </View>
                  {cat.light_or_electrical_source && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Energy Source:</Text>
                      <Text style={styles.detailValue}>{cat.light_or_electrical_source}</Text>
                    </View>
                  )}
                  {cat.reported_byproducts && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Reported Byproducts:</Text>
                      <Text style={styles.detailValue}>{cat.reported_byproducts}</Text>
                    </View>
                  )}
                  {cat.energy_intensity_kwh_m3 !== null && cat.energy_intensity_kwh_m3 !== undefined && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Energy Intensity:</Text>
                      <Text style={styles.detailValue}>{cat.energy_intensity_kwh_m3} kWh/m³</Text>
                    </View>
                  )}
                  {cat.known_limitations && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Documented Limitations:</Text>
                      <Text style={[styles.detailValue, { color: '#B45309' }]}>{cat.known_limitations}</Text>
                    </View>
                  )}
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Source Citation:</Text>
                    <Text style={[styles.detailValue, { fontStyle: 'italic' }]}>{cat.publication_citation}</Text>
                  </View>
                  {cat.doi_or_url && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>DOI / Reference:</Text>
                      <Text style={[styles.detailValue, { color: '#0284C7' }]}>{cat.doi_or_url}</Text>
                    </View>
                  )}
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Verification Status:</Text>
                    <Text style={[styles.detailValue, { color: '#059669', fontWeight: '600' }]}>
                      {cat.verification_status}
                    </Text>
                  </View>
                </View>
              )}

              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={styles.expandBtn}
                  onPress={() => setExpandedId(isExpanded ? null : cat.id)}
                >
                  <Text style={styles.expandBtnText}>
                    {isExpanded ? 'Hide Details ▲' : 'View Full Scientific Details ▼'}
                  </Text>
                </TouchableOpacity>

                {onSelectForComparison && (
                  <TouchableOpacity
                    style={styles.compareBtn}
                    onPress={() => onSelectForComparison(cat.id)}
                  >
                    <Text style={styles.compareBtnText}>Compare ⚖️</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })
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
  filterScroll: {
    marginBottom: 16
  },
  filterChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
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
  activeFilterChip: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7'
  },
  filterText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500'
  },
  activeFilterText: {
    color: '#FFFFFF',
    fontWeight: '700'
  },
  centerBox: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center'
  },
  loadingText: {
    color: '#64748B',
    marginTop: 10,
    fontSize: 13
  },
  emptyText: {
    color: '#64748B',
    fontSize: 14
  },
  errorBox: {
    padding: 16,
    backgroundColor: '#FEF2F2',
    borderColor: '#F87171',
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center'
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13,
    marginBottom: 8
  },
  retryBtn: {
    backgroundColor: '#DC2626',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 6
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 12
  },
  catalystCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 14,
    marginBottom: 14,
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
    alignItems: 'flex-start',
    marginBottom: 12
  },
  cardHeaderLeft: {
    flex: 1,
    marginRight: 8
  },
  catalystName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A'
  },
  chemicalFormula: {
    fontSize: 12,
    color: '#0284C7',
    marginTop: 2,
    fontWeight: '600'
  },
  badge: {
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 2,
    paddingHorizontal: 6
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700'
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  metricBox: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
    padding: 8,
    marginHorizontal: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  missingMetricBox: {
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2'
  },
  metricLabel: {
    fontSize: 10,
    color: '#64748B',
    marginBottom: 2,
    fontWeight: '600'
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A'
  },
  metricValueSmall: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155'
  },
  metricSub: {
    fontSize: 9,
    color: '#94A3B8',
    marginTop: 2
  },
  warningCallout: {
    backgroundColor: '#FEF2F2',
    borderLeftWidth: 3,
    borderLeftColor: '#EF4444',
    padding: 8,
    borderRadius: 4,
    marginBottom: 10
  },
  warningTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#991B1B',
    marginBottom: 2
  },
  warningBody: {
    fontSize: 11,
    color: '#7F1D1D',
    lineHeight: 15
  },
  expandedSection: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 10,
    marginBottom: 10
  },
  detailRow: {
    marginBottom: 6
  },
  detailLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600'
  },
  detailValue: {
    fontSize: 11,
    color: '#1E293B',
    marginTop: 1
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4
  },
  expandBtn: {
    paddingVertical: 4
  },
  expandBtnText: {
    fontSize: 11,
    color: '#0284C7',
    fontWeight: '600'
  },
  compareBtn: {
    backgroundColor: '#0284C7',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 6
  },
  compareBtnText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '600'
  }
});
