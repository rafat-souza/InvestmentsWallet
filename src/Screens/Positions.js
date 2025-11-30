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
