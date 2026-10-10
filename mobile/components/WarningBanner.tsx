import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface WarningBannerProps {
  type?: 'warning' | 'info' | 'critical';
  title?: string;
  message: string;
}

export const WarningBanner: React.FC<WarningBannerProps> = ({
  type = 'warning',
  title,
  message
}) => {
  const getColors = () => {
    switch (type) {
      case 'critical':
        return { bg: '#FEF2F2', border: '#F87171', text: '#991B1B', icon: '🚨' };
      case 'info':
        return { bg: '#F0F9FF', border: '#38BDF8', text: '#0369A1', icon: 'ℹ️' };
      default:
        return { bg: '#FFFBEB', border: '#FCD34D', text: '#92400E', icon: '⚠️' };
    }
  };

  const c = getColors();

  return (
    <View style={[styles.container, { backgroundColor: c.bg, borderColor: c.border }]}>
      <Text style={styles.icon}>{c.icon}</Text>
      <View style={styles.textContainer}>
        {title && <Text style={[styles.title, { color: c.text }]}>{title}</Text>}
        <Text style={[styles.message, { color: c.text }]}>{message}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
    marginVertical: 8,
    alignItems: 'flex-start'
  },
  icon: {
    fontSize: 16,
    marginRight: 10,
    marginTop: 2
  },
  textContainer: {
    flex: 1
  },
  title: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2
  },
  message: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '500'
  }
});
