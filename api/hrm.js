import { client } from '../api';

export const fetchWorkers = async filter => {
    return client(`/hrm/employees`, {
      method: 'GET',
      filters: filter[0]
    });
  };