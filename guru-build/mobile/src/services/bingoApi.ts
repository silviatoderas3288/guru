
import axios from 'axios';
import { API_URL } from '@env';

const bingoApi = axios.create({
  baseURL: `${API_URL}/api/v1/bingo`,
});

export interface BingoItem {
  id: string;
  title: string;
  position: number;
  completed: boolean;
}

export const getBingoItems = async () => {
  const response = await bingoApi.get<BingoItem[]>('/bingo_items');
  return response.data;
};

export const saveBingoItems = async (items: Omit<BingoItem, 'id'>[]) => {
  const response = await bingoApi.post<BingoItem[]>('/bingo_items', items);
  return response.data;
};
