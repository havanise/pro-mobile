/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useMemo, useContext } from "react";
import { Table, TableWrapper, Row, Cell } from "react-native-reanimated-table";
import Pagination from "@cherry-soft/react-native-basic-pagination";
import {
  ProAsyncSelect,
  ProText,
  ProButton,
  ProInput,
  ProTooltip,
  SettingModal,
} from "../../components";
import {
  fetchProducts,
  fetchProductCount,
  fetchSalesPrice,
  createSettings,
} from "../../api";
import { AntDesign } from "@expo/vector-icons";
import {
  re_amount,
  formatNumberToLocale,
  defaultNumberFormat,
  fullDateTimeWithSecond,
  roundToDown,
} from "../../utils";
import {
  Text,
  TextInput,
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
} from "react-native";
import InvoiceModalWithSN from "../InvoiceModalWithSN";
import { useFilterHandle } from "../../hooks";
import moment from "moment";
import { ProductSelectSetting_Table_Data } from "../../utils/table-config/salesBuyModule";
import { TenantContext } from "../../context";

const math = require("exact-math");

const tableData = {
  tableHead: [
    "No",
    "Kataloq",
    "Alt kataloq",
    "Məhsul adı",
    "Ölçü vahidi",
    "Qiymət",
    "Anbardakı miqdar",
    "Say",
  ],
  widthArr: [50, 140, 140, 140, 100, 140, 140, 140],
  tableData: [],
};

const SelectFromProductModal = (props) => {
  const {
    isVisible = false,
    setSelectedProducts,
    handleModal = () => {},
    stockTo = false,
    startDate = false,
    handleProductPriceType = () => {},
    isDraft = false,
    isCounterparty = false,
    isReturnFrom = false,
    isConsigmentSales = false,
    isReturnFromConsigmet = false,
    selectedProducts,
    contactId,
    type,
    getValues,
    setDiscount,
    applylastPrice = false,
    autofillDiscountPrice,
  } = props;

  const { BUSINESS_TKN_UNIT, tableSettings, setTableSettings } =
    useContext(TenantContext);

  const [data, setData] = useState(tableData);
  const [product, setProduct] = useState([]);
  const [productCount, setProductCount] = useState(0);
  const [settingVisible, setSettingVisible] = useState(false);
  const [tableSettingData, setTableSettingData] = useState(
    ProductSelectSetting_Table_Data
  );
  const [selectedInvoiceProductsFromModal, setSelectedInvoiceProductFromModal] =
    useState([]);
  const [pageSize, setPageSize] = useState(8);
  const [currentPage, setCurrentPage] = useState(1);
  const [serialNumber, setSerialNumber] = useState(null);
  const [quantities, setQuantities] = useState({});
  const [showOnlySelected, setShowOnlySelected] = useState(false);
  const [selectedRowId, setSelectedRowId] = useState(undefined);
  const [invoiceModalWithSN, setInvoiceModalWithSN] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState([]);
  const removeStockFilter =
    isReturnFromConsigmet || isConsigmentSales || isReturnFrom;
  const selectedSeiralNumberProduct = useMemo(
    () =>
      selectedInvoiceProductsFromModal?.find(
        (item) => item?.id === selectedRowId
      ),
    [selectedInvoiceProductsFromModal, selectedRowId]
  );

  useEffect(() => {
    const columns = [];
    let column = visibleColumns;
    if (visibleColumns !== undefined && product) {
      setData({
        tableHead: [
          "No",
          ...visibleColumns.map((item) => {
            return ProductSelectSetting_Table_Data.find(
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
        tableData: product.map((row, index) => {
          columns[column.indexOf("parentCatalogName")] = (
            <ProTooltip
              containerStyle={{ width: 145, height: "auto" }}
              popover={<Text>{row.parentCatalogName || ""}</Text>}
              trigger={
                <Text>
                  {row.parentCatalogName ? row.parentCatalogName?.trim() : "-"}
                </Text>
              }
            />
          );
          columns[column.indexOf("catalogName")] = (
            <ProTooltip
              containerStyle={{ width: 145, height: "auto" }}
              popover={<Text>{row.catalogName || ""}</Text>}
              trigger={
                <Text>{row.catalogName ? row.catalogName?.trim() : "-"}</Text>
              }
            />
          );
          columns[column.indexOf("name")] = <Text>{row.name}</Text>;
          columns[column.indexOf("unitOfMeasurementName")] = (
            <ProTooltip
              containerStyle={{ width: 145, height: "auto" }}
              popover={<Text>{row.unitOfMeasurementName || ""}</Text>}
              trigger={
                <Text>
                  {row.unitOfMeasurementName
                    ? row.unitOfMeasurementName?.trim()
                    : "-"}
                </Text>
              }
            />
          );
          columns[column.indexOf("pricePerUnit")] = (
            <Text>
              {formatNumberToLocale(defaultNumberFormat(row.pricePerUnit))}
              {row.currencyCode}
            </Text>
          );
          columns[column.indexOf("quantity")] = (
            <Text>
              {formatNumberToLocale(defaultNumberFormat(row.quantity))}
            </Text>
          );
          columns[column.indexOf("Quantity")] = (
            <View
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <ProButton
                label={<AntDesign name="minus" size={16} color="#dedede" />}
                type="transparent"
                style={{ width: "15%", borderWidth: 1 }}
                defaultStyle={{ borderRadius: 5 }}
                flex={false}
                onClick={() => decreaseQuantity(row.id, row)}
              />
              <TextInput
                keyboardType="numeric"
                value={
                  `${
                    selectedInvoiceProductsFromModal?.find(
                      ({ id }) => id === row.id
                    )?.invoiceQuantity || ""
                  }` || ""
                }
                placeholder="0"
                onChangeText={(value) => handleQuantityChange(value, row)}
                disabled={!row.isWithoutSerialNumber}
                style={{
                  margin: 5,
                  padding: 5,
                  height: "60%",
                  width: "50%",
                  borderWidth: 1,
                  borderRadius: 5,
                  borderColor: "#D0DBEA",
                }}
              />
              <ProButton
                label={
                  <AntDesign name="pluscircleo" size={16} color="#dedede" />
                }
                type="transparent"
                style={{ width: "15%", borderWidth: 1 }}
                defaultStyle={{ borderRadius: 5 }}
                flex={false}
                onClick={() => increaseQuantity(row)}
              />
            </View>
          );
          return [
            <Text>{(currentPage - 1) * pageSize + index + 1}</Text>,
            ...columns,
          ];
        }),
      });
    }
  }, [visibleColumns, product, selectedInvoiceProductsFromModal]);

  useEffect(() => {
    const columnsConfig =
      tableSettings?.["SelectFromProductModalForMob"]?.columnsOrder;
    if (columnsConfig?.length > 0 && columnsConfig !== null) {
      const parseData = JSON.parse(columnsConfig);
      const columns = parseData
        .filter((column) => column.visible === true)
        .map((column) => column.dataIndex);
      setVisibleColumns(columns);
      setTableSettingData(parseData);
    } else if (columnsConfig == null) {
      const column = ProductSelectSetting_Table_Data.filter(
        (column) => column.visible === true
      ).map((column) => column.dataIndex);
      setVisibleColumns(column);
      setTableSettingData(ProductSelectSetting_Table_Data);
    }
  }, [tableSettings]);

  const increaseQuantity = (row) => {
    if (!row.isWithoutSerialNumber) {
      setSelectedRowId(row.id);
      toggleInvoiceModalWithSN();
    }
    const isProductSelected = selectedInvoiceProductsFromModal.some(
      (product) => product.id === row.id
    );
    // const remainingDecimal = row.quantity - Math.floor(row.quantity);
    const updatedSelectedProducts = selectedInvoiceProductsFromModal.map(
      (product) => {
        if (product.id === row.id) {
          const newQuantity = row?.isWithoutSerialNumber
            ? math.add(Number(product.invoiceQuantity ?? 0) || 0, 1)
            : product?.invoiceQuantity;
          const quantity = Math.min(newQuantity, row.quantity);

          setQuantities((prevQuantities) => ({
            ...prevQuantities,
            [row.id]: quantity,
          }));

          return {
            ...product,
            invoiceQuantity: quantity,
          };
        }
        return product;
      }
    );
    if (!isProductSelected && row.quantity > 0) {
      const newQuantity = math.add(
        Number(product.invoiceQuantity ?? 0) || 0,
        1
      );
      const quantity = row.isWithoutSerialNumber
        ? Math.min(newQuantity, row.quantity)
        : 0;
      updatedSelectedProducts.push({
        ...row,
        id: row.id,
        invoiceQuantity: quantity,
      });

      setQuantities((prevQuantities) => ({
        ...prevQuantities,
        [row.id]: quantity,
      }));
    }
    setSelectedInvoiceProductFromModal(updatedSelectedProducts);
  };
  const decreaseQuantity = (productId, row) => {
    if (!row.isWithoutSerialNumber) {
      setSelectedRowId(row.id);
      toggleInvoiceModalWithSN();
    } else {
      setQuantities((prevQuantities) => ({
        ...prevQuantities,
        [productId]: Math.max(
          math.sub(Number(prevQuantities[productId] ?? 0) || 0, 1),
          0
        ),
      }));

      const isProductSelected = selectedInvoiceProductsFromModal.some(
        (product) => product.id === productId
      );
      const updatedSelectedProducts = selectedInvoiceProductsFromModal
        ?.map((product) => {
          if (product.id === productId) {
            return {
              ...product,
              invoiceQuantity: Math.max(
                math.sub(Number(product.invoiceQuantity ?? 0) || 0, 1),
                0
              ),
            };
          }
          return product;
        })
        .filter((product) => product.invoiceQuantity > 0);
      if (!isProductSelected && quantities[productId] > 0) {
        updatedSelectedProducts.push({
          ...product,
          invoiceQuantity: quantities[productId],
        });
      }
      setSelectedInvoiceProductFromModal(updatedSelectedProducts);
    }
  };

  const [filter, onFilter, setFilter] = useFilterHandle(
    {
      limit: pageSize,
      page: currentPage,
      businessUnitIds:
        BUSINESS_TKN_UNIT && BUSINESS_TKN_UNIT !== null
          ? [BUSINESS_TKN_UNIT]
          : undefined,
      isDeleted: 0,
      inStock: 1,
      hasBarcode: type === "barcode" ? 1 : undefined,
      invoiceOperationDate: moment(
        getValues(!startDate ? "operationDate" : "startDate")
      )?.format(fullDateTimeWithSecond),
      stocks:
        type === "barcode"
          ? undefined
          : removeStockFilter
          ? null
          : [getValues(!stockTo ? "stockFrom" : "stockTo")],
      priceInvoiceTypes: applylastPrice ? [2] : undefined,
      withMinMaxPrice: applylastPrice ? 1 : undefined,
      contacts:
        isCounterparty || isReturnFromConsigmet
          ? [
              getValues(
                isReturnFrom || isReturnFromConsigmet ? "client" : "supplier"
              ),
            ]
          : null,
    },
    () => {
      fetchProducts({
        filter: getFilters(),
      }).then((productData) => {
        setProduct(productData);
      });
      fetchProductCount({
        filter: getFilters(),
      }).then((productData) => {
        setProductCount(productData);
      });
    }
  );

  function getFilters() {
    const filters = {
      ...filter,
      limit: pageSize,
      page: currentPage,
    };

    const barcodeFilters = {
      ...filter,
      hasBarcode: 1,
      stocks: undefined,
      limit: pageSize,
      page: currentPage,
    };
    return type === "barcode" ? barcodeFilters : filters;
  }

  const handlePaginationChange = (value) => {
    onFilter("page", value);
    return (() => setCurrentPage(value))();
  };

  const handleQuantityChange = (e, row) => {
    if (!row.isWithoutSerialNumber || e < 0) {
      return;
    } else {
      const limit =
        Number(row?.quantity) >= 0 ? Number(row?.quantity) : 10000000;
      if (re_amount.test(e) && e <= limit) {
        const isProductSelected = selectedInvoiceProductsFromModal.some(
          (product) => product.id === row.id
        );
        const updatedSelectedProducts = selectedInvoiceProductsFromModal.map(
          (product) => {
            if (product.id === row.id && row.quantity >= e) {
              if (e === "") {
                return {
                  ...product,
                  invoiceQuantity: "",
                };
              } else {
                return {
                  ...product,
                  invoiceQuantity: e,
                };
              }
            }
            return product;
          }
        );
        if (
          !isProductSelected &&
          parseFloat(row.quantity ?? 0) >= parseFloat(e ?? 0)
        ) {
          updatedSelectedProducts.push({
            ...row,
            id: row.id,
            invoiceQuantity: e,
          });
        }
        setSelectedInvoiceProductFromModal(
          updatedSelectedProducts.filter(
            (product) => product.invoiceQuantity > 0
          )
        );
      }
    }
  };

  const toggleInvoiceModalWithSN = () => {
    setInvoiceModalWithSN((wasVisible) => !wasVisible);
  };

  useEffect(() => {
    if (isVisible) {
      setFilter({
        ...filter,
        invoiceOperationDate: moment(
          getValues(!startDate ? "date" : "startDate")
        )?.format(fullDateTimeWithSecond),
        stocks: removeStockFilter
          ? null
          : [getValues(!stockTo ? "stockFrom" : "stockTo")],
        contacts:
          isCounterparty || isReturnFromConsigmet
            ? [
                getValues(
                  isReturnFrom || isReturnFromConsigmet ? "client" : "supplier"
                ),
              ]
            : null,
      });
    }
  }, [isVisible]);

  useEffect(() => {
    if (isVisible && selectedProducts) {
      setSelectedInvoiceProductFromModal(() => {
        const updatedModalItems = selectedProducts?.map((selectedItem) => {
          const existingItem = selectedInvoiceProductsFromModal?.find(
            (item) => item.id === selectedItem.id
          );
          if (existingItem) {
            return {
              ...existingItem,
              invoiceQuantity: selectedItem.invoiceQuantity,
              serialNumbers: selectedItem.serialNumbers,
            };
          } else {
            const { catalog } = selectedItem || {};
            return {
              ...selectedItem,
              parentCatalogName: catalog?.rootName,
              catalogName: catalog?.name,
              isWithoutSerialNumber: catalog?.isWithoutSerialNumber,
              isServiceType: catalog?.isServiceType,
              catalogId: catalog?.id,
              //    serialNumbers:selectedItem.serialNumber
            };
          }
        });

        return updatedModalItems;
      });

      setQuantities(() => {
        const updatedQuantities = {};

        selectedProducts.forEach((items) => {
          updatedQuantities[items.id] = items.invoiceQuantity;
        });

        return updatedQuantities;
      });
    }
    if (!selectedProducts?.length) {
      setShowOnlySelected(false);
    }
  }, [isVisible, selectedProducts]);

  const handleSaveSettingModal = (column) => {
    const tableColumn = column
      .filter((col) => col.visible === true)
      .map((col) => col.dataIndex);
    const filterColumn = column.filter((col) => col.dataIndex !== "id");
    const filterColumnData = JSON.stringify(filterColumn);

    createSettings({
      moduleName: "SelectFromProductModalForMob",
      columnsOrder: filterColumnData,
    }).then((res) => {
      const newTableSettings = {
        ...tableSettings,
        [`SelectFromProductModalForMob`]: { columnsOrder: filterColumnData },
      };
      setTableSettings(newTableSettings);
    });
    setVisibleColumns(tableColumn);
    setTableSettingData(column);

    setSettingVisible(false);
  };

  const confirmModal = () => {
    updateProduct(selectedInvoiceProductsFromModal);
    handleModal();
  };

  const updateProduct = (selectedItems) => {
    const selectedProductIds = selectedItems.map(({ id }) => id);
    const selectedProduct = {};
    if (type === "barcode") {
      selectedItems.map(
        (
          {
            id,
            attachmentName,
            attachmentId,
            name,
            quantity,
            pricePerUnit,
            serialNumbers,
            discountPercentage,
            discountAmount,
            endPricePerUnit,
            total,
            unitOfMeasurementId,
            originalQuantity,
            coefficient,
            unitOfMeasurements,
            totalEndPrice,
            productCode,
            barcode,
            unitOfMeasurementName,
            draftRootInvoiceProductId,
            catalogId,
            isServiceType,
            catalogName,
            brandName,
            parentCatalogName,
            isWithoutSerialNumber,
            bronQuantity,
            salesDraftQuantity,
            invoiceQuantity,
            invoice_product_id,
          },
          index
        ) => {
          if (selectedProduct[`${id}${unitOfMeasurementId}`]) {
            selectedProduct[`${id}${unitOfMeasurementId}`] = {
              ...selectedProduct[`${id}${unitOfMeasurementId}`],
              serialNumbers: serialNumber
                ? [
                    ...selectedProduct[`${id}${unitOfMeasurementId}`]
                      .serialNumbers,
                    serialNumber,
                  ]
                : undefined,
              invoiceQuantity: `${math.add(
                Number(quantity || 0),
                selectedProduct[`${id}${unitOfMeasurementId}`].invoiceQuantity
              )}`.slice(0, 6),
              barcode,
              attachmentName,
              attachmentId,
              productId: id,
              // totalPricePerProduct: defaultNumberFormat(
              //     total || 0
              // ),
              totalPricePerProduct: math.mul(
                Number(invoicePrice || pricePerUnit || 0),
                Number(invoiceQuantity || 1)
              ),
              totalEndPricePerProduct: math.add(
                defaultNumberFormat(totalEndPrice || 0),
                Number(
                  selectedProduct[`${id}${unitOfMeasurementId}`]
                    .totalEndPricePerProduct ?? 0
                )
              ),
              invoiceProducts: [
                ...selectedProduct[`${id}${unitOfMeasurementId}`]
                  .invoiceProducts,
                {
                  invoice_product_id: isDraft ? draftRootInvoiceProductId : id,
                  invoiceQuantity: invoiceQuantity,
                  originalQuantity: originalQuantity,
                  quantity: Number(quantity),
                },
              ],
            };
          } else {
            selectedProduct[`${id}${unitOfMeasurementId}`] = {
              rowOrder: index,
              id: id,
              productUniqueId: `${id}${unitOfMeasurementId}`,
              name: name,
              barcode: barcode ?? undefined,
              attachmentName: attachmentName,
              attachmentId: attachmentId,
              serialNumbers: serialNumbers ? serialNumbers : undefined,
              quantity: Number(quantity ?? 0),
              totalQuantity: Number(quantity || 0),
              invoiceQuantity: invoiceQuantity,
              unitOfMeasurementName,
              productId: id,
              hasMultiMeasurement: unitOfMeasurements?.length > 1,
              mainUnitOfMeasurementID:
                unitOfMeasurements[0]?.unitOfMeasurementId,
              discountPercentage: Number(discountPercentage || 0).toFixed(4),
              discountAmount: defaultNumberFormat(discountAmount || 0),
              discountAmountForBack: defaultNumberFormat(discountAmount || 0),
              discountedPrice: defaultNumberFormat(endPricePerUnit || 0),
              // totalPricePerProduct: defaultNumberFormat(
              //     total || 0
              // ),
              totalPricePerProduct: math.mul(
                Number(invoicePrice || pricePerUnit || 0),
                Number(invoiceQuantity || 1)
              ),
              totalEndPricePerProduct: defaultNumberFormat(totalEndPrice || 0),
              unitOfMeasurementId,
              unitOfMeasurementID: unitOfMeasurementId,
              coefficientRelativeToMain: coefficient,
              originalQuantity: originalQuantity,
              unitOfMeasurements: [
                {
                  id: unitOfMeasurementId,
                  unitOfMeasurementName,
                  coefficient,
                  coefficientRelativeToMain: coefficient,
                  barcode,
                },
                ...(unitOfMeasurements
                  ?.filter(
                    (unit) => unitOfMeasurementId !== unit?.unitOfMeasurementId
                  )
                  ?.map((unit) => ({
                    ...unit,
                    id: unit?.unitOfMeasurementId,
                  })) ?? []),
              ],
              invoicePrice: roundToDown(
                Number(invoicePrice || pricePerUnit),
                2
              ),
              mainInvoicePrice: roundToDown(Number(pricePerUnit), 2),
              invoiceProducts: invoice_product_id
                ? [
                    {
                      invoice_product_id: invoice_product_id,
                      invoiceQuantity: Number(invoiceQuantity ?? 0),
                    },
                  ]
                : [],
              productCode,
              product_code: productCode,
              catalog: {
                id: catalogId,
                name: catalogName,
                rootName: parentCatalogName,
                isWithoutSerialNumber: isWithoutSerialNumber,
                isServiceType,
              },
              bronQuantity,
              salesDraftQuantity,
              brandName,
              defaultSalesPriceInMainCurrency: defaultSalesPriceInMainCurrency
                ? defaultSalesPriceInMainCurrency
                : roundToDown(Number(invoicePrice || pricePerUnit), 2),
            };
          }
        }
      );

      setSelectedProducts([
        ...Object.values(selectedProduct || {}).sort(
          (a, b) => a?.rowOrder - b?.rowOrder
        ),
      ]);
    } else {
      if (!applylastPrice) {
        fetchSalesPrice({
          filter: {
            currency: getValues("currency"),
            ...(type === "sales"
              ? {
                  stock: getValues("stockFrom"),
                  manager: getValues("saleManager"),
                }
              : []),
            contactPrice: contactId,
            products: selectedProductIds,
            businessUnitIds: BUSINESS_TKN_UNIT
              ? [BUSINESS_TKN_UNIT]
              : undefined,
          },
        }).then((priceTypes) => {
          selectedItems.map(
            (
              {
                id,
                attachmentName,
                attachmentId,
                name,
                quantity,
                pricePerUnit,
                serialNumbers,
                discountPercentage,
                discountAmount,
                endPricePerUnit,
                total,
                unitOfMeasurementId,
                originalQuantity,
                coefficient,
                unitOfMeasurements,
                totalEndPrice,
                productCode,
                barcode,
                unitOfMeasurementName,
                draftRootInvoiceProductId,
                catalogId,
                isServiceType,
                catalogName,
                brandName,
                parentCatalogName,
                isWithoutSerialNumber,
                bronQuantity,
                salesDraftQuantity,
                invoiceQuantity,
                invoiceProducts,
                isVatFree,
                invoicePrice,
                taxAmountPercentage,
                defaultSalesPriceInMainCurrency,
              },
              index
            ) => {
              const productPricesTypeObj = handleProductPriceType(
                priceTypes[id],
                unitOfMeasurementId,
                autofillDiscountPrice
              );
              if (selectedProduct[`${id}${unitOfMeasurementId}`]) {
                selectedProduct[`${id}${unitOfMeasurementId}`] = {
                  ...selectedProduct[`${id}${unitOfMeasurementId}`],
                  serialNumbers: serialNumber
                    ? [
                        ...selectedProduct[`${id}${unitOfMeasurementId}`]
                          .serialNumbers,
                        serialNumber,
                      ]
                    : undefined,
                  invoiceQuantity: `${math.add(
                    Number(quantity || 0),
                    selectedProduct[`${id}${unitOfMeasurementId}`]
                      .invoiceQuantity
                  )}`.slice(0, 6),
                  barcode,
                  attachmentName,
                  attachmentId,
                  productId: id,
                  totalPricePerProduct: math.mul(
                    Number(invoicePrice || pricePerUnit || 0),
                    Number(invoiceQuantity || 1)
                  ),
                  totalEndPricePerProduct: math.add(
                    defaultNumberFormat(totalEndPrice || 0),
                    Number(
                      selectedProduct[`${id}${unitOfMeasurementId}`]
                        .totalEndPricePerProduct ?? 0
                    )
                  ),
                  invoiceProducts: [
                    ...selectedProduct[`${id}${unitOfMeasurementId}`]
                      .invoiceProducts,
                    {
                      invoice_product_id: isDraft
                        ? draftRootInvoiceProductId
                        : id,
                      invoiceQuantity: invoiceQuantity,
                      originalQuantity: originalQuantity,
                      quantity: Number(quantity),
                    },
                  ],
                };
              } else {
                const invoicePriceNew = autofillDiscountPrice
                  ? productPricesTypeObj?.invoicePrice
                    ? Number(productPricesTypeObj?.invoicePrice)
                    : null
                  : null;

                selectedProduct[`${id}${unitOfMeasurementId}`] = {
                  rowOrder: index,
                  id: id,
                  productUniqueId: `${id}${unitOfMeasurementId}`,
                  name: name,
                  barcode: barcode ?? undefined,
                  attachmentName: attachmentName,
                  attachmentId: attachmentId,
                  serialNumbers: serialNumbers ? serialNumbers : undefined,
                  quantity: Number(quantity ?? 0),
                  totalQuantity: Number(quantity || 0),
                  invoiceQuantity: invoiceQuantity,
                  unitOfMeasurementName,
                  productId: id,
                  hasMultiMeasurement: unitOfMeasurements?.length > 1,
                  mainUnitOfMeasurementID:
                    unitOfMeasurements[0]?.unitOfMeasurementId,
                  discountPercentage: Number(discountPercentage || 0).toFixed(
                    4
                  ),
                  discountAmount: defaultNumberFormat(discountAmount || 0),
                  discountAmountForBack: defaultNumberFormat(
                    discountAmount || 0
                  ),
                  discountedPrice: defaultNumberFormat(
                    endPricePerUnit || pricePerUnit || 0
                  ),
                  totalPricePerProduct: math.mul(
                    Number(invoicePrice || pricePerUnit || 0),
                    Number(invoiceQuantity || 1)
                  ),
                  totalEndPricePerProduct: defaultNumberFormat(
                    totalEndPrice || 0
                  ),
                  unitOfMeasurementId,
                  unitOfMeasurementID: unitOfMeasurementId,
                  coefficientRelativeToMain: coefficient,
                  originalQuantity: originalQuantity,
                  unitOfMeasurements: [
                    {
                      id: unitOfMeasurementId,
                      unitOfMeasurementName,
                      coefficient,
                      coefficientRelativeToMain: coefficient,
                      barcode,
                    },
                    ...(unitOfMeasurements
                      ?.filter(
                        (unit) =>
                          unitOfMeasurementId !== unit?.unitOfMeasurementId
                      )
                      ?.map((unit) => ({
                        ...unit,
                        id: unit?.unitOfMeasurementId,
                      })) ?? []),
                  ],
                  prices: priceTypes[id],
                  invoicePrice: productPricesTypeObj?.invoicePrice
                    ? Number(productPricesTypeObj?.invoicePrice)
                    : null,
                  mainInvoicePrice: roundToDown(Number(pricePerUnit), 2),
                  productPricetype: productPricesTypeObj?.productPriceType,
                  invoiceProducts:
                    invoiceProducts?.map((item) => ({
                      ...item,
                      invoiceQuantity: item.invoiceQuantity
                        ? item.invoiceQuantity
                        : 1,
                    })) || [],
                  productCode,
                  product_code: productCode,
                  catalog: {
                    id: catalogId,
                    name: catalogName,
                    rootName: parentCatalogName,
                    isWithoutSerialNumber: isWithoutSerialNumber,
                    isServiceType,
                  },
                  bronQuantity,
                  salesDraftQuantity,
                  brandName,
                  defaultSalesPriceInMainCurrency:
                    defaultSalesPriceInMainCurrency
                      ? defaultSalesPriceInMainCurrency
                      : roundToDown(Number(invoicePrice || pricePerUnit), 2),
                  isVatFree,
                  taxAmountPercentage: taxAmountPercentage,
                  taxAmount: undefined,
                  totalTaxAmount: undefined,
                  ...(type === "sales"
                    ? {
                        autoDiscountedPrice:
                          productPricesTypeObj?.discountedPrice,
                        discountedPrice:
                          defaultNumberFormat(
                            productPricesTypeObj?.discountedPrice ??
                              (invoicePrice && Number(invoicePrice) !== 0)
                              ? Number(invoicePrice)
                              : invoicePriceNew ?? 0
                          ) ?? null,
                        discountPercentage:
                          productPricesTypeObj?.discountedPrice
                            ? math
                                .mul(
                                  math.div(
                                    math.sub(
                                      invoicePrice && Number(invoicePrice) !== 0
                                        ? Number(invoicePrice)
                                        : invoicePriceNew ?? 0,
                                      productPricesTypeObj?.discountedPrice ?? 0
                                    ) || 0,
                                    Number(
                                      invoicePrice && Number(invoicePrice) !== 0
                                        ? Number(invoicePrice)
                                        : invoicePriceNew ?? 0
                                    ) || 0
                                  ) || 0,
                                  100
                                )
                                ?.toFixed(4)
                            : 0,
                        discountAmount: productPricesTypeObj?.discountedPrice
                          ? math.sub(
                              invoicePrice && Number(invoicePrice) !== 0
                                ? Number(invoicePrice)
                                : invoicePriceNew ?? 0,
                              productPricesTypeObj?.discountedPrice ?? 0
                            )
                          : 0,
                      }
                    : []),
                };
              }
            }
          );
          setSelectedProducts([
            ...Object.values(selectedProduct || {}).sort(
              (a, b) => a?.rowOrder - b?.rowOrder
            ),
          ]);
        });
      } else {
        selectedItems.map(
          (
            {
              id,
              attachmentName,
              attachmentId,
              name,
              quantity,
              pricePerUnit,
              serialNumbers,
              discountPercentage,
              discountAmount,
              endPricePerUnit,
              lastPrice,
              unitOfMeasurementId,
              originalQuantity,
              coefficient,
              unitOfMeasurements,
              totalEndPrice,
              productCode,
              barcode,
              unitOfMeasurementName,
              draftRootInvoiceProductId,
              catalogId,
              isServiceType,
              catalogName,
              brandName,
              parentCatalogName,
              isWithoutSerialNumber,
              bronQuantity,
              salesDraftQuantity,
              invoiceQuantity,
              invoiceProducts,
              isVatFree,
              coefficientRelativeToMain,
              taxAmountPercentage,
              defaultSalesPriceInMainCurrency,
            },
            index
          ) => {
            if (selectedProduct[`${id}${unitOfMeasurementId}`]) {
              selectedProduct[`${id}${unitOfMeasurementId}`] = {
                ...selectedProduct[`${id}${unitOfMeasurementId}`],
                serialNumbers: serialNumber
                  ? [
                      ...selectedProduct[`${id}${unitOfMeasurementId}`]
                        .serialNumbers,
                      serialNumber,
                    ]
                  : undefined,
                invoiceQuantity: `${math.add(
                  Number(quantity || 0),
                  selectedProduct[`${id}${unitOfMeasurementId}`].invoiceQuantity
                )}`.slice(0, 6),
                barcode,
                attachmentName,
                attachmentId,
                productId: id,
                totalEndPricePerProduct: math.add(
                  defaultNumberFormat(totalEndPrice || 0),
                  Number(
                    selectedProduct[`${id}${unitOfMeasurementId}`]
                      .totalEndPricePerProduct ?? 0
                  )
                ),
                invoiceProducts: [
                  ...selectedProduct[`${id}${unitOfMeasurementId}`]
                    .invoiceProducts,
                  {
                    invoice_product_id: isDraft
                      ? draftRootInvoiceProductId
                      : id,
                    invoiceQuantity: invoiceQuantity,
                    originalQuantity: originalQuantity,
                    quantity: Number(quantity),
                  },
                ],
              };
            } else {
              const priceTypes = [];
              const price = math.mul(
                parseFloat(lastPrice ?? 0),
                coefficientRelativeToMain ?? 1
              );
              const productPricesTypeObj = { invoicePrice: price };

              const invoicePriceNew = productPricesTypeObj?.invoicePrice
                ? Number(productPricesTypeObj?.invoicePrice)
                : null;

              selectedProduct[`${id}${unitOfMeasurementId}`] = {
                lastPrice: lastPrice,
                rowOrder: index,
                id: id,
                productUniqueId: `${id}${unitOfMeasurementId}`,
                name: name,
                barcode: barcode ?? undefined,
                attachmentName: attachmentName,
                attachmentId: attachmentId,
                serialNumbers: serialNumbers ? serialNumbers : undefined,
                quantity: Number(quantity ?? 0),
                totalQuantity: Number(quantity || 0),
                invoiceQuantity: invoiceQuantity,
                unitOfMeasurementName,
                productId: id,
                hasMultiMeasurement: unitOfMeasurements?.length > 1,
                mainUnitOfMeasurementID:
                  unitOfMeasurements[0]?.unitOfMeasurementId,
                discountPercentage: Number(discountPercentage || 0).toFixed(4),
                discountAmount: defaultNumberFormat(discountAmount || 0),
                discountAmountForBack: defaultNumberFormat(discountAmount || 0),
                discountedPrice: defaultNumberFormat(
                  endPricePerUnit || pricePerUnit || 0
                ),
                totalPricePerProduct: math.mul(
                  Number(
                    productPricesTypeObj?.invoicePrice
                      ? Number(productPricesTypeObj?.invoicePrice)
                      : null || pricePerUnit || 0
                  ),
                  Number(invoiceQuantity || 1)
                ),
                totalEndPricePerProduct: defaultNumberFormat(
                  totalEndPrice || 0
                ),
                unitOfMeasurementId,
                unitOfMeasurementID: unitOfMeasurementId,
                coefficientRelativeToMain: coefficient,
                originalQuantity: originalQuantity,
                unitOfMeasurements: [
                  {
                    id: unitOfMeasurementId,
                    unitOfMeasurementName,
                    coefficient,
                    coefficientRelativeToMain: coefficient,
                    barcode,
                  },
                  ...(unitOfMeasurements
                    ?.filter(
                      (unit) =>
                        unitOfMeasurementId !== unit?.unitOfMeasurementId
                    )
                    ?.map((unit) => ({
                      ...unit,
                      id: unit?.unitOfMeasurementId,
                    })) ?? []),
                ],
                prices: priceTypes[id],
                invoicePrice: productPricesTypeObj?.invoicePrice
                  ? Number(productPricesTypeObj?.invoicePrice)
                  : null,
                mainInvoicePrice: productPricesTypeObj?.invoicePrice,
                productPricetype: productPricesTypeObj?.productPriceType,
                invoiceProducts:
                  invoiceProducts?.map((item) => ({
                    ...item,
                    invoiceQuantity: item.invoiceQuantity
                      ? item.invoiceQuantity
                      : 1,
                  })) || [],
                productCode,
                product_code: productCode,
                catalog: {
                  id: catalogId,
                  name: catalogName,
                  rootName: parentCatalogName,
                  isWithoutSerialNumber: isWithoutSerialNumber,
                  isServiceType,
                },
                bronQuantity,
                salesDraftQuantity,
                brandName,
                defaultSalesPriceInMainCurrency: defaultSalesPriceInMainCurrency
                  ? defaultSalesPriceInMainCurrency
                  : roundToDown(
                      Number(
                        productPricesTypeObj?.invoicePrice || pricePerUnit
                      ),
                      2
                    ),
                isVatFree,
                taxAmountPercentage: taxAmountPercentage,
                taxAmount: undefined,
                totalTaxAmount: undefined,
                ...(type === "sales"
                  ? {
                      autoDiscountedPrice:
                        productPricesTypeObj?.discountedPrice,
                      discountedPrice:
                        defaultNumberFormat(
                          productPricesTypeObj?.discountedPrice ??
                            (productPricesTypeObj?.invoicePrice &&
                              Number(productPricesTypeObj?.invoicePrice) !== 0)
                            ? Number(productPricesTypeObj?.invoicePrice)
                            : invoicePriceNew ?? 0
                        ) ?? null,
                      discountPercentage: productPricesTypeObj?.discountedPrice
                        ? math
                            .mul(
                              math.div(
                                math.sub(
                                  productPricesTypeObj?.invoicePrice &&
                                    Number(
                                      productPricesTypeObj?.invoicePrice
                                    ) !== 0
                                    ? Number(productPricesTypeObj?.invoicePrice)
                                    : invoicePriceNew ?? 0,
                                  productPricesTypeObj?.discountedPrice ?? 0
                                ) || 0,
                                Number(
                                  productPricesTypeObj?.invoicePrice &&
                                    Number(
                                      productPricesTypeObj?.invoicePrice
                                    ) !== 0
                                    ? Number(productPricesTypeObj?.invoicePrice)
                                    : invoicePriceNew ?? 0
                                ) || 0
                              ) || 0,
                              100
                            )
                            ?.toFixed(4)
                        : 0,
                      discountAmount: productPricesTypeObj?.discountedPrice
                        ? math.sub(
                            productPricesTypeObj?.invoicePrice &&
                              Number(productPricesTypeObj?.invoicePrice) !== 0
                              ? Number(productPricesTypeObj?.invoicePrice)
                              : invoicePriceNew ?? 0,
                            productPricesTypeObj?.discountedPrice ?? 0
                          )
                        : 0,
                    }
                  : []),
              };
            }
          }
        );
        setSelectedProducts([
          ...Object.values(selectedProduct || {}).sort(
            (a, b) => a?.rowOrder - b?.rowOrder
          ),
        ]);
      }
    }
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
          AllStandartColumns={ProductSelectSetting_Table_Data}
        />
      </Modal>
      {invoiceModalWithSN ? (
        <InvoiceModalWithSN
          stausColumn={true}
          isProductModal={true}
          product={selectedSeiralNumberProduct}
          isVisible={invoiceModalWithSN}
          toggleModal={toggleInvoiceModalWithSN}
          selectedProductsFromModal={selectedInvoiceProductsFromModal}
          setSelectedProductFromModal={setSelectedInvoiceProductFromModal}
          selectedProducts={selectedProducts}
          setSelectedProducts={setSelectedProducts}
          setDiscount={setDiscount}
          getValues={getValues}
        />
      ) : null}
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <ProText variant="heading" style={{ color: "black" }}>
            Məhsul siyahısı üzrə seç
          </ProText>
          <View
            style={{
              marginTop: 5,
              marginBottom: 5,
              borderRadius: 4,
              backgroundColor: "#fff",
              display: "flex",
            }}
          >
            <View
              style={{ display: "flex", alignItems: "flex-end", height: 400 }}
            >
              <ProButton
                label={<AntDesign name="setting" size={18} color="#55ab80" />}
                type="transparent"
                onClick={() => setSettingVisible(true)}
                defaultStyle={{ borderRadius: 5 }}
                buttonBorder={styles.buttonStyle}
                flex={false}
              />
              <ScrollView>
                <ScrollView
                  nestedScrollEnabled={true}
                  horizontal={true}
                  style={{ height: "100%", marginTop: 10 }}
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
            </View>
            <View>
              <Pagination
                totalItems={
                  showOnlySelected
                    ? selectedInvoiceProductsFromModal?.length
                    : productCount
                }
                pageSize={pageSize}
                currentPage={currentPage}
                onPageChange={handlePaginationChange}
                textStyle={{ fontSize: 6 }}
              />
            </View>
          </View>
          <View style={{ display: "flex", flexDirection: "row" }}>
            <ProButton
              label={
                selectedInvoiceProductsFromModal?.length > 0
                  ? `Təsdiq et (${selectedInvoiceProductsFromModal?.length})`
                  : `Təsdiq et`
              }
              type="primary"
              flex={false}
              onClick={confirmModal}
              style={{ width: "45%" }}
              padding={"10px 0"}
              defaultStyle={{ borderRadius: 10 }}
              disabled={!selectedInvoiceProductsFromModal?.length}
            />
          </View>
          <Pressable
            style={[styles.button, styles.buttonClose]}
            onPress={() => handleModal()}
          >
            <AntDesign name="close" size={14} color="black" />
          </Pressable>
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
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

  btn: { width: 58, height: 18, backgroundColor: "#78B7BB", borderRadius: 2 },
  btnText: { textAlign: "center", color: "#fff" },
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
  button: {
    position: "absolute",
    borderRadius: 20,
    padding: 10,
    right: 0,
  },
  head: { height: 44, backgroundColor: "#55ab80" },
  headText: {
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
    color: "white",
  },
  text: { margin: 6, fontSize: 14, textAlign: "center" },
  buttonStyle: {
    borderWidth: 1,
    borderColor: "#55ab80",
    borderRadius: 5,
    paddingLeft: 12,
    paddingRight: 12,
    marginLeft: 14,
  },
});

export default SelectFromProductModal;
