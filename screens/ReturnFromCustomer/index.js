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
import { debounce, values, find, isNil, filter, trim, reduce } from "lodash";
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
  ProFormInput,
} from "../../components";
import { useForm, Controller } from "react-hook-form";
import { Table, TableWrapper, Row, Cell } from "react-native-reanimated-table";
import ProDateTimePicker from "../../components/ProDateTimePicker";
import SweetAlert from "react-native-sweet-alert";
import {
  getCurrencies,
  getProducts,
  getCounterparties,
  getEmployees,
  getStock,
  fetchSalesPrice,
  fetchProducts,
  fetchReturnProducts,
  editInvoice,
  editNewReturnInvoice,
  createInvoice,
  fetchCashboxNames,
  fetchMultipleAccountBalance,
  convertMultipleCurrencyPost,
  createOperationInvoice,
  getContracts,
  fetchBusinessSettings,
  fetchVatSettings,
  fetchStatusOperations,
  fetchGroupedTransaction,
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
  re_percent,
  roundToUp,
} from "../../utils";
import { clearBusinessUnit } from "../../utils/storage";
import AddFromCatalog from "../../components/AddFromCatalog";
import InvoiceModalWithSN from "../../components/InvoiceModalWithSN";
import InvoiceModalWithoutSN from "../../components/InvoiceModalWithoutSN";
import Contacts from "../Contacts";

const math = require("exact-math");
const BigNumber = require("bignumber.js");

const tableData = {
  tableHead: [
    "No",
    "Məhsul adı",
    "Qiymət",
    "Say",
    "Ölçü vahidi",
    "Satılmış miqdar",
    "Bron sayı",
    "Qaimədən seç",
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
    settingsData,
    setSettingsData,
    setCashBoxIsDisabled,
  } = props;

  const [counterparties, setCounterparties] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [stock, setStock] = useState([]);
  const [settingsDataLoading, setSettingsDataLoading] = useState(false);
  const [dateIsDisabled, setDateIsDisabled] = useState(false);
  const [contractIsDisabled, setContractIsDisabled] = useState(false);
  const [counterpartyIsDisabled, setCounterpartyIsDisabled] = useState(false);
  const [currenciesIsDisabled, setCurrenciesIsDisabled] = useState(false);
  const [managerIsDisabled, setManagerIsDisabled] = useState(false);
  const [stockIsDisabled, setStockIsDisabled] = useState(false);
  const [statusIsDisabled, setStatusIsDisabled] = useState(false);
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

  const { isLoading: isLoadBusinessSettings, run: runBusinessSettings } =
    useApi({
      deferFn: fetchBusinessSettings,
      onResolve: (data) => {
        setSettingsData(data?.settings);
        setSettingsDataLoading(false);
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
    if (
      settingsData?.find((item) => item.contract !== undefined)?.contract ===
      contracts[0]?.id
    ) {
      setContractIsDisabled(
        settingsData?.find((item) => item.contract !== undefined)?.isDisable
      );
      setValue("contract", contracts[0]?.id);
    }
  }, [settingsData, contracts]);

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
    if (currencies.length > 0) {
      setValue("currency", currencies.find(({ isMain }) => isMain)?.id);
    }
  }, [currencies]);

  useEffect(() => {
    if (!settingsDataLoading) {
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
        t: moment(getValues("operationDate"))?.format(fullDateTimeWithSecond),
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

      runCounterParty({
        filter: {
          limit: 20,
          page: 1,
          categories: [1],
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
    }
  }, [moment(getValues("operationDate"))?.format(fullDateTimeWithSecond)]);

  useEffect(() => {
    if (profile.id) {
      setSettingsDataLoading(true);
      runBusinessSettings({
        id: profile.id,
        businesUnitId:
          profile?.businessUnits?.length === 1
            ? [profile?.businessUnits?.[0]?.id]
            : BUSINESS_TKN_UNIT
            ? [BUSINESS_TKN_UNIT]
            : [0],
      });
    } else {
      setSettingsData([]);
    }
  }, [profile, BUSINESS_TKN_UNIT]);

  useEffect(() => {
    if (getValues("counterparty") && !settingsDataLoading) {
      runContracts({
        filter: {
          limit: 20,
          page: 1,
          status: 1,
          directions: [2],
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
  }, [getValues("counterparty"), settingsDataLoading]);

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
                fromOperation={"sale"}
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
          <Text style={{ fontSize: 18 }}>Geri alma</Text>

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
              disabled={dateIsDisabled}
            />
            <ProAsyncSelect
              label="Valyuta"
              disabled={currenciesIsDisabled}
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
              <ProAsyncSelect
                label="Qarşı tərəf"
                disabled={counterpartyIsDisabled}
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
                  categories: [1],
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
              disabled={managerIsDisabled}
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
              combineValue
              valueName="lastName"
              required
              name="saleManager"
            />
            <ProAsyncSelect
              label="Müqavilə"
              disabled={contractIsDisabled || !getValues("counterparty")}
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
                directions: [2],
                contacts: [getValues("counterparty")],
                businessUnitIds: id
                  ? businessUnit === null
                    ? [0]
                    : [businessUnit]
                  : BUSINESS_TKN_UNIT
                  ? [BUSINESS_TKN_UNIT]
                  : undefined,
                endDateFrom: moment(getValues("operationDate"))?.format(
                  "DD-MM-YYYY"
                ),
              }}
              control={control}
              name="contract"
            />
            <ProAsyncSelect
              label="Anbar(Haraya)"
              disabled={stockIsDisabled}
              data={stock}
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
                disabled={statusIsDisabled}
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
    vatPayments,
    endPrice,
    setEndPrice,
    discount,
    setDiscount,
    vat,
    setVat,
    useVat,
    setUseVat,
    BUSINESS_TKN_UNIT,
    loading,
    vatSettingState,
    businessUnit,
    id,
    invoiceInfo,
    tableSettings,
    setVatPayments,
    checkQuantityForContact,
    setCheckQuantityForContact,
    return_from_customer_discount,
  } = props;

  const [data, setData] = useState(tableData);
  const [serialNumber, setSerialNumber] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [productsByName, setProductsByName] = useState([]);
  const [selectedExpenses, setSelectedExpenses] = useState([]);
  const [catalogModalIsVisible, setCatalogModalIsVisible] = useState(false);
  const [productsToHandle, setProductsToHandle] = useState([]);
  const [invoiceModalWithSN, setInvoiceModalWithSN] = useState(false);
  const [invoiceModalWithoutSN, setInvoiceModalWithoutSN] = useState(false);
  const [selectedRow, setSelectedRow] = useState(undefined);
  const [bronModal, setBronModal] = useState(false);
  const [productData, setProductData] = useState();
  const [autofillDiscountPrice, setAutofillDiscountPrice] = useState(false);
  const [autoFillPrice, setAutoFillPrice] = useState(true);

  const handleBron = (productId, productName) => {
    setBronModal(true);
    setProductData({
      id: productId,
      name: productName,
    });
  };

  useEffect(() => {
    if (tableSettings) {
      const settings = "SALE-RETURN-FROM-CUSTOMERS";
      if (
        tableSettings[settings]?.length > 0 &&
        tableSettings[settings] !== null
      ) {
        const parseData = JSON?.parse(tableSettings[settings]);
        const autofillDiscountPrice = parseData.find(
          (column) => column.dataIndex === "autofillDiscountPrice"
        )?.visible;
        const checkQuantityForContact = parseData.find(
          (column) => column.dataIndex === "checkQuantityForContact"
        )?.visible;
        const autofillPrice = parseData.find(
          (column) => column.dataIndex === "autofillPrices"
        )?.visible;
        setCheckQuantityForContact(
          checkQuantityForContact === undefined ? true : checkQuantityForContact
        );
        setAutofillDiscountPrice(autofillDiscountPrice);

        setAutoFillPrice(autofillPrice ?? true);
      }
    }
  }, [tableSettings, invoiceInfo]);

  const setProductPrice = (productId, newPrice) => {
    const newSelectedProducts = selectedProducts.map((selectedProduct) => {
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

    const discountPercentage = math.mul(
      math.div(parseFloat(totalDiscountAmount || 0), newtotalPrice || 1),
      100
    );
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
    if (
      re_amount.test(newPrice) &&
      newPrice <= limit &&
      Number(newPrice || 0) <= 10000000
    ) {
      setProductPrice(productId, newPrice);
    }
    if (newPrice === "") {
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
    const newSelectedProducts = selectedProducts.map((selectedProduct) => {
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
    const limit = Number(quantity) >= 0 ? Number(quantity) : 10000000;
    if (re_amount.test(newQuantity) && (newQuantity <= limit || draftMode)) {
      setProductQuantity(productId, newQuantity, transfer, totalPrice);
    }
    if (newQuantity === "") {
      setProductQuantity(productId, undefined, transfer);
    }
  };

  const setProductTotalPrice = (productId, newPrice) => {
    const newSelectedProducts = selectedProducts.map((selectedProduct) => {
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
    if (re_amount.test(newPrice) && newPrice <= limit) {
      setProductTotalPrice(productId, newPrice);
    }
    if (newPrice === "") {
      setProductTotalPrice(productId, undefined);
    }
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

  const handleTaxAmountPercentage = (productId, newPercentage) => {
    if (re_amount.test(newPercentage) && Number(newPercentage ?? 0) <= 100) {
      setTaxAmountPercentage(productId, newPercentage);
    }
    if (newPercentage === "") {
      setTaxAmountPercentage(productId, undefined);
    }
  };

  const setTaxAmountPercentage = (productId, newPercentage) => {
    const newSelectedProducts = selectedProducts.map((selectedProduct) => {
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
    if (
      re_amount.test(newPercentage) &&
      Number(newPercentage ?? 0) <= 1000000
    ) {
      setTaxAmount(productId, newPercentage);
    }
    if (newPercentage === "") {
      setTaxAmount(productId, undefined);
    }
  };

  const setTaxAmount = (productId, newPercentage, value, amount) => {
    const newSelectedProducts = selectedProducts.map((selectedProduct) => {
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
            percentage: Number(vat.percentage ?? 0) || undefined,
            amount: AMOUNT || undefined,
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
    setSelectedProducts([]);
  }, [getValues("stockTo")]);

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

      setSelectedProducts(newSelectedProducts);
      setVat({
        percentage: newVatPercentage,
        amount: newVatAmount,
      });
      setDiscount(discount);
    }
  }, [endPrice, invoiceInfo]);

  useEffect(() => {
    setData({
      ...data,
      tableData: selectedProducts.map(
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
            invoiceProducts,
            invoice_product_id,
            unitOfMeasurementId,
            coefficientRelativeToMain,
            taxAmountPercentage,
            taxAmount,
            isVatFree,
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
              label={<AntDesign name="pluscircle" size={14} />}
              type="transparent"
              disabled={
                catalog?.isServiceType ||
                !getValues("stockTo") ||
                !getValues("counterparty")
              }
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
            <View>
              <TextInput
                value={
                  totalPricePerProduct?.toString()?.split(".")[1]?.length > 2
                    ? `${roundTo(parseFloat(totalPricePerProduct) || 0, 2)}`
                    : totalPricePerProduct ?? invoicePrice
                    ? `${defaultNumberFormat(
                        math.mul(
                          Number(invoiceQuantity) || 0,
                          Number(invoicePrice) || 0
                        )
                      )}`
                    : undefined
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

  const setProductDiscountPercentage = (newPercentage, isManual) => {
    const newSelectedProducts = selectedProducts.map((selectedProduct) => {
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
    if (
      (re_amount.test(newPercentage) || skipRegex) &&
      newPercentage <= limit
    ) {
      setProductDiscountPercentage(newPercentage, isManual);
    }
    if (newPercentage === "") {
      setProductDiscountPercentage(undefined, isManual);
    }
  };

  const handleDiscountChange = (
    value,
    type,
    addition = null,
    isManual = false
  ) => {
    const totalPrice = Number(
      selectedProducts.reduce(
        (totalPrice, { totalPricePerProduct }) =>
          math.add(totalPrice, Number(totalPricePerProduct || 0)),
        0
      ) || 0
    );
    const re = /^[0-9]{1,9}\.?[0-9]{0,2}$/;
    if (value === "") {
      handleDiscountPercentage(0);
      setDiscount({
        percentage: null,
        amount: null,
      });
    }
    if (Number(value) === 100) {
      setVat({
        percentage: undefined,
        amount: undefined,
      });
      setUseVat(false);
    }
    if (type === "percentage" && re_percent.test(value) && value <= 100) {
      const AMOUNT = roundTo(
        math.div(math.mul(Number(value), Number(totalPrice || 0)), 100),
        2
      );
      setDiscount({
        percentage: `${value}` || undefined,
        amount: `${AMOUNT}` || undefined,
      });
    }
    if (
      type === "amount" &&
      re.test(value) &&
      Number(value) <= Number(totalPrice)
    ) {
      const PERCENTAGE = math.div(
        math.mul(Number(value || 0), 100),
        Number(totalPrice || 1)
      );

      handleDiscountPercentage(PERCENTAGE ?? null, false, 100, true);
      setDiscount({
        percentage: `${roundTo(PERCENTAGE, 4)}` || undefined,
        amount: `${value}` || undefined,
      });
    }
    if (type === "percentage" && value <= 100) {
      if (!addition) {
        handleDiscountPercentage(value ?? "", isManual);
        return;
      }

      handleDiscountPercentage(value ?? "");
    }
  };

  const handleAutoDiscountChange = (value, totalPrice) => {
    const re = /^[0-9]{0,13}\.?[0-9]{0,13}$/;

    if (re.test(value) && Number(value) <= Number(totalPrice)) {
      const discountAmount = selectedProducts.reduce(
        (totalDiscountAmount, { invoiceQuantity, discountAmount }) =>
          math.add(
            totalDiscountAmount,
            math.mul(Number(invoiceQuantity || 0), Number(discountAmount || 0))
          ),
        0
      );
      const discountPercentage = math.mul(
        math.div(Number(discountAmount || 0), totalPrice || 1),
        100
      );

      setDiscount({
        percentage: `${toFixedNumber(discountPercentage, 5)}` || undefined,
        amount: `${Number(discountAmount || 0).toFixed(3)}` || undefined,
      });
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

      setSelectedProducts(newSelectedProducts);

      setVat({
        percentage: newVatPercentage,
        amount: newVatAmount,
      });
    }
    if (!checked) {
      setVat({
        percentage: undefined,
        amount: undefined,
      });
      const newSelectedProducts = selectedProducts.map((selectedProduct) => {
        const taxAmountPercentage = 0;
        const totalTaxAmount = 0;
        const taxAmountWithPrice = parseFloat(
          selectedProduct?.discountedPrice || selectedProduct?.invoicePrice || 0
        );
        const totalTaxAmountWithPrice = math.mul(
          parseFloat(taxAmountWithPrice || 0),
          parseFloat(selectedProduct?.invoiceQuantity || 0)
        );
        return {
          ...selectedProduct,
          taxAmount: 0,
          taxAmountPercentage: parseFloat(taxAmountPercentage)?.toFixed(2),
          originalTaxAmount: 0,
          totalTaxAmount: parseFloat(totalTaxAmount),
          taxAmountWithPrice: parseFloat(taxAmountWithPrice),
          totalTaxAmountWithPrice: parseFloat(totalTaxAmountWithPrice),
        };
      });

      setSelectedProducts(newSelectedProducts);
    }
    if (vatPayments.length > 0) {
      setVatPayments([]);
    }
  };

  const handleSearch = useMemo(
    () =>
      debounce((event, page, isScroll) => {
        fetchReturnProducts({
          filter: {
            name: !serialNumber ? event : undefined,
            serialNumber: serialNumber ? event : undefined,
            datetime: moment(getValues("operationDate"))?.format(
              fullDateTimeWithSecond
            ),
            limit: 25,
            page: 1,
            businessUnitIds: id
              ? businessUnit === null
                ? [0]
                : [businessUnit]
              : BUSINESS_TKN_UNIT
              ? [BUSINESS_TKN_UNIT]
              : undefined,
            ...(checkQuantityForContact
              ? { client: getValues("counterparty") }
              : []),
            excludeInvoiceId: invoiceInfo?.id,
            contract: getValues("contract"),
          },
        }).then((data) => {
          if (data?.length) {
            const productData = isScroll
              ? [...productsByName, ...data]
              : [...data];
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
                                Number(product?.quantity || 0),
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
          }
        });
      }, 300),
    [serialNumber, checkQuantityForContact]
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

    const priceTypes = [];
    const productsWithPrices = productsByName?.map((product) => {
      const price = math.mul(
        parseFloat(product?.lastPrice ?? 0),
        product?.coefficientRelativeToMain ?? 1
      );
      const productPricesTypeObj = { invoicePrice: price };
      return {
        ...product,
        prices: priceTypes?.[product.id],
        invoicePrice: productPricesTypeObj?.invoicePrice
          ? Number(productPricesTypeObj?.invoicePrice)
          : null,
        autoDiscountedPrice: productPricesTypeObj?.discountedPrice,
        mainInvoicePrice: productPricesTypeObj?.invoicePrice,
        invoiceQuantity: product?.catalog?.isWithoutSerialNumber
          ? 1
          : product?.quantity === 1
          ? 1
          : null,
        productPricetype: productPricesTypeObj.productPriceType,
      };
    });
    const selectedProduct = !serialNumber
      ? transformUniqueIdData(productsWithPrices).find(
          (product) => product?.id === productId
        )
      : transformUniqueIdForSerialData(productsWithPrices).find(
          (product) => product?.id == productId
        );

    handleProductSelect(newSerialid, selectedProduct, productId);
  };

  const handleProductSelect = (newSerialid, currentProduct, productId) => {
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

      fetchProducts({
        filter: {
          withUnitOfMeasurements: 1,
          ids: [currentProduct?.productId],
          priceInvoiceTypes: [2],
          withMinMaxPrice: 1,
        },
      }).then((data) => {
        if (data?.length) {
          const invoicePriceValue = autoFillPrice
            ? data[0]?.lastPrice
              ? defaultNumberFormat(data[0]?.lastPrice)
              : null
            : null;

          const price = data[0]?.lastPrice;
          const invQuantity =
            newProduct?.catalog?.isWithoutSerialNumber || serialNumber
              ? serialNumber
                ? 1
                : Number(newProduct?.quantity) >= 1
                ? 1
                : defaultNumberFormat(toFixedNumber(newProduct?.quantity, 4))
              : null;

          setSelectedProducts(
            [
              ...selectedProducts,
              {
                ...newProduct,
                quantity: newProduct.quantity,
                productUniqueId: uuid(),
                invoicePrice: invoicePriceValue,
                mainInvoicePrice: invoicePriceValue,
                invoiceQuantity: invQuantity,
                discountAmount: 0,
                discountPercentage: 0,
                discountedPrice: autoFillPrice
                  ? defaultNumberFormat(price) ?? 0.0
                  : 0.0,
                totalPricePerProduct: autoFillPrice
                  ? math.mul(Number(price ?? 0), Number(invQuantity || 0))
                  : null,
                totalEndPricePerProduct: autoFillPrice
                  ? math.mul(Number(price ?? 0), Number(invQuantity || 0))
                  : 0,

                attachmentId: data[0]?.attachmentId,
                attachmentName: data[0]?.attachmentName,
                pricePerUnit: data[0]?.pricePerUnit,
                unitOfMeasurementID: newProduct?.unitOfMeasurementId,
                unitOfMeasurements: generateProductMultiMesaurements(
                  data[0],
                  newProduct
                ),
                hasMultiMeasurement: data[0]?.unitOfMeasurements?.length > 1,
                bronQuantityInStock: data[0]?.bronQuantity,
                salesDraftQuantityInStock: data[0]?.salesDraftQuantity,
                weightPerUnit: data[0]?.weightPerUnit,
                volumePerUnit: data[0]?.volumePerUnit,
                totalWeight: data[0]?.totalWeight,
                totalVolume: data[0]?.totalVolume,
                brandName: data[0]?.brandName,
                isVatFree: data[0]?.isVatFree,
                taxAmount: data[0]?.taxAmount,
                totalTaxAmount: data[0]?.totalTaxAmount,
                taxAmountWithPrice: data[0]?.taxAmountWithPrice,
                totalTaxAmountWithPrice: data[0]?.totalTaxAmountWithPrice,
                lifetime: data[0]?.lifetime,
              },
            ].map((product) => {
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
                  expense_amount_in_percentage
                ),
                expense_amount: roundToDown(expense_amount),
                invoiceQuantity: product?.invoiceQuantity
                  ? product?.invoiceQuantity
                  : product.catalog?.isWithoutSerialNumber
                  ? 1
                  : null,
                ...(serialNumber
                  ? {
                      serialNumbers: [newProduct?.serial_number],
                    }
                  : []),
                ...(serialNumber ? { invoiceQuantity: 1 } : []),
                ...(serialNumber
                  ? {
                      invoiceProducts: [
                        {
                          ...currentProduct,
                          invoiceQuantity: 1,
                        },
                      ],
                    }
                  : []),
                cost: roundToDown(
                  math.add(
                    Number(expense_amount) || 0,
                    Number(product.invoicePrice) || 0
                  )
                ),
              };
            })
          );
        }
      });
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

    if (totalPrice && discount.amount) {
      newEndPrice = roundTo(
        math.sub(Number(totalPrice) || 0, Number(discount.amount || 0)),
        4
      );
      handleAutoDiscountChange(Number(discount.amount) || 0, totalPrice);
    } else if (discount.amount) {
      newEndPrice = 0;
    }
    setEndPrice(Number(newEndPrice || 0));
    if (Number(discount.percentage) === 100) {
      setVat({
        percentage: null,
        amount: null,
      });
      return;
    }
    if (
      useVat
    ) {
      setVat({
        percentage:
          Number(defaultNumberFormat(vatSettingState?.percentage || 0)) ||
          undefined,
        amount: roundTo(
          math.div(
            math.mul(
              Number(vatSettingState?.percentage || 0),
              Number(totalPrice || 0)
            ),
            100
          ),
          4
        ),
      });
    }
  }, [selectedProducts, discount.amount]);

  useEffect(() => {
    if (useVat) {
      handleUseVat(true);
    }
  }, [selectedProducts.length]);

  const toggleCatalogModal = () => {
    setCatalogModalIsVisible(
      (prevCatalogModalIsVisible) => !prevCatalogModalIsVisible
    );
  };

  return (
    <View style={styles.container}>
      <InvoiceModalWithSN
        isSerialNumber={serialNumber}
        stausColumn={true}
        product={selectedRow}
        isVisible={invoiceModalWithSN}
        toggleModal={toggleInvoiceModalWithSN}
        type="returnFromCustomer"
        productsToHandle={productsToHandle}
        getValues={getValues}
        selectedProducts={selectedProducts}
        setSelectedProducts={setSelectedProducts}
        setDiscount={setDiscount}
        editId={id}
        checkQuantityForContact={checkQuantityForContact}
        businessId={
          id
            ? businessUnit === null
              ? [0]
              : [businessUnit]
            : BUSINESS_TKN_UNIT
            ? [BUSINESS_TKN_UNIT]
            : undefined
        }
      />

      <InvoiceModalWithoutSN
        stausColumn={true}
        product={selectedRow}
        showMeasurementSelect={selectedRow?.unitOfMeasurements?.length > 1}
        isVisible={invoiceModalWithoutSN}
        toggleModal={toggleInvoiceModalWithoutSN}
        type="returnFromCustomer"
        getValues={getValues}
        selectedProducts={selectedProducts}
        setSelectedProducts={setSelectedProducts}
        setDiscount={setDiscount}
        editId={id}
        checkQuantityForContact={checkQuantityForContact}
        businessId={
          id
            ? businessUnit === null
              ? [0]
              : [businessUnit]
            : BUSINESS_TKN_UNIT
            ? [BUSINESS_TKN_UNIT]
            : undefined
        }
      />

      <BronModal
        isVisible={bronModal}
        setIsVisible={setBronModal}
        productData={productData}
      />
      <AddFromCatalog
        getValues={getValues}
        type="returnFromCustomer"
        selectedProducts={selectedProducts}
        isVisible={catalogModalIsVisible}
        setModalVisible={setCatalogModalIsVisible}
        setSelectedProducts={setSelectedProducts}
        productsToHandle={productsToHandle}
        setProductsToHandle={setProductsToHandle}
        autofillDiscountPrice={autofillDiscountPrice}
        checkQuantityForContact={checkQuantityForContact}
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
              fetchData={getProducts}
              filter={{
                datetime: moment(getValues("operationDate"))?.format(
                  fullDateTimeWithSecond
                ),
              }}
              apiEnd={getValues("stockTo")}
              handleSearch={handleSearch}
              searchWithBack
              notValue
              notForm
              disabled={!getValues("stockTo") || !getValues("counterparty")}
              handleSelectValue={handleSelectValue}
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
          disabled={!getValues("stockTo") || !getValues("counterparty")}
          onClick={toggleCatalogModal}
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
          <Text>Məhsul miqdarı:</Text>
          <Text>
            {selectedProducts && selectedProducts.length
              ? selectedProducts.reduce(
                  (accumulator, currentValue) =>
                    math.add(
                      accumulator,
                      Number(currentValue?.invoiceQuantity || 0)
                    ),
                  0
                )
              : 0}
          </Text>
        </View>
        <View style={styles.footer}>
          <Text>Toplam qiymət:</Text>
          <Text>
            {defaultNumberFormat(
              Number(
                selectedProducts.reduce(
                  (totalPrice, { totalPricePerProduct }) =>
                    math.add(totalPrice, Number(totalPricePerProduct || 0)),
                  0
                ) || 0
              )
            )}{" "}
            {currencies.find(({ id }) => id === getValues("currency"))?.code}
          </Text>
        </View>
        {return_from_customer_discount?.permission !== 0 && (
          <View style={{ ...styles.footer, alignItems: "center" }}>
            <View>
              <Text>Endirim:</Text>
            </View>

            <View style={{ display: "flex", flexDirection: "row" }}>
              <View
                style={
                  return_from_customer_discount?.permission !== 1
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
                  editable={return_from_customer_discount?.permission !== 1}
                  style={{
                    width: 90,
                    padding: 5,
                  }}
                />
                <Text style={styles.prefix}>%</Text>
              </View>
              <View
                style={
                  return_from_customer_discount?.permission !== 1
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
                  editable={return_from_customer_discount?.permission !== 1}
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
        {return_from_customer_discount?.permission !== 0 && (
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
    setValue,
    setSelectedProducts,
    currencies,
    setCurrencies,
    control,
    vatPayments,
    setVatPayments,
    payments,
    setPayments,
    expenseRates,
    setExpenseRates,
    vatExpenseRates,
    groupedTransaction,
    endPrice,
    vat,
    useVat,
    BUSINESS_TKN_UNIT,
    loading,
    businessUnit,
    id,
    invoiceInfo,
    watch,
  } = props;
  const [paymentTableData, setPaymentTableData] = useState([]);
  const [vatPaymentTableData, setVatPaymentTableData] = useState([]);
  const [cashbox, setCashbox] = useState([]);
  const [allCashBoxNames, setCashboxNames] = useState([]);
  const [rate, setRate] = useState(1);
  const [vatEdit, setVatEdit] = useState(false);
  const [invoiceEdit, setInvoiceEdit] = useState(false);

  const paymentTableHead = [
    "Sənəd üzrə borc",
    `Silinəcək borc (Əsas valyuta)`,
    "Ödəniş məbləği",
    "Məzənnə",
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

  useEffect(() => {
    if (groupedTransaction) {
      const { main, taxMain } = groupedTransaction;

      if (Object.keys(taxMain || {}).length !== 0 && taxMain?.paymentTypeId) {
        // updatePaymentDetails(
        //     { rate: Number(taxMain.invoicePaymentCustomRate || 1) },
        //     'taxInvoice'
        // );
        setValue("vatPaymentAccount", taxMain.cashboxId);
        setValue("vatPaymentType", taxMain?.paymentTypeId);
        setValue(
          "vatPaymentDate",
          moment(taxMain.taxdateOfTransaction, fullDateTimeWithSecond)
        );
        setValue("vatPaymentCurrency", taxMain.currencyId);
        setValue("vatPaymentAmount", `${Number(taxMain.amount)?.toFixed(2)}`);
      }

      if (Object.keys(main || {}).length !== 0 && main?.paymentTypeId) {
        // updatePaymentDetails(
        //     { rate: Number(main.invoicePaymentCustomRate || 1) },
        //     'invoice'
        // );
        setValue("invoicePaymentAccount", main.cashboxId);
        setValue("invoicePaymentType", main?.paymentTypeId);
        setValue(
          "invoicePaymentDate",
          moment(main.dateOfTransaction, fullDateTimeWithSecond)
        );
        setValue("invoicePaymentCurrency", main.currencyId);
        setValue("invoicePaymentAmount", `${Number(main.amount)?.toFixed(2)}`);
      }
    }
  }, [groupedTransaction]);

  const getCashboxNames = (cashBoxType) => {
    return allCashBoxNames.filter(({ type }) => type === cashBoxType);
  };

  const handlePriceChange = (newPrice, typeOperation, limit, type) => {
    const newExpenses = (type === "vat" ? vatPayments : payments).map(
      (selectedExpenseItem, index) => {
        if (typeOperation === "amountToDelete") {
          return {
            ...selectedExpenseItem,
            amountToDelete: newPrice,
          };
        }
      }
    );
    if (type === "vat") {
      setVatPayments(newExpenses); /// vat ucun yenisini yaz
    } else {
      setPayments(newExpenses);
    }
  };

  useEffect(() => {
    if (getValues("invoicePaymentAccount") || getValues("vatPaymentAccount")) {
      const cashboxIds = [];
      if (getValues("invoicePaymentAccount")) {
        cashboxIds.push(getValues("invoicePaymentAccount"));
      }
      if (getValues("vatPaymentAccount")) {
        cashboxIds.push(getValues("vatPaymentAccount"));
      }
      runAccountBalance({
        cashboxIds: [...new Set(cashboxIds)],
        dateTime: moment(getValues("operationDate"))?.format(
          fullDateTimeWithSecond
        ),
        limit: 1000,
      });
    }
  }, [
    getValues("invoicePaymentAccount"),
    getValues("vatPaymentAccount"),
    getValues("operationDate"),
    getValues("currency"),
  ]);

  useEffect(() => {
    if (groupedTransaction && !invoiceEdit && endPrice !== 0) {
      const { main } = groupedTransaction;
      setInvoiceEdit(true);
      setPayments([
        {
          debtOnTheDocument: endPrice,
          currency: getValues("currency"),
          currencyCode:
            currencies?.find((currency) => currency.id === main.currencyId)
              ?.code || "USD",
          rate: rate,
          amountPaid: Number(main.amount)?.toFixed(2),
          amountToDelete: Number(main.amount)?.toFixed(2),
        },
      ]);
    } else {
      setPayments([
        {
          debtOnTheDocument: endPrice,
          amountPaid: endPrice || 0,
          currency: getValues("currency"),
          currencyCode:
            currencies?.find(
              (currency) => currency.id === getValues("invoicePaymentCurrency")
            )?.code || "USD",
          rate: rate,
          amountToDelete: endPrice || 0,
        },
      ]);
    }
  }, [endPrice, rate, groupedTransaction]);
  useEffect(() => {
    if (groupedTransaction && !vatEdit && vat.amount !== 0) {
      const { taxMain } = groupedTransaction;
      setVatEdit(true);
      setVatPayments([
        {
          debtOnTheDocument: parseFloat(vat.amount || 0).toFixed(2) || 0,
          amountPaid: `${Number(taxMain.amount)?.toFixed(2)}` || 0,
          currency: getValues("currency"),
          currencyCode:
            currencies?.find((currency) => currency.id === taxMain.currencyId)
              ?.code || "USD",
          rate: rate,
          amountToDelete: `${Number(taxMain.amount)?.toFixed(2)}` || 0,
        },
      ]);
    } else {
      setVatPayments([
        {
          debtOnTheDocument: parseFloat(vat.amount || 0).toFixed(2) || 0,
          amountPaid: parseFloat(vat.amount || 0).toFixed(2) || 0,
          currency: getValues("currency"),
          currencyCode:
            currencies?.find(
              (currency) => currency.id === getValues("vatPaymentCurrency")
            )?.code || "USD",
          rate: rate,
          amountToDelete: parseFloat(vat.amount || 0).toFixed(2) || 0,
        },
      ]);
    }
  }, [useVat, vat, groupedTransaction]);

  const getCashboxDetail = (id) => {
    if (Object.values(cashbox ?? {})?.[0] === false) {
      return "???";
    } else if (cashbox[id]?.length === 0) {
      return "0.00";
    } else {
      return (
        <View style={{ display: "flex", flexDirection: "row", gap: 5 }}>
          {cashbox[id]?.map(({ balance, currencyCode, tenantCurrencyId }) =>
            tenantCurrencyId ? (
              <Text>
                {formatNumberToLocale(defaultNumberFormat(balance || 0))}
                {currencyCode}
              </Text>
            ) : (
              ""
            )
          ) || "0.00"}
        </View>
      );
    }
  };

  useEffect(() => {
    setPaymentTableData(
      payments.map(
        ({
          debtOnTheDocument,
          amountPaid,
          currencyCode,
          rate,
          amountToDelete,
        }) => {
          return [
            <Text>
              {debtOnTheDocument} {currencyCode}
            </Text>,
            <View>
              <TextInput
                value={`${Number(amountToDelete || 0)}`}
                keyboardType="numeric"
                onChangeText={(event) => {
                  setValue(
                    "invoicePaymentAmount",
                    `${roundTo(parseFloat(event ?? 0), 2)}`
                  );
                  handlePriceChange(event, "amountToDelete", 10000000);
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
            <Text>
              {formatNumberToLocale(defaultNumberFormat(amountPaid))}{" "}
              {currencyCode}
            </Text>,
            <Text>{rate}</Text>,
          ];
        }
      )
    );
  }, [payments, cashbox, expenseRates]);

  useEffect(() => {
    setVatPaymentTableData(
      vatPayments.map(
        ({
          debtOnTheDocument,
          amountPaid,
          currencyCode,
          rate,
          amountToDelete,
        }) => {
          return [
            <Text>
              {debtOnTheDocument} {currencyCode}
            </Text>,
            <View>
              <TextInput
                value={`${Number(amountToDelete || 0)}`}
                keyboardType="numeric"
                onChangeText={(event) => {
                  setValue(
                    "vatPaymentAmount",
                    `${roundTo(parseFloat(event ?? 0), 2)}`
                  );
                  handlePriceChange(event, "amountToDelete", 10000000, "vat");
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
            <Text>
              {formatNumberToLocale(defaultNumberFormat(amountPaid))}{" "}
              {currencyCode}
            </Text>,
            <Text>{rate}</Text>,
          ];
        }
      )
    );
  }, [vatPayments, cashbox, vatExpenseRates]);

  useEffect(() => {
    if (endPrice && !id) {
      setValue(
        "invoicePaymentAmount",
        `${roundToDown(Number(endPrice || 0), 2)}`
      );
    }
  }, [endPrice]);

  useEffect(() => {
    if (vat.amount && !id) {
      setValue(
        "vatPaymentAmount",
        `${parseFloat(vat.amount || 0).toFixed(2) || 0}`
      );
    }
  }, [vat.amount]);

  useEffect(() => {
    setValue("invoicePaymentCurrency", getValues("currency"));
    setValue("invoicePaymentDate", getValues("operationDate"));

    setValue("vatPaymentCurrency", getValues("currency"));
    setValue("vatPaymentDate", getValues("operationDate"));
  }, [getValues("currency")]);

  const [index, setIndex] = useState(0);
  const [routes] = React.useState([
    { key: "first", title: "Əsas" },
    { key: "second", title: "ƏDV" },
  ]);

  const renderTabBar = (props) => <TabBar {...props} style={styles.tabbar} />;

  const renderScene = ({ route }) => {
    switch (route.key) {
      case "first":
        return (
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
                Əsas borc:{" "}
                <Text style={{ color: "red" }}>
                  {defaultNumberFormat(customRound(Number(endPrice), 1, 2))}
                  {currencies.find(
                    ({ id }) => id === getValues("currency")?.code
                  )}
                </Text>
              </ProText>
            </View>

            <View
              style={{
                display: "flex",
                gap: 10,
              }}
            >
              <ProDateTimePicker
                required
                name="invoicePaymentDate"
                control={control}
                setValue={setValue}
                disabled={true}
              />
              <View
                style={{
                  display: "flex",
                  flexDirection: "row",
                  gap: 5,
                  alignItems: "center",
                }}
              >
                <ProAsyncSelect
                  label="Hesab növü"
                  data={accountTypes}
                  name="invoicePaymentType"
                  required
                  control={control}
                  allowClear={false}
                  setData={() => {}}
                  fetchData={() => {}}
                  width="40%"
                />

                <ProAsyncSelect
                  width="50%"
                  label="Hesab"
                  data={getCashboxNames(getValues("invoicePaymentType")).filter(
                    (item) =>
                      !payments
                        .filter(
                          (pay) =>
                            pay.currency &&
                            pay.currency === payments[index]?.currency &&
                            item.id !== getValues("invoicePaymentAccount")
                        )
                        ?.map((payment) => payment.cashboxId)
                        ?.includes(item.id)
                  )}
                  setData={() => {}}
                  fetchData={() => {}}
                  filter={{
                    applyBusinessUnitTenantPersonFilter: 1,
                  }}
                  disabled={!watch("invoicePaymentType")}
                  name="invoicePaymentAccount"
                  required
                  control={control}
                  allowClear={false}
                />
                <View>
                  {watch("invoicePaymentAccount") ? (
                    <ProTooltip
                      containerStyle={{ width: 145, height: "auto" }}
                      popover={
                        <Text>
                          Əməliyyat tarixi üzrə qalıq:
                          {getCashboxDetail(getValues("invoicePaymentAccount"))}
                        </Text>
                      }
                      trigger={<FontAwesome name="info-circle" size={18} />}
                    />
                  ) : (
                    <FontAwesome
                      disabled={!getValues("invoicePaymentAccount")}
                      name="info-circle"
                      size={18}
                    />
                  )}
                </View>
              </View>

              <View style={{ display: "flex", flexDirection: "row", gap: 10 }}>
                <ProFormInput
                  label="Ödəniş məbləği"
                  name="invoicePaymentAmount"
                  control={control}
                  disabled={true}
                  width="70%"
                />

                <ProAsyncSelect
                  width="30%"
                  label="Valyuta"
                  required
                  name="invoicePaymentCurrency"
                  control={control}
                  allowClear={false}
                  data={currencies.filter(
                    (item) =>
                      !payments
                        .filter(
                          (pay) =>
                            pay.cashboxId &&
                            pay.cashboxId === payments[index].cashboxId &&
                            item.id !== getValues("invoicePaymentCurrency")
                        )
                        ?.map((payment) => payment.currency)
                        ?.includes(item.id)
                  )}
                  setData={() => {}}
                  fetchData={() => {}}
                  filter={{ limit: 1000, withRatesOnly: 1 }}
                  // handleSelectValue={(id) => {
                  //   handlePriceChange(index, id, "currency");
                  // }}
                />
              </View>
            </View>

            <View style={{ maxHeight: 150, marginTop: 10 }}>
              <ScrollView nestedScrollEnabled={true}>
                <ScrollView
                  nestedScrollEnabled={true}
                  horizontal={true}
                  style={{ height: "100%" }}
                >
                  <Table borderStyle={{ borderWidth: 1, borderColor: "white" }}>
                    <Row
                      data={paymentTableHead}
                      widthArr={[120, 160, 140, 80]}
                      style={styles.head}
                      textStyle={styles.headText}
                    />

                    {paymentTableData.map((rowData, index) => (
                      <Row
                        key={index}
                        data={rowData}
                        widthArr={[120, 160, 140, 80]}
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
          </>
        );
      case "second":
        return (
          <View>
            {useVat &&
            (math.sub(
              customRound(vat.amount || 0, 1, 2),
              Number(invoiceInfo?.paidTaxAmount || 0)
            ) > 0 ||
              id) ? (
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
                    ƏDV borc:{" "}
                    <Text style={{ color: "red" }}>
                      {defaultNumberFormat(customRound(vat.amount || 0, 1, 2))}
                      {currencies.find(
                        ({ id }) => id === getValues("currency")?.code
                      )}
                    </Text>
                  </ProText>
                </View>
                <View
                  style={{
                    display: "flex",
                    gap: 10,
                  }}
                >
                  <ProDateTimePicker
                    required
                    name="vatPaymentDate"
                    control={control}
                    setValue={setValue}
                    disabled={true}
                  />
                  <View
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      gap: 5,
                      alignItems: "center",
                    }}
                  >
                    <ProAsyncSelect
                      label="Hesab növü"
                      data={accountTypes}
                      name="vatPaymentType"
                      required
                      control={control}
                      allowClear={false}
                      setData={() => {}}
                      fetchData={() => {}}
                      width="40%"
                    />

                    <ProAsyncSelect
                      width="50%"
                      label="Hesab"
                      data={getCashboxNames(getValues("vatPaymentType")).filter(
                        (item) =>
                          !vatPayments
                            .filter(
                              (pay) =>
                                pay.currency &&
                                pay.currency === vatPayments[index]?.currency &&
                                item.id !== getValues("vatPaymentAccount")
                            )
                            ?.map((payment) => payment.cashboxId)
                            ?.includes(item.id)
                      )}
                      setData={() => {}}
                      fetchData={() => {}}
                      filter={{
                        applyBusinessUnitTenantPersonFilter: 1,
                      }}
                      // handleSelectValue={(id) => {
                      //   handlePriceChange(index, id, "cashboxId");
                      // }}
                      disabled={!watch("vatPaymentType")}
                      name="vatPaymentAccount"
                      required
                      control={control}
                      allowClear={false}
                    />
                    <View>
                      {watch("vatPaymentAccount") ? (
                        <ProTooltip
                          containerStyle={{ width: 145, height: "auto" }}
                          popover={
                            <Text>
                              Əməliyyat tarixi üzrə qalıq:
                              {getCashboxDetail(getValues("vatPaymentAccount"))}
                            </Text>
                          }
                          trigger={<FontAwesome name="info-circle" size={18} />}
                        />
                      ) : (
                        <FontAwesome
                          disabled={!getValues("vatPaymentAccount")}
                          name="info-circle"
                          size={18}
                        />
                      )}
                    </View>
                  </View>

                  <View
                    style={{ display: "flex", flexDirection: "row", gap: 10 }}
                  >
                    <ProFormInput
                      label="Ödəniş məbləği"
                      name="vatPaymentAmount"
                      control={control}
                      disabled={true}
                      width="70%"
                    />

                    <ProAsyncSelect
                      width="30%"
                      label="Valyuta"
                      required
                      name="vatPaymentCurrency"
                      control={control}
                      allowClear={false}
                      data={currencies.filter(
                        (item) =>
                          !payments
                            .filter(
                              (pay) =>
                                pay.cashboxId &&
                                pay.cashboxId === payments[index].cashboxId &&
                                item.id !== getValues("vatPaymentCurrency")
                            )
                            ?.map((payment) => payment.currency)
                            ?.includes(item.id)
                      )}
                      setData={() => {}}
                      fetchData={() => {}}
                      filter={{ limit: 1000, withRatesOnly: 1 }}
                      // handleSelectValue={(id) => {
                      //   handlePriceChange(index, id, "currency");
                      // }}
                    />
                  </View>
                </View>

                <View style={{ maxHeight: 150, marginTop: 10 }}>
                  <ScrollView nestedScrollEnabled={true}>
                    <ScrollView
                      nestedScrollEnabled={true}
                      horizontal={true}
                      style={{ height: "100%" }}
                    >
                      <Table
                        borderStyle={{ borderWidth: 1, borderColor: "white" }}
                      >
                        <Row
                          data={paymentTableHead}
                          widthArr={[120, 160, 140, 80]}
                          style={styles.head}
                          textStyle={styles.headText}
                        />
                        {vatPaymentTableData.map((rowData, index) => (
                          <Row
                            key={index}
                            data={rowData}
                            widthArr={[120, 160, 140, 80]}
                            style={styles.rowSection}
                            textStyle={styles.text}
                          />
                        ))}
                      </Table>
                    </ScrollView>
                  </ScrollView>
                </View>
              </>
            ) : null}
          </View>
        );
      default:
        return null;
    }
  };
  return (
    <View style={styles.container}>
      <View
        style={{
          height: "100%",
        }}
      >
        <TabView
          navigationState={{ index, routes }}
          renderScene={renderScene}
          onIndexChange={setIndex}
          // initialLayout={{ width: layout.width }}
          renderTabBar={renderTabBar}
          swipeEnabled={false}
        />
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
    </View>
  );
};

const ReturnFromCustomer = ({ navigation, route }) => {
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
  const [vatPayments, setVatPayments] = useState([]);
  const [endPrice, setEndPrice] = useState(0);
  const [currencies, setCurrencies] = useState([]);
  const [index, setIndex] = React.useState(0);
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
  const [cashBoxIsDisabled, setCashBoxIsDisabled] = useState(false);
  const [checkQuantityForContact, setCheckQuantityForContact] = useState(true);
  const [groupedTransaction, setGroupedTransaction] = useState(undefined);

  const [settingsData, setSettingsData] = useState([]);
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

  const { profile, BUSINESS_TKN_UNIT, tableSettings, permissionsByKeyValue } =
    useContext(TenantContext);

  const { return_from_customer_discount } = permissionsByKeyValue;

  const handleProductPriceType = (
    productPriceTypes,
    unitOfMeasurementId,
    type
  ) => {
    const selectedProductPriceType =
      values(productPriceTypes?.unitOfMeasurements)?.find(
        (unit) => unit?.unitOfMeasurementId === unitOfMeasurementId
      ) ?? productPriceTypes;

    const invoicePrice =
      type &&
      watch("counterparty") &&
      !selectedProductPriceType?.contactPrice?.isCostType
        ? selectedProductPriceType?.contactPrice?.convertedAmount
          ? selectedProductPriceType?.default?.convertedAmount
          : null
        : watch("counterparty")
        ? selectedProductPriceType?.contactPrice?.convertedAmount
        : selectedProductPriceType?.default?.convertedAmount;
    const productPriceType = [
      {
        convertedAmount: selectedProductPriceType?.default?.convertedAmount,
        name: "Satış",
        id: 0,
      },
      ...(selectedProductPriceType?.prices ?? []),
    ];

    const discountedPrice = selectedProductPriceType?.contactPrice?.isCostType
      ? null
      : type &&
        watch("counterparty") &&
        selectedProductPriceType?.contactPrice?.convertedAmount
      ? selectedProductPriceType?.contactPrice?.convertedAmount
      : null;

    return { invoicePrice, productPriceType, discountedPrice };
  };
  const updateEditInvoice = (selectedContract, isDraft) => {
    const {
      clientId,
      supplierId,
      salesmanId,
      operationDate,
      currencyId,
      contractId,
      endPrice,
      taxCurrencyCode,
      stockToId,
      invoiceProducts,
      currencyCode,
      amount,
      counterpartyCategoryIds,
      discountAmount,
      discountPercentage,
      description,
      taxAmount: tax,
      businessUnitId,
      taxPercentage,
    } = invoiceInfo;
    const { content } = invoiceProducts;
    const selectedProductIds = content.map(({ productId }) => productId);
    const selectedProducts = {};

    fetchSalesPrice({
      filter: {
        currency: currencyId,
        products: selectedProductIds,
        contactPrice: clientId,
        businessUnitIds: businessUnitId === null ? [0] : [businessUnitId],
      },
    }).then((priceTypes) => {
      content.map(
        (
          {
            productId,
            productName,
            quantity,
            pricePerUnit,
            serialNumber,
            discountPercentage,
            discountAmount,
            endPricePerUnit,
            total,
            unitOfMeasurementId,
            originalQuantity,
            coefficient,
            unitOfMeasurements,
            totalEndPrice,
            product_code,
            barcode,
            quantityInStock,
            unitOfMeasurementName,
            draftRootInvoiceProductId,
            attachedInvoiceProductId,
            catalogId,
            isServiceType,
            catalogName,
            brandName,
            rootCatalogName,
            isWithoutSerialNumber,
            usedQuantity,
            bronQuantityInStock,
            salesDraftQuantityInStock,
            roadTax,
            uniqueKey,
            taxAmount,
            totalTaxAmount,
            isVatFree,
            explanation,
            description,
            mainUnitOfMeasurementName,
            isRoadTaxActive,
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
              invoiceQuantity: `${math.add(
                Number(originalQuantity || 0),
                selectedProducts[uniqueKey].invoiceQuantity
              )}`,
              barcode,
              usedQuantity: roundToDown(
                math.add(
                  Number(usedQuantity || 0),
                  Number(selectedProducts[uniqueKey].usedQuantity)
                ),
                4
              ),

              totalPricePerProduct: math.add(
                Number(total || 0),
                selectedProducts[uniqueKey]?.totalPricePerProduct
              ),
              totalPricePerProductBack: math.add(
                parseFloat(total || 0),
                selectedProducts[uniqueKey]?.totalPricePerProductBack
              ),
              totalEndPricePerProduct: math.add(
                Number(totalEndPrice || 0),
                selectedProducts[uniqueKey]?.totalEndPricePerProduct
              ),
              totalTaxAmount: math.add(
                Number(totalTaxAmount || 0),
                selectedProducts[uniqueKey]?.totalTaxAmount
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
              explanation: explanation,
              description: description,
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
                  Number(roundToDown(Number(quantity), 4)),
                  Number(coefficient || 1)
                ) || 0
              ) || 0
            );

            const productPricesTypeObj = handleProductPriceType(
              priceTypes[productId],
              unitOfMeasurementId
            );
            selectedProducts[uniqueKey] = {
              uniqueKey,
              rowOrder: index,
              id: productId,
              isRoadTaxActive,
              invoicePriceBack: pricePerUnit || 0,
              productUniqueId: uniqueKey,
              name: productName,
              barcode: barcode ?? undefined,
              serialNumbers: serialNumber ? [serialNumber] : undefined,
              quantity: Number(quantityInStock || 0),
              totalQuantity: Number(quantityInStock || 0),
              invoiceQuantity: `${math.div(
                Number(roundToDown(Number(quantity), 4)),
                Number(coefficient || 1)
              )}`,
              unitOfMeasurementName,
              mainUnitOfMeasurementName: mainUnitOfMeasurementName,
              hasMultiMeasurement: unitOfMeasurements?.length > 1,
              mainUnitOfMeasurementID:
                unitOfMeasurements[0]?.unitOfMeasurementId,
              discountPercentage: Number(discountPercentage || 0).toFixed(4),
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
              discountAmount: parseFloat(discountAmount || 0),
              discountAmountForBack: discountAmount,
              discountedPrice: Number(endPricePerUnit || 0),
              totalPricePerProduct: defaultNumberFormat(total || 0),
              totalPricePerProductBack: BigNumber(total || 0)?.toString(),
              totalEndPricePerProduct: defaultNumberFormat(
                Number(totalEndPrice || 0).toFixed(4)
              ),
              unitOfMeasurementId, // main measurement
              unitOfMeasurementID: unitOfMeasurementId,
              coefficientRelativeToMain: coefficient,
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

              prices: priceTypes[productId],
              invoicePrice: BigNumber(pricePerUnit)?.toString(),
              mainInvoicePrice: roundToDown(Number(pricePerUnit), 4),
              productPricetype: productPricesTypeObj.productPriceType,
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

              product_code,
              usedQuantity: roundToDown(Number(usedQuantity), 4),
              catalog: {
                id: catalogId,
                name: catalogName,
                rootName: rootCatalogName,
                isWithoutSerialNumber: isWithoutSerialNumber,
                isServiceType,
              },
              bronQuantityInStock,
              salesDraftQuantityInStock,
              brandName,
              taxAmount: Number(taxAmount ?? 0),
              originalTaxAmount: taxAmount,
              isVatFree,
              totalTaxAmount: Number(totalTaxAmount)?.toFixed(2),
              taxAmountWithPrice: taxAmountWithPrice?.toFixed(2),
              totalTaxAmountWithPrice: totalTaxAmountWithPrice?.toFixed(2),
              explanation: explanation,
              description: description,
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
      // X
    });
    setEditDate(moment(operationDate, fullDateTimeWithSecond).toDate());

    setValue("operationDate", moment(operationDate, fullDateTimeWithSecond));
    setValue("counterparty", clientId || undefined);
    setValue("saleManager", salesmanId || undefined);
    setValue("contract", contractId || undefined);
    setValue("currency", currencyId || undefined);
    setValue("stockTo", stockToId ?? undefined);
  };

  useEffect(() => {
    if (invoiceInfo) {
      fetchGroupedTransaction({
        transactionId: invoiceInfo?.id,
      }).then((res) => {
        setGroupedTransaction(res);
      });
      const { contractId, invoiceType } = invoiceInfo;

      if (contractId) {
        const filters = {
          limit: 10,
          page: 1,
          ids: [contractId],
          invoiceId: invoiceInfo?.id,
        };
        getContracts({ filter: filters }).then((data) => {
          updateEditInvoice(data?.[0], invoiceType === 8);
        });
      } else if (!contractId) {
        updateEditInvoice(undefined, invoiceType === 8);
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
      setStatusData(data.filter((item) => item.operationId === 3));
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
    const tmp = {};
    selectedProducts.forEach(
      (
        {
          invoicePrice,
          invoiceProducts,
          id,
          productUniqueId,
          invoiceQuantity,
          invoicePriceBack,
          discountPercentage,
          unitOfMeasurementID,
          coefficientRelativeToMain,
          discountAmountForBack,
          uniqueKey,
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
                  math.mul(Number(discount.amount || 0), 100),
                  Number(totalPrice || 0)
                )
              ),
              100
            )
          : null;
        tmp[productUniqueId] = {
          product: id,
          price: invoicePriceBack ?? Number(invoicePrice),
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

          discountAmount: discountPercentage
            ? BigNumber(
                discountAmountForBack ?? discountPerProduct ?? 0
              )?.toString()
            : null,
          uniqueKey,
          taxAmount: BigNumber(originalTaxAmount ?? 0)?.toString(),
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
      contract,
      counterparty,
      currency,
      operationDate,
      saleManager,
      stockTo,
      status,
      invoicePaymentType,
      invoicePaymentAccount,
      invoicePaymentAmount,
      invoicePaymentCurrency,
      vatPaymentAccount,
      vatPaymentCurrency,
      vatTypeOfPayment,
      vatAdvancePaymentAmount,
      vatPaymentAmount,
      amountPaid,
      amountPaidTax,
    } = data;

    const newSalesInvoiceWithPayment = {
      salesman: saleManager || null,
      currency: currency || null,
      client: counterparty || null,
      applyContactFilter: checkQuantityForContact ? true : false,
      stock: stockTo || null,
      description: null,
      operationDate: moment(operationDate).format(fullDateTimeWithSecond),
      status: status || null,
      operator: profile.id,
      contract: contract || null,
      applyContactFilter: checkQuantityForContact ? true : false,
      invoiceProducts_ul: handleSelectedProducts(selectedProducts, id, false),
      dateOfTransaction: moment(operationDate).format(fullDateTimeWithSecond),
      cashbox: invoicePaymentAccount || null,
      typeOfPayment: invoicePaymentType || null,
      amount: invoicePaymentAmount ? Number(invoicePaymentAmount) : null,
      transactionCurrency: invoicePaymentCurrency || null,
      initialInvoices_ul: [],
      initialAmounts_ul: [],
      advanceAmount:
        math.sub(
          roundTo(Number(endPrice || 0), 2),
          Number(
            math.mul(
              Number(invoicePaymentAmount || 0),
              Number(1) //rate
            ) || 0
          )
        ) > 0
          ? roundToUp(
              math.sub(
                roundTo(Number(endPrice || 0), 2),
                Number(
                  math.mul(
                    Number(invoicePaymentAmount || 0),
                    Number(1) // rate
                  )
                )
              ),
              4
            )
          : null,
      taxDateOfTransaction: moment(operationDate).format(
        fullDateTimeWithSecond
      ),
      taxCashbox: vatPaymentAccount || null,
      taxTypeOfPayment: vatTypeOfPayment || null,
      taxTransactionCurrency: vatPaymentCurrency || null,
      taxAmount: vatPaymentAmount || null,
      taxInitialInvoices_ul: [],
      taxInitialAmounts_ul: [],
      taxAdvanceAmount: vatAdvancePaymentAmount || null,
      taxInvoiceCurrencyAmount: amountPaidTax || null,
      invoiceCurrencyAmount: amountPaid || null,
    };

    if (id) {
      editNewReturnInvoice({
        id: Number(id),
        data: newSalesInvoiceWithPayment,
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
        .catch((error) => setLoading(false));
    } else {
      createInvoice({
        type: "returnFromCustomer",
        data: newSalesInvoiceWithPayment,
      })
        .then((res) => {
          Toast.show({
            type: "success",
            text1: "Məlumatlar yadda saxlandı.",
          });
          navigation.push("DashboardTabs");
        })
        .catch((error) => setLoading(false));
    }
  };

  const onSubmit = (data) => {
    if (selectedProducts.length === 0) {
      Toast.show({
        type: "error",
        text1: "Qaimədə məhsul mövcud deyil",
        topOffset: 50,
      });
    } else if (Number(endPrice) < 0) {
      Toast.show({
        type: "error",
        text1: "Son qiymət 0.00 məbləğindən az ola bilməz.",
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
    } else {
      if (
        !id &&
        math.sub(
          roundTo(Number(endPrice || 0), 2),
          Number(
            math.mul(
              Number(data.invoicePaymentAmount || 0),
              Number(1) // rate
            ) || 0
          )
        ) > 0
      ) {
        Alert.alert(
          "Diqqət!",
          `Bu ödəniş nəticəsində ${math.sub(
            roundTo(Number(endPrice || 0), 2),
            Number(
              math.mul(
                Number(data.invoicePaymentAmount || 0),
                Number(1) // rate
              ) || 0
            )
          )} avans məbləğ formalaşacaqdır!`,
          [
            {
              text: "İMTİNA",
              onPress: () => console.log("Cancel Pressed"),
              style: "cancel",
            },
            {
              text: "TƏSDİQ ET",
              onPress: () => {
                handleCreateInvoice(data);
              },
            },
          ]
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
            settingsData={settingsData}
            setSettingsData={setSettingsData}
            setCashBoxIsDisabled={setCashBoxIsDisabled}
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
            BUSINESS_TKN_UNIT={BUSINESS_TKN_UNIT}
            loading={loading}
            vatSettingState={vatSettingState}
            handleProductPriceType={handleProductPriceType}
            businessUnit={businessUnit}
            id={id}
            invoiceInfo={invoiceInfo}
            editDate={editDate}
            tableSettings={tableSettings}
            setVatPayments={setVatPayments}
            setCheckQuantityForContact={setCheckQuantityForContact}
            checkQuantityForContact={checkQuantityForContact}
            return_from_customer_discount={return_from_customer_discount}
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
            editDate={editDate}
            settingsData={settingsData}
            setSettingsData={setSettingsData}
            cashBoxIsDisabled={cashBoxIsDisabled}
            watch={watch}
            groupedTransaction={groupedTransaction}
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

export default ReturnFromCustomer;
