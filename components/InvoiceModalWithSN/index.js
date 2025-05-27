/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useContext } from "react";
import {
  Modal,
  StyleSheet,
  ScrollView,
  View,
  Pressable,
  Text,
} from "react-native";
import math from "exact-math";
import { AntDesign } from "@expo/vector-icons";
import {
  defaultNumberFormat,
  getPriceValue,
  formatNumberToLocale,
  fullDateTimeWithSecond,
} from "../../utils";
import { ProButton, ProText, ProTooltip } from "../../components";
import { Table, Row } from "react-native-reanimated-table";
import { fetchProductInvoices, fetchReturnInvoice } from "../../api";
import { TenantContext } from "../../context";
import CheckBox from "expo-checkbox";
import moment from "moment";
import { includes, isEmpty, filter } from "lodash";

const tableData = {
  tableHead: [
    "No",
    "Qarşı tərəf",
    "Tarix",
    "Qaimə",
    "Qiymət",
    "Seriya nömrə",
    "Seç",
  ],
  widthArr: [50, 140, 140, 140, 100, 140, 60],
  tableData: [],
};

const InvoiceModalWithSN = ({
  type,
  isVisible = false,
  product = {},
  selectedProducts,
  setDiscount,
  setSelectedProducts,
  toggleModal,
  selectedProductsFromModal,
  setSelectedProductFromModal = () => {},
  isProductModal = false,
  productsToHandle = [],
  getValues,
  editId = undefined,
  checkQuantityForContact = false,
  businessId = undefined,
}) => {
  const { BUSINESS_TKN_UNIT } = useContext(TenantContext);

  const BigNumber = require("bignumber.js");
  const { id, productUniqueId, name, invoiceProducts } = product;
  const [data, setData] = useState(tableData);
  const [selectedInvoiceProducts, setSelectedInvoiceProducts] = useState([]);
  const [allInvProductsCheck, setAllInvProductsCheck] = useState(false);
  const [invoicesByProduct, setInvoicesByProduct] = useState([]);

  const [filters, setFilters] = useState({
    counterparties: [],
    invoices: [],
    serialNumbers: [],
  });
  const [statusData, setStatusData] = useState([]);

  useEffect(() => {
    if (isVisible) {
      const selectedProduct = Object.values(invoicesByProduct)?.filter(
        (products) =>
          includes(
            product?.invoiceProducts?.map((d) => d.invoice_product_id) || [],
            products.invoice_product_id
          )
      );

      setSelectedInvoiceProducts(selectedProduct);
      setAllInvProductsCheck(
        selectedProduct?.length > 0 &&
          selectedProduct?.length ===
            getFilteredInvoices(invoicesByProduct, filters)?.length
      );
    }
  }, [invoicesByProduct, product, isVisible]);

  useEffect(() => {
    if (
      isVisible &&
      getFilteredInvoices(invoicesByProduct, filters).length > 0
    ) {
      setData({
        ...data,
        tableData: getFilteredInvoices(invoicesByProduct, filters).map(
          (
            {
              invoice_type,
              counterparty,
              serial_number,
              operation_date,
              invoice_number,
              price,
              invoice_product_id,
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
                  trigger={
                    <Text>{counterparty ? counterparty?.trim() : "-"}</Text>
                  }
                />
              ),
              operation_date
                .split(" ")[0]
                ?.replace(/(\d{4})-(\d\d)-(\d\d)/, "$3-$2-$1"),
              invoice_number,
              <Text>
                {formatNumberToLocale(defaultNumberFormat(price))}
                {currency_code}
              </Text>,
              serial_number,
              <CheckBox
                disabled={
                  selectedInvoiceProducts?.find(
                    (selectedInvoiceProduct) =>
                      selectedInvoiceProduct.invoice_product_id ===
                      invoice_product_id
                  )?.usedQuantity === 1
                }
                value={selectedInvoiceProducts.some(
                  (selectedInvoiceProduct) =>
                    selectedInvoiceProduct.invoice_product_id ===
                    invoice_product_id
                )}
                onValueChange={(event) =>
                  handleInvoiceProduct(event, {
                    invoice_product_id: invoice_product_id,
                  })
                }
              />,
            ];
          }
        ),
      });
    }
  }, [invoicesByProduct, selectedInvoiceProducts, isVisible]);

  //   useEffect(() => {
  //     fetchStatusOperations({
  //       onSuccessCallback: (data) => {
  //         setStatusData(
  //           data.data.filter(
  //             (item) => item.operationId !== 12 && item.operationId !== 7
  //           )
  //         );
  //       },
  //     });
  //   }, []);

  const confirmModal = () => {
    updateProduct(productUniqueId, selectedInvoiceProducts);
    toggleModal();
  };

  const handleInvoiceProduct = (checked, productInvoice) => {
    const { invoice_product_id } = productInvoice;

    if (checked) {
      setAllInvProductsCheck(
        selectedInvoiceProducts?.length + 1 ===
          getFilteredInvoices(invoicesByProduct, filters)?.length
      );
      setSelectedInvoiceProducts((prevSelectedInvoiceProducts) => [
        ...prevSelectedInvoiceProducts,
        {
          ...productInvoice,
          invoiceQuantity: 1,
        },
      ]);
    } else {
      setAllInvProductsCheck(false);
      setSelectedInvoiceProducts(
        selectedInvoiceProducts.filter(
          (selectedInvoiceProduct) =>
            selectedInvoiceProduct.invoice_product_id !== invoice_product_id
        )
      );
    }
  };
  const handleAllInvoiceProduct = (checked) => {
    setAllInvProductsCheck(checked);
    if (checked) {
      setSelectedInvoiceProducts(
        getFilteredInvoices(invoicesByProduct, filters).map(
          (productInvoice) => ({
            ...productInvoice,
            invoiceQuantity: 1,
          })
        )
      );
    } else {
      setSelectedInvoiceProducts([]);
    }
  };

  const clearModal = () => {
    setInvoicesByProduct([]);
    setFilters({
      counterparties: [],
      invoices: [],
      serialNumbers: [],
    });
  };

  useEffect(() => {
    if (isVisible) {
      if (type === "returnFromCustomer") {
        fetchReturnInvoice({
          filter: {
            datetime: moment(getValues("operationDate"))?.format(
              fullDateTimeWithSecond
            ),
            invoiceId: editId,
            ...(checkQuantityForContact
              ? { client: getValues("counterparty") }
              : []),
            businessUnitIds: businessId,
          },
          apiEnd: getValues("stockTo"),
          apiEndTwo: id,
        }).then((data) => {
          setInvoicesByProduct(Object.values(data));
        });
      } else {
        fetchProductInvoices({
          filter: {
            datetime: moment(getValues("operationDate"))?.format(
              fullDateTimeWithSecond
            ),
            invoiceId: editId,
          },
          apiEnd: getValues("stockFrom"),
          apiEndTwo: id,
        }).then((data) => {
          setInvoicesByProduct(Object.values(data));
        });
      }
      if (productsToHandle.length === 0) {
        setSelectedInvoiceProducts(Object.values(invoiceProducts || []));
      } else {
        setSelectedInvoiceProducts(
          productsToHandle.filter((item) => item.productId === id)
        );
      }
    } else {
      clearModal();
      if (!isProductModal) {
        setAllInvProductsCheck(false);
      }
    }
  }, [isVisible]);

  useEffect(() => {
    if (isVisible && !isProductModal) {
      setAllInvProductsCheck(
        invoiceProducts?.length ===
          getFilteredInvoices(invoicesByProduct, filters)?.length
      );
    }
  }, [invoicesByProduct]);

  const getFilteredInvoices = (
    productInvoices,
    { counterparties, invoices, serialNumbers }
  ) => {
    const productSelectedInvoices = selectedProducts.reduce((acc, product) => {
      if (product?.productUniqueId !== productUniqueId && product.id === id) {
        acc.push(...(product?.invoiceProducts ?? []));
      }
      return acc;
    }, []);
    const productFilteredInvoices = isEmpty(productSelectedInvoices)
      ? productInvoices
      : filter(productInvoices, (product) =>
          find(
            productSelectedInvoices,
            (invoice) =>
              invoice?.invoice_product_id !== product.invoice_product_id
          )
        );

    if (
      counterparties.length > 0 ||
      invoices.length > 0 ||
      serialNumbers.length > 0
    ) {
      const newProductInvoices = productFilteredInvoices.filter(
        ({ counterparty, invoice_number, serial_number }) => {
          if (
            (counterparties.length > 0
              ? counterparties.includes(counterparty)
              : true) &&
            (invoices.length > 0 ? invoices.includes(invoice_number) : true) &&
            (serialNumbers.length > 0
              ? serialNumbers.includes(serial_number)
              : true)
          ) {
            return true;
          }
          return false;
        }
      );
      return newProductInvoices;
    }
    return productFilteredInvoices;
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

  const handleFilter = (type, value) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      [type]: value,
    }));
  };

  const updateProduct = (productId, invoiceProducts) => {
    const serialNumbers = Object.values(invoiceProducts)?.map(
      ({ serial_number, invoice_product_id }) =>
        serial_number === undefined
          ? invoicesByProduct?.find(
              (invoiceByProduct) =>
                invoice_product_id === invoiceByProduct.invoice_product_id
            )?.serial_number
          : serial_number
    );
    const invoiceProductForId = Object.values(invoiceProducts)?.find(
      ({ invoice_product_id }) =>
        invoicesByProduct?.some(
          (invoiceByProduct) =>
            invoice_product_id === invoiceByProduct.invoice_product_id
        )
    );
    const invoice_product_id = invoiceProductForId?.invoice_product_id;
    const totalEndPricePerUnit = invoiceProducts.reduce((total, product) => {
      return total + Number(product.priceInMainCurrency || 0);
    }, 0);

    const newSelectedProducts = selectedProducts.map((prevSelectedProduct) => {
      if (productId === prevSelectedProduct.productUniqueId) {
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
      percentage: discountPercentage || undefined,
      amount: discountAmountTotal || undefined,
    });

    if (!isProductModal) {
      setSelectedProducts(newSelectedProducts);
    } else {
      setSelectedProductFromModal(() =>
        selectedProductsFromModal?.map((items) => {
          if (items.productUniqueId === productUniqueId) {
            return {
              ...items,
              serialNumbers: serialNumbers,
              invoice_product_id: invoice_product_id,
              invoiceProducts: invoiceProducts,
              invoiceQuantity: serialNumbers?.length,
            };
          }
          return items;
        })
      );
    }
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
            <View
              style={{ display: "flex", alignItems: "flex-end", height: 300 }}
            >
              <View
                style={{
                  display: "flex",
                  flexDirection: "row",
                  marginBottom: 15,
                }}
              >
                <Text style={{ marginRight: 5 }}>{"Hamısını seç"}</Text>
                <CheckBox
                  onValueChange={(event) => handleAllInvoiceProduct(event)}
                  value={allInvProductsCheck}
                  disabled={
                    getFilteredInvoices(invoicesByProduct, filters)?.length ===
                    0
                  }
                  style={{ marginLeft: "8px" }}
                />
              </View>
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
            <View style={{ display: "flex", flexDirection: "column" }}>
              <Text>Toplam</Text>
              <Text>{selectedInvoiceProducts?.length}</Text>
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

export default InvoiceModalWithSN;
