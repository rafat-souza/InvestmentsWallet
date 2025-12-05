import { useState, useEffect, useContext } from 'react';
import { 
  View, Text, TextInput, StyleSheet, TouchableOpacity, 
  ActivityIndicator, ScrollView, Alert, KeyboardAvoidingView, Platform, Keyboard 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { WalletContext } from '../WalletContext';
import { getStockQuote, getCryptoQuote, searchAssets } from '../api';

const ASSET_TYPES = [
  { id: 'stock', label: 'Ação', icon: 'business' },
  { id: 'bdr', label: 'BDR', icon: 'globe' },
  { id: 'etf', label: 'ETF', icon: 'layers' },
];

export default function Transactions({ navigation }) {
  const { addTransaction } = useContext(WalletContext);

  const [type, setType] = useState('stock'); 
  const [operation, setOperation] = useState('COMPRA');
  
  const [ticker, setTicker] = useState('');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [date] = useState(new Date().toISOString().split('T')[0]);
  
  const [suggestions, setSuggestions] = useState([]);
  const [loadingPrice, setLoadingPrice] = useState(false);

  useEffect(() => {
    setSuggestions([]);
  }, [type]);

  useEffect(() => {
    if (!ticker) {
        setSuggestions([]);
        return;
    }
    
    if (suggestions.length === 0 && ticker.length >= 2) {
        const delayDebounce = setTimeout(async () => {
          const searchType = type === 'stock';
          try {
              const results = await searchAssets(ticker, searchType);
              setSuggestions(results);
          } catch (error) {
              console.log("Erro busca", error);
          }
        }, 500);
        return () => clearTimeout(delayDebounce);
    }
  }, [ticker, type]);

  const handleSelectAsset = (item) => {
    const code = item.stock || item.symbol || item;
    
    console.log("Selecionado (Raw):", item);
    console.log("Selecionado (Code):", code); 

    if (code) {
        setTicker(code);     
        setSuggestions([]);   
        Keyboard.dismiss();    
        fetchCurrentPrice(code); 
    } else {
        console.warn("Não foi possível identificar o código do ativo no item clicado.");
    }
  };

  const fetchCurrentPrice = async (symbol) => {
    if (!symbol) return;
    
    setLoadingPrice(true);
    let data = null;
    
    try {
      if (type === 'cripto') {
        data = await getCryptoQuote(symbol);
      } else {
        data = await getStockQuote(symbol);
      }

      if (data && data.regularMarketPrice) {
        setPrice(data.regularMarketPrice.toString());
      }
    } catch (e) {
      console.log("Erro ao buscar preço", e);
    } finally {
      setLoadingPrice(false);
    }
  };

  const handleSave = () => {
    if (!type) {
      Alert.alert("Atenção", "Por favor, selecione o Tipo de Ativo.");
      return;
    }
    
    if (!ticker || !quantity || !price) {
      Alert.alert("Erro", "Preencha todos os campos obrigatórios");
      return;
    }

    const transaction = {
      id: Date.now().toString(),
      type: type, 
      operation, 
      ticker: ticker.toUpperCase(),
      quantity: parseFloat(quantity.replace(',', '.')),
      price: parseFloat(price.replace(',', '.')),
      date,
      total: parseFloat(quantity.replace(',', '.')) * parseFloat(price.replace(',', '.'))
    };

    addTransaction(transaction);
    Alert.alert("Sucesso", `${type.toUpperCase()} registrada com sucesso!`, [
      { text: "OK", onPress: () => navigation.goBack() }
    ]);
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView 
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="always" 
      >
        
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
                color={type === item.id ? '#fff' : '#667'} 
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
          
        <View style={{ zIndex: 100 }}> 
            <Text style={styles.label}>Código {type ? `(${type.toUpperCase()})` : ''}</Text>
            <TextInput 
              style={styles.input} 
              value={ticker} 
              onChangeText={setTicker} 
              placeholder={type === 'cripto' ? "Ex: BTC" : "Ex: PETR4, IVVB11"}
              autoCapitalize="characters"
            />
            
            {suggestions.length > 0 && (
              <View style={styles.suggestionsBox}>
                {suggestions.map((item, index) => {
                  const displaySymbol = item.stock || item.symbol || "UNK"; 
                  const displayName = item.name || "";

                  return (
                    <TouchableOpacity 
                      key={index} 
                      style={styles.suggestionItem} 
                      onPress={() => handleSelectAsset(item)}
                    >
                      <Text style={styles.suggestionText}>{displaySymbol}</Text>
                      {displayName ? <Text style={styles.suggestionSub} numberOfLines={1}>{displayName}</Text> : null}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
        </View>

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
  scroll: { padding: 20, paddingBottom: 100 },
  
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
  
  row: { flexDirection: 'row', justifyContent: 'space-between', zIndex: -1 }, 
  col: { width: '48%' },
  priceInputContainer: { flexDirection: 'row', alignItems: 'center' },

  suggestionsBox: { 
    position: 'absolute',
    top: 75, 
    left: 0,
    right: 0,
    backgroundColor: '#fff', 
    elevation: 8, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    borderRadius: 8, 
    maxHeight: 180, 
    zIndex: 9999, 
    borderWidth: 1,
    borderColor: '#eee'
  },
  suggestionItem: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
  suggestionText: { fontWeight: 'bold', fontSize: 16, color: '#333' },
  suggestionSub: { fontSize: 12, color: '#888' },

  saveButton: { padding: 18, borderRadius: 10, alignItems: 'center', marginTop: 40 },
  saveButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});