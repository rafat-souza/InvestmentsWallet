import React, { useContext } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { WalletContext } from '../WalletContext';

export default function PositionsScreen() {
  const { positions, isPrivacyMode } = useContext(WalletContext);

  const formatCurrency = (value) => {
    if (isPrivacyMode) return 'R$ ****';
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const renderItem = ({ item }) => {
    const totalInvested = item.quantity * item.averagePrice;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.tickerRow}>
            <View style={[styles.iconBox, getTypeStyle(item.type)]}>
              <Ionicons name={getIcon(item.type)} size={20} color="#fff" />
            </View>
            <View>
              <Text style={styles.ticker}>{item.ticker}</Text>
              <Text style={styles.typeLabel}>{item.type.toUpperCase()}</Text>
            </View>
          </View>
          <Text style={styles.quantity}>{item.quantity} un</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.statsRow}>
          <View>
            <Text style={styles.label}>Preço Médio</Text>
            <Text style={styles.value}>{formatCurrency(item.averagePrice)}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.label}>Custo Total</Text>
            <Text style={styles.valueBold}>{formatCurrency(totalInvested)}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Minhas Posições</Text>
        <Text style={styles.headerSubtitle}>{positions.length} ativos na carteira</Text>
      </View>

      {positions.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="wallet-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>Sua carteira está vazia.</Text>
          <Text style={styles.emptySub}>Comece cadastrando um aporte na aba "+".</Text>
        </View>
      ) : (
        <FlatList
          data={positions}
          keyExtractor={(item) => item.ticker}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const getIcon = (type) => {
  switch (type) {
    case 'cripto': return 'logo-bitcoin';
    case 'bdr': return 'globe';
    case 'etf': return 'layers';
    default: return 'business';
  }
};

const getTypeStyle = (type) => {
  switch (type) {
    case 'cripto': return { backgroundColor: '#fbc02d' }; 
    case 'bdr': return { backgroundColor: '#1976d2' }; 
    case 'etf': return { backgroundColor: '#7b1fa2' }; 
    default: return { backgroundColor: '#2e7d32' }; 
  }
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { padding: 20, backgroundColor: '#fff', paddingBottom: 15 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#000' },
  headerSubtitle: { fontSize: 14, color: '#667' },
  
  listContent: { padding: 15 },
  
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 15, marginBottom: 15, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, shadowOffset: { width: 0, height: 2 } },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tickerRow: { flexDirection: 'row', alignItems: 'center' },
  iconBox: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  ticker: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  typeLabel: { fontSize: 10, color: '#888', fontWeight: 'bold' },
  quantity: { fontSize: 16, fontWeight: '500', color: '#333' },
  
  divider: { height: 1, backgroundColor: '#f0f0f0', marginVertical: 12 },
  
  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  label: { fontSize: 12, color: '#888', marginBottom: 2 },
  value: { fontSize: 16, color: '#333' },
  valueBold: { fontSize: 16, color: '#000', fontWeight: 'bold' },

  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50 },
  emptyText: { fontSize: 18, color: '#667', marginTop: 20, fontWeight: 'bold' },
  emptySub: { fontSize: 14, color: '#999', marginTop: 5 }
});