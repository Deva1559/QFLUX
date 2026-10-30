import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuth } from '../services/auth';

interface HeaderProps {
  title: string;
  subtitle?: string;
  activeProjectTitle?: string;
  isBackendConnected: boolean;
  onRefresh?: () => void;
  onOpenAuth?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  activeProjectTitle,
  isBackendConnected,
  onRefresh,
  onOpenAuth
}) => {
  const { user, isAuthenticated, logout } = useAuth();
  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.brandContainer}>
          <Text style={styles.brandIcon}>⚛️</Text>
          <View>
            <Text style={styles.brandText}>Q-FLUX</Text>
            <Text style={styles.brandTagline}>Quantum PFAS Destruction Workbench</Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {isAuthenticated && user ? (
            <TouchableOpacity onPress={logout} style={styles.authBadge}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>
                  {user.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
                </Text>
              </View>
              <Text style={styles.authBadgeText} numberOfLines={1}>
                Sign Out
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={onOpenAuth} style={styles.signInBtn}>
              <Text style={styles.signInBtnText}>Sign In</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity onPress={onRefresh} style={styles.statusBadge}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: isBackendConnected ? '#10B981' : '#EF4444' }
              ]}
            />
            <Text style={styles.statusText}>
              {isBackendConnected ? 'Online' : 'Offline'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.titleSection}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>

      {activeProjectTitle && (
        <View style={styles.projectPill}>
          <Text style={styles.projectLabel}>Active Study:</Text>
          <Text style={styles.projectName} numberOfLines={1}>
            {activeProjectTitle}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    paddingTop: 16,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  brandIcon: {
    fontSize: 24,
    marginRight: 8
  },
  brandText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0284C7',
    letterSpacing: 0.5
  },
  brandTagline: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '500'
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6
  },
  statusText: {
    fontSize: 11,
    color: '#334155',
    fontWeight: '600'
  },
  signInBtn: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    backgroundColor: '#0284C7',
    borderRadius: 12
  },
  signInBtnText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '700'
  },
  authBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F1F5F9',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  avatarCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#0284C7',
    alignItems: 'center',
    justifyContent: 'center'
  },
  avatarText: {
    fontSize: 9,
    color: '#FFFFFF',
    fontWeight: '800'
  },
  authBadgeText: {
    fontSize: 11,
    color: '#BE123C',
    fontWeight: '700'
  },
  titleSection: {
    marginBottom: 6
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A'
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2
  },
  projectPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 6,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#BAE6FD'
  },
  projectLabel: {
    fontSize: 11,
    color: '#0284C7',
    fontWeight: '700',
    marginRight: 6
  },
  projectName: {
    fontSize: 11,
    color: '#0F172A',
    fontWeight: '600',
    flex: 1
  }
});
