/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useContext } from "react";
import {
  StyleSheet,
  View,
  Modal,
  ScrollView,
  TouchableOpacity,
  Text,
} from "react-native";
import { Table, Row } from "react-native-reanimated-table";
import Pagination from "@cherry-soft/react-native-basic-pagination";
import { AntDesign } from "@expo/vector-icons";
import { defaultNumberFormat, formatNumberToLocale } from "../../../../utils";
import { PRODUCT_VIEW_TABLE_SETTING_DATA } from "../../../../utils/table-config/report";
import {
  ProButton,
  ProStageDynamicColor,
  SettingModal,
} from "../../../../components";
import { getGroupedData } from "../../../Modul";
import { TenantContext } from "../../../../context";
import {
  createSettings,
  fetchSalesInvoiceList,
  fetchSalesInvoicesCount,
} from "../../../../api";
import { useFilterHandle } from "../../../../hooks";
import IncomeInvoiceFilterModal from "./IncomeInvoiceFilterModal";
import SaleDetail from "../../../Modul/SaleDetail";

const tableData = {
  tableHead: [
    "Tarix",
    "Qarşı tərəf",
    "Qaimə",
    "Say",
    "Müqavilə",
    "Mənfəət mərkəzi",
    "Məbləğ",
    "Məbləğ (Əsas valyuta)",
    "Menecer",
    "İcra statusu",
    "Seç",
  ],
  widthArr: [140, 120, 100, 100, 120, 120, 100, 100, 100, 120, 70],
  tableData: [],
};

const IncomeInvoice = (props) => {
  const {
    isLoading,
    mainCurrency,
    type = false,
    tenant,
    setIncomeInvoice,
    setExcludedGoodsInvoice,
    id,
    allBusinessUnits,
    counterparties,
    setCounterparties,
  } = props;

  const [tableSettingData, setTableSettingData] = useState(
    PRODUCT_VIEW_TABLE_SETTING_DATA
  );

  const [visibleColumns, setVisibleColumns] = useState([]);
  const [settingVisible, setSettingVisible] = useState(false);
  const [data, setData] = useState(tableData);
  const [filterVisible, setFilterVisible] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [details, setDetails] = useState([]);
  const [pageSize, setPageSize] = useState(8);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRow, setSelectedRow] = useState({});
  const [priceTypes, setPriceTypes] = useState([]);
  const [invoiceCount, setInvoiceCount] = useState(0);

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
      stockIncreaseType: type ? 1 : undefined,
      stockDecreaseType: !type ? 1 : undefined,
      showProductPricePerItem: type ? 1 : undefined,
      products: [id],
      isDeleted: 0,
      includeTransfer: 0,
      limit: pageSize,
      page: currentPage,
    },
    ({ filters }) => {
      fetchSalesInvoiceList({
        filter: filters,
        withResp: true,
      }).then((res) => {
        if (type) {
          setDetails(res.data);
          setPriceTypes([
            {
              name: "Ortalama maya dəyəri:",
              value: Number(defaultNumberFormat(res?.avgPrice) || "-"),
            },
            {
              name: "Maksimal maya dəyəri:",
              value: Number(defaultNumberFormat(res?.maxPrice) || "-"),
            },
            {
              name: "Minimal maya dəyəri:",
              value: Number(defaultNumberFormat(res?.minPrice) || "-"),
            },
          ]);
        } else {
          setDetails(res.data);
        }
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

  const getInvoice = (data) => {
    if (data?.length > 0) {
      const sumOfQuantities = data.reduce((total, current) => {
        const productQuantities = current.invoiceProductQuantities;
        const productId = Object.keys(productQuantities)[0]; // Get the dynamic key
        const quantity = productQuantities[productId]?.quantity || 0;
        return total + Number(quantity);
      }, 0);
      const firstProductQuantities = data[0]?.invoiceProductQuantities || {};
      const unitOfMeasurementName =
        firstProductQuantities[Number(Object.keys(firstProductQuantities)[0])]
          ?.unitOfMeasurementName || "";

      return {
        sumOfQuantities,
        unitOfMeasurementName,
      };
    }

    return {
      sumOfQuantities: 0,
      unitOfMeasurementName: "",
    };
  };

  const handleSaveSettingModal = (column) => {
    const tableColumn = column
      .filter((col) => col.visible === true)
      .map((col) => col.dataIndex);
    const filterColumn = column.filter((col) => col.dataIndex !== "id");
    const filterColumnData = JSON.stringify(filterColumn);

    createSettings({
      moduleName: "PRODUCT_VIEW_TABLE_SETTING_Mobile",
      columnsOrder: filterColumnData,
    }).then((res) => {
      const newTableSettings = {
        ...userSettings,
        [`PRODUCT_VIEW_TABLE_SETTING_Mobile`]: {
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
      tableSettings?.["PRODUCT_VIEW_TABLE_SETTING_Mobile"]?.columnsOrder;
    if (columnsConfig?.length > 0 && columnsConfig !== null) {
      const parseData = JSON.parse(columnsConfig);
      const columns = parseData
        .filter((column) => column.visible === true)
        .map((column) => column.dataIndex);
      setVisibleColumns(columns);
      setTableSettingData(parseData);
    } else if (columnsConfig == null) {
      const column = PRODUCT_VIEW_TABLE_SETTING_DATA.filter(
        (column) => column.visible === true
      ).map((column) => column.dataIndex);
      setVisibleColumns(column);
      setTableSettingData(PRODUCT_VIEW_TABLE_SETTING_DATA);
    }
  }, [tableSettings]);

  useEffect(() => {
    const columns = [];
    let column = visibleColumns;
    let filteredData = details;
    if (visibleColumns !== undefined && details) {
      setData({
        tableHead: [
          "No",
          ...visibleColumns.map((item) => {
            return PRODUCT_VIEW_TABLE_SETTING_DATA.find(
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
          const productQuantities =
            item?.invoiceProductQuantities[
              Number(Object.keys(item.invoiceProductQuantities))
            ];
          const quantity = productQuantities?.quantity;
          const unitOfMeasurementName =
            productQuantities?.unitOfMeasurementName;
          columns[column.indexOf("operationDate")] = (
            <Text>
              {`${item?.operationDate?.split(" ")[0]} ${
                item?.operationDate?.split(" ")[1]
              }` || "-"}
            </Text>
          );
          columns[column.indexOf("counterparty")] = (
            <Text>
              {item.invoiceType === 11
                ? "İSTEHSALAT"
                : item.invoiceType === 7
                ? "İlkin qalıq"
                : item.counterparty || "-"}
            </Text>
          );
          columns[column.indexOf("invoiceNumber")] = (
            <Text>{item.invoiceNumber}</Text>
          );

          columns[column.indexOf("invoiceProductQuantities")] = (
            <Text>{`${formatNumberToLocale(
              defaultNumberFormat(quantity)
            )} ${unitOfMeasurementName}`}</Text>
          );
          columns[column.indexOf("contractNo")] = (
            <Text>{item.contractNo || item.contractSerialNumber}</Text>
          );
          columns[column.indexOf("attachedInvoiceNumber")] =
            item.invoiceType !== 6 ? (
              "-"
            ) : !item.attachedInvoiceNumber &&
              !item.contractNo &&
              !item.contractSerialNumber ? (
              tenant?.name
            ) : (
              <Text>
                {item.attachedInvoiceNumber ||
                  item.contractNo ||
                  item.contractSerialNumber}
              </Text>
            );
          columns[column.indexOf("endPrice")] = (
            <Text>
              {item.invoiceType === 17
                ? "-"
                : `${formatNumberToLocale(
                    defaultNumberFormat(item.endPrice)
                  )} ${
                    item.currencyCode !== null
                      ? item.currencyCode
                      : mainCurrency?.code
                  }`}
            </Text>
          );

          columns[column.indexOf("endPriceInMainCurrency")] = (
            <Text>
              {item.invoiceType === 17
                ? "-"
                : `${formatNumberToLocale(
                    defaultNumberFormat(item.endPriceInMainCurrency)
                  )} ${mainCurrency?.code}`}
            </Text>
          );

          const groupedData = getGroupedData(
            item.invoiceTypeNumber,
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

          columns[column.indexOf("statusName")] = (
            <Text>{item.statusName}</Text>
          );
          columns[column.indexOf("actions")] = (
            <TouchableOpacity
              onPress={() => {
                setSelectedRow(filteredData[index]);
                setShowModal(true);
              }}
              onLongPress={() => {
                setSelectedRow(filteredData[index]);
                setShowModal(true);
              }}
            >
              <AntDesign
                name="eyeo"
                size={24}
                color="black"
                style={{ padding: 5 }}
              />
            </TouchableOpacity>
          );
          return [
            <Text>{(currentPage - 1) * pageSize + index + 1}</Text>,
            ...columns,
          ];
        }),
      });
    }
  }, [visibleColumns, details]);

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
          AllStandartColumns={PRODUCT_VIEW_TABLE_SETTING_DATA}
        />
      </Modal>
      <IncomeInvoiceFilterModal
        isVisible={filterVisible}
        setIsVisible={setFilterVisible}
        handleFilters={handleFilters}
        filter={filters}
        contacts={counterparties}
        setContacts={setCounterparties}
      />
      <SaleDetail
        isVisible={showModal}
        handleModal={(isSubmit = false) => {
          if (isSubmit) {
            console.log("ok");
          }

          setShowModal(false);
        }}
        row={selectedRow}
        allBusinessUnits={allBusinessUnits}
        profile={profile}
      />
      {/* 
        <Input.Group>
          <span className={styles.filterName}>{"Tarix"}</span>
          <ProDateRangePicker
            // defaultValue={item.value ? moment(item.value, "DD-MM-YYYY HH:mm:ss") : moment()}
            defaultStartValue={
              filters.datetimeFrom ? filters.datetimeFrom : undefined
            }
            defaultEndValue={
              filters.datetimeTo ? filters.datetimeTo : undefined
            }
            format={fullDateTimeWithSecond}
            changeOnlyStyle={true}
            // showToday
            onChangeDate={handleDatePicker}
          />
        </Input.Group> */}

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
          {defaultNumberFormat(getInvoice(details).sumOfQuantities)}
          {getInvoice(details).unitOfMeasurementName}
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
      <View style={{ marginTop: 20 }}>
        {priceTypes?.map((price) => (
          <View
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
              marginBlock: 15,
            }}
          >
            <Text style={{ color: "#373737", fontWeight: 600 }}>
              {price?.name}
            </Text>
            <Text style={{ color: "#373737", fontWeight: 600 }}>
              {price?.value}
            </Text>
          </View>
        ))}
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

export default IncomeInvoice;
