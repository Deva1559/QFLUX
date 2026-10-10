import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';

export type ScreenTab =
  | 'overview'
  | 'catalysts'
  | 'compare'
  | 'chemistry'
  | 'prioritization'
  | 'quantum'
  | 'fluorine'
  | 'pathway'
  | 'evidence'
  | 'projects'
  | 'insights'
  | 'reports'
  | 'settings';

interface TabBarProps {
  currentTab: ScreenTab;
  onSelectTab: (tab: ScreenTab) => void;
}

interface TabDef {
  key: ScreenTab;
  label: string;
  icon: string;
}

const TABS: TabDef[] = [
  { key: 'overview', label: 'Overview', icon: '📊' },
  { key: 'catalysts', label: 'Catalysts', icon: '⚗️' },
  { key: 'compare', label: 'Comparison', icon: '⚖️' },
  { key: 'chemistry', label: 'Molecular SCF', icon: '🔬' },
  { key: 'prioritization', label: 'Prioritization', icon: '🎯' },
  { key: 'quantum', label: 'Quantum VQE', icon: '⚛️' },
  { key: 'fluorine', label: 'Fluorine Balance', icon: '🧪' },
  { key: 'pathway', label: 'Pathways', icon: '🧬' },
  { key: 'evidence', label: 'Evidence', icon: '📚' },
  { key: 'projects', label: 'Projects', icon: '📁' },
  { key: 'insights', label: 'Advisor', icon: '💡' },
  { key: 'reports', label: 'Reports', icon: '📑' },
  { key: 'settings', label: 'Settings', icon: '⚙️' }
];

export const TabBar: React.FC<TabBarProps> = ({ currentTab, onSelectTab }) => {
  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        {TABS.map((tab) => {
          const isActive = currentTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => onSelectTab(tab.key)}
              style={[styles.tabItem, isActive && styles.activeTabItem]}
            >
              <Text style={styles.tabIcon}>{tab.icon}</Text>
              <Text style={[styles.tabLabel, isActive && styles.activeTabLabel]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3
  },
  container: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    alignItems: 'center'
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginHorizontal: 3,
    backgroundColor: 'transparent'
  },
  activeTabItem: {
    backgroundColor: '#0284C7'
  },
  tabIcon: {
    fontSize: 14,
    marginRight: 6
  },
  tabLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600'
  },
  activeTabLabel: {
    color: '#FFFFFF',
    fontWeight: '700'
  }
});
