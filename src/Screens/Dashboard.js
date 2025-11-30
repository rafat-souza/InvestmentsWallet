import React, { useContext, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { WalletContext } from '../WalletContext';

const TYPE_COLORS = {
  stock: '#2e7d32', 
  cripto: '#fbc02d', 
  bdr: '#1565c0',  
  etf: '#7b1fa2'    
};

const TYPE_LABELS = {
  stock: 'Ações',
  cripto: 'Cripto',
  bdr: 'BDRs',
  etf: 'ETFs'
};

export default function DashboardScreen({ navigation }) {
  const { positions, transactions, isPrivacyMode, togglePrivacyMode } = useContext(WalletContext);
  const [refreshing, setRefreshing] = useState(false);

  const totalInvested = useMemo(() => {
    return positions.reduce((acc, item) => acc + (item.quantity * item.averagePrice), 0);
  }, [positions]);

  const allocationBreakdown = useMemo(() => {
    let breakdown = { stock: 0, bdr: 0, etf: 0, cripto: 0 };
    
    positions.forEach(p => {
      const investidoNoAtivo = p.quantity * p.averagePrice;
      
      const safeType = breakdown[p.type] !== undefined ? p.type : 'stock';
      
      breakdown[safeType] += investidoNoAtivo;
    });
    
    return Object.keys(breakdown)
      .map(type => ({
        type,
        value: breakdown[type],
        percent: totalInvested > 0 ? (breakdown[type] / totalInvested) * 100 : 0,
        color: TYPE_COLORS[type],
        label: TYPE_LABELS[type]
      }))
      .filter(item => item.value > 0) 
      .sort((a, b) => b.value - a.value); 

  }, [positions, totalInvested]);

  const formatCurrency = (value) => {
    if (isPrivacyMode) return 'R$ ****';
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
        setRefreshing(false);
    }, 1000);
  }, []);

  return (
    <ScrollView 
      style={styles.container} 
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2e7d32']} />
      }
    >
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Olá, Investidor</Text>
          <Text style={styles.subGreeting}>Visão do seu Custo de Aquisição</Text>
        </View>
        <TouchableOpacity onPress={() => togglePrivacyMode(!isPrivacyMode)} style={styles.privacyBtn}>
          <Ionicons name={isPrivacyMode ? "eye-off" : "eye"} size={22} color="#333" />
        </TouchableOpacity>
      </View>

      <View style={styles.mainCard}>
        <Text style={styles.mainCardLabel}>Total Investido</Text>
        <Text style={styles.mainCardValue}>{formatCurrency(totalInvested)}</Text>
        
        {totalInvested > 0 ? (
          <>
            <View style={styles.progressBarContainer}>
              {allocationBreakdown.map(item => (
                <View 
                  key={item.type} 
                  style={{ width: `${item.percent}%`, backgroundColor: item.color, height: '100%' }} 
                />
              ))}
            </View>
            
            <View style={styles.legendContainer}>
              {allocationBreakdown.map(item => (
                <View key={item.type} style={styles.legendItem}>
                  <View style={[styles.dot, { backgroundColor: item.color }]} />
                  <Text style={styles.legendText}>
                    {item.label}: {item.percent.toFixed(0)}%
                  </Text>
                </View>
              ))}
            </View>
          </>
        ) : (
            <Text style={styles.emptyCardText}>Faça seu primeiro aporte para ver a alocação.</Text>
        )}
      </View>

      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Cadastrar')}>
          <View style={[styles.iconCircle, { backgroundColor: '#e8f5e9' }]}>
            <Ionicons name="add" size={24} color="#2e7d32" />
          </View>
          <Text style={styles.actionLabel}>Aportar</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Posições')}>
          <View style={[styles.iconCircle, { backgroundColor: '#e3f2fd' }]}>
            <Ionicons name="list" size={24} color="#1565c0" />
          </View>
          <Text style={styles.actionLabel}>Detalhes</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} onPress={() => alert("Em breve: Relatórios avançados")}>
          <View style={[styles.iconCircle, { backgroundColor: '#fff3e0' }]}>
            <Ionicons name="stats-chart" size={24} color="#ef6c00" />
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