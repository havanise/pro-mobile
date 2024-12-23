/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useContext } from "react";
import {
  Modal,
  StyleSheet,
  ScrollView,
  View,
  Pressable,
  Text,
  ActivityIndicator,
} from "react-native";
import math from "exact-math";
import { AntDesign } from "@expo/vector-icons";
import {
  defaultNumberFormat,
  getPriceValue,
  formatNumberToLocale,
  fullDateTimeWithSecond,
  roundTo,
} from "../../utils";
import {
  ProButton,
  ProText,
  ProTooltip,
  QuantityInput,
} from "../../components";
import { Table, Row } from "react-native-reanimated-table";
import { fetchProductInvoices } from "../../api";
import { TenantContext } from "../../context";
import CheckBox from "expo-checkbox";
import moment from "moment";
import { filter, find, isEmpty, map, reduce, uniqBy } from "lodash";

const tableDataAll = {
  tableHead: [
    "No",
    "Qarşı tərəf",
    "Tarix",
    "Qaimə",
    "Qiymət",
    "Anbardakı say",
    "Seç",
  ],
  widthArr: [50, 140, 140, 140, 100, 140, 140],
  tableData: [],
};

const InvoiceModalWithoutSN = ({
  type,
  isVisible = false,
  product = {},
  selectedProducts,
  setDiscount,
  setSelectedProducts,
  toggleModal,
  permissionsByKeyValue,
  getValues,
  editId = undefined
}) => {
  const { BUSINESS_TKN_UNIT } = useContext(TenantContext);

  const BigNumber = require("bignumber.js");
  const {
    id,
    productUniqueId,
    name,
    invoiceQuantity,
    invoiceProducts,
    coefficientRelativeToMain,
    unitOfMeasurementId, //main measurement unit
    unitOfMeasurementID,
    unitOfMeasurements,
  } = product;

  const [data, setData] = useState(tableDataAll);
  const [selectedInvoiceProducts, setSelectedInvoiceProducts] = useState([]);
  const [invoicesByProduct, setInvoicesByProduct] = useState([]);
  const [loading, setLoading] = useState(false);
  const [measurements, setMeasurements] = useState([]);
  const [tableData, setTableData] = useState([]);
  const [filters, setFilters] = useState({
    counterparties: [],
    invoices: [],
    measurements: [],
  });

  useEffect(() => {
    if (isVisible && getFilteredInvoices(tableData, filters).length > 0) {
      setLoading(false);
      const mainMeasurement = unitOfMeasurements?.find(
        (measurement) => measurement?.id === unitOfMeasurementId
      );
      setData({
        ...data,
        tableData: getFilteredInvoices(tableData, filters).map(
          (
            {
              invoice_type,
              counterparty,
              quantity,
              unit_of_measurement_name,
              operation_date,
              invoice_number,
              price,
              invoice_product_id: invoiceProductId,
              currency_code,
            },
            index
          ) => {
            return [
              index + 1,
              invoice_type === 11 ? (
                "İSTEHSALAT"
              ) : invoice_type === 7 ? (
                "İlkin qalıq"
              ) : (
                <ProTooltip
                  containerStyle={{ width: 145, height: "auto" }}
                  popover={<Text>{counterparty || ""}</Text>}
                >
                  <Text>{counterparty ? counterparty?.trim() : "-"}</Text>
                </ProTooltip>
              ),
              operation_date
                .split(" ")[0]
                ?.replace(/(\d{4})-(\d\d)-(\d\d)/, "$3-$2-$1"),
              invoice_number,
              <Text>
                {formatNumberToLocale(defaultNumberFormat(price))}
                {currency_code}
              </Text>,
              `${formatNumberToLocale(defaultNumberFormat(quantity))} ${
                unitOfMeasurements?.length > 1
                  ? unit_of_measurement_name ??
                    mainMeasurement?.unitOfMeasurementName
                  : ""
              }`,
              <QuantityInput
                onChange={handleProductQuantityChange}
                product={{
                  invoice_type,
                  counterparty,
                  quantity,
                  unit_of_measurement_name,
                  operation_date,
                  invoice_number,
                  price,
                  invoice_product_id: invoiceProductId,
                  currency_code,
                }}
                hasMultiMeasurement={unitOfMeasurements.length > 1}
                selectedProduct={{
                  ...selectedInvoiceProducts?.find(
                    ({ invoice_product_id }) =>
                      invoice_product_id === invoiceProductId
                  ),
                }}
                type="sales"
                value={`${
                  selectedInvoiceProducts?.find(
                    ({ invoice_product_id }) =>
                      invoice_product_id === invoiceProductId
                  )?.invoiceQuantity || 0
                }`}
              />,
            ];
          }
        ),
      });
    } else {
      setLoading(false);
    }
  }, [invoicesByProduct, selectedInvoiceProducts, isVisible]);

  const getColumns = ({ column }) => {
    const selectedMeasurement = unitOfMeasurements?.find(
      (measurement) => measurement?.id === unitOfMeasurementID
    );
    const mainMeasurement = unitOfMeasurements?.find(
      (measurement) => measurement?.id === unitOfMeasurementId
    );
    const columns = [];
    columns[column.indexOf("counterparty")] = {
      title: "Qarşı tərəf",
      dataIndex: "counterparty",
      align: "left",
      width: 150,
      ellipsis: true,
      render: (value, row) =>
        row.invoice_type === 11 ? (
          "İSTEHSALAT"
        ) : row.invoice_type === 7 ? (
          "İlkin qalıq"
        ) : (
          <Tooltip placement="topLeft" title={value || ""}>
            <span>{value ? value?.trim() : "-"}</span>
          </Tooltip>
        ),
    };

    columns[column.indexOf("operation_date")] = {
      title: "Tarix",
      dataIndex: "operation_date",
      render: (value) =>
        value.split(" ")[0]?.replace(/(\d{4})-(\d\d)-(\d\d)/, "$3-$2-$1") ||
        "-",
    };
    columns[column.indexOf("invoice_number")] = {
      title: "Qaimə",
      dataIndex: "invoice_number",
      render: (value) => value,
    };

    if (
      permissionsByOperationType[type] &&
      permissionsByKeyValue[permissionsByOperationType[type]].permission !== 0
    ) {
      columns[column.indexOf("price")] = {
        title: "Qiymət",
        dataIndex: "price",
        align: "left",
        render: (value, { currency_code }) =>
          `${formatNumberToLocale(
            defaultNumberFormat(value)
          )} ${currency_code}`,
      };
    } else if (!permissionsByOperationType[type]) {
      columns[column.indexOf("price")] = {
        title: "Qiymət",
        dataIndex: "price",
        align: "left",
        render: (value, { currency_code }) =>
          `${formatNumberToLocale(
            defaultNumberFormat(value)
          )} ${currency_code}`,
      };
    }
    columns[column.indexOf("quantity")] = {
      title: "Anbardakı say",
      dataIndex: "quantity",
      align: "center",
      render: (value, row) => {
        return `${formatNumberToLocale(defaultNumberFormat(value))} ${
          unitOfMeasurements?.length > 1
            ? row?.unit_of_measurement_name ??
              mainMeasurement?.unitOfMeasurementName
            : ""
        }`;
      },
    };
    if (unitOfMeasurements?.length > 1) {
      columns[column.indexOf("convertedQuantity")] = {
        title: `Anbardakı say (${selectedMeasurement?.unitOfMeasurementName})`,
        width: 150,
        dataIndex: "convertedQuantity",
        align: "center",
        render: (value, row) => (
          <>
            {`${formatNumberToLocale(defaultNumberFormat(Number(value)))}`}
            <Tooltip
              title={unitOfMeasurements?.map((unit) => (
                <div>
                  {`${formatNumberToLocale(
                    defaultNumberFormat(
                      math.mul(
                        math.div(
                          Number(row.quantity || 0),
                          Number(unit?.coefficientRelativeToMain || 1)
                        ),
                        Number(row?.coefficient || 0)
                      )
                    )
                  )} ${unit.unitOfMeasurementName}`}
                </div>
              ))}
            >
              <Button type="link" style={{ fontSize: "20px" }}>
                <Icon component={FaInfoCircle} />
              </Button>
            </Tooltip>
          </>
        ),
      };
    }
    columns.unshift({
      title: "№",
      width: 65,
      render: (value, row, index) => index + 1,
    });
    columns.push({
      title: "Seç",
      dataIndex: "invoice_product_id",
      key: "quantityInput",
      align: "center",
      width: 150,
      render: (value, row) => {
        return (
          <QuantityInput
            onChange={handleProductQuantityChange}
            product={row}
            hasMultiMeasurement={unitOfMeasurements.length > 1}
            selectedProduct={{
              ...selectedInvoiceProducts?.find(
                ({ invoice_product_id }) => invoice_product_id === value
              ),
            }}
            type="sales"
            value={`${
              selectedInvoiceProducts?.find(
                ({ invoice_product_id }) => invoice_product_id === value
              )?.invoiceQuantity || 0
            }`}
          />
        );
      },
    });
    return columns;
  };

  const confirmModal = () => {
    const validInvoiceProductsCount =
      selectedInvoiceProducts?.filter(
        ({ invoiceQuantity, usedQuantity }) =>
          Number(invoiceQuantity) > 0 && Number(usedQuantity) > 0
      )?.length || 0;

    const usedInvoiceProductsCount =
      invoiceProducts?.filter(({ usedQuantity }) => Number(usedQuantity) > 0)
        ?.length || 0;

    if (
      selectedInvoiceProducts?.some(
        ({ invoiceQuantity, usedQuantity }) =>
          Number(invoiceQuantity) > 0 && usedQuantity > invoiceQuantity
      ) ||
      (invoiceProducts?.filter(({ usedQuantity }) => Number(usedQuantity) > 0)
        ?.length > 0 &&
        validInvoiceProductsCount < usedInvoiceProductsCount)
    ) {
      toast.error("Məhsul sayı düzgün qeyd olunmamışdır.");
    } else {
      updateProduct(
        productUniqueId,
        selectedInvoiceProducts?.filter(
          (invProducts) => Number(invProducts.invoiceQuantity) > 0
        )
      );
      toggleModal();
    }
  };

  const filterDuplicates = (invoicesByProduct, field) => {
    const data = [];
    return invoicesByProduct.reduce((total, current) => {
      if (data.includes(current[field])) {
        return total;
      }
      data.push(current[field]);
      return [...total, { name: current[field] }];
    }, []);
  };

  const checkInvoiceIsSelected = (invoiceProductId) => {
    const searchedInvoice = selectedInvoiceProducts.find(
      (selectedInvoice) =>
        selectedInvoice.invoice_product_id === invoiceProductId
    );
    return {
      isExists: !!searchedInvoice,
    };
  };

  const removeSelectedInvoiceProduct = (invoiceProductId) => {
    setSelectedInvoiceProducts((prevSelectedInvoiceProducts) =>
      prevSelectedInvoiceProducts.filter(
        ({ invoice_product_id }) => invoice_product_id !== invoiceProductId
      )
    );
  };

  const addInvoiceProduct = (invoiceProduct) => {
    setSelectedInvoiceProducts((prevSelectedInvoiceProducts) => [
      ...prevSelectedInvoiceProducts,
      invoiceProduct,
    ]);
  };

  const updateExistsInvoiceProduct = (
    invoiceProductId,
    newInvoiceProductQuantity,
    convertedQuantityDefault
  ) => {
    setSelectedInvoiceProducts((prevSelectedInvoiceProducts) =>
      prevSelectedInvoiceProducts.map((prevSelectedInvoiceProduct) => {
        if (
          prevSelectedInvoiceProduct.invoice_product_id === invoiceProductId
        ) {
          return {
            ...prevSelectedInvoiceProduct,
            invoiceQuantity:
              Number(
                prevSelectedInvoiceProduct?.convertedQuantity ||
                  convertedQuantityDefault
              ) >= Number(newInvoiceProductQuantity || 0)
                ? newInvoiceProductQuantity
                : prevSelectedInvoiceProduct.invoiceQuantity,
          };
        }
        return prevSelectedInvoiceProduct;
      })
    );
  };

  const handleProductQuantityChange = (newQuantity, productInvoice) => {
    const { invoice_product_id, serial_number, price } = productInvoice;
    const { isExists } = checkInvoiceIsSelected(invoice_product_id);
    if (newQuantity) {
      if (isExists) {
        return updateExistsInvoiceProduct(
          invoice_product_id,
          newQuantity,
          productInvoice?.convertedQuantity
        );
      }

      const currentProduct = invoiceProducts?.find(
        (item) => item.invoice_product_id === invoice_product_id
      );

      return addInvoiceProduct({
        convertedQuantity: productInvoice?.convertedQuantity,
        usedQuantity: currentProduct?.usedQuantity,
        invoice_product_id,
        serial_number,
        price,
        invoiceQuantity: newQuantity,
      });
    }
    return removeSelectedInvoiceProduct(invoice_product_id);
  };

  const handleFilter = (type, value) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      [type]: value,
    }));
  };

  const divideQuantityForInvoices = (invoiceProducts, hasMultiMeasurement) => {
    const selectedInvoices = [];
    let totalQuantity = Number(invoiceQuantity);
    invoiceProducts.forEach((invoiceProduct) => {
      const quantity = hasMultiMeasurement
        ? invoiceProduct.convertedQuantity
        : invoiceProduct.quantity;
      if (Number(totalQuantity) === 0) {
        return;
      }
      if (totalQuantity >= Number(quantity)) {
        selectedInvoices.push({
          ...invoiceProduct,
          invoiceQuantity: Number(quantity),
        });
        totalQuantity -= Number(quantity);
      } else if (totalQuantity < Number(quantity)) {
        selectedInvoices.push({
          ...invoiceProduct,
          invoiceQuantity: totalQuantity,
        });
        totalQuantity = 0;
      }
    });
    setSelectedInvoiceProducts(selectedInvoices);
  };

  const clearModal = () => {
    // clearInvoicesByProduct();
    setSelectedInvoiceProducts([]);
    setFilters({
      counterparties: [],
      invoices: [],
      measurements: [],
    });
  };

  const getFilteredInvoices = (
    productInvoices,
    { counterparties, invoices, measurements }
  ) => {
    if (
      counterparties.length > 0 ||
      invoices.length > 0 ||
      measurements.length > 0
    ) {
      const newProductInvoices = productInvoices.filter(
        ({ counterparty, invoice_number, unit_of_measurement_name }) => {
          if (
            (counterparties.length > 0
              ? counterparties.includes(counterparty)
              : true) &&
            (invoices.length > 0 ? invoices.includes(invoice_number) : true) &&
            (measurements.length > 0
              ? measurements.includes(
                  find(
                    unitOfMeasurements,
                    (unit) =>
                      unit.unitOfMeasurementName === unit_of_measurement_name
                  )?.id
                )
              : true)
          ) {
            return true;
          }
          return false;
        }
      );
      return newProductInvoices;
    }
    return productInvoices;
  };

  const updateProduct = (productId, invoiceProducts) => {
    const calculateDiscountValues = (newSelectedProducts) => {
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
        percentage: discountPercentage || undefined,
        amount: roundTo(discountAmountTotal, 3) || undefined,
      });
    };
    const totalQuantity = invoiceProducts.reduce(
      (totalValue, { invoiceQuantity }) =>
        math.add(totalValue, Number(invoiceQuantity) || 0),
      0
    );
    const totalEndPricePerUnit = invoiceProducts.reduce((total, product) => {
      return total + Number(product.priceInMainCurrency || 0);
    }, 0);
    const totalPrice = invoiceProducts
      .filter(({ invoiceQuantity }) => Number(invoiceQuantity) > 0)
      .map((item) => ({
        ...item,
        price:
          getFilteredInvoices(tableData, filters).find(
            ({ invoice_product_id }) =>
              item.invoice_product_id === invoice_product_id
          )?.price ?? 0,
      }))
      .reduce(
        (totalValue, { price }) => math.add(totalValue, Number(price) || 0),
        0
      );
    if (type === "returnFromCustomer" || type === "returnToSupplier") {
      const newSelectedProducts = selectedProducts.map((selectedProduct) => {
        if (productId === selectedProduct?.productUniqueId) {
          let totalPricePerProduct = 0.0;
          let totalEndPricePerProduct = 0.0;

          totalPricePerProduct = new BigNumber(
            math.mul(
              Number(selectedProduct.invoicePrice || 0),
              Number(totalQuantity || 1)
            )
          );
          totalEndPricePerProduct = new BigNumber(
            math.mul(
              Number(
                selectedProduct.discountedPrice ?? selectedProduct.invoicePrice
              ),
              Number(totalQuantity || 1)
            )
          );

          return {
            ...selectedProduct,
            invoiceQuantity: `${totalQuantity}`,
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
            invoiceProducts,
          };
        }
        return selectedProduct;
      });

      calculateDiscountValues(newSelectedProducts);
      // handleQuantityChange(selectedProductİd, quantity);
      setSelectedProducts(newSelectedProducts);
    } else {
      const newSelectedProducts = selectedProducts.map((selectedProduct) => {
        if (productId === selectedProduct.productUniqueId) {
          let totalPricePerProduct = 0.0;
          let totalEndPricePerProduct = 0.0;
          if (selectedProduct.invoicePrice) {
            totalPricePerProduct = new BigNumber(
              math.mul(
                Number(selectedProduct.invoicePrice || 0),
                Number(totalQuantity || 1)
              )
            );
            totalEndPricePerProduct = new BigNumber(
              math.mul(
                Number(
                  selectedProduct.discountedPrice ??
                    selectedProduct.invoicePrice
                ),
                Number(totalQuantity || 1)
              )
            );
          }

          return {
            ...selectedProduct,
            invoiceQuantity: `${totalQuantity}`,
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
            invoiceProducts,
          };
        }
        return selectedProduct;
      });

      calculateDiscountValues(newSelectedProducts);
      setSelectedProducts(newSelectedProducts);
    }
  };

  const getFilteredInvoiceByUsedProduct = (products) => {
    const usedInvoiceProducts = reduce(
      filter(
        selectedProducts,
        (row) => row.productUniqueId !== productUniqueId
      ),
      (acc, curr) => {
        map(curr.invoiceProducts, (product) => {
          acc[product.invoice_product_id] = math.add(
            Number(acc[product.invoice_product_id]?.invoiceQuantity || 0),
            math.mul(
              Number(product.invoiceQuantity || 0),
              Number(curr?.coefficientRelativeToMain || 1)
            )
          );
        });
        return acc;
      },
      {}
    );
    const filteredInvoiceData = map(products, (productData) => ({
      ...productData,
      convertedQuantity: math.sub(
        Number(productData?.convertedQuantity || 0),
        math.div(
          Number(usedInvoiceProducts[productData?.invoice_product_id] || 0),
          Number(coefficientRelativeToMain || 1)
        )
      ),
    }));

    return filter(filteredInvoiceData, (invoiceData) =>
      Number(invoiceData?.convertedQuantity || 0)
    );
  };
  useEffect(() => {
    if (isVisible) {
      setLoading(true);
      fetchProductInvoices({
        filter: {
          datetime: moment(getValues("operationDate"))?.format(
            fullDateTimeWithSecond
          ),
          ...(unitOfMeasurementID && { unitOfMeasurementID }),
          invoiceId: editId
        },
        apiEnd: getValues("stockFrom"),
        apiEndTwo: id,
      }).then((data) => {
        const invoiceData = getFilteredInvoiceByUsedProduct(
          Object.values(data)
        );
        setInvoicesByProduct(Object.values(data));
        if (
          !isEmpty(filter(invoiceProducts, (row) => row.invoice_product_id))
        ) {
          setSelectedInvoiceProducts(invoiceProducts);
          return;
        } else {
          divideQuantityForInvoices(invoiceData, unitOfMeasurements.length > 1);
          return;
        }
      });
    } else {
      clearModal();
    }
  }, [isVisible]);

  useEffect(() => {
    if (!isEmpty(invoicesByProduct) && isVisible) {
      const invoiceProductData = [...invoicesByProduct]?.map((item) => ({
        ...item,
        quantity: item.active_quantity,
      }));

      setTableData(
        getFilteredInvoiceByUsedProduct(invoiceProductData)?.sort((a, b) =>
          math.sub(
            Number(
              invoiceProducts?.find(
                ({ invoice_product_id }) =>
                  invoice_product_id === b?.invoice_product_id
              )?.invoiceQuantity || 0
            ),
            Number(
              invoiceProducts?.find(
                ({ invoice_product_id }) =>
                  invoice_product_id === a?.invoice_product_id
              )?.invoiceQuantity || 0
            )
          )
        )
      );
    } else {
      setTableData([]);
    }
  }, [invoicesByProduct, isVisible, invoiceProducts]);

  const ajaxMeasurementSelectRequest = (
    page = 1,
    limit = 20,
    search = "",
    stateReset = 0,
    onSuccessCallback
  ) => {
    const defaultFilters = { limit, page, q: search };
    fetchMeasurements(defaultFilters, (data) => {
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
        setMeasurements(appendList);
      } else {
        setMeasurements(measurements.concat(appendList));
      }
    });
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={() => {
        toggleModal();
      }}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <ProText variant="heading" style={{ color: "black" }}>
            {name}
            {`- ${
              unitOfMeasurements?.find(
                (measurement) => measurement?.id === unitOfMeasurementID
              )?.unitOfMeasurementName
            }`}
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
            <View style={{ alignItems: "center", marginBottom: "40px" }}>
              {
                <View span={6}>
                  {/* <ProSelect
                    label="Qarşı tərəf"
                      mode="multiple"
                      id={false}
                      value={filters.counterparties}
                      data={filterDuplicates(
                        invoicesByProduct,
                        "counterparty"
                      )?.map((contact) => ({
                        ...contact,
                        name: `${contact.name} (${contact.id})`,
                      }))}
                      onChange={(values) =>
                        handleFilter("counterparties", values)
                      }
                    /> */}
                </View>
              }

              <View>
                {/* <ProSelect
                  label="Qaimə"
                  mode="multiple"
                  id={false}
                  value={filters.invoices}
                  data={filterDuplicates(invoicesByProduct, "invoice_number")}
                  onChange={(values) => handleFilter("invoices", values)}
                /> */}
              </View>
              <View>
                {/* <ProSelect
                  label="Seriya nömrə"
                  mode="multiple"
                  id={false}
                  value={filters.serialNumbers}
                  data={Object.values(invoicesByProduct).map(
                    ({ serial_number }) => ({
                      name: serial_number,
                    })
                  )}
                  onChange={(values) => handleFilter("serialNumbers", values)}
                /> */}
              </View>
            </View>
            {
              <View
                style={{ display: "flex", alignItems: "flex-end", height: 300 }}
              >
                <ScrollView>
                  <ScrollView
                    nestedScrollEnabled={true}
                    horizontal={true}
                    style={{ height: "100%" }}
                  >
                    {loading ? (
                      <ActivityIndicator color={"#37B874"} />
                    ) : (
                      <Table
                        borderStyle={{ borderWidth: 1, borderColor: "white" }}
                      >
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
                    )}
                  </ScrollView>
                </ScrollView>
              </View>
            }
            <View style={{ display: "flex", flexDirection: "column" }}>
              <Text>Toplam</Text>
              <Text>{`${selectedInvoiceProducts?.reduce(
                (total, { invoiceQuantity }) =>
                  math.add(total, Number(invoiceQuantity) || 0),
                0
              )}`}</Text>
            </View>
          </View>
          <View style={{ display: "flex", flexDirection: "row", gap: 10 }}>
            <ProButton
              label="Təsdiq et"
              type="primary"
              flex={false}
              onClick={confirmModal}
              style={{ width: "45%" }}
              padding={"10px 0"}
              defaultStyle={{ borderRadius: 10 }}
            />
          </View>
          <Pressable
            style={[styles.button, styles.buttonClose]}
            onPress={() => toggleModal()}
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

export default InvoiceModalWithoutSN;
