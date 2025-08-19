import React, { useMemo, useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  useWindowDimensions,
  ScrollView,
  StyleSheet,
  Alert,
  Modal,
  Platform,
} from "react-native";
import Toast from "react-native-toast-message";
import moment from "moment";
import CheckBox from "expo-checkbox";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import uuid from "react-uuid";
import { TenantContext } from "../../context";
import {
  TabView,
  TabBar,
  SceneMap,
  SceneRendererProps,
} from "react-native-tab-view";
import { debounce, filter, find, isNil, trim } from "lodash";
import { useApi } from "../../hooks";
import {
  MaterialIcons,
  Feather,
  AntDesign,
  FontAwesome,
} from "@expo/vector-icons";
import {
  ProAsyncSelect,
  ProText,
  ProButton,
  ProInput,
  ProTooltip,
  SelectFromProductModal,
  BronModal,
} from "../../components";
import { useForm, Controller } from "react-hook-form";
import { Table, TableWrapper, Row, Cell } from "react-native-reanimated-table";
import ProDateTimePicker from "../../components/ProDateTimePicker";
import {
  getCurrencies,
  getPurchaseProducts,
  getCounterparties,
  getEmployees,
  getStock,
  fetchProducts,
  editInvoice,
  createInvoice,
  getContracts,
  fetchProductInvoices,
  getProducts,
  fetchStatusOperations,
  getCost,
} from "../../api";
import { useDebounce } from "use-debounce";
import {
  defaultNumberFormat,
  toFixedNumber,
  formatNumberToLocale,
  generateProductMultiMesaurements,
  roundToDown,
  roundTo,
  accountTypes,
  re_paymentAmount,
  re_amount,
  fullDateTimeWithSecond,
  customRound,
  getPriceValue,
} from "../../utils";
import AddFromCatalog from "../../components/AddFromCatalog";
import InvoiceModalWithSN from "../../components/InvoiceModalWithSN";
import InvoiceModalWithoutSN from "../../components/InvoiceModalWithoutSN";
import { backgroundColor } from "@shopify/restyle";
import { changeNumber } from "../../utils/constants";

const math = require("exact-math");
const BigNumber = require("bignumber.js");

const tableData = {
  tableHead: [
    "No",
    "Məhsul adı",
    "Say",
    "Ölçü vahidi",
    "Anbardakı miqdar",
    "Bron sayı",
    "Qaimədən seç",
    "Seriya nömrələri",
    "Sil",
  ],
  widthArr: [50, 140, 140, 140, 100, 140, 140, 100, 60],
  tableData: [],
};

const FirstRoute = (props) => {
  const {
    control,
    handleSubmit,
    errors,
    onSubmit,
    navigation,
    setValue,
    getValues,
    currencies,
    setCurrencies,
    BUSINESS_TKN_UNIT,
    loading,
    watch,
    profile,
    statusData,
    id,
    businessUnit,
    invoiceInfo,
    editDate,
  } = props;

  const [employees, setEmployees] = useState([]);
  const [unitStock, setUnitStock] = useState(undefined);
  const [contracts, setContracts] = useState([]);
  const [stock, setStock] = useState([]);
  const [defaultSelectedSalesman, setDefaultSelectedSalesman] = useState([]);

  const { isLoading, run } = useApi({
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

  const { isLoading: isLoadContracts, run: runContracts } = useApi({
    deferFn: getContracts,
    onResolve: (data) => {
      setContracts(
        data.map((item) => ({
          ...item,
          label: item.contract_no ? item.contract_no : item.serialNumber,
          value: item.id,
        }))
      );
    },
    onReject: (error) => {
      console.log(error, "rejected");
    },
  });

  const { isLoading: isLoadEmployee, run: runEmployee } = useApi({
    deferFn: getEmployees,
    onResolve: (data) => {
      setEmployees(
        data.map((item) => ({
          ...item,
          label: `${item.name} ${item.lastName}`,
          value: item.id,
        }))
      );
    },
    onReject: (error) => {
      console.log(error, "rejected");
    },
  });

  const { isLoading: isLoadStock, run: runStock } = useApi({
    deferFn: getStock,
    onResolve: (data) => {
      setStock(
        data.map((item) => ({
          ...item,
          label: item.name,
          value: item.id,
        }))
      );
    },
    onReject: (error) => {
      console.log(error, "rejected");
    },
  });

  useEffect(() => {
    if (profile?.id && !id) {
      getEmployees({
        filters: { ids: [profile?.id] },
      }).then((data) => {
        setDefaultSelectedSalesman(
          data.map((item) => ({
            ...item,
            label: `${item.name} ${item.lastName}`,
            value: item.id,
          }))
        );
      });
      setValue("saleManager", profile?.id);
    } else if (id) {
      setDefaultSelectedSalesman([
        {
          label: `${invoiceInfo.salesmanName} ${invoiceInfo.salesmanLastName}`,
          value: invoiceInfo.salesmanId,
          id: invoiceInfo.salesmanId,
        },
      ]);
      setValue("saleManager", invoiceInfo.salesmanId);
    }
  }, [profile]);

  useEffect(() => {
    setUnitStock(
      stock
        ?.find((item) => item.id === getValues("stockFrom"))
        ?.transferStocks?.map((item) => ({
          ...item,
          label: item.name,
          value: item.id,
        }))
    );
  }, [watch("stockFrom"), stock]);

  useEffect(() => {
    if (currencies.length > 0) {
      setValue("currency", currencies.find(({ isMain }) => isMain)?.id);
    }
  }, [currencies]);

  useEffect(() => {
    run({
      limit: 1000,
      withRatesOnly: 1,
      applyBusinessUnitTenantPersonFilter: 1,
      businessUnitIds: id
        ? businessUnit === null
          ? [0]
          : [businessUnit]
        : BUSINESS_TKN_UNIT
        ? [BUSINESS_TKN_UNIT]
        : undefined,
    });
    runEmployee({
      filter: {
        limit: 20,
        page: 1,
        applyBusinessUnitTenantPersonFilter: 1,
        businessUnitIds: id
          ? businessUnit === null
            ? [0]
            : [businessUnit]
          : BUSINESS_TKN_UNIT
          ? [BUSINESS_TKN_UNIT]
          : undefined,
      },
    });
    runStock({
      filter: {
        limit: 20,
        page: 1,
        applyBusinessUnitTenantPersonFilter: 1,
        businessUnitIds: id
          ? businessUnit === null
            ? [0]
            : [businessUnit]
          : BUSINESS_TKN_UNIT
          ? [BUSINESS_TKN_UNIT]
          : undefined,
        isActive: 1,
        includeTransferStocks: 1,
      },
    });
  }, []);

  useEffect(() => {
    if (getValues("counterparty")) {
      runContracts({
        filter: {
          limit: 20,
          page: 1,
          status: 1,
          directions: [1],
          businessUnitIds: id
            ? businessUnit === null
              ? [0]
              : [businessUnit]
            : BUSINESS_TKN_UNIT
            ? [BUSINESS_TKN_UNIT]
            : undefined,
          contacts: [getValues("counterparty")],
          endDateFrom: moment(getValues("operationDate"))?.format("DD-MM-YYYY"),
        },
      });
    }
  }, [getValues("counterparty")]);

  return (
    <ScrollView>
      <View
        style={{
          paddingTop: 40,
          paddingLeft: 10,
          paddingRight: 10,
          paddingBottom: 40,
        }}
      >
        {id && (
          <ProText variant="heading" style={{ color: "black" }}>
            Sənəd: {invoiceInfo.invoiceNumber}
          </ProText>
        )}
        <ProText variant="heading" style={{ color: "black" }}>
          {id ? "Düzəliş et" : "Yeni əməliyyat"}
        </ProText>
        <Text style={{ fontSize: 18 }}>Transfer</Text>

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
          <ProDateTimePicker
            name="operationDate"
            control={control}
            setValue={setValue}
            editDate={editDate}
          />
          <ProAsyncSelect
            label="Menecer"
            data={[
              ...defaultSelectedSalesman,
              ...employees.filter(
                (item) =>
                  !defaultSelectedSalesman
                    .map(({ id }) => id)
                    ?.includes(item.id)
              ),
            ]}
            setData={setEmployees}
            fetchData={getEmployees}
            async
            filter={{
              limit: 20,
              page: 1,
              applyBusinessUnitTenantPersonFilter: 1,
              businessUnitIds: id
                ? businessUnit === null
                  ? [0]
                  : [businessUnit]
                : BUSINESS_TKN_UNIT
                ? [BUSINESS_TKN_UNIT]
                : undefined,
            }}
            control={control}
            required
            valueName="lastName"
            combineValue
            name="saleManager"
          />
          <ProAsyncSelect
            async
            label="Anbar(Haradan)"
            data={stock}
            setData={setStock}
            fetchData={getStock}
            filter={{
              limit: 20,
              page: 1,
              applyBusinessUnitTenantPersonFilter: 1,
              businessUnitIds: id
                ? businessUnit === null
                  ? [0]
                  : [businessUnit]
                : BUSINESS_TKN_UNIT
                ? [BUSINESS_TKN_UNIT]
                : undefined,
              isActive: 1,
              includeTransferStocks: 1,
            }}
            control={control}
            name="stockFrom"
            required
          />
          <ProAsyncSelect
            label="Anbar(Haraya)"
            data={unitStock}
            setData={() => {}}
            fetchData={() => {}}
            filter={{}}
            control={control}
            async={false}
            name="stockTo"
            required
          />
          {statusData.some((item) => item.isStatusActive === true) ? (
            <ProAsyncSelect
              label="İcra statusu"
              data={statusData[0]?.statuses?.map((item) => ({
                ...item,
                label: item.name,
                value: item.id,
              }))}
              setData={() => {}}
              fetchData={() => {}}
              async={false}
              filter={{}}
              required
              control={control}
              allowClear={false}
              name="status"
            />
          ) : null}
        </View>
        <View style={{ display: "flex", flexDirection: "row" }}>
          <ProButton
            label="Təsdiq et"
            type="primary"
            onClick={handleSubmit(onSubmit)}
            loading={loading}
          />
          <ProButton
            label="İmtina"
            type="transparent"
            onClick={() => navigation.push("DashboardTabs")}
          />
        </View>
      </View>
    </ScrollView>
  );
};

const SecondRoute = (props) => {
  const {
    handleSubmit,
    onSubmit,
    navigation,
    getValues,
    selectedProducts,
    setSelectedProducts,
    currencies,
    setDiscount,
    BUSINESS_TKN_UNIT,
    loading,
    setValue,
    businessUnit,
    id,
  } = props;

  const [data, setData] = useState(tableData);
  const [serialNumber, setSerialNumber] = useState(false);
  const [productsByName, setProductsByName] = useState([]);
  const [selectedExpenses, setSelectedExpenses] = useState([]);
  const [catalogModalIsVisible, setCatalogModalIsVisible] = useState(false);
  const [invoiceModalWithSN, setInvoiceModalWithSN] = useState(false);
  const [invoiceModalWithoutSN, setInvoiceModalWithoutSN] = useState(false);
  const [invoiceModalIsVisible, setInvoiceModalIsVisible] = useState(false);
  const [totalEndPricePerUnit, setTotalEndPricePerUnit] = useState(0);
  const [totalSalesPrice, setTotalSalesPrice] = useState(0);
  const [selectedRow, setSelectedRow] = useState(undefined);
  const [bronModal, setBronModal] = useState(false);
  const [load, setLoad] = useState(false);
  const [open, setOpen] = useState(false);
  const [cost, setCost] = useState(false);
  const [productData, setProductData] = useState();

  const handleBron = (productId, productName) => {
    setBronModal(true);
    setProductData({
      id: productId,
      name: productName,
      stocks: getValues("stockFrom"),
    });
  };

  const handleProductRemove = (productId) => {
    const newSelectedProducts = selectedProducts.filter(
      (selectedProduct) => selectedProduct.productUniqueId !== productId
    );
    setSelectedProducts(newSelectedProducts);
  };

  const setProductQuantity = (productId, newQuantity, transfer, totalPrice) => {
    const newSelectedProducts = selectedProducts.map((selectedProduct) => {
      if (
        productId === (selectedProduct.productUniqueId ?? selectedProduct.id)
      ) {
        let totalPricePerProduct = 0.0;
        let totalPricePerProductBack = 0.0;
        let totalEndPricePerProduct = 0.0;
        let totalRoadTaxAmount = 0;
        const totalTaxAmount = math.mul(
          parseFloat(selectedProduct.taxAmount || 0) || 0,
          parseFloat(newQuantity || 0)
        );
        const taxAmountWithPrice = math.add(
          parseFloat(selectedProduct.discountedPrice || 0),
          math.div(
            math.mul(
              parseFloat(selectedProduct.taxAmount || 0) || 0,
              parseFloat(selectedProduct.discountedPrice || 0)
            ),
            100
          )
        );
        const totalTaxAmountWithPrice = math.mul(
          parseFloat(taxAmountWithPrice || 0),
          parseFloat(newQuantity || 0)
        );
        if (selectedProduct.invoicePrice) {
          totalPricePerProduct = new BigNumber(
            math.mul(
              parseFloat(selectedProduct.invoicePrice || 0),
              parseFloat(newQuantity || 0)
            )
          );
          totalPricePerProductBack = new BigNumber(
            math.mul(
              parseFloat(selectedProduct.invoicePriceBack || 0),
              parseFloat(newQuantity || 0)
            )
          );
          totalRoadTaxAmount = new BigNumber(
            math.mul(
              parseFloat(newQuantity || 0),
              parseFloat(selectedProduct?.roadTaxAmount || 0)
            )
          );
          totalEndPricePerProduct = new BigNumber(
            math.add(
              math.sub(
                getPriceValue(totalPricePerProduct) || 0,
                math.mul(
                  parseFloat(getPriceValue(totalPricePerProduct) || 0),
                  math.div(selectedProduct?.discountPercentage || 0, 100)
                )
              ),
              getPriceValue(totalRoadTaxAmount)
            )
          );
        }
        return {
          ...selectedProduct,
          totalWeight: math.mul(
            parseFloat(newQuantity || 1),
            Number(selectedProduct?.totalWeight || 0)
          ),
          totalVolume: math.mul(
            parseFloat(newQuantity || 1),
            Number(selectedProduct?.totalVolume || 0)
          ),
          totalTaxAmount: totalTaxAmount,
          totalTaxAmountWithPrice: parseFloat(totalTaxAmountWithPrice)?.toFixed(
            4
          ),
          inCorrectTotalTaxAmountWithPriceValue: false,
          inCorrectTaxAmountWithPriceValue: false,
          invoiceQuantity: !transfer
            ? newQuantity
            : selectedProduct?.invoiceQuantity,
          transferinvoiceQuantity: transfer
            ? newQuantity
            : selectedProduct?.transferinvoiceQuantity,
          endPriceInMainCurrency:
            totalPrice || selectedProduct?.endPriceInMainCurrency || 0,
          invoiceProducts: undefined,
          totalRoadTaxAmount: getPriceValue(totalRoadTaxAmount)?.toFixed(4),
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
          handledSN: true,
        };
      }
      return selectedProduct;
    });
    const newtotalPrice = newSelectedProducts.reduce(
      (totalPrice, { totalPricePerProduct }) =>
        math.add(totalPrice, parseFloat(totalPricePerProduct || 0)),
      0
    );
    const discountAmount = newSelectedProducts.reduce(
      (
        totalDiscountAmount,
        { totalPricePerProduct, discountPercentage, totalEndPricePerProduct }
      ) =>
        math.add(
          totalDiscountAmount,
          parseFloat(discountPercentage ?? 0)
            ? math.sub(
                parseFloat(totalPricePerProduct || 0),
                parseFloat(totalEndPricePerProduct || 0)
              )
            : 0
        ),
      0
    );
    const discountPercentage = math.mul(
      math.div(parseFloat(discountAmount || 0), newtotalPrice || 1),
      100
    );
    setDiscount(
      parseFloat(discountPercentage ?? 0)
        ? {
            percentage: toFixedNumber(parseFloat(discountPercentage || 0), 4),
            amount: discountAmount,
          }
        : {}
    );
    setSelectedProducts(newSelectedProducts);
  };

  const handleQuantityChange = (
    productId,
    newQuantity,
    quantity,
    draftMode = false,
    transfer = false,
    totalPrice
  ) => {
    let checkQuantity = Platform.OS === 'ios' ? changeNumber(newQuantity) : newQuantity
    const limit = Number(quantity) >= 0 ? Number(quantity) : 10000000;
    if (re_amount.test(checkQuantity) && (checkQuantity <= limit || draftMode)) {
      setProductQuantity(productId, checkQuantity, transfer, totalPrice);
    }
    if (checkQuantity === "") {
      setProductQuantity(productId, undefined, transfer);
    }
  };

  const togleInvoiceModal = () => {
    setInvoiceModalIsVisible(
      (prevInvoiceModalIsVisible) => !prevInvoiceModalIsVisible
    );
  };

  // Toggle Product Invoices Modal with Serial Numbers
  const toggleInvoiceModalWithSN = () => {
    setInvoiceModalWithSN((wasVisible) => !wasVisible);
  };

  // Toggle Product Invoices Modal without Serial Numbers
  const toggleInvoiceModalWithoutSN = () => {
    setInvoiceModalWithoutSN((wasVisible) => !wasVisible);
  };

  const handleModalClick = (row) => {
    setSelectedRow(row);
    if (row.catalog.isWithoutSerialNumber) {
      toggleInvoiceModalWithoutSN();
    } else {
      toggleInvoiceModalWithSN();
    }
  };

  useEffect(() => {
    setData({
      ...data,
      tableData: selectedProducts.map(
        (
          {
            name,
            serialNumbers,
            invoiceQuantity,
            quantity,
            unitOfMeasurementName,
            bronQuantityInStock,
            productUniqueId,
            id,
            catalog,
            unitOfMeasurements,
            totalQuantity,
            unitOfMeasurementID,
            invoiceProducts,
            invoice_product_id,
            unitOfMeasurementId,
            coefficientRelativeToMain,
          },
          index
        ) => {
          const currentMeasurement = unitOfMeasurements?.find(
            (unit) => unit?.id === unitOfMeasurementID
          );
          return [
            index + 1,
            name,
            <View>
              <TextInput
                value={invoiceQuantity ? `${invoiceQuantity}` : undefined}
                keyboardType="numeric"
                onChangeText={(event) => {
                  handleQuantityChange(
                    productUniqueId ?? id,
                    event,
                    catalog.isServiceType
                      ? -1
                      : unitOfMeasurements?.length === 1
                      ? totalQuantity
                      : math.div(
                          Number(totalQuantity || 0),
                          Number(
                            unitOfMeasurements?.find(
                              (unit) => unit?.id === unitOfMeasurementID
                            )?.coefficientRelativeToMain || 1
                          )
                        )
                  );
                }}
                editable={catalog?.isWithoutSerialNumber}
                style={
                  catalog?.isWithoutSerialNumber
                    ? {
                        margin: 10,
                        padding: 5,
                        borderWidth: 1,
                        borderRadius: 5,
                        borderColor: "#D0DBEA",
                      }
                    : {
                        margin: 10,
                        padding: 5,
                        borderWidth: 1,
                        borderRadius: 5,
                        borderColor: "#D0DBEA",
                        backgroundColor: "#ececec",
                      }
                }
              />
            </View>,
            unitOfMeasurementName,
            <View>
              {catalog?.isServiceType || !currentMeasurement?.id ? (
                <Text>-</Text>
              ) : (
                <View style={{ flexDirection: "row" }}>
                  <Text>{`${defaultNumberFormat(quantity || 0)} `}</Text>

                  <ProTooltip
                    containerStyle={{ width: 145, height: "auto" }}
                    popover={
                      <Text>
                        {currentMeasurement?.unitOfMeasurementName?.toLowerCase()}
                      </Text>
                    }
                    trigger={
                      <Text>
                        {currentMeasurement?.unitOfMeasurementName
                          ? (currentMeasurement?.unitOfMeasurementName?.length >
                            6
                              ? `${currentMeasurement?.unitOfMeasurementName?.slice(
                                  0,
                                  6
                                )}...`
                              : currentMeasurement?.unitOfMeasurementName
                            )?.toLowerCase()
                          : ""}
                      </Text>
                    }
                  />
                </View>
              )}
            </View>,
            <View style={{ alignItems: "center", flexDirection: "row" }}>
              <Text>{`${defaultNumberFormat(bronQuantityInStock || 0)} `}</Text>
              <ProButton
                label={<FontAwesome name="info-circle" size={18} />}
                type="transparent"
                onClick={() => {
                  handleBron(id, name);
                }}
              />
            </View>,
            <ProButton
              label={<AntDesign name="pluscircle" size={14} />}
              type="transparent"
              disabled={catalog?.isServiceType || !getValues("stockFrom")}
              onClick={() => {
                handleModalClick({
                  name: name,
                  productUniqueId: productUniqueId,
                  invoiceProducts: invoiceProducts,
                  invoiceQuantity,
                  id: id,
                  catalog: catalog,
                  unitOfMeasurements: unitOfMeasurements,
                  invoice_product_id: invoice_product_id,
                  coefficientRelativeToMain: coefficientRelativeToMain,
                  unitOfMeasurementId: unitOfMeasurementId,
                  unitOfMeasurementID: unitOfMeasurementID,
                });
              }}
            />,
            <View style={{ flexDirection: "row", gap: 5 }}>
              <Text>{serialNumbers ? serialNumbers?.[0] : "-"}</Text>
              {serialNumbers?.length > 0 && (
                <ProTooltip
                  containerStyle={{ width: 145, height: "auto" }}
                  popover={
                    <View
                      style={{
                        display: "flex",
                        flexDirection: "column",
                      }}
                    >
                      {serialNumbers?.map((serialNumber) => (
                        <Text>{serialNumber}</Text>
                      ))}
                    </View>
                  }
                  trigger={
                    <View
                      style={{
                        backgroundColor: "#45a8e291",
                        borderRadius: 5,
                        width: 24,
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <Text>{serialNumbers?.length}</Text>
                    </View>
                  }
                />
              )}
            </View>,
            <ProButton
              label={<FontAwesome name="trash" size={18} color="red" />}
              type="transparent"
              onClick={() => {
                handleProductRemove(productUniqueId);
              }}
            />,
          ];
        }
      ),
    });
  }, [selectedProducts]);

  const { isLoad, run: runProduct } = useApi({
    deferFn: getProducts,
    onResolve: (data) => {
      setProductsByName(
        data.map((product) => ({
          ...product,
          invoiceQuantity: product?.catalog?.isWithoutSerialNumber
            ? product?.catalog?.isServiceType
              ? 1
              : product?.quantity >= 1
              ? 1
              : defaultNumberFormat(toFixedNumber(product?.quantity, 4) || 0)
            : null,
          label: serialNumber
            ? product.serial_number
            : `${product.name} ${
                product.productCode
                  ? `/${product.productCode}`
                  : product.product_code
                  ? `/${product.product_code}`
                  : ""
              } ${
                Number(product.quantity || 0) > 0
                  ? ` (${formatNumberToLocale(
                      defaultNumberFormat(
                        math.div(
                          Number(product?.totalQuantity || 0),
                          Number(product?.coefficientRelativeToMain || 1)
                        ) || 0
                      )
                    )} ${
                      product.unitOfMeasurementName
                        ? product.unitOfMeasurementName.toLowerCase()
                        : ""
                    })`
                  : product.withoutQuantity
                  ? `(${
                      product.unitOfMeasurementName
                        ? product.unitOfMeasurementName.toLowerCase()
                        : ""
                    })`
                  : ""
              }`,
          value: product.id,
        }))
      );
    },
    onReject: (error) => {
      console.log(error, "rejected");
    },
  });

  const handleSearch = useMemo(
    () =>
      debounce((event, page, isScroll) => {
        if (serialNumber) {
          runProduct({
            filter: {
              q: event,
              only_products: 1,
              datetime: moment(getValues("operationDate"))?.format(
                fullDateTimeWithSecond
              ),
              businessUnitIds: id
                ? businessUnit === null
                  ? [0]
                  : [businessUnit]
                : BUSINESS_TKN_UNIT
                ? [BUSINESS_TKN_UNIT]
                : undefined,
              withBronQuantity: 0,
            },
            type: "serial-numbers",
            apiEnd: getValues("stockFrom"),
          });
        } else {
          fetchProducts({
            filter: {
              withUnitOfMeasurements: 1,
              withRoadTaxes: 1,
              stocks: [getValues("stockFrom") || getValues("stockTo")],
              productCodeName: event,
              datetime: moment(getValues("operationDate"))?.format(
                fullDateTimeWithSecond
              ),
              isDeleted: 0,
              inStock: 1,
              limit: 25,
              page: 1,
              includeServices: 1,
              type: "product",
            },
          }).then((data) => {
            if (data?.length) {
              const currentProducts = data?.map((product) => {
                const multiMeasurementProducts =
                  product?.unitOfMeasurements?.length > 0
                    ? product?.unitOfMeasurements?.map((item) => {
                        return {
                          ...product,
                          name: product?.name,
                          unitOfMeasurementId: item?.unitOfMeasurementId,
                          unitOfMeasurementName: item?.unitOfMeasurementName,
                          mainUnitOfMeasurementId: product?.unitOfMeasurementId,
                          mainUnitOfMeasurementName:
                            product?.unitOfMeasurementName,
                          coefficientRelativeToMain:
                            item?.coefficientRelativeToMain,
                          originalQuantity: product?.quantity,
                          totalQuantity: product?.quantity,
                          quantity: math.div(
                            product?.quantity || 0,
                            item?.coefficientRelativeToMain || 1
                          ),
                          withoutQuantity:
                            product?.unitOfMeasurementId &&
                            math.div(
                              product?.quantity || 0,
                              item?.coefficientRelativeToMain || 1
                            ) == 0,
                          id: product?.id,
                          catalog: {
                            id: product?.catalogId,
                            isServiceType: product?.isServiceType,
                            isWithoutSerialNumber:
                              product?.isWithoutSerialNumber,
                            name: product?.catalogName,
                            rootName: product?.parentCatalogName,
                          },
                        };
                      })
                    : [];
                const mainProducts = {
                  ...product,
                  catalog: {
                    id: product?.catalogId,
                    isServiceType: product?.isServiceType,
                    isWithoutSerialNumber: product?.isWithoutSerialNumber,
                    name: product?.catalogName,
                    rootName: product?.parentCatalogName,
                  },
                  product_code: product?.productCode,
                  unitOfMeasurementName: product?.unitOfMeasurementName,
                  unitOfMeasurementId: product?.unitOfMeasurementId,
                  coefficientRelativeToMain: 1,
                  originalQuantity: product?.quantity,
                  totalQuantity: product?.quantity,
                  withoutQuantity:
                    product?.unitOfMeasurementId && product?.quantity == 0,
                };
                return [mainProducts, ...multiMeasurementProducts];
              });
              const productData = isScroll
                ? [...productsByName, ...currentProducts?.flat()]
                : [...currentProducts?.flat()];
              setProductsByName(
                productData.map((product) => ({
                  ...product,
                  label: serialNumber
                    ? product.serial_number
                    : `${product.name} ${
                        product.productCode
                          ? `/${product.productCode}`
                          : product.product_code
                          ? `/${product.product_code}`
                          : ""
                      } ${
                        Number(product.quantity || 0) > 0
                          ? ` (${formatNumberToLocale(
                              defaultNumberFormat(
                                math.div(
                                  Number(product?.totalQuantity || 0),
                                  Number(
                                    product?.coefficientRelativeToMain || 1
                                  )
                                ) || 0
                              )
                            )} ${
                              product.unitOfMeasurementName
                                ? product.unitOfMeasurementName.toLowerCase()
                                : ""
                            })`
                          : product.withoutQuantity
                          ? `(${
                              product.unitOfMeasurementName
                                ? product.unitOfMeasurementName.toLowerCase()
                                : ""
                            })`
                          : ""
                      }`,
                  value: product.id,
                }))
              );
            }
          });
        }
      }, 300),
    [serialNumber]
  );

  const transformUniqueIdData = (productsArr = []) =>
    productsArr.map((product) => ({
      ...product,
      productId: product.id,
      id: `${product.id}${product?.unitOfMeasurementId}`,
    }));

  const transformUniqueIdForSerialData = (productsArr = []) =>
    productsArr.map((product) => ({
      ...product,
      productId: product.id,
      id: `${product.id}${product?.unitOfMeasurementId}${product?.serial_number}`,
    }));

  const handleSelectValue = (productId) => {
    const newSerialid = `${productId}`?.match(/\d+/)[0];

    const productsWithQuantity = productsByName?.map((product) => {
      return {
        ...product,
        invoiceQuantity: product?.catalog?.isWithoutSerialNumber
          ? 1
          : product?.quantity === 1
          ? 1
          : null,
      };
    });
    const currentProduct = !serialNumber
      ? transformUniqueIdData(productsWithQuantity).find(
          (product) => product?.id === productId
        )
      : transformUniqueIdForSerialData(productsWithQuantity).find(
          (product) => product?.id == productId
        );
    setProductsByName([]);
    if (
      serialNumber &&
      transformUniqueIdData(selectedProducts)?.find((product) =>
        product.id?.includes(newSerialid)
      )
    ) {
      const updatedSelectedProducts = transformUniqueIdForSerialData(
        selectedProducts
      )?.map((product) => {
        if (product.id.includes(newSerialid)) {
          const serialNumbers = [
            ...(product?.serialNumbers || []),
            productId?.slice(newSerialid?.length),
          ];
          return {
            ...product,
            id: product?.productId,
            serialNumbers,
            invoiceQuantity: serialNumbers?.length,
            invoiceProducts: [
              ...product?.invoiceProducts,
              { ...currentProduct, invoiceQuantity: 1 },
            ],
          };
        }
        return product;
      });
      setSelectedProducts(updatedSelectedProducts);
    } else {
      const newProduct = {
        ...currentProduct,
        id: currentProduct?.productId,
      };
      const total_expense_amount = selectedExpenses.reduce(
        (total_amount, { expense_amount }) =>
          math.add(
            total_amount,
            math.mul(Number(expense_amount) || 0, Number(1))
          ),
        0
      );
      const invoice_amount = [...selectedProducts, newProduct].reduce(
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

      const invoiceQuantity = newProduct?.invoiceQuantity
        ? newProduct?.invoiceQuantity
        : newProduct.catalog?.isWithoutSerialNumber
        ? 1
        : null;

      const addSelectedProduct = (productData = []) => {
        const unitOfMeasurements = generateProductMultiMesaurements(
          productData?.[0],
          newProduct
        );

        const invQuantity = isNaN(Number(productId))
          ? 1
          : newProduct?.catalog?.isWithoutSerialNumber
          ? newProduct?.catalog?.isServiceType
            ? 1
            : Number(newProduct?.quantity || 1) >= 1
            ? 1
            : defaultNumberFormat(toFixedNumber(newProduct?.quantity, 4))
          : null;

        const roadTaxAmount = productData?.[0]?.isRoadTaxActive
          ? find(
              productData?.[0]?.roadTaxes,
              (tax) => tax?.tenantCurrency === getValues("currency")
            )?.amount
            ? Number(
                find(
                  productData?.[0]?.roadTaxes,
                  (tax) => tax?.tenantCurrency === getValues("currency")
                )?.amount || 0
              )
            : null
          : 0;
        const totalTaxAmount = roadTaxAmount
          ? math.mul(Number(roadTaxAmount || 0), Number(invQuantity || 0))
          : null;
        const newProductObj = {
          ...newProduct,
          productUniqueId: uuid(),
          attachmentId: productData?.[0]?.attachmentId,
          attachmentName: productData?.[0]?.attachmentName,
          pricePerUnit: productData?.[0]?.pricePerUnit,
          bronQuantityInStock: productData?.[0]?.bronQuantity,
          defaultSalesPriceInMainCurrency:
            productData?.[0]?.pricePerUnitInMainCurrency,
          salesDraftQuantityInStock: productData?.[0]?.salesDraftQuantity,
          discountAmount: 0,
          brandName: productData?.[0]?.brandName,
          lifetime: productData?.[0]?.lifetime,
          isVatFree: productData?.[0]?.isVatFree,
          taxAmount: productData?.[0]?.taxAmount,
          totalTaxAmount: productData?.[0]?.totalTaxAmount,
          taxAmountWithPrice: productData?.[0]?.taxAmountWithPrice,
          totalTaxAmountWithPrice: productData?.[0]?.totalTaxAmountWithPrice,
          isRoadTaxActive: productData?.[0]?.isRoadTaxActive,
          roadTaxes: productData?.[0]?.roadTaxes,
          roadTaxAmount: productData?.[0]?.isRoadTaxActive
            ? find(
                productData?.[0]?.roadTaxes,
                (tax) => tax?.tenantCurrency === getValues("currency")
              )?.amount
              ? Number(
                  find(
                    productData?.[0]?.roadTaxes,
                    (tax) => tax?.tenantCurrency === getValues("currency")
                  )?.amount || 0
                )
              : null
            : 0,
          totalRoadTaxAmount: totalTaxAmount,
          totalEndPricePerProduct: math.add(
            Number(totalTaxAmount || 0),
            Number(
              math.mul(
                Number(newProduct?.invoicePrice || 0),
                Number(invoiceQuantity || 0)
              ) || 0
            )
          ),
          quantity: !isNil(newProduct.totalQuantity)
            ? defaultNumberFormat(
                math.div(
                  Number(newProduct.totalQuantity || 0),
                  Number(newProduct.coefficientRelativeToMain || 1)
                )
              )
            : defaultNumberFormat(newProduct?.quantity || 0),
          discountPercentage: 0,
          totalQuantity: newProduct?.totalQuantity ?? newProduct?.quantity,
          product_code: newProduct?.product_code ?? newProduct?.productCode,
          invoiceQuantity: invQuantity,
          ...(serialNumber
            ? { serialNumbers: [newProduct?.serial_number] }
            : []),
          ...(serialNumber ? { invoiceQuantity: 1 } : []),
          ...(serialNumber
            ? {
                invoiceProducts: [{ ...currentProduct, invoiceQuantity: 1 }],
              }
            : []),
          discountedPrice:
            defaultNumberFormat(newProduct?.invoicePrice ?? 0) ?? null,
          totalPricePerProduct: math.mul(
            Number(newProduct?.invoicePrice || 0),
            Number(invoiceQuantity || 0)
          ),
          unitOfMeasurementID:
            unitOfMeasurements.length == 1
              ? unitOfMeasurements[0].id
              : newProduct?.unitOfMeasurementId,

          unitOfMeasurementId:
            unitOfMeasurements.length == 1
              ? unitOfMeasurements[0].id
              : productData?.[0]?.unitOfMeasurementId,
          mainUnitOfMeasurementName: productData?.[0]?.unitOfMeasurementName,
          hasMultiMeasurement: productData?.[0]?.unitOfMeasurements?.length > 1,
          unitOfMeasurements,
        };

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

            setSelectedProducts(
              [...selectedProducts, newProductObj].map((product) => {
                const expense_amount = math.div(
                  math.mul(
                    Number(product.invoicePrice) || 0,
                    Number(expense_amount_in_percentage) || 0
                  ),
                  100
                );

                return {
                  ...product,
                  endPriceInMainCurrency: product?.endPriceInMainCurrency
                    ? product?.endPriceInMainCurrency
                    : Object.values(data)[0]?.priceInMainCurrency,
                  expense_amount_in_percentage: roundToDown(
                    expense_amount_in_percentage,
                    4
                  ),
                  expense_amount: roundToDown(expense_amount, 4),
                  invoiceQuantity: 1,
                  serialNumbers:
                    product.productUniqueId === newProductObj.productUniqueId
                      ? [Object.values(data)[0].serial_number]
                      : product.serialNumbers,
                  invoiceProducts:
                    product.productUniqueId === newProductObj.productUniqueId
                      ? Object.values(data).map((item) => ({
                          ...item,
                          invoiceQuantity: item.invoiceQuantity
                            ? item.invoiceQuantity
                            : 1,
                        }))
                      : product.invoiceProducts,
                  cost: roundToDown(
                    math.add(
                      Number(expense_amount) || 0,
                      Number(product?.invoicePrice) || 0
                    ),
                    4
                  ),
                };
              })
            );
          } else {
            setSelectedProducts(
              [...selectedProducts, newProductObj].map((product) => {
                const expense_amount = math.div(
                  math.mul(
                    Number(product.invoicePrice) || 0,
                    Number(expense_amount_in_percentage) || 0
                  ),
                  100
                );

                return {
                  ...product,
                  endPriceInMainCurrency: product?.endPriceInMainCurrency
                    ? product?.endPriceInMainCurrency
                    : Object.values(data)[0]?.priceInMainCurrency,
                  expense_amount_in_percentage: roundToDown(
                    expense_amount_in_percentage,
                    4
                  ),
                  expense_amount: roundToDown(expense_amount, 4),
                  invoiceQuantity: product?.invoiceQuantity
                    ? product?.invoiceQuantity
                    : product.catalog?.isWithoutSerialNumber
                    ? 1
                    : null,
                  cost: roundToDown(
                    math.add(
                      Number(expense_amount) || 0,
                      Number(product?.invoicePrice) || 0
                    ),
                    4
                  ),
                };
              })
            );
          }
        });
      };

      addSelectedProduct([
        {
          ...currentProduct,
          unitOfMeasurementID:
            currentProduct?.mainUnitOfMeasurementId ??
            currentProduct?.unitOfMeasurementId,
          unitOfMeasurementId:
            currentProduct?.mainUnitOfMeasurementId ??
            currentProduct?.unitOfMeasurementId,
          unitOfMeasurementName:
            currentProduct?.mainUnitOfMeasurementName ??
            currentProduct?.unitOfMeasurementName,
        },
      ]);
    }
  };

  useEffect(() => {
    const totalEndPrice = selectedProducts.reduce((total, product) => {
      const currentPrice = math.mul(
        Number(product.endPriceInMainCurrency || 0),
        Number(product.invoiceQuantity || 0)
      );
      return total + currentPrice;
    }, 0);

    const totalSalesPrice = selectedProducts.reduce((total, product) => {
      const currentPrice = math.mul(
        Number(product.defaultSalesPriceInMainCurrency || 0),
        Number(product.invoiceQuantity || 0)
      );
      return total + currentPrice;
    }, 0);

    setTotalEndPricePerUnit(totalEndPrice);
    setTotalSalesPrice(totalSalesPrice);
  }, [selectedProducts]);

  const handleTotalIconClick = (selectedProducts, isDraft) =>
    selectedProducts.map(
      (
        { id, invoiceQuantity, unitOfMeasurementID, invoiceProducts },
        index
      ) => ({
        product: id,
        quantity: Number(invoiceQuantity),
        unitOfMeasurement: unitOfMeasurementID,
        invoiceProductsExtended_ul: invoiceProducts
          ? filter(
              invoiceProducts.map(
                ({ invoice_product_id, invoiceQuantity }) => ({
                  invoice_product_id,
                  quantity: Number(invoiceQuantity),
                })
              ),
              (row) => row?.invoice_product_id
            )
          : [],
      })
    );

  return (
    <View style={styles.container}>
      <InvoiceModalWithSN
        isSerialNumber={serialNumber}
        stausColumn={true}
        product={selectedRow}
        isVisible={invoiceModalWithSN}
        toggleModal={toggleInvoiceModalWithSN}
        type="sales"
        getValues={getValues}
        selectedProducts={selectedProducts}
        setSelectedProducts={setSelectedProducts}
        setDiscount={setDiscount}
        editId={id}
      />

      <InvoiceModalWithoutSN
        stausColumn={true}
        product={selectedRow}
        showMeasurementSelect={selectedRow?.unitOfMeasurements?.length > 1}
        isVisible={invoiceModalWithoutSN}
        toggleModal={toggleInvoiceModalWithoutSN}
        type="sales"
        getValues={getValues}
        selectedProducts={selectedProducts}
        setSelectedProducts={setSelectedProducts}
        setDiscount={setDiscount}
        editId={id}
      />

      <BronModal
        isVisible={bronModal}
        setIsVisible={setBronModal}
        productData={productData}
      />
      <Modal
        animationType="slide"
        transparent={true}
        visible={invoiceModalIsVisible}
        onRequestClose={() => {
          togleInvoiceModal();
        }}
      >
        <SelectFromProductModal
          getValues={getValues}
          handleModal={togleInvoiceModal}
          isVisible={invoiceModalIsVisible}
          BUSINESS_TKN_UNIT={
            id
              ? businessUnit === null
                ? 0
                : []
              : BUSINESS_TKN_UNIT
              ? BUSINESS_TKN_UNIT
              : undefined
          }
          salesStocks={getValues("stockFrom")}
          type={"transfer"}
          isTransfer={true}
          setSelectedProducts={setSelectedProducts}
          selectedProducts={selectedProducts}
          setDiscount={setDiscount}
        />
      </Modal>
      <AddFromCatalog
        getValues={getValues}
        type="transfer"
        selectedProducts={selectedProducts}
        isVisible={catalogModalIsVisible}
        setModalVisible={setCatalogModalIsVisible}
        setSelectedProducts={setSelectedProducts}
      />

      <View style={{ display: "flex", flexDirection: "column" }}>
        <Text>{!serialNumber ? "Məhsul axtar:" : "Seriya nömrə axtar:"}</Text>
        <View
          style={{
            display: "flex",
            flexDirection: "row",
            width: "100%",
            alignItems: "center",
          }}
        >
          <View style={{ width: "83%" }}>
            <ProAsyncSelect
              data={
                !serialNumber
                  ? selectedProducts?.length > 0
                    ? transformUniqueIdData(productsByName).filter(
                        ({ id }) =>
                          !transformUniqueIdData(selectedProducts)
                            .map(
                              ({ productId, unitOfMeasurementID }) =>
                                `${productId}${unitOfMeasurementID}`
                            )
                            .includes(id)
                      )
                    : transformUniqueIdData(productsByName)
                  : selectedProducts?.length > 0
                  ? transformUniqueIdForSerialData(productsByName).filter(
                      ({ serial_number }) =>
                        !transformUniqueIdForSerialData(selectedProducts).some(
                          (product) =>
                            product?.serialNumbers?.includes(
                              trim(serial_number)
                            )
                        )
                    )
                  : transformUniqueIdForSerialData(productsByName)
              }
              setData={setProductsByName}
              fetchData={getPurchaseProducts}
              filter={{
                datetime: moment(getValues("operationDate"))?.format(
                  fullDateTimeWithSecond
                ),
              }}
              apiEnd={getValues("stockFrom")}
              handleSearch={handleSearch}
              searchWithBack
              notValue
              notForm
              handleSelectValue={handleSelectValue}
              disabled={!getValues("stockFrom")}
            />
          </View>
          <ProButton
            label={<Feather name="refresh-cw" size={14} />}
            type="transparent"
            onClick={() => {
              setSerialNumber(!serialNumber);
              setProductsByName([]);
            }}
          />
        </View>
      </View>
      <View style={{ display: "flex", flexDirection: "row", gap: 10 }}>
        <ProButton
          label="Kataloqdan seç"
          type="primary"
          defaultStyle={{ borderRadius: 5 }}
          disabled={!getValues("stockFrom")}
          onClick={() => {
            setCatalogModalIsVisible(true);
          }}
          // onClick={handleSubmit}
          // loading={isLoading}
        />
        <ProButton
          label={<MaterialIcons name="search" size={18} />}
          style={{ width: "15%", borderWidth: 1 }}
          defaultStyle={{ borderRadius: 5 }}
          flex={false}
          disabled={!getValues("stockFrom")}
          onClick={togleInvoiceModal}
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
      <View style={{ marginBottom: 10 }}>
        <View style={styles.footer}>
          <Text>Toplam (maya dəyəri):</Text>
          <ProTooltip
            isVisible={open}
            onRequestClose={() => {
              setOpen(false);
            }}
            popover={
              <Text>
                {cost}{" "}
                {
                  currencies.find(({ id }) => id === getValues("currency"))
                    ?.code
                }
              </Text>
            }
            notDefaultOpen
            onClick={() => {
              if (!load) {
                if (getValues("stockFrom") && selectedProducts.length > 0) {
                  setLoad(true);
                  getCost({
                    data: {
                      excludeInvoiceId: id ? id : null, // edit
                      stock: getValues("stockFrom"),
                      operationDate: moment(getValues("operationDate")).format(
                        fullDateTimeWithSecond
                      ),
                      invoiceProducts_ul: handleTotalIconClick(
                        selectedProducts,
                        false
                      ),
                    },
                  }).then((res) => {
                    setLoad(false);
                    setCost(res);
                    setOpen(true);
                  });
                }
              }
            }}
            trigger={
              <ProButton
                label={
                  load ? (
                    <AntDesign name="sync" size={20} color="black" />
                  ) : (
                    <FontAwesome name="info-circle" size={20} color="black" />
                  )
                }
                padding={"0px"}
                flex={false}
                type="transparent"
              />
            }
          />
        </View>

        <View style={styles.footer}>
          <Text>Toplam (satış qiyməti):</Text>
          <Text>
            {formatNumberToLocale(
              defaultNumberFormat(roundTo(Number(totalSalesPrice || 0), 4))
            )}{" "}
            {currencies?.find(({ id }) => id === getValues("currency"))?.code}
          </Text>
        </View>
      </View>
      <View style={{ display: "flex", flexDirection: "row" }}>
        <ProButton
          label="Təsdiq et"
          type="primary"
          onClick={handleSubmit(onSubmit)}
          loading={loading}
        />
        <ProButton
          label="İmtina"
          type="transparent"
          onClick={() => navigation.push("DashboardTabs")}
        />
      </View>
    </View>
  );
};

const SaleTransfer = ({ navigation, route }) => {
  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    getValues,
    setValue,
    watch,
  } = useForm({
    defaultValues: {
      operationDate: new Date(),
    },
  });

  const { id, invoiceInfo, businessUnit } = route.params || {};
  const insets = useSafeAreaInsets();
  const layout = useWindowDimensions();
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [index, setIndex] = React.useState(0);
  const [isSelected, setSelection] = useState(false);
  const [payments, setPayments] = useState([]);
  const [expenseRates, setExpenseRates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusData, setStatusData] = useState([]);
  const [statusesLoading, setStatusesLoading] = useState(true);
  const [editDate, setEditDate] = useState(undefined);
  const [discount, setDiscount] = useState({
    percentage: undefined,
    amount: undefined,
  });
  const [vat, setVat] = useState({
    percentage: undefined,
    amount: undefined,
  });
  const [routes] = React.useState([
    { key: "first", title: "Ümumi məlumat" },
    { key: "second", title: "Qaimə" },
  ]);

  const { profile, BUSINESS_TKN_UNIT } = useContext(TenantContext);

  const updateEditInvoice = (isDraft) => {
    const {
      operationDate,
      salesmanId,
      stockFromId,
      stockToId,
      invoiceProducts,
      description,
    } = invoiceInfo;
    const { content } = invoiceProducts;
    const selectedProducts = {};
    content.forEach(
      ({
        productId,
        productName,
        quantity,
        serialNumber,
        unitOfMeasurementName,
        attachedInvoiceProductId,
        draftRootInvoiceProductId,
        catalogId,
        catalogName,
        product_code,
        barcode,
        quantityInStock,
        unitOfMeasurementId,
        unitOfMeasurements,
        rootCatalogName,
        isServiceType,
        coefficient,
        originalQuantity,
        usedQuantity,
        bronQuantityInStock,
        salesDraftQuantityInStock,
        isWithoutSerialNumber,
        attachmentId,
        attachmentName,
        brandName,
        endPricePerUnit,
        defaultSalesPriceInMainCurrency,
        salesPriceInMainCurrency,
        uniqueKey,
        weightPerUnit,
        volumePerUnit,
        salesPrice,
      }) => {
        if (selectedProducts[uniqueKey]) {
          const invoiceProductId = isDraft
            ? draftRootInvoiceProductId
            : attachedInvoiceProductId;

          const invoiceQuantity = Number(
            math.div(Number(quantity), Number(coefficient || 1))
          );
          const { invoiceProducts } = selectedProducts[uniqueKey];

          const updatedInvoiceProducts = invoiceProducts?.some(
            (p) => p.invoice_product_id === invoiceProductId
          )
            ? invoiceProducts?.map((product) =>
                product.invoice_product_id === invoiceProductId
                  ? {
                      ...product,
                      invoiceQuantity: math.add(
                        product.invoiceQuantity,
                        invoiceQuantity
                      ),
                    }
                  : product
              )
            : [
                ...invoiceProducts,
                {
                  invoice_product_id: invoiceProductId,
                  invoiceQuantity,
                  usedQuantity: roundToDown(Number(usedQuantity), 4),
                },
              ];

          selectedProducts[uniqueKey] = {
            ...selectedProducts[uniqueKey],
            endPriceInMainCurrency: math.mul(
              Number(endPricePerUnit || 0),
              math.add(
                roundToDown(Number(originalQuantity || 0), 4),
                selectedProducts[uniqueKey].invoiceQuantity
              )
            ),
            defaultSalesPriceInMainCurrency: Number(
              defaultSalesPriceInMainCurrency || 0
            ),
            salesPriceInMainCurrency: Number(salesPriceInMainCurrency || 0),
            serialNumbers: serialNumber
              ? [...selectedProducts[uniqueKey].serialNumbers, serialNumber]
              : undefined,
            invoiceQuantity: math.add(
              roundToDown(Number(originalQuantity || 0), 4),
              selectedProducts[uniqueKey].invoiceQuantity
            ),
            usedQuantity: roundToDown(
              math.add(
                Number(usedQuantity || 0),
                Number(selectedProducts[uniqueKey].usedQuantity)
              ),
              4
            ),
            invoiceProducts: updatedInvoiceProducts,
            weightPerUnit,
            volumePerUnit,
            salesPrice,
          };
        } else {
          selectedProducts[uniqueKey] = {
            uniqueKey,
            id: productId,
            productUniqueId: uniqueKey,
            name: productName,
            attachmentId,
            endPriceInMainCurrency: math.mul(
              Number(endPricePerUnit || 0),
              roundToDown(Number(originalQuantity || 0), 4)
            ),
            defaultSalesPriceInMainCurrency: Number(
              defaultSalesPriceInMainCurrency || 0
            ),
            salesPriceInMainCurrency: Number(salesPriceInMainCurrency || 0),
            attachmentName,
            hasMultiMeasurement: unitOfMeasurements?.length > 1,
            unitOfMeasurementName,
            unitOfMeasurementId, //main measurement
            unitOfMeasurementID: unitOfMeasurementId,
            coefficientRelativeToMain: coefficient,
            brandName,
            unitOfMeasurements: [
              {
                id: unitOfMeasurementId,
                unitOfMeasurementName,
                coefficient: coefficient,
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

            serialNumbers: serialNumber ? [serialNumber] : undefined,
            invoiceQuantity: roundToDown(Number(originalQuantity || 0), 4),
            quantity: Number(quantityInStock ?? 0),
            totalQuantity: Number(quantityInStock || 0),
            invoiceProducts: [
              {
                invoice_product_id: isDraft
                  ? draftRootInvoiceProductId
                  : attachedInvoiceProductId,
                invoiceQuantity: Number(
                  `${math.div(Number(quantity), Number(coefficient || 1))}`
                ),
                usedQuantity: roundToDown(usedQuantity, 4),
              },
            ],

            barcode: barcode ?? undefined,
            product_code: product_code,
            bronQuantityInStock: bronQuantityInStock,
            salesDraftQuantityInStock: salesDraftQuantityInStock,
            usedQuantity: roundToDown(usedQuantity, 4),
            catalog: {
              id: catalogId,
              name: catalogName,
              rootName: rootCatalogName,
              isWithoutSerialNumber: isWithoutSerialNumber,
              isServiceType,
            },
            weightPerUnit,
            volumePerUnit,
            salesPrice,
          };
        }
      }
    );
    setSelectedProducts(Object.values(selectedProducts));

    setEditDate(moment(operationDate, fullDateTimeWithSecond).toDate());

    setValue("operationDate", moment(operationDate, fullDateTimeWithSecond));
    setValue("salesman", salesmanId || undefined);
    setValue("stockTo", stockToId ?? undefined);
    setValue("stockFrom", stockFromId ?? undefined);
  };

  useEffect(() => {
    if (invoiceInfo) {
      const { invoiceType } = invoiceInfo;
      // if (invoiceType === 8) {
      //     setIsDraft(true);
      //     dispatch(setDraftCheck(true));
      // }
      updateEditInvoice(invoiceType === 8);
    }
  }, [invoiceInfo]);

  useEffect(() => {
    fetchStatusOperations({}).then((data) => {
      setStatusData(data.filter((item) => item.operationId === 5));
      setStatusesLoading(false);
    });
  }, []);

  useEffect(() => {
    const statusArr = statusData[0]?.statuses;

    if (statusData.length > 0) {
      setValue("status", statusArr[0]?.id);
    }
  }, [statusData]);

  const handleSelectedProducts = (
    selectedProducts,
    invoiceId = null,
    isDraft
  ) => {
    const tmp = {};
    selectedProducts.forEach(
      (
        {
          invoiceProducts,
          id,
          productUniqueId,
          invoiceQuantity,
          unitOfMeasurementID,
          coefficientRelativeToMain,
          uniqueKey,
        },
        index
      ) => {
        tmp[productUniqueId] = {
          product: id,
          quantity: Number(invoiceQuantity),
          serialNumber_ul: [],
          unitOfMeasurement: unitOfMeasurementID,
          customCoefficient: invoiceId ? coefficientRelativeToMain : null,
          invoiceProductsExtended_ul: invoiceProducts
            ? invoiceProducts.map(
                ({ invoice_product_id, invoiceQuantity }) => ({
                  invoice_product_id,
                  quantity: Number(invoiceQuantity),
                })
              )
            : [],
          uniqueKey,
          position: index,
        };
      }
    );
    return Object.values(tmp).sort(function (a, b) {
      return (
        selectedProducts.map(({ productId }) => productId).indexOf(a.id) -
        selectedProducts.map(({ productId }) => productId).indexOf(b.id)
      );
    });
  };

  const handleCreateInvoice = (data) => {
    setLoading(true);
    const { operationDate, saleManager, stockTo, stockFrom, status } = data;

    if (id) {
      const newSalesInvoice = {
        salesman: saleManager,
        stockTo,
        stock: stockFrom,
        description: null,
        operationDate: moment(operationDate).format(fullDateTimeWithSecond),
        operator: profile.id,
        invoiceProducts_ul: handleSelectedProducts(selectedProducts, id),
        status: status || null,
      };
      editInvoice({
        id: Number(id),
        type: "transfer",
        data: newSalesInvoice,
      })
        .then((res) => {
          Toast.show({
            type: "success",
            text1: "Məlumatlar yadda saxlandı.",
          });
          navigation.navigate("Modul", {
            screen: "DashboardTabs",
            initial: true,
          });
        })
        .catch((error) => {
          const errorData = error?.response?.data?.error;

          if (errorData?.errors?.key === "out_of_stock") {
            let errorArr = {};
            errorData.errors.data.forEach(
              ({ productId, productName, serialNumber }) => {
                if (errorArr[productId]) {
                  errorArr[productId] = {
                    ...errorArr[productId],
                    serialNumbers: serialNumber
                      ? [...errorArr[productId].serialNumbers, serialNumber]
                      : undefined,
                  };
                } else {
                  errorArr[productId] = {
                    productId,
                    productName,
                    serialNumbers: serialNumber ? [serialNumber] : undefined,
                  };
                }
              }
            );
            Toast.show({
              type: "error",
              text2: `Seçilmiş tarixdə, qaimədə qeyd olunan ${
                errorData?.errors?.data?.length > 1
                  ? "sətirlərdəki məhsullar"
                  : "sətirdəki məhsul"
              } ${
                stocks?.find((item) => item.id === stockFrom)?.name
              } anbarında kifayət qədər yoxdur ${Object.values(errorArr).map(
                ({ productId, productName, serialNumbers }) => (
                  <span>
                    {selectedProducts?.findIndex(({ id }) => id === productId) +
                      1}
                    . {productName}{" "}
                    {serialNumbers &&
                    serialNumbers !== null &&
                    serialNumbers?.length > 0
                      ? "/ Seriya nömrəsi:" + serialNumbers?.toString()
                      : ""}{" "}
                  </span>
                )
              )}`,
              topOffset: 50,
            });
          } else {
            Toast.show({
              type: "error",
              text2: errorData?.message,
              topOffset: 50,
            });
          }
        });
    } else {
      createInvoice({
        type: "transfer",
        data: {
          salesman: saleManager,
          stockTo: stockTo,
          stock: stockFrom,
          description: null,
          operationDate: moment(operationDate).format(fullDateTimeWithSecond),
          operator: profile.id,
          status: status,
          invoiceProducts_ul: handleSelectedProducts(
            selectedProducts,
            null,
            false
          ),
          agent: undefined,
          contract: undefined,
        },
      })
        .then((res) => {
          Toast.show({
            type: "success",
            text1: "Məlumatlar yadda saxlandı.",
          });
          navigation.push("DashboardTabs");
        })
        .catch((error) => {
          const errorData = error?.response?.data?.error;

          if (errorData?.errors?.key === "out_of_stock") {
            let errorArr = {};
            errorData.errors.data.forEach(
              ({ productId, productName, serialNumber }) => {
                if (errorArr[productId]) {
                  errorArr[productId] = {
                    ...errorArr[productId],
                    serialNumbers: serialNumber
                      ? [...errorArr[productId].serialNumbers, serialNumber]
                      : undefined,
                  };
                } else {
                  errorArr[productId] = {
                    productId,
                    productName,
                    serialNumbers: serialNumber ? [serialNumber] : undefined,
                  };
                }
              }
            );
            Toast.show({
              type: "error",
              text2: `Seçilmiş tarixdə, qaimədə qeyd olunan ${
                errorData?.errors?.data?.length > 1
                  ? "sətirlərdəki məhsullar"
                  : "sətirdəki məhsul"
              } ${
                stocks?.find((item) => item.id === stockFrom)?.name
              } anbarında kifayət qədər yoxdur ${Object.values(errorArr).map(
                ({ productId, productName, serialNumbers }) => (
                  <span>
                    {selectedProducts?.findIndex(({ id }) => id === productId) +
                      1}
                    . {productName}{" "}
                    {serialNumbers &&
                    serialNumbers !== null &&
                    serialNumbers?.length > 0
                      ? "/ Seriya nömrəsi:" + serialNumbers?.toString()
                      : ""}{" "}
                  </span>
                )
              )}`,
              topOffset: 50,
            });
          } else {
            Toast.show({
              type: "error",
              text2: errorData?.message,
              topOffset: 50,
            });
          }
        });
    }
  };

  const onSubmit = (data) => {
    if (selectedProducts.length === 0) {
      Toast.show({
        type: "error",
        text2: "Qaimədə məhsul mövcud deyil",
        topOffset: 50,
      });
    } else if (
      selectedProducts.some(
        ({ invoiceQuantity }) => Number(invoiceQuantity || 0) === 0
      )
    ) {
      Toast.show({
        type: "error",
        text2: "Qaimədə say və ya qiyməti qeyd edilməyən məhsul mövcuddur.",
        topOffset: 50,
      });
    } else {
      handleCreateInvoice(data);
    }
  };
  const renderScene = ({ route }) => {
    switch (route.key) {
      case "first":
        return (
          <FirstRoute
            control={control}
            handleSubmit={handleSubmit}
            errors={errors}
            onSubmit={onSubmit}
            navigation={navigation}
            setValue={setValue}
            getValues={getValues}
            currencies={currencies}
            setCurrencies={setCurrencies}
            BUSINESS_TKN_UNIT={BUSINESS_TKN_UNIT}
            loading={loading}
            watch={watch}
            profile={profile}
            statusData={statusData}
            businessUnit={businessUnit}
            id={id}
            invoiceInfo={invoiceInfo}
            editDate={editDate}
          />
        );
      case "second":
        return (
          <SecondRoute
            handleSubmit={handleSubmit}
            onSubmit={onSubmit}
            navigation={navigation}
            getValues={getValues}
            setValue={setValue}
            selectedProducts={selectedProducts}
            setSelectedProducts={setSelectedProducts}
            currencies={currencies}
            setCurrencies={setCurrencies}
            setPayments={setPayments}
            BUSINESS_TKN_UNIT={BUSINESS_TKN_UNIT}
            loading={loading}
            setDiscount={setDiscount}
            businessUnit={businessUnit}
            id={id}
            invoiceInfo={invoiceInfo}
            editDate={editDate}
          />
        );
      default:
        return null;
    }
  };

  const renderBadge = ({ route }) => {
    if (route.key === "albums") {
      return (
        <View style={styles.badge}>
          <Text style={styles.count}>42</Text>
        </View>
      );
    }
    return null;
  };

  const renderTabBar = (props) => (
    <TabBar {...props} renderBadge={renderBadge} style={styles.tabbar} />
  );

  return (
    <SafeAreaProvider>
      <View
        style={{
          flex: 1,
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
          paddingLeft: insets.left,
          paddingRight: insets.right,
        }}
      >
        <TabView
          navigationState={{ index, routes }}
          renderScene={renderScene}
          onIndexChange={setIndex}
          initialLayout={{ width: layout.width }}
          renderTabBar={renderTabBar}
          swipeEnabled={false}
        />
      </View>
    </SafeAreaProvider>
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
    borderRadius: 20,
    padding: 10,
    elevation: 2,
  },
  buttonOpen: {
    backgroundColor: "#F194FF",
  },
  buttonClose: {
    backgroundColor: "#2196F3",
  },
  footer: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  checkboxContainer: {
    flexDirection: "row",
  },
  inputContainer: {
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    marginHorizontal: 5,
    borderRadius: 10,
  },
  prefix: {
    paddingHorizontal: 5,
    fontWeight: "bold",
    color: "black",
  },
});

export default SaleTransfer;
