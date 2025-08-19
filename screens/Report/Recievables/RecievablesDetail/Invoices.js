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
import Checkbox from "expo-checkbox";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import XLSX from "xlsx";
import uuid from "react-uuid";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Table, Row } from "react-native-reanimated-table";
import Pagination from "@cherry-soft/react-native-basic-pagination";
import { AntDesign } from "@expo/vector-icons";
import {
  defaultNumberFormat,
  formatNumberToLocale,
  roundToDown,
} from "../../../../utils";
import { ReceiavableDetail_Modal_Table_Data } from "../../../../utils/table-config/report";
import {
  ProButton,
  ProStageDynamicColor,
  ProText,
  SettingModal,
} from "../../../../components";
import { getGroupedData, getPaymentStatus } from "../../../Modul";
import { TenantContext } from "../../../../context";
import {
  createSettings,
  fetchSalesInvoiceList,
  fetchSalesInvoicesCount,
} from "../../../../api";
import { useFilterHandle } from "../../../../hooks";
import InvoicesFilterModal from "./InvoicesFilterModal";

import math from "exact-math";

const tableData = {
  tableHead: [
    "Tarix",
    "Ödəniş tarixi",
    "Müqavilə",
    "Qarşı tərəf",
    "Qaimə",
    "Gecikmə (gün)",
    "Gecikən məbləğ",
    "Ödənilməlidir",
    "Ödənilib",
    "Ödənilib(%)",
    "Məbləğ",
    "Status",
    "İcra statusu",
    "Əlavə məlumat",
  ],
  widthArr: [
    140, 120, 100, 100, 120, 120, 100, 100, 100, 120, 100, 100, 100, 100,
  ],
  tableData: [],
};

const Invoices = (props) => {
  const { isLoading, invoices, setInvoices, contactId, detailFilters } = props;

  const [tableSettingData, setTableSettingData] = useState(
    ReceiavableDetail_Modal_Table_Data
  );

  const [visibleColumns, setVisibleColumns] = useState([]);
  const [settingVisible, setSettingVisible] = useState(false);
  const [data, setData] = useState(tableData);
  const [filterVisible, setFilterVisible] = useState(false);
  const [pageSize, setPageSize] = useState(8);
  const [currentPage, setCurrentPage] = useState(1);
  const [invoiceCount, setInvoiceCount] = useState(0);
  const [lastRow, setLastRow] = useState([]);
  const [exportModal, setExportModal] = useState(false);

  const {
    profile,
    BUSINESS_TKN_UNIT,
    userSettings,
    setTableSettings,
    tableSettings,
    permissionsByKeyValue,
  } = useContext(TenantContext);

  const [filters, onFilter, setFilters] = useFilterHandle(
    {
      ...detailFilters,
      contacts: [contactId],
      excludeZeroAmount: 1,
      excludeEmptyPaymentStatus: 1,
      includeCreditData: 1,
      limit: pageSize,
      page: currentPage,
    },
    ({ filters }) => {
      fetchSalesInvoiceList({
        filter: filters,
      }).then((res) => {
        setInvoices(res);
      });
      fetchSalesInvoicesCount({
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

  const handleSaveSettingModal = (column) => {
    const tableColumn = column
      .filter((col) => col.visible === true)
      .map((col) => col.dataIndex);
    const filterColumn = column.filter((col) => col.dataIndex !== "id");
    const filterColumnData = JSON.stringify(filterColumn);

    createSettings({
      moduleName: "Receiavables_VIEW_TABLE_SETTING_Mobile",
      columnsOrder: filterColumnData,
    }).then((res) => {
      const newTableSettings = {
        ...userSettings,
        [`Receiavables_VIEW_TABLE_SETTING_Mobile`]: {
          columnsOrder: filterColumnData,
        },
      };
      setTableSettings(newTableSettings);
    });

    setVisibleColumns(tableColumn);
    setTableSettingData(column);

    setSettingVisible(false);
  };

  useEffect(() => {
    const columnsConfig =
      tableSettings?.["Receiavables_VIEW_TABLE_SETTING_Mobile"]?.columnsOrder;
    if (columnsConfig?.length > 0 && columnsConfig !== null) {
      const parseData = JSON.parse(columnsConfig);
      const columns = parseData
        .filter((column) => column.visible === true)
        .map((column) => column.dataIndex);
      setVisibleColumns(columns);
      setTableSettingData(parseData);
    } else if (columnsConfig == null) {
      const column = ReceiavableDetail_Modal_Table_Data.filter(
        (column) => column.visible === true
      ).map((column) => column.dataIndex);
      setVisibleColumns(column);
      setTableSettingData(ReceiavableDetail_Modal_Table_Data);
    }
  }, [tableSettings]);

  useEffect(() => {
    const columns = [];
    let column = visibleColumns;
    let filteredData = invoices;
    if (visibleColumns !== undefined && invoices) {
      setData({
        tableHead: [
          "No",
          ...visibleColumns.map((item) => {
            return ReceiavableDetail_Modal_Table_Data.find(
              (i) => i.dataIndex === item
            ).name;
          }),
        ],
        widthArr: [
          70,
          ...visibleColumns.map((el) => {
            return 140;
          }),
        ],

        tableData: filteredData?.map((item, index) => {
          columns[column.indexOf("operationDate")] = (
            <Text>{item?.operationDate}</Text>
          );
          columns[column.indexOf("firstOpenCreditDate")] = (
            <Text>
              {item.firstOpenCreditDate ? item.firstOpenCreditDate : "-"}
            </Text>
          );
          columns[column.indexOf("contractNo")] = (
            <Text>{item.contractNo || item.contractSerialNumber || "-"}</Text>
          );

          columns[column.indexOf("invoiceNumber")] = (
            <Text>{item.invoiceNumber}</Text>
          );
          columns[column.indexOf("daysFromLastPaymentDate")] = (
            <Text>{Number(item.daysFromLastPaymentDate)}</Text>
          );
          columns[column.indexOf("credit")] =
            item.credit?.totalOverdueAmount ?? 0 > 0 ? (
              <Text>{`${formatNumberToLocale(
                defaultNumberFormat(item.credit?.totalOverdueAmount)
              )} ${item?.currencyCode}`}</Text>
            ) : (
              <Text>-</Text>
            );
          columns[column.indexOf("mustPaid")] = (
            <Text>
              {`${formatNumberToLocale(
                defaultNumberFormat(
                  math.sub(
                    Number(item?.endPrice ?? 0),
                    Number(item?.paidAmount || 0)
                  )
                )
              )} ${item.currencyCode}`}
            </Text>
          );

          columns[column.indexOf("paidAmount")] = (
            <Text>
              {`${formatNumberToLocale(
                defaultNumberFormat(item.paidAmount || 0)
              )} ${item.currencyCode}`}
            </Text>
          );

          columns[column.indexOf("paidInPercentage")] = (
            <Text>
              {`${formatNumberToLocale(
                defaultNumberFormat(
                  (roundToDown(Number(item?.paidAmount) || 0) * 100) /
                    roundToDown(Number(item?.endPrice) ?? 0) || 0
                )
              )}%`}
            </Text>
          );
          columns[column.indexOf("endPrice")] = (
            <Text>
              {`${formatNumberToLocale(defaultNumberFormat(item.endPrice))} ${
                item.currencyCode
              }`}
            </Text>
          );

          columns[column.indexOf("paymentStatus")] = (
            <Text>
              {item.paymentStatus === 3 && Number(item.endPrice) === 0
                ? "-"
                : getPaymentStatus(item.paymentStatus)}
            </Text>
          );

          columns[column.indexOf("description")] = (
            <Text>{item.description}</Text>
          );

          const groupedData = getGroupedData(
            item.invoiceType,
            permissionsByKeyValue
          );
          const PermissionsForStatus = Object.values(groupedData)?.find(
            (item) => item.permission === 0
          );
          const operationType =
            item?.draftType !== null ? item.draftType : item.invoiceTypeNumber;

          const { statuses } =
            item?.statusData?.find(
              (item) => item.operationId === operationType
            ) || {};
          const formattedStatusData = statuses?.map((item) => ({
            id: item.id,
            label: item.name,
            color: `#${item.color?.toString(16).padStart(6, "0")}`,
          }));

          const visualStage =
            formattedStatusData?.find((item) => item.id === item?.statusId)
              ?.label || item?.statusName;

          columns[column.indexOf("statusName")] = PermissionsForStatus ? (
            <Text>-</Text>
          ) : (
            <ProStageDynamicColor
              disabled={true}
              visualStage={{ id: visualStage }}
              statuses={[
                {
                  id: item.statusId,
                  label: item.statusName,
                  color: `#${item.statusColor?.toString(16).padStart(6, "0")}`,
                },
              ]}
              color={`#${item.statusColor?.toString(16).padStart(6, "0")}`}
              statusName={item.statusName}
            />
          );

          return [
            <Text>{(currentPage - 1) * pageSize + index + 1}</Text>,
            ...columns,
          ];
        }),
      });

      const lastColumns = [];

      const totalEndPrices = invoices.reduce(
        (all, current) => math.add(all, Number(current?.endPrice ?? 0)),
        0
      );

      const totalPaidAmount = invoices.reduce(
        (all, current) => math.add(all, Number(current?.paidAmount ?? 0)),
        0
      );

      const mustPaid = math.sub(
        Number(totalEndPrices ?? 0),
        Number(totalPaidAmount ?? 0)
      );

      const paidInPercentage =
        (roundToDown(totalPaidAmount || 0) * 100) / totalEndPrices;

      lastColumns[column.indexOf("credit")] = (
        <Text style={{ color: "white", fontSize: 14, fontWeight: "bold" }}>
          {formatNumberToLocale(
            defaultNumberFormat(
              invoices.reduce(
                (totalPrice, { credit }) =>
                  math.add(totalPrice, Number(credit?.totalOverdueAmount || 0)),
                0
              )
            )
          )}
        </Text>
      );

      lastColumns[column.indexOf("mustPaid")] = (
        <Text style={{ color: "white", fontSize: 14, fontWeight: "bold" }}>
          {formatNumberToLocale(defaultNumberFormat(mustPaid))}
        </Text>
      );

      lastColumns[column.indexOf("paidInPercentage")] = (
        <Text style={{ color: "white", fontSize: 14, fontWeight: "bold" }}>
          <Text>
            {`${formatNumberToLocale(defaultNumberFormat(paidInPercentage))}%`}
          </Text>
        </Text>
      );
      lastColumns[column.indexOf("paidAmount")] = (
        <Text style={{ color: "white", fontSize: 14, fontWeight: "bold" }}>
          {formatNumberToLocale(defaultNumberFormat(totalPaidAmount))}
        </Text>
      );

      lastColumns[column.indexOf("endPrice")] = (
        <Text style={{ color: "white", fontSize: 14, fontWeight: "bold" }}>
          {formatNumberToLocale(defaultNumberFormat(totalEndPrices))}
        </Text>
      );
      setLastRow([
        <Text style={{ color: "white", fontSize: 14, fontWeight: "bold" }}>
          Toplam
        </Text>,
        ...lastColumns,
      ]);
    }
  }, [visibleColumns, invoices]);

  const handleExport = () => {
    setExportModal(true);
    fetchSalesInvoiceList({
      filter: { ...filters, limit: 5000, page: undefined },
    }).then((productData) => {
      exportDataToExcel(productData);
      setExportModal(false);
    });
  };

  const exportDataToExcel = async (exData) => {
    const columnClone = [...visibleColumns];
    const data = (exData === false ? [{}] : exData).map((item, index) => {
      const arr = [];

      columnClone.includes("operationDate") &&
        (arr[columnClone.indexOf("operationDate")] = {
          Tarix: item.operationDate,
        });
      columnClone.includes("firstOpenCreditDate") &&
        (arr[columnClone.indexOf("firstOpenCreditDate")] = {
          "Ödəniş tarixi": item.firstOpenCreditDate || "-",
        });
      columnClone.includes("contractNo") &&
        (arr[columnClone.indexOf("contractNo")] = {
          Müqavilə: item.contractNo || item.contractSerialNumber || "-",
        });
      columnClone.includes("invoiceNumber") &&
        (arr[columnClone.indexOf("invoiceNumber")] = {
          Qaimə: item.invoiceNumber || "-",
        });
      columnClone.includes("daysFromLastPaymentDate") &&
        (arr[columnClone.indexOf("daysFromLastPaymentDate")] = {
          "Gecikmə (gün)": item.daysFromLastPaymentDate || "-",
        });
      columnClone.includes("credit") &&
        (arr[columnClone.indexOf("credit")] = {
          "Gecikən məbləğ":
            item.credit?.totalOverdueAmount ?? 0 > 0
              ? `${formatNumberToLocale(
                  defaultNumberFormat(item.credit?.totalOverdueAmount)
                )} ${item?.currencyCode}`
              : "-",
        });
      columnClone.includes("mustPaid") &&
        (arr[columnClone.indexOf("mustPaid")] = {
          Ödənilməlidir: `${formatNumberToLocale(
            defaultNumberFormat(
              math.sub(
                Number(item?.endPrice ?? 0),
                Number(item?.paidAmount || 0)
              )
            )
          )} ${item.currencyCode}`,
        });
      columnClone.includes("paidAmount") &&
        (arr[columnClone.indexOf("paidAmount")] = {
          Ödənilib: `${formatNumberToLocale(
            defaultNumberFormat(item.paidAmount || 0)
          )} ${item.currencyCode}`,
        });

      columnClone.includes("paidInPercentage") &&
        (arr[columnClone.indexOf("paidInPercentage")] = {
          "Ödənilib(%)": `${formatNumberToLocale(
            defaultNumberFormat(
              (roundToDown(Number(item?.paidAmount) || 0) * 100) /
                roundToDown(Number(item?.endPrice) ?? 0) || 0
            )
          )}%`,
        });
      columnClone.includes("endPrice") &&
        (arr[columnClone.indexOf("endPrice")] = {
          Məbləğ: `${formatNumberToLocale(
            defaultNumberFormat(item.endPrice)
          )} ${item.currencyCode}`,
        });
      columnClone.includes("paymentStatus") &&
        (arr[columnClone.indexOf("paymentStatus")] = {
          Status:
            item.paymentStatus === 3 && Number(item.endPrice) === 0
              ? "-"
              : getPaymentStatus(item.paymentStatus),
        });
      columnClone.includes("statusName") &&
        (arr[columnClone.indexOf("statusName")] = {
          "İcra statusu": item.statusName || "-",
        });
      columnClone.includes("description") &&
        (arr[columnClone.indexOf("description")] = {
          "Əlavə məlumat": item.description || "-",
        });

      arr.unshift({ No: index + 1 });

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

  const handleFilters = (filters) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      ...filters,
    }));
  };

  return (
    <>
      <Modal
        animationType="slide"
        transparent={true}
        visible={settingVisible}
        onRequestClose={() => {
          setSettingVisible(false);
        }}
      >
        <SettingModal
          saveSetting={handleSaveSettingModal}
          setVisible={setSettingVisible}
          isVisible={settingVisible}
          columnSource={tableSettingData}
          AllStandartColumns={ReceiavableDetail_Modal_Table_Data}
        />
      </Modal>
      <InvoicesFilterModal
        isVisible={filterVisible}
        setIsVisible={setFilterVisible}
        handleFilters={handleFilters}
        filter={filters}
      />
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
        <View
          style={{
            display: "flex",
            flexDirection: "row",
          }}
        >
          <Checkbox
            onValueChange={(event) => {
              onFilter("daysFromLastPaymentDateMin", event ? 1 : undefined);
            }}
            value={filters.daysFromLastPaymentDateMin}
            style={{ marginLeft: "8px" }}
          />
          <Text style={{ marginLeft: 5 }}>Gecikən məbləğ</Text>
        </View>
      </View>
      <View
        display="flex"
        flexDirection="row"
        justifyContent="flex-end"
        style={{ marginTop: 10 }}
      >
        <ProButton
          label={<AntDesign name="filter" size={18} color="#55ab80" />}
          type="transparent"
          onClick={() => setFilterVisible(true)}
          defaultStyle={{ borderRadius: 5 }}
          buttonBorder={styles.buttonStyle}
          flex={false}
        />
        <ProButton
          label={<AntDesign name="setting" size={18} color="#55ab80" />}
          type="transparent"
          onClick={() => setSettingVisible(true)}
          defaultStyle={{ borderRadius: 5 }}
          buttonBorder={styles.buttonStyle}
          flex={false}
        />
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

            <Row
              data={lastRow}
              widthArr={data.widthArr}
              style={styles.footer}
              textStyle={styles.headText}
            />
          </Table>
        </ScrollView>
      </ScrollView>

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

export default Invoices;
