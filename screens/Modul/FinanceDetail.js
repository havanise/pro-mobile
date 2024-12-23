/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Modal,
  Pressable,
  Text,
  ScrollView,
} from "react-native";
import { Divider } from "react-native-paper";
import { AntDesign } from "@expo/vector-icons";

import math from "exact-math";
import { ProText } from "../../components";
import { defaultNumberFormat, formatNumberToLocale } from "../../utils";

const Show = ({ title, subtitle, type, subClassName, barterInvoices }) => {
  return (
    <View style={{ marginBottom: 16 }}>
      <View style={styles.showBox}>
        <Text style={styles.label}>{title}</Text>
        {type == 23 ? (
          barterInvoices?.map((inv) => (
            <Text style={subClassName || styles.subtitle}>
              {inv.invoiceNumber || "-"}
            </Text>
          ))
        ) : (
          <Text style={subClassName || styles.subtitle}>{subtitle || "-"}</Text>
        )}
      </View>
    </View>
  );
};

const FinanceDetail = ({
  isVisible,
  handleModal,
  allBusinessUnits,
  profile,
  tenant,
  data,
  isDeletedForLog,
  isLog,
  isLogTransfer,
  mainCurrency,
  barterInvoices,
}) => {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={() => {
        handleModal(false);
      }}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <ProText
            variant="heading"
            style={{ color: "black", marginBottom: 20 }}
          >
            Ətraflı - {data.documentNumber}
          </ProText>
          <ScrollView>
            {allBusinessUnits?.length > 1 &&
            profile?.businessUnits?.length !== 1 ? (
              <Show
                title="Biznes blok"
                subtitle={
                  data.businessUnitName === null
                    ? tenant?.name
                    : data.businessUnitName
                }
              />
            ) : null}
            <Show
              title={isLogTransfer ? "Göndərən hesab" : "Hesab"}
              subtitle={data.cashboxName}
            />
            <Show
              title="Əməliyyat növü"
              subtitle={
                data.operationDirectionName === "Cash out"
                  ? "Məxaric"
                  : data.operationDirectionName === "Cash in"
                  ? "Mədaxil"
                  : "Balans"
              }
            />
            {isLogTransfer ? (
              <Show title="Qəbul edən hesab" subtitle={data.toCashboxName} />
            ) : null}
            <Show
              subClassName={
                data.status === "deleted"
                  ? styles.subtitleRed
                  : styles.subtitleGreen
              }
              title="Ödəniş statusu"
              subtitle={
                data.status === "active" || isDeletedForLog
                  ? "aktiv"
                  : data.status === "deleted"
                  ? "silinib"
                  : "-"
              }
            />
            <Show
              title="Xərc mərkəzi"
              subtitle={
                data.contractNo === null &&
                (data.contractSerialNumber === null ||
                  data.contractSerialNumber === "")
                  ? data.transactionType === 8 || data.transactionType === 6
                    ? data.paymentInvoiceId === null
                      ? tenant?.name
                      : data.paymentInvoiceInvoiceNumber
                    : data.transactionType === 9
                    ? data.invoiceType !== 1
                      ? "-"
                      : data.transactionCatalogId !== null
                      ? data.paymentInvoiceId === null
                        ? tenant?.name
                        : data.paymentInvoiceInvoiceNumber
                      : "-"
                    : "-"
                  : data.contractNo || data.contractSerialNumber
              }
            />
            <Show
              title="Kateqoriya"
              subtitle={
                data.transactionType === 14 ? "İlkin qalıq" : data.categoryName
              }
            />
            <Show title="İcra tarixi" subtitle={data.createdAt} />
            <Show
              title="Alt Kateqoriya"
              subtitle={data.subCategoryName}
              type={data.transactionType}
              barterInvoices={barterInvoices}
            />
            <Show title="Əməliyyat tarixi" subtitle={data.dateOfTransaction} />
            <Show title="Qarşı tərəf" subtitle={data.contactOrEmployee} />
            <Show
              title="Məsul şəxs"
              subtitle={`${data.createdByName} ${data.createdByLastname || ""}`}
            />
            <Show
              subClassName={
                data.operationDirectionName === "Cash out" && styles.subtitleRed
              }
              title={isLog ? "İlkin məbləğ" : "Məbləğ"}
              subtitle={
                <>
                  {data?.transactionType == 23
                    ? "-"
                    : data.operationDirectionName === "Cash out"
                    ? isLog
                      ? `-${parseFloat(data.amount).toFixed(2)} ${
                          data.currencyCode
                        }`
                      : `-${
                          Number(data.amount) < 0.01
                            ? formatNumberToLocale(
                                defaultNumberFormat(data.amount)
                              )
                            : parseFloat(data.amount).toFixed(2)
                        }`
                    : isLog
                    ? `${parseFloat(data.amount).toFixed(2)} ${
                        data.currencyCode
                      }`
                    : Number(data.amount) < 0.01
                    ? formatNumberToLocale(defaultNumberFormat(data.amount))
                    : parseFloat(data.amount).toFixed(2)}
                </>
              }
            />
            {data.transactionType === 9 && data.creditId !== null && (
              <>
                <Show
                  title="Əsas borc ödənişi"
                  subtitle={`${parseFloat(
                    math.sub(
                      Number(data.amount),
                      math.add(
                        Number(data.creditAmount),
                        Number(data.depositAmount)
                      )
                    )
                  ).toFixed(2)} ${data.currencyCode}`}
                />
                <Show
                  title="Faiz ödənişi"
                  subtitle={`${parseFloat(data.creditAmount || 0).toFixed(2)} ${
                    data.currencyCode
                  }`}
                />
                <Show
                  title="Depozit ödənişi"
                  subtitle={`${parseFloat(data.depositAmount || 0).toFixed(
                    2
                  )} ${data.currencyCode}`}
                />
              </>
            )}
            {data.status === "deleted" && !isDeletedForLog && (
              <Show title="Silinmə tarixi" subtitle={data.deletedAt || "-"} />
            )}
            {isLog ? (
              <Show
                title="Çevrilmiş məbləğ"
                subtitle={`${parseFloat(data.toAmount).toFixed(2)} ${
                  data.toCurrency
                }`}
              />
            ) : (
              <Show
                title="Valyuta"
                subtitle={
                  data?.transactionType == 23
                    ? mainCurrency?.code
                    : data.currencyCode
                }
              />
            )}
            {data.status === "deleted" && !isDeletedForLog && (
              <Show
                title="Silinib"
                subtitle={`${data.deletedByName || "-"} ${
                  data.deletedByLastname || "-"
                }`}
              />
            )}
            <Show
              title="Məzənnə"
              subtitle={
                data?.transactionType == 23
                  ? "1.00"
                  : data.invoicePaymentCustomRate !== null
                  ? parseFloat(data.invoicePaymentCustomRate).toFixed(2)
                  : data.exchangeRate !== null
                  ? parseFloat(data.exchangeRate).toFixed(2)
                  : "-"
              }
            />
            {data.status === "deleted" && !isDeletedForLog && (
              <Show
                title="Silinmə səbəbi"
                subtitle={
                  data.deletionReason === "undefined"
                    ? "-"
                    : data.deletionReason
                }
              />
            )}
            <Show title="Ödəniş növü" subtitle={data.paymentTypeName} />

            <Divider />

            <Show title="Əlavə məlumat" subtitle={data.description || "-"} />
          </ScrollView>

          <Pressable style={[styles.button]} onPress={() => handleModal(false)}>
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
    marginTop: 22,
  },
  modalView: {
    width: "90%",
    height: "80%",
    padding: 30,
    margin: 20,
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
    borderColor: "transparent",
  },
  showBox: {
    display: "flex",
    flexDirection: "column",
  },

  label: {
    fontSize: 13,
    marginBottom: "5px",
    color: "rgba(0, 0, 0, 0.67)",
  },

  subtitle: {
    fontSize: 16,
    color: "#000",
  },
  subtitleRed: {
    fontSize: 16,
    color: "#f81818",
  },

  subtitleGreen: {
    fontSize: 16,
    color: "#55ab80",
  },
});

export default FinanceDetail;
