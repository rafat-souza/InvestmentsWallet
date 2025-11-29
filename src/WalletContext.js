import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const WalletContext = createContext({});

export const WalletProvider = ({ children }) => {
  const [isPrivacyMode, setIsPrivacyMode] = useState(false);
  
  const [transactions, setTransactions] = useState([]);
  
  const [positions, setPositions] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const privacy = await AsyncStorage.getItem('@privacy_mode');
      const storedTransactions = await AsyncStorage.getItem('@transactions');
      
      if (privacy !== null) setIsPrivacyMode(JSON.parse(privacy));
      if (storedTransactions !== null) {
        const parsedTrans = JSON.parse(storedTransactions);
        setTransactions(parsedTrans);
        recalculatePortfolio(parsedTrans); 
      }
    } catch (e) {
      console.error("Erro ao carregar dados", e);
    }
  };

  const addTransaction = async (newTransaction) => {
    try {
      const updatedTransactions = [...transactions, newTransaction];
      
      setTransactions(updatedTransactions);
      await AsyncStorage.setItem('@transactions', JSON.stringify(updatedTransactions));
      
      recalculatePortfolio(updatedTransactions);

    } catch (e) {
      console.error("Erro ao salvar transação", e);
    }
  };

  const recalculatePortfolio = (allTransactions) => {
    const port = {}; 

    allTransactions.forEach(tx => {
      const ticker = tx.ticker;
      
      if (!port[ticker]) {
        port[ticker] = {
          ticker: ticker,
          type: tx.type, 
          quantity: 0,
          averagePrice: 0,
          totalInvested: 0,
        };
      }

      const current = port[ticker];

      if (tx.operation === 'COMPRA') {
        const currentTotalValue = current.quantity * current.averagePrice;
        const newPurchaseValue = tx.quantity * tx.price;
        
        const newTotalQty = current.quantity + tx.quantity;
        
        if (newTotalQty > 0) {
          current.averagePrice = (currentTotalValue + newPurchaseValue) / newTotalQty;
        }
        
        current.quantity = newTotalQty;
        current.totalInvested += newPurchaseValue;

      } else if (tx.operation === 'VENDA') {
        current.quantity -= tx.quantity;
        
        if (current.quantity <= 0) {
          current.quantity = 0;
          current.totalInvested = 0;
          current.averagePrice = 0;
        } else {
          current.totalInvested = current.quantity * current.averagePrice;
        }
      }
    });

    const positionsArray = Object.values(port).filter(p => p.quantity > 0);
    
    setPositions(positionsArray);
  };

  const togglePrivacyMode = async (value) => {
    setIsPrivacyMode(value);
    await AsyncStorage.setItem('@privacy_mode', JSON.stringify(value));
  };

  const clearAllData = async () => {
    await AsyncStorage.clear();
    setTransactions([]);
    setPositions([]);
    setIsPrivacyMode(false);
  };

  return (
    <WalletContext.Provider value={{ 
      isPrivacyMode, 
      togglePrivacyMode, 
      clearAllData,
      transactions,
      positions, 
      addTransaction
    }}>
      {children}
    </WalletContext.Provider>
  );
};