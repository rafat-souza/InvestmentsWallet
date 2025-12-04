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
  { id: 'cripto', label: 'Cripto', icon: 'logo-bitcoin' },
];

export default function Transactions({ navigation }) {
  const { addTransaction, positions } = useContext(WalletContext);

  const [type, setType] = useState('stock'); 
  const [operation, setOperation] = useState('COMPRA');
  
  const [ticker, setTicker] = useState('');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [date] = useState(new Date().toISOString().split('T')[0]);
  
  const [suggestions, setSuggestions] = useState([]);
  const [loadingPrice, setLoadingPrice] = useState(false);

  useEffect(() => {
    if (!type) return;
    const delayDebounce = setTimeout(async () => {
      if (ticker.length >= 2) {
        const searchType = type === 'cripto' ? 'cripto' : 'stock';
        const results = await searchAssets(ticker, searchType);
        setSuggestions(results);
      } else {
        setSuggestions([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [ticker, type]);

  // Bloqueia a mudança para VENDA se não houver ativos
  const handleOperationSelect = (selectedOp) => {
    if (selectedOp === 'VENDA') {
      if (positions.length === 0) {
        Alert.alert(
          "Atenção", 
          "Você não possui nenhum investimento na carteira para vender."
        );
        return; 
      }
    }
    setOperation(selectedOp);
  };


  const handleSelectAsset = async (selectedTicker) => {
    setTicker(selectedTicker); 
    setSuggestions([]);        
    Keyboard.dismiss();        
    fetchCurrentPrice(selectedTicker); 
  };
  

  const fetchCurrentPrice = async (symbol) => {
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

    const qtdFloat = parseFloat(quantity.replace(',', '.'));
    const priceFloat = parseFloat(price.replace(',', '.'));
    const tickerUpper = ticker.toUpperCase();

    if (isNaN(qtdFloat) || qtdFloat <= 0) {
      Alert.alert("Erro", "Quantidade inválida.");
      return;
    }

    // Validação de saldo para VENDA
    if (operation === 'VENDA') {
      const position = positions.find(p => p.ticker === tickerUpper);
      
      if (!position) {
        Alert.alert(
          "Ativo Inexistente", 
          `Você não possui ${tickerUpper} na sua carteira para realizar uma venda.`
        );
        return;
      }

      if (qtdFloat > position.quantity) {
        Alert.alert(
          "Quantidade Indisponível", 
          `Você possui apenas ${position.quantity} unidades de ${tickerUpper}. Não é possível vender ${qtdFloat}.`
        );
        return;
      }
    }

    const transaction = {
      id: Date.now().toString(),
      type: type, 
      operation, 
      ticker: tickerUpper,
      quantity: qtdFloat,
      price: priceFloat,
      date,
      total: qtdFloat * priceFloat
    };

    addTransaction(transaction);
    Alert.alert("Sucesso", `${operation === 'COMPRA' ? 'Compra' : 'Venda'} registrada com sucesso!`, [
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
        keyboardShouldPersistTaps="handled" 
      >
        
        <View style={styles.toggleContainer}>
          <TouchableOpacity 
            style={[styles.toggleBtn, operation === 'COMPRA' && styles.buyBtn]} 
            onPress={() => handleOperationSelect('COMPRA')}
          >
            <Text style={[styles.toggleText, operation === 'COMPRA' && styles.activeText]}>COMPRAR</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.toggleBtn, operation === 'VENDA' && styles.sellBtn]} 
            onPress={() => handleOperationSelect('VENDA')}
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
          
        <Text style={styles.label}>Código {type ? `(${type.toUpperCase()})` : ''}</Text>
        
        {}
        <View style={styles.inputContainer}>
          <TextInput 
            style={styles.input} 
            value={ticker} 
            onChangeText={setTicker} 
            placeholder={type === 'cripto' ? "Ex: BTC" : "Ex: PETR4, IVVB11"}
            autoCapitalize="characters"
          />
          
          {suggestions.length > 0 && (
            <View style={styles.suggestionsBox}>
              <ScrollView nestedScrollEnabled={true} keyboardShouldPersistTaps="handled">
                {suggestions.map((item, index) => (
                  <TouchableOpacity 
                    key={index} 
                    style={styles.suggestionItem} 
                    onPress={() => handleSelectAsset(item.symbol)}
                  >
                    <Text style={styles.suggestionText}>{item.symbol}</Text>
                    {item.name && <Text style={styles.suggestionSub} numberOfLines={1}>{item.name}</Text>}
                  </TouchableOpacity>
                ))}
              </ScrollView>
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
            <Text style={styles.label}>Preço Unitário (R$)</Text>
            <View style={styles.priceInputContainer}>
              <TextInput 
                style={[styles.input, { flex: 1 }]} 
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
  

  inputContainer: {
    position: 'relative',
    zIndex: 100, 
    marginBottom: 10,
  },
  input: { 
    borderWidth: 1, 
    borderColor: '#ddd', 
    borderRadius: 8, 
    padding: 12, 
    fontSize: 16, 
    backgroundColor: '#fff',
  },
  
  suggestionsBox: { 
    position: 'absolute',
    top: '100%', 
    left: 0,
    right: 0,
    marginTop: 4, 
    backgroundColor: '#fff', 
    borderRadius: 8, 
    maxHeight: 180, 
    zIndex: 1000, 
    elevation: 10, 
    borderWidth: 1,
    borderColor: '#ddd',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  suggestionItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  suggestionText: { fontWeight: 'bold', fontSize: 16, color: '#333' },
  suggestionSub: { fontSize: 12, color: '#888', marginTop: 2 },

  row: { flexDirection: 'row', justifyContent: 'space-between', zIndex: 1 }, 
  col: { width: '48%' },
  priceInputContainer: { flexDirection: 'row', alignItems: 'center' },

  saveButton: { padding: 18, borderRadius: 10, alignItems: 'center', marginTop: 30 },
  saveButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});