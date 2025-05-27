import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  useWindowDimensions,
  ScrollView,
  StyleSheet,
} from "react-native";
import Toast from "react-native-toast-message";
import moment from "moment";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { TenantContext } from "../../context";
import { useApi } from "../../hooks";
import {
  ProAsyncSelect,
  ProText,
  ProButton,
  ProFormInput,
  PaymentType,
  PaymentRow,
} from "../../components";
import { useForm } from "react-hook-form";
import ProDateTimePicker from "../../components/ProDateTimePicker";
import {
  getCurrencies,
  getCashboxNames,
  fetchCashboxNames,
  fetchAccountBalance,
  fetchTenantBalance,
  fetchWorkers,
  getContracts,
  fetchSalesInvoiceList,
  getExpenseCatalogs,
  createExpensePayment,
  editExpensePayment,
} from "../../api";
import {
  fullDateTimeWithSecond,
  roundToDown,
  defaultNumberFormat,
  formatNumberToLocale,
  today,
  roundToUp,
} from "../../utils";
import ExpenseRow from "../../components/ExpenseRow";
import AdvancePayment from "../Invoice/AdvancePayment";

const math = require("exact-math");

const Payments = ({ navigation, route }) => {
  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    getValues,
    setValue,
    watch,
  } = useForm({
    defaultValues: {
      dateOfTransaction: new Date(),
    },
  });

  const { id, operationList, businessUnit } = route.params || {};

  const [advancePayment, setAdvancePayment] = useState({});
  const [element, setElement] = useState(0);
  const [productionInvoices, setProductionInvoices] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [salesInvoices, setSalesInvoices] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [currencyCode, setCurrencyCode] = useState(undefined);
  const [currencies, setCurrencies] = useState([]);
  const [cashboxes, setCashboxes] = useState([]);
  const [date, setDate] = useState(today);
  const [useAdvance, setUseAdvance] = useState(false);
  const [expenses, setExpenses] = useState([undefined]);
  const [expenseCatalogs, setExpenseCatalogs] = useState([]);
  const [checked, setChecked] = useState(false);
  const [loader, setLoader] = useState(false);
  const [typeOfPayment, setTypeOfPayment] = useState(1);
  const [selectedContract, setSelectedContract] = useState([]);
  const [showAccountBalance, setShowAccountBalance] = useState(true);
  const [expenseFill, setExpenseFill] = useState(false);
  const [editDate, setEditDate] = useState(undefined);
  const [paymentData, setPaymentData] = useState({
    operationType: -1,
    paymentType: 1,
    accountBalance: [],
  });

  const { profile, tenant, BUSINESS_TKN_UNIT } = useContext(TenantContext);

  const { isLoading, run } = useApi({
    deferFn: getCurrencies,
    onResolve: (data) => {
      setCurrencies(
        data.map((item) => ({ ...item, label: item.code, value: item.id }))
      );
    },
    onReject: (error) => {
      console.log(error, "rejected");
    },
  });

  const { isLoading: isLoadCashboxes, run: runCashboxes } = useApi({
    deferFn: getCashboxNames,
    onResolve: (data) => {
      setCashboxes(
        data.map((item) => ({ ...item, label: item.name, value: item.id }))
      );
    },
    onReject: (error) => {
      console.log(error, "rejected");
    },
  });

  const { isLoading: isLoadExpenseCatalogs, run: runExpenseCatalogs } = useApi({
    deferFn: getExpenseCatalogs,
    onResolve: (data) => {
      setExpenseCatalogs(data);
    },
    onReject: (error) => {
      console.log(error, "rejected");
    },
  });

  const onCreateCallBack = () => {
    Toast.show({
      type: "success",
      text1: "Əməliyyat uğurla tamamlandı.",
    });
    navigation.push("DashboardTabs");
  };

  const onFailure = (error) => {
    setLoader(false);
    const errData = error?.response?.data?.error?.errorData;
    const errKey = error?.response?.data?.error?.errors;

    if (errKey?.key && errKey?.key === "wrong_employee_amount") {
      Toast.show({
        type: "error",
        text2: `Təhtəl hesab balansında kifayət qədər vəsait yoxdur. Seçilmış tarixdə ödəniləcək məbləğ ${defaultNumberFormat(
          errKey?.data?.number
        )} ${
          currencies.find((curr) => curr.id === getValues("currency")).code
        } çox ola bilməz.`,
        topOffset: 50,
      });
    } else {
      const cashboxName =
        errData?.cashbox.length > 15
          ? `${errData?.cashbox.substring(0, 15)} ...`
          : errData?.cashbox;

      const amount = math.add(
        Number(getValues("paymentAmount")),
        Number(errData.amount)
      );
      if (Number(amount ?? 0) <= 0) {
        Toast.show({
          type: "error",
          text2: `Seçilmiş kassada ${errData?.currencyCode} valyutasında kifayət qədər məbləğ yoxdur.`,
          topOffset: 50,
        });
      } else {
        Toast.show({
          type: "error",
          text2: `${cashboxName} hesabında kifayət qədər vəsait yoxdur. Ödəniləcək məbləğ ${[
            amount,
          ]} ${errData?.currencyCode} çox ola bilməz. Tarix: ${errData?.date}`,
          topOffset: 50,
        });
      }
    }
  };

  const onSubmit = (values) => {
    const {
      counterparty,
      operationDate,
      Paccount,
      description,
      expenses,
      currency,
      expenseType,
      contract,
    } = values;

    setLoader(true);

    const expenseData = {
      employee: counterparty,
      type: paymentData.operationType,
      useEmployeeBalance: useAdvance,
      dateOfTransaction: moment(operationDate)?.format(fullDateTimeWithSecond),
      cashbox: Paccount || null,
      typeOfPayment: paymentData.paymentType || null,
      description: description || null,
      contract:
        expenseType === 1
          ? null
          : contract === 0
          ? null
          : expenseType === 3
          ? null
          : contract,
      invoice:
        expenseType === 1 ? contract : expenseType === 3 ? contract : null,
      expenses_ul: expenses.map(
        ({ catalog, subCatalog, amount, amounts_ul }) => ({
          transactionCatalog: catalog,
          transactionItem: subCatalog || null,
          amount: Number(amount),
          currency,
          amounts_ul: amounts_ul || null,
        })
      ),
    };

    if (id) {
      editExpensePayment({ id: id, data: expenseData })
        .then((res) => {
          onCreateCallBack();
        })
        .catch((err) => {
          onFailure(err);
        });
    } else {
      createExpensePayment({ filters: { check: 0 }, data: expenseData })
        .then((res) => {
          onCreateCallBack();
        })
        .catch((err) => {
          onFailure(err);
        });
    }
  };

  const { isLoading: isLoadWorkers, run: runWorkers } = useApi({
    deferFn: fetchWorkers,
    onResolve: (data) => {
      setWorkers(
        data.map((item) => ({
          ...item,
          label: `${item.name} ${item.surname} ${item.patronymic}`,
          value: item.id,
        }))
      );
    },
    onReject: (error) => {
      console.log(error, "rejected");
    },
  });

  useEffect(() => {
    run({ limit: 1000, withRatesOnly: 1 });
    runWorkers({
      isInLaborContractDate: 1,
      businessUnitIds: id
        ? operationList?.[0]?.businessUnitId === null
          ? [0]
          : [operationList?.[0].businessUnitId]
        : BUSINESS_TKN_UNIT
        ? [BUSINESS_TKN_UNIT]
        : undefined,
    });
    runExpenseCatalogs({ isActive: 1 });
  }, []);
  useEffect(() => {
    if (paymentData.paymentType) {
      runCashboxes({
        filter: {
          page: 1,
          limit: 20,
          businessUnitIds: id
            ? operationList?.[0].businessUnitId === null
              ? [0]
              : [operationList?.[0].businessUnitId]
            : BUSINESS_TKN_UNIT
            ? [BUSINESS_TKN_UNIT]
            : undefined,
          dateTime: moment(getValues("operationDate"))?.format(
            fullDateTimeWithSecond
          ),
          applyBusinessUnitTenantPersonFilter: 1,
        },
        apiEnd: paymentData.paymentType,
      });
    }
  }, [paymentData.paymentType]);

  useEffect(() => {
    if (currencies?.length > 0) {
      setValue(
        "currency",
        id && operationList
          ? operationList[0]?.currencyId
          : currencies?.filter(
              (currency) => currency.id === getValues("currency")
            ).length > 0
          ? getValues("currency")
          : currencies[0].id
      );
      setCurrencyCode(
        id && operationList
          ? operationList[0]?.currencyCode
          : currencies?.filter(
              (currency) => currency.id === getValues("currency")
            ).length > 0
          ? currencies?.find(
              (currency) => currency.id === getValues("currency")
            ).code
          : currencies[0].code
      );

      if (id && operationList) {
        setValue(
          `expenses[${0}].catalog`,
          operationList[0]?.transactionCatalogId
        );
        setValue(
          `expenses[${0}].subCatalog`,
          operationList[0]?.transactionItemId
        );
        setValue(
          `expenses[${0}].amount`,
          `${roundToUp(Number(operationList[0]?.amount), 2)}`
        );
      }
    }
  }, [currencies, operationList]);

  useEffect(() => {
    if (expenseFill) {
      setValue(
        "contract",
        operationList[0]?.paymentInvoiceId
        ? operationList[0]?.paymentInvoiceId: operationList[0]?.contractId
        ? operationList[0]?.contractId
        : { ...tenant, id: 0 }.id
      );
      setExpenseFill(false);
    }
  }, [expenseFill]);

  useEffect(() => {
    if (id && operationList?.length > 0) {
      setEditDate(
        moment(
          operationList?.[0].dateOfTransaction,
          fullDateTimeWithSecond
        ).toDate()
      );

      setValue(
        "expenseType",
        operationList[0]?.paymentInvoiceId
          ? operationList[0]?.paymentInvoiceType === 11
            ? 1
            : 3
          : operationList[0]?.contractId
          ? 0
          : 2
      );
      setExpenseFill(true);

      setValue("counterparty", operationList[0].employeeId);
      setValue(
        "operationDate",
        moment(operationList[0].dateOfTransaction, fullDateTimeWithSecond)
      );
      setValue("currency", operationList[0].currencyId);
      setValue("description", operationList[0].description);
      setValue("Paccount", operationList[0].cashboxId || undefined);
      setValue("paymentAmount", roundToUp(Number(operationList[0]?.amount), 2));
      setValue(
        `expenses[${0}].catalog`,
        operationList[0]?.transactionCatalogId
      );
      setValue(
        `expenses[${0}].subCatalog`,
        operationList[0]?.transactionItemId
      );
      setValue(
        `expenses[${0}].amount`,
        `${roundToUp(Number(operationList[0]?.amount), 2)}`
      );

      setUseAdvance(operationList[0]?.isEmployeePayment);
      handlePaymentTypeChange(
        operationList[0]?.paymentTypeId,
        operationList[0]?.cashboxId
      );
      handleCounterpartyChange(operationList[0].employeeId);
      setCurrencyCode(
        id && operationList
          ? operationList[0]?.currencyCode
          : currencies[0].code
      );
    }
  }, [id, operationList]);

  useEffect(() => {
    if (cashboxes?.length > 0) {
      setShowAccountBalance(
        cashboxes?.some((item) => item?.balance === false) ? false : true
      );
    }
  }, [cashboxes?.length]);

  const handlePaymentAccountChange = (paymentAccountId) => {
    fetchAccountBalance({
      apiEnd: paymentAccountId,
      filters: {
        dateTime: moment(getValues("operationDate")).format(
          fullDateTimeWithSecond
        ),
      },
    }).then((data) => {
      setPaymentData((prevPaymentData) => ({
        ...prevPaymentData,
        accountBalance: data,
      }));
    });
  };

  useEffect(() => {
    if (getValues(`Paccount`)) {
      fetchAccountBalance({
        apiEnd: getValues(`Paccount`),
        filters: {
          dateTime: moment(getValues("operationDate")).format(
            fullDateTimeWithSecond
          ),
        },
      }).then((data) => {
        setPaymentData((prevPaymentData) => ({
          ...prevPaymentData,
          accountBalance: data,
        }));
      });
    }
    if (getValues("counterparty")) {
      fetchTenantBalance({
        apiEnd: getValues(`counterparty`),
        filters: {
          dateTime: moment(getValues("operationDate")).format(
            fullDateTimeWithSecond
          ),
        },
      }).then((data) => {
        fetchAdvancePaymentCallback(data);
      });
    }
    const selectedStartDate = moment(
      selectedContract?.start_date,
      "DD-MM-YYYY"
    );
    const selectedEndDate = moment(selectedContract?.end_date, "DD-MM-YYYY");
    const selectedDate = moment(
      getValues("operationDate"),
      fullDateTimeWithSecond
    );
    if (
      selectedDate.isBefore(selectedStartDate) ||
      selectedDate.isAfter(selectedEndDate)
    ) {
      setValue("expenseType", 2);
      setValue("contract", { ...tenant, id: 0 }.id);
    }
  }, [watch("operationDate")]);

  useEffect(() => {
    if (!id) {
      if (getValues("expenseType") === undefined) {
        setValue("contract", { ...tenant, id: 0 }.id);
        setValue("expenseType", 2);
      }
      if (getValues("expenseType") === 1) {
        setValue(
          "contract",
          productionArr.length === 1 ? productionArr[0].id : undefined
        );
      } else if (getValues("expenseType") === 2) {
        setValue("contract", { ...tenant, id: 0 }.id);
      } else if (getValues("expenseType") === 0) {
        setValue(
          "contract",
          contractsArr.length === 1 ? contractsArr[0].id : undefined
        );
      } else if (getValues("expenseType") === 3) {
        setValue(
          "contract",
          salesInvoicesArr.length === 1 ? salesInvoicesArr[0].id : undefined
        );
      }
    }
  }, [watch("expenseType")]);

  useEffect(() => {
    if (currencies?.length > 0) {
      setValue(
        "currency",
        currencies?.filter((currency) => currency.id === getValues("currency"))
          .length > 0
          ? getValues("currency")
          : currencies[0].id
      );
      setCurrencyCode(
        currencies?.filter((currency) => currency.id === getValues("currency"))
          .length > 0
          ? currencies?.find(
              (currency) => currency.id === getValues("currency")
            ).code
          : currencies[0].code
      );
    }
  }, [currencies]);

  const handleTotalAmountChange = () => {
    const totalAmount = getValues("expenses")?.reduce(
      (total, current) => math.add(total, Number(current.amount) || 0),
      0
    );
    setValue("paymentAmount", `${totalAmount}`);
  };
  useEffect(() => {
    handleTotalAmountChange();
  }, [expenses]);

  const contractsArr = contracts.map((contract) => ({
    ...contract,
    value: contract.id,
    label: `${contract.counterparty_name} - ${
      contract.contract_no ? contract.contract_no : contract.serialNumber
    }`,
  }));

  const productionArr = productionInvoices.map((invoice) => ({
    ...invoice,
    value: invoice.id,
    label: `${invoice.customInvoiceNumber || invoice.invoiceNumber} - ${
      invoice.clientName ? invoice.clientName : "Daxili sifariş"
    }`,
  }));

  const salesInvoicesArr = salesInvoices.map((invoice) => ({
    ...invoice,
    value: invoice.id,
    label: `${invoice.invoiceNumber} - ${
      invoice.counterparty ? invoice.counterparty : "Daxili sifariş"
    }`,
  }));

  const ContractFn = (event) => {
    if (event === 1) {
      setValue(
        "paymentContract",
        productionArr.length === 1 ? productionArr[0].id : undefined
      );
    } else if (event === 0) {
      setValue(
        "paymentContract",
        contractsArr.length === 1 ? contractsArr[0].id : undefined
      );
    } else if (event === 2) {
      setValue("paymentContract", { ...tenant, id: 0 }.id);
    } else if (event === 3) {
      setValue(
        "contract",
        salesInvoicesArr.length === 1 ? salesInvoicesArr[0].id : undefined
      );
    } else {
      setValue("paymentContract", undefined);
    }
  };

  const handleCounterpartyChange = (counterparty) => {
    if (counterparty) {
      fetchTenantBalance({
        apiEnd: counterparty,
        filters: {
          dateTime: moment(getValues("operationDate")).format(
            fullDateTimeWithSecond
          ),
          businessUnitIds: id
            ? operationList?.[0].businessUnitId === null
              ? [0]
              : [operationList?.[0].businessUnitId]
            : BUSINESS_TKN_UNIT
            ? [BUSINESS_TKN_UNIT]
            : undefined,
        },
      }).then((data) => {
        fetchAdvancePaymentCallback(data);
      });
    }
    setAdvancePayment({});
  };

  const fetchAdvancePaymentCallback = (data) => {
    const advanceBalance = {};
    if (data.length > 0) {
      data.forEach((advance) => (advanceBalance[advance.currencyId] = advance));
    }
    return setAdvancePayment({ myAmount: Object.values(advanceBalance) });
  };

  const handleAdvanceChange = (checked) => {
    if (checked) {
      const advanceBalance = advancePayment.myAmount;
      const advanceCurrency = advanceBalance?.[0];

      setValue("currency", advanceCurrency?.currencyId);
      setValue("Paccount", undefined);
      setCurrencyCode(advanceCurrency?.code);
    } else {
      setPaymentData((prevPaymentData) => ({
        ...prevPaymentData,
        paymentType: 1,
      }));
      setDate(today);
    }
    setUseAdvance(checked);
  };

  const handleAddExpenseClick = (clickType = "add", selectedIndex) => {
    if (clickType === "add") {
      setExpenses((prevExpenses) => [...prevExpenses, null]);
    }
    if (clickType === "remove") {
      setExpenses((prevExpenses) =>
        prevExpenses.filter((prevExpense, index) => index !== selectedIndex)
      );
      setValue(
        "expenses",
        getValues("expenses").filter((_, index) => index !== selectedIndex)
      );
    }
  };

  const handleExpenseChange = (value, index) => {
    setExpenses((prevExpenses) =>
      prevExpenses.map((prevExpense, prevIndex) =>
        prevIndex === index ? Number(value) : prevExpense
      )
    );
  };

  const handlePaymentTypeChange = (paymentType, edit = false) => {
    setPaymentData((prevPaymentData) => ({
      ...prevPaymentData,
      paymentType,
    }));
    setValue("Paccount", edit || undefined);
  };

  const handleCurrencyChange = (newCurrencyId) => {
    const newCurrency = currencies.filter(
      (currency) => currency.id === newCurrencyId
    )[0];
    if (newCurrency) {
      setCurrencyCode(newCurrency.code);
    }
  };

  return (
    <SafeAreaProvider>
      <ScrollView>
        <View
          style={{
            paddingTop: 40,
            paddingLeft: 10,
            paddingRight: 10,
            paddingBottom: 40,
          }}
        >
          {id && (
            <ProText variant="heading" style={{ color: "black" }}>
              Sənəd: {operationList?.[0]?.documentNumber}
            </ProText>
          )}
          <ProText variant="heading" style={{ color: "black" }}>
            {id ? "Düzəliş et" : "Yeni əməliyyat"}
          </ProText>
          <Text style={{ fontSize: 18 }}>Xərclər</Text>

          <View
            style={{
              marginTop: 20,
              marginBottom: 20,
              padding: 10,
              borderRadius: 4,
              backgroundColor: "#fff",
              display: "flex",
              gap: 10,
            }}
          >
            <ProAsyncSelect
              label="Əməkdaş"
              data={workers}
              setData={setWorkers}
              fetchData={fetchWorkers}
              filter={{
                lastEmployeeActivityType: 1,
              }}
              async={false}
              control={control}
              required
              name="counterparty"
              handleSelectValue={(id) => {
                setValue("invoice", undefined);
                setPaymentData((prevPaymentData) => ({
                  ...prevPaymentData,
                  paymentType: 1,
                }));
                setUseAdvance(false);
                handleCounterpartyChange(id);
              }}
            />
            <View style={{ margin: "15px 0" }}>
              <AdvancePayment
                mainCurrencyCode={currencyCode}
                advancePayment={advancePayment}
                checked={useAdvance}
                isPayment
                onChange={handleAdvanceChange}
                selectedCounterparty={getValues("counterparty")}
                disabled={!getValues("counterparty")}
                // loading={isLoad}
                title="Təhtəl hesabdan ödə"
                subTitle="Balans:"
              />
            </View>
            <View>
              <Text style={{ marginBottom: 5 }}>Əməliyyatın növü</Text>
              <View style={{ display: "flex", flexDirection: "row", gap: 10 }}>
                <ProButton
                  label="Məxaric"
                  selected={paymentData.operationType === -1}
                  type={paymentData.operationType === -1 ? "primaty" : "tab"}
                  defaultStyle={{ borderRadius: 30 }}
                  buttonBorder={styles.buttonStyle}

                  // onClick={() => {
                  //   handleOperationTypeChange(-1, invoices);
                  // }}
                />
              </View>
            </View>
            <ProDateTimePicker
              name="operationDate"
              control={control}
              setValue={setValue}
              editDate={editDate}
              required
            />
            <View style={{ flexDirection: "row", gap: 10 }}>
              <ProAsyncSelect
                width="35%"
                label="Xərc mərkəzi növü"
                data={[
                  {
                    id: 2,
                    value: 2,
                    label: "Baş ofis",
                  },
                  {
                    id: 0,
                    value: 0,
                    label: "Müqavilə",
                  },
                  {
                    id: 1,
                    value: 1,
                    label: "İstehsalat",
                  },
                  { id: 3, value: 3, label: "Qaimə" },
                ]}
                setData={() => {}}
                fetchData={() => {}}
                async={false}
                filter={{}}
                required
                control={control}
                allowClear={false}
                name="expenseType"
                handleSelectValue={(id) => {
                  ContractFn(id);
                  setElement(id);
                }}
              />

              {watch("expenseType") === 2 ? (
                <ProAsyncSelect
                  width="62%"
                  label="Xərc mərkəzi"
                  data={[
                    {
                      ...tenant,
                      label: tenant.name,
                      id: 0,
                      value: 0,
                    },
                  ]}
                  disabled={true}
                  setData={() => {}}
                  fetchData={() => {}}
                  async={false}
                  filter={{}}
                  required
                  control={control}
                  allowClear={false}
                  name="contract"
                />
              ) : watch("expenseType") === 1 ? (
                <ProAsyncSelect
                  width="62%"
                  disabled={false}
                  label="Xərc mərkəzi"
                  data={
                    id
                      ? [
                          {
                            label:
                              operationList[0]?.paymentInvoiceInvoiceNumber,
                            value: operationList[0]?.paymentInvoiceId,
                            id: operationList[0]?.paymentInvoiceId,
                          },
                          ...productionArr,
                        ]
                      : productionArr
                  }
                  setData={setProductionInvoices}
                  fetchData={fetchSalesInvoiceList}
                  async
                  filter={{
                    page: 1,
                    limit: 20,
                    invoiceTypes: [11],
                    allProduction: 1,
                    isDeleted: 0,
                  }}
                  required
                  control={control}
                  allowClear={false}
                  name="contract"
                />
              ) : watch("expenseType") === 3 ? (
                <ProAsyncSelect
                  width="62%"
                  label="Xərc mərkəzi"
                  data={
                    id
                      ? [
                          {
                            label:
                              operationList[0]?.paymentInvoiceInvoiceNumber,
                            value: operationList[0]?.paymentInvoiceId,
                            id: operationList[0]?.paymentInvoiceId,
                          },
                          ...salesInvoicesArr,
                        ]
                      : salesInvoicesArr
                  }
                  setData={setSalesInvoices}
                  fetchData={fetchSalesInvoiceList}
                  async
                  filter={{
                    page: 1,
                    limit: 20,
                    invoiceTypes: [1, 2],
                    isDeleted: 0,
                    includeTotalPaymentsAmount: 1,
                  }}
                  required
                  control={control}
                  allowClear={false}
                  name="contract"
                />
              ) : (
                <ProAsyncSelect
                  width="62%"
                  label="Xərc mərkəzi"
                  data={
                    id
                      ? [
                          {
                            label: operationList[0]?.contractNo || operationList[0]?.contractSerialNumber,
                            value: operationList[0]?.contractId,
                            id: operationList[0]?.contractId,
                          },
                          ...contractsArr,
                        ]
                      : contractsArr
                  }
                  setData={setContracts}
                  fetchData={getContracts}
                  async
                  filter={{ page: 1, limit: 20, status: 1, endDateFrom: today }}
                  required
                  control={control}
                  allowClear={false}
                  name="contract"
                  handleSelectValue={(id) => {
                    const selectedContract =
                      contracts?.find((contract) => contract.id === id) || {};
                    setSelectedContract(selectedContract);
                  }}
                />
              )}
            </View>
            <View>
              <ProAsyncSelect
                label="Valyuta"
                data={currencies}
                setData={() => {}}
                fetchData={() => {}}
                async={false}
                filter={{ limit: 1000, withRatesOnly: 1 }}
                required
                control={control}
                allowClear={false}
                name="currency"
                width="27%"
                handleSelectValue={(id) => {
                  handleCurrencyChange(id);
                }}
              />
            </View>
            {expenses?.map((expense, index) => (
              <ExpenseRow
                setValue={setValue}
                getValues={getValues}
                control={control}
                index={index}
                key={index}
                handleAddExpenseClick={handleAddExpenseClick}
                handleExpenseChange={handleExpenseChange}
                expenseCatalogs={expenseCatalogs}
                currencyCode={currencyCode}
                watch={watch}
                plusDisabled={true}
              />
            ))}
            <PaymentType
              typeOfPayment={paymentData.paymentType}
              changeTypeOfPayment={handlePaymentTypeChange}
              disabled={useAdvance}
            />

            <ProAsyncSelect
              label="Hesab"
              data={cashboxes.map((cashbox) => ({
                ...cashbox,
                id: cashbox.id,
                value: cashbox.id,
                label: showAccountBalance
                  ? `${cashbox.label} ( ${
                      cashbox.balance && cashbox.balance.length > 0
                        ? cashbox.balance
                            .map((balanceItem) => {
                              const formattedBalance = formatNumberToLocale(
                                defaultNumberFormat(balanceItem.balance)
                              );
                              return `${formattedBalance} ${balanceItem.currencyCode}`;
                            })
                            .join(", ")
                        : "0.00"
                    })`
                  : cashbox.label,
              }))}
              setData={setCashboxes}
              fetchData={getCashboxNames}
              filter={{
                limit: 20,
                page: 1,
                businessUnitIds: id
                  ? operationList?.[0].businessUnitId === null
                    ? [0]
                    : [operationList?.[0].businessUnitId]
                  : BUSINESS_TKN_UNIT
                  ? [BUSINESS_TKN_UNIT]
                  : undefined,
                dateTime: moment(getValues("operationDate"))?.format(
                  fullDateTimeWithSecond
                ),
                applyBusinessUnitTenantPersonFilter: 1,
              }}
              apiEnd={typeOfPayment}
              async={true}
              required={!useAdvance}
              control={control}
              name="Paccount"
              handleSelectValue={(id) => {
                handlePaymentAccountChange(id);
              }}
              disabled={useAdvance}
            />

            <ProFormInput
              label="Ödəniləcək məbləğ"
              required
              name="paymentAmount"
              control={control}
              keyboardType="numeric"
              disabled
              suffix={currencyCode}
            />

            <ProFormInput
              multiline={true}
              label="Əlavə məlumat"
              name="description"
              control={control}
              style={{ textAlignVertical: "top" }}
            />
          </View>
          <View style={{ display: "flex", flexDirection: "row" }}>
            <ProButton
              label="Təsdiq et"
              type="primary"
              onClick={handleSubmit(onSubmit)}
            />
            <ProButton
              label="İmtina"
              type="transparent"
              onClick={() => navigation.push("DashboardTabs")}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  tabbar: {
    backgroundColor: "#37B874",
  },
  container: {
    flex: 1,
    padding: 16,
    paddingTop: 30,
    backgroundColor: "#fff",
    gap: 10,
  },
  rowSection: { flexDirection: "row" },
  head: { height: 44, backgroundColor: "#55ab80" },
  headText: {
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
    color: "white",
  },
  text: { margin: 6, fontSize: 14, textAlign: "center" },

  btn: { width: 58, height: 18, backgroundColor: "#78B7BB", borderRadius: 2 },
  btnText: { textAlign: "center", color: "#fff" },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 22,
  },
  modalView: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
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
    borderRadius: 20,
    padding: 10,
    elevation: 2,
  },
  buttonOpen: {
    backgroundColor: "#F194FF",
  },
  buttonClose: {
    backgroundColor: "#2196F3",
  },
  footer: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  checkboxContainer: {
    flexDirection: "row",
  },
  inputContainer: {
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    marginHorizontal: 5,
    borderRadius: 10,
  },
  prefix: {
    paddingHorizontal: 5,
    fontWeight: "bold",
    color: "black",
  },
  buttonStyle: {
    borderWidth: 1,
    borderRadius: 30,
    borderColor: "#d9d9d9",
  },
});

export default Payments;
