import axios from 'axios';

const BRAPI_TOKEN = '9UHJzxmSBvyQFC1LVDJa9S'; 

const api = axios.create({
  baseURL: 'https://brapi.dev/api',
  params: {
    token: BRAPI_TOKEN,
  }
});

export const getStockQuote = async (ticker) => {
  try {
    const response = await api.get(`/quote/${ticker}`);
    return response.data.results[0];
  } catch (error) {
    console.error(`Erro ao buscar cotação de ${ticker}:`, error);
    return null;
  }
};

export const getCryptoQuote = async (ticker) => {
  try {
    const response = await api.get(`/quote/${ticker}`, {
        params: { fundamental: false }
    });
    return response.data.results[0];
  } catch (error) {
    console.error(`Erro ao buscar cripto ${ticker}:`, error);
    return null;
  }
};

export const searchAssets = async (query, type) => {
  try {
    const params = {
        search: query,
        limit: 10
    };

    if (type === 'cripto') {
        params.type = 'crypto';
    } 

    const response = await api.get(`/quote/list`, { params });
    
    // Unifica resultados de stocks e indexes se houver
    return response.data.stocks || response.data.indexes || [];
  } catch (error) {
    console.error("Erro na busca:", error);
    return [];
  }
};

export const getHistoricalData = async (ticker, range = '1mo', interval = '1d') => {
    try {
        const response = await api.get(`/quote/${ticker}`, {
            params: {
                range: range,      
                interval: interval 
            }
        });
        
        const result = response.data.results[0];
        if (result && result.historicalDataPrice) {
            return result.historicalDataPrice; 
        }
        return [];
    } catch (error) {
        return [];
    }
};

export default api;