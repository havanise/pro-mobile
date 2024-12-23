import AsyncStorage from "@react-native-async-storage/async-storage";

export const setData = async (name, value) => {
  try {
    await AsyncStorage.setItem(name, value);
  } catch (e) {
    console.log("saving error", e);
  }
};

export const getData = (name) => {
  try {
    const value = AsyncStorage.getItem(name);
    return value;
  } catch (e) {
    // error reading value
  }

  // try {
  //     return await AsyncStorage.getItem(`${name}`)
  // } catch (e) {
  //     console.log('error reading value', e)
  // }
};

const removeData = async (name) => {
  try {
    await AsyncStorage.removeItem(`${name}`);
  } catch (e) {
    console.log("remove error", e);
  }
};

export const storage = {
  get: (name) => getData(name),
  set: (name, value) => setData(name, value),
  remove: (name) => removeData(name),
};

export const saveToken = async (data, tenantId) => {
  const { accessToken, deviceToken, tenants } = data;
  setData("TKN", accessToken);
  setData("DTKN", deviceToken);
  setData("TNT", tenantId ? `${tenantId}` : `${tenants[0]?.id}`);
  return true;
};

export const saveBusinessUnit = async (businessUnit) => {
  setData("TKN_UNIT", `${businessUnit}`);
  return true;
};

export const clearBusinessUnit = async () => {
  storage.remove("TKN_UNIT");
  return true;
};

export const  clearToken = async (reload = true) => {
  storage.remove("TKN");
  storage.remove("DTKN");
  storage.remove("TNT");
  storage.remove("TKN_UNIT");
  if (reload) {
    return true;
  }
};
