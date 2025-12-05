import { useState, useEffect, useContext } from 'react';
import { 
  View, Text, TextInput, StyleSheet, TouchableOpacity, 
  ActivityIndicator, ScrollView, Alert, KeyboardAvoidingView, Platform, Keyboard 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { WalletContext } from '../WalletContext';
import { getAssetQuote, searchAssets } from '../api';

const ASSET_TYPES = [
  { id: 'stock', label: 'Ação', icon: 'business' },
  { id: 'etf', label: 'ETF', icon: 'layers' },
  { id: 'bdr', label: 'BDR', icon: 'globe' },
];

export default function Transactions({ navigation }) {
  const { addTransaction, positions } = useContext(WalletContext);

  const [type, setType] = useState('stock'); 
  const [operation, setOperation] = useState('COMPRA');
  
  const [ticker, setTicker] = useState('');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [total, setTotal] = useState(0);
  
  const [suggestions, setSuggestions] = useState([]);
  const [loadingPrice, setLoadingPrice] = useState(false);

  useEffect(() => {
    const q = parseFloat(quantity.replace(',', '.')) || 0;
    const p = parseFloat(price.replace(',', '.')) || 0;
    setTotal(q * p);
  }, [quantity, price]);

  useEffect(() => {
    if (!type) return;
    const delayDebounce = setTimeout(async () => {
      if (ticker.length >= 2) {
        const results = await searchAssets(ticker);
        const isExactMatch = results.length === 1 && results[0].symbol === ticker;
        if (!isExactMatch) setSuggestions(results);
        else setSuggestions([]);
      } else {
        setSuggestions([]);
      }
    }, 500);
    return () => clearTimeout(delayDebounce);
  }, [ticker, type]);

  const handleOperationSelect = (selectedOp) => {
    if (selectedOp === 'VENDA' && positions.length === 0) {
      Alert.alert("Atenção", "Você não possui ativos para vender.");
      return; 
    }
    setOperation(selectedOp);
  };

  const handleSelectAsset = (item) => {
    Keyboard.dismiss();
    setTicker(item.symbol);
    setSuggestions([]);
    
    // Se a busca já trouxe preço, usa. Senão busca.
    if (item.price) {
      setPrice(item.price.toString());
    } else {
      fetchCurrentPrice(item.symbol);
    }
  };

  const fetchCurrentPrice = async (symbol) => {
    setLoadingPrice(true);
    try {
      // Chama API passando array mesmo sendo um só, pois mudamos a api.js para lote
      const data = await getAssetQuote(symbol);
      if (data && data.length > 0 && data[0].regularMarketPrice) {
        setPrice(data[0].regularMarketPrice.toString());
      }
    } catch (e) {
      console.log("Erro ao buscar preço", e);
    } finally {
      setLoadingPrice(false);
    }
  };

  const handleSave = () => {
    if (!ticker || !quantity || !price) return Alert.alert("Erro", "Preencha todos os campos.");

    const qtdFloat = parseFloat(quantity.replace(',', '.'));
    const priceFloat = parseFloat(price.replace(',', '.'));
    const tickerUpper = ticker.toUpperCase();

    if (isNaN(qtdFloat) || qtdFloat <= 0) return Alert.alert("Erro", "Quantidade inválida.");

    if (operation === 'VENDA') {
      const position = positions.find(p => p.ticker === tickerUpper);
      if (!position) return Alert.alert("Erro", `Você não possui ${tickerUpper}.`);
      if (qtdFloat > position.quantity) return Alert.alert("Erro", `Saldo insuficiente: você tem ${position.quantity}.`);
    }

    const transaction = {
      id: Date.now().toString(),
      type: type, 
      operation, 
      ticker: tickerUpper,
      quantity: qtdFloat,
      price: priceFloat,
      date: new Date().toISOString().split('T')[0],
      total: qtdFloat * priceFloat
    };

    addTransaction(transaction);
    Alert.alert("Sucesso", "Registrado com sucesso!", [{ text: "OK", onPress: () => navigation.goBack() }]);
  };

  const formatCurrency = (val) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        
        <View style={styles.toggleContainer}>
          <TouchableOpacity style={[styles.toggleBtn, operation === 'COMPRA' && styles.buyBtn]} onPress={() => handleOperationSelect('COMPRA')}>
            <Text style={[styles.toggleText, operation === 'COMPRA' && styles.activeText]}>COMPRAR</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.toggleBtn, operation === 'VENDA' && styles.sellBtn]} onPress={() => handleOperationSelect('VENDA')}>
            <Text style={[styles.toggleText, operation === 'VENDA' && styles.activeText]}>VENDER</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Tipo de Ativo</Text>
        <View style={styles.typeRow}>
          {ASSET_TYPES.map((item) => (
            <TouchableOpacity 
              key={item.id}
              onPress={() => { setType(item.id); setTicker(''); setSuggestions([]); setPrice(''); }} 
              style={[styles.typeBtn, type === item.id && styles.activeTypeBtn]}
            >
              <Ionicons name={item.icon} size={18} color={type === item.id ? '#fff' : '#667'} />
              <Text style={[styles.typeBtnText, type === item.id && styles.activeTypeBtnText]}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
          
        <Text style={styles.label}>Código (Ticker)</Text>
        
        {/* Container Relativo com zIndex ALTO */}
        <View style={styles.inputContainer}>
          <TextInput 
            style={styles.input} 
            value={ticker} 
            onChangeText={setTicker} 
            placeholder="Ex: PETR4, IVVB11"
            autoCapitalize="characters"
          />
          {suggestions.length > 0 && (
            <View style={styles.suggestionsBox}>
              <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled" style={{ maxHeight: 180 }}>
                {suggestions.map((item, index) => (
                  <TouchableOpacity key={index} style={styles.suggestionItem} onPress={() => handleSelectAsset(item)}>
                    <View style={{flexDirection:'row', justifyContent:'space-between'}}>
                      <Text style={styles.suggestionText}>{item.symbol}</Text>
                      {item.price && <Text style={styles.suggestionPrice}>R$ {item.price.toFixed(2)}</Text>}
                    </View>
                    {item.name && <Text style={styles.suggestionSub} numberOfLines={1}>{item.name}</Text>}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        {/* Containers seguintes com zIndex BAIXO para ficarem "atrás" do dropdown se ele abrir */}
        <View style={[styles.row, { zIndex: 1 }]}>
          <View style={styles.col}>
            <Text style={styles.label}>Quantidade</Text>
            <TextInput 
              style={styles.input} 
              value={quantity} 
              onChangeText={setQuantity} 
              keyboardType="numeric"
              placeholder="0"
            />
          </View>
          <View style={styles.col}>
            <Text style={styles.label}>Preço Unitário (R$)</Text>
            <View style={styles.priceInputContainer}>
              <TextInput 
                style={[styles.input, { flex: 1 }]} 
                value={price} 
                onChangeText={setPrice} 
                keyboardType="numeric"
                placeholder="0,00"
              />
              {loadingPrice && <ActivityIndicator size="small" color="#2e7d32" style={{marginLeft: 10}} />}
            </View>
          </View>
        </View>

        <View style={[styles.totalContainer, { zIndex: 1 }]}>
          <Text style={styles.totalLabel}>Total Estimado da Operação:</Text>
          <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
        </View>

        <TouchableOpacity style={[styles.saveButton, operation === 'VENDA' ? styles.sellBtn : styles.buyBtn, { zIndex: 1 }]} onPress={handleSave}>
          <Text style={styles.saveButtonText}>{operation === 'COMPRA' ? 'REGISTRAR APORTE' : 'REGISTRAR VENDA'}</Text>
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
  
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start', marginBottom: 15 },
  typeBtn: { width: '30%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#eee', marginRight: '3%', marginBottom: 10, backgroundColor: '#fafafa' },
  activeTypeBtn: { backgroundColor: '#333', borderColor: '#333' },
  typeBtnText: { marginLeft: 5, color: '#666', fontSize: 13 },
  activeTypeBtnText: { color: '#fff', fontWeight: 'bold' },
  
  label: { fontSize: 14, color: '#666', marginBottom: 5, marginTop: 5 },
  
  // ZIndex ALTO para o pai do dropdown
  inputContainer: { position: 'relative', zIndex: 100, marginBottom: 10 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 16, backgroundColor: '#fff' },
  
  // Dropdown absoluto
  suggestionsBox: { 
    position: 'absolute', 
    top: '100%', 
    left: 0, 
    right: 0, 
    marginTop: 2, 
    backgroundColor: '#fff', 
    borderRadius: 8, 
    maxHeight: 180, 
    zIndex: 200, // ZIndex maior que o inputContainer
    elevation: 10, // Sombra Android
    borderWidth: 1, 
    borderColor: '#ddd',
    // Sombra iOS
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.30,
    shadowRadius: 4.65,
  },
  suggestionItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  suggestionText: { fontWeight: 'bold', fontSize: 16, color: '#333' },
  suggestionPrice: { fontWeight: 'bold', fontSize: 14, color: '#2e7d32' },
  suggestionSub: { fontSize: 12, color: '#888', marginTop: 2 },
  
  row: { flexDirection: 'row', justifyContent: 'space-between' }, 
  col: { width: '48%' },
  priceInputContainer: { flexDirection: 'row', alignItems: 'center' },
  totalContainer: { marginTop: 20, alignItems: 'flex-end', padding: 15, backgroundColor: '#f9f9f9', borderRadius: 8 },
  totalLabel: { fontSize: 14, color: '#666' },
  totalValue: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  saveButton: { padding: 18, borderRadius: 10, alignItems: 'center', marginTop: 20 },
  saveButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});