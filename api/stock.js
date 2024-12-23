import { client } from '../api';

export const getStock = async prop => {
    return client(`/sales/stocks`, {
      method: 'GET',
      filters:  Array.isArray(prop) ? prop?.[0]?.filter : prop.filter,
    });
  };