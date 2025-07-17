/* eslint-disable react-hooks/exhaustive-deps */
import React from "react";
import { AntDesign } from "@expo/vector-icons";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import math from "exact-math";
import { roundToDown } from "../../../utils";

const ReceivablesPayables = (props) => {
  const { loadingCalc, payables, receivables, editId, operationsList, counterparty } = props;

  return loadingCalc ? (
    <ActivityIndicator color={"gray"} />
  ) : (
    <View style={styles.receivablesPayablesBox}>
      <View style={styles.payables}>
        <AntDesign name="pluscircle" size={14} color="#55ab80" />
        <Text style={{ ...styles.result, ...styles.payableColor }}>
          {Object.keys(receivables).length !== 0
            ? Object.keys(receivables).map(item =>
                  editId &&
                  operationsList[0]?.operationDirectionId ===
                      1 &&
                  operationsList[0]?.invoiceCurrencyCode ===
                      item &&
                  operationsList[0]?.contactId === counterparty
                      ? `${roundToDown(
                            math.sub(
                                Number(
                                    math.add(
                                        Number(
                                            receivables[item]
                                        ),
                                        Number(
                                            operationsList[0]
                                                ?.invoicePaymentAmountConvertedToInvoiceCurrency
                                        )
                                    )
                                ),
                                Number(
                                    operationsList[0]
                                        ?.creditAmount || 0
                                ),
                                Number(
                                    operationsList[0]
                                        ?.depositAmount || 0
                                )
                            ), 2
                        )} ${item}, `
                      : `${roundToDown(
                            receivables[item], 2
                        )} ${item}, `
              )
            : '0 '}
          Debitor Borclar{" "}
        </Text>
      </View>
      <View style={styles.receivables}>
        <AntDesign name="minuscircle" size={14} color="#f81818" />
        <Text style={{ ...styles.result, ...styles.receivablesColor }}>
          {Object.keys(payables).length !== 0
            ? Object.keys(payables).map(item =>
                  editId &&
                  operationsList[0]?.operationDirectionId ===
                      -1 &&
                  operationsList[0]?.invoiceCurrencyCode ===
                      item &&
                  operationsList[0]?.contactId === counterparty
                      ? `${roundToDown(
                            math.sub(
                                Number(
                                    math.add(
                                        Number(payables[item]),
                                        Number(
                                            operationsList[0]
                                                ?.invoicePaymentAmountConvertedToInvoiceCurrency
                                        )
                                    )
                                ),
                                Number(
                                    operationsList[0]
                                        ?.creditAmount || 0
                                ),
                                Number(
                                    operationsList[0]
                                        ?.depositAmount || 0
                                )
                            ), 2
                        )} ${item}, `
                      : `${roundToDown(
                            payables[item], 2
                        )} ${item}, `
              )
            : '0 '} {" "}
          Kreditor Borclar
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  receivablesPayablesBox: {
    display: "flex",
  },
  result: {
    fontWeight: "bold",
  },
  payableColor: {
    color: "#55ab80",
  },
  receivablesColor: {
    color: "#f81818",
  },
  payables: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    color: "#55ab80",
    gap: 5,
  },
  receivables: {
    display: "flex",
    gap: 5,
    flexDirection: "row",
    alignItems: "center",
    color: "#f81818",
  },
});

export default ReceivablesPayables;
