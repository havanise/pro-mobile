import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  useWindowDimensions,
  ScrollView,
  StyleSheet,
  Alert,
} from "react-native";
import Toast from "react-native-toast-message";
import moment from "moment";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { RadioButton } from "react-native-paper";
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
import SweetAlert from "react-native-sweet-alert";
import {
  getCurrencies,
  getCounterparties,
  createOperationInvoice,
  editOperationInvoice,
  fetchAdvancePaymentByContactId,
  fetchInvoiceListByContactId,
  fetchWorkers,
  convertCurrency,
  fetchSalesInvoiceInfo,
  getCashboxNames,
} from "../../api";
import {
  roundTo,
  fullDateTimeWithSecond,
  customRoundWithBigNumber,
  customRound,
  roundToDown,
  defaultNumberFormat,
  formatNumberToLocale,
  roundToUp,
} from "../../utils";
import ReceivablesPayables from "./ReceivablesPayables";
import AdvancePayment from "./AdvancePayment";
import { map } from "lodash";
import Dept from "./Dept";

const math = require("exact-math");
const BigNumber = require("bignumber.js");

const paymentDirection = {
  1: "contactsAmount",
  [-1]: "myAmount",
};

const Invoice = ({ navigation, route }) => {
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

  const { id, operationList, isQueryVat, businessUnit } = route.params || {};

  const [currencies, setCurrencies] = useState([]);
  const [cashboxes, setCashboxes] = useState([]);
  const [counterparties, setCounterparties] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [useAdvance, setUseAdvance] = useState(false);
  const [useBalance, setUseBalance] = useState(false);
  const [receivables, setReceivables] = useState({});
  const [payables, setPayables] = useState({});
  const [invoices, setInvoices] = useState([]);
  const [advancePayment, setAdvancePayment] = useState([]);
  const [amounts, setAmounts] = useState(null);
  const [checked, setChecked] = useState(false);
  const [checkedAdvance, setCheckedAdvance] = React.useState("advance");
  const [convertLoading, setConvertLoading] = useState(false);
  const [loaderConvert, setLoaderConvert] = useState(false);
  const [editDate, setEditDate] = useState(undefined);
  const [counterpartyHandled, setCounterpartyHandled] = useState(false);
  const [isLoadInvoiceListByContactId, setIsLoad] = useState(false);
  const [paymentAmountWithoutRound, setPaymentAmountWithoutRound] =
    useState(undefined);
  const [invoiceData, setInvoiceData] = useState({
    invoice: undefined,
    balanceAccount: undefined,
    counterparty: undefined,
    currency: undefined,
    rate: undefined,
    typeOfOperation: 1,
    typeOfPayment: 1,
    counterpartyId: undefined,
  });
  const [routes] = React.useState([
    { key: "first", title: "Ümumi məlumat" },
    { key: "second", title: "Qaimə" },
    { key: "third", title: "Ödəniş" },
  ]);

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

  const { isLoading: isLoadCounreparty, run: runCounterParty } = useApi({
    deferFn: getCounterparties,
    onResolve: (data) => {
      setCounterparties(
        data.map((item) => ({ ...item, label: item.name, value: item.id }))
      );
    },
    onReject: (error) => {
      console.log(error, "rejected");
    },
  });

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

  const onSubmit = (data) => {
    const {
      invoice,
      dateOfTransaction,
      paymentAmount,
      currency,
      account,
      description,
      paymentEmployee,
      paymentExpenseType,
      paymentContract,
      catalog,
      subCatalog,
      amount,
      employeeBalance,
    } = data;

    const editId =
      Array.isArray(invoice) && invoice.length > 0
        ? invoice.map((item) => Number(String(item).split("-")?.[0]))
        : [Number(String(invoice).split("-")?.[0])]; // VAT OR NOT EPIC CHECKOUT

    // const selectedMustPaySum = selectedInvoices?.reduce(
    //   (total, { remainingInvoiceDebtWithCredit }) =>
    //     math.add(total, Number(remainingInvoiceDebtWithCredit) || 0),
    //   0
    // );

    // const difference = math.sub(
    //   Number(payOrderedValue ?? 0),
    //   selectedMustPaySum
    // );

    const sendData = {
      type: useAdvance ? null : invoiceData.typeOfOperation,
      dateOfTransaction: moment(dateOfTransaction).format(
        fullDateTimeWithSecond
      ),
      cashbox: useAdvance || useBalance ? null : account,
      typeOfPayment: invoiceData.typeOfPayment,
      description,
      useAdvance,
      invoices_ul: editId || [],
      amounts_ul: [Number(paymentAmount)],
      currencies_ul: [currency],
      isTax_ul:
        Array.isArray(invoice) && invoice.length > 0
          ? map(invoice, (item) => String(item).split("-")?.length > 1)
          : [String(invoice).split("-")?.length > 1],
      employee: checked ? paymentEmployee : null,
      contract: checked
        ? paymentExpenseType === 1
          ? null
          : paymentContract === 0
          ? null
          : paymentContract
        : null,
      productionInvoice: checked
        ? paymentExpenseType === 1
          ? paymentContract
          : null
        : null,
      transactionCatalog: checked ? catalog : null,
      transactionItem: checked ? subCatalog : null,
      paymentAmounts_ul: null,
      employeeBalance: useBalance ? employeeBalance : null,
    };
    if (
      !useBalance &&
      // (selectedInvoices?.length < 2 ||
      //   (selectedInvoices?.length > 1 &&
      //     payOrderedValue > 0 &&
      //     difference > 0)) &&
      Number(paymentAmount) >
        roundToDown(
          Number(
            invoiceData.invoice?.creditId
              ? invoiceData.invoice?.remainingInvoiceDebtWithCredit
              : invoiceData.invoice?.debtAmount
          ) / Number(invoiceData.rate),
          2
        )
    ) {
      Alert.alert(
        "Diqqət!",
        `Bu ödəniş nəticəsində ${roundToUp(
          // payOrderedValue
          //   ? Number(difference)
          //   :
          math.sub(
            Number(paymentAmount),
            Number(
              invoiceData.invoice?.creditId
                ? invoiceData.invoice?.remainingInvoiceDebtWithCredit
                : invoiceData.invoice?.debtAmount
            ) / Number(invoiceData.rate)
          ),
          4
        )}${invoiceData.currency.code} avans məbləğ formalaşacaqdır!`,
        [
          {
            text: "İMTİNA",
            onPress: () => console.log("Cancel Pressed"),
            style: "cancel",
          },
          {
            text: "TƏSDİQ ET",
            onPress: () => {
              if (id) {
                editOperationInvoice({ id: id, data: sendData })
                  .then((res) => {
                    Toast.show({
                      type: "success",
                      text1: "Məlumatlar yadda saxlandı.",
                    });
                    navigation.push("DashboardTabs");
                  })
                  .catch((error) => {
                    console.log(error, "errr");
                    const errData = error?.response?.data?.error?.errorData;
                    const errKey = error?.response?.data?.error?.errors;

                    if (errKey?.key && errKey?.key === "wrong_advance_amount") {
                      Toast.show({
                        type: "error",
                        text2: `Avans balansında kifayət qədər vəsait yoxdur. Seçilmış tarixdə ödəniləcək məbləğ ${defaultNumberFormat(
                          errKey?.data?.number
                        )} ${
                          currencies.find(
                            (curr) => curr.id === getValues("currency")
                          ).code
                        } çox ola bilməz.`,
                        topOffset: 50,
                      });
                    } else if (
                      errKey?.key &&
                      errKey?.key ===
                        "date_of_transaction_is_later_than_invoice_date_of_transaction"
                    ) {
                      Toast.show({
                        type: "error",
                        text2: errKey.message,
                        topOffset: 50,
                      });
                    } else {
                      const cashboxName =
                        errData?.cashbox?.length > 15
                          ? `${errData?.cashbox.substring(0, 15)} ...`
                          : errData?.cashbox;
                      const amount = math.sub(
                        math.mul(Number(errData.amount || 0), -1),
                        Number(getValues("paymentAmount"))
                      );
                      if (Number(amount) <= 0) {
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
                          ]} ${errData?.currencyCode} çox ola bilməz. Tarix: ${
                            errData?.date
                          }`,
                          topOffset: 50,
                        });
                      }
                    }
                  });
              } else {
                createOperationInvoice(sendData)
                  .then((res) => {
                    Toast.show({
                      type: "success",
                      text1: "Məlumatlar yadda saxlandı.",
                    });
                    navigation.push("DashboardTabs");
                  })
                  .catch((error) => {
                    console.log(error, "errr");
                    const errData = error?.response?.data?.error?.errorData;
                    const errKey = error?.response?.data?.error?.errors;

                    if (errKey?.key && errKey?.key === "wrong_advance_amount") {
                      Toast.show({
                        type: "error",
                        text2: `Avans balansında kifayət qədər vəsait yoxdur. Seçilmış tarixdə ödəniləcək məbləğ ${defaultNumberFormat(
                          errKey?.data?.number
                        )} ${
                          currencies.find(
                            (curr) => curr.id === getValues("currency")
                          ).code
                        } çox ola bilməz.`,
                        topOffset: 50,
                      });
                    } else if (
                      errKey?.key &&
                      errKey?.key ===
                        "date_of_transaction_is_later_than_invoice_date_of_transaction"
                    ) {
                      Toast.show({
                        type: "error",
                        text2: errKey.message,
                        topOffset: 50,
                      });
                    } else {
                      const cashboxName =
                        errData?.cashbox?.length > 15
                          ? `${errData?.cashbox.substring(0, 15)} ...`
                          : errData?.cashbox;
                      const amount = math.sub(
                        math.mul(Number(errData.amount || 0), -1),
                        Number(getValues("paymentAmount"))
                      );
                      if (Number(amount) <= 0) {
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
                          ]} ${errData?.currencyCode} çox ola bilməz. Tarix: ${
                            errData?.date
                          }`,
                          topOffset: 50,
                        });
                      }
                    }
                  });
              }
            },
          },
        ]
      );
    } else {
      if (id) {
        editOperationInvoice({ id: id, data: sendData })
          .then((res) => {
            Toast.show({
              type: "success",
              text1: "Məlumatlar yadda saxlandı.",
            });
            navigation.push("DashboardTabs");
          })
          .catch((error) => {
            console.log(error, "errr");
            const errData = error?.response?.data?.error?.errorData;
            const errKey = error?.response?.data?.error?.errors;

            if (errKey?.key && errKey?.key === "wrong_advance_amount") {
              Toast.show({
                type: "error",
                text2: `Avans balansında kifayət qədər vəsait yoxdur. Seçilmış tarixdə ödəniləcək məbləğ ${defaultNumberFormat(
                  errKey?.data?.number
                )} ${
                  currencies.find((curr) => curr.id === getValues("currency"))
                    .code
                } çox ola bilməz.`,
                topOffset: 50,
              });
            } else if (
              errKey?.key &&
              errKey?.key ===
                "date_of_transaction_is_later_than_invoice_date_of_transaction"
            ) {
              Toast.show({
                type: "error",
                text2: errKey.message,
                topOffset: 50,
              });
            } else {
              const cashboxName =
                errData?.cashbox?.length > 15
                  ? `${errData?.cashbox.substring(0, 15)} ...`
                  : errData?.cashbox;
              const amount = math.sub(
                math.mul(Number(errData.amount || 0), -1),
                Number(getValues("paymentAmount"))
              );
              if (Number(amount) <= 0) {
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
                  ]} ${errData?.currencyCode} çox ola bilməz. Tarix: ${
                    errData?.date
                  }`,
                  topOffset: 50,
                });
              }
            }
          });
      } else {
        createOperationInvoice(sendData)
          .then((res) => {
            Toast.show({
              type: "success",
              text1: "Məlumatlar yadda saxlandı.",
            });
            navigation.push("DashboardTabs");
          })
          .catch((error) => {
            console.log(error, "errr");
            const errData = error?.response?.data?.error?.errorData;
            const errKey = error?.response?.data?.error?.errors;

            if (errKey?.key && errKey?.key === "wrong_advance_amount") {
              Toast.show({
                type: "error",
                text2: `Avans balansında kifayət qədər vəsait yoxdur. Seçilmış tarixdə ödəniləcək məbləğ ${defaultNumberFormat(
                  errKey?.data?.number
                )} ${
                  currencies.find((curr) => curr.id === getValues("currency"))
                    .code
                } çox ola bilməz.`,
                topOffset: 50,
              });
            } else if (
              errKey?.key &&
              errKey?.key ===
                "date_of_transaction_is_later_than_invoice_date_of_transaction"
            ) {
              Toast.show({
                type: "error",
                text2: errKey.message,
                topOffset: 50,
              });
            } else {
              const cashboxName =
                errData?.cashbox?.length > 15
                  ? `${errData?.cashbox.substring(0, 15)} ...`
                  : errData?.cashbox;
              const amount = math.sub(
                math.mul(Number(errData.amount || 0), -1),
                Number(getValues("paymentAmount"))
              );
              if (Number(amount) <= 0) {
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
                  ]} ${errData?.currencyCode} çox ola bilməz. Tarix: ${
                    errData?.date
                  }`,
                  topOffset: 50,
                });
              }
            }
          });
      }
    }
  };

  useEffect(() => {
    if (loaderConvert) {
      setTimeout(() => {
        setLoaderConvert(false);
      }, 1000);
    } else if (invoiceData.invoice?.id && invoiceData.currency?.id) {
      const {
        debtAmount,
        currencyId,
        creditId,
        remainingInvoiceDebtWithCredit,
      } = invoiceData.invoice || {};
      if (convertLoading) {
        setLoaderConvert(true);
      } else if (useAdvance) {
        const fieldName = paymentDirection[invoiceData.typeOfOperation];
        const selectedAdvance = advancePayment[fieldName].filter(
          (advance) => advance.currencyId === invoiceData.currency.id
        )[0];
        convertCurrency({
          amount: Number(selectedAdvance?.amount || 0),
          fromCurrencyId: invoiceData.currency.id,
          toCurrencyId: currencyId,
          dateTime: moment().format(fullDateTimeWithSecond),
        }).then((data) => {
          const covertingAmount =
            creditId !== null
              ? Number(remainingInvoiceDebtWithCredit) > Number(data.amount)
                ? Number(data.amount)
                : Number(remainingInvoiceDebtWithCredit)
              : Number(debtAmount) > Number(data.amount)
              ? Number(data.amount)
              : Number(debtAmount);
          if (covertingAmount && currencyId && !invoiceData.edit) {
            convertCurrency({
              amount: covertingAmount,
              fromCurrencyId: currencyId,
              toCurrencyId: invoiceData.currency.id,
              dateTime: moment().format(fullDateTimeWithSecond),
            }).then((data) => {
              if (!invoiceData.edit) {
                setInvoiceData((prevData) => ({
                  ...prevData,
                  rate: 1 / data.rate,
                }));
                setPaymentAmountWithoutRound(data.amount);
                setValue("paymentAmount", `${customRound(data.amount, 1, 2)}`);
              }
            });
          }
        });
      }
      // else if (useBalance) {
      //   const fieldName = paymentDirection[invoiceData.typeOfOperation];
      //   const selectedBalance = balancePayment[fieldName].filter(
      //     (advance) => advance.currencyId === invoiceData.currency.id
      //   )[0];
      //   convertCurrency(
      //     Number(selectedBalance?.amount || 0),
      //     invoiceData.currency.id,
      //     currencyId,
      //     ({ data }) => {
      //       const covertingAmount =
      //         creditId !== null
      //           ? Number(remainingInvoiceDebtWithCredit) > Number(data.amount)
      //             ? Number(data.amount)
      //             : Number(remainingInvoiceDebtWithCredit)
      //           : Number(debtAmount) > Number(data.amount)
      //           ? Number(data.amount)
      //           : Number(debtAmount);
      //       convertCurrency(
      //         covertingAmount,
      //         currencyId,
      //         invoiceData.currency.id,
      //         ({ data }) => {
      //           if (!invoiceData.edit) {
      //             setInvoiceData((prevData) => ({
      //               ...prevData,
      //               rate: 1 / data.rate,
      //             }));
      //             setPaymentAmountWithoutRound(data.amount);
      //             setFieldsValue({
      //               paymentAmount: customRound(data.amount, 1, 2),
      //             });
      //           }
      //         }
      //       );
      //     }
      //   );
      // }
      else {
        setConvertLoading(true);
        convertCurrency({
          amount:
            creditId !== null
              ? remainingInvoiceDebtWithCredit || 1
              : debtAmount || 1,
          fromCurrencyId: currencyId,
          toCurrencyId: invoiceData.currency.id,
          dateTime: moment().format(fullDateTimeWithSecond),
        }).then((data) => {
          setConvertLoading(false);
          if (!invoiceData.edit) {
            setInvoiceData((prevData) => ({
              ...prevData,
              rate: 1 / data.rate,
            }));
            setPaymentAmountWithoutRound(
              customRoundWithBigNumber(
                Number(
                  creditId !== null
                    ? remainingInvoiceDebtWithCredit || 0
                    : debtAmount || 0
                ),
                Number(data.rate || 0)
              )
            );
            setValue(
              "paymentAmount",
              `${roundToDown(
                customRound(
                  Number(
                    creditId !== null
                      ? remainingInvoiceDebtWithCredit || 0
                      : debtAmount || 0
                  ),
                  data.rate,
                  2
                ),
                2
              )}`
            );
          }
        });
      }
    }
  }, [
    invoiceData.invoice,
    invoiceData.currency,
    useAdvance,
    loaderConvert,
    useBalance,
  ]);

  useEffect(() => {
    run({ limit: 1000, withRatesOnly: 1 });
    runWorkers({ lastEmployeeActivityType: 1 });
    runCounterParty({
      filter: {
        limit: 20,
        page: 1,
        categories: [1],
        applyBusinessUnitTenantPersonFilter: 1,
      },
    });
  }, []);

  useEffect(() => {
    if (invoiceData.typeOfPayment) {
      runCashboxes({
        filter: {
          dateTime: moment(getValues("dateOfTransaction"))?.format(
            fullDateTimeWithSecond
          ),
          applyBusinessUnitTenantPersonFilter: 1,
        },
        apiEnd: invoiceData.typeOfPayment,
      });
    }
  }, [invoiceData.typeOfPayment]);

  useEffect(() => {
    if (id && operationList?.length > 0 && useBalance) {
      setValue(
        "employeeBalance",
        getValues("employeeBalance")
          ? getValues("employeeBalance")
          : operationList[0]?.employeeId
      );
    }
  }, [id, operationList, useBalance]);

  useEffect(() => {
    if (id && operationList) {
      changeTypeOfPayment(
        operationList[0]?.paymentTypeId,
        operationList[0]?.cashboxId || undefined
      );
    }
  }, [id, operationList]);

  useEffect(() => {
    if (id && operationList?.length > 0) {
      // if (operationList[0]?.employeeId) {
      //   fetchTenantBalance(
      //     operationsList[0]?.employeeId,
      //     {
      //       businessUnitIds: editId
      //         ? operationsList[0]?.businessUnitId === null
      //           ? [0]
      //           : [operationsList[0]?.businessUnitId]
      //         : BUSINESS_TKN_UNIT
      //         ? [BUSINESS_TKN_UNIT]
      //         : undefined,
      //       dateTime: getValues("operationDate")?.format(
      //         fullDateTimeWithSecond
      //       ),
      //       notCashboxTransactionIds: editId
      //         ? [operationsList[0]?.cashboxTransactionId]
      //         : [],
      //     },
      //     fetchBalancePaymentCallback
      //   );
      // }

      setEditDate(
        moment(
          operationList?.[0].dateOfTransaction,
          fullDateTimeWithSecond
        ).toDate()
      );

      setValue("counterparty", operationList[0]?.contactId);
      setValue(
        "operationDate",
        moment(operationList[0].dateOfTransaction, fullDateTimeWithSecond)
      );
      setValue(
        "invoice",
        isQueryVat
          ? `${operationList[0]?.invoiceId}-vat`
          : Number(operationList[0]?.invoiceId)
      );
      setValue("currency", operationList[0].currencyId);
      setValue("description", operationList[0].description);
      setValue("account", operationList[0].cashboxId || undefined);

      if (operationList[0]?.employeeId) {
        setValue("catalog", operationList[0]?.transactionCatalogId);
        setValue("subCatalog", operationList[0]?.transactionItemId);
        setChecked(true);
      }
      setCheckedAdvance(
        operationList[0]?.isAdvance
          ? "advance"
          : operationList[0]?.isEmployeePayment
          ? "balance"
          : undefined
      );
      setUseAdvance(operationList[0]?.isAdvance);
      setUseBalance(operationList[0]?.isEmployeePayment);
    }
  }, [id, operationList]);

  useEffect(() => {
    if (
      id &&
      operationList &&
      currencies.length > 0 &&
      operationList[0]?.contactId === getValues("counterparty") &&
      counterparties.length < 21 &&
      counterparties.length >= 0 &&
      counterpartyHandled === false
    ) {
      handleChangeCounterparty(operationList[0]?.contactId, true);
      setCounterpartyHandled(true);
    }
  }, [id, operationList, counterparties, currencies]);

  useEffect(() => {
    if (currencies?.length > 0) {
      setInvoiceData({
        ...invoiceData,
        currency:
          id && operationList
            ? currencies?.find(({ id }) => id === operationList[0]?.currencyId)
            : currencies?.filter(
                (currency) => currency.id === getValues("currency")
              ).length > 0
            ? currencies?.find(
                (currency) => currency.id === getValues("currency")
              )
            : currencies[0],
      });
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
    }
  }, [currencies]);

  const updateReceivablesPayables = (invoices) => {
    let receivablesTemp = {};
    let payablesTemp = {};
    invoices.forEach((invoice) => {
      const { invoiceType, currencyCode, remainingInvoiceDebt } = invoice;
      if (invoiceType === 2 || invoiceType === 4 || invoiceType === 13) {
        receivablesTemp = {
          ...receivablesTemp,
          [currencyCode]:
            (receivablesTemp[currencyCode] || 0) + Number(remainingInvoiceDebt),
        };
      } else if (
        invoiceType === 1 ||
        invoiceType === 3 ||
        invoiceType === 10 ||
        invoiceType === 12
      ) {
        payablesTemp = {
          ...payablesTemp,
          [currencyCode]:
            (payablesTemp[currencyCode] || 0) + Number(remainingInvoiceDebt),
        };
      }
    });
    setReceivables(receivablesTemp);
    setPayables(payablesTemp);
  };

  const { isLoad, run: runAdvancePaymentByContactId } = useApi({
    deferFn: fetchAdvancePaymentByContactId,
    onResolve: (data) => {
      const editedData = {
        myAmount: data?.myAmount,
        contactsAmount: data?.contactsAmount,
      };
      setAdvancePayment(editedData);
    },
    onReject: (error) => {
      console.log(error, "rejected");
    },
  });

  const handleOperationTypeChange = (operationType, invoicesList, edit) => {
    setUseAdvance(
      edit ? operationList[0]?.isAdvance : false
    );
    if ((!edit && operationType == 1) || checkedAdvance !== "balance") {
      setUseBalance(false);
    }

    setValue(
      "paymentAmount",
      edit ? `${customRound(operationList[0]?.amount, 1, 2)}` : undefined
    );

    setInvoiceData({
      ...invoiceData,
      typeOfPayment: edit ? operationList[0]?.paymentTypeId : 1,
      rate: edit
        ? roundToDown(Number(operationList[0]?.invoicePaymentCustomRate))
        : invoiceData.rate,
      typeOfOperation: edit
        ? operationList[0]?.isAdvance
          ? operationList[0]?.cashInOrCashOut === 1
            ? -1
            : 1
          : operationList[0]?.isEmployeePayment
          ? -1
          : operationList[0]?.cashInOrCashOut
        : operationType,
      invoice: edit
        ? isQueryVat
          ? `${operationList[0]?.invoiceId}-vat`
          : Number(operationList[0]?.invoiceId)
        : undefined,
      currency: edit
        ? currencies?.find(({ id }) => id === operationList[0]?.currencyId)
        : currencies?.[0],
    });
    const Voices = getInvoiceList(
      invoicesList,
      edit
        ? operationList[0]?.isAdvance
          ? operationList[0]?.cashInOrCashOut === 1
            ? -1
            : 1
          : operationList[0]?.cashInOrCashOut
        : operationType,
      id,
      operationList,
      isQueryVat,
      getValues("counterparty")
    ).filter((invoice) => Number(invoice.debtAmount) || invoice.fromEdit);

    if (Voices) {
      setValue(
        "invoice",
        Voices.length === 1
          ? Voices[0].id
          : edit
          ? isQueryVat
            ? `${operationList[0]?.invoiceId}-vat`
            : Number(operationList[0]?.invoiceId)
          : undefined
      );
      if (edit) {
        handleSelectInvoice(
          isQueryVat
            ? `${operationList[0]?.invoiceId}-vat`
            : Number(operationList[0]?.invoiceId),
          invoicesList,
          operationType,
          edit
        );
        if (operationList[0]?.employeeId) {
          setFieldsValue({
            employee: operationList[0]?.employeeId,
            catalog: operationList[0]?.transactionCatalogId,
            subCatalog: operationList[0]?.transactionItemId,
          });
        }
      }
      if (Voices.length === 1 && !edit) {
        handleSelectInvoice(Voices[0].id, invoicesList, operationType);
      }
      setChecked(edit ? !!operationList[0]?.employeeId : false);
    } else {
      setValue(
        "invoice",
        edit
          ? isQueryVat
            ? `${operationList[0]?.invoiceId}-vat`
            : Number(operationList[0]?.invoiceId)
          : undefined
      );
      setValue(
        "paymentAmount",
        edit ? `${customRound(operationList[0]?.amount, 1, 2)}` : undefined
      );
    }
  };

  const handleSelectInvoice = (
    selectedInvoiceId,
    invoices,
    operationType,
    edit
  ) => {
    const selectedInvoice = getInvoiceList(
      invoices,
      edit
        ? operationList[0]?.isAdvance
          ? operationList[0]?.cashInOrCashOut === 1
            ? -1
            : 1
          : operationList[0]?.cashInOrCashOut
        : operationType,
      id,
      operationList,
      isQueryVat,
      getValues("counterparty")
    ).find((invoice) => invoice.id === selectedInvoiceId);

    if (
      moment(getValues("dateOfTransaction"))?.isBefore(
        moment(selectedInvoice?.operationDate, fullDateTimeWithSecond)
      )
    ) {
      setValue(
        "dateOfTransaction",
        moment(selectedInvoice?.operationDate, fullDateTimeWithSecond)
      );
      setValue("currency", selectedInvoice?.currencyId);
    } else {
      setValue("currency", selectedInvoice?.currencyId);
    }

    if (!selectedInvoice?.isTax) {
      fetchSalesInvoiceInfo({
        apiEnd: isNaN(Number(selectedInvoiceId))
          ? Number(selectedInvoiceId.split("-")[0])
          : Number(selectedInvoiceId),
      }).then((data) => {
        const { creditId } = data;

        setInvoiceData((prevData) => ({
          ...prevData,
          currency: currencies?.find(
            ({ id }) => id === selectedInvoice?.currencyId
          ),
          invoice: { creditId, ...selectedInvoice },
          edit,
        }));
      });
    } else {
      setInvoiceData((prevData) => ({
        ...prevData,
        currency: currencies?.find(
          ({ id }) => id === selectedInvoice?.currencyId
        ),
        invoice: { ...selectedInvoice },
        edit,
      }));
    }
  };

  const handleChangeCounterparty = (selectedCounterpartyId, edit = false) => {
    const selectedCounterparty = counterparties.filter(
      (contact) => contact.id === selectedCounterpartyId
    )[0];

    setInvoiceData((prevInvoiceData) => ({
      ...prevInvoiceData,
      counterparty: selectedCounterparty,
      balanceAccount: undefined,
      typeOfPayment: edit ? operationList[0]?.paymentTypeId : 1,
      typeOfOperation: edit
        ? operationList[0]?.isAdvance
          ? operationList[0]?.cashInOrCashOut === 1
            ? -1
            : 1
          : operationList[0]?.isEmployeePayment
          ? -1
          : operationList[0]?.cashInOrCashOut
        : 1,
      currency: edit
        ? currencies?.find(({ id }) => id === operationList[0]?.currencyId)
        : currencies?.[0],
      invoice: edit
        ? isQueryVat
          ? `${operationList[0]?.invoiceId}-vat`
          : Number(operationList[0]?.invoiceId)
        : undefined,
      idForFindVat:
        edit && isQueryVat ? Number(operationList[0]?.invoiceId) : undefined,
    }));

    if (selectedCounterpartyId) {
      setIsLoad(true);
      fetchInvoiceListByContactId({
        apiEnd: selectedCounterpartyId,
      }).then((data) => {
        setIsLoad(false);
        setInvoices(
          data.map((item) => ({ ...item, label: item.invoiceNumber }))
        );
        updateReceivablesPayables(data);

        if (
          data.filter(
            (invoice) =>
              invoice.invoiceType === 2 ||
              invoice.invoiceType === 4 ||
              invoice.invoiceType === 13
          ).length === 0 &&
          data.filter(
            (invoice) =>
              invoice.invoiceType === 1 ||
              invoice.invoiceType === 10 ||
              invoice.invoiceType === 3 ||
              invoice.invoiceType === 12
          ).length > 0
        ) {
          handleOperationTypeChange(-1, data, edit);
        } else {
          handleOperationTypeChange(1, data, edit);
        }
      });

      runAdvancePaymentByContactId({
        filter: {
          businessUnitIds: undefined,
          dateTime: moment(getValues("dateOfTransaction"))?.format(
            fullDateTimeWithSecond
          ),
        },
        apiEnd: selectedCounterpartyId,
      });
      // }
    }
  };

  const handleAdvanceChange = (checked) => {
    if (checked) {
      const advanceBalance =
        advancePayment[paymentDirection[invoiceData.typeOfOperation]];
      const advanceCurrency = advanceBalance[0];

      setValue("currency", advanceCurrency?.currencyId);
      setValue("account", undefined);
      setInvoiceData((prevInvoiceData) => ({
        ...prevInvoiceData,
        balanceAccount: undefined,
        currency: {
          id: advanceCurrency?.currencyId,
          code: advanceCurrency?.code,
        },
      }));
      // setCurrencyCode(advanceCurrency?.code);
      // fetchLastDateOfAdvanceByContactId(
      //   getValues("counterparty"),
      //   ({ data }) => {
      //     if (data !== null) {
      //       if (
      //         getValues("dateOfTransaction")?.isBefore(
      //           moment(data, "DD-MM-YYYY HH:mm:ss")
      //         )
      //       ) {
      //         ajaxContractsSelectRequest(
      //           1,
      //           20,
      //           "",
      //           1,
      //           undefined,
      //           moment(data, fullDateTimeWithSecond)?.format(dateFormat)
      //         );
      //         setFieldsValue({
      //           dateOfTransaction: moment(data, fullDateTimeWithSecond),
      //         });
      //       }
      //       if (
      //         moment(
      //           invoiceData?.invoice?.operationDate,
      //           fullDateTimeWithSecond
      //         )?.isBefore(moment(data, "DD-MM-YYYY HH:mm:ss")) ||
      //         getValues("dateOfTransaction")?.isBefore(
      //           moment(data, "DD-MM-YYYY HH:mm:ss")
      //         )
      //       ) {
      //         setDate(data);
      //       } else {
      //         setDate(
      //           invoiceData?.invoice?.operationDate ||
      //             getValues("dateOfTransaction").format(
      //               fullDateTimeWithSecond
      //             )
      //         );
      //       }
      //     } else {
      //       setDate(null);
      //     }
      //   }
      // );
    } else {
      setInvoiceData((prevInvoiceData) => ({
        ...prevInvoiceData,
        typeOfPayment: 1,
      }));
      // setDate(todayWithMinutes);
    }
    setUseAdvance(checked);
  };

  const getInvoiceList = (
    invoices,
    type,
    edit,
    operationsList,
    isVat,
    counterparty
  ) => {
    const invoicesWithVat =
      invoices?.length > 0 || edit
        ? [
            edit &&
            operationsList?.length > 0 &&
            operationsList[0].contactId === counterparty &&
            (!invoices
              .filter(
                ({ id, isTax }) =>
                  id === Number(operationsList[0].invoiceId) && isVat === isTax
              )
              .map(({ id }) => id)
              .includes(Number(operationsList?.[0]?.invoiceId)) ||
              (operationsList[0].transactionType === 10 &&
                invoices.filter(
                  ({ id, isTax }) =>
                    id === Number(operationsList[0].invoiceId) && isTax
                ).length === 0))
              ? {
                  id: operationsList[0].invoiceId,
                  label: operationsList[0].invoiceNumber,
                  invoiceType: operationsList[0].invoiceType,
                  invoiceNumber: operationsList[0].invoiceNumber,
                  remainingInvoiceDebt: 0,
                  remainingInvoiceDebtWithCredit: 0,
                  debtAmount: 0,
                  currencyCode: operationsList[0].invoiceCurrencyCode,
                  currencyId: operationsList[0].invoiceCurrencyId,
                  fromEdit: true,
                  isTax: operationsList[0].transactionType === 10,
                }
              : {},
            ...invoices,
          ]
            .filter((invoice) =>
              type === 1
                ? invoice.invoiceType === 2 ||
                  invoice.invoiceType === 4 ||
                  invoice.invoiceType === 13
                : invoice.invoiceType === 1 ||
                  invoice.invoiceType === 3 ||
                  invoice.invoiceType === 10 ||
                  invoice.invoiceType === 12
            )
            .map((currentInvoice) => {
              if (currentInvoice.isTax) {
                return {
                  ...currentInvoice,
                  id: `${currentInvoice.id}-vat`,
                  invoiceNumber: `${currentInvoice.invoiceNumber}(VAT)`,
                  label: `${currentInvoice.label}(VAT)`,
                  debtAmount: Number(currentInvoice.remainingInvoiceDebt),
                  isTax: true,
                };
              }
              return {
                ...currentInvoice,
                debtAmount: Number(currentInvoice.remainingInvoiceDebt),
              };
            }, [])
        : [];
    return invoicesWithVat;
  };

  const Voices = getInvoiceList(
    invoices,
    invoiceData.typeOfOperation,
    id,
    operationList,
    isQueryVat,
    getValues("counterparty")
  ).filter((invoice) => Number(invoice.debtAmount) || invoice.fromEdit);

  const changeTypeOfPayment = (e, edit = false) => {
    setInvoiceData({ ...invoiceData, typeOfPayment: e });
    setValue("account", edit || undefined);
  };

  useEffect(() => {
    if (checked) {
      setValue("amount", `${getValues("paymentAmount")}`);
    }
  }, [checked, getValues("paymentAmount")]);

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
          <Text style={{ fontSize: 18 }}>Qaimə</Text>

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
              label="Qarşı tərəf"
              data={counterparties}
              setData={setCounterparties}
              fetchData={getCounterparties}
              async
              filter={{
                limit: 20,
                page: 1,
                isInDebted: 1,
              }}
              control={control}
              required
              name="counterparty"
              handleSelectValue={(id) => handleChangeCounterparty(id)}
            />
            <View>
              {getValues("counterparty") && (
                <ReceivablesPayables
                  loadingCalc={isLoadInvoiceListByContactId}
                  receivables={receivables}
                  payables={payables}
                  counterparty={getValues("counterparty")}
                />
              )}
            </View>
            <View
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <View
                style={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <RadioButton
                  value="advance"
                  status={
                    checkedAdvance === "advance" ? "checked" : "unchecked"
                  }
                  onPress={() => setCheckedAdvance("advance")}
                />
                <Text>Avansdan ödə</Text>
              </View>
              <View
                style={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <RadioButton
                  value="balance"
                  status={
                    checkedAdvance === "balance" ? "checked" : "unchecked"
                  }
                  onPress={() => setCheckedAdvance("balance")}
                />
                <Text>Təhtəl hesabdan ödə</Text>
              </View>
            </View>
            {checkedAdvance === "advance" && (
              <View style={{ margin: "15px 0" }}>
                <AdvancePayment
                  advancePayment={advancePayment}
                  checked={useAdvance}
                  onChange={handleAdvanceChange}
                  disabled={
                    !getValues("invoice") || !getValues("counterparty")
                    // advancePayment[
                    //   paymentDirection[invoiceData.typeOfOperation]
                    // ]?.length === 0 ||
                    // isDisabled
                    // || selectedInvoices?.length > 1
                  }
                  loading={isLoad}
                />
              </View>
            )}
            {checkedAdvance === "balance" && (
              <>
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
                  name="employeeBalance"
                  handleSelectValue={(id) => {
                    // setFieldsValue({
                    //   invoice: undefined,
                    //   employee: account,
                    // });
                    // setUseBalance(false);
                    // handleCounterpartyChange(account);
                  }}
                />
                {/* <View style={{ margin: "15px 0" }}>
                  <AdvancePayment
                    title="Təhtəl hesabdan ödə"
                    subTitle="Balans:"
                    advancePayment={balancePayment}
                    checked={useBalance}
                    onChange={handleBalanceChange}
                    disabled={
                      !getValues("employeeBalance") ||
                      !getValues("invoice") ||
                      balancePayment.myAmount?.filter(
                        (currencyBalance) => Number(currencyBalance.amount) > 0
                      ).length === 0 ||
                      // selectedInvoices?.length > 1 ||
                      invoiceData.typeOfOperation === 1
                    }
                    // loading={tenantBalanceLoading}
                  />
                </View> */}
              </>
            )}
            <View>
              <Text style={{ marginBottom: 5 }}>Əməliyyatın növü</Text>
              <View style={{ display: "flex", flexDirection: "row", gap: 10 }}>
                <ProButton
                  label="Mədaxil"
                  selected={
                    invoiceData.typeOfOperation === 1 &&
                    invoices.filter(
                      (invoice) =>
                        invoice.invoiceType === 2 ||
                        invoice.invoiceType === 4 ||
                        invoice.invoiceType === 13
                    ).length > 0
                  }
                  type={"tab"}
                  defaultStyle={{ borderRadius: 30 }}
                  buttonBorder={styles.buttonStyle}
                  disabled={
                    invoices.filter(
                      (invoice) =>
                        invoice.invoiceType === 2 ||
                        invoice.invoiceType === 4 ||
                        invoice.invoiceType === 13
                    ).length === 0
                  }
                  onClick={() => {
                    handleOperationTypeChange(1, invoices);
                  }}
                  // loading={isLoading}
                />
                <ProButton
                  label="Məxaric"
                  selected={
                    invoiceData.typeOfOperation === -1 &&
                    invoices.filter(
                      (invoice) =>
                        invoice.invoiceType === 1 ||
                        invoice.invoiceType === 3 ||
                        invoice.invoiceType === 10 ||
                        invoice.invoiceType === 12
                    ).length > 0
                  }
                  type={invoiceData.typeOfOperation === -1 ? "primaty" : "tab"}
                  defaultStyle={{ borderRadius: 30 }}
                  buttonBorder={styles.buttonStyle}
                  disabled={
                    invoices.filter(
                      (invoice) =>
                        invoice.invoiceType === 1 ||
                        invoice.invoiceType === 3 ||
                        invoice.invoiceType === 10 ||
                        invoice.invoiceType === 12
                    ).length === 0
                  }
                  onClick={() => {
                    handleOperationTypeChange(-1, invoices);
                  }}
                />
              </View>
            </View>
            <ProAsyncSelect
              label="Qaimə"
              data={Voices}
              setData={() => {}}
              fetchData={() => {}}
              async={false}
              filter={{}}
              required
              control={control}
              allowClear={false}
              name="invoice"
              handleSelectValue={(id) => {
                handleSelectInvoice(id, invoices, invoiceData.typeOfOperation);
              }}
            />
            {invoiceData.invoice?.id && (
              <Dept
                currency={invoiceData.invoice?.currencyCode}
                value={
                  (invoiceData.invoice?.creditId &&
                  invoiceData.invoice?.creditId !== null
                    ? id &&
                      operationList?.length > 0 &&
                      ((operationList[0].transactionType !== 10 &&
                        operationList[0].invoiceId === getValues("invoice")) ||
                        (invoiceData.invoice?.isTax &&
                          `${operationList[0]?.invoiceId}-vat` ===
                            getValues("invoice")))
                      ? math.add(
                          Number(
                            invoiceData.invoice
                              ?.remainingInvoiceDebtWithCredit || 0
                          ),
                          Number(
                            operationList[0]
                              ?.invoicePaymentAmountConvertedToInvoiceCurrency ||
                              0
                          )
                        )
                      : Number(invoiceData.invoice?.mustPay || 0)
                    : id &&
                      operationList?.length > 0 &&
                      ((operationList[0].transactionType !== 10 &&
                        operationList[0].invoiceId === getValues("invoice")) ||
                        (invoiceData.invoice?.isTax &&
                          isQueryVat &&
                          `${operationList[0]?.invoiceId}-vat` ===
                            getValues("invoice")))
                    ? math.add(
                        Number(invoiceData.invoice?.debtAmount || 0),
                        Number(
                          operationList[0]
                            ?.invoicePaymentAmountConvertedToInvoiceCurrency ||
                            0
                        )
                      )
                    : Number(invoiceData.invoice?.debtAmount || 0)) ||
                  (invoiceData.invoice?.creditId &&
                  invoiceData.invoice?.creditId !== null
                    ? id &&
                      operationList?.length > 0 &&
                      ((operationList[0].transactionType !== 10 &&
                        operationList[0].invoiceId === getValues("invoice")) ||
                        (invoiceData.invoice?.isTax &&
                          `${operationList[0]?.invoiceId}-vat` ===
                            getValues("invoice")))
                      ? math.add(
                          Number(
                            invoiceData.invoice
                              ?.remainingInvoiceVatDebtWithCredit || 0
                          ),
                          Number(
                            operationList[0]
                              ?.invoicePaymentAmountConvertedToInvoiceCurrency ||
                              0
                          )
                        )
                      : Number(
                          invoiceData.invoice
                            ?.remainingInvoiceVatDebtWithCredit || 0
                        )
                    : id &&
                      operationList?.length > 0 &&
                      ((operationList[0].transactionType !== 10 &&
                        operationList[0].invoiceId === getValues("invoice")) ||
                        (invoiceData.invoice?.isTax &&
                          isQueryVat &&
                          `${operationList[0]?.invoiceId}-vat` ===
                            getValues("invoice")))
                    ? math.add(
                        Number(invoiceData.invoice?.debtVatAmount || 0),
                        Number(
                          operationList[0]
                            ?.invoicePaymentAmountConvertedToInvoiceCurrency ||
                            0
                        )
                      )
                    : Number(invoiceData.invoice?.debtVatAmount || 0))
                }
              />
            )}
            <ProDateTimePicker
              name="dateOfTransaction"
              control={control}
              setValue={setValue}
              required
            />
            <View style={{ display: "flex", flexDirection: "row", gap: 10 }}>
              <ProFormInput
                label="Ödəniləcək məbləğ"
                required
                name="paymentAmount"
                control={control}
                width="70%"
                keyboardType="numeric"
                handleChange={(val) => {
                  setValue("amount", `${val}`);
                }}
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
            <PaymentType
              disabled={useAdvance || checkedAdvance === "balance"}
              changeTypeOfPayment={changeTypeOfPayment}
              typeOfPayment={invoiceData.typeOfPayment}
            />
            <ProAsyncSelect
              label="Hesab"
              data={cashboxes.map((cashbox) => ({
                id: cashbox.id,
                label: `${cashbox.label} ( ${
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
                })`,
              }))}
              setData={setCashboxes}
              fetchData={getCashboxNames}
              async={false}
              filter={{
                dateTime: moment(getValues("dateOfTransaction"))?.format(
                  fullDateTimeWithSecond
                ),
                applyBusinessUnitTenantPersonFilter: 1,
              }}
              required={useAdvance || checkedAdvance === "balance" ? false : true}
              disabled={useAdvance || checkedAdvance === "balance"}
              control={control}
              allowClear={false}
              name="account"
            />
            <ProFormInput
              multiline={true}
              label="Əlavə məlumat"
              name="description"
              control={control}
              style={{ textAlignVertical: "top" }}
            />
            {(Voices.find((item) => item.id === getValues("invoice"))
              ?.invoiceType === 1 ||
              Voices.find((item) => item.id === getValues("invoice"))
                ?.invoiceType === 10 ||
              Voices.find((item) => item.id === getValues("invoice"))
                ?.invoiceType === 12) &&
            !Voices.find((item) => item.id === getValues("invoice"))?.isTax ? (
              <PaymentRow
                control={control}
                date={moment(getValues("operationDate"))?.format(
                  fullDateTimeWithSecond
                )}
                getValues={getValues}
                setValue={setValue}
                watch={watch}
                checked={checked}
                setChecked={setChecked}
                typeOfPayment={undefined}
                setTypeOfPayment={() => {}}
                selectedBusinesUnit={BUSINESS_TKN_UNIT}
                tenant={tenant}
                currencies={currencies}
                fromInvoice
              />
            ) : null}
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

export default Invoice;
