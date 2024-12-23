import { client } from "../api";

export const getCurrencies = async (filter) => {
  return client(`/currencies`, {
    method: "GET",
    filters: filter[0],
  });
};

export const convertMultipleCurrencyPost = async (data, filter) => {
  const { mainTenantCurrency, rates_ul } = data;

  return client("/currencies/multiple-convert", {
    data: {
      mainTenantCurrency,
      rates_ul,
    },
    filters: filter,
  });
};

export const convertCurrency = (filter) => {
  return client(`/currencies/convert`, {
    method: "GET",
    filters: filter,
  });
};

export const fetchMainCurrency = () => {
  return client("/currencies/main", {
    method: "GET",
  });
};
