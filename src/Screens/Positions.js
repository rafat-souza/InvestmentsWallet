import React, { useContext } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { WalletContext } from '../WalletContext';
import AssetCard from '../components/AssetCard'; 

export default function PositionsScreen() {
  const { positions, isPrivacyMode } = useContext(WalletContext);

  const renderItem = ({ item }) => (
    <AssetCard item={item} isPrivacyMode={isPrivacyMode} />
  );

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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { padding: 20, backgroundColor: '#fff', paddingBottom: 15 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#000' },
  headerSubtitle: { fontSize: 14, color: '#667' },
  listContent: { padding: 15 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50 },
  emptyText: { fontSize: 18, color: '#667', marginTop: 20, fontWeight: 'bold' },
  emptySub: { fontSize: 14, color: '#999', marginTop: 5 }
});