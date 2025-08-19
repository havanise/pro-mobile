import { client } from "../api";

export const getSettings = async (module) => {
  const modulName = module[0];
  return client(`/system/tenant-person-setting/columns-order`, {
    method: "GET",
    filters: {
      module: modulName,
    },
  });
};

export const createSettings = async (module) => {
  return client(`/system/tenant-person-setting/columns-order`, {
    method: "POST",
    data: module,
  });
};

export const fetchAllUserSettings = async () => {
  return client(`/system/tenant-person-setting`, {
    method: "GET",
  });
};

export const getBusinessUnit = (prop) => {
  return client(`/business-unit/business-units`, {
    method: "GET",
    filters: Array.isArray(prop) ? prop?.[0]?.filters : prop.filters,
  });
};

export const fetchBusinessSettings = (prop) => {
  const { id, businesUnitId } = prop[0];
  return client(
    `/business-unit/business-unit-tenant-person-setting/${id}/${businesUnitId}`,
    {
      method: "GET",
    }
  );
};

export const fetchVatSettings = () => {
  return client(`/sales/tax-settings`, {
    method: "GET",
  });
};
