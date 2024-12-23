/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import Entypo from "@expo/vector-icons/Entypo";
import { ProText } from "../../../components";
import {
  defaultNumberFormat,
  formatNumberToLocale,
  roundToDown,
} from "../../../utils";

import math from "exact-math";

const MoreSaleDetail = ({ details, allBusinessUnits, profile }) => {
  const {
    amount,
    agentName,
    agentSurname,
    operatorName,
    operatorLastname,
    operationDate,
    createdAt,
    deletedAt,
    deleted_by_lastname,
    deleted_by_name,
    isDeleted,
    counterparty,
    contractNo,
    contractId,
    attachedInvoice,
    companyName,
    attachedInvoiceNumber,
    totalPaymentsAmountConvertedToMainCurrency,
    totalSalariesAmountConvertedToMainCurrency,
    totalRemoveInvoicesAmountConvertedToMainCurrency,
    contractSerialNumber,
    invoiceNumber,
    recieved,
    paidAmount,
    currencyCode,
    discount,
    discountAmount,
    taxCurrencyCode,
    taxAmount,
    endPrice,
    mainCurrencyCode,
    endPriceInMainCurrency,
    endPriceAmountWithTax,
    totalRoadTaxAmount,
    salesmanName,
    salesmanLastName,
    description,
    statusOfOperation,
    invoiceType,
    paymentStatus,
    stockFromName,
    stockToName,
    businessUnitId,
    stockName,
    draftType,
    statusName,
    statusColor,
    stockStatusNumber,
    PermissionsForStatus,
    invoiceProducts,
    amountInWords,
  } = details;

  const [collapse, setCollapse] = useState(true);

  const getStatusType = (statusOfOperation) =>
    statusOfOperation === 1 ? (
      <Text
        style={{
          color: "#F3B753",
          background: "#FDF7EA",
          textAlign: "center",
        }}
      >
        Aktiv
      </Text>
    ) : statusOfOperation === 2 ? (
      <Text
        style={{
          color: "#B16FE4",
          background: "#F6EEFC",
          textAlign: "center",
        }}
      >
        Qaralama
      </Text>
    ) : (
      <Text
        style={{
          color: "#C4C4C4",
          background: "#F8F8F8",
          textAlign: "center",
        }}
      >
        Silinib
      </Text>
    );

  return (
    <ScrollView>
      <View style={{ marginTop: 20 }}>
        <ProText variant="heading" style={{ color: "black" }}>
          {counterparty}
        </ProText>
        {allBusinessUnits?.length > 1 &&
        profile?.businessUnits?.length !== 1 ? (
          <View style={styles.row}>
            <Text style={styles.text}>Biznes blok</Text>
            <Text>
              {allBusinessUnits?.find(({ id }) => id === businessUnitId)?.name}
            </Text>
          </View>
        ) : null}
        <View style={styles.row}>
          <Text style={styles.text}>Əlavə olunub</Text>
          <Text>{`${operatorName || "-"} ${operatorLastname || "-"}`}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.text}>İcra tarixi</Text>
          <Text>
            {createdAt?.replace(/(\d{4})-(\d\d)-(\d\d)/, "$3-$2-$1") || "-"}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.text}>Əməliyyatın tarixi</Text>
          <Text>{operationDate?.split("  ") || "-"}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.text}>Əməliyyatın statusu</Text>
          <Text>{getStatusType(statusOfOperation)}</Text>
        </View>
        {isDeleted && (
          <>
            <View style={styles.row}>
              <Text style={styles.text}>Silinib</Text>
              <Text>{`${deleted_by_name} ${deleted_by_lastname}`}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.text}>Silinmə tarixi</Text>
              <Text>{deletedAt}</Text>
            </View>
          </>
        )}

        <View style={styles.row}>
          <Text style={styles.text}>Əməliyyat növü</Text>
          <Text>
            {invoiceType === 1
              ? "Alış"
              : invoiceType === 2
              ? "Satış"
              : invoiceType === 3
              ? "Geri alma"
              : invoiceType === 4
              ? "Geri qaytarma"
              : invoiceType === 5
              ? "Transfer"
              : invoiceType === 6
              ? "Silinmə"
              : invoiceType === 10
              ? "İdxal alışı"
              : invoiceType === 11
              ? "İstehsalat"
              : invoiceType === 15
              ? "Azaltma"
              : invoiceType === 14
              ? "Artırma"
              : invoiceType === 16
              ? "Konsiqnasiyaya vermə"
              : invoiceType === 17
              ? "Konsiqnasiyadan gerialma"
              : invoiceType === 18
              ? "Təklif"
              : invoiceType === 19
              ? "Anbara göndərmə"
              : "Qaralama"}
          </Text>
        </View>
        {invoiceType === 19 ? null : (
          <>
            <View style={styles.row}>
              <Text style={styles.text}>Qarşı tərəf</Text>
              <Text>{counterparty || "-"}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.text}>Müqavilə</Text>
              <Text>{contractNo || contractSerialNumber || "-"}</Text>
            </View>
          </>
        )}
        {invoiceType === 5 || draftType === 5 ? (
          <>
            <View style={styles.row}>
              <Text style={styles.text}>Anbar(Haradan)</Text>
              <Text>{stockFromName || "-"}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.text}>Anbar(Haraya)</Text>
              <Text>{stockToName || "-"}</Text>
            </View>
          </>
        ) : (
          <View style={styles.row}>
            <Text style={styles.text}>Anbar</Text>
            <Text>{stockName || "-"}</Text>
          </View>
        )}
        <View style={styles.row}>
          <Text style={styles.text}>Qaimə</Text>
          <Text>{invoiceNumber || "-"}</Text>
        </View>
        {invoiceType === 19 ? (
          <View style={styles.row}>
            <Text style={styles.text}>İstehsalat tapşırığı</Text>
            <Text>{attachedInvoiceNumber}</Text>
          </View>
        ) : null}

        {invoiceType === 14 && (
          <View style={styles.row}>
            <Text style={styles.text}>Məhsulların dəyəri</Text>
            <Text>
              {`${formatNumberToLocale(
                defaultNumberFormat(amount)
              )} ${currencyCode}` || "-"}
            </Text>
          </View>
        )}
        {invoiceType === 19 ? null : (
          <>
            <View style={styles.row}>
              <Text style={styles.text}>Ödəniş statusu</Text>
              <Text>
                {isDeleted === true || statusOfOperation === 2 ? (
                  "-"
                ) : paymentStatus === 3 && Number(endPrice) > 0 ? (
                  <Text
                    style={{
                      color: "#55AB80",
                      background: "#EBF5F0",
                    }}
                  >
                    Ödənilib
                  </Text>
                ) : paymentStatus === 1 ? (
                  <Text
                    style={{
                      color: "#4E9CDF",
                      background: "#EAF3FB",
                    }}
                  >
                    Açıq
                  </Text>
                ) : paymentStatus === 2 ? (
                  <Text
                    style={{
                      color: "#F3B753",
                      background: "#FDF7EA",
                    }}
                  >
                    Qismən ödənilib
                  </Text>
                ) : (
                  "-"
                )}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.text}>Ödənilməlidir</Text>
              <Text>
                {invoiceType === 5 ||
                invoiceType === 6 ||
                draftType === 5 ||
                draftType === 6
                  ? "-"
                  : `${formatNumberToLocale(
                      defaultNumberFormat(
                        Number(endPrice) - Number(paidAmount || 0)
                      )
                    )} ${currencyCode}`}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.text}>Məbləğ</Text>
              <Text>
                {invoiceType === 5 ||
                invoiceType === 6 ||
                draftType === 5 ||
                draftType === 6
                  ? "-"
                  : amount
                  ? `${formatNumberToLocale(
                      defaultNumberFormat(amount)
                    )} ${currencyCode}`
                  : "-"}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.text}>{`Endirim(${
                formatNumberToLocale(
                  defaultNumberFormat(
                    roundToDown(
                      math.div(
                        math.mul(Number(discountAmount || 0) || 0, 100),
                        amount || 0
                      ),
                      4
                    )
                  )
                ) || ""
              }%)`}</Text>
              <Text>
                {discountAmount
                  ? `${formatNumberToLocale(
                      defaultNumberFormat(discountAmount)
                    )} ${currencyCode}`
                  : "-"}
              </Text>
            </View>
            {invoiceType === 10 || Number(endPrice) === 0 ? null : (
              <View style={styles.row}>
                <Text style={styles.text}>
                  {`Vergi(${
                    formatNumberToLocale(
                      defaultNumberFormat(
                        roundToDown(
                          math.div(
                            math.mul(Number(taxAmount || 0) || 0, 100),
                            endPrice || 0
                          ),
                          4
                        )
                      )
                    ) || ""
                  }%)`}
                </Text>
                <Text>
                  {taxAmount
                    ? `${formatNumberToLocale(
                        defaultNumberFormat(taxAmount)
                      )} ${taxCurrencyCode}`
                    : "-"}
                </Text>
              </View>
            )}
            <View style={styles.row}>
              <Text style={styles.text}>Son qiymət</Text>
              <Text>
                {invoiceType === 5 ||
                invoiceType === 6 ||
                draftType === 5 ||
                draftType === 6
                  ? "-"
                  : `${formatNumberToLocale(defaultNumberFormat(endPrice))} ${
                      currencyCode || ""
                    }`}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.text}>{`Son qiymət (${
                mainCurrencyCode || ""
              })`}</Text>
              <Text>
                {invoiceType === 5 ||
                invoiceType === 6 ||
                draftType === 5 ||
                draftType === 6
                  ? "-"
                  : `${formatNumberToLocale(
                      defaultNumberFormat(endPriceInMainCurrency)
                    )} ${mainCurrencyCode || currencyCode}`}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.text}>Menecer</Text>
              <Text>{`${salesmanName || "-"} ${salesmanLastName || ""}`}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.text}>Agent</Text>
              <Text>{`${agentName || "-"} ${agentSurname || ""}`}</Text>
            </View>
            {description ? (
              <View>
                <TouchableOpacity
                  onPress={() => {
                    setCollapse(!collapse);
                  }}
                >
                  <View style={{ ...styles.row, ...styles.withoutBorder }}>
                    <Text style={styles.text}>Əlavə məlumat</Text>
                    <Entypo
                      name={
                        collapse ? "chevron-small-right" : "chevron-small-down"
                      }
                      size={20}
                      color="black"
                    />
                  </View>
                </TouchableOpacity>
                {collapse && <Text>{description}</Text>}
              </View>
            ) : (
              <View style={styles.row}>
                <Text style={styles.text}>Əlavə məlumat</Text>
                <Text>{description || "-"}</Text>
              </View>
            )}
          </>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  text: {
    fontWeight: "bold",
    color: "#505050",
    fontSize: 15,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderColor: "#efefef",
    paddingBottom: 5,
  },
  withoutBorder: {
    borderBottomWidth: 0,
  },
});

export default MoreSaleDetail;
