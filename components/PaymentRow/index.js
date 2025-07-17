import React, { useState, useEffect, useMemo } from "react";
import { View, StyleSheet, Text } from "react-native";
import Checkbox from "expo-checkbox";
import ProAsyncSelect from "../ProAsyncSelect";
import {
  fetchSalesInvoiceList,
  fetchWorkers,
  getCashboxNames,
  getContracts,
  getExpenseCatalogs,
} from "../../api";
import { defaultNumberFormat, formatNumberToLocale, today } from "../../utils";
import { useApi } from "../../hooks";
import PaymentType from "../PaymentType";
import ExpenseRow from "../ExpenseRow";
import ProFormInput from "../ProFormInput";

const PaymentRow = ({
  control,
  form,
  checked,
  setChecked,
  tenant,
  currencies,
  getValues,
  setValue,
  watch,
  typeOfPayment = undefined,
  setTypeOfPayment,
  date,
  expenses = [],
  setExpenses = () => {},
  selectedBusinesUnit,
  disabled,
  fromInvoice = false,
  fromTransfer = false,
}) => {
  const [workers, setWorkers] = useState([]);
  const [cashboxes, setCashboxes] = useState([]);
  const [expenseCatalogs, setExpenseCatalogs] = useState([]);
  const [productionInvoices, setProductionInvoices] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [salesInvoices, setSalesInvoices] = useState([]);
  const [currencyCode, setCurrencyCode] = useState(undefined);
  const [element, setElement] = useState(0);
  const [isDisabled, setDisabled] = useState(true);

  useEffect(() => {
    if (checked) {
      runWorkers({
        lastEmployeeActivityType: 1,
        businessUnitIds: selectedBusinesUnit
          ? [selectedBusinesUnit]
          : undefined,
      });
      runExpenseCatalogs({ isActive: 1 });
    }
  }, [checked]);

  useEffect(() => {
    if (checked) {
      setCashboxes([]);
      if (typeOfPayment) {
        runCashboxes({
          filter: {
            page: 1,
            limit: 20,
            dateTime: date,
            businessUnitIds: selectedBusinesUnit
              ? [selectedBusinesUnit]
              : undefined,
          },
          apiEnd: typeOfPayment,
        });
      }
    }
  }, [typeOfPayment, checked]);

  const { isLoading: isLoadExpenseCatalogs, run: runExpenseCatalogs } = useApi({
    deferFn: getExpenseCatalogs,
    onResolve: (data) => {
      setExpenseCatalogs(data);
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

  const handleCheckbox = (checked) => {
    if (checked) {
      setChecked(true);
    } else {
      setChecked(false);
    }
  };

  const changeTypeOfPayment = (e, edit = false) => {
    setTypeOfPayment(e);
    setValue("paymentAccount", edit || undefined);
  };

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

  useEffect(() => {
    if (checked) {
      if (getValues("paymentExpenseType") === undefined) {
        setValue('paymentExpenseType', 2)
        setValue("paymentContract", { ...tenant, id: 0 }.id);
      }
      if (getValues("paymentExpenseType") === 1) {
        setValue(
          "paymentContract",
          productionArr.length === 1 ? productionArr[0].id : undefined
        );
      } else if (getValues("paymentExpenseType") === 0) {
        setValue(
          "paymentContract",
          contractsArr.length === 1 ? contractsArr[0].id : undefined
        );
      }
    }
  }, [checked, watch("paymentExpenseType")]);

  return (
    <View>
      <View
        style={{
          display: "flex",
          flexDirection: "row",
          marginBottom: 15,
        }}
      >
        <Text style={{ marginRight: 5 }}>
          {fromInvoice ? "Xərcə bağla" : "Maliyyə xərcinə bağla"}
        </Text>
        <Checkbox
          onValueChange={(event) => handleCheckbox(event)}
          value={checked}
          style={{ marginLeft: "8px" }}
        />
      </View>
      {checked ? (
        <View style={{ display:'flex', gap:10 }}>  
          <ProAsyncSelect
            label="Əməkdaş"
            data={workers}
            setData={setWorkers}
            fetchData={fetchWorkers}
            filter={{
              lastEmployeeActivityType: 1,
              businessUnitIds: selectedBusinesUnit
                ? [selectedBusinesUnit]
                : undefined,
            }}
            async={false}
            control={control}
            required
            name="paymentEmployee"
          />
          {fromInvoice ? null : (
            <>
              <PaymentType
                typeOfPayment={typeOfPayment}
                changeTypeOfPayment={changeTypeOfPayment}
              />

              <ProAsyncSelect
                label="Hesab"
                data={cashboxes.map((cashbox) => ({
                  id: cashbox.id,
                  value: cashbox.id,
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
                filter={{
                  limit: 20,
                  page: 1,
                  businessUnitIds: selectedBusinesUnit
                    ? [selectedBusinesUnit]
                    : undefined,
                  dateTime: date,
                }}
                apiEnd={typeOfPayment}
                async={true}
                required={true}
                control={control}
                name="paymentAccount"
                // handleSelectValue={(id) => {
                //   handleAccountBalance(id);
                // }}
              />
            </>
          )}

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
              name="paymentExpenseType"
              handleSelectValue={(id) => {
                ContractFn(id);
                setElement(id);
              }}
            />

            {watch("paymentExpenseType") === 2 ? (
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
                name="paymentContract"
              />
            ) : watch("paymentExpenseType") === 1 ? (
              <ProAsyncSelect
                width="62%"
                disabled={false}
                label="Xərc mərkəzi"
                data={productionArr}
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
                name="paymentContract"
              />
            ) : watch("paymentExpenseType") === 3 ? (
              <ProAsyncSelect
                width="62%"
                label="Xərc mərkəzi"
                data={salesInvoicesArr}
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
                name="paymentContract"
              />
            ) : (
              <ProAsyncSelect
                width="62%"
                label="Xərc mərkəzi"
                data={contractsArr}
                setData={setContracts}
                fetchData={getContracts}
                async
                filter={{ page: 1, limit: 20, status: 1, endDateFrom: today }}
                required
                control={control}
                allowClear={false}
                name="paymentContract"
              />
            )}
          </View>
          <View>
            {!fromInvoice && (
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
                name="paymentCurrency"
                width="27%"
                // handleSelectValue={(id) => {
                //   handleCurrencyChange(id);
                // }}
              />
            )}
          </View>
          {fromInvoice ? (
            <View>
              <View style={{ flexDirection: "row", gap: 10 }}>
                <ProAsyncSelect
                  width="45%"
                  label="Əməliyyatın kateqoriyası"
                  data={expenseCatalogs?.root
                    ?.filter(({ type }) => type !== 6)
                    ?.map((item) => ({
                      ...item,
                      label: item.name,
                      value: item.id,
                    }))}
                  setData={() => {}}
                  fetchData={() => {}}
                  async={false}
                  filter={{}}
                  required
                  disabled={disabled}
                  control={control}
                  allowClear={false}
                  name="catalog"
                  handleSelectValue={(id) => {
                    setDisabled(false);
                    setValue("subCatalog", undefined);
                  }}
                />
                <ProAsyncSelect
                  width="50%"
                  label="Əməliyyatın alt kateqoriyası"
                  data={
                    expenseCatalogs?.children
                      ? expenseCatalogs.children[watch(`catalog`)]?.map(
                          (item) => ({
                            ...item,
                            label: item.name,
                            value: item.id,
                          })
                        )
                      : []
                  }
                  setData={() => {}}
                  fetchData={() => {}}
                  async={false}
                  filter={{}}
                  required
                  disabled={disabled || isDisabled}
                  control={control}
                  allowClear={false}
                  name="subCatalog"
                />
              </View>
              <View
                style={{
                  flexDirection: "row",
                  gap: 10,
                  alignItems: "flex-end",
                }}
              >
                <ProFormInput
                  label="Məbləğ"
                  required
                  name="amount"
                  control={control}
                  width="80%"
                  keyboardType="numeric"
                  disabled={disabled || fromInvoice}
                  // handleChange={(val) => {
                  //   handleExpenseChange(val);
                  // }}
                />
              </View>
            </View>
          ) : (
            expenses.map((expense, index) => (
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
                fromTransfer={fromTransfer}
                watch={watch}
              />
            ))
          )}
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  buttonStyle: {
    borderWidth: 1,
    borderRadius: 30,
    borderColor: "#d9d9d9",
  },
});

export default PaymentRow;
