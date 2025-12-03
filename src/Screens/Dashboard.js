import React, { useContext, useMemo, useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, RefreshControl, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { WalletContext } from '../WalletContext';

const TYPE_COLORS = { stock: '#2e7d32', cripto: '#fbc02d', bdr: '#1565c0', etf: '#7b1fa2' };
const TYPE_LABELS = { stock: 'Ações', cripto: 'Cripto', bdr: 'BDRs', etf: 'ETFs' };

const TIMEFRAMES = [
  { key: 'all', label: 'Início' },
  { key: 'month', label: 'Mês Atual' },
  { key: 'year', label: 'Ano Atual' },
  { key: '12m', label: '1 Ano' },
];

export default function DashboardScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const { positions, transactions, isPrivacyMode, togglePrivacyMode,
    refreshPrices, currentPortfolioValue, lastUpdate } = useContext(WalletContext);

  const [refreshing, setRefreshing] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState('all'); 

  useEffect(() => {
    if (positions.length > 0) {
      refreshPrices();
    }
  }, [positions.length]); 

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshPrices();
    setRefreshing(false);
  }, [refreshPrices]);

  
  const totalInvested = useMemo(() => {
    return positions.reduce((acc, item) => acc + (item.quantity * item.averagePrice), 0);
  }, [positions]);

  const profitValue = currentPortfolioValue - totalInvested;
  
  const profitPercent = totalInvested > 0 ? (profitValue / totalInvested) * 100 : 0;

  
  const getChartLabels = () => {
    const today = new Date();
    const endLabel = `${today.getDate()}/${(today.getMonth() + 1).toString().padStart(2, '0')}`;
    
    let startLabel = "Início";

    switch (selectedTimeframe) {
      case 'month':
        startLabel = `01/${(today.getMonth() + 1).toString().padStart(2, '0')}`;
        break;
      case 'year':
        startLabel = `01/01/${today.getFullYear().toString().slice(-2)}`;
        break;
      case '12m':
        startLabel = `${today.getDate()}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${(today.getFullYear() - 1).toString().slice(-2)}`;
        break;
      case 'all':
      default:
        if (transactions.length > 0) {
          const sorted = [...transactions].sort((a, b) => new Date(a.date) - new Date(b.date));
          const firstDate = new Date(sorted[0].date);
          startLabel = `${firstDate.getDate()}/${(firstDate.getMonth() + 1).toString().padStart(2, '0')}/${firstDate.getFullYear().toString().slice(-2)}`;
        }
        break;
    }

    return [startLabel, endLabel];
  };

  
  const chartColor = (opacity = 1) => {
    if (profitPercent >= 0) return `rgba(46, 125, 50, ${opacity})`; 
    return `rgba(211, 47, 47, ${opacity})`; 
  };

  const chartData = {
    labels: getChartLabels(),
    datasets: [
      {
        data: [0, profitPercent], 
        color: chartColor, 
        strokeWidth: 3
      },
      {
        
        data: [0], 
        withDots: false,
      }
    ]
  };

  const allocationBreakdown = useMemo(() => {
    let breakdown = { stock: 0, bdr: 0, etf: 0, cripto: 0 };
    positions.forEach(p => {
      const val = p.quantity * p.averagePrice; 
      const safeType = breakdown[p.type] !== undefined ? p.type : 'stock';
      breakdown[safeType] += val;
    });
    return Object.keys(breakdown)
      .map(type => ({
        type, value: breakdown[type],
        percent: totalInvested > 0 ? (breakdown[type] / totalInvested) * 100 : 0,
        color: TYPE_COLORS[type], label: TYPE_LABELS[type]
      }))
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value); 
  }, [positions, totalInvested]);

  const formatCurrency = (value) => {
    if (isPrivacyMode) return 'R$ ****';
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <ScrollView 
      style={styles.container} 
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2e7d32']} />}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Olá, Investidor</Text>
          <Text style={styles.subGreeting}>
             {lastUpdate ? `Atualizado: ${new Date(lastUpdate).toLocaleTimeString().slice(0,5)}` : 'Arraste para atualizar'}
          </Text>
        </View>
        <TouchableOpacity onPress={() => togglePrivacyMode(!isPrivacyMode)} style={styles.privacyBtn}>
          <Ionicons name={isPrivacyMode ? "eye-off" : "eye"} size={22} color="#333" />
        </TouchableOpacity>
      </View>

      <View style={styles.mainCard}>
        <Text style={styles.mainCardLabel}>Patrimônio Atual</Text>
        <Text style={styles.mainCardValue}>{formatCurrency(currentPortfolioValue || totalInvested)}</Text>
        
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
            <Text style={{ color: '#ccc', fontSize: 14 }}>Rentabilidade: </Text>
            <Text style={{ 
                color: profitValue >= 0 ? '#4caf50' : '#ff5252', 
                fontWeight: 'bold', fontSize: 16 
            }}>
                {isPrivacyMode ? '****' : `${profitValue >= 0 ? '+' : ''}${profitPercent.toFixed(2)}%`}
            </Text>
        </View>

        {totalInvested > 0 ? (
          <>
            <View style={styles.progressBarContainer}>
              {allocationBreakdown.map(item => (
                <View key={item.type} style={{ width: `${item.percent}%`, backgroundColor: item.color, height: '100%' }} />
              ))}
            </View>
            <View style={styles.legendContainer}>
              {allocationBreakdown.map(item => (
                <View key={item.type} style={styles.legendItem}>
                  <View style={[styles.dot, { backgroundColor: item.color }]} />
                  <Text style={styles.legendText}>{item.label}: {item.percent.toFixed(0)}%</Text>
                </View>
              ))}
            </View>
          </>
        ) : (
            <Text style={styles.emptyCardText}>Faça seu primeiro aporte para ver a alocação.</Text>
        )}
      </View>

      <View style={styles.filtersContainer}>
        {TIMEFRAMES.map((tf) => (
          <TouchableOpacity 
            key={tf.key} 
            style={[styles.filterBtn, selectedTimeframe === tf.key && styles.filterBtnActive]}
            onPress={() => setSelectedTimeframe(tf.key)}
          >
            <Text style={[styles.filterText, selectedTimeframe === tf.key && styles.filterTextActive]}>
              {tf.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

          </View>
          <Text style={styles.actionLabel}>Análise</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Últimas Movimentações</Text>
      {transactions.slice().reverse().slice(0, 5).map((item) => (
        <View key={item.id} style={styles.transactionItem}>
          <View style={[styles.transIconBox, {backgroundColor: item.operation === 'COMPRA' ? '#e8f5e9' : '#ffebee'}]}>
             <Ionicons 
               name={item.operation === 'COMPRA' ? 'arrow-down' : 'arrow-up'} 
               size={18} 
               color={item.operation === 'COMPRA' ? '#2e7d32' : '#d32f2f'} 
             />
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.transTicker}>{item.ticker}</Text>
            <Text style={styles.transType}>{item.type.toUpperCase()}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={[styles.transValue, { color: item.operation === 'COMPRA' ? '#333' : '#d32f2f' }]}>
              {item.operation === 'COMPRA' ? '-' : '+'}{formatCurrency(item.total)}
            </Text>
            <Text style={styles.transDate}>{item.date}</Text>
          </View>
        </View>
      ))}
      {transactions.length === 0 && (
        <Text style={styles.emptyText}>Nenhuma movimentação ainda.</Text>
      )}
      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#fff', paddingBottom: 15 },
  greeting: { fontSize: 22, fontWeight: 'bold', color: '#000' },
  subGreeting: { fontSize: 14, color: '#667' },
  privacyBtn: { padding: 8, backgroundColor: '#f0f0f0', borderRadius: 20 },

  mainCard: { backgroundColor: '#121212', borderRadius: 16, padding: 20, margin: 20, marginTop: 10, elevation: 4 },
  mainCardLabel: { color: '#ccc', fontSize: 14, marginBottom: 5 },
  mainCardValue: { color: '#fff', fontSize: 32, fontWeight: 'bold', marginBottom: 20 },
  emptyCardText: { color: '#667', fontStyle: 'italic', marginBottom: 10 },
  
  progressBarContainer: { flexDirection: 'row', height: 10, borderRadius: 5, overflow: 'hidden', backgroundColor: '#333', marginBottom: 12 },
  legendContainer: { flexDirection: 'row', flexWrap: 'wrap' },
  legendItem: { flexDirection: 'row', alignItems: 'center', marginRight: 15, marginBottom: 5 },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 6 },
  legendText: { color: '#ccc', fontSize: 12, fontWeight: 'bold' },

  actionsRow: { flexDirection: 'row', justifyContent: 'space-between', marginHorizontal: 20, marginBottom: 25 },
  actionBtn: { alignItems: 'center', width: '30%', backgroundColor: '#fff', padding: 15, borderRadius: 12, elevation: 1 },
  iconCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  actionLabel: { fontSize: 12, fontWeight: '600', color: '#333' },

  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#000', marginBottom: 10, marginHorizontal: 20 },
  transactionItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 12, borderRadius: 12, marginBottom: 8, marginHorizontal: 20, elevation: 1 },
  transIconBox: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  transTicker: { fontWeight: 'bold', fontSize: 16, color: '#333' },
  transType: { fontSize: 10, color: '#667', fontWeight: 'bold' },
  transValue: { fontWeight: 'bold', fontSize: 14 },
  transDate: { fontSize: 10, color: '#999' },
  emptyText: { textAlign: 'center', color: '#999', marginTop: 20, fontStyle: 'italic' },
});