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

export default function Positions() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Lista de Ativos (Ações, Cripto, etc)</Text>
    </View>
  );
}