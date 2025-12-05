import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const getIcon = (type) => {
  switch (type) {
    case 'bdr': return 'globe';
    case 'etf': return 'layers';
    default: return 'business'; 
  }
};

const getTypeStyle = (type) => {
  switch (type) {
    case 'bdr': return { backgroundColor: '#1565c0' }; 
    case 'etf': return { backgroundColor: '#7b1fa2' }; 
    default: return { backgroundColor: '#2e7d32' }; 
  }
};

export default function AssetCard({ item, isPrivacyMode }) {
  const priceToUse = item.currentPrice || item.averagePrice;
  const currentTotalValue = item.quantity * priceToUse;

  const formatCurrency = (value) => {
    if (isPrivacyMode) return 'R$ ****';
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.tickerRow}>
          <View style={[styles.iconBox, getTypeStyle(item.type)]}>
            <Ionicons name={getIcon(item.type)} size={20} color="#fff" />
          </View>
          <View>
            <Text style={styles.ticker}>{item.ticker}</Text>
            <Text style={styles.typeLabel}>{item.type === 'stock' ? 'AÇÃO' : item.type.toUpperCase()}</Text>
          </View>
        </View>
        <Text style={styles.quantity}>{item.quantity} un</Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.statsRow}>
        <View>
          <Text style={styles.label}>Preço Médio</Text>
          <Text style={styles.value}>{formatCurrency(priceToUse)}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.label}>Valor em Carteira</Text>
          <Text style={styles.valueBold}>{formatCurrency(currentTotalValue)}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
});