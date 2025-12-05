import React, { useContext, useMemo, useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, RefreshControl, useWindowDimensions, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { WalletContext } from '../WalletContext';
import { getHistoricalData } from '../api';

const TYPE_COLORS = { etf: '#7b1fa2', bdr: '#1565c0', stock: '#2e7d32' }; 
const TYPE_LABELS = { etf: 'ETFs', bdr: 'BDRs', stock: 'Ações' };

const TIMEFRAMES = [
  { key: '1mo', label: '1 Mês', interval: '1d' },
  { key: '3mo', label: '3 Meses', interval: '1d' },
  { key: '6mo', label: '6 Meses', interval: '5d' }, 
  { key: '1y', label: '1 Ano', interval: '1wk' },   
];

export default function DashboardScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const { positions, transactions, isPrivacyMode, togglePrivacyMode, refreshPrices, currentPortfolioValue, lastUpdate } = useContext(WalletContext);

  const [refreshing, setRefreshing] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState(TIMEFRAMES[0]); 
  const [chartData, setChartData] = useState(null);
  const [loadingChart, setLoadingChart] = useState(false);

  // 1. Calcula o Custo Total Investido (Dinheiro que saiu do bolso do usuário)
  const totalInvestedCost = useMemo(() => {
    return positions.reduce((acc, item) => acc + (item.quantity * item.averagePrice), 0);
  }, [positions]);

  // 2. Rentabilidade Atual (Topo do Card) - Comparação: Valor Atual vs Custo
  const profitValue = currentPortfolioValue - totalInvestedCost;
  const profitPercent = totalInvestedCost > 0 ? (profitValue / totalInvestedCost) * 100 : 0;

  // --- LÓGICA DE GERAÇÃO DO GRÁFICO ---
  const fetchChartData = async () => {
    if (positions.length === 0) {
      setChartData(null);
      return;
    }

    setLoadingChart(true);
    try {
      const tickers = positions.map(p => p.ticker);
      
      // Busca histórico na API
      const historicalResults = await getHistoricalData(tickers, selectedTimeframe.key, selectedTimeframe.interval);

      if (!historicalResults || historicalResults.length === 0) {
        setChartData(null);
        return;
      }

      // -- PASSO A: Mapear histórico por ativo --
      const assetHistoryMap = {}; 
      const allDatesSet = new Set();

      historicalResults.forEach(asset => {
        if (asset.historicalDataPrice) {
          assetHistoryMap[asset.symbol] = {};
          asset.historicalDataPrice.forEach(point => {
            // Guarda preço de fechamento indexado pela data
            if (point.date && point.close) {
              allDatesSet.add(point.date);
              assetHistoryMap[asset.symbol][point.date] = point.close;
            }
          });
        }
      });

      // Ordena as datas cronologicamente
      const sortedDates = Array.from(allDatesSet).sort((a, b) => a - b);

      if (sortedDates.length < 2) {
        setChartData(null);
        return;
      }

      const dataPoints = [];
      const labels = [];
      
      // Controla a quantidade de labels no eixo X
      const labelInterval = Math.ceil(sortedDates.length / 5);

      // -- PASSO B: Construir a linha do tempo da carteira (Soma dos ativos) --
      // Variável para guardar o último preço conhecido de cada ativo (Fill Forward)
      const lastKnownPrices = {}; 

      // Inicializa lastKnownPrices com o preço médio (fallback inicial)
      positions.forEach(p => {
        lastKnownPrices[p.ticker] = p.averagePrice;
      });

      sortedDates.forEach((dateKey, index) => {
        let dailyPortfolioValue = 0;

        // Para cada dia, soma o valor de todos os ativos que o usuário tem
        positions.forEach(pos => {
          const histMap = assetHistoryMap[pos.ticker];
          
          // Se tem preço nesse dia, usa e atualiza o último conhecido
          if (histMap && histMap[dateKey]) {
            lastKnownPrices[pos.ticker] = histMap[dateKey];
          }
          
          // Usa o preço atual (deste dia) ou o último conhecido (se for feriado pra esse ativo)
          const priceToUse = lastKnownPrices[pos.ticker];
          
          dailyPortfolioValue += (priceToUse * pos.quantity);
        });

        // -- PASSO C: Calcular Rentabilidade % --
        // Fórmula: ((ValorTotalDia - CustoTotal) / CustoTotal) * 100
        let percentage = 0;
        if (totalInvestedCost > 0) {
          percentage = ((dailyPortfolioValue - totalInvestedCost) / totalInvestedCost) * 100;
        }

        // Proteção contra Infinity/NaN
        if (!isFinite(percentage)) percentage = 0;

        dataPoints.push(percentage);

        // Formatação da Label (Data)
        if (index % labelInterval === 0 || index === sortedDates.length - 1) {
          const d = new Date(dateKey * 1000);
          const day = d.getDate().toString().padStart(2, '0');
          const month = (d.getMonth() + 1).toString().padStart(2, '0');
          labels.push(`${day}/${month}`);
        } else {
          labels.push(''); // Label vazia para manter alinhamento
        }
      });

      setChartData({
        labels: labels,
        datasets: [{ data: dataPoints }]
      });

    } catch (e) {
      console.error("Erro no gráfico:", e);
      setChartData(null);
    } finally {
      setLoadingChart(false);
    }
  };

  useEffect(() => {
    fetchChartData();
  }, [positions, selectedTimeframe, totalInvestedCost]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshPrices();
    await fetchChartData();
    setRefreshing(false);
  }, [refreshPrices]);

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

  // Lógica de Alocação (Pizza/Barra)
  const allocationBreakdown = useMemo(() => {
    let breakdown = { stock: 0, bdr: 0, etf: 0 };
    positions.forEach(p => {
      const val = p.quantity * (p.currentPrice || p.averagePrice); 
      const type = (p.type === 'bdr' || p.type === 'etf') ? p.type : 'stock';
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

      {/* Main Card */}
      <View style={styles.mainCard}>
        <Text style={styles.mainCardLabel}>Patrimônio Total</Text>
        <Text style={styles.mainCardValue}>{formatCurrency(currentPortfolioValue)}</Text>
        
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5 }}>
            <Text style={{ color: '#ccc', fontSize: 14 }}>Rentabilidade da Carteira: </Text>
            <Text style={{ 
                color: getProfitColor(profitPercent), 
                fontWeight: 'bold', fontSize: 16 
            }}>
                {formatPercent(profitPercent)}
            </Text>
        </View>
        <Text style={{ color: '#888', fontSize: 12 }}>
           {isPrivacyMode ? '' : `(R$ ${profitValue >= 0 ? '+' : ''}${profitValue.toLocaleString('pt-BR', {minimumFractionDigits: 2})})`}
        </Text>

        {currentPortfolioValue > 0 && (
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
        )}
      </View>

      <View style={styles.filtersContainer}>
        {TIMEFRAMES.map((tf) => (
          <TouchableOpacity 
            key={tf.key} 
            style={[styles.filterBtn, selectedTimeframe.key === tf.key && styles.filterBtnActive]}
            onPress={() => setSelectedTimeframe(tf)}
          >
            <Text style={[styles.filterText, selectedTimeframe.key === tf.key && styles.filterTextActive]}>
              {tf.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Gráfico de Rentabilidade (%)</Text>
        {loadingChart ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#2e7d32" />
            <Text style={{ marginTop: 10, color: '#888', fontSize: 12 }}>Buscando histórico...</Text>
          </View>
        ) : (chartData && chartData.datasets[0].data.length > 0) ? (
          <LineChart
            data={chartData}
            width={width - 40} 
            height={220}
            yAxisSuffix="%"
            yAxisInterval={1}
            chartConfig={{
              backgroundColor: "#fff",
              backgroundGradientFrom: "#fff",
              backgroundGradientTo: "#fff",
              decimalPlaces: 1,
              color: (opacity = 1) => getProfitColor(chartData.datasets[0].data[chartData.datasets[0].data.length - 1]),
              labelColor: (opacity = 1) => `rgba(100, 100, 100, ${opacity})`,
              propsForDots: { r: "0" },
              propsForBackgroundLines: { strokeDasharray: "" },
            }}
            bezier
            style={{ marginVertical: 8, borderRadius: 16 }}
            withInnerLines={true}
            withOuterLines={true}
            withVerticalLines={false}
          />
        ) : (
          <View style={styles.loadingBox}>
            <Text style={styles.emptyText}>
              {positions.length === 0 
                ? "Adicione ativos na aba 'Cadastrar' para ver o gráfico." 
                : "Não foi possível carregar o histórico. Verifique sua conexão."}
            </Text>
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
                  <Text style={styles.assetSub}>PM: {formatCurrency(pos.averagePrice)}</Text>
                </View>
              </View>
              <View style={{alignItems: 'flex-end'}}>
                <Text style={{ fontWeight: 'bold', color: getProfitColor(gain), fontSize: 16 }}>
                  {formatPercent(gain)}
                </Text>
                <Text style={styles.assetSub}>Atual: {formatCurrency(currentP)}</Text>
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