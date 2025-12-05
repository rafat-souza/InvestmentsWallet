import axios from 'axios';

const API_TOKEN = '9UHJzxmSBvyQFC1LVDJa9S';

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