import axios from 'axios';

const API_TOKEN = '9UHJzxmSBvyQFC1LVDJa9S';

const api = axios.create({
  baseURL: 'https://brapi.dev/api',
  params: {
    token: API_TOKEN, 
  },
});

export const getAssetQuote = async (ticker) => {
  try {
    const response = await api.get(`/quote/${ticker}`);
    if (response.data && response.data.results) {
      return response.data.results; 
    }
    return [];
  } catch (error) {
    console.error(`Erro ao buscar ativos: ${ticker}`, error);
    return [];
  }
};

export const searchAssets = async (term) => {
  if (!term || term.length < 2) return [];

  try {
    const response = await api.get('/quote/list', {
      params: {
        search: term,
        limit: 10,
        sortBy: 'volume',
        sortOrder: 'desc'
      }
    });
    
    const stocks = response.data.stocks || [];
    
    return stocks.map(stockItem => ({
      ...stockItem,
      symbol: stockItem.stock,
      price: stockItem.close,
    }));

  } catch (error) {
    console.error("Erro na busca:", error);
    return [];
  }
};

export const getHistoricalData = async (tickers, range = '1mo', interval = '1d') => {
  if (!tickers || tickers.length === 0) return [];

  const results = [];

  for (const ticker of tickers) {
    try {
      const response = await api.get(`/quote/${ticker}`, {
        params: { range, interval }
      });

      if (response.data && response.data.results && response.data.results.length > 0) {
        results.push(response.data.results[0]);
      }

      await new Promise(resolve => setTimeout(resolve, 500));

    } catch (error) {
      console.error(`Erro ao buscar histórico de ${ticker}:`, error.message);
    }
  }

  return results;
};

export default api;