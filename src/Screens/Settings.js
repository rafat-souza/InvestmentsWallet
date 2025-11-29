import React, { useContext } from 'react';
import { View, Text, Switch, TouchableOpacity, StyleSheet, Alert } from 'react-native';

import { WalletContext } from '../WalletContext';

export default function Settings() {
  const { isPrivacyMode, togglePrivacyMode, clearAllData } = useContext(WalletContext);

  const handleClear = () => {
    Alert.alert(
      "Atenção",
      "Isso apagará todas as suas movimentações e ativos. Tem certeza?",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Apagar Tudo", onPress: clearAllData, style: "destructive" }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text style={styles.label}>Modo Privacidade</Text>
        <Switch 
          value={isPrivacyMode} 
          onValueChange={togglePrivacyMode} 
        />
      </View>

      <TouchableOpacity style={styles.deleteButton} onPress={handleClear}>
        <Text style={styles.deleteText}>Limpar Todos os Dados</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
  label: { fontSize: 18 },
  deleteButton: { backgroundColor: '#ffebee', padding: 15, borderRadius: 8, alignItems: 'center' },
  deleteText: { color: '#d32f2f', fontWeight: 'bold', fontSize: 16 }
});