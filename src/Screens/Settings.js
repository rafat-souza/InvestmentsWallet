import React, { useContext } from 'react';
import { View, Text, Switch, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';

import { WalletContext } from '../WalletContext';

export default function Settings() {
  const { clearAllData } = useContext(WalletContext);

  const handleClear = () => {
    const title = "Atenção";
    const message = "Isso apagará todas as suas movimentações e ativos. Tem certeza?";

    // Navegador (Web)
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(`${title}\n\n${message}`);
      if (confirmed) {
        clearAllData();
      }
    } else {
      // Android/iOS
      Alert.alert(
        title,
        message,
        [
          { text: "Cancelar", style: "cancel" },
          { text: "Apagar Tudo", onPress: clearAllData, style: "destructive" }
        ]
      );
    }
  };

  return (
      <TouchableOpacity style={styles.deleteButton} onPress={handleClear}>
        <Text style={styles.deleteText}>Limpar Todos os Dados</Text>
      </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
  label: { fontSize: 18, color: '#333' },
  deleteButton: { backgroundColor: '#ffebee', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 20 },
  deleteText: { color: '#d32f2f', fontWeight: 'bold', fontSize: 16 }
});