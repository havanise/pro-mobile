import { client } from "../api";

export const fetchReportList = (prop) => {
  return client(`/transaction/report/profit-and-loss`, {
    method: "GET",
    filters: prop?.filter,
  });
};

export const fetchRecievables = (prop) => {
  return client(`/transaction/report/recievables`, {
    method: "GET",
    filters: prop?.filter,
  });
};

export const fetchRecievablesCount = (prop) => {
  return client(`/transaction/report/recievables/count`, {
    method: "GET",
    filters: prop?.filter,
  });
};
