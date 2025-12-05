import axios from 'axios';

const API_TOKEN = '9UHJzxmSBvyQFC1LVDJa9S';

const api = axios.create({
  baseURL: 'https://brapi.dev/api',
  params: {
    token: API_TOKEN, 
  },
});

// Busca cotação atual (Suporta múltiplos tickers ex: "PETR4,VALE3")
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

  try {
    
    const requests = tickers.map(ticker => 
      api.get(`/quote/${ticker}`, {
        params: { range, interval }
      }).catch(err => null) 
    );

    const responses = await Promise.all(requests);
    
    
    const results = responses
      .filter(r => r && r.data && r.data.results && r.data.results.length > 0)
      .map(r => r.data.results[0]);

    return results;
  } catch (error) {
    console.error("Erro ao buscar histórico:", error);
    return [];
  }
};

export default api;