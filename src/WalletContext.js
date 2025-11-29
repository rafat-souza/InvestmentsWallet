import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const WalletContext = createContext({});

export const WalletProvider = ({ children }) => {
  const [isPrivacyMode, setIsPrivacyMode] = useState(false);
  const [walletData, setWalletData] = useState([]); 

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const privacy = await AsyncStorage.getItem('@privacy_mode');
      if (privacy !== null) setIsPrivacyMode(JSON.parse(privacy));
    } catch (e) {
      console.error("Erro ao carregar configurações", e);
    }
  };

  const togglePrivacyMode = async (value) => {
    try {
      setIsPrivacyMode(value);
      await AsyncStorage.setItem('@privacy_mode', JSON.stringify(value));
    } catch (e) {
      console.error("Erro ao salvar privacidade", e);
    }
  };

  const clearAllData = async () => {
    try {
      await AsyncStorage.clear();
      setWalletData([]);
      setIsPrivacyMode(false);
      alert('Dados limpos com sucesso!');
    } catch (e) {
      console.error("Erro ao limpar dados", e);
    }
  };

  return (
    <WalletContext.Provider value={{ 
      isPrivacyMode, 
      togglePrivacyMode, 
      clearAllData,
      walletData 
    }}>
      {children}
    </WalletContext.Provider>
  );
};