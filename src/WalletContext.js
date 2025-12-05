import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { getStockQuote, getCryptoQuote } from './api';

export const WalletContext = createContext({});

export const WalletProvider = ({ children }) => {
  const [isPrivacyMode, setIsPrivacyMode] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [positions, setPositions] = useState([]);

  const [currentPortfolioValue, setCurrentPortfolioValue] = useState(0);
  const [lastUpdate, setLastUpdate] = useState(null);

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
          currentPrice: 0,  
          profitPercent: 0    
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
        
        if (current.currentPrice === 0) {
            current.currentPrice = tx.price;
        }

      } else if (tx.operation === 'VENDA') {
        current.quantity -= tx.quantity;
        
        if (current.quantity <= 0) {
          current.quantity = 0;
          current.totalInvested = 0;
          current.averagePrice = 0;
          current.currentPrice = 0;
          current.profitPercent = 0;
        } else {
          current.totalInvested = current.quantity * current.averagePrice;
        }
      }
    });

    const positionsArray = Object.values(port).filter(p => p.quantity > 0);
    setPositions(positionsArray);

    const initialTotal = positionsArray.reduce((acc, item) => acc + (item.quantity * item.currentPrice), 0);
    setCurrentPortfolioValue(initialTotal);
    
    refreshPrices(positionsArray);
  };

  const refreshPrices = async (currentPositions = positions) => {
    if (currentPositions.length === 0) return;

    let totalCurrentValue = 0;
    
    const updatedPositions = await Promise.all(currentPositions.map(async (pos) => {
      let currentPrice = pos.currentPrice || pos.averagePrice; 
      
      try {
        let data = null;
        if (pos.type === 'cripto') {
          data = await getCryptoQuote(pos.ticker);
        } else {
          data = await getStockQuote(pos.ticker);
        }
        
        if (data && (data.regularMarketPrice || data.price)) {
            currentPrice = data.regularMarketPrice || data.price;
        }
      } catch (error) {
        console.log(`Erro ao atualizar ${pos.ticker}`, error);
      }

      let profitPercent = 0;
      if (pos.averagePrice > 0) {
          profitPercent = ((currentPrice - pos.averagePrice) / pos.averagePrice) * 100;
      }

      totalCurrentValue += (pos.quantity * currentPrice);
      
      return { 
          ...pos, 
          currentPrice, 
          profitPercent 
      };
    }));

    setPositions(updatedPositions);
    setCurrentPortfolioValue(totalCurrentValue);
    setLastUpdate(new Date());
  };

  const togglePrivacyMode = async (value) => {
    setIsPrivacyMode(value);
    await AsyncStorage.setItem('@privacy_mode', JSON.stringify(value));
  };

  const clearAllData = async () => {
    await AsyncStorage.clear();
    setTransactions([]);
    setPositions([]);
    setCurrentPortfolioValue(0);
    setIsPrivacyMode(false);
  };

  return (
    <WalletContext.Provider value={{ 
      isPrivacyMode, 
      togglePrivacyMode, 
      clearAllData,
      transactions,
      positions, 
      addTransaction, 
      refreshPrices, 
      currentPortfolioValue, 
      lastUpdate
    }}>
      {children}
    </WalletContext.Provider>
  );
};