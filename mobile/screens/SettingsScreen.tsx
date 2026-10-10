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
import { getApiBaseUrl, setApiBaseUrl, api } from '../services/api';

interface SettingsScreenProps {
  onRefresh: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onRefresh }) => {
  const [url, setUrl] = useState(getApiBaseUrl());
  const [seeding, setSeeding] = useState(false);

  const handleSaveUrl = () => {
    setApiBaseUrl(url);
    Alert.alert('Configuration Saved', `API Endpoint updated to: ${url}`);
    onRefresh();
  };

  const handleSetEmulator = () => {
    const emu = 'http://10.0.2.2:8000';
    setUrl(emu);
    setApiBaseUrl(emu);
    Alert.alert('Emulator Mode', 'Set API URL to 10.0.2.2:8000 (standard Android emulator loopback).');
    onRefresh();
  };

  const handleSetLocalhost = () => {
    const loc = 'http://localhost:8000';
    setUrl(loc);
    setApiBaseUrl(loc);
    Alert.alert('Localhost Mode', 'Set API URL to localhost:8000 (web / desktop).');
    onRefresh();
  };

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const res = await api.triggerSeed();
      Alert.alert('Database Seeded', res.message || 'Sample data loaded.');
      onRefresh();
    } catch (e: any) {
      Alert.alert('Seed Error', e.message || 'Failed to seed database');
    } finally {
      setSeeding(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.sectionHeader}>APPLICATION & ENVIRONMENT SETTINGS</Text>

      {/* Backend API Configuration */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>FASTAPI BACKEND CONNECTION</Text>
        <Text style={styles.cardDesc}>
          Configure the REST API endpoint. For Android Emulator, use 10.0.2.2:8000. For physical phones, use your computer's LAN IP address.
        </Text>

        <Text style={styles.inputLabel}>API Base URL</Text>
        <TextInput
          style={styles.input}
          value={url}
          onChangeText={setUrl}
          placeholder="http://localhost:8000"
          placeholderTextColor="#64748B"
        />

        <View style={styles.btnRow}>
          <TouchableOpacity style={styles.smallBtn} onPress={handleSetLocalhost}>
            <Text style={styles.smallBtnText}>Web (localhost)</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.smallBtn} onPress={handleSetEmulator}>
            <Text style={styles.smallBtnText}>Android Emulator (10.0.2.2)</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSaveUrl}>
          <Text style={styles.saveBtnText}>Save Connection URL</Text>
        </TouchableOpacity>
      </View>

      {/* Database & Seed Control */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>LOCAL SQLITE DATABASE</Text>
        <Text style={styles.cardDesc}>
          Storage Engine: SQLite 3 (backend/q_flux.db). Persists projects, quantum runs, evidence records, and PDF report metadata locally without external containers or cloud requirements.
        </Text>

        <TouchableOpacity
          style={[styles.seedBtn, seeding && { opacity: 0.7 }]}
          onPress={handleSeed}
          disabled={seeding}
        >
          <Text style={styles.seedBtnText}>
            {seeding ? 'Reloading...' : '🔄 Reload Verified Literature Seed Data'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Scientific Governance & Metadata */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>SYSTEM METADATA</Text>
        <Text style={styles.metaLine}>
          <Text style={styles.bold}>Prototype: </Text>Q-FLUX v1.0.0
        </Text>
        <Text style={styles.metaLine}>
          <Text style={styles.bold}>Hackathon Theme: </Text>Quantum in Biotechnology & Chemistry
        </Text>
        <Text style={styles.metaLine}>
          <Text style={styles.bold}>Quantum Engine: </Text>Statevector Variational Quantum Eigensolver (VQE)
        </Text>
        <Text style={styles.metaLine}>
          <Text style={styles.bold}>Containerization: </Text>Prohibited (Native Virtualenv + Expo)
        </Text>
        <Text style={styles.metaLine}>
          <Text style={styles.bold}>Primary Literature Anchor: </Text>Smith et al. (2024), ES&T, DOI: 10.1021/acs.est.3c10617
        </Text>
      </View>
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
    marginBottom: 8
  },
  btnRow: {
    flexDirection: 'row',
    marginBottom: 8
  },
  smallBtn: {
    backgroundColor: '#F1F5F9',
    borderColor: '#CBD5E1',
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginRight: 6
  },
  smallBtnText: {
    fontSize: 10,
    color: '#334155',
    fontWeight: '600'
  },
  saveBtn: {
    backgroundColor: '#0284C7',
    paddingVertical: 9,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 4,
    shadowColor: '#0284C7',
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
  seedBtn: {
    backgroundColor: '#10B981',
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2
  },
  seedBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12
  },
  metaLine: {
    fontSize: 11,
    color: '#475569',
    marginBottom: 4,
    lineHeight: 16
  },
  bold: {
    fontWeight: '700',
    color: '#0F172A'
  }
});
