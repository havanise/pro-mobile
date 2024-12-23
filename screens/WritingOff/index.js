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
  Pressable,
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
import SweetAlert from "react-native-sweet-alert";
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
  fetchSalesInvoiceList,
  fetchSalesInvoiceInfo,
  getProducts,
  fetchStatusOperations,
} from "../../api";
import { useDebounce } from "use-debounce";
import {
  defaultNumberFormat,
  toFixedNumber,
  formatNumberToLocale,
  generateProductMultiMesaurements,
  roundToDown,
  roundTo,
  re_amount,
  fullDateTimeWithSecond,
  customRound,
  getPriceValue,
  today,
} from "../../utils";
import AddSerialNumbers from "../../components/AddSerialNumbers";
import AddFromCatalog from "../../components/AddFromCatalog";
import InvoiceModalWithoutSN from "../../components/InvoiceModalWithoutSN";
import InvoiceModalWithSN from "../../components/InvoiceModalWithSN";
import { fetchTransferProductsFromCatalog } from "../../api/sale";

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
    tenant,
    profile,
    watch,
    statusData,
    id,
    businessUnit,
    invoiceInfo,
    editDate,
  } = props;

  const [employees, setEmployees] = useState([]);
  const [stock, setStock] = useState([]);
  const [productionInvoices, setProductionInvoices] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [salesInvoices, setSalesInvoices] = useState([]);
  const [selectedInvProduct, setSelectedInvProduct] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState([]);
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
        data.map((item) => ({ ...item, label: item.name, value: item.id }))
      );
    },
    onReject: (error) => {
      console.log(error, "rejected");
    },
  });

  useEffect(() => {
    if (currencies.length > 0) {
      setValue("currency", currencies.find(({ isMain }) => isMain)?.id);
    }
  }, [currencies]);

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
        limit: 1000,
        applyBusinessUnitTenantPersonFilter: 1,
        businessUnitIds: id
          ? businessUnit === null
            ? [0]
            : [businessUnit]
          : BUSINESS_TKN_UNIT
          ? [BUSINESS_TKN_UNIT]
          : undefined,
        isActive: 1,
      },
    });
  }, []);

  const ContractFn = (event) => {
    if (event === 1) {
      setValue(
        "expense",
        productionArr.length === 1 ? productionArr[0].id : undefined
      );
    } else if (event === 0) {
      setValue(
        "expense",
        contractsArr.length === 1 ? contractsArr[0].id : undefined
      );
    } else if (event === 2) {
      setValue("expense", { ...tenant, id: 0 }.id);
    } else if (event === 3) {
      setValue(
        "expense",
        salesInvoicesArr.length === 1 ? salesInvoicesArr[0].id : undefined
      );
    } else {
      setValue("expense", undefined);
    }
  };

  useEffect(() => {
    if (getValues("expenseType") === undefined) {
      setValue("expense", { ...tenant, id: 0 }.id);
      setValue("expenseType", 2);
    }
    if (getValues("expenseType") === 1) {
      setValue(
        "expense",
        productionArr.length === 1 ? productionArr[0].id : undefined
      );
    } else if (getValues("expenseType") === 2) {
      setValue("expense", { ...tenant, id: 0 }.id);
    } else if (getValues("expenseType") === 0) {
      setValue(
        "expense",
        contractsArr.length === 1 ? contractsArr[0].id : undefined
      );
    } else if (getValues("expenseType") === 3) {
      setValue(
        "expense",
        salesInvoicesArr.length === 1 ? salesInvoicesArr[0].id : undefined
      );
    }
  }, [watch("expenseType")]);

  const contractsArr = contracts.map((contract) => ({
    ...contract,
    value: contract.id,
    label: `${contract.counterparty_name} - ${
      contract.contract_no ? contract.contract_no : contract.serialNumber
    }`,
  }));

  const productionArr = productionInvoices.map((invoice) => ({
    ...invoice,
    value: invoice.id,
    label: `${invoice.customInvoiceNumber || invoice.invoiceNumber} - ${
      invoice.clientName ? invoice.clientName : "Daxili sifariş"
    }`,
  }));

  const salesInvoicesArr = salesInvoices.map((invoice) => ({
    ...invoice,
    value: invoice.id,
    label: `${invoice.invoiceNumber} - ${
      invoice.counterparty ? invoice.counterparty : "Daxili sifariş"
    }`,
  }));

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
        <Text style={{ fontSize: 18 }}>Silinmə</Text>

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
            label="Anbar(Haradan)"
            data={stock}
            setData={setStock}
            fetchData={getStock}
            filter={{
              limit: 1000,
              applyBusinessUnitTenantPersonFilter: 1,
              businessUnitIds: id
                ? businessUnit === null
                  ? [0]
                  : [businessUnit]
                : BUSINESS_TKN_UNIT
                ? [BUSINESS_TKN_UNIT]
                : undefined,
              isActive: 1,
            }}
            async={false}
            control={control}
            name="stockFrom"
            required
          />

          <ProAsyncSelect
            label="Xərc mərkəzi növü"
            data={[
              {
                id: 2,
                value: 2,
                label: "Baş ofis",
              },
              {
                id: 0,
                value: 0,
                label: "Müqavilə",
              },
              {
                id: 1,
                value: 1,
                label: "İstehsalat",
              },
              { id: 3, value: 3, label: "Qaimə" },
            ]}
            setData={() => {}}
            fetchData={() => {}}
            async={false}
            filter={{}}
            required
            control={control}
            allowClear={false}
            name="expenseType"
            handleSelectValue={(id) => {
              ContractFn(id);
            }}
          />

          {watch("expenseType") === 2 ? (
            <ProAsyncSelect
              label="Xərc mərkəzi"
              data={[
                {
                  ...tenant,
                  label: tenant.name,
                  id: 0,
                  value: 0,
                },
              ]}
              disabled={true}
              setData={() => {}}
              fetchData={() => {}}
              async={false}
              filter={{}}
              required
              control={control}
              allowClear={false}
              name="expense"
            />
          ) : watch("expenseType") === 1 ? (
            <ProAsyncSelect
              disabled={false}
              label="Xərc mərkəzi"
              data={productionArr}
              setData={setProductionInvoices}
              fetchData={fetchSalesInvoiceList}
              async
              filter={{
                page: 1,
                limit: 20,
                invoiceTypes: [11],
                allProduction: 1,
                isDeleted: 0,
              }}
              required
              control={control}
              allowClear={false}
              name="expense"
              handleSelectValue={(val) => {
                fetchSalesInvoiceInfo({
                  apiEnd: Number(val),
                }).then((data) => {
                  setSelectedInvoice(data);
                  if (data.invoiceProducts && data.invoiceProducts.content)
                    setSelectedInvProduct(
                      [
                        ...Object.keys(data.invoiceProducts.content).map(
                          (index) => data.invoiceProducts.content[index]
                        ),
                      ].map((item) => ({
                        ...item,
                        id: item.productId,
                        name: item.productName,
                        label: item.productName,
                        value: item.productId,
                      }))
                    );
                });
              }}
            />
          ) : watch("expenseType") === 3 ? (
            <ProAsyncSelect
              label="Xərc mərkəzi"
              data={salesInvoicesArr}
              setData={setSalesInvoices}
              fetchData={fetchSalesInvoiceList}
              async
              filter={{
                page: 1,
                limit: 20,
                invoiceTypes: [1, 2],
                isDeleted: 0,
                includeTotalPaymentsAmount: 1,
              }}
              required
              control={control}
              allowClear={false}
              name="expense"
            />
          ) : (
            <ProAsyncSelect
              label="Xərc mərkəzi"
              data={contractsArr}
              setData={setContracts}
              fetchData={getContracts}
              async
              filter={{ page: 1, limit: 20, status: 1, endDateFrom: today }}
              required
              control={control}
              allowClear={false}
              name="expense"
            />
          )}

          {watch("expenseType") === 1 && (
            <ProAsyncSelect
              label="Məhsul"
              data={selectedInvProduct || []}
              setData={() => {}}
              fetchData={() => {}}
              async={false}
              filter={{}}
              required={
                selectedInvoice.productionMaterialExpenseWithInvoiceCostSharingType ===
                2
              }
              control={control}
              allowClear={false}
              name="productionProduct"
            />
          )}
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
    setDiscount,
    BUSINESS_TKN_UNIT,
    loading,
    businessUnit,
    id,
  } = props;

  const [data, setData] = useState(tableData);
  const [serialNumber, setSerialNumber] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [productsByName, setProductsByName] = useState([]);
  const [selectedExpenses, setSelectedExpenses] = useState([]);
  const [snModalVisible, setSnModalVisible] = useState(false);
  const [selectedRow, setSelectedRow] = useState({});
  const [productWithSerialNumbers, setProductWithSerialNumbers] = useState([]);
  const [invoiceModalWithSN, setInvoiceModalWithSN] = useState(false);
  const [invoiceModalWithoutSN, setInvoiceModalWithoutSN] = useState(false);
  const [invoiceModalIsVisible, setInvoiceModalIsVisible] = useState(false);
  const [warningModalVisible, setWarningModalVisible] = useState(false);
  const [catalogModalIsVisible, setCatalogModalIsVisible] = useState(false);
  const [bronModal, setBronModal] = useState(false);
  const [productData, setProductData] = useState();
  const invoiceTypesIds = [1, 10, 11, 7, 14];
  const [triggerExit, setTriggerExit] = useState({
    onOk: false,
    path: "",
  });

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
        let totalEndPricePerProduct = 0.0;
        let totalRoadTaxAmount = 0;
        if (selectedProduct.invoicePrice) {
          totalPricePerProduct = new BigNumber(
            math.mul(
              parseFloat(selectedProduct.invoicePrice || 0),
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
          invoiceQuantity: !transfer
            ? newQuantity
            : selectedProduct?.invoiceQuantity,
          transferinvoiceQuantity: transfer
            ? newQuantity
            : selectedProduct?.transferinvoiceQuantity,
          endPriceInMainCurrency: totalPrice || 0,
          invoiceProducts: undefined,
          discountPercentage: newQuantity
            ? selectedProduct?.discountPercentage
            : 0,
          discountAmount: newQuantity ? selectedProduct?.discountAmount : 0,
          discountedPrice: newQuantity ? selectedProduct?.discountedPrice : 0,
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
    setSelectedProducts(newSelectedProducts);
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

  const handleQuantityChange = (
    productId,
    newQuantity,
    quantity,
    draftMode = false,
    transfer = false,
    totalPrice
  ) => {
    const limit = Number(quantity) >= 0 ? Number(quantity) : 10000000;
    if (re_amount.test(newQuantity) && (newQuantity <= limit || draftMode)) {
      setProductQuantity(productId, newQuantity, transfer, totalPrice);
    }
    if (newQuantity === "") {
      setProductQuantity(productId, undefined, transfer);
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
                  >
                    <Text>
                      {currentMeasurement?.unitOfMeasurementName
                        ? (currentMeasurement?.unitOfMeasurementName?.length > 6
                            ? `${currentMeasurement?.unitOfMeasurementName?.slice(
                                0,
                                6
                              )}...`
                            : currentMeasurement?.unitOfMeasurementName
                          )?.toLowerCase()
                        : ""}
                    </Text>
                  </ProTooltip>
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
                >
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
                </ProTooltip>
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
    const currentProduct = !serialNumber
      ? transformUniqueIdData(productsByName).find(
          (product) => product?.id === productId
        )
      : transformUniqueIdForSerialData(productsByName).find(
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
            math.mul(Number(expense_amount) || 0, Number(invoice_expense_rate))
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
          salesDraftQuantityInStock: productData?.[0]?.salesDraftQuantity,
          discountAmount: 0,
          defaultSalesPriceInMainCurrency:
            productData?.[0]?.pricePerUnitInMainCurrency,
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
              expense_amount_in_percentage: roundToDown(
                Number(expense_amount_in_percentage || 0),
                4
              ),
              expense_amount: roundToDown(Number(expense_amount || 0), 4),
              invoiceQuantity: product?.invoiceQuantity
                ? product?.invoiceQuantity
                : product.catalog?.isWithoutSerialNumber
                ? 1
                : null,
              cost: roundToDown(
                Number(
                  math.add(
                    Number(expense_amount) || 0,
                    Number(product?.invoicePrice) || 0
                  ) || 0
                ),
                4
              ),
            };
          })
        );
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

  return (
    <View style={styles.container}>
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
          BUSINESS_TKN_UNIT={id
            ? businessUnit === null
              ? 0
              : []
            : BUSINESS_TKN_UNIT
            ? BUSINESS_TKN_UNIT
            : undefined}
          salesStocks={getValues("stockFrom")}
          sales
          type="writingOff"
          setSelectedProducts={setSelectedProducts}
          selectedProducts={selectedProducts}
          setDiscount={setDiscount}
        />
      </Modal>
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
      <AddFromCatalog
        getValues={getValues}
        type="writingOff"
        selectedProducts={selectedProducts}
        invoiceTypesIds={invoiceTypesIds}
        isVisible={catalogModalIsVisible}
        setModalVisible={setCatalogModalIsVisible}
        setSelectedProducts={setSelectedProducts}
        // fetchProducts={fetchProductsFromCatalog}
        // fetchCatalogs={fetchCatalogs}
        // catalogs={catalogs}
        // setSelectedCatalog={setSelectedCatalog}
        // filteredProducts={productWithCatalog}
        // fetchProductFromCatalogs={fetchProductFromCatalogs}
        // fetchProductInvoices={fetchProductInvoices}
      />
      <AddSerialNumbers
        type={"writingOff"}
        selectedRow={selectedRow}
        isVisible={snModalVisible}
        setSerialModalIsVisible={setSnModalVisible}
        selectedProducts={selectedProducts}
        setSelectedProducts={setSelectedProducts}
        setProductWithSerialNumbers={setProductWithSerialNumbers}
        productWithSerialNumbers={productWithSerialNumbers}
        setWarningModalVisible={setWarningModalVisible}
        triggerExit={triggerExit}
      />
      {/* <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          Alert.alert("Modal has been closed.");
          setModalVisible(!modalVisible);
        }}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text>Hello World!</Text>
            <Pressable
              style={[styles.button, styles.buttonClose]}
              onPress={() => setModalVisible(!modalVisible)}
            >
              <AntDesign name="close" size={14} color="black" />
            </Pressable>
          </View>
        </View>
      </Modal> */}

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
              filter={{}}
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
          onClick={() => {
            setCatalogModalIsVisible(true);
          }}
          disabled={!getValues("stockFrom")}
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

const WritingOff = ({ navigation, route }) => {
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
  const [loading, setLoading] = useState(false);
  const [statusData, setStatusData] = useState([]);
  const [statusesLoading, setStatusesLoading] = useState(true);
  const [editDate, setEditDate] = useState(undefined);
  const [discount, setDiscount] = useState({
    percentage: undefined,
    amount: undefined,
  });

  const [routes] = React.useState([
    { key: "first", title: "Ümumi məlumat" },
    { key: "second", title: "Qaimə" },
  ]);

  const {
    profile,
    setProfile,
    tenant,
    setTenant,
    tenants,
    setTenants,
    tenantPersonRoles,
    setTenantPersonRoles,
    BUSINESS_TKN_UNIT,
  } = useContext(TenantContext);

  const updateEditInvoice = (isDraft) => {
    const {
      attachedInvoice,
      salesmanId,
      operationDate,
      stockFromId,
      invoiceProducts,
      contractId,
      attachedInvoiceType,
      productionProductId,
    } = invoiceInfo;
    const { content } = invoiceProducts;
    const selectedProducts = {};
    const selectedProductIds = content.map(({ productId }) => productId);
    fetchTransferProductsFromCatalog({
      apiEnd: stockFromId,
      filter: {
        invoiceId: id,
        product: selectedProductIds,
        datetime: operationDate,
      },
    }).then((data) => {
      content.forEach(
        ({
          productId,
          productName,
          quantity,
          serialNumber,
          barcode,
          product_code,
          rootCatalogName,
          unitOfMeasurementName,
          attachedInvoiceProductId,
          draftRootInvoiceProductId,
          isServiceType,
          catalogId,
          catalogName,
          coefficient,
          quantityInStock,
          unitOfMeasurementId,
          unitOfMeasurements,
          originalQuantity,
          bronQuantityInStock,
          salesDraftQuantityInStock,
          brandName,
          uniqueKey,
          usedQuantity,
          weightPerUnit,
          volumePerUnit,
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
              serialNumbers: serialNumber
                ? [...selectedProducts[uniqueKey].serialNumbers, serialNumber]
                : undefined,
              invoiceQuantity: math.add(
                roundToDown(Number(originalQuantity), 4),
                selectedProducts[uniqueKey].invoiceQuantity
              ),
              invoiceProducts: updatedInvoiceProducts,
            };
          } else {
            selectedProducts[uniqueKey] = {
              uniqueKey,
              id: productId,
              productUniqueId: uniqueKey,
              name: productName,
              barcode: undefined,
              unitOfMeasurementName,
              unitOfMeasurementId, // main measurement
              unitOfMeasurementID: unitOfMeasurementId,
              coefficientRelativeToMain: coefficient,
              hasMultiMeasurement: unitOfMeasurements?.length > 1,
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

              serialNumbers: serialNumber ? [serialNumber] : undefined,
              invoiceQuantity: Number(originalQuantity || 0),
              quantity: Number(quantityInStock || 0),
              totalQuantity: Number(quantityInStock || 0),
              hasMultiMeasurement: unitOfMeasurements?.length > 1,
              invoiceProducts: [
                {
                  invoice_product_id: isDraft
                    ? draftRootInvoiceProductId
                    : attachedInvoiceProductId,
                  invoiceQuantity: Number(
                    `${math.div(Number(quantity), Number(coefficient || 1))}`
                  ),
                },
              ],

              barcode: barcode ?? undefined,
              product_code,
              bronQuantityInStock,
              salesDraftQuantityInStock,
              brandName,
              catalog: {
                id: catalogId,
                name: catalogName,
                rootName: rootCatalogName,
                isWithoutSerialNumber: !serialNumber,
                isServiceType,
              },
              weightPerUnit,
              volumePerUnit,
            };
          }
        }
      );
      setSelectedProducts(Object.values(selectedProducts));
    });

    setEditDate(moment(operationDate, fullDateTimeWithSecond).toDate());

    setValue("operationDate", moment(operationDate, fullDateTimeWithSecond));
    setValue("stockFrom", stockFromId || undefined);
    setValue("saleManager", salesmanId || undefined);

    setValue(
      "expenseType",
      attachedInvoice === null
        ? contractId === null
          ? 2
          : 0
        : attachedInvoiceType === 11
        ? 1
        : 3
    );
    setValue(
      "expense",
      attachedInvoice === null
        ? contractId === null
          ? 0
          : contractId
        : attachedInvoice
    );

    setValue("productionProduct", productionProductId);
  };

  useEffect(() => {
    if (invoiceInfo) {
      const { invoiceType } = invoiceInfo;
      if (invoiceType === 8) {
        setIsDraft(true);
      }
      updateEditInvoice(invoiceType === 8);
    }
  }, [invoiceInfo]);

  useEffect(() => {
    fetchStatusOperations({}).then((data) => {
      setStatusData(data.filter((item) => item.operationId === 6));
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
    const {
      expense,
      expenseType,
      productionProduct,
      operationDate,
      saleManager,
      stockFrom,
      status,
    } = data;
    if (id) {
      const newWritingOffInvoice = {
        salesman: saleManager,
        stock: stockFrom,
        contract:
          expenseType === 1
            ? null
            : expense === 0
            ? null
            : expenseType === 3
            ? null
            : expense,
        invoice:
          expenseType === 1 ? expense : expenseType === 3 ? expense : null,
        description: null,
        operationDate:  moment(operationDate).format(fullDateTimeWithSecond),
        operator: profile.id,
        invoiceProducts_ul: handleSelectedProducts(selectedProducts, id, false),
        status: status || null,
        productionProduct: productionProduct || null,
      };
      editInvoice({
        id: Number(id),
        type: "remove",
        data: newWritingOffInvoice,
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
            const errorArr = {};
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
              text1: (
                <Text>
                  {"Seçilmiş tarixdə, qaimədə qeyd olunan"}{" "}
                  {errorData?.errors?.data?.length > 1
                    ? "sətirlərdəki məhsullar"
                    : "sətirdəki məhsul"}{" "}
                  {stocks?.find((item) => item.id === stockTo)?.name}{" "}
                  {"anbarında kifayət qədər yoxdur."}{" "}
                </Text>
              ),
            });
          }
          Toast.show({
            type: "error",
            text1: errorData?.message || "Xəta baş verdi",
          });
        });
    } else {
      createInvoice({
        type: "remove",
        data: {
          salesman: saleManager,
          stock: stockFrom,
          contract:
            expenseType === 1
              ? null
              : expense === 0
              ? null
              : expenseType === 3
              ? null
              : expense,
          invoice:
            expenseType === 1 ? expense : expenseType === 3 ? expense : null,
          description: null,
          operationDate: moment(operationDate).format(fullDateTimeWithSecond),
          operator: profile.id,
          status: status,
          productionProduct: productionProduct,
          invoiceProducts_ul: handleSelectedProducts(
            selectedProducts,
            null,
            false
          ),
        },
      }).then((res) => {
        Toast.show({
          type: "success",
          text1: "Məlumatlar yadda saxlandı.",
        });
        navigation.push("DashboardTabs");
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
    } else if (
      selectedProducts.some(({ unitOfMeasurementID }) => !unitOfMeasurementID)
    ) {
      Toast.show({
        type: "error",
        text2: "Qaimədə ölçü vahidi seçilməyən məhsul mövcuddur.",
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
            tenant={tenant}
            profile={profile}
            watch={watch}
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

export default WritingOff;
