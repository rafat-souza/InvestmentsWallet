import axios from 'axios';

const API_TOKEN = process.env.EXPO_PUBLIC_BRAPI_TOKEN;

const api = axios.create({
  baseURL: 'https://brapi.dev/api',
  params: {
    token: API_TOKEN, 
  },
});

export const getStockQuote = async (ticker) => {
  try {
    const response = await api.get(`/quote/${ticker}`);
    if (response.data && response.data.results && response.data.results.length > 0) {
      return response.data.results[0];
    }
    return null;
  } catch (error) {
    console.error(`Erro ao buscar ação ${ticker}:`, error);
    return null;
  }
};

export const getCryptoQuote = async (coin) => {
  try {
    const response = await api.get('/v2/crypto', {
      params: {
        coin: coin.toUpperCase(),
        currency: 'BRL'
      }
    });
    
    if (response.data && response.data.coins && response.data.coins.length > 0) {
      const data = response.data.coins[0];
      return {
        symbol: data.coin,
        shortName: data.coinName,
        regularMarketPrice: data.regularMarketPrice,
        logourl: data.coinImageUrl 
      };
    }
    return null;
  } catch (error) {
    console.error(`Erro ao buscar cripto ${coin}:`, error);
    return null;
  }
};

export const searchAssets = async (term, type = 'stock') => {
  if (!term || term.length < 2) return [];

  try {
    if (type === 'cripto') {
      const response = await api.get('/v2/crypto/available', {
        params: { search: term }
      });
      return response.data.coins.slice(0, 10).map(c => ({ symbol: c, type: 'cripto' }));
    } else {
      const response = await api.get('/quote/list', {
        params: {
          search: term,
          limit: 10,
          sortBy: 'volume',
          sortOrder: 'desc'
        }
      });
      return response.data.stocks || [];
    }
  } catch (error) {
    console.error("Erro na busca:", error);
    return [];
  }
};

export default api;