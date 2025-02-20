import { client } from "../api";

export const getProducts = (prop) => {
  return client(
    `/sales/invoices/sales/search/${prop[0].type}/${prop[0].apiEnd}`,
    {
      method: "GET",
      filters: prop[0].filter,
    }
  );
};

export const getPurchaseProducts = (prop) => {
  return client(`/sales/invoices/purchase/search/${prop[0].type}`, {
    method: "GET",
    filters: prop[0].filter,
  });
};

export const fetchProducts = (props) => {
  return client(`/sales/products`, {
    method: "GET",
    filters: props.filter,
  });
};

export const fetchProductCount = (props) => {
  return client(`/sales/products/count`, {
    method: "GET",
    filters: props.filter,
  });
};

export const createInvoice = async (props) => {
  return client(`/sales/invoices/${props.type}`, {
    method: "POST",
    data: props.data,
  });
};

export const editInvoice= async (props) => {
  return client(`/sales/invoices/${props.type}/${props.id}`, {
    method: "PUT",
    data: props.data,
  });
};

export const deleteInvoice = (prop) => {
  return client(
    `/sales/invoices/${Array.isArray(prop) ? prop?.[0]?.apiEnd : prop.apiEnd}`,
    {
      method: "DELETE",
      filters: Array.isArray(prop) ? prop?.[0]?.filters : prop.filters,
    }
  );
};

export const createOperationInvoice = async (data) => {
  return client("/transaction/invoices", {
    method: "POST",
    data,
  });
};

export const editOperationInvoice = async (props) => {
  return client(`/transaction/invoices/${props.id}`, {
    method: "PUT",
    data: props.data,
  });
};

export const createOperationTransfer = async (data) => {
  return client("/transactions/moneyTransfer/", {
    method: "POST",
    data,
  });
};

export const editOperationTransfer = async (props) => {
  return client(`/transactions/moneyTransfer/${props.id}`, {
    method: "PUT",
    data: props.data,
  });
};

export const createExpensePayment = async (prop) => {
  return client("/transactions/multiple-payment", {
    method: "POST",
    data: prop.data,
    filters: Array.isArray(prop) ? prop?.[0]?.filters : prop.filters,
  });
};

export const editExpensePayment = async (props) => {
  return client(`/transactions/multiple-payment/${props.id}`, {
    method: "PUT",
    data: props.data,
  });
};

export const fetchSalesInvoiceInfo = (prop) => {
  return client(`/sales/invoices/invoice/${prop?.apiEnd}`, {
    method: "GET",
    filters: Array.isArray(prop) ? prop?.[0]?.filter : prop.filter,
  });
};

export const fetchProductsFromCatalog = (prop) => {
  return client(
    `/sales/invoices/purchase/catalogs/${
      Array.isArray(prop) ? prop?.[0]?.apiEnd : prop.apiEnd
    }/extended/products`,
    {
      method: "GET",
      filters: Array.isArray(prop) ? prop?.[0]?.filter : prop.filter,
    }
  );
};

export const fetchTransferProductsFromCatalog = (prop) => {
  return client(
    `/sales/invoices/sales/products/${
      Array.isArray(prop) ? prop?.[0]?.apiEnd : prop.apiEnd
    }`,
    {
      method: "GET",
      filters: Array.isArray(prop) ? prop?.[0]?.filter : prop.filter,
    }
  );
};

export const fetchSalesProductsFromCatalog = (prop) => {
  return client(`/sales/products`, {
    method: "GET",
    filters: Array.isArray(prop) ? prop?.[0]?.filter : prop.filter,
  });
};

export const fetchCatalogs = (prop) => {
  return client(
    prop?.[0]?.apiEnd
      ? `/sales/invoices/sales/catalogs/${prop?.[0]?.apiEnd}`
      : `/sales/invoices/purchase/catalogs`,
    {
      method: "GET",
      filters: prop?.[0]?.filter,
    }
  );
};

export const fetchSalesCatalogs = (prop) => {
  return client(`/sales/product/catalogs`, {
    method: "GET",
    filters: prop?.[0]?.filter,
  });
};

export const fetchSalesLastInvoice = (prop) => {
  return client(`/sales/invoices/last-invoices`, {
    method: "GET",
    filters: prop?.filter,
  });
};

export const fetchProductInvoices = (prop) => {
  return client(
    `/sales/invoices/sales/invoices/${prop?.apiEnd}/${prop?.apiEndTwo}`,
    {
      method: "GET",
      filters: prop?.filter,
    }
  );
};

export const fetchSalesInvoiceList = (prop) => {
  return client(`/sales/invoices`, {
    method: "GET",
    filters: Array.isArray(prop) ? prop?.[0]?.filter : prop?.filter,
  });
};

export const fetchSalesInvoicesCount = (prop) => {
  return client(`/sales/invoices/count`, {
    method: "GET",
    filters: prop?.filter,
  });
};

export const getCost = (props) => {
  return client(`/sales/invoices/cost`, {
    method: "PUT",
    data: props.data,
  });
};

export const fetchStatusOperations = (prop) => {
  return client(`/sales/status/operation-settings`, {
    method: "GET",
    filters: prop?.filter,
  });
};

export const editInvoiceStatus = (prop) => {
  return client(`/sales/invoices/status/${prop?.id}?status=${prop?.statusId}`, {
    method: "PUT",
    filters: prop?.filter,
  });
};

export const fetchBarterInvoices = (prop) => {
  return client(`/transactions/invoice-payments/${prop?.transactionId}`, {
    method: "GET",
    filters: prop?.filter,
  });
};


export const fetchSalesBuysForms = (prop) => {
  return client(`/data-export/sample-documents`, {
    method: "GET",
    filters: Array.isArray(prop) ? prop?.[0]?.filter : prop?.filter,
  });
};