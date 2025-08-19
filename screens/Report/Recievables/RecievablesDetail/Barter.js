/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useContext } from "react";
import {
  StyleSheet,
  View,
  Modal,
  ScrollView,
  ActivityIndicator,
  Text,
  Platform,
} from "react-native";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import XLSX from "xlsx";
import uuid from "react-uuid";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Table, Row } from "react-native-reanimated-table";
import Pagination from "@cherry-soft/react-native-basic-pagination";
import { defaultNumberFormat, formatNumberToLocale } from "../../../../utils";
import { fetchTransactionList, fetchTransactionsCount } from "../../../../api";
import { useFilterHandle } from "../../../../hooks";
import { ProButton, ProText } from "../../../../components";

const tableData = {
  tableHead: [
    "No",
    "İcra tarixi",
    "Əməliyyat tarixi",
    "Sənəd",
    "Növ",
    "Kateqoriya",
    "Məbləğ (Əsas valyuta)",
  ],
  widthArr: [70, 120, 100, 100, 120, 120, 100],
  tableData: [],
};

const Barter = (props) => {
  const {
    isVisible,
    barterInvoices,
    setBarterInvoices,
    mainCurrency,
    filterTable,
    contactId,
  } = props;

  const [data, setData] = useState(tableData);
  const [pageSize, setPageSize] = useState(8);
  const [currentPage, setCurrentPage] = useState(1);
  const [invoiceCount, setInvoiceCount] = useState(0);
  const [exportModal, setExportModal] = useState(false);

  const [filters, onFilter, setFilters] = useFilterHandle(
    {
      contacts: [contactId],
      cashInOrCashOut: [1],
      stocks: filterTable.stocks,
      invoiceCurrencyId: filterTable.currencyId,
      transactionTypes: [23],
      vat: 0,
      datetime: filterTable.datetime,
      limit: pageSize,
      page: currentPage,
    },
    ({ filters }) => {
      fetchTransactionList({
        filter: filters,
      }).then((res) => {
        console.log(res, "res");
        setBarterInvoices(res);
      });
      fetchTransactionsCount({
        filter: filters,
      }).then((productData) => {
        setInvoiceCount(productData);
      });
    }
  );

  const handlePaginationChange = (value) => {
    onFilter("page", value);
    return (() => setCurrentPage(value))();
  };

  useEffect(() => {
    if (isVisible && barterInvoices?.length > 0) {
      setData({
        ...data,
        tableData: barterInvoices.map(
          (
            {
              createdAt,
              dateOfTransaction,
              documentNumber,
              operationDirectionName,
              categoryName,
              amountConvertedToMainCurrency,
            },
            index
          ) => {
            return [
              (currentPage - 1) * pageSize + index + 1,
              createdAt,
              dateOfTransaction,
              documentNumber,
              operationDirectionName,
              categoryName,
              <Text>
                {formatNumberToLocale(
                  defaultNumberFormat(amountConvertedToMainCurrency)
                )}
                {mainCurrency?.code}
              </Text>,
            ];
          }
        ),
      });
    }
  }, [barterInvoices]);

  const handleExport = () => {
    setExportModal(true);
    fetchTransactionList({
      filter: { ...filters, limit: 5000, page: undefined },
    }).then((productData) => {
      exportDataToExcel(productData);
      setExportModal(false);
    });
  };

  const exportDataToExcel = async (exData) => {
    const data = (exData === false ? [{}] : exData).map((item, index) => {
      const arr = [
        { No: index + 1 },
        { "İcra tarixi": item.createdAt },
        { "Əməliyyat tarixi": item.dateOfTransaction },
        { Sənəd: item.documentNumber },
        {
          Növ: item.operationDirectionName,
        },
        {
          Kateqoriya: item.categoryName,
        },
        {
          "Məbləğ (Əsas valyuta)": `${formatNumberToLocale(
            defaultNumberFormat(item.amountConvertedToMainCurrency)
          )} ${mainCurrency?.code}`,
        },
      ];

      return Object.assign({}, ...arr);
    });
    let sample_data_to_export = data;

    var ws = XLSX.utils.json_to_sheet(sample_data_to_export);
    var wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Cities");

    const base64 = XLSX.write(wb, { type: "base64", bookType: "xlsx" });
    const filename = FileSystem.documentDirectory + `invoice${uuid()}}.xlsx`;

    if (Platform.OS === "android") {
      const permissions =
        await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();

      if (permissions.granted) {
        await FileSystem.StorageAccessFramework.createFileAsync(
          permissions.directoryUri,
          filename,
          "application/xls"
        )
          .then(async (uri) => {
            await FileSystem.writeAsStringAsync(uri, base64, {
              encoding: FileSystem.EncodingType.Base64,
            });
          })
          .catch((e) => console.log(e));
      } else {
        Sharing.shareAsync(filename);
      }
    } else if (Platform.OS === "ios") {
      const fileUri = FileSystem.documentDirectory + `invoice${uuid()}}.xlsx`;

      await FileSystem.writeAsStringAsync(fileUri, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      await Sharing.shareAsync(fileUri, {
        UTI: "com.microsoft.excel.xlsx",
        mimeType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
    }
  };

  return (
    <>
      <Modal animationType="slide" transparent={true} visible={exportModal}>
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <ProText variant="heading" style={{ color: "black" }}>
              Excel sənədi yüklənir.......
            </ProText>
            <Text>Yüklənmə prosesi 1-2 dəqiqə davam edə bilər......</Text>
            <ActivityIndicator color={"#37B874"} />
          </View>
        </View>
      </Modal>
      <View
        display="flex"
        flexDirection="row"
        justifyContent="flex-end"
        style={{ marginTop: 10 }}
      >
        <ProButton
          label={
            <MaterialCommunityIcons
              name="microsoft-excel"
              size={18}
              color="#55ab80"
            />
          }
          onClick={() => handleExport()}
          buttonBorder={styles.buttonStyle}
          type="transparent"
          defaultStyle={{ borderRadius: 5 }}
          flex={false}
        />
      </View>
      <ScrollView style={{ marginTop: 15 }}>
        <ScrollView
          nestedScrollEnabled={true}
          horizontal={true}
          style={{ height: "100%" }}
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
      <View
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
        }}
      >
        <Text>Toplam</Text>

        <Text>
          {`${formatNumberToLocale(
            defaultNumberFormat(
              barterInvoices?.reduce(
                (total, { amountConvertedToMainCurrency }) =>
                  total + Number(amountConvertedToMainCurrency),
                0
              )
            )
          )} ${mainCurrency?.code}`}
        </Text>
      </View>
      <View>
        <Pagination
          totalItems={invoiceCount}
          pageSize={pageSize}
          currentPage={currentPage}
          onPageChange={handlePaginationChange}
          textStyle={{ fontSize: 6 }}
        />
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalView: {
    width: "100%",
    height: "100%",
    padding: 30,
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
    borderColor: "#55ab80",
    borderRadius: 5,
    paddingLeft: 12,
    paddingRight: 12,
    marginLeft: 14,
  },
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

  footer: { height: 44, backgroundColor: "#484848" },
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

export default Barter;
