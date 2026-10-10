import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  badge?: string;
  badgeColor?: string;
  subtext?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  unit,
  badge,
  badgeColor = '#0284C7',
  subtext
}) => {
  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <Text style={styles.label}>{label}</Text>
        {badge && (
          <View style={[styles.badge, { borderColor: badgeColor, backgroundColor: badgeColor + '15' }]}>
            <Text style={[styles.badgeText, { color: badgeColor }]}>{badge}</Text>
          </View>
        )}
      </View>

      <View style={styles.valueRow}>
        <Text style={styles.value}>{value}</Text>
        {unit && <Text style={styles.unit}>{unit}</Text>}
      </View>

      {subtext && <Text style={styles.subtext}>{subtext}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flex: 1,
    minWidth: 140,
    margin: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6
  },
  label: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4
  },
  badge: {
    paddingVertical: 1,
    paddingHorizontal: 5,
    borderRadius: 4,
    borderWidth: 1
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700'
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline'
  },
  value: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A'
  },
  unit: {
    fontSize: 12,
    color: '#64748B',
    marginLeft: 4,
    fontWeight: '600'
  },
  subtext: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 4
  }
});
