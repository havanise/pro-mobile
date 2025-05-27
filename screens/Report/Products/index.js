import React, { useState, useEffect, useContext } from "react";
import { useIsFocused } from '@react-navigation/native';
import {
  View,
  StyleSheet,
  Text,
  Modal,
  ActivityIndicator,
  ScrollView,
  Image,
} from "react-native";
import { Table, Row } from "react-native-reanimated-table";
import { filter as filterLodash } from "lodash";
import { PRODUCT_TABLE_SETTING_DATA } from "../../../utils/table-config/report";
import {
  FontAwesome,
  MaterialCommunityIcons,
  AntDesign,
  MaterialIcons,
} from "@expo/vector-icons";
import { useFilterHandle } from "../../../hooks";
import Pagination from "@cherry-soft/react-native-basic-pagination";
import {
  ProButton,
  ProText,
  ProTooltip,
  SettingModal,
} from "../../../components";
import { createSettings, fetchProductCount, fetchProducts } from "../../../api";
import {
  defaultNumberFormat,
  formatNumberToLocale,
  roundTo,
} from "../../../utils";
import math from "exact-math";
import FilterModal from "./FilterModal";
import { fetchProduct } from "../../../api/sale";

const Products = (props) => {
  const isFocused = useIsFocused();
  const { allBusinessUnits, mainCurrency, setTableSettings, tableSettings, navigation } =
    props;
  const [data, setData] = useState({
    tableHead: [],
    widthArr: [],
    tableData: [],
  });
  const [visibleColumns, setVisibleColumns] = useState([]);
  const [settingVisible, setSettingVisible] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);
  const [tableSettingData, setTableSettingData] = useState(
    PRODUCT_TABLE_SETTING_DATA
  );
  const [exportModal, setExportModal] = useState(false);
  const [pageSize, setPageSize] = useState(8);
  const [currentPage, setCurrentPage] = useState(1);
  const [productsCount, setProductsCount] = useState(0);
  const [filterCount, setFilterCount] = useState(0);
  const [priceNames, setPriceNames] = useState([]);
  const [lastRow, setLastRow] = useState([]);
  const [products, setProducts] = useState([]);
  const [productUnitOfMeasurements, setProductUnitOfMeasurements] = useState(
    []
  );
  const [load, setLoad] = useState(false);
  const [open, setOpen] = useState(false);
  const [tooltipData, setTooltipData] = useState(null);

  const [filter, onFilter, setFilter] = useFilterHandle(
    {
      type: undefined,
      serialNumber: undefined,
      catalogId: undefined,
      parentCatalogIds: undefined,
      catalogIds: undefined,
      manufacturers: undefined,
      brandIds: undefined,
      status: undefined,
      stocks: undefined,
      withSalesDraftProductsQuantity: undefined,
      hasBarcode: undefined,
      hasRoadTax: undefined,
      roadTaxFrom: undefined,
      roadTaxTo: undefined,
      haveUnitOfMeasurements: undefined,
      hasMaterials: undefined,
      usedInBron: undefined,
      usedInConsignment: undefined,
      id: undefined,
      ids: undefined,
      limit: 8,
      page: 1,
      withRoadTaxes: 1,
      withAttachmentUrl: 1,
      barcode: null,
      product_code: null,
      q: undefined,
      brandName: undefined,
      inStock: undefined,
      hasLabel: undefined,
      unitOfMeasurementIds: undefined,
      description: undefined,
      quantityFrom: undefined,
      quantityTo: undefined,
      sort: "desc",
      orderBy: "id",
      isDeleted: 0,
      parentLabels: null,
      labels: null,
      productCodeName: null,
    },
    ({ filters }) => {
      let isConsignment = 1,
        isMinMaxPrice = 1;

      if (tableSettingData?.["ProductsForMob"]) {
        const columnsConfig = JSON.parse(
          tableSettingData["ProductsForMob"]?.columnsOrder
        );

        columnsConfig.forEach(({ dataIndex, visible }) => {
          if (dataIndex === "consignmentQuantity" && visible) isConsignment = 1;
          if (dataIndex === "minPrice" && visible) isMinMaxPrice = 1;
          if (dataIndex === "maxPrice" && visible) isMinMaxPrice = 1;
          if (dataIndex === "avgPrice" && visible) isMinMaxPrice = 1;
          if (dataIndex === "lastPrice" && visible) isMinMaxPrice = 1;
        });
      }
      fetchProducts({
        filter: {
          ...filters,
          withConsignmentQuantity: isConsignment,
          withMinMaxPrice: isMinMaxPrice,
        },
        withResp: true,
      }).then((res) => {
        setProducts(res.data);
        setPriceNames(res.prices);
      });
      fetchProductCount({
        filter: {
          ...filters,
          withConsignmentQuantity: isConsignment,
          withMinMaxPrice: isMinMaxPrice,
        },
      }).then((productData) => {
        setProductsCount(productData);
      });
    }
  );

  useEffect(() => {
    if (isFocused) {
      let isConsignment = 1,
        isMinMaxPrice = 1;

      if (tableSettingData?.["ProductsForMob"]) {
        const columnsConfig = JSON.parse(
          tableSettingData["ProductsForMob"]?.columnsOrder
        );

        columnsConfig.forEach(({ dataIndex, visible }) => {
          if (dataIndex === "consignmentQuantity" && visible) isConsignment = 1;
          if (dataIndex === "minPrice" && visible) isMinMaxPrice = 1;
          if (dataIndex === "maxPrice" && visible) isMinMaxPrice = 1;
          if (dataIndex === "avgPrice" && visible) isMinMaxPrice = 1;
          if (dataIndex === "lastPrice" && visible) isMinMaxPrice = 1;
        });
      }
      fetchProducts({
        filter: {
          ...filter,
          withConsignmentQuantity: isConsignment,
          withMinMaxPrice: isMinMaxPrice,
        },
        withResp: true,
      }).then((res) => {
        setProducts(res.data);
        setPriceNames(res.prices);
      });
      fetchProductCount({
        filter: {
          ...filter,
          withConsignmentQuantity: isConsignment,
          withMinMaxPrice: isMinMaxPrice,
        },
      }).then((productData) => {
        setProductsCount(productData);
      });
    }
  }, [isFocused]);

  const handleExport = () => {
    setExportModal(true);
    let isConsignment = 1,
      isMinMaxPrice = 1;

    if (tableSettingData?.["ProductsForMob"]) {
      const columnsConfig = JSON.parse(
        tableSettingData["ProductsForMob"]?.columnsOrder
      );

      columnsConfig.forEach(({ dataIndex, visible }) => {
        if (dataIndex === "consignmentQuantity" && visible) isConsignment = 1;
        if (dataIndex === "minPrice" && visible) isMinMaxPrice = 1;
        if (dataIndex === "maxPrice" && visible) isMinMaxPrice = 1;
        if (dataIndex === "avgPrice" && visible) isMinMaxPrice = 1;
        if (dataIndex === "lastPrice" && visible) isMinMaxPrice = 1;
      });
    }
    fetchProducts({
      filter: {
        ...filter,
        withConsignmentQuantity: isConsignment,
        withMinMaxPrice: isMinMaxPrice,
      },
    }).then((productData) => {
      exportDataToExcel(productData);
      setExportModal(false);
    });
  };

  const handleTooltipClose = () => {
    setOpen(null);
    setTooltipData(null);
  };

  const handleTooltipOpen = async (item) => {
    setOpen(item.id); // Set the current tooltip to open
    if (!load) {
      setLoad(true);
      setTooltipData(null);
      const res = await fetchProduct({ apiEnd: item.id });
      setProductUnitOfMeasurements(res.unitOfMeasurements || []);
      setTooltipData(item); // Store the item data for tooltip
      setLoad(false);
    }
  };

  useEffect(() => {
    const columns = [];
    let column = visibleColumns;
    if (visibleColumns !== undefined && mainCurrency && products) {
      setData({
        tableHead: [
          "No",
          ...visibleColumns.map((item) => {
            return [
              ...PRODUCT_TABLE_SETTING_DATA,
              ...priceNames.map((item) => {
                return { name: item.name, dataIndex: item.name };
              }),
            ].find((i) => i.dataIndex === item).name;
          }),
        ],
        widthArr: [
          70,
          ...visibleColumns.map((el) => {
            return 140;
          }),
        ],

        tableData: products?.map((item, index) => {
          const currentMeasurement = item.unitOfMeasurements?.find(
            (unit) => unit?.id === item.unitOfMeasurementID
          );
          const salesDraftQuantity =
            item.unitOfMeasurements?.length === 1
              ? item.salesDraftQuantity
              : math.div(
                  Number(item.salesDraftQuantity || 0),
                  Number(currentMeasurement?.coefficientRelativeToMain || 1)
                );

          const bronQuantity =
            item.unitOfMeasurements?.length === 1
              ? item.bronQuantity
              : math.div(
                  Number(item.bronQuantity || 0),
                  Number(currentMeasurement?.coefficientRelativeToMain || 1)
                );
          columns[column.indexOf("isServiceType")] = (
            <Text>{item.isServiceType ? "Xidmət" : "Məhsul"}</Text>
          );
          columns[column.indexOf("isWithoutSerialNumber")] = (
            <Text>{item.isWithoutSerialNumber === false ? "Hə" : "Yox"}</Text>
          );
          columns[column.indexOf("parentCatalogName")] = (
            <Text>{item.parentCatalogName}</Text>
          );
          columns[column.indexOf("catalogName")] = (
            <Text>{item.catalogName}</Text>
          );
          columns[column.indexOf("name")] = <Text>{item.name}</Text>;
          columns[column.indexOf("idNumber")] = <Text>{item.idNumber}</Text>;
          columns[column.indexOf("salesDraftQuantity")] = (
            <Text>
              {formatNumberToLocale(
                roundTo(Number(salesDraftQuantity || 0), 4)
              )}
            </Text>
          );
          columns[column.indexOf("bronQuantity")] = (
            <Text>
              {formatNumberToLocale(roundTo(Number(bronQuantity || 0), 4))}
            </Text>
          );
          columns[column.indexOf("consignmentQuantity")] = (
            <Text>
              {formatNumberToLocale(
                roundTo(Number(item.consignmentQuantity || 0), 4)
              )}
            </Text>
          );
          columns[column.indexOf("totalQuantity")] = (
            <Text>
              {formatNumberToLocale(
                roundTo(Number(item.totalQuantity || 0), 4)
              )}
            </Text>
          );
          columns[column.indexOf("manufacturerName")] = (
            <Text>
              {item.manufacturerName} {item.manufacturerSurname && ""}
            </Text>
          );

          columns[column.indexOf("productCode")] = (
            <Text>{item.productCode}</Text>
          );
          columns[column.indexOf("attachmentName")] = (
            <View style={{ display: "flex", flexDirection: "row" }}>
              <Image
                src={item.attachmentUrl}
                style={{ width: 40, height: 40 }}
              />
            </View>
          );
          columns[column.indexOf("unitOfMeasurementName")] = (
            <Text>{item.unitOfMeasurementName}</Text>
          );
          columns[column.indexOf("pricePerUnit")] = (
            <View
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                gap: 5,
                pointerEvents: "box-none",
              }}
            >
              <Text>
                {formatNumberToLocale(
                  roundTo(Number(item.pricePerUnit || 0), 4)
                )}
              </Text>
              {item?.prices?.length > 0 ? (
                <ProTooltip
                  // containerStyle={{
                  //   position: "absolute",
                  //   zIndex: 1000,
                  //   width: 145,
                  //   height: "auto",
                  // }}
                  popover={
                    <View>
                      {item.prices?.map((price) => (
                        <Text key={`${item.id}-${price.id || price.name}`}>
                          {price.name}:{" "}
                          {formatNumberToLocale(
                            defaultNumberFormat(price.amount)
                          )}{" "}
                          {item.currencyCode}
                        </Text>
                      ))}
                    </View>
                  }
                  trigger={<FontAwesome name="info-circle" size={18} />}
                />
              ) : null}
            </View>
          );

          if (priceNames) {
            priceNames.forEach((priceName, index) => {
              const currentPrice = Number(
                item?.prices?.find((price) => price.name === priceName.name)
                  ?.amount
              );
              columns[column.indexOf(priceName.name)] = (
                <Text>
                  {!currentPrice
                    ? formatNumberToLocale(defaultNumberFormat(0))
                    : formatNumberToLocale(
                        defaultNumberFormat(currentPrice || 0)
                      )}
                </Text>
              );
            });
          }

          columns[column.indexOf("roadTax")] = (
            <View>
              {item.roadTaxes?.[0]?.amount ? (
                <View
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 5,
                    pointerEvents: "box-none",
                  }}
                >
                  <Text>
                    {formatNumberToLocale(
                      roundTo(Number(item.roadTaxes?.[0]?.amount || 0), 4)
                    )}{" "}
                    {item.roadTaxes[0]?.currencyCode}
                  </Text>
                  {filterLodash(item.roadTaxes, (_, index) => index !== 0)
                    ?.length > 0 ? (
                    <ProTooltip
                      // containerStyle={{
                      //   position: "absolute",
                      //   zIndex: 1000,
                      //   width: 145,
                      //   height: "auto",
                      // }}
                      popover={
                        <View>
                          {filterLodash(
                            item.roadTaxes,
                            (_, index) => index !== 0
                          )?.map((tax) => (
                            <Text
                              key={`${item.id}-${tax.id || tax.currencyCode}`}
                            >
                              {formatNumberToLocale(
                                defaultNumberFormat(tax.amount)
                              )}{" "}
                              {tax.currencyCode}
                            </Text>
                          ))}
                        </View>
                      }
                      trigger={<FontAwesome name="info-circle" size={18} />}
                    />
                  ) : null}
                </View>
              ) : (
                <Text>-</Text>
              )}
            </View>
          );
          columns[column.indexOf("quantity")] = (
            <View
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                gap: 5,
                pointerEvents: "box-none",
              }}
            >
              <Text>
                {formatNumberToLocale(defaultNumberFormat(item.quantity))}
              </Text>
              {item.quantity ? (
                <ProTooltip
                  isVisible={open === item.id}
                  onRequestClose={handleTooltipClose}
                  popover={
                    tooltipData && open === item.id ? (
                      <>
                        <View style={{ flexDirection: "row" }}>
                          <Text>
                            {formatNumberToLocale(
                              defaultNumberFormat(item.quantity)
                            )}{" "}
                          </Text>
                          <Text>{item.unitOfMeasurementName}</Text>
                        </View>
                        {productUnitOfMeasurements?.map((unit) => (
                          <Text key={unit.unitOfMeasurementName}>
                            {formatNumberToLocale(
                              defaultNumberFormat(
                                math.div(
                                  Number(item.quantity || 0),
                                  Number(unit?.coefficientRelativeToMain || 1)
                                )
                              )
                            )}{" "}
                            {unit.unitOfMeasurementName}
                          </Text>
                        ))}
                      </>
                    ) : (
                      <Text>Loading...</Text>
                    )
                  }
                  notDefaultOpen
                  onClick={() => handleTooltipOpen(item)}
                  trigger={
                    <ProButton
                      label={
                        <FontAwesome
                          name="info-circle"
                          size={20}
                          color="black"
                        />
                      }
                      padding={"0px"}
                      flex={false}
                      type="transparent"
                    />
                  }
                />
              ) : null}
            </View>
          );
          columns[column.indexOf("minPrice")] = (
            <Text>
              {formatNumberToLocale(defaultNumberFormat(item.minPrice))}
            </Text>
          );
          columns[column.indexOf("maxPrice")] = (
            <Text>
              {formatNumberToLocale(defaultNumberFormat(item.maxPrice))}
            </Text>
          );
          columns[column.indexOf("avgPrice")] = (
            <Text>
              {formatNumberToLocale(defaultNumberFormat(item.avgPrice))}
            </Text>
          );
          columns[column.indexOf("lastPrice")] = (
            <Text>
              {formatNumberToLocale(defaultNumberFormat(item.lastPrice))}
            </Text>
          );
          columns[column.indexOf("lifetime")] = (
            <Text>
              {formatNumberToLocale(defaultNumberFormat(item.lifetime))}
            </Text>
          );
          columns[column.indexOf("minimumStockQuantity")] = (
            <Text>
              {formatNumberToLocale(
                defaultNumberFormat(item.minimumStockQuantity)
              )}
            </Text>
          );
          columns[column.indexOf("isDeleted")] = (
            <Text>{item.isDeleted ? "Silinib" : "Aktiv"}</Text>
          );
          columns[column.indexOf("labels")] = (
            <View
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                pointerEvents: "box-none",
              }}
            >
              <Text>{item.labels[0]?.name}</Text>
              {item?.labels?.length > 0 ? (
                <ProTooltip
                  // containerStyle={{
                  //   position: "absolute",
                  //   zIndex: 1000,
                  //   width: 145,
                  //   height: "auto",
                  // }}
                  popover={
                    <View>
                      {item.labels?.map((label) => (
                        <Text key={`${item.id}-${label.id || label.name}`}>
                          {label.name}
                        </Text>
                      ))}
                    </View>
                  }
                  trigger={
                    <View
                      style={{
                        backgroundColor: "#45a8e2",
                        borderRadius: 50,
                        width: 24,
                        height: 24,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Text>{item?.labels?.length}</Text>
                    </View>
                  }
                />
              ) : null}
            </View>
          );
          columns[column.indexOf("brandName")] = <Text>{item.brandName}</Text>;
          columns[column.indexOf("barcode")] = <Text>{item.barcode}</Text>;
          columns[column.indexOf("description")] = (
            <Text>{item.description}</Text>
          );
          return [
            <Text>{(currentPage - 1) * pageSize + index + 1}</Text>,
            ...columns,
          ];
        }),
      });
      const lastColumns = [];

      lastColumns[column.indexOf("consignmentQuantity")] = (
        <Text style={{ color: "white", fontSize: 14, fontWeight: "bold" }}>
          {formatNumberToLocale(
            defaultNumberFormat(
              products.reduce(
                (totalPrice, { consignmentQuantity }) =>
                  math.add(totalPrice, Number(consignmentQuantity || 0)),
                0
              )
            )
          )}
        </Text>
      );
      lastColumns[column.indexOf("totalQuantity")] = (
        <Text style={{ color: "white", fontSize: 14, fontWeight: "bold" }}>
          {formatNumberToLocale(
            defaultNumberFormat(
              products.reduce(
                (totalPrice, { totalQuantity }) =>
                  math.add(totalPrice, Number(totalQuantity || 0)),
                0
              )
            )
          )}
        </Text>
      );

      lastColumns[column.indexOf("quantity")] = (
        <Text style={{ color: "white", fontSize: 14, fontWeight: "bold" }}>
          {formatNumberToLocale(
            defaultNumberFormat(
              products.reduce(
                (totalPrice, { quantity }) =>
                  math.add(totalPrice, Number(quantity || 0)),
                0
              )
            )
          )}
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
    allBusinessUnits,
    mainCurrency,
    products,
    productUnitOfMeasurements,
    open,
    load,
  ]);

  useEffect(() => {
    if (priceNames && tableSettings) {
      const columnsConfig = tableSettings?.["ProductsForMob"]?.columnsOrder;
      if (columnsConfig?.length > 0 && columnsConfig !== null) {
        const parseData = JSON.parse(columnsConfig);
        const columns = parseData
          .filter((column) => column.visible === true)
          .map((column) => column.dataIndex);

        const indexToCut = columns.indexOf("otherPrices");

        if (indexToCut !== -1) {
          let newArray = [
            ...columns.slice(0, indexToCut),
            ...priceNames.map((item) => item.name),
            ...columns.slice(indexToCut + 1),
          ];

          setVisibleColumns(newArray);
        } else {
          setVisibleColumns(columns);
        }
        setTableSettingData(parseData);
      } else if (columnsConfig == null) {
        const column = PRODUCT_TABLE_SETTING_DATA.filter(
          (column) => column.visible === true
        ).map((column) => column.dataIndex);
        const indexToCut = column.indexOf("otherPrices");
        if (indexToCut !== -1) {
          let newArray = [
            ...column.slice(0, indexToCut),
            ...priceNames.map((item) => item.name),
            ...column.slice(indexToCut + 1),
          ];

          setVisibleColumns(newArray);
        } else {
          setVisibleColumns(column);
        }
        setTableSettingData(PRODUCT_TABLE_SETTING_DATA);
      }
    } else {
      if (priceNames) {
        const column = PRODUCT_TABLE_SETTING_DATA.filter(
          (column) => column.visible === true
        ).map((column) => column.dataIndex);
        const indexToCut = column.indexOf("otherPrices");
        if (indexToCut !== -1) {
          let newArray = [
            ...column.slice(0, indexToCut),
            ...priceNames.map((item) => item.name),
            ...column.slice(indexToCut + 1),
          ];

          setVisibleColumns(newArray);
        } else {
          setVisibleColumns(column);
        }
        setTableSettingData(PRODUCT_TABLE_SETTING_DATA);
      }
    }
  }, [tableSettings, priceNames]);

  const handleSaveSettingModal = (column) => {
    const tableColumn = column
      .filter((col) => col.visible === true)
      .map((col) => col.dataIndex);
    const filterColumn = column.filter((col) => col.dataIndex !== "id");
    const filterColumnData = JSON.stringify(filterColumn);

    createSettings({
      moduleName: "ProductsForMob",
      columnsOrder: filterColumnData,
    }).then((res) => {
      const newTableSettings = {
        ...tableSettings,
        [`ProductsForMob`]: { columnsOrder: filterColumnData },
      };
      setTableSettings(newTableSettings);
    });
    setVisibleColumns(tableColumn);
    setTableSettingData(column);

    setSettingVisible(false);
  };
  const handlePaginationChange = (value) => {
    onFilter("page", value);
    return (() => setCurrentPage(value))();
  };
  return (
    <>
      <FilterModal
        isVisible={filterVisible}
        setIsVisible={setFilterVisible}
        setFilterCount={setFilterCount}
        filter={filter}
        setFilter={setFilter}
        onBlur={props.onBlur}
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
          AllStandartColumns={PRODUCT_TABLE_SETTING_DATA}
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
            <ProButton
              label={
                <>
                  <MaterialIcons name="post-add" size={18} />{" "}
                  <Text>Yeni məhsul </Text>
                </>
              }
              onClick={() => navigation.push("AddProduct")}
              buttonBorder={{ marginLeft: 14 }}
              type="primary"
              defaultStyle={{ borderRadius: 5 }}
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
            </View>
            <View style={{ marginBottom: 30 }}>
              <Pagination
                totalItems={productsCount}
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
};

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
  buttonTabStyle: {
    borderWidth: 1,
    borderRadius: 30,
    borderColor: "#55ab80",
    width: "50%",
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

export default Products;
