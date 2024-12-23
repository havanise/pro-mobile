import { client } from './axios-config';

export const fetchProfileInfo = () => {
    return client('/profiles');
};

export const fetchTenantInfo = () => {
    return client('/tenants/info');
};
export const fetchTenants = () => {
    return client('/tenants');
};
export const fetchPermissions = () => {
    return client('/authorization/roles/permissions');
};
