import { client } from "../api";

export const getContracts = async (prop) => {
  return client(`/sales/contracts`, {
    method: "GET",
    filters: Array.isArray(prop) ? prop?.[0]?.filter : prop.filter,
  });
};
