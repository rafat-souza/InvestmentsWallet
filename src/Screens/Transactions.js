import React, { useState, useEffect, useContext } from 'react';
import { 
  View, Text, TextInput, StyleSheet, TouchableOpacity, 
  ActivityIndicator, ScrollView, Alert, KeyboardAvoidingView, Platform 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { WalletContext } from '../WalletContext';
import { getStockQuote, getCryptoQuote, searchAssets } from '../api';

const ASSET_TYPES = [
  { id: 'ação', label: 'Ação', icon: 'business' },
  { id: 'bdr', label: 'BDR', icon: 'globe' },
  { id: 'etf', label: 'ETF', icon: 'layers' },
  { id: 'cripto', label: 'Cripto', icon: 'logo-bitcoin' },
];

export default function Transactions({ navigation }) {
  const { addTransaction } = useContext(WalletContext);

  const [type, setType] = useState('stock'); 
  const [operation, setOperation] = useState('COMPRA');
  
  const [ticker, setTicker] = useState('');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [suggestions, setSuggestions] = useState([]);
  const [loadingPrice, setLoadingPrice] = useState(false);

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        
        <View style={styles.toggleContainer}>
          <TouchableOpacity 
            style={[styles.toggleBtn, operation === 'COMPRA' && styles.buyBtn]} 
            onPress={() => setOperation('COMPRA')}
          >
            <Text style={[styles.toggleText, operation === 'COMPRA' && styles.activeText]}>COMPRAR</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.toggleBtn, operation === 'VENDA' && styles.sellBtn]} 
            onPress={() => setOperation('VENDA')}
          >
            <Text style={[styles.toggleText, operation === 'VENDA' && styles.activeText]}>VENDER</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Tipo de Ativo</Text>
        <View style={styles.typeRow}>
          {ASSET_TYPES.map((item) => (
            <TouchableOpacity 
              key={item.id}
              onPress={() => {
                setType(item.id);
                setTicker(''); 
                setSuggestions([]);
              }} 
              style={[
                styles.typeBtn, 
                type === item.id && styles.activeTypeBtn
              ]}
            >
              <Ionicons 
                name={item.icon} 
                size={18} 
                color={type === item.id ? '#fff' : '#666'} 
              />
              <Text style={[
                styles.typeBtnText, 
                type === item.id && styles.activeTypeBtnText
              ]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Código ({type.toUpperCase()})</Text>
        <TextInput 
          style={styles.input} 
          value={ticker} 
          onChangeText={setTicker} 
          placeholder={type === 'cripto' ? "Ex: BTC" : "Ex: PETR4, IVVB11"}
          autoCapitalize="characters"
        />
        
        {suggestions.length > 0 && (
          <View style={styles.suggestionsBox}>
            {suggestions.map((item, index) => (
              <TouchableOpacity key={index} style={styles.suggestionItem} onPress={() => handleSelectAsset(item.symbol)}>
                <Text style={styles.suggestionText}>{item.symbol}</Text>
                {item.name && <Text style={styles.suggestionSub}>{item.name}</Text>}
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.row}>
          <View style={styles.col}>
            <Text style={styles.label}>Quantidade</Text>
            <TextInput 
              style={styles.input} 
              value={quantity} 
              onChangeText={setQuantity} 
              keyboardType="numeric"
              placeholder="0.00"
            />
          </View>
          <View style={styles.col}>
            <Text style={styles.label}>Preço (R$)</Text>
            <View style={styles.priceInputContainer}>
              <TextInput 
                style={[styles.input, { flex: 1, marginBottom: 0 }]} 
                value={price} 
                onChangeText={setPrice} 
                keyboardType="numeric"
                placeholder="0.00"
              />
              {loadingPrice && <ActivityIndicator size="small" color="#2e7d32" style={{marginLeft: 10}} />}
            </View>
          </View>
        </View>

        <Text style={styles.label}>Data</Text>
        <TextInput 
          style={styles.input} 
          value={date} 
          onChangeText={setDate} 
          placeholder="YYYY-MM-DD"
        />

        <TouchableOpacity style={[styles.saveButton, operation === 'VENDA' ? styles.sellBtn : styles.buyBtn]} onPress={handleSave}>
          <Text style={styles.saveButtonText}>
            {operation === 'COMPRA' ? 'REGISTRAR APORTE' : 'REGISTRAR VENDA'}
          </Text>
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scroll: { padding: 20 },
  
  toggleContainer: { flexDirection: 'row', borderRadius: 8, overflow: 'hidden', marginBottom: 20, borderWidth: 1, borderColor: '#ddd' },
  toggleBtn: { flex: 1, padding: 15, alignItems: 'center', backgroundColor: '#f5f5f5' },
  buyBtn: { backgroundColor: '#2e7d32' }, 
  sellBtn: { backgroundColor: '#d32f2f' }, 
  toggleText: { fontWeight: 'bold', color: '#888' },
  activeText: { color: '#fff' },

  typeRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 15 },
  typeBtn: { 
    width: '48%',
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center',
    padding: 12, 
    borderRadius: 8, 
    borderWidth: 1, 
    borderColor: '#eee',
    marginBottom: 10,
    backgroundColor: '#fafafa'
  },
  activeTypeBtn: { backgroundColor: '#333', borderColor: '#333' },
  typeBtnText: { marginLeft: 8, color: '#666', fontSize: 14 },
  activeTypeBtnText: { color: '#fff', fontWeight: 'bold' },

  label: { fontSize: 14, color: '#666', marginBottom: 5, marginTop: 5 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 16, backgroundColor: '#fff', marginBottom: 10 },
  
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  col: { width: '48%' },
  priceInputContainer: { flexDirection: 'row', alignItems: 'center' },

  suggestionsBox: { backgroundColor: '#fff', elevation: 5, borderRadius: 8, marginTop: -5, marginBottom: 10, maxHeight: 150, zIndex: 10 },
  suggestionItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  suggestionText: { fontWeight: 'bold', fontSize: 16 },
  suggestionSub: { fontSize: 12, color: '#888' },

  saveButton: { padding: 18, borderRadius: 10, alignItems: 'center', marginTop: 20 },
  saveButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});