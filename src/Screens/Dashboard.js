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
  );
}

const styles = StyleSheet.create({
});