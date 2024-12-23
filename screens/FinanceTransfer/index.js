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
  createOperationTransfer,
  editOperationTransfer,
  fetchFilteredUnitCashbox,
  getCashboxNames,
  fetchCashboxNames,
  fetchAccountBalance,
  createExpensePayment,
} from "../../api";
import {
  fullDateTimeWithSecond,
  roundToDown,
  defaultNumberFormat,
  formatNumberToLocale,
  roundToUp,
} from "../../utils";

const math = require("exact-math");

const FinanceTransfer = ({ navigation, route }) => {
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

  const [currencies, setCurrencies] = useState([]);
  const [cashboxes, setCashboxes] = useState([]);
  const [receivedCashboxes, setReceivedCashboxes] = useState([]);
  const [filteredUnitCashboxes, setFilteredUnitCashboxes] = useState(undefined);
  const [amounts, setAmounts] = useState(null);
  const [checked, setChecked] = useState(false);
  const [loader, setLoader] = useState(false);
  const [typeOfPayment, setTypeOfPayment] = useState(1);
  const [expenses, setExpenses] = useState([undefined]);
  const [allCashBoxNames, setAllCashboxNames] = useState([]);
  const [editDate, setEditDate] = useState(undefined);
  const [transferData, setTransferData] = useState({
    from: {
      balance: [],
      type: 1,
      account: undefined,
      loading: false,
    },
    to: {
      balance: [],
      type: 1,
      account: undefined,
      loading: false,
    },
    currency: undefined,
  });

  const { profile, tenant, BUSINESS_TKN_UNIT } = useContext(TenantContext);

  const { isLoading: isLoadAllCahbox, run: runAllCashboxNames } = useApi({
    deferFn: fetchCashboxNames,
    onResolve: (data) => {
      setAllCashboxNames(
        data.map((item) => ({ ...item, label: item.name, value: item.id }))
      );
    },
    onReject: (error) => {
      console.log(error, "rejected");
    },
  });
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

  const { isLoading: isLoadReceiveCashboxes, run: runReceiveCashboxes } =
    useApi({
      deferFn: getCashboxNames,
      onResolve: (data) => {
        setReceivedCashboxes(
          data.map((item) => ({ ...item, label: item.name, value: item.id }))
        );
      },
      onReject: (error) => {
        console.log(error, "rejected");
      },
    });

  const onCreateCallBack = (values, paymentId) => {
    if (checked) {
      const expenseData = {
        relatedCashboxTransaction: Number(paymentId),
        employee: values.paymentEmployee,
        type: -1,
        useEmployeeBalance: false,
        dateOfTransaction: moment(values.operationDate)?.format(
          fullDateTimeWithSecond
        ),
        cashbox: values.paymentAccount || null,
        typeOfPayment: typeOfPayment || null,
        description: null,
        contract:
          values.paymentExpenseType === 1
            ? null
            : values.paymentContract === 0
            ? null
            : values.paymentExpenseType === 3
            ? null
            : values.paymentContract,
        invoice:
          values.paymentExpenseType === 1
            ? values.paymentContract
            : values.paymentExpenseType === 3
            ? values.paymentContract
            : null,
        expenses_ul: values.expenses.map(
          ({ catalog, subCatalog, amount, amounts_ul }) => ({
            transactionCatalog: catalog,
            transactionItem: subCatalog || null,
            amount: Number(amount),
            currency: values.paymentCurrency,
            amounts_ul: amounts_ul || null,
          })
        ),
      };
      createExpensePayment({ filters: { check: 0 }, data: expenseData })
        .then((res) => {
          setLoader(false);
          Toast.show({
            type: "success",
            text1: "Əməliyyat uğurla tamamlandı.",
          });
          navigation.push("DashboardTabs");
        })
        .catch((err) => {
          onFailurePayment(err);
        });
    } else {
      setLoader(false);
      Toast.show({
        type: "success",
        text1: "Əməliyyat uğurla tamamlandı.",
      });
      navigation.push("DashboardTabs");
    }
  };

  const onFailure = (error) => {
    const errData = error?.response?.data?.error?.errorData;
    const cashboxName =
      errData?.cashbox?.length > 15
        ? `${errData?.cashbox.substring(0, 15)} ...`
        : errData?.cashbox;

    if (
      errData?.cashbox ===
      allCashBoxNames.find((acc) => acc.id === getValues("from"))?.name
    ) {
      const newAmount = math.add(
        Number(getValues("paymentAmount") || 0),
        Number(errData?.amount || 0)
      );
      Toast.show({
        type: "error",
        text2: `${cashboxName} hesabında kifayət qədər vəsait yoxdur. Ödəniləcək məbləğ ${newAmount} ${errData?.currencyCode} çox ola bilməz. Tarix: ${errData?.date}`,
        topOffset: 50,
      });
    } else {
      let amount = 0;

      amount =
        errData?.cashbox ===
          allCashBoxNames.find((acc) => acc.id === getValues("to"))?.name &&
        errData?.currencyCode ===
          currencies.find((curr) => curr.id === getValues("currency")).code
          ? math.sub(
              Number(getValues("paymentAmount") || 0),
              Number(errData?.amount || 0)
            )
          : math.mul(Number(errData?.amount || 0), -1);

      Toast.show({
        type: "error",
        text2: `${cashboxName} hesabında kifayət qədər vəsait yoxdur. Ödəniləcək məbləğ ${amount} ${errData?.currencyCode} az ola bilməz. Tarix: ${errData?.date}`,
        topOffset: 50,
      });
    }
  };

  const onFailurePayment = (error) => {
    setLoader(false);
    const errData = error?.response?.data?.error?.errorData;

    const cashboxName =
      errData?.cashbox?.length > 15
        ? `${errData?.cashbox.substring(0, 15)} ...`
        : errData?.cashbox;
    const amount = math.add(
      Number(
        getValues("expenses").reduce(
          (total_amount, { amount }) =>
            math.add(total_amount, Number(amount) || 0),
          0
        )
      ),
      Number(errData?.amount)
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
        text2: `${cashboxName} hesabında kifayət qədər vəsait yoxdur. Ödəniləcək məbləğ ${amount} ${errData?.currencyCode} çox ola bilməz. Tarix: ${errData?.date}`,
        topOffset: 50,
      });
    }
  };

  const onSubmit = (values) => {
    const {
      operationDate,
      from,
      to,
      currency,
      paymentAmount,
      description,
      paymentEmployee,
      paymentAccount,
      paymentExpenseType,
      paymentContract,
      paymentCurrency,
      expenses,
    } = values;

    const accountCurrencyBalance = transferData.from.balance?.filter(
      (accountBalance) => accountBalance.tenantCurrencyId === values.currency
    )[0];
    const currencyCode = currencies.filter(
      (currency) => currency.id === values.currency
    )[0].code;

    if (
      roundToDown(
        Number(
          id && operationList.length > 0
            ? math.add(
                operationList.find(
                  ({ cashInOrCashOut }) => cashInOrCashOut === -1
                )?.amount || 0,
                accountCurrencyBalance?.balance || 0
              )
            : accountCurrencyBalance?.balance || 0
        ),
        4
      ) <= 0
    ) {
      Toast.show({
        type: "error",
        text2: `Seçilmiş kassada ${currencyCode} valyutasında kifayət qədər məbləğ yoxdur.`,
        topOffset: 50,
      });
    } else {
      setLoader(true);
      if (checked) {
        const expenseData = {
          employee: paymentEmployee,
          type: -1,
          useEmployeeBalance: false,
          dateOfTransaction: moment(operationDate)?.format(
            fullDateTimeWithSecond
          ),
          cashbox: paymentAccount || null,
          typeOfPayment: typeOfPayment || null,
          description: null,
          contract:
            paymentExpenseType === 1
              ? null
              : paymentContract === 0
              ? null
              : paymentExpenseType === 3
              ? null
              : paymentContract,
          invoice:
            paymentExpenseType === 1
              ? paymentContract
              : paymentExpenseType === 3
              ? paymentContract
              : null,
          expenses_ul: expenses.map(
            ({ catalog, subCatalog, amount, amounts_ul }) => ({
              transactionCatalog: catalog,
              transactionItem: subCatalog || null,
              amount: Number(amount),
              currency: paymentCurrency,
              amounts_ul: amounts_ul || null,
            })
          ),
        };
        if (to === paymentAccount && currency === paymentCurrency) {
          if (
            expenses.reduce(
              (total_amount, { amount }) =>
                math.add(total_amount, Number(amount) || 0),
              0
            ) > Number(paymentAmount)
          ) {
            expenseData.expenses_ul = [
              {
                transactionCatalog: expenses[0]?.catalog,
                transactionItem: expenses[0]?.subCatalog || null,
                amount: math.sub(
                  Number(
                    expenses.reduce(
                      (total_amount, { amount }) =>
                        math.add(total_amount, Number(amount) || 0),
                      0
                    )
                  ),
                  Number(paymentAmount)
                ),
                currency: paymentCurrency,
                amounts_ul: expenses[0]?.amounts_ul || null,
              },
            ];
          }
        } else if (from === paymentAccount && currency === paymentCurrency) {
          expenseData.expenses_ul = [
            {
              transactionCatalog: expenses[0]?.catalog,
              transactionItem: expenses[0]?.subCatalog || null,
              amount: math.add(
                Number(
                  expenses.reduce(
                    (total_amount, { amount }) =>
                      math.add(total_amount, Number(amount) || 0),
                    0
                  )
                ),
                Number(paymentAmount)
              ),
              currency: paymentCurrency,
              amounts_ul: expenses[0]?.amounts_ul || null,
            },
          ];
        }
        if (
          to === paymentAccount &&
          currency === paymentCurrency &&
          expenses.reduce(
            (total_amount, { amount }) =>
              math.add(total_amount, Number(amount) || 0),
            0
          ) <= Number(paymentAmount)
        ) {
          if (id) {
            editOperationTransfer({
              id: id,
              data: {
                dateOfTransaction: moment(operationDate)?.format(
                  fullDateTimeWithSecond
                ),
                cashBoxTypeFrom: transferData.from.type,
                cashBoxNameFrom: from,
                cashBoxTypeTo: transferData.to.type,
                cashBoxNameTo: to,
                currency,
                description,
                amount: Number(paymentAmount),
              },
            })
              .then(() => {
                onCreateCallBack(values, id);
              })
              .catch((error) => {
                onFailure(error);
              });
          } else {
            createOperationTransfer({
              dateOfTransaction: moment(operationDate)?.format(
                fullDateTimeWithSecond
              ),
              cashBoxTypeFrom: transferData.from.type,
              cashBoxNameFrom: from,
              cashBoxTypeTo: transferData.to.type,
              cashBoxNameTo: to,
              currency,
              description,
              amount: Number(paymentAmount),
            })
              .then((res) => {
                onCreateCallBack(values, res.id);
              })
              .catch((error) => {
                console.log(error, "errrr");
                // onFailure(error);
              });
          }
        } else {
          createExpensePayment({
            filters: { check: 1 },
            data: expenseData,
          })
            .then((res) => {
              if (id) {
                editOperationTransfer({
                  id: id,
                  data: {
                    dateOfTransaction: moment(operationDate)?.format(
                      fullDateTimeWithSecond
                    ),
                    cashBoxTypeFrom: transferData.from.type,
                    cashBoxNameFrom: from,
                    cashBoxTypeTo: transferData.to.type,
                    cashBoxNameTo: to,
                    currency,
                    description,
                    amount: Number(paymentAmount),
                  },
                })
                  .then(() => {
                    onCreateCallBack(values, id);
                  })
                  .catch((error) => {
                    onFailure(error);
                  });
              } else {
                createOperationTransfer({
                  dateOfTransaction: moment(operationDate)?.format(
                    fullDateTimeWithSecond
                  ),
                  cashBoxTypeFrom: transferData.from.type,
                  cashBoxNameFrom: from,
                  cashBoxTypeTo: transferData.to.type,
                  cashBoxNameTo: to,
                  currency,
                  description,
                  amount: Number(paymentAmount),
                })
                  .then((res) => {
                    onCreateCallBack(values, res.id);
                  })
                  .catch((error) => {
                    onFailure(error);
                  });
              }
            })
            .catch((error) => {
              onFailurePayment(error);
            });
        }
      } else {
        if (id) {
          editOperationTransfer({
            id: id,
            data: {
              dateOfTransaction: moment(operationDate)?.format(
                fullDateTimeWithSecond
              ),
              cashBoxTypeFrom: transferData.from.type,
              cashBoxNameFrom: from,
              cashBoxTypeTo: transferData.to.type,
              cashBoxNameTo: to,
              currency,
              description,
              amount: Number(paymentAmount),
            },
          })
            .then(() => {
              onCreateCallBack(values, id);
            })
            .catch((error) => {
              onFailure(error);
            });
        } else {
          createOperationTransfer({
            dateOfTransaction: moment(operationDate)?.format(
              fullDateTimeWithSecond
            ),
            cashBoxTypeFrom: transferData.from.type,
            cashBoxNameFrom: from,
            cashBoxTypeTo: transferData.to.type,
            cashBoxNameTo: to,
            currency,
            description,
            amount: Number(paymentAmount),
          })
            .then((res) => {
              onCreateCallBack(values, res.id);
            })
            .catch((error) => {
              console.log(error, "err2");
              // onFailure(error);
            });
        }
      }
    }
  };

  useEffect(() => {
    run({ limit: 1000 });
    runAllCashboxNames({
      applyBusinessUnitTenantPersonFilter: 1,
      businessUnitIds: id
        ? operationList?.[0].businessUnitId === null
          ? [0]
          : [operationList?.[0].businessUnitId]
        : BUSINESS_TKN_UNIT
        ? [BUSINESS_TKN_UNIT]
        : undefined,
    });
  }, []);

  useEffect(() => {
    if (transferData?.from?.type) {
      runCashboxes({
        filter: {
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
        apiEnd: transferData?.from?.type,
      });
    }
  }, [transferData?.from?.type]);

  useEffect(() => {
    if (transferData?.from?.type && transferData?.to?.type) {
      runReceiveCashboxes({
        filter: {
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
        },
        apiEnd: transferData?.to?.type,
      });
    }
  }, [transferData?.to?.type]);

  useEffect(() => {
    if (cashboxes?.length === 1 && !id) {
      fetchAccountBalance({
        apiEnd: cashboxes[0]?.id,
        filters: {
          dateTime: moment(getValues("operationDate")).format(
            fullDateTimeWithSecond
          ),
        },
      }).then((data) => {
        setTransferData((prevData) => ({
          ...prevData,
          from: {
            ...transferData.from,
            balance: data,
            loading: false,
          },
        }));
        setValue("from", cashboxes[0].id);
        if (getValues("to") === cashboxes[0].id) {
          setValue("to", undefined);
        }
      });
    }
  }, [cashboxes]);

  useEffect(() => {
    if (receivedCashboxes?.length === 1 && !id) {
      fetchAccountBalance({
        apiEnd: receivedCashboxes[0].id,
        filters: {
          dateTime: moment(getValues("operationDate")).format(
            fullDateTimeWithSecond
          ),
        },
      }).then((data) => {
        setTransferData((prevData) => ({
          ...prevData,
          to: {
            ...transferData.to,
            balance: data,
            loading: false,
          },
        }));
        setValue("to", receivedCashboxes[0].id);
        if (getValues("from") === receivedCashboxes[0].id) {
          setValue("from", undefined);
        }
      });
    }
  }, [receivedCashboxes]);

  useEffect(() => {
    if (id && operationList) {
      if (currencies?.length !== 0) {
        setEditDate(
          moment(
            operationList?.[0].dateOfTransaction,
            fullDateTimeWithSecond
          ).toDate()
        );
        setValue(
          "operationDate",
          moment(operationList?.[0].dateOfTransaction, fullDateTimeWithSecond)
        );
        setTransferData({
          ...transferData,
          currency: currencies?.find(
            ({ id }) => id === operationList?.[0].currencyId
          ),
        });
      }
    }
  }, [currencies, id, operationList]);

  useEffect(() => {
    if (id && operationList?.length > 0) {
      const fromData = operationList.find(
        ({ cashInOrCashOut }) => cashInOrCashOut === -1
      );
      const toData = operationList.find(
        ({ cashInOrCashOut }) => cashInOrCashOut === 1
      );
      setTransferData({
        from: {
          ...transferData?.from,
          type: fromData?.paymentTypeId,
        },
        to: {
          ...transferData?.to,
          type: toData?.paymentTypeId,
        },
      });

      setValue("from", fromData.cashboxId);
      setValue("to", toData.cashboxId);
      setValue(
        "paymentAmount",
        `${roundToUp(Number(operationList[0]?.amount), 2)}`
      );
      setValue("description", operationList[0]?.description);
    }
  }, [id, operationList]);

  const handleUnit = (from) => {
    if (from) {
      fetchFilteredUnitCashbox({
        id: BUSINESS_TKN_UNIT === null ? [0] : [BUSINESS_TKN_UNIT],
        ids: [from],
      }).then((data) => {
        setFilteredUnitCashboxes(data[0]);
      });
    } else {
      setFilteredUnitCashboxes(undefined);
    }
  };

  useEffect(() => {
    if (getValues("operationDate")) {
      if (getValues(`from`)) {
        fetchAccountBalance({
          apiEnd: getValues(`from`),
          filters: {
            dateTime: moment(getValues("operationDate")).format(
              fullDateTimeWithSecond
            ),
          },
        }).then((data) => {
          setTransferData((prevData) => ({
            ...prevData,
            from: {
              ...transferData.from,
              balance: data || [],
              loading: false,
            },
          }));
        });
      }
      if (getValues(`to`)) {
        fetchAccountBalance({
          apiEnd: getValues(`to`),
          filters: {
            dateTime: moment(getValues("operationDate")).format(
              fullDateTimeWithSecond
            ),
          },
        }).then((data) => {
          setTransferData((prevData) => ({
            ...prevData,
            to: {
              ...transferData.to,
              balance: data || [],
              loading: false,
            },
          }));
        });
      }
    }
  }, [getValues("operationDate")]);

  const handleAccountChange = (type, account) => {
    setTransferData((prevTransferData) => ({
      ...prevTransferData,
      [type]: {
        ...transferData[type],
        balance: [],
        loading: true,
      },
    }));
    if (account) {
      fetchAccountBalance({
        apiEnd: account,
        filters: {
          dateTime: moment(getValues("operationDate"))?.format(
            fullDateTimeWithSecond
          ),
        },
      }).then((data) => {
        setTransferData((prevData) => ({
          ...prevData,
          [type]: {
            ...transferData[type],
            balance: data,
            loading: false,
          },
        }));
      });
    }
  };

  useEffect(() => {
    if (currencies?.length !== 0) {
      setValue(
        "currency",
        id && operationList
          ? operationList[0]?.currencyId
          : currencies?.filter((currency) => currency.id === getValues("currency"))
          .length > 0
          ? getValues("currency")
          : currencies[0]?.id
      );
      setTransferData({
        ...transferData,
        currency:
          currencies?.filter(
            (currency) => currency.id === getValues("currency")
          ).length > 0
            ? currencies?.find(
                (currency) => currency.id === getValues("currency")
              )
            : currencies[0],
      });
    }
  }, [currencies]);

  useEffect(() => {
    if (checked) {
      setTypeOfPayment(transferData.from.type);
      setValue("paymentAccount", getValues("from"));
    }
  }, [checked]);

  const changeTypeOfPayment = (value, type) => {
    if (type === "from") {
      setValue("from", undefined);
      setTransferData((prevData) => ({
        ...prevData,
        [type]: {
          ...transferData[type],
          type: value,
          balance: [],
          loading: false,
        },
      }));
    } else if (type === "to") {
      setValue("to", undefined);
      setTransferData((prevData) => ({
        ...prevData,
        [type]: {
          ...transferData[type],
          type: value,
          balance: [],
          loading: false,
        },
      }));
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
          <Text style={{ fontSize: 18 }}>Transfer</Text>

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
            <PaymentType
              disabled={transferData.from.loading}
              changeTypeOfPayment={changeTypeOfPayment}
              typeOfPayment={transferData.from.type}
              type="from"
            />
            <ProAsyncSelect
              label="Göndərən"
              data={
                id
                  ? [
                      {
                        name: operationList.find(
                          ({ cashInOrCashOut }) => cashInOrCashOut === -1
                        ).cashboxName,
                        label: operationList.find(
                          ({ cashInOrCashOut }) => cashInOrCashOut === -1
                        ).cashboxName,
                        value: operationList.find(
                          ({ cashInOrCashOut }) => cashInOrCashOut === -1
                        ).cashboxId,
                        id: operationList.find(
                          ({ cashInOrCashOut }) => cashInOrCashOut === -1
                        ).cashboxId,
                      },
                      ...cashboxes
                        ?.filter(
                          (filtercasboxes) =>
                            getValues("to") !== filtercasboxes.id &&
                            filtercasboxes.id !==
                              operationList.find(
                                ({ cashInOrCashOut }) => cashInOrCashOut === -1
                              ).cashboxId
                        )
                        .map((cashbox) => ({
                          ...cashbox,
                          id: cashbox.id,
                          value: cashbox.id,
                          label: `${cashbox.label} ( ${
                            cashbox.balance && cashbox.balance?.length > 0
                              ? cashbox.balance
                                  .map((balanceItem) => {
                                    const formattedBalance =
                                      formatNumberToLocale(
                                        defaultNumberFormat(balanceItem.balance)
                                      );
                                    return `${formattedBalance} ${balanceItem.currencyCode}`;
                                  })
                                  .join(", ")
                              : "0.00"
                          })`,
                        })),
                    ]
                  : cashboxes
                      ?.filter(
                        (filtercasboxes) =>
                          getValues("to") !== filtercasboxes.id
                      )
                      .map((cashbox) => ({
                        ...cashbox,
                        id: cashbox.id,
                        value: cashbox.id,
                        label: `${cashbox.label} ( ${
                          cashbox.balance && cashbox.balance?.length > 0
                            ? cashbox.balance
                                .map((balanceItem) => {
                                  const formattedBalance = formatNumberToLocale(
                                    defaultNumberFormat(balanceItem.balance)
                                  );
                                  return `${formattedBalance} ${balanceItem.currencyCode}`;
                                })
                                .join(", ")
                            : "0.00"
                        })`,
                      }))
              }
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
                dateTime: moment(getValues("operationDate")).format(
                  fullDateTimeWithSecond
                ),
                applyBusinessUnitTenantPersonFilter: 1,
              }}
              apiEnd={transferData?.from?.type}
              async={true}
              required={true}
              control={control}
              name="from"
              handleSelectValue={(id) => {
                handleAccountChange("from", id);
                handleUnit(id);
              }}
            />
            <PaymentType
              disabled={transferData.to.loading}
              changeTypeOfPayment={changeTypeOfPayment}
              typeOfPayment={transferData.to.type}
              type="to"
            />
            <ProAsyncSelect
              label="Qəbul edən"
              data={
                getValues("from")
                  ? [
                      ...(filteredUnitCashboxes?.transferCashboxes || [])
                        .filter(
                          ({ typeId }) => typeId === transferData?.to?.type
                        )
                        .map((cashbox) => ({
                          id: cashbox?.cashboxId,
                          value: cashbox?.cashboxId,
                          label: `${cashbox.cashboxName} ( ${
                            cashbox.balance && cashbox.balance?.length > 0
                              ? cashbox.balance
                                  .map((balanceItem) => {
                                    const formattedBalance =
                                      formatNumberToLocale(
                                        defaultNumberFormat(balanceItem.balance)
                                      );
                                    return `${formattedBalance} ${balanceItem.currencyCode}`;
                                  })
                                  .join(", ")
                              : "0.00"
                          })`,
                        })),
                      ...(receivedCashboxes || [])
                        .filter(
                          (cashbox) =>
                            getValues("from") !== cashbox.id &&
                            !(filteredUnitCashboxes?.transferCashboxes || [])
                              .map(({ cashboxId }) => cashboxId)
                              .includes(cashbox.id)
                        )
                        .map((cashbox) => ({
                          id: cashbox.id,
                          value: cashbox.id,
                          label: `${cashbox.name} ( ${
                            cashbox.balance && cashbox.balance?.length > 0
                              ? cashbox.balance
                                  .map((balanceItem) => {
                                    const formattedBalance =
                                      formatNumberToLocale(
                                        defaultNumberFormat(balanceItem.balance)
                                      );
                                    return `${formattedBalance} ${balanceItem.currencyCode}`;
                                  })
                                  .join(", ")
                              : "0.00"
                          })`,
                        })),
                    ]
                  : receivedCashboxes
                      ?.filter((cashbox) => getValues("from") !== cashbox.id)
                      .map((cashbox) => ({
                        id: cashbox.id,
                        value: cashbox.id,
                        label: `${cashbox.label} ( ${
                          cashbox.balance && cashbox.balance?.length > 0
                            ? cashbox.balance
                                .map((balanceItem) => {
                                  const formattedBalance = formatNumberToLocale(
                                    defaultNumberFormat(balanceItem.balance)
                                  );
                                  return `${formattedBalance} ${balanceItem.currencyCode}`;
                                })
                                .join(", ")
                            : "0.00"
                        })`,
                      }))
              }
              setData={setReceivedCashboxes}
              fetchData={getCashboxNames}
              apiEnd={transferData?.to?.type}
              async={false}
              required={true}
              control={control}
              name="to"
              handleSelectValue={(id) => {
                handleAccountChange("to", id);
              }}
            />
            <ProDateTimePicker
              name="operationDate"
              control={control}
              setValue={setValue}
              required
              editDate={editDate}
            />
            <View style={{ display: "flex", flexDirection: "row", gap: 10 }}>
              <ProFormInput
                label="Ödəniləcək məbləğ"
                required
                name="paymentAmount"
                control={control}
                width="70%"
                keyboardType="numeric"
              />
              <ProAsyncSelect
                label="Valyuta"
                data={currencies}
                setData={setCurrencies}
                fetchData={getCurrencies}
                async={false}
                filter={{ limit: 1000, withRatesOnly: 1 }}
                required
                control={control}
                allowClear={false}
                name="currency"
                width="27%"
              />
            </View>

            <ProFormInput
              multiline={true}
              label="Əlavə məlumat"
              name="description"
              control={control}
              style={{ textAlignVertical: "top" }}
            />
            <PaymentRow
              control={control}
              date={moment(getValues("operationDate"))?.format(
                fullDateTimeWithSecond
              )}
              getValues={getValues}
              setValue={setValue}
              watch={watch}
              // editId={editId}
              // operationsList={operationsList}
              checked={checked}
              setChecked={setChecked}
              typeOfPayment={typeOfPayment}
              setTypeOfPayment={setTypeOfPayment}
              expenses={expenses}
              setExpenses={setExpenses}
              selectedBusinesUnit={BUSINESS_TKN_UNIT}
              tenant={tenant}
              currencies={currencies}
              fromTransfer
            />
          </View>
          <View style={{ display: "flex", flexDirection: "row" }}>
            <ProButton
              label="Təsdiq et"
              type="primary"
              loading={loader}
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

export default FinanceTransfer;
