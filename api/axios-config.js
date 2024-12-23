import axios from "axios";
import Toast from "react-native-toast-message";
import { storage, filterQueryResolver, clearToken, getData } from "../utils";

let requestURL = "";
let baseURL = "https://devcore.prospectsmb.com/v1";
// if (process.env.NODE_ENV === 'development') {
//     baseURL = 'https://devcore.prospectsmb.com/v1';
// } else {
//     baseURL = process.env.REACT_APP_API_URL;
// }
const nonAuthRequiredUrls = [
  "/login",
  "/register",
  "/recovery",
  "/password/recovery",
  "/invitation",
  "/invitation/accept",
];
export const client = async (
  endPoint,
  {
    data,
    method = data ? "POST" : "GET",
    filters = {},
    headers,
    ...customConfig
  } = {}
) => {
  const defaultHeaders = {};
  const token = await getData("TKN").then((result) => {
    return result;
  });
  const tenant = await getData("TNT").then((result) => {
    return result;
  });
  const businessUnit = await getData("TKN_UNIT").then((result) => {
    return result;
  });

  if (
    typeof token === "string" &&
    tenant &&
    !nonAuthRequiredUrls.includes(endPoint)
  ) {
    defaultHeaders["X-AUTH-PROTOKEN"] = token;
    defaultHeaders["X-TENANT-ID"] = Number(tenant);
    if ((method === "POST" || method === "delete") && businessUnit !== "0") {
      defaultHeaders["X-BUSINESS-UNIT-ID"] = Number(businessUnit);
    }
  }

  const query = filterQueryResolver(filters);

  if (query) {
    requestURL = `${customConfig.uri || baseURL}${endPoint}?${query}`;
  } else {
    requestURL = `${customConfig.uri || baseURL}${endPoint}`;
  }

  const config = {
    url: requestURL,
    data,
    method,
    headers: {
      ...defaultHeaders,
      ...headers,
    },
    ...customConfig,
  };

  return axios
    .request(config)
    .then((res) => res?.data?.data)
    .catch((error) => {
      const errorMessage = error?.response?.data?.error?.message;
      Toast.show({
        type: "error",
        text2: errorMessage,
        topOffset: 50,
      });
      if (errorMessage === "Access token is wrong") {
        clearToken();
      }
      throw error;
    });
};
