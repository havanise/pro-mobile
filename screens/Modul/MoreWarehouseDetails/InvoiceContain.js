/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from "react";
import { StyleSheet, View, Text, ScrollView } from "react-native";
import { Table, Row } from "react-native-reanimated-table";
import { ProText } from "../../../components";
import {
  defaultNumberFormat,
  formatNumberToLocale,
  roundToDown,
} from "../../../utils";

import math from "exact-math";

const tableData = {
  tableHead: [
    "No",
    "Məhsul adı",
    "Vahidin maya dəyəri",
    "Say",
    "Seriya nömrəsi",
    "Ölçü vahidi",
    "Toplam",
  ],
  widthArr: [50, 140, 140, 100, 100, 140, 140],
  tableData: [],
};

const FooterRow = ({
  primary,
  originalQuantity,
  secondary,
  color = "#7c7c7c",
}) => (
  <View style={styles.opInvoiceContentFooter}>
    <Text style={{ color: color}}>{primary}</Text>
    <Text style={{ color: color}}>{originalQuantity}</Text>
    <Text style={{ color: color}}>{secondary}</Text>
  </View>
);

const HeaderItem = ({ gutterBottom = true, name, secondary, children }) => (
  <View style={{ display: "flex", flexDirection: "column" }}>
    <Text
      style={{
        marginBottom: gutterBottom ? 12 : 0,
        fontWeight: 500,
        color: "#a4a4a4",
      }}
    >
      {name}
    </Text>

    {secondary ? (
      <Text
        style={{
          fontWeight: "normal",
          color: " #373737",
        }}
      >
        {secondary}
      </Text>
    ) : (
      children
    )}
  </View>
);

const InvoiceContain = ({ details, tableDatas, warehouseDetails }) => {
  const [data, setData] = useState(tableData);
  const {
    invoiceType,
    counterparty,
    contractNo,
    contractSerialNumber,
    invoiceNumber,
    currencyCode,
    operationDate,
    createdAt,
    amount,
    taxAmount,
    invoiceProducts,
    stockStatusNumber,
    stockId,
    hasTransferStocks,
  } = details;
  const {
    discount,
    discountAmount,
    endPrice,
    taxPercentage,
    content,
    taxPercentageAmount,
  } = invoiceProducts ? invoiceProducts.result : {};
  const [visibleColumns, setVisibleColumns] = useState([]);
  const [excelColumns, setExcelColumns] = useState([]);
  const [excelData, setExcelData] = useState([]);
  const [invoiceDetailModalisVisible, setInvoiceDetailModalisVisible] =
    useState(false);
  const [selectedInvoiceRow, setSelectedInvoiceRow] = useState(false);

  const handleDetailClick = (row) => {
    setSelectedInvoiceRow({ ...row, stockId, invoiceType });
    setInvoiceDetailModalisVisible((prev) => !prev);
  };

  useEffect(() => {
    setData({
      ...data,
      tableData: tableDatas.map(
        (
          {
            productName,
            invoicePrice,
            quantity,
            pricePerUnit,
            originalQuantity,
            usedQuantity,
            serialNumber,
            unitOfMeasurementName,
            total,
            currencyCode,
          },
          index
        ) => {
          return [
            index + 1,
            productName,
            <Text>{`${formatNumberToLocale(
              defaultNumberFormat(pricePerUnit)
            )} ${currencyCode}`}</Text>,
            <Text>
              {formatNumberToLocale(
                defaultNumberFormat(Number(quantity || 0))
              )}
            </Text>,
            <Text>{serialNumber ? serialNumber : "-"}</Text>,
            <Text>{unitOfMeasurementName}</Text>,
            <Text>{`${formatNumberToLocale(
              defaultNumberFormat(
                math.mul(
                  Number(pricePerUnit || 0),
                  Number(quantity || 0)
                )
              )
            )} ${currencyCode} `}</Text>,
          ];
        }
      ),
    });
  }, [tableDatas]);

  return (
    <View style={{ marginTop: 20 }}>
      <View
        style={{
          justifyContent: "space-between",
          width: "100%",
        }}
      >
        <View>
          {counterparty ? (
            <View style={{ marginBottom: 6 }}>
              <ProText
                variant="heading"
                style={{ color: "#373737", marginBottom: 10 }}
              >
                {counterparty.length > 25
                  ? counterparty.substring(0, 25) + "..."
                  : counterparty}
              </ProText>

              <Text
                style={{
                  fontSize: 18,
                  color: "#CBCBCB",
                }}
              >
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
                  : invoiceType === 18
                  ? "Təklif"
                  : "Qaralama"}
              </Text>
            </View>
          ) : (
            ""
          )}
          <View style={{ flexDirection: "row", gap: 5 }}>
            {invoiceType==19?null: (
              <HeaderItem
                name="Müqavilə"
                secondary={contractNo || contractSerialNumber || "-"}
              />
            )}

            <HeaderItem name="Qaimə" secondary={invoiceNumber || "-"} />
            <HeaderItem
              name="Tarix"
              secondary={`${operationDate?.split("  ")}` || "-"}
            />
          </View>
        </View>
        {/* <ExportToExcel
          getExportData={getExcelData}
          data={excelData}
          columns={excelColumns}
          excelTitle={details?.invoiceNumber}
          excelName="Əməliyyatlar"
          filename="Əməliyyatlar"
          count={
            checked
              ? getFilteredInvoices(mergedInvoiceContent, filters).length
              : getFilteredInvoices(tableDatas, filters).length
          }
          titleName="Qaimənin tərkibi"
          color="#383D3E"
          fromModal={true}
        /> */}
      </View>

      <ScrollView>
        <ScrollView
          nestedScrollEnabled={true}
          horizontal={true}
          style={{ height: "100%", marginTop: 20 }}
        >
          <Table borderStyle={{ borderWidth: 1, borderColor: "white" }}>
            <Row
              data={data.tableHead}
              widthArr={data.widthArr}
              style={styles.head}
              textStyle={styles.headText}
            />
            {data.tableData.map((rowData, index) => (
              <Row
                key={index}
                data={rowData}
                widthArr={data.widthArr}
                style={styles.rowSection}
                textStyle={styles.text}
              />
            ))}
          </Table>
        </ScrollView>
      </ScrollView>

      {[5, 6, 14, 15, 17, 19].includes(invoiceType) ? null : (
        <View style={{ marginTop: 20 }}>
          <FooterRow
            primary="Total"
            originalQuantity={tableDatas?.reduce(
              (total, { originalQuantity }) =>
                math.add(total, Number(originalQuantity) || 0),
              0
            )}
            secondary={`${formatNumberToLocale(
              defaultNumberFormat(Number(amount || 0))
            )} ${currencyCode || "-"}`}
          />
          {invoiceType === 10 ||
          invoiceType === 14 ||
          invoiceType === 15 ||
          invoiceType === 17 ||
          invoiceType === 19 ? null : (
            <>
              <FooterRow
                primary={`Endirim (${
                  roundToDown(
                    math.div(
                      math.mul(Number(discountAmount || 0) || 0, 100),
                      amount || 0
                    ),
                    4
                  ) || ""
                }%)`}
                secondary={
                  discountAmount
                    ? `${formatNumberToLocale(
                        defaultNumberFormat(discountAmount)
                      )} ${currencyCode}`
                    : "-"
                }
                color="#55AB80"
              />
              <FooterRow
                primary="Son qiymət"
                secondary={`${formatNumberToLocale(
                  defaultNumberFormat(endPrice)
                )} ${currencyCode || "-"}`}
              />
              <FooterRow
                primary={`Vergi(${
                  roundToDown(
                    math.div(
                      math.mul(Number(taxAmount || 0) || 0, 100),
                      endPrice || 0
                    ),
                    4
                  ) || ""
                }%)`}
                secondary={
                  taxAmount
                    ? `${formatNumberToLocale(
                        defaultNumberFormat(taxAmount)
                      )} ${currencyCode}`
                    : "-"
                }
                color="#0E65EB"
              />
            </>
          )}
        </View>
      )}
    </View>
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
  opInvoiceContentFooter: {
    width: "100%",
    display: "flex",
    flexDirection: 'row',
    justifyContent: "space-between",
    marginTop: 20,
  },
  rowSection: { flexDirection: "row", borderWidth: 1, borderColor: "#eeeeee" },
  head: { height: 44, backgroundColor: "#55ab80" },
  headText: {
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
    color: "white",
  },
  text: { margin: 6, fontSize: 14, textAlign: "center" },
});

export default InvoiceContain;
