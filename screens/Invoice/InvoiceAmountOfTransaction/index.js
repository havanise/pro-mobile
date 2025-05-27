/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
} from "react-native";
import BigNumber from "bignumber.js";
import { AntDesign } from "@expo/vector-icons";
import { roundTo, roundToDown, roundToUp } from "../../../utils";
import { ProButton } from "../../../components";

export function InvoiceAmountOfTransaction({
  amount,
  invoiceData,
  convertLoading,
  setInvoiceData,
  amountToDelete,
  setAmountToDelete,
  currentRate = undefined,
  setAmountChanged,
  sameCurrencies = false,
  selectedCurrency,
  setFieldsValue,
  debt,
  amountChanged,
  advanceAmount,
  setAdvanceAmount,
  editId,
}) {
  const [editable, setEditable] = useState(false);
  const math = require("exact-math");
  const re = /^[0-9]{1,9}\.?[0-9]{0,4}$/;
  const [defaultRate, setDefaultRate] = useState(undefined);

  useEffect(() => {
    if (amount && debt) {
      // Ensure all values are valid numbers
      const amountInMainCurrency = roundTo(
        Number(
          new BigNumber(
            sameCurrencies ? 1 : invoiceData.rate || 1
          ).multipliedBy(amount)
        ) || 0,
        2
      );
      const outstandingDebt = Number(debt) || 0;
      const rate = Number(invoiceData.rate) || 1;

      if (
        isNaN(amountInMainCurrency) ||
        isNaN(outstandingDebt) ||
        isNaN(rate)
      ) {
        // console.error('Invalid inputs:', { amountInMainCurrency, outstandingDebt, rate });
        return;
      }

      // Calculate advance amount
      setAdvanceAmount(
        editId && !amountChanged
          ? 0
          : sameCurrencies
          ? amountInMainCurrency - outstandingDebt
          : roundToUp(
              new BigNumber(amountInMainCurrency - outstandingDebt).toNumber(),
              2
            )
      );
    }
  }, [debt, invoiceData]);

  useEffect(() => {
    if (defaultRate === undefined) {
      setDefaultRate(invoiceData.rate || 1);
    } else if (currentRate) {
      setDefaultRate(currentRate);
    }
  }, [defaultRate, currentRate]);

  useEffect(() => {
    if (amount) {
      if (editable) {
        setInvoiceData({
          ...invoiceData,
          rate: sameCurrencies
            ? 1
            : Number(
                new BigNumber(Number(amountToDelete || 0)).dividedBy(
                  Number(amount || 0)
                )
              ),
        });
      } else {
        // Calculate the corrected amount based on the provided rate and amount
        const correctedAmountValue = roundToUp(
          new BigNumber(amount || 0)
            .multipliedBy(new BigNumber(invoiceData.rate || 1))
            .toNumber(),
          2
        );

        // Determine the remaining amount after subtracting the debt
        const remainedAmount = correctedAmountValue - Number(debt);
        const isDebtCovered = remainedAmount >= 0;

        // Calculate the advance amount in the invoice currency, if applicable
        const advanceAmount = roundToDown(
          new BigNumber(remainedAmount).toNumber(),
          2
        );

        // Update state with the calculated values
        setAmountToDelete(
          (!amountChanged && editId) || sameCurrencies
            ? Number(amount)
            : correctedAmountValue
        );
        setAdvanceAmount(
          isDebtCovered ? (sameCurrencies ? remainedAmount : advanceAmount) : 0
        );
      }
    }
  }, [amount]);

  const handleAmountToDeleteInput = (e) => {
    if (re.test(e || 0)) {
      setAmountToDelete(e);

      setInvoiceData({
        ...invoiceData,
        rate: sameCurrencies
          ? 1
          : Number(
              new BigNumber(Number(e || 0)).dividedBy(Number(amount || 0))
            ),
      });
      setAmountChanged(true);
    }
  };

  return (
    <View>
      {invoiceData.invoice && (
        <View>
          <View style={{ flexDirection: "row" }}>
            <Text style={{ fontWeight: "bold" }}>Məzənnə </Text>
            <>
              <Text
                style={{
                  minWidth: "6ch",
                  color: "#4cae4c",
                  fontSize: 15,
                  fontWeight: "bold",
                }}
              >
                {convertLoading ? (
                  <ActivityIndicator color={"#37B874"} />
                ) : (
                  Number(sameCurrencies ? 1 : invoiceData.rate || 1).toFixed(5)
                )}
              </Text>
            </>
          </View>
          <View
            style={{
              display: "flex",
              flexDirection: "column",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text style={{ fontWeight: "bold" }}>
                Silinəcək məbləğ, {invoiceData.invoice?.currencyCode}{" "}
              </Text>
              {editable === true ? (
                <>
                  <TextInput
                    value={amountToDelete}
                    keyboardType="numeric"
                    onChangeText={(event) => {
                      handleAmountToDeleteInput(event);
                    }}
                    style={{
                      width: 130,
                      height: 40,
                      borderWidth: 1,
                      borderRadius: 5,
                      borderColor: "#D0DBEA",
                    }}
                  />
                  <TouchableOpacity
                    onPress={() => {
                      setFieldsValue(
                        "paymentAmount",
                        roundToDown(
                          math.div(
                            Number(debt),
                            Number(selectedCurrency?.rate || 1)
                          ),
                          2
                        )
                      );

                      setInvoiceData({
                        ...invoiceData,
                        rate: Number(selectedCurrency?.rate),
                      });

                      setAdvanceAmount(0);
                      setAmountToDelete(Number(debt));
                      setEditable(false);
                    }}
                  >
                    <ProButton
                      label={
                        <AntDesign name="reload1" size={20} color="black" />
                      }
                      type="transparent"
                      flex={false}
                    />
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text
                    style={{
                      color: "#f5222d",
                      fontSize: 15,
                      fontWeight: "bold",
                    }}
                  >
                    {amountToDelete}
                  </Text>
                  {!sameCurrencies ? (
                    <TouchableOpacity
                      onPress={() => {
                        setEditable(true);
                      }}
                    >
                      <ProButton
                        label={
                          <AntDesign name="edit" size={20} color="black" />
                        }
                        type="transparent"
                        flex={false}
                        padding={"0px"}
                      />
                    </TouchableOpacity>
                  ) : null}
                </>
              )}
            </View>

            <View style={{ flexDirection: "row" }}>
              <Text style={{ fontWeight: "bold" }}>
                Avans, {invoiceData.invoice?.currencyCode}{" "}
              </Text>
              <Text
                style={{
                  color: "#f5222d",
                  fontSize: 15,
                }}
              >
                {!editable
                  ? advanceAmount >= 0
                    ? advanceAmount
                    : 0
                  : !amountChanged
                  ? 0
                  : advanceAmount >= 0
                  ? advanceAmount
                  : 0}
              </Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}
