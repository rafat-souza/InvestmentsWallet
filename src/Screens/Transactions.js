import { useState, useEffect, useContext } from 'react';
import { 
  View, Text, TextInput, StyleSheet, TouchableOpacity, 
  ActivityIndicator, ScrollView, Alert, KeyboardAvoidingView, 
  Platform, Keyboard, Pressable 
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
  const { addTransaction, positions } = useContext(WalletContext);

  const [type, setType] = useState('stock'); 
  const [operation, setOperation] = useState('COMPRA');
  
  const [ticker, setTicker] = useState('');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [total, setTotal] = useState(0); 
  const [date] = useState(new Date().toISOString().split('T')[0]);
  
  const [suggestions, setSuggestions] = useState([]);
  const [loadingPrice, setLoadingPrice] = useState(false);
  const [saving, setSaving] = useState(false); 

  // Efeito para calcular o total em tempo real
  useEffect(() => {
    const q = parseFloat(quantity.replace(',', '.')) || 0;
    const p = parseFloat(price.replace(',', '.')) || 0;
    setTotal(q * p);
  }, [quantity, price]);

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
          const searchType = type === 'cripto' ? 'cripto' : 'stock';
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
    
    if (item.type) {
      const itemType = item.type.toLowerCase();
      if (itemType === 'fund' || itemType === 'etf') {
        setType('etf');
      } else if (itemType === 'bdr') {
        setType('bdr');
      } else if (itemType === 'stock') {
        setType('stock');
      }
    }

    if (code) {
        setTicker(code);     
        setSuggestions([]);   
        Keyboard.dismiss();    
        fetchCurrentPrice(code); 
    }
  };

  const fetchCurrentPrice = async (symbol) => {
    if (!symbol) return;
    
    setLoadingPrice(true);
    
    try {
      let data = null;
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

  const handleSave = async () => {
    if (!type) {
      Alert.alert("Atenção", "Por favor, selecione o Tipo de Ativo.");
      return;
    }
    
    if (!ticker || !quantity || !price) {
      Alert.alert("Erro", "Preencha todos os campos obrigatórios");
      return;
    }

    setSaving(true); 

    try {
        const tickerUpper = ticker.toUpperCase().trim();
        const qtyFloat = parseFloat(quantity.replace(',', '.'));
        const priceFloat = parseFloat(price.replace(',', '.'));

        if (isNaN(qtyFloat) || qtyFloat <= 0) {
            Alert.alert("Erro", "Quantidade inválida.");
            setSaving(false);
            return;
        }

        let isValidAsset = false;
        
        if (type === 'cripto') {
            const check = await getCryptoQuote(tickerUpper);
            if (check) isValidAsset = true;
        } else {
            const check = await getStockQuote(tickerUpper);
            if (check) isValidAsset = true;
        }

        if (!isValidAsset) {
            Alert.alert(
                "Ativo Não Encontrado", 
                `O código "${tickerUpper}" não foi encontrado na base de dados.`
            );
            setSaving(false);
            return; 
        }

        if (operation === 'VENDA') {
            const position = positions.find(p => p.ticker === tickerUpper);

            if (!position) {
                Alert.alert(
                "Operação Inválida", 
                `Você não possui o ativo ${tickerUpper} na sua carteira para vender.`
                );
                setSaving(false);
                return;
            }

            if (qtyFloat > position.quantity) {
                Alert.alert(
                "Saldo Insuficiente", 
                `Você possui apenas ${position.quantity} unidades de ${tickerUpper}. Não é possível vender ${qtyFloat}.`
                );
                setSaving(false);
                return;
            }
        }

        const transaction = {
            id: Date.now().toString(),
            type: type, 
            operation, 
            ticker: tickerUpper,
            quantity: qtyFloat,
            price: priceFloat,
            date,
            total: qtyFloat * priceFloat
        };

        addTransaction(transaction);
        
        Alert.alert("Sucesso", `${type.toUpperCase()} registrada com sucesso!`, [
            { text: "OK", onPress: () => navigation.goBack() }
        ]);

    } catch (error) {
        console.log("Erro ao salvar", error);
        Alert.alert("Erro", "Ocorreu um erro ao validar a transação.");
    } finally {
        setSaving(false); 
    }
  };

  const dismissSuggestions = () => {
    setSuggestions([]);
    Keyboard.dismiss();
  };

  const formatCurrency = (val) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView 
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled" 
        onScrollBeginDrag={dismissSuggestions} 
      >
        <Pressable onPress={dismissSuggestions} style={{ flex: 1 }}>
          <View>
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
                    <ScrollView 
                        nestedScrollEnabled={true} 
                        keyboardShouldPersistTaps="handled"
                        style={{ maxHeight: 180 }}
                    >
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
                  onFocus={() => setSuggestions([])} 
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
                    onFocus={() => setSuggestions([])} 
                  />
                  {loadingPrice && <ActivityIndicator size="small" color="#2e7d32" style={{marginLeft: 10}} />}
                </View>
              </View>
            </View>
            
            {/* Exibição do Total Estimado */}
            <View style={styles.totalContainer}>
                <Text style={styles.totalLabel}>Valor Estimado:</Text>
                <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
            </View>

            <TouchableOpacity 
                style={[
                    styles.saveButton, 
                    operation === 'VENDA' ? styles.sellBtn : styles.buyBtn,
                    saving && { opacity: 0.7 }
                ]} 
                onPress={handleSave}
                disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.saveButtonText}>
                    {operation === 'COMPRA' ? 'REGISTRAR APORTE' : 'REGISTRAR VENDA'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </Pressable>
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
    width: '30%',
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
  typeBtnText: { marginLeft: 5, color: '#666', fontSize: 12 },
  activeTypeBtnText: { color: '#fff', fontWeight: 'bold' },

  label: { fontSize: 14, color: '#666', marginBottom: 5, marginTop: 5 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 16, backgroundColor: '#fff', marginBottom: 10 },
  
  row: { flexDirection: 'row', justifyContent: 'space-between', zIndex: -1 }, 
  col: { width: '48%' },
  priceInputContainer: { flexDirection: 'row', alignItems: 'center' },

  totalContainer: { marginTop: 15, alignItems: 'flex-end', padding: 15, backgroundColor: '#f9f9f9', borderRadius: 8, borderWidth: 1, borderColor: '#eee' },
  totalLabel: { fontSize: 14, color: '#666' },
  totalValue: { fontSize: 24, fontWeight: 'bold', color: '#333' },

  suggestionsBox: { 
    position: 'relative',
    top: 0, 
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

  saveButton: { padding: 18, borderRadius: 10, alignItems: 'center', marginTop: 20 },
  saveButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});