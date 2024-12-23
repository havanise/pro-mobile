import { client } from "../api";

export const fetchSalesPrice = async (filter) => {
  return client(`/sales/invoices/sales/prices`, {
    method: "GET",
    filters: Array.isArray(filter) ? filter[0] : filter?.filter,
  });
};
