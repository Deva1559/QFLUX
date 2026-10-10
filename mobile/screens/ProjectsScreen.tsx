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
import { Project } from '../types';
import { api } from '../services/api';

interface ProjectsScreenProps {
  projects: Project[];
  activeProject: Project | null;
  onSelectProject: (p: Project) => void;
  onRefresh: () => void;
}

export const ProjectsScreen: React.FC<ProjectsScreenProps> = ({
  projects,
  activeProject,
  onSelectProject,
  onRefresh
}) => {
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [targetPfas, setTargetPfas] = useState('PFOA (perfluorooctanoic acid)');
  const [researchQuestion, setResearchQuestion] = useState('');
  const [destructionApproach, setDestructionApproach] = useState('Electrochemical Oxidation');
  const [submitting, setSubmitting] = useState(false);

  const handleCreate = async () => {
    if (!title.trim() || !researchQuestion.trim()) {
      Alert.alert('Required Fields', 'Please enter a project title and research question.');
      return;
    }
    setSubmitting(true);
    try {
      const created = await api.createProject({
        title,
        target_pfas: targetPfas,
        research_question: researchQuestion,
        destruction_approach: destructionApproach,
        status: 'Active'
      });
      setShowCreate(false);
      setTitle('');
      setResearchQuestion('');
      onSelectProject(created);
      onRefresh();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to create project');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionHeader}>RESEARCH PROJECTS ({projects.length})</Text>
        <TouchableOpacity
          style={styles.newButton}
          onPress={() => setShowCreate(!showCreate)}
        >
          <Text style={styles.newButtonText}>
            {showCreate ? '✕ Cancel' : '+ New Project'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Project Creation Form */}
      {showCreate && (
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Create Research Study</Text>
          
          <Text style={styles.inputLabel}>Project Title *</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="e.g., PFOS Sonochemical Defluorination Benchmarking"
            placeholderTextColor="#64748B"
          />

          <Text style={styles.inputLabel}>Target PFAS Compound</Text>
          <TextInput
            style={styles.input}
            value={targetPfas}
            onChangeText={setTargetPfas}
            placeholder="e.g., PFOA, PFOS, GenX"
            placeholderTextColor="#64748B"
          />

          <Text style={styles.inputLabel}>Core Research Question *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={researchQuestion}
            onChangeText={setResearchQuestion}
            placeholder="What exact bond transformation or fluorine balance are you investigating?"
            placeholderTextColor="#64748B"
            multiline
            numberOfLines={3}
          />

          <Text style={styles.inputLabel}>Destruction Approach</Text>
          <TextInput
            style={styles.input}
            value={destructionApproach}
            onChangeText={setDestructionApproach}
            placeholder="e.g., Photochemical, Electrochemical, Plasma"
            placeholderTextColor="#64748B"
          />

          <TouchableOpacity
            style={[styles.submitButton, submitting && { opacity: 0.6 }]}
            onPress={handleCreate}
            disabled={submitting}
          >
            <Text style={styles.submitButtonText}>
              {submitting ? 'Creating Project...' : 'Save & Select Project'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Projects List */}
      {projects.map((p) => {
        const isSelected = activeProject?.id === p.id;
        return (
          <TouchableOpacity
            key={p.id}
            style={[styles.projectCard, isSelected && styles.selectedProjectCard]}
            onPress={() => onSelectProject(p)}
          >
            <View style={styles.cardTopRow}>
              <Text style={styles.projectTitle}>{p.title}</Text>
              <View style={[styles.badge, isSelected && styles.activeBadge]}>
                <Text style={[styles.badgeText, isSelected && styles.activeBadgeText]}>
                  {isSelected ? 'ACTIVE' : p.status}
                </Text>
              </View>
            </View>

            <Text style={styles.detailRow}>
              <Text style={styles.bold}>Analyte: </Text>
              {p.target_pfas}
            </Text>
            <Text style={styles.detailRow}>
              <Text style={styles.bold}>Question: </Text>
              {p.research_question}
            </Text>
            {p.destruction_approach && (
              <Text style={styles.detailRow}>
                <Text style={styles.bold}>Method: </Text>
                {p.destruction_approach}
              </Text>
            )}

            <View style={styles.cardFooter}>
              <Text style={styles.dateText}>
                Created: {new Date(p.created_at).toLocaleDateString()}
              </Text>
              <Text style={[styles.selectText, isSelected && { color: '#0284C7' }]}>
                {isSelected ? '✓ Currently Active' : 'Tap to Activate'}
              </Text>
            </View>
          </TouchableOpacity>
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
    marginBottom: 12
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 0.8
  },
  newButton: {
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
  newButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF'
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
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
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12
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
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: '#0F172A',
    fontSize: 13,
    marginBottom: 10
  },
  textArea: {
    height: 70,
    textAlignVertical: 'top'
  },
  submitButton: {
    backgroundColor: '#10B981',
    paddingVertical: 10,
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
    fontSize: 13
  },
  projectCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1
  },
  selectedProjectCard: {
    borderColor: '#0284C7',
    backgroundColor: '#F0F9FF'
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6
  },
  projectTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
    marginRight: 8
  },
  badge: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    backgroundColor: '#F1F5F9'
  },
  activeBadge: {
    backgroundColor: '#E0F2FE'
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569'
  },
  activeBadgeText: {
    color: '#0369A1'
  },
  detailRow: {
    fontSize: 12,
    color: '#475569',
    marginBottom: 4,
    lineHeight: 16
  },
  bold: {
    fontWeight: '700',
    color: '#0F172A'
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0'
  },
  dateText: {
    fontSize: 11,
    color: '#64748B'
  },
  selectText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600'
  }
});
