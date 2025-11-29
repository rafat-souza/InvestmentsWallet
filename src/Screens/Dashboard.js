import React, { useContext } from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { WalletContext } from '../WalletContext';

export default function Dashboard() {
  const { isPrivacyMode } = useContext(WalletContext);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Patrimônio Total</Text>
      <Text style={styles.amount}>
        {isPrivacyMode ? 'R$ ****' : 'R$ 0,00'}
      </Text>
      <Text style={styles.subtitle}>Visão Geral da Carteira</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' },
  title: { fontSize: 18, color: '#667' },
  amount: { fontSize: 32, fontWeight: 'bold', color: '#000', marginVertical: 10 },
  subtitle: { fontSize: 14, color: '#888' },
});