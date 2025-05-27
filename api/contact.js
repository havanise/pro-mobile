import { client } from "../api";

export const getCounterparties = async (prop) => {
  return client(`/contacts`, {
    method: "GET",
    filters: Array.isArray(prop) ? prop?.[0]?.filter : prop.filter,
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
  return client(
    `/contacts/unpaid-or-partially-paid-invoices/${
      Array.isArray(prop) ? prop?.[0]?.apiEnd : prop.apiEnd
    }`,
    {
      method: "GET",
      filters: Array.isArray(prop) ? prop?.[0]?.filter : prop.filter,
    }
  );
};

export const fetchBrands = (prop) => {
  return client(`/contact/brand`, {
    method: "GET",
    filters: Array.isArray(prop) ? prop?.[0]?.filter : prop.filter,
  });
};

export const remove_phone_numbers = (prop) => {
  return client(`/contact-phone-numbers`, {
    method: "DELETE",
    filters: Array.isArray(prop) ? prop?.[0]?.filters : prop.filters,
  });
};

export const createContact = async (prop) => {
  return client("/contacts", {
    method: "POST",
    data: prop.data,
    filters: Array.isArray(prop) ? prop?.[0]?.filters : prop.filters,
  });
};
