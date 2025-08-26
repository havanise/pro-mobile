/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Modal,
  Pressable,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Platform,
} from "react-native";
import { AntDesign } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import moment from "moment";
import {
  ProAsyncSelect,
  ProButton,
  ProDateRange,
  ProText,
} from "../../../components";
import ProSearch from "../../../components/ProSearch";
import {
  fetchSalesProductsFromCatalog,
  getContracts,
  getCounterparties,
  getEmployees,
  getStock,
} from "../../../api";
import { useApi } from "../../../hooks";
import { fetchSalesCatalogs, fetchStatuses } from "../../../api/sale";
import { getBusinessUnit } from "../../../api/operation-panel";
import { RadioButton } from "react-native-paper";
import { dateFormat } from "../../../utils/constants";

const FilterModal = ({
  isVisible,
  setIsVisible,
  setFilterCount,
  filter,
  setFilter,
  onBlur,
  defaultCurrency,
  currencies,
}) => {
  const [businessUnits, setBusinessUnits] = useState([]);
  const [filterSelectedBusinessId, setFilterSelectedBusinessId] = useState([]);

  const [counterparties, setCounterparties] = useState([]);
  const [filterSelectedCounterparties, setFilterSelectedCounterparties] =
    useState([]);

  const [employees, setEmployees] = useState([]);
  const [filterSelectedEmployees, setFilterSelectedEmployees] = useState([]);

  const [contactManagers, setContactManagers] = useState([]);
  const [filterSelectedContactManagers, setFilterSelectedContactManagers] =
    useState([]);

  const [agents, setAgents] = useState([]);
  const [filterSelectedAgents, setFilterSelectedAgents] = useState([]);

  const [headContacts, setHeadContacts] = useState([]);
  const [filterSelectedHeadContacts, setFilterSelectedHeadContacts] = useState(
    []
  );

  const [contracts, setContracts] = useState([]);
  const [filterSelectedContracts, setFilterSelectedContracts] = useState([]);

  const [stocks, setStock] = useState([]);
  const [filterSelectedStocks, setFilterSelectedStocks] = useState([]);

  const [status, setStatus] = useState([]);
  const [filterSelectedStatus, setFilterSelectedStatus] = useState([]);

  const [filterSelectedProduct, setFilterSelectedProduct] = useState([]);
  const [products, setProducts] = useState([]);

  const [dates, setDates] = useState({ startDate: null, endDate: null });

  const [catalogs, setCatalogs] = useState([]);
  const [childCatalogs, setChildCatalogs] = useState([]);

  const [filters, setFilters] = useState({
    currencyId: defaultCurrency,
    contacts: null,
    withContract: undefined,
    dateOfTransactionFrom: null,
    dateOfTransactionTo: null,
    daysFrom: null,
    datetime: null,
    statuses: undefined,
    daysTo: null,
    headContacts: null,
    stocks: null,
    amountToBePaidFrom: null,
    amountToBePaidTo: null,
    paidAmountPercentageFrom: null,
    paidAmountPercentageTo: null,
    salesmans: undefined,
    borrow: undefined,
    contracts: undefined,
    contactManagers: undefined,
    productCode: null,
    agents: null,
    productBarcode: null,
    products: undefined,
    parentCatalogs: null,
    catalogs: null,
    withDebt: 1,
    description: undefined,
    businessUnitIds:
      businessUnits?.length === 1
        ? businessUnits[0]?.id !== null
          ? [businessUnits[0]?.id]
          : undefined
        : undefined,
  });

  const formatToBakuTime = (date) => {
    return moment(date)?.format(dateFormat);
  };

  const handleConfirmClick = () => {
    let count = 0;

    if (filters.contacts?.length > 0) count++;
    if (filters.products?.length > 0) count++;
    if (filters.parentCatalogs?.length > 0) count++;
    if (filters.catalogs?.length > 0) count++;
    if (filters.statuses?.length > 0) count++;
    if (filters.stocks?.length > 0) count++;
    if (filters.contracts?.length > 0) count++;
    if (filters.salesmans?.length > 0) count++;
    if (filters.contactManagers?.length > 0) count++;
    if (filters.headContacts?.length > 0) count++;
    if (filters.agents?.length > 0) count++;
    if (filters.businessUnitIds?.length > 0) count++;
    if (filters.products?.length > 0) count++;

    if (filters.dateOfTransactionFrom && filters.dateOfTransactionFrom !== "")
      count++;
    if (filters.dateOfTransactionTo && filters.dateOfTransactionTo !== "")
      count++;
    if (filters.daysFrom && filters.daysFrom !== "") count++;
    if (filters.daysTo && filters.daysTo !== "") count++;
    if (filters.amountToBePaidFrom && filters.amountToBePaidFrom !== "")
      count++;
    if (filters.amountToBePaidTo && filters.amountToBePaidTo !== "") count++;
    if (
      filters.paidAmountPercentageFrom &&
      filters.paidAmountPercentageFrom !== ""
    )
      count++;
    if (filters.paidAmountPercentageTo && filters.paidAmountPercentageTo !== "")
      count++;
    if (
      filters.debtLimitExceedingAmountFrom &&
      filters.debtLimitExceedingAmountFrom !== ""
    )
      count++;
    if (
      filters.debtLimitExceedingAmountTo &&
      filters.debtLimitExceedingAmountTo !== ""
    )
      count++;
    if (filters.debtLimitFrom && filters.debtLimitFrom !== "") count++;
    if (filters.debtLimitTo && filters.debtLimitTo !== "") count++;
    if (filters.productCode && filters.productCode !== "") count++;
    if (filters.productBarcode && filters.productBarcode !== "") count++;
    if (filters.description && filters.description !== "") count++;
    if (filters.withContract) count++;
    if (filters.withDebt) count++;
    if (filters.currencyId !== defaultCurrency) count++;

    setFilterCount(count);
    setFilter({ ...filter, ...filters });
    setIsVisible(false);
  };

  React.useEffect(() => {
    if (onBlur) {
      setFilter({
        limit: 8,
        page: 1,
        currencyId: defaultCurrency,
        withDebt: 1,
      });
      setFilters({ stocks: [], withDebt: 1, currencyId: defaultCurrency });
      setFilterCount(0);
      setDates({ startDate: null, endDate: null });
    }
  }, [onBlur]);

  const { isLoading, run: runCatalog } = useApi({
    deferFn: fetchSalesCatalogs,
    onResolve: (data) => {
      let appendList = {};
      if (data) {
        appendList = data.root.map((item) => ({
          ...item,
          label: item.name,
          value: item.id,
        }));
      }
      setCatalogs(catalogs.concat(appendList));
      setChildCatalogs(data.children);
    },
    onReject: (error) => {
      console.log(error, "rejected");
    },
  });

  const updateFilter = (key, value) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      [key]: value,
    }));
  };

  const { isLoading: isLoadBusinessUnit, run: runBusinessUnit } = useApi({
    deferFn: getBusinessUnit,
    onResolve: (data) => {
      setBusinessUnits(
        data.map((item) => ({ ...item, label: item.name, value: item.id }))
      );
    },
    onReject: (error) => {
      console.log(error, "rejected");
    },
  });

  const { isLoading: isLoadCounterparties, run: runCounterparties } = useApi({
    deferFn: getCounterparties,
    onResolve: (data) => {
      console.log("okkkk");
      setCounterparties(
        data.map((item) => ({ ...item, label: item.name, value: item.id }))
      );
      setAgents(
        data.map((item) => ({ ...item, label: item.name, value: item.id }))
      );
      setHeadContacts(
        data.map((item) => ({ ...item, label: item.name, value: item.id }))
      );
    },
    onReject: (error) => {
      console.log(error, "rejected");
    },
  });

  const { isLoading: isLoadEmployee, run: runEmployee } = useApi({
    deferFn: getEmployees,
    onResolve: (data) => {
      setEmployees(
        data.map((item) => ({
          ...item,
          label: `${item.name} ${item.lastName}`,
          value: item.id,
        }))
      );
      setContactManagers(
        data.map((item) => ({
          ...item,
          label: `${item.name} ${item.lastName}`,
          value: item.id,
        }))
      );
    },
    onReject: (error) => {
      console.log(error, "rejected");
    },
  });

  const { isLoading: isLoadContracts, run: runContracts } = useApi({
    deferFn: getContracts,
    onResolve: (data) => {
      setContracts(
        data.map((item) => ({
          ...item,
          label: item.contract_no ? item.contract_no : item.serialNumber,
          value: item.id,
        }))
      );
    },
    onReject: (error) => {
      console.log(error, "rejected");
    },
  });

  const { isLoading: isLoadStock, run: runStock } = useApi({
    deferFn: getStock,
    onResolve: (data) => {
      setStock(
        data.map((item) => ({ ...item, label: item.name, value: item.id }))
      );
    },
    onReject: (error) => {
      console.log(error, "rejected");
    },
  });

  const { isLoading: isLoadStatus, run: runStatus } = useApi({
    deferFn: fetchStatuses,
    onResolve: (data) => {
      setStatus(
        data.map((item) => ({ ...item, label: item.name, value: item.id }))
      );
    },
    onReject: (error) => {
      console.log(error, "rejected");
    },
  });

  const { isLoading: isLoadProducts, run: runProducts } = useApi({
    deferFn: fetchSalesProductsFromCatalog,
    onResolve: (data) => {
      setProducts(
        data.map((item) => ({ ...item, label: item.name, value: item.id }))
      );
    },
    onReject: (error) => {
      console.log(error, "rejected");
    },
  });

  useEffect(() => {
    console.log(
      dates.startDate === null ? undefined : formatToBakuTime(dates.startDate)
    );
    setFilters((prevFilters) => ({
      ...prevFilters,
      dateOfTransactionFrom:
        dates.startDate === null
          ? undefined
          : formatToBakuTime(dates.startDate),
      dateOfTransactionTo:
        dates.endDate === null ? undefined : formatToBakuTime(dates.endDate),
    }));
  }, [dates]);
  useEffect(() => {
    if (defaultCurrency)
      setFilters((prevFilters) => ({
        ...prevFilters,
        currencyId: defaultCurrency,
      }));
  }, [defaultCurrency]);

  useEffect(() => {
    runStock({
      filter: {
        limit: 20,
        page: 1,
      },
    });
    runCatalog({
      filter: {
        limit: 20,
        page: 1,
      },
    });

    runProducts({
      filter: {
        limit: 20,
        page: 1,
        isDeleted: 0,
      },
    });
    runStatus({
      filter: {
        limit: 20,
        page: 1,
      },
    });
    runContracts({
      filter: {
        limit: 20,
        page: 1,
      },
    });
    runEmployee({
      filter: {
        limit: 20,
        page: 1,
      },
    });
    runCounterparties({
      filter: {
        limit: 20,
        page: 1,
      },
    });
    runBusinessUnit({
      filter: {
        limit: 20,
        page: 1,
      },
    });
  }, []);

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [time, setTime] = useState(new Date());
  const [show, setShow] = useState(false);
  const [mode, setMode] = useState("date");

  const showMode = (currentMode) => {
    setShow(true);
    setMode(currentMode);
  };

  const showDatePicker = () => {
    showMode("date");
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={() => {
        setIsVisible(false);
      }}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <ProText
            variant="heading"
            style={{ color: "black", marginBottom: 20 }}
          >
            Debitor borclar
          </ProText>
          <ScrollView>
            <View style={{ gap: 20 }}>
              <View style={{ display: "flex", flexDirection: "column" }}>
                <Text>Valyuta</Text>
                <ProAsyncSelect
                  defaultValue={filters.currencyId}
                  data={currencies}
                  setData={() => {}}
                  fetchData={() => {}}
                  filter={{}}
                  notForm
                  handleSelectValue={(val) => {
                    updateFilter("currencyId", val);
                  }}
                />
              </View>
              <View style={{ display: "flex", flexDirection: "column" }}>
                <Text>Biznes blok</Text>
                <ProAsyncSelect
                  isMulti
                  async
                  defaultValue={filters.businessUnitIds?.map((item) => {
                    return item === 0 ? null : item;
                  })}
                  data={
                    filterSelectedBusinessId.length > 0
                      ? [
                          ...filterSelectedBusinessId,
                          ...businessUnits.filter(
                            (item) =>
                              !filterSelectedBusinessId
                                .map(({ id }) => id)
                                ?.includes(item.id)
                          ),
                        ]
                      : businessUnits
                  }
                  setData={setBusinessUnits}
                  fetchData={getBusinessUnit}
                  filter={{ limit: 20, page: 1 }}
                  notForm
                  handleSelectValue={({ list }) => {
                    updateFilter(
                      "businessUnitIds",
                      list?.map((item) => {
                        return item === null ? 0 : item;
                      })
                    );
                  }}
                />
              </View>
              <View style={{ display: "flex", flexDirection: "column" }}>
                <Text>Tarix</Text>
                <TouchableOpacity
                  onPress={showDatePicker}
                  style={styles.inputContainerStyle}
                >
                  {selectedDate && (
                    <Text style={styles.textStyle}>
                      {moment(selectedDate).format("DD-MM-YYYY") +
                        " " +
                        moment(time).format("HH:mm:ss")}
                    </Text>
                  )}
                </TouchableOpacity>
                {show && (
                  <DateTimePicker
                    value={selectedDate}
                    maximumDate={moment().endOf("day").toDate()}
                    mode={mode}
                    is24Hour={true}
                    display="default"
                    onChange={(event, selectedValue) => {
                      setShow(Platform.OS === "ios");
                      if (mode == "date") {
                        const currentDate = selectedValue || new Date();
                        setSelectedDate(currentDate);
                        setMode("time");
                        setShow(Platform.OS !== "ios"); // to show time
                      } else {
                        const selectedTime = selectedValue || new Date();
                        setTime(selectedTime);
                        setShow(Platform.OS === "ios"); // to hide back the picker
                        setMode("date");
                        console.log(
                          moment(selectedDate).format("DD-MM-YYYY") +
                            " " +
                            moment(time).format("HH:mm:ss")
                        );
                      }
                    }}
                  />
                )}
              </View>
              <View style={{ display: "flex", flexDirection: "column" }}>
                <Text>Qarşı tərəf</Text>

                <ProAsyncSelect
                  defaultValue={
                    filters.contacts && filters.contacts !== null
                      ? filters.contacts[0]
                      : undefined
                  }
                  async
                  data={
                    filterSelectedCounterparties.length > 0
                      ? [
                          ...filterSelectedCounterparties,
                          ...counterparties.filter(
                            (item) =>
                              !filterSelectedCounterparties
                                .map(({ id }) => id)
                                ?.includes(item.id)
                          ),
                        ]
                      : counterparties
                  }
                  setData={setCounterparties}
                  fetchData={getCounterparties}
                  filter={{ limit: 20, page: 1 }}
                  notForm
                  handleSelectValue={(val) => {
                    updateFilter("contacts", [val]);
                  }}
                  allowClearNotForm
                />
              </View>
              <View style={{ display: "flex", flexDirection: "column" }}>
                <Text>Menecer</Text>

                <ProAsyncSelect
                  isMulti
                  defaultValue={filters.salesmans}
                  async
                  combineValue
                  valueName="lastName"
                  data={
                    filterSelectedEmployees.length > 0
                      ? [
                          ...filterSelectedEmployees,
                          ...employees.filter(
                            (item) =>
                              !filterSelectedEmployees
                                .map(({ id }) => id)
                                ?.includes(item.id)
                          ),
                        ]
                      : employees
                  }
                  setData={setEmployees}
                  fetchData={getEmployees}
                  filter={{ limit: 20, page: 1 }}
                  notForm
                  handleSelectValue={({ list }) => {
                    updateFilter("salesmans", list);
                  }}
                />
              </View>
              <View style={{ display: "flex", flexDirection: "column" }}>
                <Text>Əlaqə meneceri</Text>

                <ProAsyncSelect
                  isMulti
                  defaultValue={filters.contactManagers}
                  async
                  data={
                    filterSelectedContactManagers.length > 0
                      ? [
                          ...filterSelectedContactManagers,
                          ...contactManagers.filter(
                            (item) =>
                              !filterSelectedContactManagers
                                .map(({ id }) => id)
                                ?.includes(item.id)
                          ),
                        ]
                      : contactManagers
                  }
                  setData={setContactManagers}
                  fetchData={getEmployees}
                  filter={{ limit: 20, page: 1 }}
                  notForm
                  combineValue
                  valueName="lastName"
                  handleSelectValue={({ list }) => {
                    updateFilter("contactManagers", list);
                  }}
                />
              </View>
              <View style={{ display: "flex", flexDirection: "column" }}>
                <Text>Agent</Text>

                <ProAsyncSelect
                  isMulti
                  defaultValue={filters.agents}
                  async
                  data={
                    filterSelectedAgents.length > 0
                      ? [
                          ...filterSelectedAgents,
                          ...agents.filter(
                            (item) =>
                              !filterSelectedAgents
                                .map(({ id }) => id)
                                ?.includes(item.id)
                          ),
                        ]
                      : agents
                  }
                  setData={setAgents}
                  fetchData={getCounterparties}
                  filter={{ limit: 20, page: 1 }}
                  notForm
                  handleSelectValue={({ list }) => {
                    updateFilter("agents", list);
                  }}
                />
              </View>
              <View style={{ display: "flex", flexDirection: "column" }}>
                <Text>Anbar</Text>
                <ProAsyncSelect
                  isMulti
                  async
                  defaultValue={filters.stocks}
                  data={
                    filterSelectedStocks.length > 0
                      ? [
                          ...filterSelectedStocks,
                          ...stocks.filter(
                            (item) =>
                              !filterSelectedStocks
                                .map(({ id }) => id)
                                ?.includes(item.id) && item.id !== 0
                          ),
                        ]
                      : stocks.filter((item) => item.id !== 0)
                  }
                  setData={setStock}
                  fetchData={getStock}
                  filter={{ limit: 20, page: 1 }}
                  notForm
                  handleSelectValue={({ list }) => {
                    updateFilter("stocks", list);
                  }}
                />
              </View>
              <View style={{ display: "flex", flexDirection: "column" }}>
                <Text>Müqavilə</Text>

                <ProAsyncSelect
                  isMulti
                  defaultValue={filters.contracts}
                  async
                  valueName="contract_no"
                  valueNameTwo="serialNumber"
                  data={
                    filterSelectedContracts.length > 0
                      ? [
                          ...filterSelectedContracts,
                          ...contracts.filter(
                            (item) =>
                              !filterSelectedContracts
                                .map(({ id }) => id)
                                ?.includes(item.id)
                          ),
                        ]
                      : contracts
                  }
                  setData={setContracts}
                  fetchData={getContracts}
                  filter={{ limit: 20, page: 1, categories: [8] }}
                  notForm
                  handleSelectValue={({ list }) => {
                    updateFilter("contracts", list);
                  }}
                />
              </View>
              <View style={{ display: "flex", flexDirection: "column" }}>
                <Text>İcra statusu</Text>

                <ProAsyncSelect
                  isMulti
                  defaultValue={filters.statuses}
                  async
                  data={
                    filterSelectedStatus.length > 0
                      ? [
                          ...filterSelectedStatus,
                          ...status.filter(
                            (item) =>
                              !filterSelectedStatus
                                .map(({ id }) => id)
                                ?.includes(item.id)
                          ),
                        ]
                      : status
                  }
                  setData={setStatus}
                  fetchData={fetchStatuses}
                  filter={{ limit: 20, page: 1 }}
                  notForm
                  handleSelectValue={({ list }) => {
                    updateFilter("statuses", list);
                  }}
                />
              </View>
              <View style={{ display: "flex", flexDirection: "column" }}>
                <Text>Son ödəniş tarixi</Text>
                <ProDateRange onChange={setDates} dates={dates} />
              </View>
              <View>
                <Text style={{ marginBottom: 5 }}>Günlərin sayı</Text>
                <View style={{ flexDirection: "row", gap: 10 }}>
                  <TextInput
                    value={filters.daysFrom}
                    keyboardType="numeric"
                    onChangeText={(event) => {
                      updateFilter("daysFrom", event);
                    }}
                    placeholder="Dan"
                    style={{
                      height: 40,
                      width: "48%",
                      borderWidth: 1,
                      borderRadius: 5,
                      borderColor: "#b6b6b6",
                      padding: 5,
                    }}
                  />
                  <TextInput
                    value={filters.daysTo}
                    placeholder="Dək"
                    keyboardType="numeric"
                    onChangeText={(event) => {
                      updateFilter("daysTo", event);
                    }}
                    style={{
                      width: "48%",
                      height: 40,
                      borderWidth: 1,
                      borderRadius: 5,
                      borderColor: "#b6b6b6",
                      padding: 5,
                    }}
                  />
                </View>
              </View>
              <View>
                <Text style={{ marginBottom: 5 }}>Ödəniləcək borc aralığı</Text>
                <View style={{ flexDirection: "row", gap: 10 }}>
                  <TextInput
                    value={filters.amountToBePaidFrom}
                    keyboardType="numeric"
                    onChangeText={(event) => {
                      updateFilter("amountToBePaidFrom", event);
                    }}
                    placeholder="Başlanğıc"
                    style={{
                      height: 40,
                      width: "48%",
                      borderWidth: 1,
                      borderRadius: 5,
                      borderColor: "#b6b6b6",
                      padding: 5,
                    }}
                  />
                  <TextInput
                    value={filters.amountToBePaidTo}
                    placeholder="Son"
                    keyboardType="numeric"
                    onChangeText={(event) => {
                      updateFilter("amountToBePaidTo", event);
                    }}
                    style={{
                      width: "48%",
                      height: 40,
                      borderWidth: 1,
                      borderRadius: 5,
                      borderColor: "#b6b6b6",
                      padding: 5,
                    }}
                  />
                </View>
              </View>
              <View>
                <Text style={{ marginBottom: 5 }}>Ödənilib(%)</Text>
                <View style={{ flexDirection: "row", gap: 10 }}>
                  <TextInput
                    value={filters.paidAmountPercentageFrom}
                    keyboardType="numeric"
                    onChangeText={(event) => {
                      updateFilter("paidAmountPercentageFrom", event);
                    }}
                    placeholder="Başlanğıc"
                    style={{
                      height: 40,
                      width: "48%",
                      borderWidth: 1,
                      borderRadius: 5,
                      borderColor: "#b6b6b6",
                      padding: 5,
                    }}
                  />
                  <TextInput
                    value={filters.paidAmountPercentageTo}
                    placeholder="Son"
                    keyboardType="numeric"
                    onChangeText={(event) => {
                      updateFilter("paidAmountPercentageTo", event);
                    }}
                    style={{
                      width: "48%",
                      height: 40,
                      borderWidth: 1,
                      borderRadius: 5,
                      borderColor: "#b6b6b6",
                      padding: 5,
                    }}
                  />
                </View>
              </View>
              <View>
                <Text style={{ marginBottom: 5 }}>Borc limiti aralığı</Text>
                <View style={{ flexDirection: "row", gap: 10 }}>
                  <TextInput
                    value={filters.debtLimitFrom}
                    keyboardType="numeric"
                    onChangeText={(event) => {
                      updateFilter("debtLimitFrom", event);
                    }}
                    placeholder="Başlanğıc"
                    style={{
                      height: 40,
                      width: "48%",
                      borderWidth: 1,
                      borderRadius: 5,
                      borderColor: "#b6b6b6",
                      padding: 5,
                    }}
                  />
                  <TextInput
                    value={filters.debtLimitTo}
                    placeholder="Son"
                    keyboardType="numeric"
                    onChangeText={(event) => {
                      updateFilter("debtLimitTo", event);
                    }}
                    style={{
                      width: "48%",
                      height: 40,
                      borderWidth: 1,
                      borderRadius: 5,
                      borderColor: "#b6b6b6",
                      padding: 5,
                    }}
                  />
                </View>
              </View>
              <View>
                <Text style={{ marginBottom: 5 }}>
                  Borc limiti aşma aralığı
                </Text>
                <View style={{ flexDirection: "row", gap: 10 }}>
                  <TextInput
                    value={filters.debtLimitExceedingAmountFrom}
                    keyboardType="numeric"
                    onChangeText={(event) => {
                      updateFilter("debtLimitExceedingAmountFrom", event);
                    }}
                    placeholder="Başlanğıc"
                    style={{
                      height: 40,
                      width: "48%",
                      borderWidth: 1,
                      borderRadius: 5,
                      borderColor: "#b6b6b6",
                      padding: 5,
                    }}
                  />
                  <TextInput
                    value={filters.debtLimitExceedingAmountTo}
                    placeholder="Son"
                    keyboardType="numeric"
                    onChangeText={(event) => {
                      updateFilter("debtLimitExceedingAmountTo", event);
                    }}
                    style={{
                      width: "48%",
                      height: 40,
                      borderWidth: 1,
                      borderRadius: 5,
                      borderColor: "#b6b6b6",
                      padding: 5,
                    }}
                  />
                </View>
              </View>
              <View>
                <Text style={{ marginBottom: 5 }}>Borc</Text>
                <View
                  style={{ display: "flex", flexDirection: "row", gap: 10 }}
                >
                  <ProButton
                    label="Var"
                    selected={filters.withDebt === 1}
                    type={"tab"}
                    defaultStyle={{ borderRadius: 5 }}
                    buttonBorder={styles.buttonStyle}
                    onClick={() => {
                      updateFilter("withDebt", 1);
                    }}
                  />
                  <ProButton
                    label="Yox"
                    selected={filters.withDebt === 0}
                    type={"tab"}
                    defaultStyle={{ borderRadius: 5 }}
                    buttonBorder={styles.buttonStyle}
                    onClick={() => {
                      updateFilter("withDebt", 0);
                    }}
                  />
                  <ProButton
                    label="Hamısı"
                    selected={filters.withDebt === undefined}
                    type={"tab"}
                    defaultStyle={{ borderRadius: 5 }}
                    buttonBorder={styles.buttonStyle}
                    onClick={() => {
                      updateFilter("withDebt", undefined);
                    }}
                  />
                </View>
              </View>
              <View style={{ display: "flex", flexDirection: "column" }}>
                <Text>Əlavə məlumat</Text>
                <ProSearch
                  onSearch={(val) => {
                    updateFilter("description", val);
                  }}
                  value={filters.description}
                />
              </View>
              <View style={{ display: "flex", flexDirection: "column" }}>
                <Text>Müqavilə</Text>
                <RadioButton.Group
                  onValueChange={(newValue) => {
                    updateFilter(
                      "withContract",
                      newValue === 3 ? undefined : newValue
                    );
                  }}
                  value={
                    filters.withContract === undefined
                      ? 3
                      : filters.withContract
                  }
                >
                  <View
                  // style={{
                  //   display: "flex",
                  //   flexDirection: "column",
                  // }}
                  >
                    <View
                      style={{
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                      }}
                    >
                      <Text>Hamısı</Text>
                      <RadioButton.Android value={3} />
                    </View>
                    <View
                      style={{
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                      }}
                    >
                      <Text>Müqavilə əsasında</Text>
                      <RadioButton.Android value={1} />
                    </View>
                    <View
                      style={{
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                      }}
                    >
                      <Text>Müqaviləsiz</Text>
                      <RadioButton.Android value={0} />
                    </View>
                  </View>
                </RadioButton.Group>
              </View>
              <View style={{ display: "flex", flexDirection: "column" }}>
                <Text>Kataloq</Text>
                <ProAsyncSelect
                  isMulti
                  async
                  defaultValue={filters.parentCatalogs}
                  data={catalogs || []}
                  setData={setCatalogs}
                  fetchData={fetchSalesCatalogs}
                  notForm
                  catalog={true}
                  filter={{ limit: 20, page: 1 }}
                  handleSelectValue={({ list }) => {
                    updateFilter("parentCatalogs", list);
                  }}
                />
              </View>
              <View style={{ display: "flex", flexDirection: "column" }}>
                <Text>Alt kataloq</Text>

                <ProAsyncSelect
                  defaultValue={filters.catalogs}
                  isMulti
                  data={
                    filters.parentCatalogs && filters.parentCatalogs.length > 0
                      ? childCatalogs[filters.parentCatalogs]?.map((item) => ({
                          ...item,
                          label: item.name,
                          value: item.id,
                        }))
                      : []
                  }
                  // selectedValueFromParent={selectedChildCatalogId}
                  disabled={
                    !(
                      filters.parentCatalogs &&
                      filters.parentCatalogs.length > 0
                    )
                  }
                  setData={() => {}}
                  fetchData={() => {}}
                  notForm
                  filter={{}}
                  handleSelectValue={({ list }) => {
                    updateFilter("catalogs", list);
                  }}
                />
              </View>
              <View style={{ display: "flex", flexDirection: "column" }}>
                <Text>Baş əlaqə</Text>

                <ProAsyncSelect
                  isMulti
                  defaultValue={filters.headContacts}
                  async
                  data={
                    filterSelectedHeadContacts.length > 0
                      ? [
                          ...filterSelectedHeadContacts,
                          ...headContacts.filter(
                            (item) =>
                              !filterSelectedHeadContacts
                                .map(({ id }) => id)
                                ?.includes(item.id)
                          ),
                        ]
                      : headContacts
                  }
                  setData={setHeadContacts}
                  fetchData={getCounterparties}
                  filter={{ limit: 20, page: 1 }}
                  notForm
                  handleSelectValue={({ list }) => {
                    updateFilter("headContacts", list);
                  }}
                />
              </View>
              <View style={{ display: "flex", flexDirection: "column" }}>
                <Text>Məhsul adı</Text>

                <ProAsyncSelect
                  isMulti
                  defaultValue={filters.products}
                  async
                  data={
                    filterSelectedProduct.length > 0
                      ? [
                          ...filterSelectedProduct,
                          ...products.filter(
                            (item) =>
                              !filterSelectedProduct
                                .map(({ id }) => id)
                                ?.includes(item.id)
                          ),
                        ]
                      : products
                  }
                  setData={setProducts}
                  fetchData={fetchSalesProductsFromCatalog}
                  filter={{ limit: 20, page: 1, isDeleted: 0 }}
                  notForm
                  handleSelectValue={({ list }) => {
                    updateFilter("products", list);
                  }}
                />
              </View>
              <View style={{ display: "flex", flexDirection: "column" }}>
                <Text>Məhsul kodu</Text>
                <ProSearch
                  onSearch={(val) => updateFilter("productCode", val)}
                  value={filters.productCode}
                />
              </View>
              <View style={{ display: "flex", flexDirection: "column" }}>
                <Text>Barkod</Text>
                <ProSearch
                  onSearch={(val) => updateFilter("productBarcode", val)}
                  value={filters.productBarcode}
                />
              </View>
            </View>
            <View
              style={{ width: "100%", marginTop: 15, alignItems: "flex-end" }}
            >
              <View style={{ width: 150 }}>
                <ProButton
                  label="Təsdiq et"
                  type="primary"
                  onClick={handleConfirmClick}
                  padding={"10px 0"}
                  defaultStyle={{ borderRadius: 10 }}
                />
              </View>
            </View>
          </ScrollView>
          <Pressable
            style={[styles.button]}
            onPress={() => {
              setFilters({
                ...filters,
                currencyId: filter.currencyId,
                contacts: filter.contacts,
                withContract: filter.withContract,
                dateOfTransactionFrom: filter.dateOfTransactionFrom,
                dateOfTransactionTo: filter.dateOfTransactionTo,
                daysFrom: filter.daysFrom,
                datetime: filter.datetime,
                statuses: filter.statuses,
                daysTo: filter.daysTo,
                headContacts: filter.headContacts,
                stocks: filter.stocks,
                amountToBePaidFrom: filter.amountToBePaidFrom,
                amountToBePaidTo: filter.amountToBePaidTo,
                paidAmountPercentageFrom: filter.paidAmountPercentageFrom,
                paidAmountPercentageTo: filter.paidAmountPercentageTo,
                salesmans: filter.salesmans,
                borrow: filter.borrow,
                contracts: filter.contracts,
                contactManagers: filter.contactManagers,
                productCode: filter.productCode,
                agents: filter.agents,
                products: filter.products,
                parentCatalogs: filter.parentCatalogs,
                catalogs: filter.catalogs,
                withDebt: filter.withDebt,
                description: filter.description,
                businessUnitIds: filter.businessUnitIds,
                productBarcode: filter.productBarcode,
                catalogs: filter.catalogs,
                debtLimitExceedingAmountTo: filter.debtLimitExceedingAmountTo,
                debtLimitExceedingAmountFrom:
                  filter.debtLimitExceedingAmountFrom,
                debtLimitTo: filter.debtLimitTo,
                debtLimitFrom: filter.debtLimitFrom,
              });
              setIsVisible(false);
            }}
          >
            <AntDesign name="close" size={18} color="black" />
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalView: {
    width: "100%",
    height: "100%",
    padding: 30,
    backgroundColor: "white",
    borderRadius: 5,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  button: {
    position: "absolute",
    borderRadius: 20,
    padding: 10,
    right: 0,
  },
  buttonStyle: {
    borderWidth: 1,
    borderRadius: 5,
    borderColor: "#d9d9d9",
  },
  inputContainerStyle: {
    alignItems: "flex-start",
    justifyContent: "center",
    borderWidth: 0.5,
    borderColor: "#8d908e",
    borderRadius: 8,
    height: 50,
  },
});

export default FilterModal;
