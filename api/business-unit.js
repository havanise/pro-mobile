import { client } from "../api";

export const fetchFilteredUnitCashbox = (props) => {
  return client(`/business-unit/business-unit-cashboxes`, {
    method: "GET",
    filters: props.filter,
  });
};
