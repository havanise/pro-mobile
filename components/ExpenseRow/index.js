import React, { useEffect, useState } from "react";
import ProFormInput from "../ProFormInput";
import ProAsyncSelect from "../ProAsyncSelect";

import { AntDesign } from "@expo/vector-icons";
import ProButton from "../ProButton";
import { Platform, View } from "react-native";
import { changeNumber } from "../../utils/constants";

const re = /^[0-9]{1,9}\.?[0-9]{0,2}$/;
const ExpenseRow = (props) => {
  const {
    control,
    setValue,
    getValues,
    watch,
    index,
    handleAddExpenseClick,
    expenseCatalogs,
    disabled,
    currencyCode,
    handleExpenseChange,
    fromInvoice = false,
    fromTransfer = false,
    plusDisabled=false
  } = props;

  const [amounts, setAmounts] = useState(null);
  const [isDisabled, setDisabled] = useState(true);

  const subcatalogs = expenseCatalogs?.children
    ? expenseCatalogs.children[getValues(`expenses[${index}].catalog`)]?.map(
        (item) => ({
          ...item,
          label: item.name,
          value: item.id,
        })
      )
    : null;

  const catalogs = fromTransfer
    ? expenseCatalogs?.root
        ?.filter(({ type }) => type === 3)
        ?.map((item) => ({
          ...item,
          label: item.name,
          value: item.id,
        }))
    : expenseCatalogs?.root
        ?.filter(({ type }) => type !== 6)
        ?.map((item) => ({
          ...item,
          label: item.name,
          value: item.id,
        }));

  useEffect(() => {
    if(watch(`expenses[${index}].catalog`)) {
      setDisabled(false)
    }
    
  }, [watch(`expenses[${index}].catalog`)]);

  useEffect(() => {
    if (catalogs && catalogs.length === 1) {
      setValue(`expenses[${index}].catalog`, catalogs[0].id);
    }
    if (subcatalogs && subcatalogs.length === 1) {
      setValue(`expenses[${index}].subCatalog`, subcatalogs[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    getValues(`expenses[${index}].catalog`),
    expenseCatalogs?.root,
    subcatalogs,
  ]);

  return (
    <View style={{ display: 'flex', gap: 10}}>
        <ProAsyncSelect
          label="Əməliyyatın kateqoriyası"
          data={
            fromTransfer
              ? expenseCatalogs?.root
                  ?.filter(({ type }) => type === 3)
                  ?.map((item) => ({
                    ...item,
                    label: item.name,
                    value: item.id,
                  }))
              : expenseCatalogs?.root
                  ?.filter(({ type }) => type !== 6)
                  ?.map((item) => ({
                    ...item,
                    label: item.name,
                    value: item.id,
                  }))
          }
          setData={() => {}}
          fetchData={() => {}}
          async={false}
          filter={{}}
          required
          disabled={disabled}
          control={control}
          allowClear={false}
          name={`expenses[${index}].catalog`}
          handleSelectValue={(id) => {
            setDisabled(false);
            setValue(
              "expenses",
              getValues("expenses")?.map((expense, expenseIndex) =>
                expenseIndex === index
                  ? {
                      ...expense,
                      subCatalog: undefined,
                    }
                  : expense
              )
            );
          }}
        />
        <ProAsyncSelect
          label="Əməliyyatın alt kateqoriyası"
          data={
            expenseCatalogs?.children
              ? expenseCatalogs.children[
                  watch(`expenses[${index}].catalog`)
                ]?.map((item) => ({
                  ...item,
                  label: item.name,
                  value: item.id,
                }))
              : []
          }
          setData={() => {}}
          fetchData={() => {}}
          async={false}
          filter={{}}
          required
          disabled={isDisabled || disabled}
          control={control}
          allowClear={false}
          name={`expenses[${index}].subCatalog`}
        />
      <View style={{ flexDirection: "row", gap: 10, alignItems: "flex-end" }}>
        <ProFormInput
          label="Məbləğ"
          required
          name={`expenses[${index}].amount`}
          control={control}
          width="80%"
          keyboardType="numeric"
          disabled={disabled || fromInvoice}
          handleChange={(val) => {
            let newVal = Platform.OS === 'ios'? changeNumber(val) : val
            handleExpenseChange(newVal, index);
            if (Platform.OS === 'ios') {
              setValue(`expenses[${index}].amount`, newVal);
            }
          }}
          suffix={currencyCode}
        />

        {!fromInvoice && !plusDisabled &&
          (index === 0 ? (
            <ProButton
              label={<AntDesign name="pluscircle" size={30} color="black" />}
              type="transparent"
              flex={false}
              onClick={() => handleAddExpenseClick("add", index)}
            />
          ) : (
            <ProButton
              label={
                <AntDesign name="minuscircle" size={30} color="#FF716A" />
              }
              type="transparent"
              flex={false}
              onClick={() => handleAddExpenseClick("remove", index)}
              disabled={disabled}
            />
          ))}
      </View>
    </View>
  );
};

export default ExpenseRow;
