import { client } from '../api';

export const getEmployees = async prop => {
    return client(`/employees`, {
      method: 'GET',
      filters: Array.isArray(prop) ? prop?.[0]?.filter : prop.filters
    });
  };