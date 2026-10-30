import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert
} from 'react-native';
import { useAuth } from '../services/auth';
import { getApiBaseUrl } from '../services/api';

interface AuthScreenProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  onNavigateToSettings?: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  onSuccess,
  onCancel,
  onNavigateToSettings
}) => {
  const { login, register, isLoading, error, clearError } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('Researcher');
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setValidationError(null);
    clearError();

    if (!email.trim() || !email.includes('@')) {
      setValidationError('Please enter a valid academic/lab email address.');
      return;
    }
    if (!password || password.length < 6) {
      setValidationError('Password must be at least 6 characters.');
      return;
    }

    if (mode === 'register' && !fullName.trim()) {
      setValidationError('Please enter your full name and scientific title.');
      return;
    }

    try {
      if (mode === 'login') {
        await login(email.trim(), password);
      } else {
        await register(email.trim(), password, fullName.trim(), role);
      }
      if (onSuccess) onSuccess();
    } catch {
      // Error handled by AuthContext error state
    }
  };

  const handleUseDemo = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setValidationError(null);
    clearError();
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.brandIcon}>⚛️</Text>
          <Text style={styles.title}>
            {mode === 'login' ? 'Collaborator Sign In' : 'Register Account'}
          </Text>
          <Text style={styles.subtitle}>
            {mode === 'login'
              ? 'Sign in to access protected PFAS degradation tools, upload literature, and trigger calculation jobs.'
              : 'Join the Q-FLUX 2.0 collaborative scientific research network.'}
          </Text>
        </View>

        {/* Backend Endpoint Indicator */}
        <View style={styles.endpointCard}>
          <View style={styles.endpointRow}>
            <Text style={styles.endpointLabel}>Connecting to API:</Text>
            <Text style={styles.endpointUrl} numberOfLines={1}>
              {getApiBaseUrl()}
            </Text>
          </View>
          {onNavigateToSettings && (
            <TouchableOpacity onPress={onNavigateToSettings} style={styles.changeEndpointBtn}>
              <Text style={styles.changeEndpointText}>Change in Settings</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Mode Switcher */}
        <View style={styles.tabSwitcher}>
          <TouchableOpacity
            style={[styles.tabBtn, mode === 'login' && styles.tabBtnActive]}
            onPress={() => {
              setMode('login');
              setValidationError(null);
              clearError();
            }}
          >
            <Text style={[styles.tabText, mode === 'login' && styles.tabTextActive]}>
              Sign In
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, mode === 'register' && styles.tabBtnActive]}
            onPress={() => {
              setMode('register');
              setValidationError(null);
              clearError();
            }}
          >
            <Text style={[styles.tabText, mode === 'register' && styles.tabTextActive]}>
              Create Account
            </Text>
          </TouchableOpacity>
        </View>

        {/* Error Banner */}
        {(error || validationError) && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{validationError || error}</Text>
          </View>
        )}

        {/* Form Inputs */}
        <View style={styles.form}>
          {mode === 'register' && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name & Scientific Title *</Text>
              <TextInput
                style={styles.input}
                placeholder="Dr. Elena Vance"
                placeholderTextColor="#94A3B8"
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
              />
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Academic / Lab Email *</Text>
            <TextInput
              style={styles.input}
              placeholder="researcher@qflux.org"
              placeholderTextColor="#94A3B8"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password *</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor="#94A3B8"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          {mode === 'register' && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Role Selection</Text>
              <View style={styles.rolePickerRow}>
                {['Researcher', 'Project Collaborator', 'Project Owner'].map((r) => (
                  <TouchableOpacity
                    key={r}
                    style={[styles.roleChip, role === r && styles.roleChipActive]}
                    onPress={() => setRole(r)}
                  >
                    <Text style={[styles.roleChipText, role === r && styles.roleChipTextActive]}>
                      {r === 'Researcher' ? 'Chemist' : r === 'Project Owner' ? 'PI' : 'Collaborator'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitBtn, isLoading && { opacity: 0.7 }]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.submitBtnText}>
                {mode === 'login' ? 'Sign In to Workbench' : 'Register Account'}
              </Text>
            )}
          </TouchableOpacity>

          {/* Quick Demo Credentials Assistant */}
          {mode === 'login' && (
            <View style={styles.demoCard}>
              <Text style={styles.demoHeader}>Pre-Configured Accounts for Testing:</Text>
              <View style={styles.demoBtnRow}>
                <TouchableOpacity
                  style={styles.demoBtn}
                  onPress={() => handleUseDemo('researcher@qflux.org', 'ResearchLab2026!')}
                >
                  <Text style={styles.demoBtnText}>Researcher (Elena Vance)</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.demoBtn}
                  onPress={() => handleUseDemo('admin@qflux.org', 'QFluxAdmin2026!')}
                >
                  <Text style={styles.demoBtnText}>Project PI (Dr. Thorne)</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Cancel / Dismiss */}
          {onCancel && (
            <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
              <Text style={styles.cancelBtnText}>Back to Dashboard</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC'
  },
  container: {
    padding: 24,
    paddingTop: 36
  },
  header: {
    alignItems: 'center',
    marginBottom: 20
  },
  brandIcon: {
    fontSize: 40,
    marginBottom: 10
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 16
  },
  endpointCard: {
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 10,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  endpointRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  endpointLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '700'
  },
  endpointUrl: {
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#0284C7',
    fontWeight: '600'
  },
  changeEndpointBtn: {
    marginTop: 6,
    alignSelf: 'flex-end'
  },
  changeEndpointText: {
    fontSize: 11,
    color: '#0284C7',
    fontWeight: '700'
  },
  tabSwitcher: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 10,
    padding: 4,
    marginBottom: 18
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: 8
  },
  tabBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B'
  },
  tabTextActive: {
    color: '#0284C7'
  },
  errorBanner: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16
  },
  errorText: {
    color: '#991B1B',
    fontSize: 12,
    fontWeight: '600'
  },
  form: {
    gap: 14
  },
  inputGroup: {
    gap: 6
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155'
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A'
  },
  rolePickerRow: {
    flexDirection: 'row',
    gap: 8
  },
  roleChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center'
  },
  roleChipActive: {
    borderColor: '#0284C7',
    backgroundColor: '#E0F2FE'
  },
  roleChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B'
  },
  roleChipTextActive: {
    color: '#0284C7',
    fontWeight: '700'
  },
  submitBtn: {
    backgroundColor: '#0284C7',
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 6,
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700'
  },
  demoCard: {
    marginTop: 10,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  demoHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 8,
    textTransform: 'uppercase'
  },
  demoBtnRow: {
    flexDirection: 'row',
    gap: 8
  },
  demoBtn: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    alignItems: 'center'
  },
  demoBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0284C7'
  },
  cancelBtn: {
    paddingVertical: 10,
    alignItems: 'center'
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B'
  }
});
