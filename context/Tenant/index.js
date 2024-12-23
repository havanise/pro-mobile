import React, { useState, createContext } from "react";

export const TenantContext = createContext();

export const TenantContextProvider = (props) => {
  const [profile, setProfile] = useState({});
  const [tenant, setTenant] = useState({});
  const [tenants, setTenants] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [permissionsByKeyValue, setPermissionsByKeyValue] = useState({});
  const [BUSINESS_TKN_UNIT, setBusinessUnitId] = useState(undefined);
  const [tableSettings, setTableSettings] = useState({});
  const [tenantPersonRoles, setTenantPersonRoles] = useState({
    1: [], // Role warehouseman
    2: [], // Role forwarder
    3: [], // Role operator
  });
  return (
    <TenantContext.Provider
      value={{
        profile,
        setProfile,
        tenant,
        setTenant,
        tenants,
        setTenants,
        tenantPersonRoles,
        setTenantPersonRoles,
        BUSINESS_TKN_UNIT,
        setBusinessUnitId,
        permissions,
        setPermissions,
        permissionsByKeyValue,
        setPermissionsByKeyValue,
        tableSettings,
        setTableSettings,
      }}
    >
      {props.children}
    </TenantContext.Provider>
  );
};
