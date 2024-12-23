import { client } from "../api";

export const fetchTransactionList = (prop) => {
  return client(`/transactions`, {
    method: "GET",
    filters: prop?.filter,
  });
};

export const fetchTransactionsCount = (prop) => {
  return client(`/transactions/count`, {
    method: "GET",
    filters: prop?.filter,
  });
};

export const getExpenseCatalogs = (prop) => {
  return client(`/transaction/catalog/with-items`, {
    method: "GET",
    filters: Array.isArray(prop) ? prop?.[0] : prop?.filter,
  });
};

export const deleteTransaction = (prop) => {
  return client(
    `/transaction/cashbox/${Array.isArray(prop) ? prop?.[0]?.apiEnd : prop.apiEnd}`,
    {
      method: "DELETE",
      filters: Array.isArray(prop) ? prop?.[0]?.filters : prop.filters,
    }
  );
};