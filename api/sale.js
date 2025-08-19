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
    withResp: props.withResp,
  });
};

export const fetchReturnProducts = (prop) => {
  return client(`/sales/invoices/returnFromCustomer/products`, {
    method: "GET",
    filters: Array.isArray(prop) ? prop?.[0]?.filter : prop.filter,
    withResp: prop.withResp,
  });
};

export const fetchProduct = (prop) => {
  return client(
    `/sales/product/${Array.isArray(prop) ? prop?.[0]?.apiEnd : prop.apiEnd}`,
    {
      method: "GET",
      filters: Array.isArray(prop) ? prop?.[0]?.filters : prop.filters,
    }
  );
};

export const fetchBarcodeTypes = (prop) => {
  return client(`/sales/barcode-configurations/2`, {
    method: "GET",
    filters: Array.isArray(prop) ? prop?.[0]?.filters : prop.filters,
  });
};

export const fetchFreeBarcodeTypes = (prop) => {
  return client(`/sales/barcode-configurations/1`, {
    method: "GET",
    filters: Array.isArray(prop) ? prop?.[0]?.filters : prop.filters,
  });
};

export const generateBarcode = (prop) => {
  return client(
    `/sales/barcode-configurations/generate/${
      Array.isArray(prop) ? prop?.[0]?.apiEnd : prop.apiEnd
    }`,
    {
      method: "GET",
      filters: Array.isArray(prop) ? prop?.[0]?.filters : prop.filters,
    }
  );
};

export const fetchMeasurements = (prop) => {
  return client(`/sales/product/unitOfMeasurements`, {
    method: "GET",
    filters: Array.isArray(prop) ? prop?.[0]?.filters : prop.filters,
  });
};

export const fetchProductCount = (props) => {
  return client(`/sales/products/count`, {
    method: "GET",
    filters: props.filter,
  });
};

export const getCompositon = async (prop) => {
  return client(
    `/sales/products/materials/${
      Array.isArray(prop) ? prop?.[0]?.id : prop.id
    }`,
    {
      method: "GET",
      data: Array.isArray(prop) ? prop?.[0]?.filters : prop.filters,
    }
  );
};

export const createCompositon = async (props) => {
  console.log(props);
  return client(`/sales/products/materials/${props.id}`, {
    method: "POST",
    data: props.data,
  });
};

export const createProduct = async (props) => {
  return client(`/sales/products`, {
    method: "POST",
    data: props.data,
  });
};

export const createInvoice = async (props) => {
  return client(`/sales/invoices/${props.type}`, {
    method: "POST",
    data: props.data,
  });
};

export const editInvoice = async (props) => {
  return client(`/sales/invoices/${props.type}/${props.id}`, {
    method: "PUT",
    data: props.data,
  });
};

export const editNewReturnInvoice = async (props) => {
  return client(`/sales/invoices/returnFromCustomer/with-payment/${props.id}`, {
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

export const fetchReturnFromCustomerCatalogs = (prop) => {
  return client(`/sales/invoices/returnFromCustomer/catalogs`, {
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

export const fetchReturnInvoice = (prop) => {
  return client(
    `/sales/invoices/returnFromCustomer/invoices/${prop?.apiEnd}/${prop?.apiEndTwo}`,
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
    withResp: prop.withResp,
  });
};

export const fetchSalesInvoicesCount = (prop) => {
  return client(`/sales/invoices/count`, {
    method: "GET",
    filters: Array.isArray(prop) ? prop?.[0]?.filter : prop?.filter,
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

export const fetchStatuses = (prop) => {
  return client(`/sales/status`, {
    method: "GET",
    filters: Array.isArray(prop) ? prop?.[0]?.filter : prop?.filter,
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

export const fetchLabels = (prop) => {
  return client(`/sales/labels`, {
    method: "GET",
    filters: Array.isArray(prop) ? prop?.[0]?.filter : prop?.filter,
  });
};

export const fetchCustomerTypes = (prop) => {
  return client(`/sales/product/productPriceTypes`, {
    method: "GET",
    filters: Array.isArray(prop) ? prop?.[0]?.filter : prop?.filter,
  });
};
