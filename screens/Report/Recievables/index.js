/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Text,
  Modal,
  ActivityIndicator,
  ScrollView,
  Image,
  TouchableOpacity,
  Platform,
} from "react-native";
import uuid from "react-uuid";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import XLSX from "xlsx";

import Pagination from "@cherry-soft/react-native-basic-pagination";
import { RECEIVABLES_TABLE_SETTING_DATA } from "../../../utils/table-config/financeModule";
import { useApi, useFilterHandle } from "../../../hooks";
import { defaultNumberFormat, formatNumberToLocale } from "../../../utils";
import {
  ProText,
  SettingModal,
  ProButton,
  ProTooltip,
} from "../../../components";
import { MaterialCommunityIcons, AntDesign } from "@expo/vector-icons";
import { Table, Row } from "react-native-reanimated-table";

import {
  createSettings,
  fetchRecievables,
  fetchRecievablesCount,
  getCurrencies,
} from "../../../api";
import { contactCategories } from "../../../utils/constants";
import FilterModal from "./FilterModal";
import { fetchMainCurrency } from "../../../api/currencies";
import RecievablesDetail from "./RecievablesDetail";

function Recievables(props) {
  const { tableSettings, setTableSettings } = props;

  const [data, setData] = useState({
    tableHead: [],
    widthArr: [],
    tableData: [],
  });
  const [exportModal, setExportModal] = useState(false);
  const [pageSize, setPageSize] = useState(8);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterCount, setFilterCount] = useState(0);
  const [settingVisible, setSettingVisible] = useState(false);
  const [tableSettingData, setTableSettingData] = useState(
    RECEIVABLES_TABLE_SETTING_DATA
  );
  const [visibleColumns, setVisibleColumns] = useState([]);
  const [lastRow, setLastRow] = useState([]);
  const [isModalVisible, setModalVisible] = useState(false);
  const [recievables, setRecievables] = useState([]);
  const [recievablesCount, setRecievablesCount] = useState(0);
  const [currencies, setCurrencies] = useState([]);
  const [filterVisible, setFilterVisible] = useState(false);

  const [selectedCurrency, setSelectedCurrency] = useState(undefined);
  const [changedCurrency, setChangedCurrency] = useState(undefined);
  const [selectedRow, setSelectedRow] = useState({});
  const [businessUnits, setBusinessUnits] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [mainCurrency, setMainCurrency] = useState({});
  const [detailFilters, setDetailFilters] = useState({});

  const [filter, onFilter, setFilter] = useFilterHandle(
    {
      currencyId: null,
      contacts: null,
      withContract: undefined,
      dateOfTransactionFrom: null,
      dateOfTransactionTo: null,
      daysFrom: null,
      datetime: null,
      statuses: undefined,
      daysTo: null,
      headContacts: null,
      stocks: null,
      amountToBePaidFrom: null,
      amountToBePaidTo: null,
      paidAmountPercentageFrom: null,
      paidAmountPercentageTo: null,
      salesmans: undefined,
      borrow: undefined,
      contracts: undefined,
      contactManagers: undefined,
      productCode: null,
      agents: null,
      productBarcode: null,
      products: undefined,
      parentCatalogs: null,
      catalogs: null,
      withDebt: 1,
      description: undefined,
      businessUnitIds:
        businessUnits?.length === 1
          ? businessUnits[0]?.id !== null
            ? [businessUnits[0]?.id]
            : undefined
          : undefined,
      orderBy: undefined,
      order: undefined,
      limit: pageSize,
      page: currentPage,
    },
    ({ filters }) => {
      if (filters.currencyId)
        fetchRecievables({ filter: filters }).then((res) => {
          setRecievables(res);
        });
      if (filters.currencyId)
        fetchRecievablesCount({ filter: filters }).then((res) => {
          setRecievablesCount(res);
        });
    }
  );

  const { isLoading: isLoadingCurrency, run } = useApi({
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

  useEffect(() => {
    run({
      invoiceType: [2, 4, 13],
      usedInInvoice: 1,
    });
  }, []);

  useEffect(() => {
    if (currencies.length > 0 && !filter?.currencyId) {
      setSelectedCurrency(currencies[0].id);
    }
  }, [currencies]);

  useEffect(() => {
    if (
      tableSettings?.["Finance-Receivables__ForMob"]?.columnsOrder?.length >
        0 &&
      tableSettings?.["Finance-Receivables__ForMob"]?.columnsOrder !== null
    ) {
      const parseData = JSON.parse(
        tableSettings?.["Finance-Receivables__ForMob"]?.columnsOrder
      );
      const columns = parseData
        .filter((column) => column.visible === true)
        .map((column) => column.dataIndex);

      const indexOfManager = columns.indexOf("manager");

      if (-1 !== indexOfManager) {
        columns[indexOfManager] = "managers";
      }

      setVisibleColumns(columns);
      setTableSettingData(parseData);
    } else if (
      tableSettings?.["Finance-Receivables__ForMob"]?.columnsOrder == null
    ) {
      const column = RECEIVABLES_TABLE_SETTING_DATA.filter(
        (column) => column.visible === true
      ).map((column) => column.dataIndex);
      setVisibleColumns(column);
      setTableSettingData(RECEIVABLES_TABLE_SETTING_DATA);
    }
  }, [tableSettings]);

  useEffect(() => {
    if (selectedCurrency) {
      onFilter("currencyId", selectedCurrency);
      if (changedCurrency) {
        handlePaginationChange(1);
      }
    }
  }, [selectedCurrency]);

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
      moduleName: "Finance-Receivables__ForMob",
      columnsOrder: filterColumnData,
    }).then((res) => {
      const newTableSettings = {
        ...tableSettings,
        [`Finance-Receivables__ForMob`]: { columnsOrder: filterColumnData },
      };
      setTableSettings(newTableSettings);
    });
    setVisibleColumns(tableColumn);
    setTableSettingData(column);

    setSettingVisible(false);
  };

  useEffect(() => {
    const columns = [];
    let column = visibleColumns;
    if (visibleColumns !== undefined && recievables) {
      const totalInvoiceDebtAmount = recievables.reduce(
        (total, { invoiceDebtAmount }) => total + Number(invoiceDebtAmount),
        0
      );
      const totalConvertedPaidAmount = recievables.reduce(
        (total, { convertedPaidAmount }) => total + Number(convertedPaidAmount),
        0
      );
      const totalAmountToBePaid = recievables.reduce(
        (total, { amountToBePaid }) => total + Number(amountToBePaid),
        0
      );
      const paidInPercentage =
        (totalConvertedPaidAmount * 100) / totalInvoiceDebtAmount;
      setData({
        tableHead: [
          "No",
          ...visibleColumns.map((item) => {
            return RECEIVABLES_TABLE_SETTING_DATA.find(
              (i) => i.dataIndex === item
            )?.name;
          }),
        ],
        widthArr: [
          70,
          ...visibleColumns.map((el) => {
            return 140;
          }),
        ],

        tableData: recievables?.map((item, index) => {
          columns[column.indexOf("contactFullName")] = (
            <Text>{item.contactFullName}</Text>
          );
          columns[column.indexOf("invoiceDebtAmount")] = (
            <Text>{`${formatNumberToLocale(
              defaultNumberFormat(item.invoiceDebtAmount)
            )} ${item.currencyCode}`}</Text>
          );
          columns[column.indexOf("convertedPaidAmount")] = (
            <Text>{`${formatNumberToLocale(
              defaultNumberFormat(item.convertedPaidAmount)
            )} ${item.currencyCode}`}</Text>
          );
          columns[column.indexOf("paidInPercentage")] = (
            <Text>{`${formatNumberToLocale(
              defaultNumberFormat(
                (Number(item.convertedPaidAmount) * 100) /
                  Number(item.invoiceDebtAmount)
              )
            )}%`}</Text>
          );
          columns[column.indexOf("debtLimit")] = (
            <Text>{`${formatNumberToLocale(
              defaultNumberFormat(item.debtLimit)
            )} ${item.currencyCode}`}</Text>
          );
          columns[column.indexOf("debtLimitExceedingAmount")] = (
            <Text>{`${formatNumberToLocale(
              defaultNumberFormat(item.debtLimitExceedingAmount)
            )} ${item.currencyCode}`}</Text>
          );
          columns[column.indexOf("amountToBePaid")] = (
            <Text>
              {`${formatNumberToLocale(
                defaultNumberFormat(item.amountToBePaid)
              )} ${item.currencyCode}`}
            </Text>
          );
          columns[column.indexOf("lastPaymentAmount")] = (
            <Text>
              {`${formatNumberToLocale(
                defaultNumberFormat(item.lastPaymentAmount)
              )} ${item.currencyCode}`}
            </Text>
          );
          columns[column.indexOf("dateOfTransaction")] = (
            <Text>{item.dateOfTransaction}</Text>
          );
          columns[column.indexOf("daysNum")] = <Text>{item.daysNum}</Text>;
          columns[column.indexOf("type")] = (
            <Text>
              {item.type === "Legal entity" ? "Hüquqi şəxs" : "Fiziki şəxs"}
            </Text>
          );

          columns[column.indexOf("categoryIds")] = (
            <Text>{`${handleCategoryNames(item.categoryIds)?.[0] || "-"}
            ${
              item.categoryIds?.[0] && (
                <ProTooltip
                  popover={
                    <View>
                      {item.categoryIds?.map((category) => (
                        <Text key={category}>{category}</Text>
                      ))}
                    </View>
                  }
                  trigger={
                    <Text>{handleCategoryNames(item.categoryIds)[0]}</Text>
                  }
                />
              )
            }`}</Text>
          );
          columns[column.indexOf("idNumber")] = <Text>{item.id}</Text>;
          columns[column.indexOf("phoneNumbers")] = (
            <Text>{`
            ${item.phoneNumbers?.[0] || "-"}
            ${
              item.phoneNumbers?.[0] && (
                <ProTooltip
                  popover={
                    <View>
                      {item.phoneNumbers?.map((number) => (
                        <Text key={number}>{number}</Text>
                      ))}
                    </View>
                  }
                  trigger={<Text>{item.phoneNumbers?.[0]}</Text>}
                />
              )
            }
          `}</Text>
          );
          columns[column.indexOf("emails")] = <Text>{item.emails?.[0]}</Text>;

          columns[column.indexOf("managers")] = (
            <Text>
              {`${item.managers?.[0]?.name} ${item.managers?.[0]?.lastName}` ||
                "-"}
            </Text>
          );
          columns[column.indexOf("voen")] = <Text>{item.voen}</Text>;
          columns[column.indexOf("websites")] = (
            <Text>{item.websites?.[0] || "-"}</Text>
          );
          columns[column.indexOf("address")] = <Text>{item.address}</Text>;
          columns[column.indexOf("priceType")] = (
            <Text>{item.priceType || "Satış"}</Text>
          );
          columns[column.indexOf("description")] = (
            <Text>{item.description}</Text>
          );
          columns[column.indexOf("createdAt")] = (
            <Text>{item.createdAt?.split("  ")}</Text>
          );
          columns[column.indexOf("createdBy")] = <Text>{item.createdBy}</Text>;
          columns[column.indexOf("officialName")] = (
            <Text>{item.officialName}</Text>
          );
          columns[column.indexOf("generalDirector")] = (
            <Text>{item.generalDirector}</Text>
          );
          columns[column.indexOf("headContactName")] = (
            <Text>{item.headContactName}</Text>
          );
          columns[column.indexOf("companyVoen")] = (
            <Text>{item.companyVoen}</Text>
          );
          columns[column.indexOf("bankName")] = <Text>{item.bankName}</Text>;
          columns[column.indexOf("bankVoen")] = <Text>{item.bankVoen}</Text>;
          columns[column.indexOf("bankCode")] = <Text>{item.bankCode}</Text>;
          columns[column.indexOf("correspondentAccount")] = (
            <Text>{item.correspondentAccount}</Text>
          );
          columns[column.indexOf("settlementAccount")] = (
            <Text>{item.settlementAccount}</Text>
          );
          columns[column.indexOf("swift")] = <Text>{item.swift}</Text>;
          return [
            <Text>{(currentPage - 1) * pageSize + index + 1}</Text>,
            ...columns,
          ];
        }),
      });
      const lastColumns = [];

      lastColumns[column.indexOf("invoiceDebtAmount")] = (
        <Text style={{ color: "white", fontSize: 14, fontWeight: "bold" }}>
          {formatNumberToLocale(defaultNumberFormat(totalInvoiceDebtAmount))}
        </Text>
      );
      lastColumns[column.indexOf("convertedPaidAmount")] = (
        <Text style={{ color: "white", fontSize: 14, fontWeight: "bold" }}>
          {formatNumberToLocale(defaultNumberFormat(totalConvertedPaidAmount))}
        </Text>
      );

      lastColumns[column.indexOf("amountToBePaid")] = (
        <Text style={{ color: "white", fontSize: 14, fontWeight: "bold" }}>
          {formatNumberToLocale(defaultNumberFormat(totalAmountToBePaid))}
        </Text>
      );

      lastColumns[column.indexOf("paidInPercentage")] = (
        <Text style={{ color: "white", fontSize: 14, fontWeight: "bold" }}>
          {formatNumberToLocale(defaultNumberFormat(paidInPercentage))}
        </Text>
      );

      setLastRow([
        <Text style={{ color: "white", fontSize: 14, fontWeight: "bold" }}>
          Toplam
        </Text>,
        ...lastColumns,
      ]);
    }
  }, [
    visibleColumns,
    recievables,
    //   open,
    //   load,
  ]);

  const handleCategoryNames = (categories = []) =>
    categories.map((category) => contactCategories[category]?.name);

  const handleExport = () => {
    setExportModal(true);

    fetchRecievables({ filter }).then((res) => {
      exportDataToExcel(res);
      setExportModal(false);
    });
  };

  const exportDataToExcel = async (exData) => {
    const columnClone = [...visibleColumns];
    const data = (exData === false ? [{}] : exData).map((item, index) => {
      const arr = [];

      columnClone.includes("contactFullName") &&
        (arr[columnClone.indexOf("contactFullName")] = {
          "Qarşı tərəf": item.contactFullName,
        });
      columnClone.includes("invoiceDebtAmount") &&
        (arr[columnClone.indexOf("invoiceDebtAmount")] = {
          "Toplam Borclar":
            formatNumberToLocale(defaultNumberFormat(item.invoiceDebtAmount)) ||
            "-",
        });
      columnClone.includes("convertedPaidAmount") &&
        (arr[columnClone.indexOf("convertedPaidAmount")] = {
          Ödənilib:
            formatNumberToLocale(
              defaultNumberFormat(item.convertedPaidAmount)
            ) || "-",
        });
      columnClone.includes("paidInPercentage") &&
        (arr[columnClone.indexOf("paidInPercentage")] = {
          "Ödənilib(%)":
            formatNumberToLocale(defaultNumberFormat(item.paidInPercentage)) ||
            "-",
        });
      columnClone.includes("amountToBePaid") &&
        (arr[columnClone.indexOf("amountToBePaid")] = {
          Ödənilməlidir:
            formatNumberToLocale(defaultNumberFormat(item.amountToBePaid)) ||
            "-",
        });
      columnClone.includes("lastPaymentAmount") &&
        (arr[columnClone.indexOf("lastPaymentAmount")] = {
          "Son ödəniş":
            formatNumberToLocale(defaultNumberFormat(item.lastPaymentAmount)) ||
            "-",
        });
      columnClone.includes("dateOfTransaction") &&
        (arr[columnClone.indexOf("dateOfTransaction")] = {
          "Son ödəniş tarixi": item.dateOfTransaction,
        });

      columnClone.includes("daysNum") &&
        (arr[columnClone.indexOf("daysNum")] = {
          value: Number(item.daysNum) || "-",
        });
      columnClone.includes("type") &&
        (arr[columnClone.indexOf("type")] = {
          value:
            item.type === "Legal entity"
              ? "Hüquqi şəxs"
              : "Fiziki şəxs",
        });
      columnClone.includes("categoryIds") &&
        (arr[columnClone.indexOf("categoryIds")] = {
          value: handleCategoryNames(item.categoryIds)?.join() || "-",
        });
      columnClone.includes("idNumber") &&
        (arr[columnClone.indexOf("idNumber")] = {
          value: item.id || "-",
        });
      columnClone.includes("phoneNumbers") &&
        (arr[columnClone.indexOf("phoneNumbers")] = {
          value: item.phoneNumbers?.join() || "-",
        });

      columnClone.includes("emails") &&
        (arr[columnClone.indexOf("emails")] = {
          value: item.emails?.join() || "-",
        });
      columnClone.includes("managers") &&
        (arr[columnClone.indexOf("managers")] = {
          value:
            item.managers?.length > 0
              ? item.managers
                  ?.map((manager) => `${manager.name} ${manager.lastName}`)
                  .join(", ")
              : "-",
        });
      columnClone.includes("voen") &&
        (arr[columnClone.indexOf("voen")] = {
          value: item.voen || "-",
        });
      columnClone.includes("websites") &&
        (arr[columnClone.indexOf("websites")] = {
          value: item.websites?.join() || "-",
        });
      columnClone.includes("address") &&
        (arr[columnClone.indexOf("address")] = {
          value: item.address || "-",
        });
      columnClone.includes("priceType") &&
        (arr[columnClone.indexOf("priceType")] = {
          value: item.priceType || "Satış",
        });
      columnClone.includes("description") &&
        (arr[columnClone.indexOf("description")] = {
          value: item.description || "-",
        });
      columnClone.includes("createdAt") &&
        (arr[columnClone.indexOf("createdAt")] = {
          value: item?.createdAt || "-",
        });
      columnClone.includes("createdBy") &&
        (arr[columnClone.indexOf("createdBy")] = {
          value: item.createdBy || "-",
        });
      columnClone.includes("officialName") &&
        (arr[columnClone.indexOf("officialName")] = {
          value: item.officialName || "-",
        });
      columnClone.includes("generalDirector") &&
        (arr[columnClone.indexOf("generalDirector")] = {
          value: item.generalDirector || "-",
        });
      columnClone.includes("companyVoen") &&
        (arr[columnClone.indexOf("companyVoen")] = {
          value: item.companyVoen || "-",
        });
      columnClone.includes("headContactName") &&
        (arr[columnClone.indexOf("headContactName")] = {
          value: item.headContactName || "-",
        });
      columnClone.includes("bankName") &&
        (arr[columnClone.indexOf("bankName")] = {
          value: item.bankName || "-",
        });
      columnClone.includes("bankVoen") &&
        (arr[columnClone.indexOf("bankVoen")] = {
          value: item.bankVoen || "-",
        });
      columnClone.includes("bankCode") &&
        (arr[columnClone.indexOf("bankCode")] = {
          value: item.bankCode || "-",
        });
      columnClone.includes("correspondentAccount") &&
        (arr[columnClone.indexOf("correspondentAccount")] = {
          value: item.correspondentAccount || "-",
        });
      columnClone.includes("settlementAccount") &&
        (arr[columnClone.indexOf("settlementAccount")] = {
          value: item.settlementAccount || "-",
        });
      columnClone.includes("swift") &&
        (arr[columnClone.indexOf("swift")] = {
          value: item.swift || "-",
        });

      arr.unshift({ No: index + 1 });

      return Object.assign({}, ...arr);
    });
    let sample_data_to_export = data;

    var ws = XLSX.utils.json_to_sheet(sample_data_to_export);
    var wb = XLSX.utils.book_new();
    var wscols = [];
    var cols_width = 20;
    wscols.push({
      wch: 12,
    });
    for (var i = 0; i < data.length; i++) {
      wscols.push({
        wch: cols_width,
      });
    }
    ws["!cols"] = wscols;
    XLSX.utils.book_append_sheet(wb, ws, "Cities");

    const base64 = XLSX.write(wb, { type: "base64", bookType: "xlsx" });
    const filename =
      FileSystem.documentDirectory + `recievables${uuid()}}.xlsx`;

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
      const fileUri =
        FileSystem.documentDirectory + `recievables${uuid()}}.xlsx`;

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

  useEffect(() => {
    fetchMainCurrency().then((res) => {
      setMainCurrency(res);
    });
  }, []);

  const handleView = (row) => {
    setShowModal(true);
  };

  const handleDetailsModal = (index) => {
    setSelectedRow(recievables[index]);
    setModalVisible(true);
    const detailFilter = {
      contacts: [recievables[index]?.contactId],
      salesManagers: filter.salesmans,
      stocks: filter.stocks,
      withContract: filter.withContract,
      statuses: filter.statuses,
      currencyId: selectedCurrency,
      isDeleted: 0,
      limit: 10000,
      invoiceTypes: [2, 4, 13],
      businessUnitIds: filter.businessUnitIds,
      description: filter.description,
      parentCatalogs: filter.parentCatalogs,
      catalogs: filter.catalogs,
      products: filter.products,
      productCode: filter.productCode,
      productBarcode: filter.productBarcode,
      datetime: filter.datetime,
    };
    setDetailFilters(detailFilter);
  };

  return (
    <>
      <FilterModal
        isVisible={filterVisible}
        setIsVisible={setFilterVisible}
        setFilterCount={setFilterCount}
        filter={filter}
        setFilter={setFilter}
        defaultCurrency={selectedCurrency}
        onBlur={props.onBlur}
        currencies={currencies}
      />
      {showModal && (
        <RecievablesDetail
          isVisible={showModal}
          handleModal={(isSubmit = false) => {
            if (isSubmit) {
              console.log("ok");
            }

            setShowModal(false);
          }}
          row={selectedRow}
          mainCurrency={mainCurrency}
          filterTable={filter}
          detailFilters={detailFilters}
        />
      )}
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
          AllStandartColumns={RECEIVABLES_TABLE_SETTING_DATA}
        />
      </Modal>
      <View
        style={{
          paddingBottom: 40,
        }}
      >
        <View
          style={{
            marginBottom: 20,
            padding: 10,
            borderRadius: 4,
            backgroundColor: "#fff",
            display: "flex",
            gap: 10,
          }}
        >
          <View
            display="flex"
            flexDirection="row"
            alignItems="flex-end"
            justifyContent={"flex-end"}
          >
            <View>
              <ProButton
                label={<AntDesign name="filter" size={18} color="#55ab80" />}
                type="transparent"
                onClick={() => setFilterVisible(true)}
                defaultStyle={{ borderRadius: 5 }}
                buttonBorder={styles.buttonStyle}
                flex={false}
              />
              {filterCount > 0 && (
                <View
                  style={{
                    position: "absolute",
                    right: -5,
                    top: -5,
                    backgroundColor: "#f3de0b",
                    width: 20,
                    textAlign: "center",
                    justifyContent: "center",
                    alignItems: "center",
                    borderRadius: 50,
                  }}
                >
                  <Text>{filterCount}</Text>
                </View>
              )}
            </View>
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
          <View
            style={{
              padding: 5,
            }}
          >
            <View
              style={{ display: "flex", alignItems: "flex-end", height: 450 }}
            >
              <ScrollView>
                <ScrollView nestedScrollEnabled={true} horizontal={true}>
                  <Table
                    style={{ marginBottom: 150 }}
                    borderStyle={{ borderWidth: 1, borderColor: "white" }}
                  >
                    <Row
                      data={data.tableHead}
                      widthArr={data.widthArr}
                      style={styles.head}
                      textStyle={styles.headText}
                    />
                    {data?.tableData?.map((rowData, index) => (
                      <TouchableOpacity
                        key={index}
                        onLongPress={() => {
                          handleDetailsModal(index);
                        }}
                        delayLongPress={1500}
                      >
                        <Row
                          key={index}
                          data={rowData}
                          widthArr={data.widthArr}
                          style={styles.rowSection}
                          textStyle={styles.text}
                        />
                      </TouchableOpacity>
                    ))}
                    <Row
                      data={lastRow}
                      widthArr={data.widthArr}
                      style={styles.footer}
                      textStyle={styles.headText}
                    />
                    <Modal
                      visible={isModalVisible}
                      transparent
                      animationType="slide"
                      onRequestClose={() => setModalVisible(false)}
                    >
                      <TouchableOpacity
                        style={styles.overlay}
                        activeOpacity={1}
                        onPress={() => {
                          setModalVisible(false);
                        }}
                        pointerEvents="box-none"
                      >
                        <View
                          style={[
                            styles.modalContainer,
                            { zIndex: 10, elevation: 10 },
                          ]}
                        >
                          <Text style={styles.viewModalHeading}>
                            {selectedRow?.name}
                          </Text>
                          <View style={styles.modalContent}>
                            <TouchableOpacity
                              style={styles.iconButton}
                              onPress={() => {
                                setModalVisible(false);
                                handleView();
                              }}
                              onLongPress={() => {
                                setModalVisible(false);
                                handleView();
                              }}
                            >
                              <AntDesign
                                name="eyeo"
                                size={24}
                                color="black"
                                style={{ padding: 5 }}
                              />
                            </TouchableOpacity>
                          </View>
                        </View>
                      </TouchableOpacity>
                    </Modal>
                  </Table>
                </ScrollView>
              </ScrollView>
            </View>
            <View style={{ marginBottom: 30 }}>
              <Pagination
                totalItems={recievablesCount}
                pageSize={pageSize}
                currentPage={currentPage}
                onPageChange={handlePaginationChange}
                textStyle={{ fontSize: 6 }}
              />
            </View>
          </View>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  head: { height: 44, backgroundColor: "#55ab80" },
  headText: {
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
    color: "white",
  },
  footer: { height: 44, backgroundColor: "#484848" },
  rowSection: { flexDirection: "row", borderWidth: 1, borderColor: "#eeeeee" },
  text: { margin: 6, fontSize: 14, textAlign: "center" },
  buttonStyle: {
    borderWidth: 1,
    borderColor: "#55ab80",
    borderRadius: 5,
    paddingLeft: 12,
    paddingRight: 12,
    marginLeft: 14,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)", // Semi-transparent background for focus effect
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "white",
    padding: 10,
    borderRadius: 10,
  },
  viewModalHeading: {
    fontWeight: "bold",
    marginBottom: 15,
  },
  modalContent: {
    gap: 18,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    position: "relative",
  },
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
});

export default Recievables;
