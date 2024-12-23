/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useMemo } from "react";
import { Table, TableWrapper, Row, Cell } from "react-native-reanimated-table";
import Pagination from "@cherry-soft/react-native-basic-pagination";
import {
  ProAsyncSelect,
  ProText,
  ProButton,
  ProInput,
  ProTooltip,
} from "../../components";
import { fetchProducts, fetchProductCount, fetchSalesPrice } from "../../api";
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
} from "react-native";
import InvoiceModalWithSN from "../InvoiceModalWithSN";
import { useFilterHandle } from "../../hooks";

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
    BUSINESS_TKN_UNIT,
    handleModal = () => {},
    stockTo = false,
    startDate = false,
    handleProductPriceType = () => {},
    isDraft = false,
    isCounterparty = false,
    isReturnFrom = false,
    isConsigmentSales = false,
    isReturnFromConsigmet = false,
    fetchBrands,
    fetchFilteredCatalogs,
    selectedProducts,
    contactId,
    type,
    fetchFilteredStocks,
    getValues,
    setDiscount,
  } = props;

  const [data, setData] = useState(tableData);
  const [product, setProduct] = useState([]);
  const [productCount, setProductCount] = useState(0);
  const [selectedInvoiceProductsFromModal, setSelectedInvoiceProductFromModal] =
    useState([]);
  const [allBusinessUnits, setAllBusinessUnits] = useState(undefined);
  const [componentIsMounted, setComponentIsMounted] = useState(false);
  const [catalogs, setCatalogs] = useState({ root: [], children: {} });
  const [category, setCategory] = useState(null);
  const [pageSize, setPageSize] = useState(8);
  const [currentPage, setCurrentPage] = useState(1);
  const [serialNumber, setSerialNumber] = useState(null);
  const [brands, setBrands] = useState([]);
  const [selectedCatalogs, setSelectedCatalogs] = useState([]);
  const [subcategory, setSubCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [checkBoxValue, setCheckBoxValue] = useState({});
  const [showOnlySelected, setShowOnlySelected] = useState(false);
  const [selectedRowId, setSelectedRowId] = useState(undefined);
  const [invoiceModalWithSN, setInvoiceModalWithSN] = useState(false);
  const removeStockFilter =
    isReturnFromConsigmet || isConsigmentSales || isReturnFrom;
  const selectedSeiralNumberProduct = useMemo(
    () =>
      selectedInvoiceProductsFromModal?.find(
        (item) => item?.id === selectedRowId
      ),
    [selectedInvoiceProductsFromModal, selectedRowId]
  );
  const [stocks, setStocks] = useState([]);

  const toggleShowOnlySelected = () => {
    setShowOnlySelected((prevShowOnlySelected) => !prevShowOnlySelected);
  };
  //   const {
  //     parentCatalogs,
  //     childCatalogs,
  //     handleParentCatalogsChange,
  //     handleChildCatalogsChange,
  //   } = useCatalog();

  useEffect(() => {
    setData({
      ...data,
      tableData: product.map((row, index) => {
        return [
          (currentPage - 1) * pageSize + index + 1,
          <ProTooltip
            containerStyle={{ width: 145, height: "auto" }}
            popover={<Text>{row.parentCatalogName || ""}</Text>}
          >
            <Text>
              {row.parentCatalogName ? row.parentCatalogName?.trim() : "-"}
            </Text>
          </ProTooltip>,
          <ProTooltip
            containerStyle={{ width: 145, height: "auto" }}
            popover={<Text>{row.catalogName || ""}</Text>}
          >
            <Text>{row.catalogName ? row.catalogName?.trim() : "-"}</Text>
          </ProTooltip>,
          row.name,
          <ProTooltip
            containerStyle={{ width: 145, height: "auto" }}
            popover={<Text>{row.unitOfMeasurementName || ""}</Text>}
          >
            <Text>
              {row.unitOfMeasurementName
                ? row.unitOfMeasurementName?.trim()
                : "-"}
            </Text>
          </ProTooltip>,
          <Text>
            {formatNumberToLocale(defaultNumberFormat(row.pricePerUnit))}
            {row.currencyCode}
          </Text>,
          <Text>
            {formatNumberToLocale(defaultNumberFormat(row.quantity))}
          </Text>,
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
                  )?.invoiceQuantity || 0
                }` || ""
              }
              onChange={(e) => handleQuantityChange(e.target.value, row)}
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
              label={<AntDesign name="pluscircleo" size={16} color="#dedede" />}
              type="transparent"
              style={{ width: "15%", borderWidth: 1 }}
              defaultStyle={{ borderRadius: 5 }}
              flex={false}
              onClick={() => increaseQuantity(row)}
            />
          </View>,
        ];
      }),
    });
  }, [product, selectedInvoiceProductsFromModal]);

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

  const handleCheckBox = (event, row) => {
    if (event) {
      increaseQuantity(row);
    } else {
      decreaseQuantity(row?.id);
    }
    setCheckBoxValue((prevQuantities) => ({
      ...prevQuantities,
      [row.id]: event,
    }));
  };

  const handleChange = (value, field) => {
    if (value === "") {
      onFilter(field, undefined);
      setCurrentPage(1);
      onFilter("page", 1);
    }
  };

  const [filter, onFilter, setFilter] = useFilterHandle(
    {
      limit: pageSize,
      page: currentPage,
      businessUnitIds:
        BUSINESS_TKN_UNIT !== null ? [BUSINESS_TKN_UNIT] : undefined,
      isDeleted: 0,
      inStock: 1,
      hasBarcode: type === "barcode" ? 1 : undefined,
      invoiceOperationDate: getValues(
        !startDate ? "operationDate" : "startDate"
      )?.format(fullDateTimeWithSecond),
      stocks:
        type === "barcode"
          ? undefined
          : removeStockFilter
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

  const handleDefaultFilter = (type, value) => {
    handlePaginationChange(1);
    onFilter(type, value);
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
                  invoiceQuantity: 0,
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

  const handleSearchSerialNumberFilter = (value) => {
    handleChange(1);
    if (value) {
      onFilter("invoiceProductSerialNumber", value);
    } else {
      onFilter("invoiceProductSerialNumber", null);
    }
  };

  const toggleInvoiceModalWithSN = () => {
    setInvoiceModalWithSN((wasVisible) => !wasVisible);
  };

  const ajaxStocksSelectRequest = (
    page = 1,
    limit = 20,
    search = "",
    stateReset = 0,
    onSuccessCallback
  ) => {
    const defaultFilters = {
      limit,
      page,
      q: search,
      businessUnitIds: BUSINESS_TKN_UNIT ? [BUSINESS_TKN_UNIT] : undefined,
    };
    fetchFilteredStocks({
      filters: defaultFilters,
      onSuccessCallback: ({ data }) => {
        const appendList = [];

        if (data) {
          data.forEach((element) => {
            appendList.push({
              id: element.id,
              name: element.name,
              ...element,
            });
          });
        }
        if (onSuccessCallback !== undefined) {
          onSuccessCallback(!appendList.length);
        }
        if (stateReset) {
          setStocks(appendList);
        } else {
          setStocks(stocks.concat(appendList));
        }
      },
    });
  };

  const ajaxProductsSelectRequest = (
    page = 1,
    limit = 20,
    search = "",
    stateReset = 0,
    onSuccessCallback
  ) => {
    const defaultFilters = {
      limit,
      page,
      q: search,
      isDeleted: 0,
      hasBarcode: type === "barcode" ? 1 : undefined,
    };
    fetchProducts({
      filter: defaultFilters,
    }).then((productData) => {
      const appendList = [];
      if (data.data) {
        data.data.forEach((element) => {
          appendList.push({
            id: element.id,
            name: element.name,
            ...element,
          });
        });
      }
      if (onSuccessCallback !== undefined) {
        onSuccessCallback(!appendList.length);
      }
      if (stateReset) {
        setProducts(appendList);
      } else {
        setProducts(products.concat(appendList));
      }
    });
  };

  const ajaxCatalogsSelectRequest = (
    page = 1,
    limit = 20,
    search = "",
    stateReset = 0,
    onSuccessCallback
  ) => {
    const defaultFilters = {
      limit,
      page,
      name: search,
      hasBarcode: type === "barcode" ? 1 : undefined,
    };
    fetchFilteredCatalogs(defaultFilters, (data) => {
      let appendList = {};
      if (data.data) {
        appendList = data.data;
      }
      if (onSuccessCallback !== undefined) {
        onSuccessCallback(!Object.keys(appendList).length);
      }
      if (stateReset) {
        setCatalogs(appendList);
      } else {
        setCatalogs({
          ...appendList,
          root: catalogs.root.concat(appendList.root),
        });
      }
    });
  };

  const ajaxBrandsSelectRequest = (
    page = 1,
    limit = 20,
    search = "",
    stateReset = 0,
    onSuccessCallback
  ) => {
    const filters = {
      limit,
      page,
      name: search,
      hasBarcode: type === "barcode" ? 1 : undefined,
    };
    fetchBrands(filters, (data) => {
      const appendList = [];
      if (data.data) {
        data.data.forEach((element) => {
          appendList.push({
            id: element.id,
            name: element.name,
            ...element,
          });
        });
      }
      if (onSuccessCallback !== undefined) {
        onSuccessCallback(!appendList.length);
      }
      if (stateReset) {
        setBrands(appendList);
      } else {
        setBrands(brands.concat(appendList));
      }
    });
  };

  useEffect(() => {
    if (isVisible) {
      setFilter({
        ...filter,
        invoiceOperationDate: getValues(
          !startDate ? "date" : "startDate"
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

  //   useEffect(() => {
  //     fetchBusinessUnitList({
  //       filters: {
  //         isDeleted: 0,
  //         businessUnitIds: profile?.businessUnits?.map(({ id }) => id),
  //       },
  //     });
  //     fetchBusinessUnitList({
  //       filters: {},
  //       onSuccess: (res) => {
  //         setAllBusinessUnits(res.data);
  //       },
  //     });
  //     fetchMainCurrency();
  //   }, []);

  //   useEffect(() => {
  //     if (componentIsMounted) {
  //       onFilter(
  //         "parentCatalogIds",
  //         parentCatalogs.map((parentCatalog) => parentCatalog.id)
  //       );
  //       if (category) {
  //         handlePaginationChange(1);
  //       }
  //     } else {
  //       setComponentIsMounted(true);
  //     }
  //   }, [parentCatalogs]);

  //   useEffect(() => {
  //     if (componentIsMounted) {
  //       onFilter(
  //         "catalogIds",
  //         childCatalogs.map((childCatalog) => childCatalog.id)
  //       );
  //       if (subcategory) {
  //         handlePaginationChange(1);
  //       }
  //     } else {
  //       setComponentIsMounted(true);
  //     }
  //   }, [childCatalogs]);

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
      fetchSalesPrice({
        filter: {
          currency: getValues("currency"),
          contactPrice: contactId,
          products: selectedProductIds,
          businessUnitIds: BUSINESS_TKN_UNIT ? [BUSINESS_TKN_UNIT] : undefined,
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
              defaultSalesPriceInMainCurrency
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
              const productPricesTypeObj = handleProductPriceType(
                priceTypes[id],
                unitOfMeasurementId
              );
              const invoicePriceNew = productPricesTypeObj?.invoicePrice
                ? Number(productPricesTypeObj?.invoicePrice)
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
                discountPercentage: Number(discountPercentage || 0).toFixed(4),
                discountAmount: defaultNumberFormat(discountAmount || 0),
                discountAmountForBack: defaultNumberFormat(discountAmount || 0),
                discountedPrice: defaultNumberFormat(endPricePerUnit || 0),
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
                invoicePrice:
                  invoicePrice && Number(invoicePrice) !== 0
                    ? Number(invoicePrice)
                    : invoicePriceNew,
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
                defaultSalesPriceInMainCurrency: defaultSalesPriceInMainCurrency
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
                      discountPercentage: productPricesTypeObj?.discountedPrice
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
    }
  };
  return (
    <>
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
              marginTop: 10,
              marginBottom: 20,
              padding: 10,
              borderRadius: 4,
              backgroundColor: "#fff",
              display: "flex",
              gap: 10,
            }}
          >
            <View
              style={{ display: "flex", alignItems: "flex-end", height: 300 }}
            >
              <ScrollView>
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
          <View style={{ display: "flex", flexDirection: "row", gap: 10 }}>
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
});

export default SelectFromProductModal;
