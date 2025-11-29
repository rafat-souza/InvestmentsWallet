import axios from 'axios';

const API_TOKEN = process.env.EXPO_PUBLIC_BRAPI_TOKEN;

const api = axios.create({
  baseURL: 'https://brapi.dev/api',
  params: {
    token: API_TOKEN, 
  },
});

export const getQuote = async (ticker) => {
  try {
    const response = await api.get(`/quote/${ticker}`);
    if (response.data && response.data.results && response.data.results.length > 0) {
        return response.data.results[0];
    }
    return null;
  } catch (error) {
    console.error(`Erro ao buscar ativo ${ticker}:`, error);
    throw error;
  }
};

export const searchAssets = async (searchTerm) => {
  try {
    const response = await api.get('/quote/list', {
      params: {
        search: searchTerm,
        limit: 10,
        sortBy: 'volume', 
        sortOrder: 'desc'
      }
    });
    return response.data.stocks || []; 
  } catch (error) {
    console.error("Erro na busca:", error);
    return [];
  }
};

export default api;