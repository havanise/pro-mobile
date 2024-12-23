import { client } from '../api';

export const checkToken = async () => {
  return client('/checkAccessToken', {
    method: 'POST',
  });
};

export const login = async data => {
  const { email, password, deviceToken = null } = data[0];

  return client('/login', {
    data: {
      email,
      password,
      deviceToken,
    },
  });
};

export const integrate = async data => {
  const { headers } = data;
  return client('/call-center/integration/create', {
    method: 'POST',
    headers: headers || {},
  });
};

export const getNewToken = async data => {
  const { headers } = data[0] || data;
  return client('/call-center/integration/new-token', {
    headers: headers || {},
  });
};
