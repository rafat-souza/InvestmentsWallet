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
  const { positions, transactions, isPrivacyMode, togglePrivacyMode, refreshPrices, currentPortfolioValue, lastUpdate } = useContext(WalletContext);

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

  const formatCurrency = (value) => {
    if (isPrivacyMode) return 'R$ ****';
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const formatPercent = (value) => {
    if (isPrivacyMode) return '****';
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  const getProfitColor = (val) => val >= 0 ? '#4caf50' : '#f44336';

  const allocationBreakdown = useMemo(() => {
    let breakdown = { stock: 0, bdr: 0, etf: 0, cripto: 0 };
    positions.forEach(p => {
      const currentPrice = p.currentPrice || p.averagePrice;
      const val = p.quantity * currentPrice; 
      
      const type = (p.type === 'bdr' || p.type === 'etf' || p.type === 'cripto') ? p.type : 'stock';
      if (breakdown[type] !== undefined) breakdown[type] += val;
    });

    const total = Object.values(breakdown).reduce((a, b) => a + b, 0);
    
    return Object.keys(breakdown)
      .map(type => ({
        type, value: breakdown[type],
        percent: total > 0 ? (breakdown[type] / total) * 100 : 0,
        color: TYPE_COLORS[type], label: TYPE_LABELS[type]
      }))
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value); 
  }, [positions, currentPortfolioValue]);

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

      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Evolução da Rentabilidade (%)</Text>
        
        {positions.length > 0 ? (
          <LineChart
            data={chartData}
            width={width - 40} 
            height={220}
            yAxisSuffix="%"
            chartConfig={{
              backgroundColor: "#fff",
              backgroundGradientFrom: "#fff",
              backgroundGradientTo: "#fff",
              decimalPlaces: 1,
              color: (opacity = 1) => `rgba(100, 100, 100, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(100, 100, 100, ${opacity})`,
              propsForDots: { r: "5", strokeWidth: "2", stroke: profitPercent >= 0 ? "#2e7d32" : "#d32f2f" },
              propsForBackgroundLines: { strokeDasharray: "" } 
            }}
            bezier
            style={{ marginVertical: 8, borderRadius: 16 }}
            fromZero={true} 
            withInnerLines={true}
            withOuterLines={true}
          />
        ) : (
          <View style={styles.loadingBox}>
            <Text style={styles.emptyText}>Adicione ativos para ver o gráfico.</Text>
          </View>
        )}
      </View>

      <Text style={styles.sectionTitle}>Rentabilidade por Ativo</Text>
      {positions.length === 0 ? (
        <Text style={styles.emptyText}>Nenhum ativo na carteira.</Text>
      ) : (
        positions.map((pos) => {
          const currentP = pos.currentPrice || pos.averagePrice;
          const gain = pos.averagePrice > 0 ? ((currentP - pos.averagePrice) / pos.averagePrice) * 100 : 0;
          
          return (
            <View key={pos.ticker} style={styles.assetRow}>
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <View style={[styles.colorIndicator, {backgroundColor: TYPE_COLORS[pos.type] || TYPE_COLORS['stock']}]} />
                <View>
                  <Text style={styles.assetTicker}>{pos.ticker}</Text>
                  <Text style={styles.assetSub}>Preço Médio: {formatCurrency(pos.averagePrice)}</Text>
                </View>
              </View>
              <View style={{alignItems: 'flex-end'}}>
                <Text style={{ fontWeight: 'bold', color: getProfitColor(gain), fontSize: 16 }}>
                  {formatPercent(gain)}
                </Text>
              </View>
            </View>
          );
        })
      )}
      
      <View style={{ height: 40 }} />
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
  mainCardValue: { color: '#fff', fontSize: 32, fontWeight: 'bold', marginBottom: 5 },
  emptyCardText: { color: '#fff', fontStyle: 'italic', marginBottom: 10, textAlign: 'center', marginTop: 20 }, // Cor ajustada para branco

  progressBarContainer: { flexDirection: 'row', height: 10, borderRadius: 5, overflow: 'hidden', backgroundColor: '#333', marginBottom: 12, marginTop: 10 },
  legendContainer: { flexDirection: 'row', flexWrap: 'wrap' },
  legendItem: { flexDirection: 'row', alignItems: 'center', marginRight: 15, marginBottom: 5 },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 6 },
  legendText: { color: '#ccc', fontSize: 12, fontWeight: 'bold' },
  
  filtersContainer: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 15 },
  filterBtn: { backgroundColor: '#fff', paddingVertical: 8, paddingHorizontal: 15, borderRadius: 20, borderWidth: 1, borderColor: '#eee' },
  filterBtnActive: { backgroundColor: '#2e7d32', borderColor: '#2e7d32' },
  filterText: { fontSize: 12, color: '#666', fontWeight: '600' },
  filterTextActive: { color: '#fff' },
  
  chartCard: { backgroundColor: '#fff', borderRadius: 16, padding: 10, marginHorizontal: 20, marginBottom: 25, elevation: 2, alignItems: 'center', minHeight: 250 },
  chartTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 10, alignSelf: 'flex-start', marginLeft: 10 },
  loadingBox: { height: 180, justifyContent: 'center', alignItems: 'center' },
  
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#000', marginBottom: 10, marginHorizontal: 20 },
  
  assetRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 15, marginHorizontal: 20, marginBottom: 10, borderRadius: 12, elevation: 1 },
  colorIndicator: { width: 4, height: 30, borderRadius: 2, marginRight: 12 },
  assetTicker: { fontWeight: 'bold', fontSize: 16, color: '#333' },
  assetSub: { fontSize: 12, color: '#888' },
  
  emptyText: { textAlign: 'center', color: '#999', marginTop: 10, fontStyle: 'italic', paddingHorizontal: 20 },
});