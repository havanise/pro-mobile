import { client } from "../api";

export const fetchCashboxNames = async (filter) => {
  return client(`/transaction/cashboxNames`, {
    method: "GET",
    filters: filter[0],
  });
};

export const getCashboxNames = (prop) => {
  const { apiEnd, filter } = prop[0];
  return client(`/transaction/cashboxNames/${apiEnd}`, {
    method: "GET",
    filters: filter,
  });
};

export const fetchMultipleAccountBalance = async (filter) => {
  return client(`/transaction/cashbox/balance`, {
    method: "GET",
    filters: filter[0],
  });
};

export const fetchAccountBalance = async (prop) => {
  return client(
    `/transaction/cashbox/balance/${
      Array.isArray(prop) ? prop?.[0]?.apiEnd : prop.apiEnd
    }`,
    {
      method: "GET",
      filters: Array.isArray(prop) ? prop?.[0]?.filters : prop.filters,
    }
  );
};

export const fetchTenantBalance = async (prop) => {
  return client(
    `/transactions/employee-payment/balance/${
      Array.isArray(prop) ? prop?.[0]?.apiEnd : prop.apiEnd
    }`,
    {
      method: "GET",
      filters: Array.isArray(prop) ? prop?.[0]?.filters : prop.filters,
    }
  );
};
