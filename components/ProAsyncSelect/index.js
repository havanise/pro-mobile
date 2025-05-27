import React, { useRef, useEffect, useState } from "react";
import { useApi } from "../../hooks";
import { FontAwesome, Entypo } from "@expo/vector-icons";
import { Controller } from "react-hook-form";
import { Dropdown, MultiSelect } from "react-native-element-dropdown";
import { isEmpty } from "lodash";
import {
  Text,
  FlatList,
  RefreshControl,
  View,
  ActivityIndicator,
  StyleSheet,
} from "react-native";

const defaultItemValue = {
  name: "",
  id: 0,
};

const RenderEmpty = () => {
  return (
    <View>
      <Text>List Empty!</Text>
    </View>
  );
};

const RenderFooter = ({ isLoading }) => {
  if (!isLoading) {
    return null;
  }
  return (
    <View>
      <ActivityIndicator color={"gray"} size={"large"} />
    </View>
  );
};

const ProAsyncSelect = ({
  data = [],
  setData,
  fetchData,
  async = false,
  filter,
  handleSearch,
  searchWithBack = false,
  label,
  required = false,
  name,
  control,
  notForm = false,
  notValue = false,
  disabled = false,
  handleSelectValue = () => {},
  defaultValue = false,
  style = undefined,
  allowClear = true,
  width = "100%",
  valueName = undefined,
  valueNameTwo = "name",
  selectedValueFromParent = undefined,
  catalog = false,
  isMulti = false,
  apiEnd,
  combineValue = false,
  withProductCode = false,
  searchName = false,
}) => {
  const [nextPage, setNextPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const [isSearch, setIsSearch] = useState(false);
  const [isFocus, setIsFocus] = useState(false);
  const [selectedValue, setSelectedValue] = useState(defaultValue);
  const [reachedEnd, setReachedEnd] = useState(false);
  const [callFunc, setCallFunc] = useState(false);
  const [multiSelected, setMultiSelected] = useState(defaultValue || []);
  const [defValue, setDefValue] = useState([]);

  const { isLoad, run } = useApi({
    deferFn: fetchData,
    onResolve: (resp) => {
      if (catalog) {
        if (resp) {
          const ids = new Set(resp.root?.map((d) => d.id));
          const merged = [...data?.filter((d) => !ids.has(d.id)), ...resp.root];
          setData(
            merged.map((item) => ({
              ...item,
              label: item.name,
              value: item.id,
            }))
          );
          setReachedEnd(resp.root.length === 0);
        }
      } else {
        const ids = new Set(
          resp.map((d) => {
            return `${d.id}${
              d.unitOfMeasurementId ? d.unitOfMeasurementId : ""
            }`;
          })
        );

        const merged = [...data.filter((d) => !ids.has(`${d.id}`)), ...resp];
        if (callFunc) {
          setData([
            ...defValue,
            ...resp.map((item) => ({
              ...item,
              label: withProductCode
                ? item.productCode !== null
                  ? `${item.name} / ${item.productCode}`
                  : item.name
                : combineValue
                ? `${item[valueNameTwo]} ${item[valueName]} `
                : valueName
                ? item[valueName]
                  ? item[valueName]
                  : item[valueNameTwo]
                : item.name,
              value: item.id,
            })),
          ]);
          setCallFunc(false);
        } else {
          setData(
            merged.map((item) => ({
              ...item,
              label: withProductCode
                ? item.productCode !== null
                  ? `${item.name} / ${item.productCode}`
                  : item.name
                : combineValue
                ? `${item[valueNameTwo]} ${item[valueName]} `
                : valueName
                ? item[valueName]
                  ? item[valueName]
                  : item[valueNameTwo]
                : item.name,
              value: item.id,
            }))
          );
        }
        setReachedEnd(resp.length === 0);
      }
      setNextPage(nextPage + 1);
    },
    onReject: (error) => {
      console.log(error, "rejected");
    },
  });

  useEffect(() => {
    if (callFunc) {
      run({
        filter: { ...filter, page: 1 },
        apiEnd: apiEnd,
      });
    }
  }, [callFunc]);

  useEffect(() => {
    if (isMulti && !notForm && defaultValue) {
      setMultiSelected(defaultValue)
    }
  }, [isMulti, notForm, defaultValue]);

  const onRefresh = () => {
    fetchApi("https://pokeapi.co/api/v2/pokemon?limit=20&offset=0", true);
  };

  const onLoadMore = () => {
    if (!isSearch) {
      setIsLoading(true);
      run({
        filter: { ...filter, page: async ? nextPage + 1 : undefined },
        apiEnd: apiEnd,
      });
    }
  };

  return (
    <View
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 10,
        width: width,
      }}
    >
      <View style={{ display: "flex", flexDirection: "row", gap: 3 }}>
        {label ? <Text>{label}</Text> : null}
        {required ? (
          <Text style={{ color: "red", marginLeft: "5px" }}>*</Text>
        ) : null}
      </View>
      {notForm ? (
        isMulti ? (
          <MultiSelect
            disable={disabled}
            style={[
              styles.dropdown,
              isFocus && { borderColor: "blue" },
              disabled && { backgroundColor: "#ececec" },
              style && style,
            ]}
            placeholderStyle={styles.placeholderStyle}
            selectedTextStyle={styles.selectedTextStyle}
            inputSearchStyle={styles.inputSearchStyle}
            data={data}
            search
            maxHeight={300}
            labelField="label"
            valueField="value"
            placeholder={!isFocus ? "Seçin" : "..."}
            searchPlaceholder="Search..."
            value={multiSelected}
            onFocus={() => {
              setIsFocus(true);
              if (async && filter.page === 1 && isEmpty(data)) {
                run({
                  filter: { ...filter, page: 1 },
                  apiEnd: apiEnd,
                });
              }
            }}
            onBlur={() => {
              setIsFocus(false);
              if (searchWithBack) {
                setData([]);
              } else {
                if (async && nextPage !== 1) {
                  setNextPage(1);
                  setCallFunc(true);
                }
              }
            }}
            onChange={(item) => {
              setMultiSelected(item);
              handleSelectValue({ list: item, id: item[item.length - 1] });
              setIsFocus(false);
              if (async && nextPage !== 1) {
                setDefValue(data.filter((it) => it.value === item.value));
              }
            }}
            onChangeText={(keyword) => {
              if (searchWithBack || async) {
                setIsSearch(keyword.length > 0);
                if (searchWithBack) {
                  if (keyword.length > 2) {
                    handleSearch(keyword);
                  }
                } else {
                  run({
                    filter: {
                      ...filter,
                      page: async ? 1 : undefined,
                      name: async ? keyword : undefined,
                    },
                    apiEnd: apiEnd,
                  });
                }
              }
            }}
            flatListProps={{
              // ListEmptyComponent: <RenderEmpty />,
              ListFooterComponent: !reachedEnd && (
                <RenderFooter isLoading={isLoading} />
              ),
              refreshControl: (
                <RefreshControl refreshing={false} onRefresh={onRefresh} />
              ),
              onEndReachedThreshold: 0.5,
              onEndReached: async && !reachedEnd ? onLoadMore : () => {},
            }}
          />
        ) : (
          <Dropdown
            disable={disabled}
            style={[
              styles.dropdown,
              isFocus && { borderColor: "blue" },
              disabled && { backgroundColor: "#ececec" },
              style && style,
            ]}
            placeholderStyle={styles.placeholderStyle}
            selectedTextStyle={styles.selectedTextStyle}
            inputSearchStyle={styles.inputSearchStyle}
            data={data}
            search
            maxHeight={300}
            labelField="label"
            valueField="value"
            placeholder={!isFocus ? "Seçin" : "..."}
            searchPlaceholder="Search..."
            value={
              notValue
                ? undefined
                : selectedValueFromParent
                ? selectedValueFromParent
                : selectedValue
            }
            onFocus={() => {
              setIsFocus(true);
            }}
            onBlur={() => {
              setIsFocus(false);
              setData([]);
            }}
            onChange={(item) => {
              setSelectedValue(item.value);
              handleSelectValue(item.id);
              setIsFocus(false);
            }}
            onChangeText={(keyword) => {
              if (searchWithBack || async) {
                setIsSearch(keyword.length > 0);
                if (searchWithBack) {
                  if (keyword.length > 2) {
                    handleSearch(keyword);
                  }
                } else {
                  run({
                    filter: {
                      ...filter,
                      page: async ? 1 : undefined,
                      name: async ? keyword : undefined,
                    },
                    apiEnd: apiEnd,
                  });
                }
              }
            }}
            flatListProps={{
              // ListEmptyComponent: <RenderEmpty />,
              ListFooterComponent: !reachedEnd && (
                <RenderFooter isLoading={isLoading} />
              ),
              refreshControl: (
                <RefreshControl refreshing={false} onRefresh={onRefresh} />
              ),
              onEndReachedThreshold: 0.5,
              onEndReached: async && !reachedEnd ? onLoadMore : () => {},
            }}
          />
        )
      ) : (
        <Controller
          control={control}
          rules={{
            required: required ? "Bu dəyər boş olmamalıdır" : false,
          }}
          render={({ field: { value, onChange }, fieldState: { error } }) => {
            return isMulti ? (
              <MultiSelect
                disable={disabled}
                style={[
                  styles.dropdown,
                  isFocus && { borderColor: "blue" },
                  disabled && { backgroundColor: "#ececec" },
                  style && style,
                ]}
                placeholderStyle={styles.placeholderStyle}
                selectedTextStyle={styles.selectedTextStyle}
                inputSearchStyle={styles.inputSearchStyle}
                data={data}
                search
                maxHeight={300}
                labelField="label"
                valueField="value"
                placeholder={!isFocus ? "Seçin" : "..."}
                searchPlaceholder="Search..."
                value={multiSelected}
                onFocus={() => {
                  setIsFocus(true);
                  if (async && filter.page === 1 && isEmpty(data)) {
                    run({
                      filter: { ...filter, page: 1 },
                      apiEnd: apiEnd,
                    });
                  }
                }}
                onBlur={() => {
                  setIsFocus(false);
                  if (searchWithBack) {
                    setData([]);
                  } else {
                    if (async && nextPage !== 1) {
                      setNextPage(1);
                      setCallFunc(true);
                    }
                  }
                }}
                onChange={(item) => {
                  onChange(item);
                  console.log(item, "uehebbeb");
                  setMultiSelected(item);
                  handleSelectValue({ list: item, id: item[item.length - 1] });
                  setIsFocus(false);
                  if (async && nextPage !== 1) {
                    setDefValue(data.filter((it) => it.value === item.value));
                  }
                }}
                onChangeText={(keyword) => {
                  if (searchWithBack || async) {
                    setIsSearch(keyword.length > 0);
                    if (searchWithBack) {
                      if (keyword.length > 2) {
                        handleSearch(keyword);
                      }
                    } else {
                      run({
                        filter: searchName
                          ? {
                              ...filter,
                              page: async ? 1 : undefined,
                              [searchName]: async ? keyword : undefined,
                            }
                          : {
                              ...filter,
                              page: async ? 1 : undefined,
                              name: async ? keyword : undefined,
                            },
                        apiEnd: apiEnd,
                      });
                    }
                  }
                }}
                flatListProps={{
                  // ListEmptyComponent: <RenderEmpty />,
                  ListFooterComponent: !reachedEnd && (
                    <RenderFooter isLoading={isLoading} />
                  ),
                  refreshControl: (
                    <RefreshControl refreshing={false} onRefresh={onRefresh} />
                  ),
                  onEndReachedThreshold: 0.5,
                  onEndReached: async && !reachedEnd ? onLoadMore : () => {},
                }}
              />
            ) : (
              <>
                <Dropdown
                  disable={disabled}
                  style={[
                    styles.dropdown,
                    isFocus && { borderColor: "blue" },
                    disabled && { backgroundColor: "#ececec" },
                  ]}
                  placeholderStyle={styles.placeholderStyle}
                  selectedTextStyle={styles.selectedTextStyle}
                  inputSearchStyle={styles.inputSearchStyle}
                  data={data}
                  search
                  maxHeight={300}
                  labelField="label"
                  valueField="id"
                  placeholder={"Seçin"}
                  searchPlaceholder="Search..."
                  value={value}
                  onFocus={() => {
                    setIsFocus(true);
                    if (async && filter.page === 1 && isEmpty(data)) {
                      run({
                        filter: { ...filter, page: 1 },
                        apiEnd: apiEnd,
                      });
                    }
                  }}
                  onBlur={() => {
                    setIsFocus(false);
                    if (searchWithBack) {
                      setData([]);
                    } else {
                      if (async && nextPage !== 1) {
                        setNextPage(1);
                        setCallFunc(true);
                      }
                    }
                  }}
                  onChange={(item) => {
                    onChange(item.value || item.id);
                    setIsFocus(false);
                    handleSelectValue(item.id);
                    if (async && nextPage !== 1) {
                      setDefValue(data.filter((it) => it.value === item.value));
                    }
                  }}
                  renderRightIcon={(item) => {
                    return (
                      <>
                        <View
                          style={{ flexDirection: "row", alignItems: "center" }}
                        >
                          {value !== undefined && allowClear && (
                            <Text
                              onPress={() => {
                                onChange(undefined);
                              }}
                              style={{ marginRight: 6 }}
                            >
                              <FontAwesome
                                name="close"
                                size={14}
                                color="black"
                              />
                            </Text>
                          )}
                          <Text
                            onPress={() => {
                              console.log("clickdown");
                            }}
                            style={{ marginRight: 10 }}
                          >
                            <Entypo
                              name="chevron-small-down"
                              size={20}
                              color="black"
                            />
                          </Text>
                        </View>
                      </>
                    );
                  }}
                  onChangeText={(keyword) => {
                    if (searchWithBack || async) {
                      setIsSearch(keyword.length > 0);
                      if (searchWithBack) {
                        if (keyword.length > 2) {
                          handleSearch(keyword);
                        }
                      } else {
                        run({
                          filter: {
                            ...filter,
                            page: async ? 1 : undefined,
                            name: async ? keyword : undefined,
                          },
                          apiEnd: apiEnd,
                        });
                      }
                    }
                  }}
                  flatListProps={{
                    // ListEmptyComponent: <RenderEmpty />,
                    ListFooterComponent: !reachedEnd && (
                      <RenderFooter isLoading={isLoading} />
                    ),
                    refreshControl: (
                      <RefreshControl
                        refreshing={false}
                        onRefresh={onRefresh}
                      />
                    ),
                    onEndReachedThreshold: 0.5,
                    onEndReached: async && !reachedEnd ? onLoadMore : () => {},
                  }}
                />
                {error && <Text style={{ color: "red" }}>{error.message}</Text>}
              </>
            );
          }}
          name={name}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    padding: 16,
  },
  dropdown: {
    height: 50,
    borderColor: "gray",
    borderWidth: 0.5,
    borderRadius: 8,
    paddingHorizontal: 8,
  },
  icon: {
    marginRight: 5,
  },
  placeholderStyle: {
    fontSize: 16,
  },
  selectedTextStyle: {
    fontSize: 16,
  },
  iconStyle: {
    width: 20,
    height: 20,
  },
  inputSearchStyle: {
    height: 40,
    fontSize: 16,
  },
});

export default ProAsyncSelect;
