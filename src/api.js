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
      return response.data.results; // Retorna array de resultados
    }
    return [];
  } catch (error) {
    console.error(`Erro ao buscar ativos: ${ticker}`, error);
    return [];
  }
};

// Busca para o autocomplete
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

// Histórico: Busca individualmente para garantir integridade dos dados no gráfico
export const getHistoricalData = async (tickers, range = '1mo', interval = '1d') => {
  if (!tickers || tickers.length === 0) return [];

  try {
    // Fazemos chamadas paralelas para cada ativo para pegar o histórico detalhado
    const requests = tickers.map(ticker => 
      api.get(`/quote/${ticker}`, {
        params: { range, interval }
      }).catch(err => null) // Se um falhar, não quebra os outros
    );

    const responses = await Promise.all(requests);
    
    // Filtra e normaliza os resultados
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