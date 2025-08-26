import React, { useMemo, useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  useWindowDimensions,
  ScrollView,
  StyleSheet,
  Modal,
  Pressable,
  Platform
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
import { TabView, TabBar } from "react-native-tab-view";
import { debounce, reduce, find, isNil, trim } from "lodash";
import { useApi } from "../../hooks";
import { Feather, AntDesign, FontAwesome } from "@expo/vector-icons";
import {
  ProAsyncSelect,
  ProText,
  ProButton,
  ProTooltip,
  BronModal,
} from "../../components";
import { useForm } from "react-hook-form";
import { Table, Row } from "react-native-reanimated-table";
import ProDateTimePicker from "../../components/ProDateTimePicker";
import SweetAlert from "react-native-sweet-alert";
import {
  getCurrencies,
  getPurchaseProducts,
  getCounterparties,
  getEmployees,
  getStock,
  fetchProducts,
  createInvoice,
  editInvoice,
  fetchCashboxNames,
  fetchMultipleAccountBalance,
  convertMultipleCurrencyPost,
  createOperationInvoice,
  getContracts,
  fetchVatSettings,
  fetchStatusOperations,
} from "../../api";
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
  re_percent,
  clearBusinessUnit,
} from "../../utils";
import AddSerialNumbers from "../../components/AddSerialNumbers";
import AddFromCatalog from "../../components/AddFromCatalog";
import { fetchTransferProductsFromCatalog } from "../../api/sale";
import Contacts from "../Contacts";
import AddProduct from "../AddProduct";
import { changeNumber } from "../../utils/constants";

const math = require("exact-math");
const BigNumber = require("bignumber.js");

const tableData = {
  tableHead: [
    "No",
    "Məhsul adı",
    "Qiymət",
    "Say",
    "Ölçü vahidi",
    "Anbardakı miqdar",
    "Bron sayı",
    "SN əlavə et",
    "Seriya nömrələri",
    "Toplam",
    "ƏDV, %",
    "ƏDV məbləğ (vahid)",
    "Sil",
  ],
  widthArr: [50, 140, 140, 140, 100, 140, 140, 100, 100, 100, 100, 100, 60],
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
    profile,
    statusData,
    id,
    businessUnit,
    invoiceInfo,
    editDate,
  } = props;

  const [counterparties, setCounterparties] = useState([]);
  const [agents, setAgents] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [stock, setStock] = useState([]);
  const [defaultSelectedSalesman, setDefaultSelectedSalesman] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [addedCounterparty, setAddedCounterparty] = useState([]);

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

  const { isLoading: isLoadCounreparty, run: runCounterParty } = useApi({
    deferFn: getCounterparties,
    onResolve: (data) => {
      setCounterparties(
        data.map((item) => ({ ...item, label: item.name, value: item.id }))
      );
    },
    onReject: (error) => {
      console.log(error, "rejected");
    },
  });

  const { isLoading: isLoadAgents, run: runAgents } = useApi({
    deferFn: getCounterparties,
    onResolve: (data) => {
      setAgents(
        data.map((item) => ({ ...item, label: item.name, value: item.id }))
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
    runCounterParty({
      filter: {
        limit: 20,
        page: 1,
        categories: [4],
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
    runAgents({ filter: { limit: 20, page: 1 } });
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

  const addContactToSelect = (res) => {
    const filters = {
      limit: 10,
      page: 1,
      ids: [res.id],
      applyBusinessUnitTenantPersonFilter: 1,
      businessUnitIds:
        id && invoiceInfo
          ? invoiceInfo?.businessUnitId === null
            ? [0]
            : [invoiceInfo?.businessUnitId]
          : BUSINESS_TKN_UNIT
          ? [BUSINESS_TKN_UNIT]
          : undefined,
    };

    getCounterparties({ filters }).then((dat) => {
      setAddedCounterparty(
        dat.map((item) => ({ ...item, label: item.name, value: item.id }))
      );
      setValue("counterparty", res.id);
    });
  };

  return (
    <>
      {modalVisible && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => {
            setModalVisible(false);
          }}
        >
          <View style={styles.centeredView}>
            <View style={styles.modalView}>
              <Contacts
                fromOperation={"purchase"}
                closeModal={() => {
                  setModalVisible(false);
                }}
                addContactToSelect={addContactToSelect}
              />
              <Pressable
                style={[styles.buttonModal]}
                onPress={() => setModalVisible(false)}
              >
                <AntDesign name="close" size={18} color="black" />
              </Pressable>
            </View>
          </View>
          <Toast />
        </Modal>
      )}
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
          <Text style={{ fontSize: 18 }}>Alış</Text>

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
              label="Valyuta"
              data={currencies}
              setData={setCurrencies}
              fetchData={getCurrencies}
              async={false}
              filter={{
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
              }}
              required
              control={control}
              allowClear={false}
              name="currency"
            />
            <View style={{ position: "relative" }}>
              <View style={{ position: "absolute", zIndex: 1, right: 10, top: 10 }}>
                <ProButton
                  label={<AntDesign name="pluscircle" size={14} />}
                  type="transparent"
                  onClick={() => {
                    setModalVisible(true);
                  }}
                  padding={"0px"}
                />
              </View>
              <ProAsyncSelect
                label="Qarşı tərəf"
                data={
                  id
                    ? [
                        {
                          label: invoiceInfo.counterparty,
                          value: invoiceInfo.supplierId || invoiceInfo.clientId,
                          id: invoiceInfo.supplierId || invoiceInfo.clientId,
                        },
                        ...addedCounterparty,
                        ...counterparties.filter(
                          (supplier) =>
                            supplier.id !== invoiceInfo?.supplierId &&
                            !addedCounterparty
                              .map(({ id }) => id)
                              ?.includes(supplier.id)
                        ),
                      ]
                    : [
                        ...addedCounterparty,
                        ...counterparties.filter(
                          (supplier) =>
                            supplier.id !== invoiceInfo?.supplierId &&
                            !addedCounterparty
                              .map(({ id }) => id)
                              ?.includes(supplier.id)
                        ),
                      ]
                }
                setData={setCounterparties}
                fetchData={getCounterparties}
                async
                filter={{
                  limit: 20,
                  page: 1,
                  categories: [4],
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
                name="counterparty"
              />
            </View>
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
              label="Müqavilə"
              disabled={!getValues("counterparty")}
              data={contracts}
              setData={setContracts}
              fetchData={getContracts}
              valueName="contract_no"
              valueNameTwo="serialNumber"
              async
              filter={{
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
                endDateFrom: moment(getValues("operationDate"))?.format(
                  "DD-MM-YYYY"
                ),
              }}
              control={control}
              name="contract"
            />
            <ProAsyncSelect
              label="Agent"
              data={agents}
              setData={setAgents}
              fetchData={getCounterparties}
              async
              filter={{
                limit: 20,
                page: 1,
              }}
              control={control}
              name="agent"
            />
            <ProAsyncSelect
              label="Anbar(Haraya)"
              data={
                id
                  ? [
                      {
                        label: invoiceInfo.stockToName,
                        value: invoiceInfo.stockId,
                      },
                      ...stock,
                    ]
                  : stock
              }
              async={false}
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
              control={control}
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
    </>
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
    setCurrencies,
    vatPayments,
    endPrice,
    setEndPrice,
    discount,
    setDiscount,
    vat,
    setVat,
    useVat,
    setUseVat,
    setPayments,
    setVatSelection,
    BUSINESS_TKN_UNIT,
    loading,
    vatSettingState,
    businessUnit,
    id,
    invoiceInfo,
    purchase_discount,
    userSettings,
  } = props;

  const [data, setData] = useState(tableData);
  const [serialNumber, setSerialNumber] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [products, setProducts] = useState([]);
  const [productsByName, setProductsByName] = useState([]);
  const [selectedExpenses, setSelectedExpenses] = useState([]);
  const [snModalVisible, setSnModalVisible] = useState(false);
  const [selectedRow, setSelectedRow] = useState({});
  const [productWithSerialNumbers, setProductWithSerialNumbers] = useState([]);
  const [warningModalVisible, setWarningModalVisible] = useState(false);
  const [bronModal, setBronModal] = useState(false);
  const [productData, setProductData] = useState();
  const [catalogModalIsVisible, setCatalogModalIsVisible] = useState(false);
  const [addProductModal, setAddProductModal] = useState(false);
  const [autoFillPrice, setAutoFillPrice] = useState(true);

  const invoiceTypesIds = [1, 10, 11, 7, 14];

  useEffect(() => {
    if (userSettings) {
      const settings =  "PURCHASE-OPERATIONS";
      if (
        userSettings[settings]?.length > 0 &&
        userSettings[settings] !== null
      ) {
        const parseData = JSON?.parse(userSettings[settings]);
        const autofillPrice = parseData.find(
          (column) => column.dataIndex === "autofillPrices"
        )?.visible;

      setAutoFillPrice(autofillPrice ?? true);
      }
    }
  }, [userSettings]);

  const setProductPrice = (productId, newPrice) => {
    const newSelectedProducts = selectedProducts?.map((selectedProduct) => {
      if (
        productId === (selectedProduct.productUniqueId ?? selectedProduct.id)
      ) {
        let discountAmount = null;
        let discountedPrice = null;
        let discountAmountForBack = null;

        if (selectedProduct.discountPercentage) {
          discountAmount = new BigNumber(
            math.mul(
              parseFloat(newPrice || 0),
              math.div(parseFloat(selectedProduct.discountPercentage || 0), 100)
            )
          );
          discountAmountForBack = math.mul(
            parseFloat(newPrice || 0),
            math.div(parseFloat(selectedProduct.discountPercentage || 0), 100)
          );
          discountedPrice = new BigNumber(
            math.sub(parseFloat(newPrice || 0), parseFloat(discountAmount || 0))
          );
        }

        const totalPricePerProduct = new BigNumber(
          math.mul(
            parseFloat(newPrice || 0),
            parseFloat(selectedProduct.invoiceQuantity || 0)
          )
        );
        const totalEndPrice = new BigNumber(
          math.add(
            math.mul(
              parseFloat(
                selectedProduct.discountPercentage
                  ? discountedPrice
                  : parseFloat(newPrice) || 0
              ),
              parseFloat(selectedProduct.invoiceQuantity || 0)
            ),
            parseFloat(selectedProduct?.totalRoadTaxAmount || 0)
          )
        );

        const priceForCalc =(selectedProduct?.discountPercentage == 0 ||
          !selectedProduct?.discountPercentage) && selectedProduct?.invoiceQuantity
            ? newPrice
            : getPriceValue(discountedPrice) ??
            newPrice ??
            0;
      

        const newPercentage =
          !selectedProduct?.isVatFree && vatSettingState?.percentage && useVat
            ? math.div(
                math.mul(
                  parseFloat(vatSettingState?.percentage ?? 0) ?? 0,
                  parseFloat(
                    priceForCalc
                ) || 0),
                100
              )
            : 0;

        const taxAmountPercentage = math.mul(
          math.div(
            parseFloat(newPercentage || 0),
            parseFloat(
              priceForCalc || 1
            ) || 1
          ),
          100
          );
        const totalTaxAmount = math.mul(
          parseFloat(newPercentage || 0),
          parseFloat(selectedProduct?.invoiceQuantity || 0)
        );
        const taxAmountWithPrice = math.add(
          parseFloat(
            priceForCalc || 0
          ),
          parseFloat(newPercentage || 0)
        );
        const totalTaxAmountWithPrice = math.mul(
          parseFloat(taxAmountWithPrice || 0),
          parseFloat(selectedProduct?.invoiceQuantity || 0)
        );

        return {
          ...selectedProduct,
          invoicePrice: newPrice,
          invoicePriceBack: newPrice,
          plannedPrice:
            (selectedProduct?.discountPercentage == 0 ||
              !selectedProduct?.discountPercentage) &&
            selectedProduct?.invoiceQuantity
              ? newPrice
              : getPriceValue(discountedPrice),
          discountAmount: getPriceValue(discountAmount),
          discountAmountForBack,
          discountedPrice:
            (selectedProduct?.discountPercentage == 0 ||
              !selectedProduct?.discountPercentage) &&
            selectedProduct?.invoiceQuantity
              ? newPrice
              : getPriceValue(discountedPrice),
          totalPricePerProduct:
            getPriceValue(totalPricePerProduct)?.toString()?.split(".")[1]
              ?.length > 4
              ? getPriceValue(totalPricePerProduct)?.toFixed(4)
              : getPriceValue(totalPricePerProduct),
          totalEndPricePerProduct:
            getPriceValue(totalEndPrice)?.toString()?.split(".")[1]?.length > 4
              ? getPriceValue(totalEndPrice)?.toFixed(4)
              : getPriceValue(totalEndPrice),
          taxAmount:
            parseFloat(selectedProduct?.invoiceQuantity || 0) !== 0
              ? newPercentage
              : 0,
          taxAmountPercentage: parseFloat(taxAmountPercentage)?.toFixed(2),
          originalTaxAmount:
            parseFloat(selectedProduct?.invoiceQuantity || 0) !== 0
              ? newPercentage
              : 0,
          totalTaxAmount: parseFloat(totalTaxAmount),
          taxAmountWithPrice: parseFloat(taxAmountWithPrice),
          totalTaxAmountWithPrice: parseFloat(totalTaxAmountWithPrice),
        };
      }
      return selectedProduct;
    });
    const newtotalPrice = newSelectedProducts.reduce(
      (totalPrice, { totalPricePerProduct }) =>
        math.add(totalPrice, parseFloat(totalPricePerProduct || 0)),
      0
    );
    const totalDiscountAmount = newSelectedProducts.reduce(
      (
        totalDiscountAmount,
        { totalPricePerProduct, discountPercentage, totalEndPricePerProduct }
      ) =>
        math.add(
          totalDiscountAmount,
          parseFloat(discountPercentage) != 0
            ? math.sub(
                parseFloat(totalPricePerProduct || 0),
                parseFloat(totalEndPricePerProduct || 0)
              )
            : 0
        ),
      0
    );

    const totalTaxRoadPrice = selectedProducts?.reduce(
      (acc, product) => math.add(acc, Number(product?.totalRoadTaxAmount ?? 0)),
      0
    );
    const discountPercentage = math.mul(
      math.div(parseFloat(totalDiscountAmount || 0), newtotalPrice || 1),
      100
    );
    const filteredProducts = newSelectedProducts?.filter(
      ({ isVatFree }) => isVatFree === false
    );
    const filteredTotalPrice = filteredProducts?.reduce(
      (totalPrice, { totalPricePerProduct }) =>
        math.add(totalPrice, parseFloat(totalPricePerProduct || 0) || 0),
      0
    );
    const newVatAmount = filteredProducts?.reduce(
      (totalVat, { totalTaxAmount }) =>
        math.add(totalVat, parseFloat(totalTaxAmount || 0) || 0),
      0
    );
    const newVatPercentage = roundTo(
      math.div(
        math.mul(Number(newVatAmount || 0) || 0, 100),
        math.sub(
          Number(filteredTotalPrice || 1) || 1,
          Number(totalTaxRoadPrice || 0) || 0
        ) || 1
      ),
      4
    );

    setVat({
      percentage: newVatPercentage,
      amount: newVatAmount,
    });

    setDiscount({
      percentage: discountPercentage
        ? `${roundTo(parseFloat(discountPercentage || 0), 2)}`
        : null,
      amount: totalDiscountAmount
        ? `${parseFloat(toFixedNumber(totalDiscountAmount || 0, 4))}`
        : null,
    });
    setSelectedProducts(newSelectedProducts);
  };

  const handleInvoicePriceChange = (productId, newPrice, limit = 10000000) => {
    let checkPrice = Platform.OS === 'ios' ? changeNumber(newPrice) : newPrice
    if (
      re_amount.test(checkPrice) &&
      checkPrice <= limit &&
      Number(checkPrice || 0) <= 10000000
    ) {
      setProductPrice(productId, checkPrice);
    }
    if (checkPrice === "") {
      setProductPrice(productId, undefined);
    }
  };

  const handleProductRemove = (productId) => {
    const newSelectedProducts = selectedProducts.filter(
      (selectedProduct) => selectedProduct.productUniqueId !== productId
    );
    setSelectedProducts(newSelectedProducts);
  };

  const setProductQuantity = (productId, newQuantity, transfer, totalPrice) => {
    const newSelectedProducts = selectedProducts?.map((selectedProduct) => {
      if (
        productId === (selectedProduct.productUniqueId ?? selectedProduct.id)
      ) {
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
          totalTaxAmount: totalTaxAmount,
          totalTaxAmountWithPrice: parseFloat(totalTaxAmountWithPrice)?.toFixed(
            4
          ),
          invoiceQuantity: !transfer
            ? newQuantity
            : selectedProduct?.invoiceQuantity,
          transferinvoiceQuantity: transfer
            ? newQuantity
            : selectedProduct?.transferinvoiceQuantity,
          endPriceInMainCurrency: totalPrice || 0,
          invoiceProducts: undefined,
          // discountPercentage: newQuantity
          //   ? selectedProduct?.discountPercentage
          //   : 0,
          // discountAmount: newQuantity ? selectedProduct?.discountAmount : 0,
          // discountedPrice: newQuantity ? selectedProduct?.discountedPrice : 0,
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

  const setProductTotalPrice = (productId, newPrice) => {
    const newSelectedProducts = selectedProducts?.map((selectedProduct) => {
      if (
        productId === (selectedProduct.productUniqueId ?? selectedProduct.id)
      ) {
        const invoicePrice = math.div(
          parseFloat(newPrice || 0),
          parseFloat(selectedProduct?.invoiceQuantity || 0)
        );
        const invoicePriceValue = invoicePrice
          ? invoicePrice.toString()?.split(".")[1]?.length > 4
            ? invoicePrice?.toFixed(4)
            : invoicePrice
          : 0;
        const target = parseFloat(newPrice) || 0;
        const tax = parseFloat(selectedProduct?.totalRoadTaxAmount) || 0;
        const totalEndPricePerProduct = math.add(target, tax);
        return {
          ...selectedProduct,
          totalPricePerProduct: newPrice,
          totalEndPricePerProduct: totalEndPricePerProduct,
          discountPercentage: 0,
          discountAmount: 0,
          discountAmountForBack: 0,
          discountedPrice: invoicePriceValue,
          invoicePriceBack: invoicePrice,
          invoicePrice: invoicePriceValue,
          plannedPrice: invoicePriceValue,
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
      (totalDiscountAmount, { invoiceQuantity, discountAmount }) =>
        math.add(
          totalDiscountAmount,
          math.mul(Number(invoiceQuantity || 0), Number(discountAmount || 0))
        ),
      0
    );

    const discountPercentage = math.mul(
      math.div(parseFloat(discountAmount || 0), parseFloat(newtotalPrice) || 1),
      100
    );
    setDiscount({
      percentage: `${roundTo(parseFloat(discountPercentage || 0), 4)}`,
      amount: `${parseFloat(toFixedNumber(discountAmount || 0, 2))}`,
    });
    setSelectedProducts(newSelectedProducts);
  };

  const handleTotalPriceChange = (productId, newPrice, _, limit = 10000000) => {
    let checkPrice = Platform.OS === 'ios' ? changeNumber(newPrice) : newPrice
    if (re_amount.test(checkPrice) && checkPrice <= limit) {
      setProductTotalPrice(productId, checkPrice);
    }
    if (checkPrice === "") {
      setProductTotalPrice(productId, undefined);
    }
  };

  useEffect(() => {
    if (products.length > 0) {
      setProductsByName(
        products.map((product) => ({
          ...product,
          label: `${product.name} ${
            product.productCode
              ? `/${product.productCode}`
              : product.product_code
              ? `/${product.product_code}`
              : ""
          } ${
            Number(product.quantity || 0) > 0
              ? ` (${formatNumberToLocale(
                  defaultNumberFormat(product.quantity || 0)
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
        }))
      );
    }
  }, [products]);

  useEffect(() => {
    if (useVat) {
      handleUseVat(true);
    }
  }, [selectedProducts.length]);

  const handleTaxAmountPercentage = (productId, newPercentage) => {
    let checkPercentage = Platform.OS === 'ios' ? changeNumber(newPercentage) : newPercentage
    if (re_amount.test(checkPercentage) && Number(checkPercentage ?? 0) <= 100) {
      setTaxAmountPercentage(productId, checkPercentage);
    }
    if (checkPercentage === "") {
      setTaxAmountPercentage(productId, undefined);
    }
  };

  const setTaxAmountPercentage = (productId, newPercentage) => {
    const newSelectedProducts = selectedProducts?.map((selectedProduct) => {
      if (
        productId === (selectedProduct.productUniqueId ?? selectedProduct.id)
      ) {
        const taxAmount = math.div(
          math.mul(
            parseFloat(newPercentage || 0) || 0,
            parseFloat(
              selectedProduct?.discountedPriceForBack ||
                selectedProduct?.invoicePriceBack ||
                selectedProduct?.discountedPrice ||
                selectedProduct?.invoicePrice ||
                0
            ) || 0
          ) || 0,
          100
        );
        const totalTaxAmount = math.mul(
          parseFloat(taxAmount || 0),
          parseFloat(selectedProduct?.invoiceQuantity || 0)
        );
        const taxAmountWithPrice = math.add(
          parseFloat(
            selectedProduct?.discountedPriceForBack ||
              selectedProduct?.invoicePriceBack ||
              selectedProduct?.discountedPrice ||
              selectedProduct?.invoicePrice ||
              0
          ) || 0,
          parseFloat(taxAmount || 0)
        );
        const totalTaxAmountWithPrice = math.mul(
          parseFloat(taxAmountWithPrice || 0),
          parseFloat(selectedProduct?.invoiceQuantity || 0)
        );
        return {
          ...selectedProduct,
          taxAmountPercentage: newPercentage,
          taxAmount: parseFloat(taxAmount)?.toFixed(2),
          originalTaxAmount: taxAmount,
          totalTaxAmount: parseFloat(totalTaxAmount),
          taxAmountWithPrice: parseFloat(taxAmountWithPrice),
          totalTaxAmountWithPrice: parseFloat(totalTaxAmountWithPrice),
        };
      }
      return selectedProduct;
    });

    const totalTaxRoadPrice = selectedProducts?.reduce(
      (acc, product) => math.add(acc, Number(product?.totalRoadTaxAmount ?? 0)),
      0
    );

    const filteredProducts = newSelectedProducts?.filter(
      ({ isVatFree }) => isVatFree === false
    );
    const filteredTotalPrice = filteredProducts?.reduce(
      (totalPrice, { totalPricePerProduct }) =>
        math.add(totalPrice, parseFloat(totalPricePerProduct || 0) || 0),
      0
    );
    const newVatAmount = filteredProducts?.reduce(
      (totalVat, { totalTaxAmount }) =>
        math.add(totalVat, parseFloat(totalTaxAmount || 0) || 0),
      0
    );
    const newVatPercentage = roundTo(
      math.div(
        math.mul(Number(newVatAmount || 0) || 0, 100),
        math.sub(
          Number(filteredTotalPrice || 1) || 1,
          Number(totalTaxRoadPrice || 0) || 0
        ) || 1
      ),
      4
    );

    setVat({
      percentage: newVatPercentage,
      amount: newVatAmount,
    });

    setSelectedProducts(newSelectedProducts);
  };

  const handleTaxAmount = (productId, newPercentage) => {

    let checkPercentage = Platform.OS === 'ios' ? changeNumber(newPercentage) : newPercentage
    if (
      re_amount.test(checkPercentage) &&
      Number(checkPercentage ?? 0) <= 1000000
    ) {
      setTaxAmount(productId, checkPercentage);
    }
    if (checkPercentage === "") {
      setTaxAmount(productId, undefined);
    }
  };

  const setTaxAmount = (productId, newPercentage, value, amount) => {
    const newSelectedProducts = selectedProducts?.map((selectedProduct) => {
      if (
        productId === (selectedProduct.productUniqueId ?? selectedProduct.id)
      ) {
        const taxAmountPercentage = math.mul(
          math.div(
            parseFloat(newPercentage || 0),
            parseFloat(
              selectedProduct?.discountedPrice ||
                selectedProduct?.invoicePrice ||
                1
            ) || 1
          ),
          100
        );
        const totalTaxAmount = math.mul(
          parseFloat(newPercentage || 0),
          parseFloat(selectedProduct?.invoiceQuantity || 0)
        );
        const taxAmountWithPrice = math.add(
          parseFloat(
            selectedProduct?.discountedPrice ||
              selectedProduct?.invoicePrice ||
              0
          ),
          parseFloat(newPercentage || 0)
        );
        const totalTaxAmountWithPrice = math.mul(
          parseFloat(taxAmountWithPrice || 0),
          parseFloat(selectedProduct?.invoiceQuantity || 0)
        );
        if (value) {
          const taxAmount = selectedProduct?.isVatFree
            ? 0
            : math.mul(
                Number(
                  selectedProduct?.discountedPrice ??
                    selectedProduct?.invoicePrice ??
                    0
                ) ?? 0,
                math.div(Number(value ?? 0) ?? 0, 100)
              );
          const originaltaxAmount = selectedProduct?.isVatFree
            ? 0
            : math.mul(
                Number(
                  selectedProduct?.discountedPrice ??
                    selectedProduct?.invoicePrice ??
                    0
                ) ?? 0,
                math.div(Number(value ?? 0) ?? 0, 100)
              );
          const taxAmountPercentage = math.mul(
            math.div(
              parseFloat(taxAmount || 0),
              parseFloat(
                selectedProduct?.discountedPrice ||
                  selectedProduct?.invoicePrice ||
                  1
              ) || 1
            ),
            100
          );
          const totalTaxAmount = math.mul(
            taxAmount ?? 0,
            selectedProduct?.invoiceQuantity ?? 0
          );
          const taxAmountWithPrice = selectedProduct?.isVatFree
            ? selectedProduct?.discountedPrice ?? selectedProduct?.invoicePrice
            : math.add(
                parseFloat(
                  selectedProduct?.discountedPrice ||
                    selectedProduct?.invoicePrice ||
                    0
                ) || 0,
                parseFloat(taxAmount || 0) || 0
              );
          const totalTaxAmountWithPrice = math.mul(
            parseFloat(taxAmountWithPrice || 0) || 0,
            parseFloat(selectedProduct?.invoiceQuantity || 0) || 0
          );
          return {
            ...selectedProduct,
            taxAmount: taxAmount?.toFixed(2),
            taxAmountPercentage: parseFloat(taxAmountPercentage)?.toFixed(2),
            originalTaxAmount: originaltaxAmount ?? taxAmount,
            totalTaxAmount: parseFloat(totalTaxAmount),
            taxAmountWithPrice: parseFloat(taxAmountWithPrice),
            totalTaxAmountWithPrice: parseFloat(totalTaxAmountWithPrice),
          };
        }
        return {
          ...selectedProduct,
          taxAmount: newPercentage,
          taxAmountPercentage: parseFloat(taxAmountPercentage)?.toFixed(2),
          originalTaxAmount: newPercentage,
          totalTaxAmount: parseFloat(totalTaxAmount),
          taxAmountWithPrice: parseFloat(taxAmountWithPrice),
          totalTaxAmountWithPrice: parseFloat(totalTaxAmountWithPrice),
        };
      }
      return selectedProduct;
    });

    const totalTaxRoadPrice = selectedProducts?.reduce(
      (acc, product) => math.add(acc, Number(product?.totalRoadTaxAmount ?? 0)),
      0
    );
    const filteredProducts = newSelectedProducts?.filter(
      ({ isVatFree }) => isVatFree === false
    );
    const filteredTotalPrice = filteredProducts?.reduce(
      (totalPrice, { totalPricePerProduct }) =>
        math.add(totalPrice, parseFloat(totalPricePerProduct || 0) || 0),
      0
    );
    const newVatAmount = filteredProducts?.reduce(
      (totalVat, { totalTaxAmount }) =>
        math.add(totalVat, parseFloat(totalTaxAmount || 0) || 0),
      0
    );

    const newVatPercentage = roundTo(
      math.div(
        math.mul(Number(newVatAmount || 0) || 0, 100),
        math.sub(
          Number(filteredTotalPrice || 1) || 1,
          Number(totalTaxRoadPrice || 0) || 0
        ) || 1
      ),
      4
    );
    const discountAmount = newSelectedProducts?.reduce(
      (totalDiscountAmount, { invoiceQuantity, discountAmountForBack }) =>
        math.add(
          totalDiscountAmount ?? 0,
          math.mul(
            Number(invoiceQuantity || 0) || 0,
            Number(discountAmountForBack || 0) || 0
          )
        ),
      0
    );

    const discountPercentage = math.mul(
      math.div(
        parseFloat(discountAmount || 0) || 0,
        Number(
          selectedProducts?.reduce(
            (totalPrice, { totalPricePerProduct }) =>
              math.add(totalPrice, Number(totalPricePerProduct || 0)),
            0
          ) || 0
        ) || 1
      ),
      100
    );

    setSelectedProducts(newSelectedProducts);
    setVat(
      Number(value ?? 0) >= 0 && value !== undefined && !amount
        ? { ...vat, amount: newVatAmount }
        : amount
        ? {
            ...vat,
            percentage: newVatPercentage,
          }
        : {
            percentage: newVatPercentage,
            amount: newVatAmount,
          }
    );

    setDiscount(
      Number(value ?? 0) >= 0 && value !== undefined && !amount
        ? {
            percentage: `${toFixedNumber(
              parseFloat(discountPercentage || 0),
              4
            )}`,
            amount: `${parseFloat(toFixedNumber(discountAmount || 0, 2))}`,
          }
        : discount
    );
  };

  const handleBron = (productId, productName) => {
    setBronModal(true);
    setProductData({ id: productId, name: productName });
  };

  useEffect(() => {
    if (!id) {
      if (endPrice && Number(vat?.percentage ?? 0)) {
        const totalTaxRoadPrice = reduce(
          selectedProducts,
          (acc, product) => acc + Number(product?.totalRoadTaxAmount ?? 0),
          0
        );

        const AMOUNT = roundTo(
          math.div(
            math.mul(
              Number(Number(vat.percentage ?? 0) || 0),
              math.sub(Number(endPrice || 0), Number(totalTaxRoadPrice || 0))
            ),
            100
          ),
          2
        );
        if (useVat) {
          setVat({
            newPercentage: Number(vat.percentage ?? 0) || undefined,
            newAmount: AMOUNT || undefined,
          });
          selectedProducts.forEach((product) => {
            const newtaxAmount =
              !product?.isVatFree && vat.percentage
                ? math.div(
                    math.mul(
                      parseFloat(vat.percentage ?? 0) ?? 0,
                      parseFloat(
                        product?.discountAmount
                          ? product?.discountedPrice
                          : product.invoicePriceBack || 0
                      ) || 0
                    ) || 0,
                    100
                  )
                : 0;
            setTaxAmount(
              product?.productUniqueId ?? product?.id,
              Number(vat.percentage ?? 0),
              Number(vat.percentage ?? 0)
            );
          });
        }
      }
    }
  }, [endPrice]);

  useEffect(() => {
    if (id) {
      if (vat.percentage && Number(invoiceInfo?.taxAmount ?? 0)) {
        setUseVat(true);
      } else {
        setUseVat(false);
      }
    }
  }, [vat.percentage, invoiceInfo]);

  useEffect(() => {
    if (id && invoiceInfo && Number(invoiceInfo?.taxAmount ?? 0)) {
      const newSelectedProducts = selectedProducts?.map((selectedProduct) => {
        const newtaxAmount = !selectedProduct?.isVatFree
          ? selectedProduct?.taxAmount
          : 0;
        const newtaxAmountFornewAdded =
          selectedProduct?.isVatFree && vatSettingState?.percentage
            ? math.div(
                math.mul(
                  parseFloat(vatSettingState?.percentage ?? 0) ?? 0,
                  parseFloat(
                    selectedProduct?.discountAmount
                      ? selectedProduct?.discountedPrice
                      : selectedProduct.invoicePriceBack ??
                          selectedProduct?.invoicePrice ??
                          0
                  )
                ) || 0,
                100
              )
            : 0;
        const changedTaxAmount =
          newtaxAmount === undefined ? newtaxAmountFornewAdded : newtaxAmount;

        const newTaxAmountForEdit = selectedProduct?.taxAmountPercentage
          ? math.div(
              math.mul(
                parseFloat(selectedProduct?.taxAmountPercentage || 0) || 0,
                parseFloat(
                  selectedProduct?.discountedPrice ||
                    selectedProduct?.invoicePriceBack ||
                    selectedProduct?.invoicePrice ||
                    0
                ) || 0
              ) || 0,
              100
            )
          : selectedProduct?.originalTaxAmount || changedTaxAmount;
        const taxAmountWithPrice = selectedProduct?.isVatFree
          ? selectedProduct?.discountedPrice
          : math.add(
              parseFloat(selectedProduct?.discountedPrice || 0),
              parseFloat(newTaxAmountForEdit || 0)
            );
        const taxAmountPercentage = selectedProduct?.taxAmountPercentage
          ? selectedProduct?.taxAmountPercentage
          : math.mul(
              math.div(
                parseFloat(newTaxAmountForEdit || 0),
                parseFloat(
                  selectedProduct?.discountedPrice ||
                    selectedProduct?.invoicePrice ||
                    1
                ) || 1
              ),
              100
            );
        const totalTaxAmountWithPrice = math.mul(
          parseFloat(taxAmountWithPrice || 0),
          parseFloat(selectedProduct?.invoiceQuantity || 0)
        );
        const totalTaxAmount = math.mul(
          parseFloat(newTaxAmountForEdit || 0),
          parseFloat(selectedProduct?.invoiceQuantity || 0)
        );
        return {
          ...selectedProduct,
          originalTaxAmount: newTaxAmountForEdit,
          taxAmount: parseFloat(newTaxAmountForEdit),
          taxAmountPercentage: parseFloat(taxAmountPercentage)?.toFixed(2),
          taxAmountWithPrice: parseFloat(taxAmountWithPrice),
          totalTaxAmountWithPrice: parseFloat(totalTaxAmountWithPrice),
          totalTaxAmount: parseFloat(totalTaxAmount),
        };
      });

      const totalTaxRoadPrice = selectedProducts?.reduce(
        (acc, product) =>
          math.add(acc, Number(product?.totalRoadTaxAmount ?? 0)),
        0
      );
      const filteredProducts = newSelectedProducts?.filter(
        ({ isVatFree }) => isVatFree === false
      );
      const filteredTotalPrice = newSelectedProducts?.reduce(
        (totalPrice, { totalPricePerProduct }) =>
          math.add(totalPrice, parseFloat(totalPricePerProduct || 0) || 0),
        0
      );
      const newVatAmount = newSelectedProducts?.reduce(
        (totalVat, { totalTaxAmount }) =>
          math.add(totalVat, parseFloat(totalTaxAmount || 0) || 0),
        0
      );

      const newVatPercentage = roundTo(
        math.div(
          math.mul(Number(newVatAmount || 0) || 0, 100),
          math.sub(
            Number(filteredTotalPrice || 1) || 1,
            Number(totalTaxRoadPrice || 0) || 0
          ) || 1
        ),
        4
      );
      const discountAmount = newSelectedProducts?.reduce(
        (totalDiscountAmount, { invoiceQuantity, discountAmountForBack }) =>
          math.add(
            totalDiscountAmount ?? 0,
            math.mul(
              Number(invoiceQuantity || 0) || 0,
              Number(discountAmountForBack || 0) || 0
            )
          ),
        0
      );

      const discountPercentage = math.mul(
        math.div(
          parseFloat(discountAmount || 0) || 0,
          Number(
            selectedProducts?.reduce(
              (totalPrice, { totalPricePerProduct }) =>
                math.add(totalPrice, Number(totalPricePerProduct || 0)),
              0
            ) || 0
          ) || 1
        ),
        100
      );

      setSelectedProducts(newSelectedProducts);
      setVat({
        percentage: newVatPercentage,
        amount: newVatAmount,
      });
    }
  }, [endPrice, invoiceInfo]);

  const handleProductTotalPrice = (invoiceQuantity, invoicePrice) => {
    return invoicePrice
        ? defaultNumberFormat(
              math.mul(
                  Number(invoiceQuantity) || 0,
                  Number(invoicePrice) || 0
              )
          )
        : null;
};


  useEffect(() => {
    setData({
      ...data,
      tableData: selectedProducts?.map(
        (
          {
            name,
            invoicePrice,
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
            totalPricePerProduct,
            usedSerialNumber,
            isVatFree,
            taxAmount,
            taxAmountPercentage,
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
                value={invoicePrice ? `${invoicePrice}` : undefined}
                keyboardType="numeric"
                onChangeText={(event) => {
                  handleInvoicePriceChange(
                    productUniqueId ?? id,
                    event,
                    "expense_amount"
                  );
                }}
                style={{
                  margin: 10,
                  padding: 5,
                  borderWidth: 1,
                  borderRadius: 5,
                  borderColor: "#D0DBEA",
                }}
              />
            </View>,
            <View>
              <TextInput
                value={invoiceQuantity ? `${invoiceQuantity}` : undefined}
                keyboardType="numeric"
                onChangeText={(event) => {
                  handleQuantityChange(
                    productUniqueId ?? id,
                    event,
                    1000000000000000
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
              label={
                <AntDesign
                  name="pluscircle"
                  size={14}
                  color={
                    catalog?.isWithoutSerialNumber || catalog?.isServiceType
                      ? "#C2BDC2"
                      : "grey"
                  }
                />
              }
              disabled={
                catalog?.isWithoutSerialNumber || catalog?.isServiceType
                  ? true
                  : false
              }
              type="transparent"
              onClick={() => {
                setSnModalVisible(true);
                setSelectedRow({
                  usedSerialNumber,
                  productUniqueId,
                  serialNumbers,
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
            <View>
              <TextInput
                value={
                  totalPricePerProduct?.toString()?.split('.')[1]?.length > 2
                      ? `${roundTo(parseFloat(totalPricePerProduct) || 0, 2)}`
                      : `${totalPricePerProduct ?? handleProductTotalPrice(invoiceQuantity, invoicePrice)}`
                }
                keyboardType="numeric"
                onChangeText={(event) => {
                  handleTotalPriceChange(
                    productUniqueId ?? id,
                    event,
                    "expense_amount"
                  );
                }}
                style={{
                  margin: 10,
                  padding: 5,
                  borderWidth: 1,
                  borderRadius: 5,
                  borderColor: "#D0DBEA",
                }}
              />
            </View>,
            <View>
              <TextInput
                value={
                  taxAmountPercentage ? `${taxAmountPercentage}` : undefined
                }
                keyboardType="numeric"
                onChangeText={(event) => {
                  handleTaxAmountPercentage(productUniqueId ?? id, event);
                }}
                editable={
                  !isVatFree &&
                  vatSettingState?.isActive &&
                  vatSettingState?.isEditable
                }
                style={
                  !isVatFree &&
                  vatSettingState?.isActive &&
                  vatSettingState?.isEditable
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
            <View>
              <TextInput
                value={taxAmount ? `${taxAmount}` : undefined}
                keyboardType="numeric"
                onChangeText={(event) => {
                  handleTaxAmount(productUniqueId ?? id, event, taxAmount);
                }}
                editable={
                  !isVatFree &&
                  vatSettingState?.isActive &&
                  vatSettingState?.isEditable
                }
                style={
                  !isVatFree &&
                  vatSettingState?.isActive &&
                  vatSettingState?.isEditable
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
    deferFn: getPurchaseProducts,
    onResolve: (data) => {
      setProducts(
        data.map((item) => ({ ...item, label: item.name, value: item.id }))
      );
    },
    onReject: (error) => {
      console.log(error, "rejected");
    },
  });

  const setProductDiscountPercentage = (newPercentage, isManual) => {
    const newSelectedProducts = selectedProducts?.map((selectedProduct) => {
      const discountAmount = new BigNumber(
        math.mul(
          parseFloat(selectedProduct?.invoicePrice) || 0,
          math.div(parseFloat(newPercentage || 0), 100)
        )
      );
      const discountAmountForBack = math.mul(
        Number(
          selectedProduct?.invoicePriceBack ?? selectedProduct?.invoicePrice
        ) || 0,
        math.div(Number(newPercentage || 0), 100)
      );
      const discountedPrice = discountAmount
        ? new BigNumber(
            math.sub(
              parseFloat(selectedProduct?.invoicePrice || 0),
              parseFloat(discountAmount || 0)
            )
          )
        : selectedProduct?.invoicePrice;

      return {
        ...selectedProduct,
        discountPercentage: toFixedNumber(newPercentage, 4),
        discountAmountForBack,
        discountAmount: toFixedNumber(discountAmount, 4),
        discountedPrice: toFixedNumber(discountedPrice, 4),
        plannedPrice: toFixedNumber(discountedPrice, 4),
        totalEndPricePerProduct: math.add(
          math.sub(
            parseFloat(selectedProduct?.totalPricePerProduct),
            math.mul(
              parseFloat(selectedProduct?.totalPricePerProduct || 0),
              math.div(parseFloat(newPercentage || 0), 100)
            )
          ),
          parseFloat(selectedProduct?.totalRoadTaxAmount || 0)
        ),
      };
    });

    setSelectedProducts(newSelectedProducts);
  };

  const handleDiscountPercentage = (
    newPercentage,
    isManual = false,
    limit = 100,
    skipRegex = false
  ) => {

    let checkPercentage = Platform.OS === 'ios' ? changeNumber(newPercentage) : newPercentage
    if (
      (re_amount.test(checkPercentage) || skipRegex) &&
      checkPercentage <= limit
    ) {
      setProductDiscountPercentage(checkPercentage, isManual);
    }
    if (checkPercentage === "") {
      setProductDiscountPercentage(undefined, isManual);
    }
  };

  const handleDiscountChange = (
    value,
    type,
    addition = null,
    isManual = false
  ) => {
    let checkPercentage = Platform.OS === 'ios' ? changeNumber(value) : value
    const totalPrice = Number(
      selectedProducts?.reduce(
        (totalPrice, { totalPricePerProduct }) =>
          math.add(totalPrice, Number(totalPricePerProduct || 0)),
        0
      ) || 0
    );
    const re = /^[0-9]{1,9}\.?[0-9]{0,2}$/;
    if (checkPercentage === "") {
      handleDiscountPercentage(0);
      setDiscount({
        percentage: null,
        amount: null,
      });
    }
    if (Number(checkPercentage) === 100) {
      setVat({
        percentage: undefined,
        amount: undefined,
      });
      setUseVat(false);
    }
    if (type === "percentage" && re_percent.test(checkPercentage) && checkPercentage <= 100) {
      const AMOUNT = roundTo(
        math.div(math.mul(Number(checkPercentage), Number(totalPrice || 0)), 100),
        2
      );
      setDiscount({
        percentage: `${checkPercentage}` || undefined,
        amount: `${AMOUNT}` || undefined,
      });
    }
    if (
      type === "amount" &&
      re.test(checkPercentage) &&
      Number(checkPercentage) <= Number(totalPrice)
    ) {
      const PERCENTAGE = math.div(
        math.mul(Number(checkPercentage || 0), 100),
        Number(totalPrice || 1)
      );

      handleDiscountPercentage(PERCENTAGE ?? null, false, 100, true);
      setDiscount({
        percentage: `${roundTo(PERCENTAGE, 4)}` || undefined,
        amount: `${checkPercentage}` || undefined,
      });
    }
    if (type === "percentage" && checkPercentage <= 100) {
      if (!addition) {
        handleDiscountPercentage(checkPercentage ?? "", isManual);
        return;
      }

      handleDiscountPercentage(checkPercentage ?? "");
    }
  };

  const handleUseVat = (checked) => {
    setUseVat(checked);
    if (checked) {
      const newSelectedProducts = selectedProducts?.map((selectedProduct) => {
        const newPercentage =
          !selectedProduct?.isVatFree && vatSettingState?.percentage
            ? math.div(
                math.mul(
                  parseFloat(vatSettingState?.percentage ?? 0) ?? 0,
                  parseFloat(
                    selectedProduct?.discountedPrice ??
                      selectedProduct?.invoicePrice ??
                      0
                  )
                ) || 0,
                100
              )
            : 0;

        const taxAmountPercentage = math.mul(
          math.div(
            parseFloat(newPercentage || 0),
            parseFloat(
              selectedProduct?.discountedPrice ||
                selectedProduct?.invoicePrice ||
                1
            ) || 1
          ),
          100
        );
        const totalTaxAmount = math.mul(
          parseFloat(newPercentage || 0),
          parseFloat(selectedProduct?.invoiceQuantity || 0)
        );
        const taxAmountWithPrice = math.add(
          parseFloat(
            selectedProduct?.discountedPrice ||
              selectedProduct?.invoicePrice ||
              0
          ),
          parseFloat(newPercentage || 0)
        );
        const totalTaxAmountWithPrice = math.mul(
          parseFloat(taxAmountWithPrice || 0),
          parseFloat(selectedProduct?.invoiceQuantity || 0)
        );
        return {
          ...selectedProduct,
          taxAmount:
            parseFloat(selectedProduct?.invoiceQuantity || 0) !== 0
              ? newPercentage
              : 0,
          taxAmountPercentage: parseFloat(taxAmountPercentage)?.toFixed(2),
          originalTaxAmount:
            parseFloat(selectedProduct?.invoiceQuantity || 0) !== 0
              ? newPercentage
              : 0,
          totalTaxAmount: parseFloat(totalTaxAmount),
          taxAmountWithPrice: parseFloat(taxAmountWithPrice),
          totalTaxAmountWithPrice: parseFloat(totalTaxAmountWithPrice),
        };
      });

      const totalTaxRoadPrice = selectedProducts?.reduce(
        (acc, product) =>
          math.add(acc, Number(product?.totalRoadTaxAmount ?? 0)),
        0
      );

      const filteredProducts = newSelectedProducts?.filter(
        ({ isVatFree }) => isVatFree === false
      );
      const filteredTotalPrice = filteredProducts?.reduce(
        (totalPrice, { totalPricePerProduct }) =>
          math.add(totalPrice, parseFloat(totalPricePerProduct || 0) || 0),
        0
      );
      const newVatAmount = filteredProducts?.reduce(
        (totalVat, { totalTaxAmount }) =>
          math.add(totalVat, parseFloat(totalTaxAmount || 0) || 0),
        0
      );

      const newVatPercentage = roundTo(
        math.div(
          math.mul(Number(newVatAmount || 0) || 0, 100),
          math.sub(
            Number(filteredTotalPrice || 1) || 1,
            Number(totalTaxRoadPrice || 0) || 0
          ) || 1
        ),
        4
      );
      const discountAmount = newSelectedProducts?.reduce(
        (totalDiscountAmount, { invoiceQuantity, discountAmountForBack }) =>
          math.add(
            totalDiscountAmount ?? 0,
            math.mul(
              Number(invoiceQuantity || 0) || 0,
              Number(discountAmountForBack || 0) || 0
            )
          ),
        0
      );

      const discountPercentage = math.mul(
        math.div(
          parseFloat(discountAmount || 0) || 0,
          Number(
            selectedProducts.reduce(
              (totalPrice, { totalPricePerProduct }) =>
                math.add(totalPrice, Number(totalPricePerProduct || 0)),
              0
            ) || 0
          ) || 1
        ),
        100
      );

      setSelectedProducts(newSelectedProducts);

      setVat({
        percentage: newVatPercentage,
        amount: newVatAmount,
      });
    }
    if (!checked) {
      const newSelectedProducts = selectedProducts?.map((selectedProduct) => {
        const newPercentage = 0;

        const taxAmountPercentage = 0;
        const totalTaxAmount = 0;
        const taxAmountWithPrice = math.add(
          parseFloat(
            selectedProduct?.discountedPrice ||
              selectedProduct?.invoicePrice ||
              0
          ),
          parseFloat(newPercentage || 0)
        );
        const totalTaxAmountWithPrice = math.mul(
          parseFloat(taxAmountWithPrice || 0),
          parseFloat(selectedProduct?.invoiceQuantity || 0)
        );
        return {
          ...selectedProduct,
          taxAmount: newPercentage,
          taxAmountPercentage: parseFloat(taxAmountPercentage)?.toFixed(2),
          originalTaxAmount: newPercentage,
          totalTaxAmount: parseFloat(totalTaxAmount),
          taxAmountWithPrice: parseFloat(taxAmountWithPrice),
          totalTaxAmountWithPrice: parseFloat(totalTaxAmountWithPrice),
        };
      });

      const discountAmount = newSelectedProducts?.reduce(
        (totalDiscountAmount, { invoiceQuantity, discountAmountForBack }) =>
          math.add(
            totalDiscountAmount ?? 0,
            math.mul(
              Number(invoiceQuantity || 0) || 0,
              Number(discountAmountForBack || 0) || 0
            )
          ),
        0
      );
      setSelectedProducts(newSelectedProducts);
      setVat({
        percentage: undefined,
        amount: undefined,
      });
    }
    if (vatPayments.length > 0) {
      setPayments([]);
      setVatSelection(false);
    }
  };

  const handleSearch = useMemo(
    () =>
      debounce((event, page, isScroll) => {
        if (serialNumber) {
          runProduct({
            filter: {
              q: event,
              businessUnitIds: id
                ? businessUnit === null
                  ? [0]
                  : [businessUnit]
                : BUSINESS_TKN_UNIT
                ? [BUSINESS_TKN_UNIT]
                : undefined,
            },
            type: serialNumber ? "serial-numbers" : "products",
          });
        } else {
          fetchProducts({
            filter: {
              withUnitOfMeasurements: 1,
              withMinMaxPrice: 1,
              withRoadTaxes: 1,
              productCodeName: event,
              datetime: moment(getValues("operationDate"))?.format(
                fullDateTimeWithSecond
              ),
              isDeleted: 0,
              limit: 25,
              page: 1,
              includeServices: 1,
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
                          invoicePrice: autoFillPrice ? math.mul(
                            parseFloat(product.lastPrice ?? 0),
                            parseFloat(item?.coefficientRelativeToMain || 1) ||
                              1
                          ) : null,
                          mainInvoicePrice: autoFillPrice ? math.mul(
                            parseFloat(product.lastPrice ?? 0),
                            parseFloat(item?.coefficientRelativeToMain || 1) ||
                              1
                          ) : null,
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
                  invoicePrice: autoFillPrice ? math.mul(
                    parseFloat(product.lastPrice ?? 0),
                    parseFloat(product?.coefficientRelativeToMain || 1) || 1
                  ) : null,
                  mainInvoicePrice: autoFillPrice ? math.mul(
                    parseFloat(product.lastPrice ?? 0),
                    parseFloat(product?.coefficientRelativeToMain || 1) || 1
                  ) : null,
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
    [serialNumber, autoFillPrice]
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

  useEffect(() => {
    const totalPrice = Number(
      selectedProducts.reduce(
        (totalPrice, { totalPricePerProduct }) =>
          math.add(totalPrice, Number(totalPricePerProduct || 0)),
        0
      ) || 0
    );
    let newEndPrice = roundTo(Number(totalPrice || 0), 4);
    // const totalTaxRoadPrice = reduce(
    //   selectedProducts,
    //   (acc, product) => acc + Number(product?.totalRoadTaxAmount ?? 0),
    //   0
    // );
    if (totalPrice && discount.amount) {
      newEndPrice = roundTo(
        math.sub(Number(totalPrice) || 0, Number(discount.amount || 0)),
        4
      );
    } else if (discount.amount) {
      newEndPrice = 0;
    }

    setEndPrice(Number(newEndPrice || 0));
    // setEndPrice(math.add(Number(newEndPrice || 0), totalTaxRoadPrice));
    if (Number(discount.percentage) === 100) {
      setVat({
        percentage: null,
        amount: null,
      });
      return;
    }
  }, [selectedProducts, discount.amount]);

  return (
    <View style={styles.container}>
      {addProductModal && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={addProductModal}
          onRequestClose={() => {
            setAddProductModal(false);
          }}
        >
          <View style={styles.centeredView}>
            <View style={styles.productModalView}>
              <ProText variant="heading" style={{ color: "black" }}>
                Məhsul əlavə et
              </ProText>
              <AddProduct
                fromPurchase
                route={{
                  params: { id: false, invoiceInfo: {}, businessUnit: null },
                }}
                setSelectedPurchaseProducts={setSelectedProducts}
                selectedPurchaseProducts={selectedProducts}
                setAddProductModal={setAddProductModal}
              />
              <Pressable
                style={[styles.button]}
                onPress={() => setAddProductModal(false)}
              >
                <AntDesign name="close" size={14} color="black" />
              </Pressable>
            </View>
          </View>
        </Modal>
      )}
      <AddFromCatalog
        getValues={getValues}
        type="purchase"
        selectedProducts={selectedProducts}
        // reqPage={reqPage}
        // stopReq={stopReq}
        invoiceTypesIds={invoiceTypesIds}
        isVisible={catalogModalIsVisible}
        setModalVisible={setCatalogModalIsVisible}
        setSelectedProducts={setSelectedProducts}
        autoFillPrice={autoFillPrice}
      />
      <BronModal
        isVisible={bronModal}
        setIsVisible={setBronModal}
        productData={productData}
      />
      <AddSerialNumbers
        type={"purchase"}
        selectedRow={selectedRow}
        isVisible={snModalVisible}
        setSerialModalIsVisible={setSnModalVisible}
        selectedProducts={selectedProducts}
        setSelectedProducts={setSelectedProducts}
        setProductWithSerialNumbers={setProductWithSerialNumbers}
        productWithSerialNumbers={productWithSerialNumbers}
        setWarningModalVisible={setWarningModalVisible}
        setVat={setVat}
      />

      <View style={{ display: "flex", flexDirection: "column" }}>
        <Text>{!serialNumber ? "Məhsul axtar:" : "Seriya nömrə axtar:"}</Text>
        <View
          style={{
            display: "flex",
            flexDirection: "row",
            width: "100%",
            alignItems: "center",
            gap: 5,
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
              setData={setProducts}
              fetchData={getPurchaseProducts}
              filter={{}}
              handleSearch={handleSearch}
              searchWithBack
              notValue
              notForm
              handleSelectValue={handleSelectValue}
            />
          </View>
          <ProButton
            label={<Feather name="plus" size={14} />}
            type="primary"
            defaultStyle={{ borderRadius: 8, marginTop: 8 }}
            onClick={() => {
              setAddProductModal(true);
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
          // onClick={handleSubmit}
          // loading={isLoading}
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
          <Text>Toplam qiymət:</Text>
          <Text>
            {formatNumberToLocale(
              defaultNumberFormat(
                roundTo(
                  Number(
                    selectedProducts.reduce(
                      (totalPrice, { totalPricePerProduct }) =>
                        math.add(totalPrice, Number(totalPricePerProduct || 0)),
                      0
                    ) || 0
                  ),
                  2
                )
              )
            )}{" "}
            {currencies.find(({ id }) => id === getValues("currency"))?.code}
          </Text>
        </View>
        {purchase_discount?.permission !== 0 && (
          <View style={{ ...styles.footer, alignItems: "center" }}>
            <View>
              <Text>Endirim:</Text>
            </View>

            <View style={{ display: "flex", flexDirection: "row" }}>
              <View
                style={
                  purchase_discount?.permission !== 1
                    ? [styles.inputContainer]
                    : [styles.inputContainer, styles.disabledInputContainer]
                }
              >
                <TextInput
                  value={discount?.percentage}
                  keyboardType="numeric"
                  underlineColorAndroid="transparent"
                  onChangeText={(event) => {
                    handleDiscountChange(event, "percentage", null, true);
                  }}
                  editable={purchase_discount?.permission !== 1}
                  style={{
                    width: 90,
                    padding: 5,
                  }}
                />
                <Text style={styles.prefix}>%</Text>
              </View>
              <View
                style={
                  purchase_discount?.permission !== 1
                    ? [{ ...styles.inputContainer, marginRight: 0 }]
                    : [
                        { ...styles.inputContainer, marginRight: 0 },
                        styles.disabledInputContainer,
                      ]
                }
              >
                <TextInput
                  value={discount?.amount}
                  keyboardType="numeric"
                  underlineColorAndroid="transparent"
                  onChangeText={(event) => {
                    handleDiscountChange(event, "amount");
                  }}
                  editable={purchase_discount?.permission !== 1}
                  style={{
                    width: 80,
                    padding: 5,
                  }}
                />
                <Text style={styles.prefix}>
                  {
                    currencies?.find(({ id }) => id === getValues("currency"))
                      ?.code
                  }
                </Text>
              </View>
            </View>
          </View>
        )}
        {purchase_discount?.permission !== 0 && (
          <View style={styles.footer}>
            <Text>Son qiymət:</Text>
            <Text>
              {formatNumberToLocale(
                defaultNumberFormat(endPrice?.toFixed(2) ?? 0)
              )}{" "}
              {currencies?.find(({ id }) => id === getValues("currency"))?.code}
            </Text>
          </View>
        )}
        <View style={{ ...styles.footer, alignItems: "center" }}>
          <View style={styles.checkboxContainer}>
            <CheckBox
              value={useVat}
              onValueChange={(event) => handleUseVat(event)}
              style={styles.checkbox}
              checked={Number(discount.percentage) === 100 ? false : useVat}
              disabled={
                Number(discount.percentage) === 100 ||
                !vatSettingState?.isActive
              }
            />
            <Text style={{ marginLeft: 5 }}>ƏDV:</Text>
          </View>
          {useVat && (
            <View style={{ display: "flex", flexDirection: "row" }}>
              <Text>
                {Number(vat?.amount || 0)?.toFixed(2)}{" "}
                {
                  currencies?.find(({ id }) => id === getValues("currency"))
                    ?.code
                }
              </Text>
            </View>
          )}
        </View>
        {useVat && (
          <View style={styles.footer}>
            <Text>Yekun (ƏDV ilə):</Text>
            <Text>
              {formatNumberToLocale(
                defaultNumberFormat(
                  math
                    .add(Number(endPrice || 0), Number(vat.amount || 0))
                    ?.toFixed(2)
                )
              )}{" "}
              {currencies?.find(({ id }) => id === getValues("currency"))?.code}
            </Text>
          </View>
        )}
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

const ThirdRoute = (props) => {
  const {
    handleSubmit,
    onSubmit,
    navigation,
    getValues,
    selectedProducts,
    setSelectedProducts,
    currencies,
    setCurrencies,
    control,
    vatPayments,
    setVatPayments,
    isSelected,
    setSelection,
    isVatSelected,
    setVatSelection,
    payments,
    setPayments,
    expenseRates,
    setExpenseRates,
    vatExpenseRates,
    setVatExpenseRates,
    endPrice,
    vat,
    useVat,
    BUSINESS_TKN_UNIT,
    loading,
    businessUnit,
    id,
    invoiceInfo,
  } = props;
  const [paymentTableData, setPaymentTableData] = useState([]);
  const [vatPaymentTableData, setVatPaymentTableData] = useState([]);
  const [cashbox, setCashbox] = useState([]);
  const [allCashBoxNames, setCashboxNames] = useState([]);
  const paymentTableHead = [
    "No",
    "Valyuta",
    "Hesab növü",
    "Hesab",
    "Ödəniş məbləği",
    `Silinəcək məbləğ (${currencies.find(({ isMain }) => isMain)?.code})`,
    "Sil",
  ];

  const { isLoading, run } = useApi({
    deferFn: fetchCashboxNames,
    onResolve: (data) => {
      setCashboxNames(
        data.map((item) => ({ ...item, label: item.name, value: item.id }))
      );
    },
    onReject: (error) => {
      console.log(error, "rejected");
    },
  });

  const { isLoading: isLoadBalance, run: runAccountBalance } = useApi({
    deferFn: fetchMultipleAccountBalance,
    onResolve: (data) => {
      setCashbox(data);
    },
    onReject: (error) => {
      console.log(error, "rejected");
    },
  });

  const { isLoading: isLoadConvertCurrrency, run: runConvertCurrency } = useApi(
    {
      deferFn: convertMultipleCurrencyPost,
      onResolve: (data) => {
        setCashbox(data);
      },
      onReject: (error) => {
        console.log(error, "rejected");
      },
    }
  );

  useEffect(() => {
    run({
      applyBusinessUnitTenantPersonFilter: 1,
      businessUnitIds: id
        ? businessUnit === null
          ? [0]
          : [businessUnit]
        : BUSINESS_TKN_UNIT
        ? [BUSINESS_TKN_UNIT]
        : undefined,
    });
  }, []);

  const getCashboxNames = (cashBoxType) => {
    return allCashBoxNames.filter(({ type }) => type === cashBoxType);
  };

  const handlePriceChange = (
    expenseItemId,
    newPrice,
    typeOperation,
    limit,
    type
  ) => {

    let checkPrice = Platform.OS === 'ios' ? changeNumber(newPrice) : newPrice
    const newExpenses = (type === "vat" ? vatPayments : payments).map(
      (selectedExpenseItem, index) => {
        if (index === expenseItemId) {
          if (typeOperation === "amountToDelete") {
            return {
              ...selectedExpenseItem,
              amountToDelete: checkPrice,
              rate: math.div(
                Number(checkPrice),
                selectedExpenseItem?.paymentAmount
              ),
            };
          } else if (typeOperation === "paymentAmount") {
            if (
              (re_paymentAmount.test(checkPrice) &&
                Number(checkPrice) <= Number(limit)) ||
              checkPrice === ""
            ) {
              return {
                ...selectedExpenseItem,
                [typeOperation || "paymentAmount"]: checkPrice,
              };
            }
          } else {
            const currentRate = currencies?.find(
              ({ id }) => id === checkPrice
            )?.rate;
            return {
              ...selectedExpenseItem,
              [typeOperation]: checkPrice,
              cashboxId:
                typeOperation === "cashBoxType"
                  ? undefined
                  : typeOperation === "cashboxId"
                  ? newPrice
                  : selectedExpenseItem?.cashboxId,
              amountToDelete:
                typeOperation === "currency"
                  ? undefined
                  : selectedExpenseItem?.amountToDelete,
              paymentAmount:
                typeOperation === "currency"
                  ? `${customRound(
                      Number(
                        math.div(
                          Number(
                            type === "vat"
                              ? defaultNumberFormat(
                                  math.sub(
                                    customRound(vat.amount || 0, 1, 2),
                                    Number(invoiceInfo?.paidTaxAmount || 0)
                                  )
                                )
                              : defaultNumberFormat(
                                  customRound(
                                    math.sub(
                                      Number(endPrice),
                                      Number(invoiceInfo?.paidAmount || 0)
                                    ),
                                    1,
                                    2
                                  )
                                ) || 0
                          ),
                          Number(currentRate || 1)
                        )
                      )
                    )}`
                  : selectedExpenseItem?.paymentAmount,
              rate:
                typeOperation === "currency"
                  ? Number(currentRate || 1)
                  : selectedExpenseItem?.rate,
            };
          }
        }
        return selectedExpenseItem;
      }
    );
    if (type === "vat") {
      setVatPayments(newExpenses); /// vat ucun yenisini yaz
    } else {
      setPayments(newExpenses);
    }
  };

  useEffect(() => {
    if (isSelected && payments.length === 0) {
      setPayments([
        {
          currency: getValues("currency"),
          cashBoxType: payments?.[0]?.cashBoxType
            ? payments?.[0]?.cashBoxType
            : undefined,
          cashboxId: payments?.[0]?.cashboxId
            ? payments?.[0]?.cashboxId
            : undefined,
          paymentAmount: `${customRound(
            math.sub(
              parseFloat(endPrice || 0)?.toFixed(2),
              Number(invoiceInfo?.paidAmount || 0)
            ),
            1,
            2
          )}`,
        },
      ]);
    }
  }, [isSelected]);

  useEffect(() => {
    if (isVatSelected && vatPayments.length === 0) {
      setVatPayments([
        {
          currency: getValues("currency"),
          cashBoxType: vatPayments?.[0]?.cashBoxType
            ? vatPayments?.[0]?.cashBoxType
            : undefined,
          cashboxId: vatPayments?.[0]?.cashboxId
            ? vatPayments?.[0]?.cashboxId
            : undefined,
          paymentAmount: `${math.sub(
            parseFloat(vat.amount || 0).toFixed(2) || 0,
            parseFloat(invoiceInfo?.paidTaxAmount || 0)
          )}`,
        },
      ]);
    }
  }, [isVatSelected]);

  useEffect(() => {
    if (
      [...(payments || []), ...(vatPayments || [])]?.filter(
        ({ cashboxId }) => cashboxId !== undefined
      )?.length > 0
    ) {
      runAccountBalance({
        cashboxIds: [
          ...new Set(
            [...(payments || []), ...(vatPayments || [])]
              ?.filter(({ cashboxId }) => cashboxId !== undefined)
              .map(({ cashboxId }) => cashboxId)
          ),
        ],
        dateTime: moment(getValues("operationDate"))?.format(
          fullDateTimeWithSecond
        ),
        limit: 1000,
      });
    }
  }, [
    payments,
    vatPayments,
    getValues("operationDate"),
    getValues("currency"),
  ]);

  useEffect(() => {
    if (
      payments?.filter(({ currency }) => currency !== undefined)?.length > 0 &&
      getValues("operationDate") &&
      getValues("currency")
    ) {
      convertMultipleCurrencyPost(
        {
          mainTenantCurrency: getValues("currency"),
          rates_ul: [],
        },
        {
          fromCurrencyId: [
            ...new Set(
              payments
                ?.filter(({ currency }) => currency !== undefined)
                .map(({ currency }) => currency)
            ),
          ],
          toCurrencyId: getValues("currency"),
          amount: 1,
          dateTime: moment(getValues("operationDate"))?.format(
            fullDateTimeWithSecond
          ),
        }
        // onSuccessCallback: ({ data }) => {
        //   setInvoicePaymentDetails({
        //     newDetails: { invoiceRates: data },
        //   });
        //   setExpenseRates(data);
        // },
      ).then((response) => setExpenseRates(response));
    }
  }, [payments, getValues("operationDate"), getValues("currency")]);

  // useEffect(() => {
  //   if (isVatSelected) {
  //     addNewRow("vat");
  //   }
  // }, [isVatSelected]);

  useEffect(() => {
    if (
      vatPayments?.filter(({ currency }) => currency !== undefined)?.length >
        0 &&
      getValues("operationDate") &&
      getValues("currency")
    ) {
      convertMultipleCurrencyPost(
        {
          mainTenantCurrency: getValues("currency"),
          rates_ul: [],
        },
        {
          fromCurrencyId: [
            ...new Set(
              vatPayments
                ?.filter(({ currency }) => currency !== undefined)
                .map(({ currency }) => currency)
            ),
          ],
          toCurrencyId: getValues("currency"),
          amount: 1,
          dateTime: moment(getValues("operationDate"))?.format(
            fullDateTimeWithSecond
          ),
        }
      ).then((response) => setVatExpenseRates(response));
    }
  }, [vatPayments, getValues("operationDate"), getValues("currency")]);

  const getCashboxDetail = (id) => {
    if (Object.values(cashbox ?? {})?.[0] === false) {
      return "???";
    } else if (cashbox[id]?.length === 0) {
      return "0.00";
    } else {
      return (
        cashbox[id]?.map(({ balance, currencyCode, tenantCurrencyId }) =>
          tenantCurrencyId ? (
            <Text
              style={{
                marginLeft: "5px",
              }}
            >
              {formatNumberToLocale(defaultNumberFormat(balance || 0))}
              {currencyCode}
            </Text>
          ) : (
            ""
          )
        ) || "0.00"
      );
    }
  };

  useEffect(() => {
    if (payments?.length === 1) {
      handlePriceChange(
        0,
        `${customRound(
          Number(
            selectedProducts.reduce(
              (totalPrice, { totalPricePerProduct }) =>
                math.add(totalPrice, Number(totalPricePerProduct || 0)),
              0
            ) || 0
          ),
          1,
          2
        )}`,
        "paymentAmount",
        10000000
      );
    }
  }, [
    Number(
      selectedProducts.reduce(
        (totalPrice, { totalPricePerProduct }) =>
          math.add(totalPrice, Number(totalPricePerProduct || 0)),
        0
      ) || 0
    ),
    getValues("currency"),
  ]);

  const handleExpenseRemove = (indexItem, payment, type) => {
    const newExpenses = payment.filter((item, index) => indexItem !== index);
    if (type === "vat") {
      setVatPayments(newExpenses);
    } else {
      setPayments(newExpenses);
    }
  };

  useEffect(() => {
    setPaymentTableData(
      payments.map(
        (
          {
            currency,
            cashBoxType,
            cashboxId,
            paymentAmount,
            amountToDelete,
            rate,
          },
          index
        ) => {
          return [
            index + 1,
            <View>
              <ProAsyncSelect
                style={{ margin: 5 }}
                data={currencies.filter(
                  (item) =>
                    !payments
                      .filter(
                        (pay) =>
                          pay.cashboxId &&
                          pay.cashboxId === payments[index].cashboxId &&
                          item.id !== currency
                      )
                      ?.map((payment) => payment.currency)
                      ?.includes(item.id)
                )}
                setData={() => {}}
                fetchData={() => {}}
                notForm
                defaultValue={currency}
                filter={{ limit: 1000, withRatesOnly: 1 }}
                handleSelectValue={(id) => {
                  handlePriceChange(index, id, "currency");
                }}
              />
            </View>,
            <View>
              <ProAsyncSelect
                data={accountTypes}
                style={{ margin: 5 }}
                setData={() => {}}
                fetchData={() => {}}
                defaultValue={cashBoxType}
                notForm
                handleSelectValue={(value) => {
                  handlePriceChange(index, value, "cashBoxType");
                }}
              />
            </View>,
            <View
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                marginRight: 25,
              }}
            >
              <ProAsyncSelect
                style={{ width: "80%", margin: 5 }}
                data={getCashboxNames(cashBoxType).filter(
                  (item) =>
                    !payments
                      .filter(
                        (pay) =>
                          pay.currency &&
                          pay.currency === payments[index].currency &&
                          item.id !== cashboxId
                      )
                      ?.map((payment) => payment.cashboxId)
                      ?.includes(item.id)
                )}
                notForm
                setData={() => {}}
                fetchData={() => {}}
                filter={{
                  applyBusinessUnitTenantPersonFilter: 1,
                }}
                handleSelectValue={(id) => {
                  handlePriceChange(index, id, "cashboxId");
                }}
                defaultValue={cashboxId}
                className={!cashboxId ? styles.inputError : {}}
              />
              <View style={{ display: "flex" }}>
                {cashboxId ? (
                  <ProTooltip
                    containerStyle={{ width: 145, height: "auto" }}
                    popover={
                      <Text>
                        Əməliyyat tarixi üzrə qalıq:
                        {getCashboxDetail(cashboxId)}
                      </Text>
                    }
                    trigger={<FontAwesome name="info-circle" size={18} />}
                  />
                ) : (
                  <FontAwesome
                    disabled={!cashboxId}
                    name="info-circle"
                    size={18}
                  />
                )}
              </View>
            </View>,
            <View>
              <TextInput
                value={paymentAmount}
                keyboardType="numeric"
                onChangeText={(event) => {
                  handlePriceChange(
                    index === 0 ? 0 : index || payments[index].id,
                    event,
                    "paymentAmount",
                    !Object.values(cashbox ?? {})?.[0] === false
                      ? Number(
                          cashbox[cashboxId]?.find(
                            ({ tenantCurrencyId }) =>
                              tenantCurrencyId === currency
                          )?.balance || 0
                        )
                      : 10000000
                  );
                }}
                style={{
                  margin: 10,
                  padding: 5,
                  borderWidth: 1,
                  borderRadius: 5,
                  borderColor: "#D0DBEA",
                }}
              />
            </View>,
            <View>
              <TextInput
                value={
                  amountToDelete
                    ? amountToDelete
                    : `${
                        math.mul(
                          Number(
                            rate && Number(rate) > 0
                              ? Number(rate)
                              : expenseRates[
                                  [
                                    ...new Set(
                                      payments
                                        .filter(
                                          ({ currency }) =>
                                            currency !== undefined
                                        )
                                        .map(({ currency }) => currency)
                                    ),
                                  ].indexOf(currency)
                                ]?.rate || 1
                          ),
                          Number(paymentAmount || 0)
                        ) || 0
                      }`
                }
                keyboardType="numeric"
                onChangeText={(event) => {
                  handlePriceChange(
                    index === 0 ? 0 : index || payments[index].id,
                    event,
                    "amountToDelete",
                    !Object.values(cashbox ?? {})?.[0] === false
                      ? Number(
                          cashbox[cashboxId]?.find(
                            ({ tenantCurrencyId }) =>
                              tenantCurrencyId === currency
                          )?.balance || 0
                        )
                      : 10000000
                  );
                }}
                style={{
                  margin: 10,
                  padding: 5,
                  borderWidth: 1,
                  borderRadius: 5,
                  borderColor: "#D0DBEA",
                }}
              />
            </View>,
            <ProButton
              label={<FontAwesome name="trash" size={18} color="red" />}
              type="transparent"
              onClick={() => {
                handleExpenseRemove(index, payments);
              }}
            />,
          ];
        }
      )
    );
  }, [payments, cashbox, expenseRates]);

  useEffect(() => {
    setVatPaymentTableData(
      vatPayments.map(
        (
          {
            currency,
            cashBoxType,
            cashboxId,
            paymentAmount,
            amountToDelete,
            rate,
          },
          index
        ) => {
          return [
            index + 1,
            <View>
              <ProAsyncSelect
                style={{ margin: 5 }}
                data={currencies.filter(
                  (item) =>
                    !payments
                      .filter(
                        (pay) =>
                          pay.cashboxId &&
                          pay.cashboxId === vatPayments[index].cashboxId &&
                          item.id !== currency
                      )
                      ?.map((payment) => payment.currency)
                      ?.includes(item.id)
                )}
                setData={() => {}}
                fetchData={() => {}}
                notForm
                defaultValue={currency}
                filter={{ limit: 1000, withRatesOnly: 1 }}
                handleSelectValue={(id) => {
                  handlePriceChange(index, id, "currency", 1000, "vat");
                }}
              />
            </View>,
            <View>
              <ProAsyncSelect
                data={accountTypes}
                style={{ margin: 5 }}
                setData={() => {}}
                fetchData={() => {}}
                defaultValue={cashBoxType}
                notForm
                handleSelectValue={(value) => {
                  handlePriceChange(index, value, "cashBoxType", 1000, "vat");
                }}
              />
            </View>,
            <View
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                marginRight: 25,
              }}
            >
              <ProAsyncSelect
                style={{ width: "80%", margin: 5 }}
                data={getCashboxNames(cashBoxType).filter(
                  (item) =>
                    !vatPayments
                      .filter(
                        (pay) =>
                          pay.currency &&
                          pay.currency === vatPayments[index].currency &&
                          item.id !== cashboxId
                      )
                      ?.map((payment) => payment.cashboxId)
                      ?.includes(item.id)
                )}
                notForm
                setData={() => {}}
                fetchData={() => {}}
                filter={{
                  applyBusinessUnitTenantPersonFilter: 1,
                }}
                handleSelectValue={(id) => {
                  handlePriceChange(index, id, "cashboxId", 1000, "vat");
                }}
                defaultValue={cashboxId}
                className={!cashboxId ? styles.inputError : {}}
              />
              <View style={{ display: "flex" }}>
                {cashboxId ? (
                  <ProTooltip
                    containerStyle={{ width: 145, height: "auto" }}
                    popover={
                      <Text>
                        Əməliyyat tarixi üzrə qalıq:
                        {getCashboxDetail(cashboxId)}
                      </Text>
                    }
                    trigger={<FontAwesome name="info-circle" size={18} />}
                  />
                ) : (
                  <FontAwesome
                    disabled={!cashboxId}
                    name="info-circle"
                    size={18}
                  />
                )}
              </View>
            </View>,
            <View>
              <TextInput
                value={paymentAmount}
                keyboardType="numeric"
                onChangeText={(event) => {
                  handlePriceChange(
                    index === 0 ? 0 : index || vatPayments[index].id,
                    event,
                    "paymentAmount",
                    10000000,
                    "vat"
                  );
                }}
                style={{
                  margin: 10,
                  padding: 5,
                  borderWidth: 1,
                  borderRadius: 5,
                  borderColor: "#D0DBEA",
                }}
              />
            </View>,
            <View>
              <TextInput
                value={
                  amountToDelete
                    ? amountToDelete
                    : `${
                        math.mul(
                          Number(
                            rate && Number(rate) > 0
                              ? Number(rate)
                              : vatExpenseRates[
                                  [
                                    ...new Set(
                                      vatPayments
                                        .filter(
                                          ({ currency }) =>
                                            currency !== undefined
                                        )
                                        .map(({ currency }) => currency)
                                    ),
                                  ].indexOf(currency)
                                ]?.rate || 1
                          ),
                          Number(paymentAmount || 0)
                        ) || 0
                      }`
                }
                keyboardType="numeric"
                onChangeText={(event) => {
                  handlePriceChange(
                    index === 0 ? 0 : index || vatPayments[index].id,
                    event,
                    "amountToDelete",
                    !Object.values(cashbox ?? {})?.[0] === false
                      ? Number(
                          cashbox[cashboxId]?.find(
                            ({ tenantCurrencyId }) =>
                              tenantCurrencyId === currency
                          )?.balance || 0
                        )
                      : 10000000,
                    "vat"
                  );
                }}
                style={{
                  margin: 10,
                  padding: 5,
                  borderWidth: 1,
                  borderRadius: 5,
                  borderColor: "#D0DBEA",
                }}
              />
            </View>,
            <ProButton
              label={<FontAwesome name="trash" size={18} color="red" />}
              type="transparent"
              onClick={() => {
                handleExpenseRemove(index, vatPayments, "vat");
              }}
            />,
          ];
        }
      )
    );
  }, [vatPayments, cashbox, vatExpenseRates]);

  const addNewRow = (vat) => {
    if (vat === "vat") {
      setVatPayments([
        ...vatPayments,
        {
          currency: undefined,
          cashBoxType: undefined,
          cashboxId: undefined,
          paymentAmount: 0,
        },
      ]);
    } else {
      setPayments([
        ...payments,
        {
          currency: undefined,
          cashBoxType: undefined,
          cashboxId: undefined,
          paymentAmount: 0,
        },
      ]);
    }
  };

  return (
    <ScrollView nestedScrollEnabled={true}>
      <View style={styles.container}>
        <View style={styles.checkboxContainer}>
          <CheckBox
            value={isSelected}
            onValueChange={setSelection}
            style={styles.checkbox}
            disabled={
              Number(endPrice ?? 0) === Number(invoiceInfo?.paidAmount ?? 0)
            }
          />
          <ProText
            variant="heading"
            style={{
              color: "black",
              fontSize: 18,
              fontWeight: 600,
              marginLeft: 10,
            }}
          >
            Əsas ödəniş
          </ProText>
        </View>
        {isSelected ? (
          <>
            <View
              style={{
                display: "flex",
                flexDirection: "row",
                gap: 10,
                alignItems: "center",
              }}
            >
              <ProText
                variant="heading"
                style={{ color: "black", fontSize: 18, fontWeight: 600 }}
              >
                Sənəd üzrə borc:{" "}
                <Text style={{ color: "red" }}>
                  {defaultNumberFormat(
                    customRound(
                      math.sub(
                        Number(endPrice),
                        Number(invoiceInfo?.paidAmount || 0)
                      ),
                      1,
                      2
                    )
                  )}
                  {currencies.find(
                    ({ id }) => id === getValues("currency")?.code
                  )}
                </Text>
              </ProText>
              <ProButton
                label="+ Hesab əlavə et"
                type="primary"
                defaultStyle={{ borderRadius: 5 }}
                onClick={() => addNewRow()}
                // loading={isLoading}
              />
            </View>
            <View style={{ maxHeight: 150 }}>
              <ScrollView nestedScrollEnabled={true}>
                <ScrollView
                  nestedScrollEnabled={true}
                  horizontal={true}
                  style={{ height: "100%" }}
                >
                  <Table borderStyle={{ borderWidth: 1, borderColor: "white" }}>
                    <Row
                      data={paymentTableHead}
                      widthArr={[50, 140, 140, 160, 120, 140, 80]}
                      style={styles.head}
                      textStyle={styles.headText}
                    />

                    {paymentTableData.map((rowData, index) => (
                      <Row
                        key={index}
                        data={rowData}
                        widthArr={[50, 140, 140, 160, 120, 140, 80]}
                        style={
                          index === paymentTableData.length - 1
                            ? { ...styles.rowSection, marginBottom: 10 }
                            : styles.rowSection
                        }
                        textStyle={styles.text}
                      />
                    ))}
                  </Table>
                </ScrollView>
              </ScrollView>
            </View>
            <View style={{ marginBottom: 10 }}>
              <View style={styles.footer}>
                <Text>Ödəniş məbləği:</Text>
                <Text>
                  {defaultNumberFormat(
                    payments
                      ?.filter(({ currency }) => currency !== undefined)
                      ?.reduce(
                        (total, current) =>
                          math.add(
                            total,
                            math.mul(
                              current.rate && Number(current.rate)
                                ? Number(current.rate)
                                : Number(
                                    expenseRates[
                                      [
                                        ...new Set(
                                          payments.map(({ currency }) =>
                                            Number(currency)
                                          )
                                        ),
                                      ].indexOf(current.currency)
                                    ]?.rate || 1
                                  ) || 0,
                              Number(current.paymentAmount || 0)
                            ) || 0
                          ),
                        0
                      ) || 0
                  )}
                  {
                    currencies.find(({ id }) => id === getValues("currency"))
                      ?.code
                  }
                </Text>
              </View>
              <View style={styles.footer}>
                <Text>Silinəcək borc:</Text>
                <Text>
                  {customRound(
                    payments
                      ?.filter(({ currency }) => currency !== undefined)
                      ?.reduce(
                        (total, current) =>
                          math.add(
                            total,
                            math.mul(
                              current.rate && Number(current.rate)
                                ? Number(current.rate)
                                : Number(
                                    expenseRates[
                                      [
                                        ...new Set(
                                          payments.map(({ currency }) =>
                                            Number(currency)
                                          )
                                        ),
                                      ].indexOf(current.currency)
                                    ]?.rate || 1
                                  ) || 0,
                              Number(current.paymentAmount || 0)
                            ) || 0
                          ),
                        0
                      ) >= Number(endPrice || 0)
                      ? defaultNumberFormat(Number(endPrice) || 0)
                      : defaultNumberFormat(
                          payments
                            .filter(({ currency }) => currency !== undefined)
                            ?.reduce(
                              (total, current) =>
                                math.add(
                                  total,
                                  math.mul(
                                    current.rate && Number(current.rate)
                                      ? Number(current.rate)
                                      : Number(
                                          expenseRates[
                                            [
                                              ...new Set(
                                                payments.map(({ currency }) =>
                                                  Number(currency)
                                                )
                                              ),
                                            ].indexOf(current.currency)
                                          ]?.rate || 1
                                        ) || 0,
                                    Number(current.paymentAmount || 0)
                                  ) || 0
                                ),
                              0
                            ) || 0
                        ),
                    1,
                    2
                  )}
                  {
                    currencies.find(({ id }) => id === getValues("currency"))
                      ?.code
                  }
                </Text>
              </View>
              <View style={styles.footer}>
                <Text>Qalıq borc:</Text>
                <Text>
                  {" "}
                  {payments
                    ?.filter(({ currency }) => currency !== undefined)
                    ?.reduce(
                      (total, current) =>
                        math.add(
                          total,
                          math.mul(
                            Number(
                              current.rate && Number(current.rate)
                                ? Number(current.rate)
                                : expenseRates[
                                    [
                                      ...new Set(
                                        payments.map(({ currency }) =>
                                          Number(currency)
                                        )
                                      ),
                                    ].indexOf(current.currency)
                                  ]?.rate || 1
                            ) || 0,
                            Number(current.paymentAmount || 0)
                          ) || 0
                        ),
                      0
                    ) >=
                  Number(
                    math.sub(
                      Number(endPrice ?? 0),
                      Number(invoiceInfo?.paidAmount || 0)
                    ) || 0
                  )
                    ? defaultNumberFormat(0)
                    : defaultNumberFormat(
                        math.sub(
                          math.sub(
                            Number(endPrice ?? 0),
                            Number(invoiceInfo?.paidAmount || 0)
                          ),
                          payments
                            ?.filter(({ currency }) => currency !== undefined)
                            .reduce(
                              (total, current) =>
                                math.add(
                                  total,
                                  math.mul(
                                    current.rate && Number(current.rate)
                                      ? Number(current.rate)
                                      : Number(
                                          expenseRates[
                                            [
                                              ...new Set(
                                                payments.map(({ currency }) =>
                                                  Number(currency)
                                                )
                                              ),
                                            ].indexOf(current.currency)
                                          ]?.rate || 1
                                        ),
                                    Number(current.paymentAmount || 0)
                                  ) || 0
                                ),
                              0
                            ) || 0
                        ) || 0
                      )}{" "}
                  {
                    currencies.find(({ id }) => id === getValues("currency"))
                      ?.code
                  }
                </Text>
              </View>
              <View style={styles.footer}>
                <Text>Avans:</Text>
                <Text>
                  {payments
                    ?.filter(({ currency }) => currency !== undefined)
                    ?.reduce(
                      (total, current) =>
                        math.add(
                          total,
                          math.mul(
                            current.rate && Number(current.rate)
                              ? Number(current.rate)
                              : Number(
                                  expenseRates[
                                    [
                                      ...new Set(
                                        payments.map(({ currency }) =>
                                          Number(currency)
                                        )
                                      ),
                                    ].indexOf(current.currency)
                                  ]?.rate || 1
                                ) || 0,
                            Number(current.paymentAmount || 0)
                          ) || 0
                        ),
                      0
                    ) >= Number(Number(endPrice) || 0)
                    ? defaultNumberFormat(
                        math.sub(
                          payments
                            ?.filter(({ currency }) => currency !== undefined)
                            .reduce(
                              (total, current) =>
                                math.add(
                                  total,
                                  math.mul(
                                    current.rate && Number(current.rate)
                                      ? Number(current.rate)
                                      : Number(
                                          expenseRates[
                                            [
                                              ...new Set(
                                                payments.map(({ currency }) =>
                                                  Number(currency)
                                                )
                                              ),
                                            ].indexOf(current.currency)
                                          ]?.rate || 1
                                        ),
                                    Number(current.paymentAmount || 0)
                                  ) || 0
                                ),
                              0
                            ) || 0,
                          Number(endPrice) || 0
                        ) || 0
                      )
                    : defaultNumberFormat(0)}
                  {
                    currencies.find(({ id }) => id === getValues("currency"))
                      ?.code
                  }
                </Text>
              </View>
            </View>
          </>
        ) : null}
        <View style={styles.checkboxContainer}>
          <CheckBox
            value={isVatSelected}
            onValueChange={setVatSelection}
            style={styles.checkbox}
            disabled={!useVat}
          />
          <ProText
            variant="heading"
            style={{
              color: "black",
              fontSize: 18,
              fontWeight: 600,
              marginLeft: 10,
            }}
          >
            Vergi ödənişi
          </ProText>
        </View>
        {isVatSelected ? (
          <>
            <View
              style={{
                display: "flex",
                flexDirection: "row",
                gap: 10,
                alignItems: "center",
              }}
            >
              <ProText
                variant="heading"
                style={{ color: "black", fontSize: 18, fontWeight: 600 }}
              >
                ƏDV üzrə borc:{" "}
                <Text style={{ color: "red" }}>
                  {defaultNumberFormat(
                    math.sub(
                      customRound(vat.amount || 0, 1, 2),
                      Number(invoiceInfo?.paidTaxAmount || 0)
                    )
                  )}
                  {currencies.find(
                    ({ id }) => id === getValues("currency")?.code
                  )}
                </Text>
              </ProText>
              <ProButton
                label="+ Hesab əlavə et"
                type="primary"
                defaultStyle={{ borderRadius: 5 }}
                onClick={() => addNewRow("vat")}
                // loading={isLoading}
              />
            </View>
            <View style={{ maxHeight: 150 }}>
              <ScrollView nestedScrollEnabled={true}>
                <ScrollView
                  nestedScrollEnabled={true}
                  horizontal={true}
                  style={{ height: "100%" }}
                >
                  <Table borderStyle={{ borderWidth: 1, borderColor: "white" }}>
                    <Row
                      data={paymentTableHead}
                      widthArr={[50, 140, 140, 160, 120, 140, 80]}
                      style={styles.head}
                      textStyle={styles.headText}
                    />
                    {vatPaymentTableData.map((rowData, index) => (
                      <Row
                        key={index}
                        data={rowData}
                        widthArr={[50, 140, 140, 160, 120, 140, 80]}
                        style={styles.rowSection}
                        textStyle={styles.text}
                      />
                    ))}
                  </Table>
                </ScrollView>
              </ScrollView>
            </View>
            <View style={{ marginBottom: 10 }}>
              <View style={styles.footer}>
                <Text>Ödəniş məbləği:</Text>
                <Text>
                  {defaultNumberFormat(
                    vatPayments
                      ?.filter(({ currency }) => currency !== undefined)
                      .reduce(
                        (total, current) =>
                          math.add(
                            total,
                            math.mul(
                              current.rate && Number(current.rate)
                                ? Number(current.rate)
                                : Number(
                                    vatExpenseRates[
                                      [
                                        ...new Set(
                                          vatPayments.map(({ currency }) =>
                                            Number(currency)
                                          )
                                        ),
                                      ].indexOf(current.currency)
                                    ]?.rate || 1
                                  ),
                              Number(current.paymentAmount || 0)
                            ) || 0
                          ),
                        0
                      ) || 0
                  )}{" "}
                  {
                    currencies.find(({ id }) => id === getValues("currency"))
                      ?.code
                  }
                </Text>
              </View>
              <View style={styles.footer}>
                <Text>Silinəcək borc:</Text>
                <Text>
                  {vatPayments
                    ?.filter(({ currency }) => currency !== undefined)
                    .reduce(
                      (total, current) =>
                        math.add(
                          total,
                          math.mul(
                            Number(
                              current.rate && Number(current.rate)
                                ? Number(current.rate)
                                : vatExpenseRates[
                                    [
                                      ...new Set(
                                        vatPayments.map(({ currency }) =>
                                          Number(currency)
                                        )
                                      ),
                                    ].indexOf(current.currency)
                                  ]?.rate || 1
                            ),
                            Number(current.paymentAmount || 0)
                          ) || 0
                        ),
                      0
                    ) >= customRound(vat.amount || 0, 1, 2)
                    ? defaultNumberFormat(
                        customRound(vat.amount || 0, 1, 2) || 0
                      )
                    : defaultNumberFormat(
                        vatPayments
                          .filter(({ currency }) => currency !== undefined)
                          .reduce(
                            (total, current) =>
                              math.add(
                                total,
                                math.mul(
                                  current.rate && Number(current.rate)
                                    ? Number(current.rate)
                                    : Number(
                                        vatExpenseRates[
                                          [
                                            ...new Set(
                                              vatPayments.map(({ currency }) =>
                                                Number(currency)
                                              )
                                            ),
                                          ].indexOf(current.currency)
                                        ]?.rate || 1
                                      ),
                                  Number(current.paymentAmount || 0)
                                ) || 0
                              ),
                            0
                          ) || 0
                      )}{" "}
                  {
                    currencies.find(({ id }) => id === getValues("currency"))
                      ?.code
                  }
                </Text>
              </View>
              <View style={styles.footer}>
                <Text>Qalıq borc:</Text>
                <Text>
                  {vatPayments
                    ?.filter(({ currency }) => currency !== undefined)
                    .reduce(
                      (total, current) =>
                        math.add(
                          total,
                          math.mul(
                            Number(
                              current.rate && Number(current.rate)
                                ? Number(current.rate)
                                : vatExpenseRates[
                                    [
                                      ...new Set(
                                        vatPayments.map(({ currency }) =>
                                          Number(currency)
                                        )
                                      ),
                                    ].indexOf(current.currency)
                                  ]?.rate || 1
                            ),
                            Number(current.paymentAmount || 0)
                          ) || 0
                        ),
                      0
                    ) >=
                  math.sub(
                    customRound(vat.amount || 0, 1, 2),
                    Number(invoiceInfo?.paidTaxAmount || 0)
                  )
                    ? defaultNumberFormat(0)
                    : defaultNumberFormat(
                        math.sub(
                          math.sub(
                            customRound(vat.amount || 0, 1, 2),
                            Number(invoiceInfo?.paidTaxAmount || 0)
                          ),
                          vatPayments
                            ?.filter(({ currency }) => currency !== undefined)
                            .reduce(
                              (total, current) =>
                                math.add(
                                  total,
                                  math.mul(
                                    current.rate && Number(current.rate)
                                      ? Number(current.rate)
                                      : Number(
                                          vatExpenseRates[
                                            [
                                              ...new Set(
                                                vatPayments.map(
                                                  ({ currency }) =>
                                                    Number(currency)
                                                )
                                              ),
                                            ].indexOf(current.currency)
                                          ]?.rate || 1
                                        ),
                                    Number(current.paymentAmount || 0)
                                  ) || 0
                                ),
                              0
                            )
                        ) || 0
                      ) || 0}{" "}
                  {
                    currencies.find(({ id }) => id === getValues("currency"))
                      ?.code
                  }
                </Text>
              </View>
              <View style={styles.footer}>
                <Text>Avans:</Text>
                <Text>
                  {vatPayments
                    ?.filter(({ currency }) => currency !== undefined)
                    .reduce(
                      (total, current) =>
                        math.add(
                          total,
                          math.mul(
                            current.rate && Number(current.rate)
                              ? Number(current.rate)
                              : Number(
                                  vatExpenseRates[
                                    [
                                      ...new Set(
                                        vatPayments.map(({ currency }) =>
                                          Number(currency)
                                        )
                                      ),
                                    ].indexOf(current.currency)
                                  ]?.rate || 1
                                ),
                            Number(current.paymentAmount || 0)
                          ) || 0
                        ),
                      0
                    ) >= customRound(vat.amount || 0, 1, 2)
                    ? defaultNumberFormat(
                        math.sub(
                          vatPayments
                            ?.filter(({ currency }) => currency !== undefined)
                            .reduce(
                              (total, current) =>
                                math.add(
                                  total,
                                  math.mul(
                                    current.rate && Number(current.rate)
                                      ? Number(current.rate)
                                      : Number(
                                          vatExpenseRates[
                                            [
                                              ...new Set(
                                                vatPayments.map(
                                                  ({ currency }) =>
                                                    Number(currency)
                                                )
                                              ),
                                            ].indexOf(current.currency)
                                          ]?.rate || 1
                                        ),
                                    Number(current.paymentAmount || 0)
                                  ) || 0
                                ),
                              0
                            ),
                          customRound(vat.amount || 0, 1, 2) || 0
                        )
                      ) || 0
                    : defaultNumberFormat(0)}{" "}
                  {
                    currencies.find(({ id }) => id === getValues("currency"))
                      ?.code
                  }
                </Text>
              </View>
            </View>
          </>
        ) : null}
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

const Purchase = ({ navigation, route }) => {
  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    getValues,
    setValue,
  } = useForm({
    defaultValues: {
      operationDate: new Date(),
    },
  });
  const { id, invoiceInfo, businessUnit } = route.params || {};

  const insets = useSafeAreaInsets();
  const layout = useWindowDimensions();
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [vatPayments, setVatPayments] = useState([]);
  const [endPrice, setEndPrice] = useState(0);
  const [currencies, setCurrencies] = useState([]);
  const [index, setIndex] = React.useState(0);
  const [isSelected, setSelection] = useState(false);
  const [isVatSelected, setVatSelection] = useState(false);
  const [payments, setPayments] = useState([]);
  const [expenseRates, setExpenseRates] = useState([]);
  const [vatExpenseRates, setVatExpenseRates] = useState([]);
  const [errorIndex, setErrorIndex] = useState(undefined);
  const [useVat, setUseVat] = useState(true);
  const [loading, setLoading] = useState(false);
  const [vatSettingState, setVatSettingsState] = useState(null);
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
  const [routes, setRoutes] = useState([
    { key: "first", title: "Ümumi məlumat" },
    { key: "second", title: "Qaimə" },
    { key: "third", title: "Ödəniş" },
  ]);

  const { profile, BUSINESS_TKN_UNIT, userSettings, permissionsByKeyValue } =
    useContext(TenantContext);

  const { purchase_discount, purchase_invoice } = permissionsByKeyValue;

  const updateEditInvoice = (selectedContract, isDraft) => {
    const {
      supplierId,
      salesmanId,
      counterpartyCategoryIds,
      operationDate,
      currencyId,
      description,
      contractId,
      agentId,
      stockToId,
      stockFromId,
      endPrice,
      invoiceProducts,
      currencyCode,
      amount,
      discountAmount,
      discountPercentage,
      tax: tax,
      taxPercentage,
      taxCurrencyCode,
    } = invoiceInfo;
    const { content } = invoiceProducts;
    const selectedProducts = {};
    const selectedProductIds = content.map(({ productId }) => productId);
    if (stockToId || stockFromId) {
      fetchTransferProductsFromCatalog({
        apiEnd: stockToId || stockFromId,
        filter: {
          invoiceId: id,
          product: selectedProductIds,
          datetime: operationDate,
          businessUnitIds: id
            ? invoiceInfo?.businessUnitId === null
              ? [0]
              : [invoiceInfo?.businessUnitId]
            : BUSINESS_TKN_UNIT
            ? [BUSINESS_TKN_UNIT]
            : undefined,
        },
      }).then((totalQuantities) => {
        content.forEach(
          (
            {
              productId,
              productName,
              quantity,
              pricePerUnit,
              isServiceType,
              unitOfMeasurementName,
              catalogId,
              unitOfMeasurementId,
              rootCatalogName,
              catalogName,
              quantityInStock,
              originalQuantity,
              coefficient,
              unitOfMeasurements,
              product_code,
              serialNumber,
              discountAmount,
              discountPercentage,
              endPricePerUnit,
              total,
              barcode,
              usedQuantity,
              bronQuantityInStock,
              salesDraftQuantityInStock,
              brandName,
              lifetime,
              lifeStartDate,
              roadTax,
              isRoadTaxActive,
              uniqueKey,
              attachedInvoiceProductId,
              draftRootInvoiceProductId,
              isWithoutSerialNumber,
              taxAmount,
              explanation,
              totalTaxAmount,
              isVatFree,
              description,
              totalEndPrice,
            },
            index
          ) => {
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
                barcode,
                totalPricePerProduct: math.add(
                  Number(total || 0),
                  selectedProducts[uniqueKey]?.totalPricePerProduct
                ),
                totalPricePerProductBack: math.add(
                  parseFloat(total || 0),
                  selectedProducts[uniqueKey]?.totalPricePerProductBack
                ),
                totalTaxAmount: math.add(
                  Number(totalTaxAmount || 0),
                  selectedProducts[uniqueKey]?.totalTaxAmount
                ),
                totalEndPricePerProduct: math.add(
                  Number(totalEndPrice || 0),
                  selectedProducts[uniqueKey]?.totalEndPricePerProduct
                ),
                totalRoadTaxAmount: math.add(
                  selectedProducts[uniqueKey]?.totalRoadTaxAmount,
                  math.mul(
                    Number(roadTax || 0),
                    Number(
                      math.div(
                        Number(roundToDown(Number(quantity), 4)),
                        Number(coefficient || 1)
                      ) || 0
                    )
                  )
                ),
                invoiceProducts: updatedInvoiceProducts,
                unitOfMeasurementID: unitOfMeasurementId,
                customCoefficient: coefficient,
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

                usedQuantity: roundToDown(
                  math.add(
                    Number(usedQuantity || 0),
                    Number(
                      selectedProducts[`${productId + index}`]?.usedQuantity ||
                        0
                    )
                  ),
                  4
                ),

                usedSerialNumber:
                  usedQuantity > 0 && serialNumber
                    ? [
                        ...selectedProducts[uniqueKey].usedSerialNumber,
                        serialNumber,
                      ]
                    : selectedProducts[uniqueKey].usedSerialNumber,
              };
            } else {
              const productDetails = totalQuantities?.find(
                (product) => product.id === productId
              );
              const taxAmountWithPrice = math.add(
                parseFloat(endPricePerUnit || 0),
                parseFloat(taxAmount || 0)
              );
              const totalTaxAmountWithPrice = math.mul(
                parseFloat(taxAmountWithPrice || 0),
                parseFloat(
                  math.div(
                    Number(roundToDown(Number(quantity), 4)),
                    Number(coefficient || 1)
                  ) || 0
                ) || 0
              );
              selectedProducts[uniqueKey] = {
                uniqueKey,
                rowOrder: index,
                productUniqueId: uniqueKey,
                id: productId,
                name: productName,
                unitOfMeasurementID: unitOfMeasurementId,
                customCoefficient: coefficient,
                barcode: barcode ?? undefined,
                unitOfMeasurementName,
                totalQuantity: Number(productDetails?.totalQuantity),
                quantity:
                  Number(quantityInStock || 0) ??
                  Number(productDetails?.quantity || 0),
                serialNumbers: serialNumber ? [serialNumber] : undefined,
                invoiceQuantity: roundToDown(Number(originalQuantity), 4),
                invoicePrice: BigNumber(pricePerUnit)?.toString(),
                mainInvoicePrice: Number(pricePerUnit || 0),
                discountPercentage: Number(discountPercentage || 0).toFixed(4),
                discountAmount: parseFloat(discountAmount || 0),
                invoicePriceBack: pricePerUnit || 0,
                discountAmountForBack: discountAmount || 0,
                discountedPrice: math.sub(
                  Number(pricePerUnit || 0),
                  Number(discountAmount || 0)
                ),
                isRoadTaxActive,
                originalRoadTaxAmount: roadTax,
                roadTaxAmount: defaultNumberFormat(roadTax || 0),
                totalRoadTaxAmount: defaultNumberFormat(
                  math.mul(
                    Number(roadTax || 0),
                    Number(
                      math.div(
                        Number(roundToDown(Number(quantity), 4)),
                        Number(coefficient || 1)
                      ) || 0
                    )
                  ) || 0
                ),
                totalPricePerProduct: total || 0,
                totalPricePerProductBack: BigNumber(total || 0)?.toString(),
                totalEndPricePerProduct: parseFloat(totalEndPrice || 0),
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

                invoiceProducts: [
                  {
                    invoice_product_id: isDraft
                      ? draftRootInvoiceProductId
                      : attachedInvoiceProductId,
                    invoiceQuantity: Number(
                      `${math.div(
                        Number(roundToDown(Number(quantity), 4)),
                        Number(coefficient || 1)
                      )}`.slice(0, 6)
                    ),
                    usedQuantity: roundToDown(Number(usedQuantity), 4),
                  },
                ],

                usedQuantity: roundToDown(Number(usedQuantity), 4),
                usedSerialNumber:
                  Number(usedQuantity) > 0
                    ? serialNumber
                      ? [serialNumber]
                      : []
                    : [],
                content: content?.filter(
                  (item) => item.productId === productId
                ),
                productCode: product_code,
                brandName,
                lifetime,
                lifeStartDate,
                catalog: {
                  id: catalogId,
                  name: catalogName,
                  rootName: rootCatalogName,
                  isWithoutSerialNumber: !serialNumber,
                  isServiceType,
                },
                bronQuantityInStock,
                salesDraftQuantityInStock,
                taxAmount: Number(taxAmount ?? 0),
                originalTaxAmount: taxAmount,
                isVatFree,
                totalTaxAmount: Number(totalTaxAmount)?.toFixed(2),
                taxAmountWithPrice: taxAmountWithPrice?.toFixed(2),
                totalTaxAmountWithPrice: totalTaxAmountWithPrice?.toFixed(2),
                explanation,
                description,
              };
            }
          }
        );

        setSelectedProducts(
          Object.values(selectedProducts || {}).sort(
            (a, b) => a?.rowOrder - b?.rowOrder
          )
        );
        setDiscount({
          percentage: discountAmount ? `${discountPercentage}` : null,
          amount: `${discountAmount}` || undefined,
        });
        // setVat({
        //   amount: roundTo(Number(tax), 2) || undefined,
        //   percentage: defaultNumberFormat(
        //     roundTo(Number(taxPercentage || 0), 2)
        //   ),
        // });
      });
    } else {
      content.forEach(
        (
          {
            productId,
            productName,
            quantity,
            pricePerUnit,
            isServiceType,
            unitOfMeasurementName,
            catalogId,
            unitOfMeasurementId,
            rootCatalogName,
            catalogName,
            quantityInStock,
            originalQuantity,
            coefficient,
            unitOfMeasurements,
            product_code,
            serialNumber,
            discountAmount,
            endPricePerUnit,
            total,
            barcode,
            discountPercentage,
            totalEndPrice,
            usedQuantity,
            bronQuantityInStock,
            salesDraftQuantityInStock,
            brandName,
            lifetime,
            lifeStartDate,
            roadTax,
            isRoadTaxActive,
            uniqueKey,
            isWithoutSerialNumber,
            taxAmount,
            explanation,
            totalTaxAmount,
            isVatFree,
            weightPerUnit,
            volumePerUnit,
            description,
          },
          index
        ) => {
          if (selectedProducts[uniqueKey]) {
            selectedProducts[uniqueKey] = {
              ...selectedProducts[uniqueKey],
              serialNumbers: serialNumber
                ? [...selectedProducts[uniqueKey].serialNumbers, serialNumber]
                : undefined,
              invoiceQuantity: math.add(
                roundToDown(originalQuantity),
                selectedProducts[uniqueKey].invoiceQuantity
              ),
              barcode,
              weightPerUnit,
              volumePerUnit,
              totalPricePerProduct: defaultNumberFormat(total || 0),
              totalPricePerProductBack: math.add(
                parseFloat(total || 0),
                selectedProducts[uniqueKey]?.totalPricePerProductBack
              ),
              totalRoadTaxAmount: defaultNumberFormat(
                math.mul(
                  Number(roadTax || 0),
                  Number(
                    math.div(
                      Number(roundToDown(quantity)),
                      Number(coefficient || 1)
                    ) || 0
                  )
                ) || 0
              ),
              roadTaxAmount: defaultNumberFormat(roadTax || 0),
              totalEndPricePerProduct: math.add(
                defaultNumberFormat(totalEndPrice || 0),
                Number(selectedProducts[uniqueKey].totalEndPricePerProduct)
              ),
              unitOfMeasurementID: unitOfMeasurementId,
              customCoefficient: coefficient,
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

              usedQuantity: roundToDown(
                math.add(
                  Number(usedQuantity || 0),
                  Number(
                    selectedProducts[`${productId + index}`]?.usedQuantity || 0
                  )
                )
              ),

              usedSerialNumber:
                usedQuantity > 0 && serialNumber
                  ? [
                      ...selectedProducts[uniqueKey].usedSerialNumber,
                      serialNumber,
                    ]
                  : selectedProducts[uniqueKey].usedSerialNumber,
            };
          } else {
            const taxAmountWithPrice = math.add(
              parseFloat(endPricePerUnit || 0),
              parseFloat(taxAmount || 0)
            );
            const totalTaxAmountWithPrice = math.mul(
              parseFloat(taxAmountWithPrice || 0),
              parseFloat(
                math.div(
                  Number(roundToDown(quantity)),
                  Number(coefficient || 1)
                ) || 0
              ) || 0
            );
            selectedProducts[uniqueKey] = {
              uniqueKey,
              rowOrder: index,
              productUniqueId: uniqueKey,
              id: productId,
              name: productName,
              unitOfMeasurementID: unitOfMeasurementId,
              customCoefficient: coefficient,
              barcode: barcode ?? undefined,
              unitOfMeasurementName,
              quantity: Number(quantityInStock || 0),
              serialNumbers: serialNumber ? [serialNumber] : undefined,
              invoiceQuantity: roundToDown(originalQuantity),
              invoicePrice: Number(pricePerUnit ?? 0),
              mainInvoicePrice: Number(pricePerUnit || 0),
              discountPercentage: Number(discountPercentage || 0).toFixed(4),
              discountAmount: defaultNumberFormat(discountAmount || 0),
              discountAmountForBack: discountAmount,
              discountedPrice: endPricePerUnit,
              totalPricePerProduct: defaultNumberFormat(total || 0),
              isRoadTaxActive,
              originalRoadTaxAmount: roadTax,
              roadTaxAmount: defaultNumberFormat(roadTax || 0),
              totalRoadTaxAmount: defaultNumberFormat(
                math.mul(
                  Number(roadTax || 0),
                  Number(
                    math.div(
                      Number(roundToDown(quantity)),
                      Number(coefficient || 1)
                    ) || 0
                  )
                ) || 0
              ),
              totalPricePerProductBack: BigNumber(total || 0)?.toString(),
              totalEndPricePerProduct: defaultNumberFormat(totalEndPrice || 0),
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

              usedQuantity: roundToDown(usedQuantity),
              usedSerialNumber:
                Number(usedQuantity) > 0
                  ? serialNumber
                    ? [serialNumber]
                    : []
                  : [],
              content: content?.filter((item) => item.productId === productId),
              productCode: product_code,
              brandName,
              lifetime,
              lifeStartDate,
              catalog: {
                id: catalogId,
                name: catalogName,
                rootName: rootCatalogName,
                isWithoutSerialNumber: !serialNumber,
                isServiceType,
              },
              bronQuantityInStock,
              salesDraftQuantityInStock,
              explanation,
              description,
              taxAmount: Number(taxAmount ?? 0),
              originalTaxAmount: taxAmount,
              isVatFree,
              totalTaxAmount: Number(totalTaxAmount)?.toFixed(2),
              taxAmountWithPrice: taxAmountWithPrice?.toFixed(2),
              totalTaxAmountWithPrice: totalTaxAmountWithPrice?.toFixed(2),
              weightPerUnit,
              volumePerUnit,
            };
          }
        }
      );

      setSelectedProducts(
        Object.values(selectedProducts || {}).sort(
          (a, b) => a?.rowOrder - b?.rowOrder
        )
      );
      setDiscount({
        percentage: `${roundTo(
          math.div(math.mul(Number(discountAmount) || 0, 100), amount),
          4
        )}`,
        amount: `${discountAmount}` || undefined,
      });
      // setVat({
      //   amount: roundTo(Number(tax), 2) || undefined,
      //   percentage: defaultNumberFormat(roundTo(Number(taxPercentage || 0), 2)),
      // });
    }

    setEditDate(moment(operationDate, fullDateTimeWithSecond).toDate());

    setValue("operationDate", moment(operationDate, fullDateTimeWithSecond));
    setValue("counterparty", supplierId || undefined);
    setValue("saleManager", salesmanId || undefined);
    setValue("contract", contractId || undefined);
    setValue("currency", currencyId || undefined);
    setValue("agent", agentId || undefined);
    setValue("stockTo", stockToId || stockFromId || undefined);
  };
  useEffect(() => {
    if (invoiceInfo) {
      if (
        Number(endPrice) === Number(invoiceInfo?.paidAmount) &&
        Number(vat.amount) === Number(invoiceInfo?.paidTaxAmount)
      ) {
        setRoutes([
          { key: "first", title: "Ümumi məlumat" },
          { key: "second", title: "Qaimə" },
        ]);
      }
    }
  }, [invoiceInfo, endPrice, vat]);

  useEffect(() => {
    if (invoiceInfo) {
      const { contractId, invoiceType } = invoiceInfo;
      // if (invoiceType === 8) {
      //     setIsDraft(true);
      // }
      if (contractId) {
        const filters = {
          limit: 10,
          page: 1,
          ids: [contractId],
          invoiceId: invoiceInfo?.id,
        };
        getContracts({ filter: filters }).then((data) => {
          updateEditInvoice(data?.[0]);
        });
      } else if (!contractId) {
        updateEditInvoice(undefined);
      }
    }
  }, [invoiceInfo]);

  useEffect(() => {
    fetchVatSettings().then((res) => {
      const modifiedData = [
        {
          ...res?.commonSettings,
          businessUnitName: res?.commonSettings?.businessUnits[0]?.name,
          businessUnitId: res?.commonSettings?.businessUnits[0]?.id,
          businessUnits: res?.commonSettings?.businessUnits?.filter(
            (businessUnit) => businessUnit?.id
          ),
        },
        ...res?.specificSettings,
      ];
      if (modifiedData?.length > 0) {
        const filteredUnitByVatsettings =
          modifiedData?.find(
            (unit) =>
              (unit?.businessUnitId ?? 0) === Number(BUSINESS_TKN_UNIT || 0)
          ) || modifiedData[0];
        setVatSettingsState(filteredUnitByVatsettings);
      }
    });
    fetchStatusOperations({}).then((data) => {
      setStatusData(data.filter((item) => item.operationId === 1));
      setStatusesLoading(false);
    });
    return () => {
      clearBusinessUnit();
    };
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
    return selectedProducts?.map(
      (
        {
          invoicePrice,
          id,
          invoiceQuantity,
          unitOfMeasurementID,
          customCoefficient,
          discountAmountForBack,
          invoicePriceBack,
          serialNumbers,
          lifetime,
          lifeStartDate,
          roadTaxAmount,
          uniqueKey,
          explanation,
          originalTaxAmount,
        },
        index
      ) => {
        const totalPrice = Number(
          selectedProducts.reduce(
            (totalPrice, { totalPricePerProduct }) =>
              math.add(totalPrice, Number(totalPricePerProduct || 0)),
            0
          ) || 0
        );
        const discountPerProduct = discount.amount
          ? math.div(
              math.mul(
                Number(invoicePrice),
                math.div(
                  math.mul(Number(discount.amount), 100),
                  Number(totalPrice || 0)
                )
              ),
              100
            )
          : null;
        return {
          product: id,
          cost: null,
          price: invoicePriceBack ?? Number(invoicePrice),
          lifeStartDate:
            lifeStartDate ||
            moment(getValues("operationDate"))?.format(fullDateTimeWithSecond),
          lifetime: lifetime,
          quantity: Number(invoiceQuantity),
          unitOfMeasurement: unitOfMeasurementID,
          customCoefficient: invoiceId ? customCoefficient : null,
          serialNumber_ul: serialNumbers || [],
          roadTax: roadTaxAmount,
          discountAmount: discountAmountForBack ?? discountPerProduct,
          uniqueKey,
          taxAmount: Number(originalTaxAmount ?? 0),
          explanation,
          position: index,
        };
      }
    );
  };

  // handle invoice payment
  const handleInvoicePayment = (date, invoiceId) => {
    const data = {
      invoices_ul: payments?.map(() => invoiceId),
      type: 1,
      useAdvance: false,
      description: null,
      dateOfTransaction: moment(date).format(fullDateTimeWithSecond),
      typeOfPayments_ul: payments?.map((item) => item.cashBoxType) || [
        invoicePaymentType,
      ],
      amounts_ul: payments?.map((item) => item.paymentAmount),
      currencies_ul: payments?.map((item) => item.currency),
      cashboxes_ul: payments?.map((item) => item.cashboxId) || [
        invoicePaymentAccount,
      ],
      invoiceCurrencyAmounts_ul: payments?.map((item) =>
        math.mul(
          item.rate && Number(item.rate) > 0
            ? Number(item.rate)
            : Number(
                expenseRates[
                  [
                    ...new Set(
                      payments.map(({ currency }) => Number(currency))
                    ),
                  ].indexOf(item.currency)
                ]?.rate || 1
              ),
          item.paymentAmount
        )
      ),
      isTax: false,
    };
    createOperationInvoice(data).then((res) => {
      if (isVatSelected) {
        handleVatPayment(date, invoiceId);
      } else {
        Toast.show({ type: "success", text1: "Məlumatlar yadda saxlandı." });
        navigation.push("DashboardTabs");
      }
    });
  };

  // handle vat payment
  const handleVatPayment = (date, invoiceId) => {
    const data = {
      invoices_ul: vatPayments?.map(() => invoiceId),
      type: 1,
      useAdvance: false,
      description: null,
      dateOfTransaction: moment(date).format(fullDateTimeWithSecond),
      typeOfPayments_ul: vatPayments?.map((item) => item.cashBoxType) || [
        vatPaymentType,
      ],
      amounts_ul: vatPayments?.map((item) => item.paymentAmount),
      currencies_ul: vatPayments?.map((item) => item.currency),
      cashboxes_ul: vatPayments?.map((item) => item.cashboxId) || [
        vatPaymentAccount,
      ],
      invoiceCurrencyAmounts_ul: vatPayments?.map((item) =>
        math.mul(
          item.rate && Number(item.rate) > 0
            ? Number(item.rate)
            : Number(
                vatExpenseRates[
                  [
                    ...new Set(
                      vatPayments.map(({ currency }) => Number(currency))
                    ),
                  ].indexOf(item.currency)
                ]?.rate || 1
              ),
          item.paymentAmount
        )
      ),
      isTax: true,
    };
    createOperationInvoice(data).then((res) => {
      Toast.show({ type: "success", text1: "Məlumatlar yadda saxlandı." });
      navigation.push("DashboardTabs");
    });
  };

  const validateInvoicePayment = () => {
    let totalReceived = 0;
    let advance = 0;
    let errorCashboxes = [];
    let error;

    if (isSelected) {
      const amounts = payments
        .filter(({ currency }) => currency !== undefined)
        ?.map((item) =>
          math.mul(
            Number(
              expenseRates[
                [
                  ...new Set(payments.map(({ currency }) => Number(currency))),
                ].indexOf(item.currency)
              ]?.rate || 1
            ) || 0,
            Number(item.paymentAmount || 0)
          )
        );

      for (let i = 0; i < amounts.length; i++) {
        totalReceived += amounts[i];

        if (totalReceived === endPrice) {
          advance = 0;
          errorCashboxes = amounts.slice(i + 1);
          error = i + 1;
          break;
        } else if (totalReceived > endPrice) {
          advance = totalReceived - endPrice;
          error = i + 1;
          errorCashboxes = amounts.slice(i + 1);
          break;
        }
      }

      if (payments.filter(({ cashBoxType }) => !cashBoxType).length > 0) {
        return {
          isValid: false,
          message: `Ödəniş sətirlərində qeyd olunmamış hesab növü mövcuddur.`,
        };
      }

      if (payments.filter(({ cashboxId }) => !cashboxId).length > 0) {
        return {
          isValid: false,
          message: `Ödəniş sətirlərində qeyd olunmamış hesab mövcuddur.`,
        };
      }

      if (
        payments.filter(
          ({ paymentAmount }) => !paymentAmount || Number(paymentAmount) === 0
        ).length > 0
      ) {
        return {
          isValid: false,
          message: `Ödəniş sətirlərində qeyd olunmamış ödəniş məbləği mövcuddur.`,
        };
      }

      if (errorCashboxes.length > 0) {
        setErrorIndex(error);
        return {
          isValid: false,
          message: `İşarələnən ödəniş məbləği sətirləri sənəd üzrə qalıq borc məbləğini aşdığı və artıq avans məbləği yaratdığı üçün daxil edilə bilməz.`,
        };
      }
      setErrorIndex(undefined);

      const advanceRow = payments.filter(
        ({ currency }) => currency !== undefined
      )?.[error - 1];

      return {
        isValid: true,
        advance:
          advance && advance !== 0
            ? `${roundTo(
                Number(
                  math.div(
                    Number(advance),
                    advanceRow.rate && Number(advanceRow.rate) > 0
                      ? Number(advanceRow.rate)
                      : Number(
                          expenseRates[
                            [
                              ...new Set(
                                payments.map(({ currency }) => Number(currency))
                              ),
                            ].indexOf(advanceRow.currency)
                          ]?.rate || 1
                        )
                  )
                ),
                2
              )} ${
                currencies?.find(({ id }) => id === advanceRow.currency)?.code
              }`
            : false,
      };
    }
    return {
      isValid: true,
      advance: 0,
    };
  };
  const validateVatPayment = () => {
    let totalReceived = 0;
    let advance = 0;
    let errorCashboxes = [];
    let error;

    const amounts = vatPayments
      .filter(({ currency }) => currency !== undefined)
      ?.map((item) =>
        math.mul(
          Number(
            vatExpenseRates[
              [
                ...new Set(vatPayments.map(({ currency }) => Number(currency))),
              ].indexOf(item.currency)
            ]?.rate || 1
          ) || 0,
          Number(item.paymentAmount || 0)
        )
      );

    for (let i = 0; i < amounts.length; i++) {
      totalReceived += amounts[i];

      if (totalReceived === customRound(vat.amount || 0, 1, 2)) {
        advance = 0;
        errorCashboxes = amounts.slice(i + 1);
        error = i + 1;
        break;
      } else if (totalReceived > customRound(vat.amount || 0, 1, 2)) {
        advance = totalReceived - customRound(vat.amount || 0, 1, 2);
        error = i + 1;
        errorCashboxes = amounts.slice(i + 1);
        break;
      }
    }

    if (vatPayments.filter(({ cashBoxType }) => !cashBoxType).length > 0) {
      return {
        isValid: false,
        message: `Vergi ödənişi sətirlərində qeyd olunmamış hesab növü mövcuddur.`,
      };
    }

    if (vatPayments.filter(({ cashboxId }) => !cashboxId).length > 0) {
      return {
        isValid: false,
        message: `Vergi ödənişi sətirlərində qeyd olunmamış hesab mövcuddur.`,
      };
    }

    if (
      vatPayments.filter(
        ({ paymentAmount }) => !paymentAmount || Number(paymentAmount) === 0
      ).length > 0
    ) {
      return {
        isValid: false,
        message: `Vergi ödənişi sətirlərində qeyd olunmamış ödəniş məbləği mövcuddur.`,
      };
    }

    if (errorCashboxes.length > 0) {
      setErrorIndex(error);
      return {
        isValid: false,
        message: `İşarələnən ödəniş məbləği sətirləri sənəd üzrə qalıq borc məbləğini aşdığı və artıq avans məbləği yaratdığı üçün daxil edilə bilməz.`,
      };
    }
    setErrorIndex(undefined);

    const advanceRow = vatPayments.filter(
      ({ currency }) => currency !== undefined
    )?.[error - 1];

    return {
      isValid: true,
      advance:
        advance && advance !== 0
          ? `${roundTo(
              Number(
                math.div(
                  Number(advance),
                  advanceRow.rate && Number(advanceRow.rate) > 0
                    ? Number(advanceRow.rate)
                    : Number(
                        vatExpenseRates[
                          [
                            ...new Set(
                              vatPayments.map(({ currency }) =>
                                Number(currency)
                              )
                            ),
                          ].indexOf(advanceRow.currency)
                        ]?.rate || 1
                      )
                )
              ),
              2
            )} ${
              currencies?.find(({ id }) => id === advanceRow.currency)?.code
            }`
          : false,
    };
  };

  const validatePaymentAmounts = () => {
    const { message: invoiceErrorMessage, advance } = validateInvoicePayment();

    if (isVatSelected) {
      const { message: vatErrorMessage, advance: vatAdvance } =
        validateVatPayment();

      if (!invoiceErrorMessage && !vatErrorMessage) {
        return { valid: true, advance, vatAdvance };
      }

      if (invoiceErrorMessage) {
        Toast.show({ type: "error", text1: invoiceErrorMessage });
      }
      if (vatErrorMessage) {
        Toast.show({ type: "error", text1: vatErrorMessage });
        return false;
      }

      return { valid: true, advance, vatAdvance };
    }
    if (invoiceErrorMessage) {
      Toast.show({ type: "error", text1: invoiceErrorMessage });
      return false;
    }
    return { valid: true, advance };
  };

  const handleCreateInvoice = (data) => {
    setLoading(true);
    const {
      agent,
      contract,
      counterparty,
      currency,
      operationDate,
      saleManager,
      stockTo,
      status,
    } = data;

    if (id) {
      newPurchaseInvoice = {
        salesman: saleManager,
        currency,
        supplier: counterparty,
        stock: stockTo,
        status: status || null,
        counterparty: null,
        agent: agent || null,
        templateInvoice: null,
        description: null,
        operationDate: moment(operationDate).format(fullDateTimeWithSecond),
        operator: profile.id,
        taxCurrency: currency || null,
        supplierInvoiceNumber: "",
        contract: contract || null,
        tax: null,
        invoiceProducts_ul: handleSelectedProducts(selectedProducts, id, false),
      };

      editInvoice({
        id: Number(id),
        type: "purchase",
        data: newPurchaseInvoice,
      })
        .then((res) => {
          if (payments.length > 0 && isSelected) {
            handleInvoicePayment(operationDate, Number(id));
          } else if (vatPayments.length > 0 && isVatSelected) {
            handleVatPayment(operationDate, Number(id));
          } else {
            Toast.show({
              type: "success",
              text1: "Məlumatlar yadda saxlandı.",
            });
            navigation.navigate("Modul", {
              screen: "DashboardTabs",
              initial: true,
            });
          }
        })
        .catch((error) => {
          const errorData = error?.response?.data?.error;
          if (errorData?.errors?.key === "wrong_end_price") {
            Toast.show({
              type: "error",
              text1: `Son qiymət ${roundToDown(
                errorData?.errors?.paidAmount
              )} ${invoiceCurrencyCode} məbləğindən az ola bilməz.`,
            });
          }
          if (errorData?.message === "Wrong tax amount") {
            Toast.show({
              type: "error",
              text1: `ƏDV ${Number(
                invoiceInfo.paidTaxAmount || 0
              )} ${invoiceCurrencyCode} məbləğindən az ola bilməz.`,
            });
          }
          if (errorData?.messageKey === "serial_number_is_in_use") {
            if (errorData?.errors?.data?.serialNumbers?.length > 1) {
              Toast.show({
                type: "error",
                text1: `${errorData?.errors?.data?.serialNumbers?.toString()} seriya nömrələri artıq istifadə olunub.`,
              });
            }
            Toast.show({
              type: "error",
              text1: `${errorData?.errors?.data?.serialNumbers?.toString()} seriya nömrəsi artıq istifadə olunub.`,
            });
          }
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
          if (errorData?.message === "Discount error.") {
            Toast.show({
              type: "error",
              text1:
                "Sətrlər üzrə endirim təyin olunmadığı halda, ümumi endirim təyin edilə bilməz",
            });
          }
          Toast.show({
            type: "error",
            text1: errorData?.message || "Xəta baş verdi",
          });
        });
    } else {
      createInvoice({
        type: "purchase",
        data: {
          agent: agent || null,
          salesman: saleManager,
          currency: currency,
          supplier: counterparty,
          stock: stockTo,
          description: null,
          templateInvoice: null,
          operationDate: moment(operationDate).format(fullDateTimeWithSecond),
          operator: profile.id,
          taxCurrency: currency || null,
          contract: contract || null,
          tax: null,
          status: status,
          invoiceProducts_ul: handleSelectedProducts(
            selectedProducts,
            null,
            false
          ),
        },
      }).then((res) => {
        if (payments.length > 0 && isSelected) {
          handleInvoicePayment(operationDate, Number(res?.id));
        } else if (vatPayments.length > 0 && isVatSelected) {
          handleVatPayment(operationDate, Number(res?.id));
        } else {
          Toast.show({
            type: "success",
            text1: "Məlumatlar yadda saxlandı.",
          });
          navigation.push("DashboardTabs");
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
    } else if (Number(endPrice) < 0) {
      Toast.show({
        type: "error",
        text2: "Son qiymət 0.00 məbləğindən az ola bilməz.",
        topOffset: 50,
      });
    } else if (
      selectedProducts.some(
        ({ invoicePrice, invoiceQuantity }) =>
          Number(invoicePrice || 0) === 0 || Number(invoiceQuantity || 0) === 0
      )
    ) {
      Toast.show({
        type: "error",
        text2: "Qaimədə say və ya qiyməti qeyd edilməyən məhsul mövcuddur.",
        topOffset: 50,
      });
    }
    // else if (
    //   isContractSelected &&
    //   contractAmount !== 0 &&
    //   math.sub(Number(endPrice || 0), Number(contractBalance || 0)) > 0 &&
    //   !draftCheck
    // ) {
    //   errorMessage = "Müqavilə limiti aşıla bilməz.";
    //   isValid = false;
    // }
    else if (
      selectedProducts.some(({ unitOfMeasurementID }) => !unitOfMeasurementID)
    ) {
      Toast.show({
        type: "error",
        text2: "Qaimədə ölçü vahidi seçilməyən məhsul mövcuddur.",
        topOffset: 50,
      });
    } else {
      const { valid, advance, vatAdvance } = validatePaymentAmounts();

      const paymentsAreValid = isSelected || isVatSelected ? valid : true;

      if (!paymentsAreValid) {
      }
      if (advance && isSelected && payments.length > 0) {
        if (vatAdvance) {
          Toast.show({
            type: "error",
            text1:
              "Əsas və ƏDV ödənişlərinin hər ikisində avans yaratmaq mümkün deyil",
          });
        } else {
          SweetAlert.showAlertWithOptions(
            {
              title: "Diqqət!",
              subTitle: `Bu ödəniş nəticəsində ${advance} avans məbləğ formalaşacaqdır!`,
              confirmButtonTitle: "Təsdiq et",
              confirmButtonColor: "#000",
              otherButtonTitle: "İmtina",
              otherButtonColor: "#dedede",
              style: "error",
              cancellable: true,
            },
            (callback) => {
              if (callback) {
                handleCreateInvoice(data);
              }
            }
          );
        }
      } else if (vatAdvance) {
        SweetAlert.showAlertWithOptions(
          {
            title: "Diqqət!",
            subTitle: `Bu ödəniş nəticəsində ${vatAdvance} avans məbləğ formalaşacaqdır!`,
            confirmButtonTitle: "Təsdiq et",
            confirmButtonColor: "#000",
            otherButtonTitle: "İmtina",
            otherButtonColor: "#dedede",
            style: "error",
            cancellable: true,
          },
          (callback) => {
            if (callback) {
              handleCreateInvoice(data);
            }
          }
        );
      } else {
        handleCreateInvoice(data);
      }
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
            vatPayments={vatPayments}
            endPrice={endPrice}
            setEndPrice={setEndPrice}
            discount={discount}
            setDiscount={setDiscount}
            vat={vat}
            setVat={setVat}
            useVat={useVat}
            setUseVat={setUseVat}
            setPayments={setPayments}
            setVatSelection={setVatSelection}
            BUSINESS_TKN_UNIT={BUSINESS_TKN_UNIT}
            loading={loading}
            vatSettingState={vatSettingState}
            businessUnit={businessUnit}
            id={id}
            invoiceInfo={invoiceInfo}
            purchase_discount={purchase_discount}
            userSettings={userSettings}
          />
        );
      case "third":
        return (
          <ThirdRoute
            handleSubmit={handleSubmit}
            onSubmit={onSubmit}
            navigation={navigation}
            getValues={getValues}
            setValue={setValue}
            selectedProducts={selectedProducts}
            setSelectedProducts={setSelectedProducts}
            currencies={currencies}
            setCurrencies={setCurrencies}
            control={control}
            payments={payments}
            setPayments={setPayments}
            setVatPayments={setVatPayments}
            vatPayments={vatPayments}
            isSelected={isSelected}
            setSelection={setSelection}
            isVatSelected={isVatSelected}
            setVatSelection={setVatSelection}
            expenseRates={expenseRates}
            setExpenseRates={setExpenseRates}
            vatExpenseRates={vatExpenseRates}
            setVatExpenseRates={setVatExpenseRates}
            useVat={useVat}
            vat={vat}
            endPrice={endPrice}
            BUSINESS_TKN_UNIT={BUSINESS_TKN_UNIT}
            loading={loading}
            vatSettingState={vatSettingState}
            businessUnit={businessUnit}
            id={id}
            invoiceInfo={invoiceInfo}
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
  productModalView: {
    width: "90%",
    height: "90%",
    marginTop: 20,
    marginBottom: 20,
    borderRadius: 20,
    backgroundColor: "white",
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
  buttonOpen: {
    backgroundColor: "#F194FF",
  },
  buttonClose: {
    backgroundColor: "#2196F3",
  },
  buttonModal: {
    position: "absolute",
    borderRadius: 20,
    padding: 10,
    right: 0,
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
  disabledInputContainer: {
    backgroundColor: "#ececec",
  },
  prefix: {
    paddingHorizontal: 5,
    fontWeight: "bold",
    color: "black",
  },
});

export default Purchase;
