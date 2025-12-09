import { useContext, useMemo, useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, RefreshControl, useWindowDimensions, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import * as NavigationBar from 'expo-navigation-bar';
import { WalletContext } from '../WalletContext';
import { getHistoricalData } from '../api';

const TYPE_COLORS = { stock: '#2e7d32', cripto: '#fbc02d', bdr: '#1565c0', etf: '#7b1fa2' };
const TYPE_LABELS = { stock: 'Ações', cripto: 'Cripto', bdr: 'BDRs', etf: 'ETFs' };

export default function DashboardScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const { positions, transactions, isPrivacyMode, togglePrivacyMode, refreshPrices, currentPortfolioValue, lastUpdate } = useContext(WalletContext);

  const [refreshing, setRefreshing] = useState(false);
  const [chartData, setChartData] = useState(null);
  const [loadingChart, setLoadingChart] = useState(false);
  const [chartDateLabel, setChartDateLabel] = useState(''); 

  // Tela cheia
  useEffect(() => {
    async function enableImmersiveMode() {
      if (Platform.OS === 'android') {
        try {
          await NavigationBar.setVisibilityAsync("hidden");
          
          await NavigationBar.setBehaviorAsync("overlay-swipe");
          
        } catch (e) {
          console.log("Erro ao configurar barra de navegação (provavelmente rodando na web ou sem a lib):", e);
        }
      }
    }
    enableImmersiveMode();
  }, []);

  useEffect(() => {
    if (positions.length > 0) {
      refreshPrices();
    }
  }, [positions.length]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshPrices();
    fetchChartData();
    setRefreshing(false);
  }, [refreshPrices]);

  useEffect(() => {
    fetchChartData();
  }, [transactions.length, positions.length]); 

  const fetchChartData = async () => {
    if (positions.length === 0) {
        setChartData(null);
        setChartDateLabel('');
        return;
    }

    setLoadingChart(true);
    setChartDateLabel('');

    try {
        const uniqueTickers = [...new Set(positions.map(p => p.ticker))];
        
        // Configuração fixa para buscar o último pregão (Janela Ampliada)
        const fetchRange = '5d'; 
        const fetchInterval = '15m';

        const historyPromises = uniqueTickers.map(ticker => 
            getHistoricalData(ticker, fetchRange, fetchInterval)
                .then(data => ({ ticker, data }))
        );

        const historyResults = await Promise.all(historyPromises);
        
        let allTimestamps = new Set();
        const historicalMap = {};

        historyResults.forEach(({ ticker, data }) => {
            historicalMap[ticker] = {};
            data.forEach(candle => {
                const ts = candle.date; 
                if (ts) {
                    historicalMap[ticker][ts] = candle.close;
                    allTimestamps.add(ts);
                }
            });
        });

        let sortedTimestamps = Array.from(allTimestamps).sort((a, b) => a - b);

        if (sortedTimestamps.length === 0) {
            setChartData(null);
            setLoadingChart(false);
            return;
        }

        // Filtra para manter apenas o ÚLTIMO dia disponível
        const lastTimestamp = sortedTimestamps[sortedTimestamps.length - 1];
        const lastDate = new Date(lastTimestamp * 1000);
        const lastDayString = lastDate.toDateString(); 
        
        // Verifica se é hoje
        const today = new Date();
        const isToday = lastDate.getDate() === today.getDate() && 
                        lastDate.getMonth() === today.getMonth() && 
                        lastDate.getFullYear() === today.getFullYear();

        // Atualiza o label da data
        const dayFormatted = `${lastDate.getDate()}/${lastDate.getMonth() + 1}`;
        setChartDateLabel(isToday ? `(Hoje - ${dayFormatted})` : `- Dia ${dayFormatted}`);

        // Mantém apenas os timestamps desse dia
        sortedTimestamps = sortedTimestamps.filter(ts => {
            const d = new Date(ts * 1000);
            return d.toDateString() === lastDayString;
        });

        const portfolioHistory = sortedTimestamps.map(ts => {
            let marketValueOnDay = 0;
            let investedOnDay = 0;
            let hasAsset = false;

            // Ignora data da transação para focar no movimento do dia da carteira
            positions.forEach(pos => {
                const qty = pos.quantity;
                if (qty > 0) {
                    hasAsset = true;
                    
                    let price = historicalMap[pos.ticker]?.[ts];

                    // Fallback para preencher buracos no gráfico
                    if (!price && historicalMap[pos.ticker]) {
                        const tickerTimestamps = Object.keys(historicalMap[pos.ticker]).map(k => Number(k)).sort((a,b)=>a-b);
                        let found = null;
                        for(let i = tickerTimestamps.length-1; i >= 0; i--) {
                            if (tickerTimestamps[i] <= ts) {
                                found = tickerTimestamps[i];
                                break;
                            }
                        }
                        if (found) price = historicalMap[pos.ticker][found];
                    }

                    if (!price) price = pos.currentPrice || pos.averagePrice;

                    marketValueOnDay += qty * price;
                    investedOnDay += qty * pos.averagePrice; 
                }
            });

            if (!hasAsset || investedOnDay <= 0) return 0;
            return ((marketValueOnDay - investedOnDay) / investedOnDay) * 100;
        });

        const labelInterval = Math.ceil(sortedTimestamps.length / 5);
        const displayLabels = sortedTimestamps.map((ts, i) => {
            if (i % labelInterval === 0 || i === sortedTimestamps.length - 1) {
                const d = new Date(ts * 1000);
                return `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;
            }
            return '';
        });

        setChartData({
            labels: displayLabels,
            datasets: [{
                data: portfolioHistory,
                color: (opacity = 1) => `rgba(46, 125, 50, ${opacity})`,
                strokeWidth: 2
            }]
        });

    } catch (e) {
        console.error("Erro ao gerar gráfico histórico:", e);
        setChartData(null);
    } finally {
        setLoadingChart(false);
    }
  };

  const totalInvested = useMemo(() => {
    return positions.reduce((acc, item) => acc + (item.quantity * item.averagePrice), 0);
  }, [positions]);

  const profitValue = currentPortfolioValue - totalInvested;
  const profitPercent = totalInvested > 0 ? (profitValue / totalInvested) * 100 : 0;

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

      <View style={styles.chartCard}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, paddingHorizontal: 10 }}>
          <Text style={styles.chartTitle}>
              Evolução {chartDateLabel} (%)
          </Text>
        </View>
        
        {loadingChart ? (
            <View style={styles.loadingBox}>
                <ActivityIndicator size="large" color="#2e7d32" />
                <Text style={{ marginTop: 10, color: '#888', fontSize: 12 }}>Carregando dados do mercado...</Text>
            </View>
        ) : (chartData && chartData.datasets[0].data.length > 0) ? (
          <LineChart
            data={chartData}
            width={width - 40} 
            height={220}
            yAxisSuffix="%"
            withDots={false}
            chartConfig={{
              backgroundColor: "#fff",
              backgroundGradientFrom: "#fff",
              backgroundGradientTo: "#fff",
              decimalPlaces: 1,
              color: (opacity = 1) => {
                  const data = chartData.datasets[0].data;
                  if (!data || data.length === 0) return `rgba(46, 125, 50, ${opacity})`;
                  const lastVal = data[data.length - 1];
                  const colorBase = lastVal >= 0 ? "46, 125, 50" : "211, 47, 47";
                  return `rgba(${colorBase}, ${opacity})`;
              },
              labelColor: (opacity = 1) => `rgba(100, 100, 100, ${opacity})`,
              propsForBackgroundLines: { strokeDasharray: "" },
              strokeWidth: 2
            }}
            bezier
            style={{ marginVertical: 8, borderRadius: 16 }}
            fromZero={false} 
            withInnerLines={true}
            withOuterLines={true}
            withVerticalLines={false}
            xLabelsOffset={-10}
          />
        ) : (
          <View style={styles.loadingBox}>
            <Text style={styles.emptyText}>Dados indisponíveis no momento.</Text>
            <Text style={{ fontSize: 10, color: '#aaa', marginTop: 5, textAlign: 'center' }}>
                Aguarde a abertura do mercado.
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
  emptyCardText: { color: '#fff', fontStyle: 'italic', marginBottom: 10, textAlign: 'center', marginTop: 20 },

  progressBarContainer: { flexDirection: 'row', height: 10, borderRadius: 5, overflow: 'hidden', backgroundColor: '#333', marginBottom: 12, marginTop: 10 },
  legendContainer: { flexDirection: 'row', flexWrap: 'wrap' },
  legendItem: { flexDirection: 'row', alignItems: 'center', marginRight: 15, marginBottom: 5 },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 6 },
  legendText: { color: '#ccc', fontSize: 12, fontWeight: 'bold' },
  
  chartCard: { backgroundColor: '#fff', borderRadius: 16, padding: 10, marginHorizontal: 20, marginBottom: 25, elevation: 2, alignItems: 'center', minHeight: 250 },
  chartTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  loadingBox: { height: 180, justifyContent: 'center', alignItems: 'center' },
  
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#000', marginBottom: 10, marginHorizontal: 20 },
  
  assetRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 15, marginHorizontal: 20, marginBottom: 10, borderRadius: 12, elevation: 1 },
  colorIndicator: { width: 4, height: 30, borderRadius: 2, marginRight: 12 },
  assetTicker: { fontWeight: 'bold', fontSize: 16, color: '#333' },
  assetSub: { fontSize: 12, color: '#888' },
  
  emptyText: { textAlign: 'center', color: '#999', marginTop: 10, fontStyle: 'italic', paddingHorizontal: 20 },
});