import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Linking
} from 'react-native';
import { ReportItem } from '../types';
import { api } from '../services/api';

interface ReportsScreenProps {
  activeProjectId?: number;
}

export const ReportsScreen: React.FC<ReportsScreenProps> = ({ activeProjectId }) => {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [title, setTitle] = useState('');
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadReports();
  }, [activeProjectId]);

  const loadReports = async () => {
    setLoading(true);
    try {
      const data = await api.getReports(activeProjectId);
      setReports(data);
    } catch (_) {
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!activeProjectId) {
      Alert.alert('No Active Project', 'Please select a research project first.');
      return;
    }
    setGenerating(true);
    try {
      const rep = await api.generateReport(
        activeProjectId,
        title.trim() ? title.trim() : undefined
      );
      Alert.alert('Report Generated', `PDF Dossier successfully compiled (${(rep.file_size_bytes / 1024).toFixed(1)} KB).`);
      setTitle('');
      loadReports();
    } catch (e: any) {
      Alert.alert('Report Generation Error', e.message || 'Failed to generate PDF report');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = (report: ReportItem) => {
    const url = api.getReportDownloadUrl(report.id);
    Linking.openURL(url).catch(() => {
      Alert.alert('Download Link', `Open the following URL in browser: ${url}`);
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.sectionHeader}>RESEARCH DOSSIER & PDF REPORT EXPORTER</Text>

      {/* Generate Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>GENERATE COMPREHENSIVE PDF DOSSIER</Text>
        <Text style={styles.cardDesc}>
          Compiles active project metadata, literature evidence tables, quantum benchmark runs (with explicit toy model warnings), fluorine mass-balance calculations, and recommended experiments into a publication-grade ReportLab PDF.
        </Text>

        <Text style={styles.inputLabel}>Custom Dossier Subtitle (optional)</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="e.g., PFOA Milestone 1 Evidence Review"
          placeholderTextColor="#64748B"
        />

        <TouchableOpacity
          style={[styles.genButton, generating && { opacity: 0.7 }]}
          onPress={handleGenerate}
          disabled={generating}
        >
          {generating ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.genButtonText}>📄 Compile & Generate PDF Dossier</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* List of Reports */}
      <Text style={styles.sectionHeader}>SAVED REPORTS ({reports.length})</Text>

      {loading && <ActivityIndicator color="#38BDF8" style={{ marginVertical: 12 }} />}

      {reports.map((rep) => (
        <View key={rep.id} style={styles.reportCard}>
          <View style={styles.reportTopRow}>
            <Text style={styles.reportTitle}>{rep.report_title}</Text>
            <View style={styles.pdfBadge}>
              <Text style={styles.pdfBadgeText}>PDF</Text>
            </View>
          </View>

          <Text style={styles.fileDetail}>Filename: {rep.pdf_filename}</Text>
          <Text style={styles.fileDetail}>
            Size: {(rep.file_size_bytes / 1024).toFixed(1)} KB | Generated:{' '}
            {new Date(rep.generated_at).toLocaleString()}
          </Text>

          <TouchableOpacity
            style={styles.downloadButton}
            onPress={() => handleDownload(rep)}
          >
            <Text style={styles.downloadButtonText}>⬇️ Download / Open PDF Dossier</Text>
          </TouchableOpacity>
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
    marginBottom: 8,
    marginTop: 6
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 16,
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
    marginBottom: 6
  },
  cardDesc: {
    fontSize: 11,
    color: '#475569',
    lineHeight: 16,
    marginBottom: 10
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 4
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
    marginBottom: 10
  },
  genButton: {
    backgroundColor: '#0284C7',
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2
  },
  genButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13
  },
  reportCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1
  },
  reportTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4
  },
  reportTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
    marginRight: 8
  },
  pdfBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  pdfBadgeText: {
    color: '#991B1B',
    fontSize: 9,
    fontWeight: '800'
  },
  fileDetail: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 2
  },
  downloadButton: {
    backgroundColor: '#F0F9FF',
    borderColor: '#BAE6FD',
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 8,
    alignItems: 'center',
    marginTop: 8
  },
  downloadButtonText: {
    fontSize: 12,
    color: '#0284C7',
    fontWeight: '700'
  }
});
