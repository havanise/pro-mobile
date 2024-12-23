import { client } from "../api";

export const getCounterparties = async (prop) => {
  const { apiEnd, filter } = prop[0];
  return client(`/contacts`, {
    method: "GET",
    filters: filter,
  });
};

export const fetchAdvancePaymentByContactId = (prop) => {
  const { apiEnd, filter } = prop[0];
  return client(`/contacts/advance/${apiEnd}`, {
    method: "GET", 
    filters: filter,
  });
};

export const fetchInvoiceListByContactId = (prop) => {
  return client(`/contacts/unpaid-or-partially-paid-invoices/${Array.isArray(prop) ? prop?.[0]?.apiEnd : prop.apiEnd}`, {
    method: "GET",
    filters: Array.isArray(prop) ? prop?.[0]?.filter : prop.filter,
  });
};