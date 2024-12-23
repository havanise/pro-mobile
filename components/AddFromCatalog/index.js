/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useContext } from "react";
import { values, find, set } from "lodash";
import { Modal, StyleSheet, View, Pressable, Text, Alert } from "react-native";
import math from "exact-math";
import uuid from "react-uuid";
import { AntDesign, Ionicons } from "@expo/vector-icons";
import {
  defaultNumberFormat,
  roundToDown,
  toFixedNumber,
  fullDateTimeWithSecond,
  getPriceValue,
  generateProductMultiMesaurements,
  formatNumberToLocale,
} from "../../utils";
import { ProAsyncSelect, ProButton, ProText } from "../../components";
// import { setDiscount } from "store/actions/sales-operation/operation";
import {
  fetchSalesProductsFromCatalog,
  fetchProductsFromCatalog,
  fetchCatalogs,
  fetchSalesCatalogs,
  fetchSalesLastInvoice,
  fetchProducts,
  fetchProductInvoices,
  fetchSalesPrice,
} from "../../api";
import { TenantContext } from "../../context";
import { useApi } from "../../hooks";
import moment from "moment";
import { fetchTransferProductsFromCatalog } from "../../api/sale";

const AddFromCatalog = ({
  getValues,
  type = "purchase",
  isVisible,
  setModalVisible,
  //   reqPage,
  //   stopReq,
  contactId,
  invoiceTypesIds = undefined,
  fromTemplate,
  selectedProducts,
  selectedExpenses = [],
  invoice_expense_rate,
  setSelectedProducts,
  clearProductsFromCatalog,
  getAllProducts,
  invoicesByProduct,
  setDiscount,
  setProductsToHandle,
  productsToHandle,
}) => {
  const { BUSINESS_TKN_UNIT } = useContext(TenantContext);

  const BigNumber = require("bignumber.js");

  const [newSelectedProducts, setNewSelectedProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [catalogProducts, setCatalogProducts] = useState([]);
  const [selectedCatalogId, setSelectedCatalogId] = useState(undefined);
  const [allCatalogsSelected, setAllCatalogsSelected] = useState(false);
  const [catalogs, setCatalogs] = useState([]);
  const [childCatalogs, setChildCatalogs] = useState([]);
  const [selectedChildCatalogId, setSelectedChildCatalogId] =
    useState(undefined);

  const handleProductPriceType = (productPriceTypes, unitOfMeasurementId) => {
    const selectedProductPriceType =
      values(productPriceTypes?.unitOfMeasurements)?.find(
        (unit) => unit?.unitOfMeasurementId === unitOfMeasurementId
      ) ?? productPriceTypes;
    const invoicePrice = getValues("client")
      ? selectedProductPriceType.contactPrice?.convertedAmount
      : selectedProductPriceType?.default?.convertedAmount;
    const productPriceType = [
      {
        convertedAmount: selectedProductPriceType?.default?.convertedAmount,
        name: "Satış",
        id: 0,
      },
      ...(selectedProductPriceType?.prices ?? []),
    ];
    return { invoicePrice, productPriceType };
  };
  const handleCatalogSelect = (selectedCatalogId) => {
    setSelectedCatalogId(selectedCatalogId);
    setSelectedChildCatalogId(undefined);
    if (childCatalogs[selectedCatalogId]?.length > 0) {
      return;
    }

    runProducts({
      apiEnd: selectedCatalogId,
      filter: {
        notProductUnitOfMeasurementIds:
          type === "sales" || type === "transfer" || type === "writingOff"
            ? []
            : selectedProducts
                .filter((selectedProduct) => selectedProduct?.id)
                .map((selectedProduct) => Number(selectedProduct?.id)),
        catalogIds:
          type === "sales" || type === "transfer" || type === "writingOff"
            ? [selectedCatalogId]
            : undefined,
        isDeleted:
          type === "sales" || type === "transfer" || type === "writingOff"
            ? 0
            : undefined,
        inStock:
          type === "sales" || type === "transfer" || type === "writingOff"
            ? 1
            : undefined,
        includeServices: type === "sales" ? 1 : undefined,

        only_products:
          type === "transfer" || type === "writingOff" ? 1 : undefined,
        stocks:
          type === "sales" || type === "transfer" || type === "writingOff"
            ? [getValues("stockFrom")]
            : undefined,
        datetime:
          type === "sales" || type === "transfer" || type === "writingOff"
            ? moment(getValues("operationDate"))?.format(fullDateTimeWithSecond)
            : undefined,
        page: 1,
        limit: 20,
      },
    });
  };

  const handleChildCatalogSelect = (id) => {
    setSelectedChildCatalogId(id);
    runProducts({
      apiEnd: id,
      filter: {
        notProductUnitOfMeasurementIds:
          type === "sales" || type === "transfer" || type === "writingOff"
            ? []
            : selectedProducts
                .filter((selectedProduct) => selectedProduct?.id)
                .map((selectedProduct) => Number(selectedProduct?.id)),
        catalogIds:
          type === "sales" || type === "transfer" || type === "writingOff"
            ? [id || selectedCatalogId]
            : undefined,
        isDeleted:
          type === "sales" || type === "transfer" || type === "writingOff"
            ? 0
            : undefined,
        inStock:
          type === "sales" || type === "transfer" || type === "writingOff"
            ? 1
            : undefined,
        includeServices: type === "sales" ? 1 : undefined,

        only_products:
          type === "transfer" || type === "writingOff" ? 1 : undefined,
        stocks:
          type === "sales" || type === "transfer" || type === "writingOff"
            ? [getValues("stockFrom")]
            : undefined,
        datetime:
          type === "sales" || type === "transfer" || type === "writingOff"
            ? moment(getValues("operationDate"))?.format(fullDateTimeWithSecond)
            : undefined,
        page: 1,
        limit: 20,
      },
    });
  };

  const transformUniqueIdData = (productArr = []) =>
    productArr.map((product) => ({
      ...product,
      id: `${product.id}${product?.unitOfMeasurementId}`,
      productId: product?.id,
    }));

  const clearModal = () => {
    setNewSelectedProducts([]);
    setSelectedCatalogId(undefined);
    setSelectedChildCatalogId(undefined);
    // dispatch(clearProductsFromCatalog);
    setAllCatalogsSelected(false);
  };

  useEffect(() => {
    if (!isVisible) {
      clearModal();
    } else {
      if (type === "purchase") {
        runCatalog({ filter: { limit: 20, page: 1 } });
      } else if (type === "transfer" || type === "writingOff") {
        runCatalog({
          filter: {
            limit: 20,
            page: 1,
            datetime: moment(getValues("operationDate"))?.format(
              fullDateTimeWithSecond
            ),
            only_products: 1,
          },
          apiEnd: getValues("stockFrom"),
        });
      } else {
        runCatalog({
          filter: {
            limit: 20,
            page: 1,
            datetime: moment(getValues("operationDate"))?.format(
              fullDateTimeWithSecond
            ),
            stocks: getValues("stockFrom"),
          },
        });
      }
    }
  }, [isVisible]);

  const handleConfirmClick = () => {
    if (
      (type === "sales" || type === "transfer" || type === "writingOff") &&
      newSelectedProducts?.length
    ) {
      if (type === "sales") {
        fetchSalesPrice({
          filter: {
            currency: getValues("currency"),
            contactPrice: contactId,
            products: newSelectedProducts.map((product) => product.productId),
            businessUnitIds: BUSINESS_TKN_UNIT
              ? [BUSINESS_TKN_UNIT]
              : undefined,
          },
        }).then((priceTypes) => {
          fetchProducts({
            filter: {
              ids: newSelectedProducts.map((product) => product.productId),
              withUnitOfMeasurements: 1,
              withRoadTaxes: 1,
              stock: getValues("stockFrom") || getValues("stockTo"),
              businessUnitIds: BUSINESS_TKN_UNIT
                ? [BUSINESS_TKN_UNIT]
                : undefined,
            },
          }).then((productData) => {
            const productsWithPrices = newSelectedProducts.map((product) => {
              const productPriceData = handleProductPriceType(
                priceTypes[product.productId],
                product.unitOfMeasurementId
              );

              const invoicePrice = productPriceData?.invoicePrice
                ? Number(productPriceData?.invoicePrice)
                : null;

              const productInfo = productData?.find(
                (productD) => productD.id === product?.productId
              );
              const invQuantity = product?.invoiceQuantity
                ? product.invoiceQuantity
                : productInfo?.isWithoutSerialNumber
                ? productInfo?.isServiceType
                  ? 1
                  : Number(product?.quantity || 1) >= 1
                  ? 1
                  : defaultNumberFormat(toFixedNumber(product?.quantity, 4))
                : null;
              const totalEndPrice = math.mul(
                Number(invoicePrice || 0),
                Number(product.invoiceQuantity || 1)
              );
              const roadTaxAmount = productInfo?.isRoadTaxActive
                ? find(
                    productInfo?.roadTaxes,
                    (tax) => tax?.tenantCurrency === getValues("currency")
                  )?.amount
                  ? Number(
                      math.mul(
                        find(
                          productData[0]?.roadTaxes,
                          (tax) => tax?.tenantCurrency === getValues("currency")
                        )?.amount || 0,
                        Number(product?.coefficientRelativeToMain || 1)
                      )
                    )
                  : null
                : 0;

              const totalTaxAmount = roadTaxAmount
                ? math.mul(Number(roadTaxAmount || 0), Number(invQuantity ?? 0))
                : null;

              return {
                ...product,
                catalog: {
                  id: productInfo?.catalogId,
                  isServiceType: productInfo?.isServiceType,
                  isWithoutSerialNumber: productInfo?.isWithoutSerialNumber,
                  name: productInfo?.catalogName,
                  rootName: productInfo?.parentCatalogName,
                },
                productUniqueId: uuid(),
                product_code: product?.product_code ?? product?.productCode,
                brandName: productInfo?.brandName,
                defaultSalesPriceInMainCurrency:
                  productInfo?.pricePerUnitInMainCurrency || 0,
                isVatFree: productInfo.isVatFree,
                attachmentId: productInfo.attachmentId,
                attachmentName: productInfo.attachmentName,
                pricePerUnit: productInfo.pricePerUnit,
                bronQuantityInStock: productInfo.bronQuantity,
                salesDraftQuantityInStock: productInfo.salesDraftQuantity,
                quantity: defaultNumberFormat(
                  math.div(
                    Number((product.totalQuantity ?? product.quantity) || 0),
                    Number(product?.coefficientRelativeToMain || 1)
                  )
                ),
                totalQuantity: product?.totalQuantity ?? product?.quantity,
                invoiceQuantity: product?.invoiceQuantity
                  ? product.invoiceQuantity
                  : productInfo?.isWithoutSerialNumber
                  ? productInfo?.isServiceType
                    ? 1
                    : Number(product?.quantity || 1) >= 1
                    ? 1
                    : defaultNumberFormat(toFixedNumber(product?.quantity, 4))
                  : null,
                prices: priceTypes[product.productId],
                invoicePrice,
                mainInvoicePrice: invoicePrice,
                discountAmount: 0,
                brandName: productInfo?.brandName,
                lifetime: productInfo.lifetime,
                isVatFree: productInfo.isVatFree,
                discountPercentage: 0,
                product_code: product?.productСode,
                discountedPrice: invoicePrice
                  ? defaultNumberFormat(invoicePrice)
                  : null,
                totalPricePerProduct: math.mul(
                  Number(invoicePrice || 0),
                  Number(product.invoiceQuantity || 1)
                ),
                isRoadTaxActive: productInfo?.isRoadTaxActive,
                originalRoadTaxAmount: productInfo?.isRoadTaxActive
                  ? find(
                      productInfo?.roadTaxes,
                      (tax) => tax?.tenantCurrency === getValues("currency")
                    )?.amount
                    ? Number(
                        find(
                          productInfo?.roadTaxes,
                          (tax) => tax?.tenantCurrency === getValues("currency")
                        )?.amount || 0
                      )
                    : null
                  : 0,
                roadTaxes: productInfo?.roadTaxes,
                roadTaxAmount: roadTaxAmount,
                totalRoadTaxAmount: totalTaxAmount,
                totalEndPricePerProduct: math.add(
                  Number(totalTaxAmount || 0),
                  Number(totalEndPrice || 0)
                ),
                productPricetype: productPriceData?.productPriceType,
                hasMultiMeasurement:
                  productInfo?.unitOfMeasurements?.length > 1,
                mainUnitOfMeasurementID: productInfo?.unitOfMeasurementId,
                mainUnitOfMeasurementName: productInfo?.unitOfMeasurementName,
                unitOfMeasurementID: product?.unitOfMeasurementId,
                unitOfMeasurements: generateProductMultiMesaurements(
                  productInfo,
                  product
                ),
              };
            });
            setSelectedProducts([...selectedProducts, ...productsWithPrices]);
          });

          setModalVisible(false);
        });
      } else {
        fetchProducts({
          filter: {
            ids: newSelectedProducts.map((product) => product.productId),
            withUnitOfMeasurements: 1,
            stock: getValues("stockFrom") || getValues("stockTo"),
            businessUnitIds: BUSINESS_TKN_UNIT
              ? [BUSINESS_TKN_UNIT]
              : undefined,
          },
        }).then((productData) => {
          const productsWithPrices = newSelectedProducts.map((product) => {
            const productInfo = productData?.find(
              (productD) => productD.id === product?.productId
            );

            return {
              ...product,
              catalog: {
                id: productInfo?.catalogId,
                isServiceType: productInfo?.isServiceType,
                isWithoutSerialNumber: productInfo?.isWithoutSerialNumber,
                name: productInfo?.catalogName,
                rootName: productInfo?.parentCatalogName,
              },
              productUniqueId: uuid(),
              product_code: product?.product_code ?? product?.productCode,
              brandName: productInfo?.brandName,
              defaultSalesPriceInMainCurrency:
                productInfo?.pricePerUnitInMainCurrency || 0,
              lifetime: productInfo.lifetime,
              isVatFree: productInfo.isVatFree,
              attachmentId: productInfo.attachmentId,
              attachmentName: productInfo.attachmentName,
              pricePerUnit: productInfo.pricePerUnit,
              bronQuantityInStock: productInfo.bronQuantity,
              salesDraftQuantityInStock: productInfo.salesDraftQuantity,
              quantity: defaultNumberFormat(
                math.div(
                  Number((product.totalQuantity ?? product.quantity) || 0),
                  Number(product?.coefficientRelativeToMain || 1)
                )
              ),
              totalQuantity: product?.totalQuantity ?? product?.quantity,
              invoiceQuantity: product?.invoiceQuantity
                ? product.invoiceQuantity
                : productInfo?.isWithoutSerialNumber
                ? productInfo?.isServiceType
                  ? 1
                  : Number(product?.quantity || 1) >= 1
                  ? 1
                  : defaultNumberFormat(toFixedNumber(product?.quantity, 4))
                : null,
              discountAmount: 0,
              discountPercentage: 0,
              product_code: product?.productСode,
              isRoadTaxActive: productInfo?.isRoadTaxActive,
              originalRoadTaxAmount: productInfo?.isRoadTaxActive
                ? find(
                    productInfo?.roadTaxes,
                    (tax) => tax?.tenantCurrency === getValues("currency")
                  )?.amount
                  ? Number(
                      find(
                        productInfo?.roadTaxes,
                        (tax) => tax?.tenantCurrency === getValues("currency")
                      )?.amount || 0
                    )
                  : null
                : 0,
              roadTaxes: productInfo?.roadTaxes,
              hasMultiMeasurement: productInfo?.unitOfMeasurements?.length > 1,
              mainUnitOfMeasurementID: productInfo?.unitOfMeasurementId,
              mainUnitOfMeasurementName: productInfo?.unitOfMeasurementName,
              unitOfMeasurementID: product?.unitOfMeasurementId,
              unitOfMeasurements: generateProductMultiMesaurements(
                productInfo,
                product
              ),
            };
          });
          setSelectedProducts([...selectedProducts, ...productsWithPrices]);
        });

        setModalVisible(false);
      }
    } else {
      if (type === "transfer" && allCatalogsSelected) {
        fetchProducts({
          filter: {
            ids: products?.map((product) => product?.id),
            withUnitOfMeasurements: 1,
            stock: getValues("stockFrom") || getValues("stockTo"),
            businessUnitIds: BUSINESS_TKN_UNIT
              ? [BUSINESS_TKN_UNIT]
              : undefined,
          },
        }).then((productData) => {
          const productInfo = productData;
          const productsWithPrices = products
            .filter(
              (product) =>
                ![
                  ...selectedProducts.map(
                    (selectedProduct) => selectedProduct?.id
                  ),
                  ...newSelectedProducts.map(
                    (newSelectedProduct) => newSelectedProduct?.id
                  ),
                ].includes(product.id)
            )
            .map((product) => ({
              ...product,
              endPriceInMainCurrency: Number(product?.priceInMainCurrency || 0),
              defaultSalesPriceInMainCurrency:
                productInfo?.pricePerUnitInMainCurrency || 0,
              productUniqueId: uuid(),
              attachmentId: productInfo?.find(({ id }) => id === product.id)
                .attachmentId,
              attachmentName: productInfo?.find(({ id }) => id === product.id)
                .attachmentName,
              quantity: defaultNumberFormat(
                math.div(
                  Number(product?.totalQuantity || 0),
                  Number(product?.coefficientRelativeToMain || 1)
                )
              ),
              hasMultiMeasurement:
                productInfo?.find(({ id }) => id === product.id)
                  ?.unitOfMeasurements?.length > 1,
              unitOfMeasurementID: product?.unitOfMeasurementId,
              unitOfMeasurements: generateProductMultiMesaurements(
                productInfo?.find(({ id }) => id === product.id),
                product
              ),
              invoiceQuantity: product.invoiceQuantity
                ? product.invoiceQuantity
                : productInfo?.isWithoutSerialNumber
                ? Number(product?.quantity) >= 1
                  ? 1
                  : defaultNumberFormat(toFixedNumber(product?.quantity, 4))
                : null,
              bronQuantityInStock: productInfo?.find(
                ({ id }) => id === product.id
              )?.bronQuantity,
              salesDraftQuantityInStock: productInfo?.find(
                ({ id }) => id === product.id
              )?.salesDraftQuantity,
              brandName: productInfo?.find(({ id }) => id === product.id)
                ?.brandName,
              lifetime: productInfo?.find(({ id }) => id === product.id)
                .lifetime,
              isVatFree: productInfo?.find(({ id }) => id === product.id)
                .isVatFree,
            }));

          setSelectedProducts([...selectedProducts, ...productsWithPrices]);
        });
      } else if (
        type !== "transfer" &&
        type !== "writingOff" &&
        type !== "sales" &&
        type !== "barcode" &&
        type !== "decrease" &&
        newSelectedProducts?.length
      ) {
        const defaultFilters = {
          products: fromTemplate
            ? [...selectedProducts, ...newSelectedProducts].map((product) =>
                product.content
                  ? product.content[0]
                    ? product.content[0].invoiceProductId
                    : product.productId
                  : product.productId
              )
            : [...selectedProducts, ...newSelectedProducts].map(
                (product) => product?.productId || product?.id
              ),
          showProductPricePerItem: 1,
          targetCurrency: getValues("currency"),
          dateTime: moment(getValues("operationDate"))?.format(
            fullDateTimeWithSecond
          ),
        };
        if (invoiceTypesIds?.length) {
          defaultFilters["invoiceTypes"] = invoiceTypesIds;
        }
        const total_expense_amount = selectedExpenses.reduce(
          (total_amount, { expense_amount }) =>
            math.add(
              total_amount,
              math.mul(
                Number(expense_amount) || 0,
                Number(invoice_expense_rate)
              )
            ),
          0
        );

        const invoice_amount = [
          ...selectedProducts,
          newSelectedProducts,
        ].reduce(
          (totalPrice, { invoiceQuantity, invoicePrice }) =>
            math.add(
              totalPrice,
              math.mul(Number(invoiceQuantity) || 0, Number(invoicePrice) || 0)
            ),
          0
        );

        const expense_amount_in_percentage = math.div(
          math.mul(Number(total_expense_amount), 100),
          Number(invoice_amount) || 1
        );
        fetchSalesLastInvoice({
          filter: defaultFilters,
        }).then((invoice) => {
          fetchProducts({
            filter: {
              ids: newSelectedProducts?.map((product) => product?.productId),
              withUnitOfMeasurements: 1,
              withRoadTaxes: 1,
              stock: getValues("stockFrom") || getValues("stockTo"),
              businessUnitIds: BUSINESS_TKN_UNIT
                ? [BUSINESS_TKN_UNIT]
                : undefined,
            },
          }).then((productData) => {
            const newProducts = newSelectedProducts?.map((product) => {
              const expense_amount = math.div(
                math.mul(
                  Number(product.invoicePrice) || 0,
                  Number(expense_amount_in_percentage) || 0
                ),
                100
              );
              const productInfo = productData?.find(
                (productD) => productD.id === product?.productId
              );
              const invoicePriceValue =
                defaultNumberFormat(invoice[product?.productId]) ?? null;
              const invQuantity = product.invoiceQuantity
                ? product.invoiceQuantity
                : productInfo?.isWithoutSerialNumber
                ? type === "purchase" ||
                  type === "import-purchase" ||
                  type === "increase"
                  ? 1
                  : Number(product?.quantity) >= 1
                  ? 1
                  : defaultNumberFormat(toFixedNumber(product?.quantity, 4))
                : null;
              const totalEndPrice = math.mul(
                Number(invoice[product?.productId]),
                Number(product.invoiceQuantity || 1)
              );
              const roadTaxAmount = 0;
              // productInfo?.isRoadTaxActive
              //   ? autoFillRoadTax
              //     ? find(
              //         productInfo?.roadTaxes,
              //         (tax) => tax?.tenantCurrency === getValues("currency")
              //       )?.amount
              //       ? Number(
              //           math.mul(
              //             find(
              //               productData.data[0]?.roadTaxes,
              //               (tax) =>
              //                 tax?.tenantCurrency === getValues("currency")
              //             )?.amount || 0,
              //             Number(product?.coefficientRelativeToMain || 1)
              //           )
              //         )
              //       : null
              //     : 0
              //   : 0;
              const totalTaxAmount = roadTaxAmount
                ? math.mul(Number(roadTaxAmount || 0), Number(invQuantity ?? 0))
                : null;

              return {
                ...product,
                catalog: {
                  id: productInfo?.catalogId,
                  isServiceType: productInfo?.isServiceType,
                  isWithoutSerialNumber: productInfo?.isWithoutSerialNumber,
                  name: productInfo?.catalogName,
                  rootName: productInfo?.parentCatalogName,
                },
                productUniqueId: uuid(),
                product_code: product?.productСode,
                brandName: productInfo?.brandName,
                defaultSalesPriceInMainCurrency:
                  productInfo?.pricePerUnitInMainCurrency || 0,
                lifetime: productInfo.lifetime,
                isVatFree: productInfo.isVatFree,
                attachmentId: productInfo.attachmentId,
                attachmentName: productInfo.attachmentName,
                invoiceQuantity: product.invoiceQuantity
                  ? product.invoiceQuantity
                  : productInfo?.isWithoutSerialNumber
                  ? type === "purchase" ||
                    type === "import-purchase" ||
                    type === "increase"
                    ? 1
                    : Number(product?.quantity) >= 1
                    ? 1
                    : defaultNumberFormat(toFixedNumber(product?.quantity, 4))
                  : null,
                unitOfMeasurementID: productInfo?.unitOfMeasurementId,
                hasMultiMeasurement: product?.unitOfMeasurements?.length > 1,
                isRoadTaxActive: productInfo?.isRoadTaxActive,
                roadTaxes: productInfo?.roadTaxes,
                originalRoadTaxAmount: productInfo?.isRoadTaxActive
                  ? find(
                      productInfo?.roadTaxes,
                      (tax) => tax?.tenantCurrency === getValues("currency")
                    )?.amount
                    ? Number(
                        find(
                          productInfo?.roadTaxes,
                          (tax) => tax?.tenantCurrency === getValues("currency")
                        )?.amount || 0
                      )
                    : null
                  : 0,
                roadTaxAmount: roadTaxAmount,
                totalRoadTaxAmount: totalTaxAmount,
                totalEndPricePerProduct: math.add(
                  Number(totalTaxAmount || 0),
                  Number(totalEndPrice || 0)
                ),
                unitOfMeasurements: generateProductMultiMesaurements(
                  productInfo,
                  product
                ),
                expense_amount_in_percentage: roundToDown(
                  expense_amount_in_percentage,
                  4
                ),
                invoicePrice: invoicePriceValue,
                mainInvoicePrice: invoicePriceValue,
                discountAmount: 0,
                discountPercentage: 0,
                discountedPrice: invoice[product?.productId]
                  ? defaultNumberFormat(invoice[product?.productId])
                  : 0.0,
                totalPricePerProduct: math.mul(
                  Number(invoice[product?.productId]),
                  Number(product.invoiceQuantity || 1)
                ),
                expense_amount: roundToDown(expense_amount, 4),
                cost: roundToDown(
                  math.add(
                    Number(expense_amount) || 0,
                    Number(product.invoicePrice) || 0
                  ),
                  4
                ),
                bronQuantityInStock: productInfo.bronQuantity,
                salesDraftQuantityInStock: productInfo.salesDraftQuantity,
                quantity:
                  type === "increase"
                    ? defaultNumberFormat(productInfo?.quantity)
                    : defaultNumberFormat(product.quantity),
              };
            });
            setSelectedProducts([...selectedProducts, ...newProducts]);
          });
        });
      } else {
        const total_expense_amount = selectedExpenses.reduce(
          (total_amount, { expense_amount }) =>
            math.add(
              total_amount,
              math.mul(
                Number(expense_amount) || 0,
                Number(invoice_expense_rate || 0)
              )
            ),
          0
        );
        const invoice_amount = [
          ...selectedProducts,
          newSelectedProducts,
        ].reduce(
          (totalPrice, { invoiceQuantity, invoicePrice }) =>
            math.add(
              totalPrice,
              math.mul(Number(invoiceQuantity) || 0, Number(invoicePrice) || 0)
            ),
          0
        );
        const expense_amount_in_percentage = math.div(
          math.mul(Number(total_expense_amount), 100),
          Number(invoice_amount) || 1
        );
        fetchProducts({
          filter: {
            ids: newSelectedProducts?.map((product) => product?.productId),
            withRoadTaxes: 1,
            withUnitOfMeasurements: 1,
            stock: getValues("stockFrom") || getValues("stockTo"),
            businessUnitIds: BUSINESS_TKN_UNIT
              ? [BUSINESS_TKN_UNIT]
              : undefined,
          },
        }).then((productData) => {
          const newProducts = newSelectedProducts?.map((product) => {
            const expense_amount = math.div(
              math.mul(
                Number(product.invoicePrice) || 0,
                Number(expense_amount_in_percentage) || 0
              ),
              100
            );
            const productInfo = productData?.find(
              (productD) => productD.id === product?.productId
            );
            return {
              ...product,
              catalog: {
                id: productInfo?.catalogId,
                isServiceType: productInfo?.isServiceType,
                isWithoutSerialNumber: productInfo?.isWithoutSerialNumber,
                name: productInfo?.catalogName,
                rootName: productInfo?.parentCatalogName,
              },
              productUniqueId: uuid(),
              product_code: product?.productСode,
              brandName: productInfo?.brandName,
              defaultSalesPriceInMainCurrency:
                productInfo?.pricePerUnitInMainCurrency || 0,
              lifetime: productInfo.lifetime,
              isVatFree: productInfo.isVatFree,
              attachmentId: productInfo.attachmentId,
              attachmentName: productInfo.attachmentName,
              currencyCode: productInfo.currencyCode,
              invoiceQuantity: product.invoiceQuantity
                ? product.invoiceQuantity
                : productInfo?.isWithoutSerialNumber
                ? type === "purchase" ||
                  type === "import-purchase" ||
                  type === "increase"
                  ? 1
                  : Number(product?.quantity) >= 1
                  ? 1
                  : defaultNumberFormat(toFixedNumber(product?.quantity, 4))
                : null,
              unitOfMeasurementID: product?.unitOfMeasurementId,
              unitOfMeasurements: generateProductMultiMesaurements(
                productInfo,
                product
              ),
              hasMultiMeasurement: productInfo?.unitOfMeasurements?.length > 1,
              expense_amount_in_percentage: roundToDown(
                expense_amount_in_percentage,
                4
              ),
              discountAmount: 0,
              discountPercentage: 0,
              expense_amount: roundToDown(expense_amount, 4),
              cost: roundToDown(
                math.add(
                  Number(expense_amount) || 0,
                  Number(product.invoicePrice) || 0
                ),
                4
              ),
              bronQuantityInStock: productInfo.bronQuantity,
              salesDraftQuantityInStock: productInfo.salesDraftQuantity,
              prices: productInfo?.prices,
              invoicePrice: productInfo?.pricePerUnit
                ? Number(productInfo?.pricePerUnit)
                : null,
              mainInvoicePrice: productInfo?.pricePerUnit,
            };
          });

          setSelectedProducts(
            [...selectedProducts, ...newProducts].map((product) => {
              const expense_amount = math.div(
                math.mul(
                  Number(product.invoicePrice) || 0,
                  Number(expense_amount_in_percentage) || 0
                ),
                100
              );

              return {
                ...product,
                quantity:
                  type === "barcode"
                    ? defaultNumberFormat(product.quantity)
                    : defaultNumberFormat(
                        math.div(
                          Number(
                            product?.totalQuantity || product.quantity || 0
                          ),
                          Number(product?.coefficientRelativeToMain || 1)
                        )
                      ),
                invoiceQuantity:
                  type === "barcode"
                    ? 1
                    : product.invoiceQuantity
                    ? product.invoiceQuantity
                    : product?.catalog?.isWithoutSerialNumber
                    ? Number(product?.quantity) >= 1
                      ? 1
                      : defaultNumberFormat(toFixedNumber(product?.quantity, 4))
                    : null,
                expense_amount_in_percentage: roundToDown(
                  expense_amount_in_percentage,
                  4
                ),
                expense_amount: roundToDown(expense_amount, 4),
                cost: roundToDown(
                  math.add(
                    Number(expense_amount) || 0,
                    Number(product.invoicePrice) || 0
                  ),
                  4
                ),
              };
            })
          );
        });
      }
      setModalVisible(false);
    }
  };

  const updateProduct = (productId, invoiceProducts) => {
    let selectedProductİd;
    let quantity;
    const serialNumbers = Object.values(invoiceProducts).map(
      ({ serial_number, invoice_product_id }) =>
        serial_number === undefined
          ? invoicesByProduct?.find(
              (invoiceByProduct) =>
                invoice_product_id === invoiceByProduct.invoice_product_id
            )?.serial_number
          : serial_number
    );

    const totalEndPricePerUnit = invoiceProducts.reduce((total, product) => {
      return total + Number(product.priceInMainCurrency || 0);
    }, 0);

    const newSelectedProducts = selectedProducts.map((prevSelectedProduct) => {
      if (productId === prevSelectedProduct.id) {
        let totalPricePerProduct = 0.0;
        let totalEndPricePerProduct = 0.0;
        if (prevSelectedProduct.invoicePrice) {
          totalPricePerProduct = new BigNumber(
            math.mul(
              Number(prevSelectedProduct.invoicePrice || 0),
              Number(serialNumbers.length || 1)
            )
          );
          totalEndPricePerProduct = new BigNumber(
            math.mul(
              Number(
                prevSelectedProduct.discountedPrice ??
                  prevSelectedProduct.invoicePrice
              ),
              Number(serialNumbers.length || 1)
            )
          );
        }
        return {
          ...prevSelectedProduct,
          serialNumbers,
          invoiceQuantity: serialNumbers.length,
          endPriceInMainCurrency: totalEndPricePerUnit,
          totalPricePerProduct:
            getPriceValue(totalPricePerProduct)?.toString()?.split(".")[1]
              ?.length > 4
              ? getPriceValue(totalPricePerProduct)?.toFixed(4)
              : getPriceValue(totalPricePerProduct),
          totalEndPricePerProduct:
            getPriceValue(totalEndPricePerProduct)?.toString()?.split(".")[1]
              ?.length > 4
              ? getPriceValue(totalEndPricePerProduct)?.toFixed(4)
              : getPriceValue(totalEndPricePerProduct),
          invoiceProducts: invoiceProducts.map((item) => ({
            ...item,
            invoiceQuantity: item.invoiceQuantity ? item.invoiceQuantity : 1,
          })),
        };
      }
      return prevSelectedProduct;
    });
    const newtotalPrice = newSelectedProducts.reduce(
      (totalPrice, { totalPricePerProduct }) => {
        return math.add(totalPrice, Number(totalPricePerProduct || 0));
      },
      0
    );
    let discountAmountTotal = newSelectedProducts.reduce(
      (totalDiscountAmount, { discountAmount, invoiceQuantity }) => {
        return math.add(
          totalDiscountAmount,
          math.mul(Number(discountAmount || 0), Number(invoiceQuantity || 0))
        );
      },
      0
    );
    let discountPercentage = math.mul(
      math.div(Number(discountAmountTotal || 0), newtotalPrice || 1),
      100
    );
    setDiscount({
      newPercentage: discountPercentage || undefined,
      newAmount: discountAmountTotal || undefined,
    });
    // dispatch(setSelectedProducts({ newSelectedProducts }));
  };

  const addProduct = (productIds) => {
    const [productId] = productIds;
    const currentProduct = catalogProducts?.find(
      (product) => product.id === productIds
    );
    if (currentProduct && type === "sales") {
      fetchProductInvoices({
        filter: {
          datetime: moment(getValues("operationDate"))?.format(
            fullDateTimeWithSecond
          ),
        },
        apiEnd: getValues("stockFrom"),
        apiEndTwo: currentProduct?.productId,
      }).then((data) => {
        if (
          Object.keys(data).length === 1 &&
          currentProduct?.catalog?.isServiceType === false &&
          currentProduct?.catalog?.isWithoutSerialNumber === false
        ) {
          updateProduct(currentProduct?.productId, Object.values(data));

          const newProduct = {
            ...currentProduct,
            id: currentProduct?.productId,
            invoiceQuantity: 1,
            serialNumbers: [Object.values(data)[0].serial_number],
            invoiceProducts: Object.values(data).map((item) => ({
              ...item,
              invoiceQuantity: item.invoiceQuantity ? item.invoiceQuantity : 1,
            })),
          };
          setNewSelectedProducts([newProduct, ...newSelectedProducts]);
          setProductsToHandle(
            ...productsToHandle,
            Object.values(data).map((obj) => ({
              ...obj,
              productId: currentProduct?.productId,
            }))
          );
        } else {
          const newProduct = {
            ...currentProduct,
            id: currentProduct?.productId,
          };
          setNewSelectedProducts([newProduct, ...newSelectedProducts]);
        }
      });
    } else {
      const newProduct = {
        ...currentProduct,
        id: currentProduct?.productId,
      };
      setNewSelectedProducts([newProduct, ...newSelectedProducts]);
    }
  };
  const handleSelectedProductsChange = (productIds) => {
    const newProducts = transformUniqueIdData(newSelectedProducts).filter(
      (product) => productIds.includes(product.id)
    );
    setNewSelectedProducts(newProducts);
  };

  const handleAllCatalogs = (event) => {
    if (event.target.checked) {
      setAllCatalogsSelected(true);
      setSelectedCatalogId(undefined);
      setSelectedChildCatalogId(undefined);
      setNewSelectedProducts([]);
      getAllProducts();
    } else {
      setAllCatalogsSelected(false);
    }
  };

  useEffect(() => {
    if (filteredProducts.length > 0) {
      setCatalogProducts(transformUniqueIdData(filteredProducts));
    }

    if (filteredProducts.length === 0) {
      setCatalogProducts([]);
    }
  }, [newSelectedProducts, filteredProducts]);

  const { isLoading: isLoadAgents, run: runProducts } = useApi({
    deferFn:
      type === "sales" || type === "transfer" || type === "writingOff"
        ? fetchSalesProductsFromCatalog
        : fetchProductsFromCatalog,
    onResolve: (data) => {
      setFilteredProducts(data);
    },
    onReject: (error) => {
      console.log(error, "rejected");
    },
  });

  const { isLoading, run: runCatalog } = useApi({
    deferFn: type === "sales" ? fetchSalesCatalogs : fetchCatalogs,
    onResolve: (data) => {
      let appendList = {};
      if (data) {
        appendList = data.root.map((item) => ({
          ...item,
          label: item.name,
          value: item.id,
        }));
      }
      setCatalogs(catalogs.concat(appendList));
      setChildCatalogs(data.children);
    },
    onReject: (error) => {
      console.log(error, "rejected");
    },
  });

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={() => {
        setModalVisible(false);
      }}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <ProText variant="heading" style={{ color: "black" }}>
            Kataloqdan seç
          </ProText>
          <View
            style={{
              marginTop: 20,
              marginBottom: 20,
              padding: 10,
              borderRadius: 4,
              backgroundColor: "#fff",
              display: "flex",
              gap: 10,
            }}
          >
            <ProAsyncSelect
              label="Kataloqlar"
              async
              data={catalogs || []}
              disabled={allCatalogsSelected}
              setData={setCatalogs}
              fetchData={type === "sales" ? fetchSalesCatalogs : fetchCatalogs}
              notForm
              catalog={true}
              apiEnd={type === "purchase" ? undefined : getValues("stockFrom")}
              selectedValueFromParent={selectedCatalogId}
              filter={
                type === "purchase"
                  ? { limit: 20, page: 1 }
                  : {
                      limit: 20,
                      page: 1,
                      datetime: moment(getValues("operationDate"))?.format(
                        fullDateTimeWithSecond
                      ),
                      stocks: getValues("stockFrom"),
                    }
              }
              handleSelectValue={(id) => {
                handleCatalogSelect(id);
              }}
            />
            <ProAsyncSelect
              label="Alt kataloqlar"
              data={
                selectedCatalogId
                  ? childCatalogs[selectedCatalogId]?.map((item) => ({
                      ...item,
                      label: item.name,
                      value: item.id,
                    }))
                  : []
              }
              selectedValueFromParent={selectedChildCatalogId}
              disabled={!selectedCatalogId || allCatalogsSelected}
              setData={() => {}}
              fetchData={() => {}}
              notForm
              filter={{}}
              handleSelectValue={(id) => {
                handleChildCatalogSelect(id);
              }}
            />
            <ProAsyncSelect
              label="Məhsullar"
              isMulti={true}
              data={
                [...selectedProducts, ...newSelectedProducts]?.length > 0
                  ? catalogProducts
                      .filter((product) => {
                        return ![
                          ...transformUniqueIdData(selectedProducts).map(
                            (selectedProduct) =>
                              `${selectedProduct.productId}${selectedProduct?.unitOfMeasurementID}`
                          ),
                        ].includes(product?.id);
                      })
                      .map((item) => ({
                        ...item,
                        label: `${item.name} ${
                          Number(item.quantity || 0) > 0
                            ? ` (${formatNumberToLocale(
                                defaultNumberFormat(item.quantity)
                              )} ${
                                item.unitOfMeasurementName
                                  ? item.unitOfMeasurementName.toLowerCase()
                                  : ""
                              })`
                            : ""
                        }`,
                        value: item.id,
                      }))
                  : catalogProducts.map((item) => ({
                      ...item,
                      label: `${item.name} ${
                        Number(item.quantity || 0) > 0
                          ? ` (${formatNumberToLocale(
                              defaultNumberFormat(item.quantity)
                            )} ${
                              item.unitOfMeasurementName
                                ? item.unitOfMeasurementName.toLowerCase()
                                : ""
                            })`
                          : ""
                      }`,
                      value: item.id,
                    }))
              }
              disabled={
                !selectedCatalogId ||
                allCatalogsSelected ||
                (childCatalogs[selectedCatalogId]?.length > 0 &&
                  !selectedChildCatalogId)
              }
              async
              setData={setFilteredProducts}
              fetchData={
                type === "sales" || type === "transfer" || type === "writingOff"
                  ? fetchSalesProductsFromCatalog
                  : fetchProductsFromCatalog
              }
              notForm
              apiEnd={selectedChildCatalogId || selectedCatalogId}
              filter={{
                limit: 20,
                page: 1,
                catalogIds:
                  type === "sales" ||
                  type === "transfer" ||
                  type === "writingOff"
                    ? [selectedChildCatalogId || selectedCatalogId]
                    : undefined,
                isDeleted:
                  type === "sales" ||
                  type === "transfer" ||
                  type === "writingOff"
                    ? 0
                    : undefined,
                inStock:
                  type === "sales" ||
                  type === "transfer" ||
                  type === "writingOff"
                    ? 1
                    : undefined,
                includeServices: type === "sales" ? 1 : undefined,

                only_products:
                  type === "transfer" || type === "writingOff" ? 1 : undefined,
                stocks:
                  type === "sales" ||
                  type === "transfer" ||
                  type === "writingOff"
                    ? [getValues("stockFrom")]
                    : undefined,
                datetime:
                  type === "sales" ||
                  type === "transfer" ||
                  type === "writingOff"
                    ? moment(getValues("operationDate"))?.format(
                        fullDateTimeWithSecond
                      )
                    : undefined,
              }}
              handleSelectValue={(id) => {
                addProduct(id);
              }}
            />
            {/* <MultiSelect
              label="Məhsullar"
              // style={styles.dropdown}
              // placeholderStyle={styles.placeholderStyle}
              // selectedTextStyle={styles.selectedTextStyle}
              // inputSearchStyle={styles.inputSearchStyle}
              // iconStyle={styles.iconStyle}
              value={newSelectedProducts.map(
                (product) => `${product.id}${product?.unitOfMeasurementId}`
              )}
              // selectedStyle={styles.selectedStyle}
            /> */}
          </View>
          <View style={{ display: "flex", flexDirection: "row", gap: 10 }}>
            <ProButton
              label="Təsdiq et"
              type="primary"
              onClick={handleConfirmClick}
              style={{ width: "45%" }}
              padding={"10px 0"}
              defaultStyle={{ borderRadius: 10 }}
            />
            <ProButton
              label="Sıfırla"
              type="danger"
              flex={false}
              onClick={() => clearModal()}
              style={{ width: "35%" }}
              padding={"10px 0"}
              defaultStyle={{ borderRadius: 10 }}
            />
          </View>
          <Pressable
            style={[styles.button, styles.buttonClose]}
            onPress={() => setModalVisible(false)}
          >
            <AntDesign name="close" size={14} color="black" />
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
    margin: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 35,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  selectBox: {
    marginBottom: 20,
  },
  selectLabel: {
    fontSize: 14,
  },
  buttons: {},
  button: {
    position: "absolute",
    borderRadius: 20,
    padding: 10,
    right: 0,
  },
  // buttonClose: {
  //   backgroundColor: "#2196F3",
  // },
});

export default AddFromCatalog;
