import React, { useMemo, useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  useWindowDimensions,
  ScrollView,
  StyleSheet,
  Platform
} from "react-native";
import Toast from "react-native-toast-message";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import uuid from "react-uuid";
import { TenantContext } from "../../context";
import { TabView, TabBar } from "react-native-tab-view";
import { debounce, values } from "lodash";
import { FontAwesome } from "@expo/vector-icons";
import {
  ProAsyncSelect,
  ProText,
  ProButton,
  ProFormInput,
  ProWarningModal,
} from "../../components";
import { Form, useForm } from "react-hook-form";
import { Table, Row } from "react-native-reanimated-table";
import Checkbox from "expo-checkbox";
import {
  getCurrencies,
  fetchBarcodeTypes,
  fetchFreeBarcodeTypes,
  generateBarcode,
  fetchBrands,
  fetchSalesCatalogs,
  createProduct,
  createCompositon,
} from "../../api";
import {
  defaultNumberFormat,
  formatNumberToLocale,
  re_amount,
  getPriceValue,
  messages,
} from "../../utils";
import AddFromCatalog from "../../components/AddFromCatalog";
import {
  fetchMeasurements,
  fetchProducts,
  getPurchaseProducts,
} from "../../api/sale";
import { useApi } from "../../hooks";
import { changeNumber } from "../../utils/constants";

const math = require("exact-math");
const BigNumber = require("bignumber.js");

const tableData = {
  tableHead: ["No", "Material", "Say", "Ölçü vahidi", "Sil"],
  widthArr: [50, 140, 140, 140, 60],
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
    id,
    businessUnit,
    freeBarcodTypes,
    setIsServiceType,
    setSelectedCatalog,
    selectedCatalog,
    fromPurchase,
    catalogs,
    setCatalogs,
  } = props;

  const [measurements, setMeasurements] = useState([]);
  const [brands, setBrands] = useState([]);
  const [childCatalogs, setChildCatalogs] = useState([]);
  const [barcodeTypes, setBarcodeTypes] = useState([]);
  const [autoGenerate, setAutoGenerate] = useState(false);
  const [moreChecked, setMoreChecked] = useState(false);

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

  const { isLoading: isLoadCatalog, run: runCatalog } = useApi({
    deferFn: fetchSalesCatalogs,
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

  const { isLoading: isLoadBrand, run: runBrands } = useApi({
    deferFn: fetchBrands,
    onResolve: (data) => {
      setBrands(
        data.map((item) => ({ ...item, label: item.name, value: item.id }))
      );
    },
    onReject: (error) => {
      console.log(error, "rejected");
    },
  });

  const { isLoading: isLoadMeasurements, run: runMeasurements } = useApi({
    deferFn: fetchMeasurements,
    onResolve: (data) => {
      setMeasurements(
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

    runCatalog({ filter: { limit: 20, page: 1 } });
    runBrands({
      filter: {
        limit: 20,
        page: 1,
      },
    });

    runMeasurements({
      filter: {
        limit: 20,
        page: 1,
      },
    });
    fetchBarcodeTypes({}).then((res) => {
      setBarcodeTypes(res);
    });

    setValue("barcodeType", 1);
    setValue("quantity", "1");
  }, []);

  const handleAutoGenerateCheckbox = (checked) => {
    if (checked) {
      setAutoGenerate(true);
      if (getValues("barcodeType") === 1) {
        generateBarcode({ apiEnd: 1 }).then((data) => {
          setValue("barcode", data);
        });
      } else if (getValues("barcodeType") === 2) {
        generateBarcode({ apiEnd: 2 }).then((data) => {
          setValue("barcode", data);
        });
      }
    } else {
      setAutoGenerate(false);
      setValue("barcodeType", 1);
      if (getValues("barcodeType") === 1 || getValues("barcodeType") === 2) {
        const type = getValues("barcodeType") === 1 ? 1 : 2;

        generateBarcode({ apiEnd: type }).then((data) => {
          setValue("barcode", data);
        });
      }
    }
  };

  return (
    <>
      <ScrollView>
        <View
          style={
            fromPurchase
              ? {}
              : {
                  paddingTop: 40,
                  paddingLeft: 10,
                  paddingRight: 10,
                  paddingBottom: 40,
                }
          }
        >
          {!fromPurchase && (
            <ProText variant="heading" style={{ color: "black" }}>
              {id ? "Düzəliş et" : "Yeni məhsul"}
            </ProText>
          )}

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
              label="Kataloq"
              required
              async
              data={catalogs || []}
              setData={setCatalogs}
              fetchData={fetchSalesCatalogs}
              catalog={true}
              apiEnd={undefined}
              filter={{ limit: 20, page: 1 }}
              handleSelectValue={(id) => {
                const currentCatalog = catalogs?.find((cat) => cat.id === id);
                setIsServiceType(currentCatalog?.isServiceType);
                setSelectedCatalog(currentCatalog);
                // setIsWithoutSerialNumber(currentCatalog?.isWithoutSerialNumber);
                setValue(
                  "subCatalog",
                  childCatalogs[id]?.length === 1
                    ? childCatalogs[id][0].id
                    : undefined
                );
              }}
              name="catalog"
              control={control}
            />
            <ProAsyncSelect
              label="Alt kataloqlar"
              required={childCatalogs?.[selectedCatalog?.id]?.length > 0}
              data={
                selectedCatalog?.id
                  ? childCatalogs[selectedCatalog?.id]?.map((item) => ({
                      ...item,
                      label: item.name,
                      value: item.id,
                    }))
                  : []
              }
              disabled={!selectedCatalog?.id}
              setData={() => {}}
              fetchData={() => {}}
              filter={{}}
              name="subCatalog"
              control={control}
            />
            <ProFormInput
              label="Məhsul adı"
              required
              name="productName"
              control={control}
              minLength={3}
            />
            {!fromPurchase && (
              <View style={{ display: "flex", flexDirection: "row", gap: 8 }}>
                <ProFormInput
                  label="Barkod"
                  name="barcode"
                  control={control}
                  minLength={3}
                  width="60%"
                  disabled={autoGenerate}
                  maxLength={
                    getValues("barcodeType") === 1
                      ? freeBarcodTypes?.[0]?.length || 30
                      : barcodeTypes?.length
                  }
                />
                <View
                  style={{
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <View
                    style={{
                      display: "flex",
                      flexDirection: "row",
                    }}
                  >
                    <Checkbox
                      onValueChange={(event) =>
                        handleAutoGenerateCheckbox(event)
                      }
                      value={autoGenerate}
                      style={{ marginLeft: "8px" }}
                    />
                    <Text style={{ marginLeft: 5 }}>Avto generasiya</Text>
                  </View>
                  <View>
                    <ProAsyncSelect
                      allowClear={false}
                      data={
                        barcodeTypes?.isActive
                          ? [
                              { id: 1, value: 1, label: "Sərbəst" },
                              { id: 2, value: 2, label: "EAN-13" },
                            ]
                          : [
                              {
                                id: 1,
                                value: 1,
                                label: "Sərbəst",
                              },
                            ]
                      }
                      setData={() => {}}
                      fetchData={() => {}}
                      async={false}
                      filter={{}}
                      control={control}
                      name="barcodeType"
                      disabled={!autoGenerate}
                    />
                  </View>
                </View>
              </View>
            )}
            <ProFormInput
              label="Məhsulun kodu"
              name="productCode"
              control={control}
              minLength={3}
            />
            {!fromPurchase && (
              <ProAsyncSelect
                label="Marka"
                data={brands}
                setData={setBrands}
                fetchData={fetchBrands}
                async
                filter={{ limit: 20, page: 1 }}
                control={control}
                name="brand"
              />
            )}
            <View style={{ display: "flex", flexDirection: "row", gap: 8 }}>
              <ProAsyncSelect
                label="Əsas ölçü vahidi"
                required
                data={measurements}
                setData={setMeasurements}
                fetchData={fetchMeasurements}
                async
                filter={{ limit: 20, page: 1 }}
                control={control}
                name="measurement"
                width="49%"
              />

              <ProFormInput
                label="Qiymət"
                name="price"
                control={control}
                width="49%"
                keyboardType="numeric"
                handleChange={(val) => {
                  setValue("price", Platform.OS === 'ios'? changeNumber(`${val}`) : val);
                }}
              />
            </View>
            <ProAsyncSelect
              label="Valyuta"
              required
              data={currencies}
              setData={setCurrencies}
              fetchData={getCurrencies}
              async={false}
              filter={{
                limit: 1000,
              }}
              control={control}
              allowClear={false}
              name="currency"
            />

            {fromPurchase && (
              <View style={{ display: "flex", flexDirection: "row", gap: 5 }}>
                <Checkbox
                  onValueChange={(event) => setMoreChecked(event)}
                  value={moreChecked}
                  style={{ marginLeft: "8px" }}
                />
                <Text style={{ marginRight: 5 }}>Daha çox məlumat</Text>
              </View>
            )}

            {fromPurchase && moreChecked && (
              <>
                <ProAsyncSelect
                  label="Marka"
                  data={brands}
                  setData={setBrands}
                  fetchData={fetchBrands}
                  async
                  filter={{ limit: 20, page: 1 }}
                  control={control}
                  name="brand"
                />
                <View style={{ display: "flex", flexDirection: "row", gap: 5 }}>
                  <ProFormInput
                    label="Barkod"
                    name="barcode"
                    control={control}
                    minLength={3}
                    width="50%"
                    disabled={autoGenerate}
                    maxLength={
                      getValues("barcodeType") === 1
                        ? freeBarcodTypes?.[0]?.length || 30
                        : barcodeTypes?.length
                    }
                  />
                  <View
                    style={{
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <View
                      style={{
                        display: "flex",
                        flexDirection: "row",
                      }}
                    >
                      <Checkbox
                        onValueChange={(event) =>
                          handleAutoGenerateCheckbox(event)
                        }
                        value={autoGenerate}
                      />
                      <Text style={{ marginLeft: 3 }}>Avto generasiya</Text>
                    </View>
                    <View>
                      <ProAsyncSelect
                        allowClear={false}
                        data={
                          barcodeTypes?.isActive
                            ? [
                                { id: 1, value: 1, label: "Sərbəst" },
                                { id: 2, value: 2, label: "EAN-13" },
                              ]
                            : [
                                {
                                  id: 1,
                                  value: 1,
                                  label: "Sərbəst",
                                },
                              ]
                        }
                        setData={() => {}}
                        fetchData={() => {}}
                        async={false}
                        filter={{}}
                        control={control}
                        name="barcodeType"
                        disabled={!autoGenerate}
                      />
                    </View>
                  </View>
                </View>
                <ProFormInput
                  multiline={true}
                  label="Əlavə məlumat"
                  name="description"
                  control={control}
                  style={{ textAlignVertical: "top" }}
                  maxLength={1000}
                />
              </>
            )}

            {!fromPurchase && (
              <ProFormInput
                multiline={true}
                label="Əlavə məlumat"
                name="description"
                control={control}
                style={{ textAlignVertical: "top" }}
                maxLength={1000}
              />
            )}
          </View>
          <View style={{ display: "flex", flexDirection: "row" }}>
            <ProButton
              label={fromPurchase ? "Məhsul əlavə et" : "Təsdiq et"}
              type="primary"
              onClick={handleSubmit(onSubmit)}
              loading={loading}
            />
            {!fromPurchase && (
              <ProButton
                label="İmtina"
                type="transparent"
                onClick={() =>
                  navigation.navigate("Hesabat", {
                    screen: "DashboardTabs",
                    initial: true,
                  })
                }
              />
            )}
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
    BUSINESS_TKN_UNIT,
    loading,
    businessUnit,
    id,
    control,
    fromPurchase,
  } = props;

  const [data, setData] = useState(tableData);
  const [productsByName, setProductsByName] = useState([]);
  const [catalogModalIsVisible, setCatalogModalIsVisible] = useState(false);
  const [productsToHandle, setProductsToHandle] = useState([]);
  const [products, setProducts] = useState([]);

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

    let checkQuantity = Platform.OS === 'ios' ? changeNumber(newQuantity) : newQuantity
    if (re_amount.test(checkQuantity) && (checkQuantity <= limit || draftMode)) {
      setProductQuantity(productId, checkQuantity, transfer, totalPrice);
    }
    if (checkQuantity === "") {
      setProductQuantity(productId, undefined, transfer);
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
    setData({
      ...data,
      tableData: selectedProducts.map(
        (
          {
            name,
            invoiceQuantity,
            quantity,
            unitOfMeasurementName,
            productUniqueId,
            id,
            catalog,
            unitOfMeasurements,
            unitOfMeasurementID,
          },
          index
        ) => {
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

  const handleSearch = useMemo(
    () =>
      debounce((event, page, isScroll) => {
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
          type: "products",
        });
      }, 300),
    []
  );

  const transformUniqueIdData = (productsArr = []) =>
    productsArr.map((product) => ({
      ...product,
      productId: product.id,
      id: `${product.id}${product?.unitOfMeasurementId}`,
    }));

  const handleSelectValue = (productId) => {
    const newProduct = productsByName.find(
      (product) => product.id === productId
    );

    fetchProducts({
      filter: {
        ids: [newProduct?.id],
        withUnitOfMeasurements: 1,
      },
    }).then((data) => {
      const newProductUnitMesaurement = [
        {
          id: data[0]?.unitOfMeasurementId,
          unitOfMeasurementName: data[0]?.unitOfMeasurementName,
          coefficient: 1,
          coefficientRelativeToMain: 1,
          barcode: newProduct.barcode,
        },
        ...(data[0]?.unitOfMeasurements?.map((unit) => ({
          ...unit,
          id: unit.unitOfMeasurementId,
        })) ?? []),
      ];

      setSelectedProducts(
        [
          ...selectedProducts,
          {
            ...newProduct,
            productUniqueId: uuid(),
            unitOfMeasurementID: data[0]?.unitOfMeasurementId,
            unitOfMeasurements: newProductUnitMesaurement,
          },
        ].map((product) => {
          return {
            ...product,
            invoiceQuantity: product.invoiceQuantity
              ? product.invoiceQuantity
              : 1,
          };
        })
      );
    });
  };

  return (
    <View style={styles.container}>
      <AddFromCatalog
        getValues={getValues}
        selectedProducts={selectedProducts}
        isVisible={catalogModalIsVisible}
        setModalVisible={setCatalogModalIsVisible}
        setSelectedProducts={setSelectedProducts}
        productsToHandle={productsToHandle}
        setProductsToHandle={setProductsToHandle}
      />

      <View>
        <ProFormInput
          label="Təyin olunmuş say"
          required
          name="quantity"
          control={control}
          checkPositive
          keyboardType="numeric"
        />
      </View>

      <View
        style={{
          display: "flex",
          flexDirection: "row",
          gap: 10,
          alignItems: "flex-end",
        }}
      >
        <View
          style={{ display: "flex", flexDirection: "column", width: "50%" }}
        >
          <Text>Məhsul axtar:</Text>
          <View
            style={{
              display: "flex",
              flexDirection: "row",
              width: "100%",
              alignItems: "center",
            }}
          >
            <View style={{ width: "100%" }}>
              <ProAsyncSelect
                data={
                  selectedProducts.length > 0
                    ? products.filter(
                        (item) =>
                          !selectedProducts
                            .map(({ id }) => id)
                            .includes(item.id) && item.id !== Number(id)
                      )
                    : products.filter((product) => product.id !== Number(id))
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
          </View>
        </View>
        <ProButton
          label="Kataloqdan seç"
          type="primary"
          defaultStyle={{ borderRadius: 5 }}
          onClick={() => {
            setCatalogModalIsVisible(true);
          }}
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
          label={fromPurchase ? "Məhsul əlavə et" : "Təsdiq et"}
          type="primary"
          onClick={handleSubmit(onSubmit)}
          loading={loading}
        />
        {!fromPurchase && (
          <ProButton
            label="İmtina"
            type="transparent"
            onClick={() =>
              navigation.navigate("Hesabat", {
                screen: "DashboardTabs",
                initial: true,
              })
            }
          />
        )}
      </View>
    </View>
  );
};

const AddProduct = ({
  navigation,
  route,
  fromPurchase = false,
  selectedPurchaseProducts,
  setSelectedPurchaseProducts,
  setAddProductModal,
}) => {
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
  const [isServiceType, setIsServiceType] = useState(true);
  const [selectedCatalog, setSelectedCatalog] = useState(undefined);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [index, setIndex] = React.useState(0);
  const [loading, setLoading] = useState(false);
  const [openWarningModal, setOpenWarningModal] = useState(false);
  const [modalData, setModalData] = useState([]);
  const [freeBarcodTypes, setFreeBarcodeTypes] = useState([]);
  const [catalogs, setCatalogs] = useState([]);

  const [routes, setRoutes] = useState([
    { key: "first", title: "Əsas məlumat" },
    { key: "second", title: "Tərkib", isDisabled: true },
  ]);

  const { profile, BUSINESS_TKN_UNIT, tableSettings, permissionsByKeyValue } =
    useContext(TenantContext);

  useEffect(() => {
    fetchFreeBarcodeTypes({}).then((res) => {
      setFreeBarcodeTypes(res);
    });
  }, []);

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

  // Manipulate selected products to api required form.
  const handleSelectedProducts = (selectedProducts) =>
    selectedProducts.map(
      ({
        id: productId,
        invoiceQuantity,
        serialNumbers,
        cost,
        unitOfMeasurementID,
      }) => {
        return {
          product: productId,
          materialQuantity: Number(invoiceQuantity),
          quantity: getValues("quantity") || 1,
          unitOfMeasurement: unitOfMeasurementID,
          price: Number(cost),
          serialNumber_ul: serialNumbers || [],
        };
      }
    );

  const handleCreateInvoice = (id, newProduct, catalog) => {
    let newPurchaseInvoice = {};
    newPurchaseInvoice = {
      products_ul: handleSelectedProducts(selectedProducts),
    };

    createCompositon({
      id: id,
      data: newPurchaseInvoice,
    })
      .then((res) => {
        if (fromPurchase) {
          fetchMeasurements({
            ids: [newProduct?.unitOfMeasurement],
          }).then((measurement) => {
            setSelectedPurchaseProducts([
              ...selectedPurchaseProducts,
              {
                ...newProduct,
                isVatFree: res?.isVatFree || false,
                catalog: {
                  isWithoutSerialNumber:
                    getValues("serialNumber") === 2
                      ? true
                      : catalogs?.find(
                          (catalogRoot) => catalogRoot.id === catalog
                        )?.isWithoutSerialNumber,
                },
                id,
                productId: id,
                productUniqueId: uuid(),
                unitOfMeasurementID: measurement[0]?.id,
                unitOfMeasurements: [
                  {
                    id: measurement[0]?.id,
                    unitOfMeasurementName: measurement[0]?.name,
                    coefficient: 1,
                    coefficientRelativeToMain: 1,
                  },
                ],

                discountAmount: 0,
                discountPercentage: 0,
                discountedPrice: 0.0,
                invoicePrice: "0.00",
                invoiceQuantity: catalogs?.find(
                  (catalogRoot) => catalogRoot.id === catalog
                )?.isWithoutSerialNumber
                  ? 1
                  : null,
              },
            ]);
            Toast.show({
              type: "success",
              text1: "Əməliyyat uğurla tamamlandı",
            });
            setAddProductModal(false);
          });
        } else {
          Toast.show({
            type: "success",
            text1: "Əməliyyat uğurla tamamlandı",
          });
          navigation.navigate("Hesabat", {
            screen: "DashboardTabs",
            initial: true,
          });
        }
      })
      .catch((error) => setLoading(false));
  };

  const createNewProduct = (data) => {
    setLoading(true);
    const {
      catalog,
      subCatalog,
      productName,
      barcode,
      productCode,
      manufacturer,
      price,
      measurement,
      currency,
      prices,
      description,
      brand,
      barcodeType,
      minimumStockQuantity,
      serialNumber,
      productType,
      mainRoadTax,
      mainRoadTaxCurrency,
      lifetime,
      totalVolume,
      totalWeight,
    } = data;

    if (
      selectedProducts.some(
        ({ invoiceQuantity }) => Number(invoiceQuantity || 0) === 0
      )
    ) {
      errorMessage = "Say qeyd edilməyən məhsul mövcuddur";
      Toast.show({
        type: "error",
        text1: errorMessage,
        topOffset: 50,
      });
    } else {
      const newProduct = {
        isExcluded: null,
        isVatFree: true,
        isVatIncluded: null,
        brand: brand || null,
        discount: "",
        name: productName || null,
        barcode: barcode || null,
        barcodeConfiguration:
          barcodeType === 1
            ? freeBarcodTypes.length > 0
              ? barcodeType
              : null
            : barcodeType,
        productCode: productCode || null,
        catalog: subCatalog || catalog,
        manufacturer: manufacturer || null,
        unitOfMeasurement: measurement || null,
        description: description || null,
        currency: currency || null,
        salesPrice: String(price ?? ""),
        productPrices_ul: [],
        labels_ul: [],
        lifetime: lifetime || null,
        volumePerUnit: Number(totalVolume) || null,
        weightPerUnit: Number(totalWeight) || null,
        isRoadTaxActive: false,
        roadTaxes_ul: [],
        minimumStockQuantity: minimumStockQuantity || null,
        ...(selectedCatalog?.isServiceType === null
          ? {
              isWithoutSerialNumber: serialNumber === 2 ? true : false,
              isServiceType: productType === 2 ? true : false,
            }
          : []),
        ...(selectedCatalog?.isServiceType === false &&
        selectedCatalog?.isWithoutSerialNumber === null
          ? {
              isWithoutSerialNumber: serialNumber === 2 ? true : false,
            }
          : []),
        attachment: undefined, //attachment?.[0].response.data.id,
        unitOfMeasurements_ul: [],
      };

      createProduct({
        data: newProduct,
      })
        .then((res) => {
          handleCreateInvoice(res.id, newProduct, catalog);
        })
        .catch((error) => {
          setLoading(false);
          const errorKey = error?.response?.data?.error?.messageKey;
          if (errorKey) {
            Toast.show({
              type: "error",
              text1: messages[errorKey],
            });
          } else if (
            error?.response?.data?.error?.message ===
            "This barcode is already exists."
          ) {
            Toast.show({
              type: "error",
              text1: "Bu barkod artıq təyin edilib",
            });
          } else if (
            error?.response?.data?.error?.message ===
              "This product is already exists." ||
            error?.response?.data?.error?.message ===
              "Bu adda məhsul artıq mövcüddür."
          ) {
            Toast.show({
              type: "error",
              text1: "Bu adda məhsul artıq mövcüddür.",
            });
          } else if (
            error?.response?.data?.error?.message === "This product is used."
          ) {
            Toast.show({
              type: "error",
              text1:
                "Bu məhsul ilə əməliyyat edildiyi üçün məhsulun kataloqunu dəyişmək mümkün deyil",
            });
          } else if (
            error?.response?.data?.error?.message ===
            "Unit of measurement is not found."
          ) {
            Toast.show({
              type: "error",
              text1: "Seçilmiş ölçü vahidi silinmişdir",
            });
          } else if (
            error?.response?.data?.error?.message ===
            "Seçilən ölçü vahidləri təkrarlanmamalıdır!"
          ) {
            Toast.show({
              type: "error",
              text1: "Seçilən ölçü vahidləri təkrarlanmamalıdır",
            });
          }
        });
    }
  };

  const onSubmit = (values) => {
    const productCode = getValues("productCode");

    if (productCode) {
      fetchProducts({
        filter: {
          product_code_equal: productCode || "",
          isDeleted: 0,
        },
      }).then((data) => {
        if (data.length <= 1 || data[0].id === -1) {
          createNewProduct(values);
        } else {
          setModalData(data);
          setOpenWarningModal(true);
        }
      });
    } else {
      createNewProduct(values);
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
            businessUnit={businessUnit}
            id={id}
            invoiceInfo={invoiceInfo}
            isServiceType={isServiceType}
            setIsServiceType={setIsServiceType}
            selectedCatalog={selectedCatalog}
            setSelectedCatalog={setSelectedCatalog}
            freeBarcodTypes={freeBarcodTypes}
            fromPurchase={fromPurchase}
            catalogs={catalogs}
            setCatalogs={setCatalogs}
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
            handleProductPriceType={handleProductPriceType}
            businessUnit={businessUnit}
            id={id}
            invoiceInfo={invoiceInfo}
            control={control}
            fromPurchase={fromPurchase}
          />
        );
      default:
        return null;
    }
  };

  const renderTabBar = (props) => (
    <TabBar
      {...props}
      style={styles.tabbar}
      renderLabel={({ route, focused, color }) => {
        const isDisabled = route.key === "second" && isServiceType;
        return (
          <Text
            style={{
              color: isDisabled ? "gray" : "white",
              opacity: isDisabled ? 0.5 : 1,
              fontSize: 18,
            }}
          >
            {route.title}
          </Text>
        );
      }}
      onTabPress={({ route, preventDefault }) => {
        if (route.key === "second" && isServiceType) {
          preventDefault();
        }
      }}
    />
  );

  return (
    <SafeAreaProvider>
      <ProWarningModal
        open={openWarningModal}
        bodyContent={
          <View
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              paddingLeft: "80px",
              paddingTop: "15px",
            }}
          >
            {modalData.map((item, index) => {
              return (
                <Text>
                  {`${index + 1}. ${item.name} (${item.productCode})`}
                </Text>
              );
            })}
          </View>
        }
        continueText="Davam et"
        okFunc={() => {
          createNewProduct(getValues());
        }}
        onCancel={() => setOpenWarningModal(false)}
        bodyTitle="Təyin olunan “məhsulun kodu” aşağıdakı məhsullara tətbiq olunub:"
      />
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
          onIndexChange={(newIndex) => {
            setIndex(newIndex);
          }}
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

export default AddProduct;
