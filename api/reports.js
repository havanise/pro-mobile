import { client } from "../api";

export const fetchReportList = (prop) => {
    return client(`/transaction/report/profit-and-loss`, {
      method: "GET",
      filters: prop?.filter,
    });
  };