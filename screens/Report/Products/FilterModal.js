/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Modal,
  Pressable,
  Text,
  ScrollView,
  TextInput,
} from "react-native";
import { AntDesign } from "@expo/vector-icons";
import CheckBox from "expo-checkbox";
import { ProAsyncSelect, ProButton, ProText } from "../../../components";
import ProSearch from "../../../components/ProSearch";
import {
  fetchBrands,
  fetchSalesProductsFromCatalog,
  getCounterparties,
  getProducts,
  getStock,
} from "../../../api";
import { useApi } from "../../../hooks";
import {
  fetchMeasurements,
  fetchSalesCatalogs,
  fetchLabels,
} from "../../../api/sale";

const FilterModal = ({
  isVisible,
  setIsVisible,
  setFilterCount,
  filter,
  setFilter,
  onBlur,
}) => {
  const [stocks, setStock] = useState([]);
  const [filterSelectedStocks, setFilterSelectedStocks] = useState([]);

  const [filterSelectedProduct, setFilterSelectedProduct] = useState([]);
  const [products, setProducts] = useState([]);

  const [productsCode, setProductsCode] = useState([]);

  const [brands, setBrands] = useState([]);
  const [filterSelectedBrands, setFilterSelectedBrands] = useState([]);

  const [manufacturers, setManufacturers] = useState([]);
  const [filterSelectedManufacturers, setFilterSelectedManufacturers] =
    useState([]);

  const [measurements, setMeasurements] = useState([]);
  const [filterSelectedMeauserments, setFilterSelectedMeauserments] = useState(
    []
  );

  const [catalogs, setCatalogs] = useState([]);
  const [childCatalogs, setChildCatalogs] = useState([]);

  const [labels, setLabels] = useState([]);
  const [childLabels, setChildLabels] = useState([]);

  const [filters, setFilters] = useState({
    hasLabel: undefined,
    serialNumber: undefined,
    inStock: undefined,
    withSalesDraftProductsQuantity: undefined,
    hasRoadTax: undefined,
    isDeleted: 0,
    hasBarcode: undefined,
    haveUnitOfMeasurements: undefined,
    hasMaterials: undefined,
    usedInConsignment: undefined,
    usedInBron: undefined,
    type: undefined,
    stocks: [],
    unitOfMeasurementIds: undefined,

    // searchText: "",
    // tags: [],
    // priceRange: { min: 0, max: 1000 },
  });

  const handleConfirmClick = () => {
    let count = 0;

    if (filters.inStock) count++;
    if (filters.serialNumber) count++;
    if (filters.hasLabel) count++;
    if (filters.withSalesDraftProductsQuantity) count++;
    if (filters.hasRoadTax) count++;
    if (filters.isDeleted === undefined || filters.isDeleted === 1) count++;
    if (filters.hasBarcode) count++;
    if (filters.haveUnitOfMeasurements) count++;
    if (filters.hasMaterials) count++;
    if (filters.usedInConsignment) count++;
    if (filters.usedInBron) count++;
    if (filters.type) count++;
    if (filters.stocks?.length > 0) count++;
    if (filters.brands?.length > 0) count++;
    if (filters.ids?.length > 0) count++;
    if (filters.manufacturers?.length > 0) count++;
    if (filters.parentCatalogIds?.length > 0) count++;
    if (filters.catalogIds?.length > 0) count++;
    if (filters.parentLabels?.length > 0) count++;
    if (filters.labels?.length > 0) count++;
    if (filters.unitOfMeasurementIds?.length > 0) count++;
    if (filters.description && filters.description !== "") count++;
    if (filters.q && filters.q !== "") count++;
    if (filters.id && filters.id !== "") count++;
    if (filters.brandName && filters.brandName !== "") count++;
    if (filters.barcode && filters.barcode !== "") count++;
    if (filters.productCodeName && filters.productCodeName !== "") count++;
    if (filters.product_code && filters.product_code !== "") count++;
    if (filters.roadTaxFrom && filters.roadTaxFrom !== "") count++;
    if (filters.roadTaxTo && filters.roadTaxTo !== "") count++;
    if (filters.quantityFrom && filters.quantityFrom !== "") count++;
    if (filters.quantityTo && filters.quantityTo !== "") count++;

    // if (filters.priceRange.min > 0 || filters.priceRange.max < 1000) count++;

    setFilterCount(count);
    setFilter({ ...filter, ...filters });
    setIsVisible(false);
  };

  React.useEffect(() => {
    if (onBlur) {
      setFilter({
        limit: 8,
        page: 1,
        withRoadTaxes: 1,
        withAttachmentUrl: 1,
        sort: "desc",
        orderBy: "id",
        isDeleted: 0,
      });
      setFilters({ stocks: [] });
      setFilterCount(0)
    }
  }, [onBlur]);

  const { isLoading, run: runCatalog } = useApi({
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

  const updateFilter = (key, value) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      [key]: value,
    }));
  };

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

  const { isLoading: isLoadLabel, run: runLabels } = useApi({
    deferFn: fetchLabels,
    onResolve: (data) => {
      setLabels(
        data.map((item) => ({ ...item, label: item.name, value: item.id }))
      );
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

  const { isLoading: isLoadProducts, run: runProducts } = useApi({
    deferFn: fetchSalesProductsFromCatalog,
    onResolve: (data) => {
      setProducts(
        data.map((item) => ({ ...item, label: item.name, value: item.id }))
      );
    },
    onReject: (error) => {
      console.log(error, "rejected");
    },
  });

  const { isLoading: isLoadProductsCode, run: runProductsCode } = useApi({
    deferFn: fetchSalesProductsFromCatalog,
    onResolve: (data) => {
      setProductsCode(
        data.map((item) => ({
          ...item,
          label:
            item.productCode !== null
              ? `${item.name} / ${item.productCode}`
              : item.name,
          value: item.id,
        }))
      );
    },
    onReject: (error) => {
      console.log(error, "rejected");
    },
  });

  const { isLoading: isLoadManufactures, run: runManufactures } = useApi({
    deferFn: getCounterparties,
    onResolve: (data) => {
      setManufacturers(
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
    runLabels({
      filter: {},
    });
    runStock({
      filter: {
        limit: 20,
        page: 1,
      },
    });
    runCatalog({
      filter: {
        limit: 20,
        page: 1,
      },
    });
    runBrands({
      filter: {
        limit: 20,
        page: 1,
      },
    });
    runProducts({
      filter: {
        limit: 20,
        page: 1,
        isDeleted: 0,
      },
    });
    runProductsCode({
      filter: {
        limit: 20,
        page: 1,
        isDeleted: 0,
      },
    });
    runManufactures({
      filter: {
        limit: 20,
        page: 1,
        categories: [8],
      },
    });
    runMeasurements({
      filter: {
        limit: 20,
        page: 1,
      },
    });
  }, []);

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={() => {
        setIsVisible(false);
      }}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <ProText
            variant="heading"
            style={{ color: "black", marginBottom: 20 }}
          >
            Məhsullar
          </ProText>
          <ScrollView>
            <View style={{ gap: 20 }}>
              <View style={{ display: "flex", flexDirection: "column" }}>
                <Text>Məhsul növü</Text>

                <ProAsyncSelect
                  data={[
                    { id: "product", value: "product", label: "Məhsul" },
                    { id: "service", value: "service", label: "Xidmət" },
                  ]}
                  setData={() => {}}
                  fetchData={() => {}}
                  filter={{}}
                  notForm
                  defaultValue={filters.type}
                  handleSelectValue={(val) => {
                    updateFilter("type", val);
                  }}
                />
              </View>
              <View>
                <Text style={{ marginBottom: 5 }}>Anbarlı/Anbarsız</Text>
                <View
                  style={{ display: "flex", flexDirection: "row", gap: 10 }}
                >
                  <ProButton
                    label="Hamısı"
                    selected={filters.inStock === undefined}
                    type={"tab"}
                    defaultStyle={{ borderRadius: 5 }}
                    buttonBorder={styles.buttonStyle}
                    onClick={() => {
                      updateFilter("inStock", undefined);
                    }}
                    // loading={isLoading}
                  />
                  <ProButton
                    label="Hə"
                    selected={filters.inStock === 1}
                    type={"tab"}
                    defaultStyle={{ borderRadius: 5 }}
                    buttonBorder={styles.buttonStyle}
                    onClick={() => {
                      updateFilter("inStock", 1);
                    }}
                  />
                  <ProButton
                    label="Yox"
                    selected={filters.inStock === 0}
                    type={"tab"}
                    defaultStyle={{ borderRadius: 5 }}
                    buttonBorder={styles.buttonStyle}
                    onClick={() => {
                      updateFilter("inStock", 0);
                    }}
                  />
                </View>
              </View>
              <View style={{ display: "flex", flexDirection: "column" }}>
                <Text>Anbar</Text>
                <ProAsyncSelect
                  isMulti
                  async
                  defaultValue={filters.stocks}
                  disabled={filters.inStock == 0 ? true : false}
                  data={
                    filterSelectedStocks.length > 0
                      ? [
                          {
                            label: "Konsiqnasiya anbarı",
                            name: "Konsiqnasiya anbarı",
                            id: 0,
                            value: 0,
                          },
                          ...filterSelectedStocks,
                          ...stocks.filter(
                            (item) =>
                              !filterSelectedStocks
                                .map(({ id }) => id)
                                ?.includes(item.id) && item.id !== 0
                          ),
                        ]
                      : [
                          {
                            label: "Konsiqnasiya anbarı",
                            name: "Konsiqnasiya anbarı",
                            id: 0,
                            value: 0,
                          },
                          ...stocks.filter((item) => item.id !== 0),
                        ]
                  }
                  setData={setStock}
                  fetchData={getStock}
                  filter={{ limit: 20, page: 1 }}
                  notForm
                  handleSelectValue={({ list }) => {
                    updateFilter("stocks", list);
                  }}
                />
              </View>
              <View>
                <Text style={{ marginBottom: 5 }}>Seriya nömrə</Text>
                <View
                  style={{ display: "flex", flexDirection: "row", gap: 10 }}
                >
                  <ProButton
                    label="Hamısı"
                    selected={filters.serialNumber === undefined}
                    type={"tab"}
                    defaultStyle={{ borderRadius: 5 }}
                    buttonBorder={styles.buttonStyle}
                    onClick={() => {
                      updateFilter("serialNumber", undefined);
                    }}
                    // loading={isLoading}
                  />
                  <ProButton
                    label="Hə"
                    selected={filters.serialNumber === 1}
                    type={"tab"}
                    defaultStyle={{ borderRadius: 5 }}
                    buttonBorder={styles.buttonStyle}
                    onClick={() => {
                      updateFilter("serialNumber", 1);
                    }}
                  />
                  <ProButton
                    label="Yox"
                    selected={filters.serialNumber === 0}
                    type={"tab"}
                    defaultStyle={{ borderRadius: 5 }}
                    buttonBorder={styles.buttonStyle}
                    onClick={() => {
                      updateFilter("serialNumber", 0);
                    }}
                  />
                </View>
              </View>
              <View style={{ display: "flex", flexDirection: "column" }}>
                <Text>Kateqoriya</Text>
                <ProAsyncSelect
                  isMulti
                  async
                  defaultValue={filters.parentCatalogIds}
                  data={catalogs || []}
                  setData={setCatalogs}
                  fetchData={fetchSalesCatalogs}
                  notForm
                  catalog={true}
                  filter={{ limit: 20, page: 1 }}
                  handleSelectValue={({ list }) => {
                    updateFilter("parentCatalogIds", list);
                  }}
                />
              </View>
              <View style={{ display: "flex", flexDirection: "column" }}>
                <Text>Alt kateqoriya</Text>

                <ProAsyncSelect
                  defaultValue={filters.catalogIds}
                  isMulti
                  data={
                    filters.parentCatalogIds &&
                    filters.parentCatalogIds.length > 0
                      ? childCatalogs[filters.parentCatalogIds]?.map(
                          (item) => ({
                            ...item,
                            label: item.name,
                            value: item.id,
                          })
                        )
                      : []
                  }
                  // selectedValueFromParent={selectedChildCatalogId}
                  disabled={
                    !(
                      filters.parentCatalogIds &&
                      filters.parentCatalogIds.length > 0
                    )
                  }
                  setData={() => {}}
                  fetchData={() => {}}
                  notForm
                  filter={{}}
                  handleSelectValue={({ list }) => {
                    updateFilter("catalogIds", list);
                  }}
                />
              </View>
              <View style={{ display: "flex", flexDirection: "column" }}>
                <Text>Məhsul adı (seç)</Text>

                <ProAsyncSelect
                  isMulti
                  defaultValue={filters.ids}
                  async
                  data={
                    filterSelectedProduct.length > 0
                      ? [
                          ...filterSelectedProduct,
                          ...products.filter(
                            (item) =>
                              !filterSelectedProduct
                                .map(({ id }) => id)
                                ?.includes(item.id)
                          ),
                        ]
                      : products
                  }
                  setData={setProducts}
                  fetchData={fetchSalesProductsFromCatalog}
                  filter={{ limit: 20, page: 1, isDeleted: 0 }}
                  notForm
                  handleSelectValue={({ list }) => {
                    updateFilter("ids", list);
                  }}
                />
              </View>
              <View style={{ display: "flex", flexDirection: "column" }}>
                <Text>Məhsul adı (axtar)</Text>
                <ProSearch
                  onSearch={(val) => updateFilter("q", val)}
                  value={filters.q}
                />
              </View>
              <View style={{ display: "flex", flexDirection: "column" }}>
                <Text>Marka (seç)</Text>
                <ProAsyncSelect
                  isMulti
                  defaultValue={filters.brandIds}
                  async
                  data={
                    filterSelectedBrands.length > 0
                      ? [
                          ...filterSelectedBrands,
                          ...brands.filter(
                            (item) =>
                              !filterSelectedBrands
                                .map(({ id }) => id)
                                ?.includes(item.id)
                          ),
                        ]
                      : brands
                  }
                  setData={setBrands}
                  fetchData={fetchBrands}
                  filter={{ limit: 20, page: 1 }}
                  notForm
                  handleSelectValue={({ list }) => {
                    updateFilter("brandIds", list);
                  }}
                />
              </View>
              <View style={{ display: "flex", flexDirection: "column" }}>
                <Text>Marka (axtar)</Text>
                <ProSearch
                  onSearch={(val) => updateFilter("brandName", val)}
                  value={filters.brandName}
                />
              </View>
              <View style={{ display: "flex", flexDirection: "column" }}>
                <Text>Məhsul adı və kodu (seç)</Text>

                <ProAsyncSelect
                  isMulti
                  defaultValue={filters.ids}
                  async
                  withProductCode
                  data={
                    filterSelectedProduct.length > 0
                      ? [
                          ...filterSelectedProduct,
                          ...productsCode.filter(
                            (item) =>
                              !filterSelectedProduct
                                .map(({ id }) => id)
                                ?.includes(item.id)
                          ),
                        ]
                      : productsCode
                  }
                  setData={setProductsCode}
                  fetchData={fetchSalesProductsFromCatalog}
                  filter={{ limit: 20, page: 1, isDeleted: 0 }}
                  notForm
                  handleSelectValue={({ list }) => {
                    updateFilter("ids", list);
                  }}
                />
              </View>
              <View style={{ display: "flex", flexDirection: "column" }}>
                <Text>Məhsul adı və kodu (axtar)</Text>
                <ProSearch
                  onSearch={(val) => updateFilter("productCodeName", val)}
                  value={filters.productCodeName}
                />
              </View>

              <View>
                <Text style={{ marginBottom: 5 }}>Etiketli/Etiketsiz</Text>
                <View
                  style={{ display: "flex", flexDirection: "row", gap: 10 }}
                >
                  <ProButton
                    label="Hamısı"
                    selected={filters.hasLabel === undefined}
                    type={"tab"}
                    defaultStyle={{ borderRadius: 5 }}
                    buttonBorder={styles.buttonStyle}
                    onClick={() => {
                      updateFilter("hasLabel", undefined);
                    }}
                    // loading={isLoading}
                  />
                  <ProButton
                    label="Hə"
                    selected={filters.hasLabel === 1}
                    type={"tab"}
                    defaultStyle={{ borderRadius: 5 }}
                    buttonBorder={styles.buttonStyle}
                    onClick={() => {
                      updateFilter("hasLabel", 1);
                    }}
                  />
                  <ProButton
                    label="Yox"
                    selected={filters.hasLabel === 0}
                    type={"tab"}
                    defaultStyle={{ borderRadius: 5 }}
                    buttonBorder={styles.buttonStyle}
                    onClick={() => {
                      updateFilter("hasLabel", 0);
                    }}
                  />
                </View>
              </View>
              <View style={{ display: "flex", flexDirection: "column" }}>
                <Text>Etiket</Text>
                <ProAsyncSelect
                  isMulti
                  defaultValue={filters.parentLabels}
                  data={labels || []}
                  setData={() => {}}
                  fetchData={() => {}}
                  notForm
                  filter={{}}
                  handleSelectValue={({ list }) => {
                    updateFilter("parentLabels", list);
                    setChildLabels(
                      labels
                        .filter((label) => list.includes(label.id))
                        .flatMap((item) => item.children)
                    );
                  }}
                />
              </View>
              <View style={{ display: "flex", flexDirection: "column" }}>
                <Text>Alt etiket</Text>

                <ProAsyncSelect
                  isMulti
                  defaultValue={filters.labels}
                  data={
                    filters.parentLabels && filters.parentLabels.length > 0
                      ? childLabels?.map((item) => ({
                          ...item,
                          label: item.name,
                          value: item.id,
                        }))
                      : []
                  }
                  // selectedValueFromParent={selectedChildCatalogId}
                  disabled={
                    !(filters.parentLabels && filters.parentLabels.length > 0)
                  }
                  setData={() => {}}
                  fetchData={() => {}}
                  notForm
                  filter={{}}
                  handleSelectValue={({ list }) => {
                    updateFilter("labels", list);
                  }}
                />
              </View>
              <View style={{ display: "flex", flexDirection: "column" }}>
                <Text>ID nömrə</Text>
                <ProSearch
                  onSearch={(val) => updateFilter("id", val)}
                  value={filters.id}
                />
              </View>
              <View style={{ display: "flex", flexDirection: "column" }}>
                <Text>Məhsul kodu</Text>
                <ProSearch
                  onSearch={(val) => updateFilter("product_code", val)}
                  value={filters.product_code}
                />
              </View>
              <View>
                <Text style={{ marginBottom: 5 }}>Anbar qalığı</Text>
                <View style={{ flexDirection: "row", gap: 10 }}>
                  <TextInput
                    value={filters.quantityFrom}
                    keyboardType="numeric"
                    onChangeText={(event) => {
                      updateFilter("quantityFrom", event);
                    }}
                    placeholder="Başlanğıc"
                    style={{
                      height: 40,
                      width: "48%",
                      borderWidth: 1,
                      borderRadius: 5,
                      borderColor: "#b6b6b6",
                      padding: 5,
                    }}
                  />
                  <TextInput
                    value={filters.quantityTo}
                    placeholder="Son"
                    keyboardType="numeric"
                    onChangeText={(event) => {
                      updateFilter("quantityTo", event);
                    }}
                    style={{
                      width: "48%",
                      height: 40,
                      borderWidth: 1,
                      borderRadius: 5,
                      borderColor: "#b6b6b6",
                      padding: 5,
                    }}
                  />
                </View>
              </View>
              <View style={{ display: "flex", flexDirection: "column" }}>
                <Text>Barkod</Text>
                <ProSearch
                  onSearch={(val) => updateFilter("barcode", val)}
                  value={filters.barcode}
                />
              </View>
              <View style={{ display: "flex", flexDirection: "column" }}>
                <Text>İstehsalçı</Text>

                <ProAsyncSelect
                  isMulti
                  defaultValue={filters.manufacturers}
                  async
                  data={
                    filterSelectedManufacturers.length > 0
                      ? [
                          ...filterSelectedManufacturers,
                          ...manufacturers.filter(
                            (item) =>
                              !filterSelectedManufacturers
                                .map(({ id }) => id)
                                ?.includes(item.id)
                          ),
                        ].map((callContacts) => ({
                          ...callContacts,
                          name: `${callContacts.name} (${callContacts.id})`,
                        }))
                      : manufacturers.map((callContacts) => ({
                          ...callContacts,
                          name: `${callContacts.name} (${callContacts.id})`,
                        }))
                  }
                  setData={setManufacturers}
                  fetchData={getCounterparties}
                  filter={{ limit: 20, page: 1, categories: [8] }}
                  notForm
                  handleSelectValue={({ list }) => {
                    updateFilter("manufacturers", list);
                  }}
                />
              </View>
              <View style={{ display: "flex", flexDirection: "column" }}>
                <Text>Ölçü vahidi</Text>

                <ProAsyncSelect
                  isMulti
                  defaultValue={filters.unitOfMeasurementIds}
                  async
                  data={
                    filterSelectedMeauserments.length > 0
                      ? [
                          ...filterSelectedMeauserments,
                          ...measurements.filter(
                            (item) =>
                              !filterSelectedMeauserments
                                .map(({ id }) => id)
                                ?.includes(item.id)
                          ),
                        ]
                      : measurements
                  }
                  setData={setMeasurements}
                  fetchData={fetchMeasurements}
                  filter={{ limit: 20, page: 1 }}
                  notForm
                  handleSelectValue={({ list }) => {
                    updateFilter("unitOfMeasurementIds", list);
                  }}
                />
              </View>
              <View>
                <Text style={{ marginBottom: 5 }}>Status</Text>
                <View
                  style={{ display: "flex", flexDirection: "row", gap: 10 }}
                >
                  <ProButton
                    label="Aktiv"
                    selected={filters.isDeleted === 0}
                    type={"tab"}
                    defaultStyle={{ borderRadius: 5 }}
                    buttonBorder={styles.buttonStyle}
                    onClick={() => {
                      updateFilter("isDeleted", 0);
                    }}
                  />
                  <ProButton
                    label="Silinib"
                    selected={filters.isDeleted === 1}
                    type={"tab"}
                    defaultStyle={{ borderRadius: 5 }}
                    buttonBorder={styles.buttonStyle}
                    onClick={() => {
                      updateFilter("isDeleted", 1);
                    }}
                  />
                  <ProButton
                    label="Hamısı"
                    selected={filters.isDeleted === undefined}
                    type={"tab"}
                    defaultStyle={{ borderRadius: 5 }}
                    buttonBorder={styles.buttonStyle}
                    onClick={() => {
                      updateFilter("isDeleted", undefined);
                    }}
                  />
                </View>
              </View>
              <View>
                <Text style={{ marginBottom: 5 }}>Planlama</Text>
                <View
                  style={{ display: "flex", flexDirection: "row", gap: 10 }}
                >
                  <ProButton
                    label="Hamısı"
                    selected={
                      filters.withSalesDraftProductsQuantity === undefined
                    }
                    type={"tab"}
                    defaultStyle={{ borderRadius: 5 }}
                    buttonBorder={styles.buttonStyle}
                    onClick={() => {
                      updateFilter("withSalesDraftProductsQuantity", undefined);
                    }}
                    // loading={isLoading}
                  />
                  <ProButton
                    label="Hə"
                    selected={filters.withSalesDraftProductsQuantity === 1}
                    type={"tab"}
                    defaultStyle={{ borderRadius: 5 }}
                    buttonBorder={styles.buttonStyle}
                    onClick={() => {
                      updateFilter("withSalesDraftProductsQuantity", 1);
                    }}
                  />
                  <ProButton
                    label="Yox"
                    selected={filters.withSalesDraftProductsQuantity === 0}
                    type={"tab"}
                    defaultStyle={{ borderRadius: 5 }}
                    buttonBorder={styles.buttonStyle}
                    onClick={() => {
                      updateFilter("withSalesDraftProductsQuantity", 0);
                    }}
                  />
                </View>
              </View>
              <View>
                <Text style={{ marginBottom: 5 }}>Yol vergisi</Text>
                <View
                  style={{ display: "flex", flexDirection: "row", gap: 10 }}
                >
                  <ProButton
                    label="Hamısı"
                    selected={filters.hasRoadTax === undefined}
                    type={"tab"}
                    defaultStyle={{ borderRadius: 5 }}
                    buttonBorder={styles.buttonStyle}
                    onClick={() => {
                      updateFilter("hasRoadTax", undefined);
                    }}
                    // loading={isLoading}
                  />
                  <ProButton
                    label="Hə"
                    selected={filters.hasRoadTax === 1}
                    type={"tab"}
                    defaultStyle={{ borderRadius: 5 }}
                    buttonBorder={styles.buttonStyle}
                    onClick={() => {
                      updateFilter("hasRoadTax", 1);
                    }}
                  />
                  <ProButton
                    label="Yox"
                    selected={filters.hasRoadTax === 0}
                    type={"tab"}
                    defaultStyle={{ borderRadius: 5 }}
                    buttonBorder={styles.buttonStyle}
                    onClick={() => {
                      updateFilter("hasRoadTax", 0);
                    }}
                  />
                </View>
              </View>
              <View>
                <Text style={{ marginBottom: 5 }}>Yol vergisi</Text>
                <View style={{ flexDirection: "row", gap: 10 }}>
                  <TextInput
                    value={filters.roadTaxFrom}
                    keyboardType="numeric"
                    onChangeText={(event) => {
                      updateFilter("roadTaxFrom", event);
                    }}
                    placeholder="Başlanğıc"
                    style={{
                      height: 40,
                      width: "48%",
                      borderWidth: 1,
                      borderRadius: 5,
                      borderColor: "#b6b6b6",
                      padding: 5,
                    }}
                  />
                  <TextInput
                    value={filters.roadTaxTo}
                    placeholder="Son"
                    keyboardType="numeric"
                    onChangeText={(event) => {
                      updateFilter("roadTaxTo", event);
                    }}
                    style={{
                      width: "48%",
                      height: 40,
                      borderWidth: 1,
                      borderRadius: 5,
                      borderColor: "#b6b6b6",
                      padding: 5,
                    }}
                  />
                </View>
              </View>
              <View style={{ display: "flex", flexDirection: "column" }}>
                <Text>Əlavə məlumat</Text>
                <ProSearch
                  onSearch={(val) => {
                    updateFilter("description", val);
                  }}
                  value={filters.description}
                />
              </View>
              <View
                style={{
                  display: "flex",
                  flexDirection: "row",
                  marginBottom: 15,
                  gap: 5,
                }}
              >
                <CheckBox
                  onValueChange={(event) =>
                    updateFilter("hasBarcode", event ? 1 : undefined)
                  }
                  value={filters.hasBarcode}
                />
                <Text style={{ marginRight: 5 }}>
                  {"Barkodlu məhsulları göstər"}
                </Text>
              </View>
              <View
                style={{
                  display: "flex",
                  flexDirection: "row",
                  marginBottom: 15,
                  gap: 5,
                }}
              >
                <CheckBox
                  onValueChange={(event) =>
                    updateFilter(
                      "haveUnitOfMeasurements",
                      event ? 1 : undefined
                    )
                  }
                  value={filters.haveUnitOfMeasurements}
                />
                <Text style={{ marginRight: 5 }}>
                  {"Multi-ölçü vahidli məhsullar"}
                </Text>
              </View>
              <View
                style={{
                  display: "flex",
                  flexDirection: "row",
                  marginBottom: 15,
                  gap: 5,
                }}
              >
                <CheckBox
                  onValueChange={(event) =>
                    updateFilter("hasMaterials", event ? 1 : undefined)
                  }
                  value={filters.hasMaterials}
                />
                <Text style={{ marginRight: 5 }}>
                  {"Tərkibli məhsulları göstər"}
                </Text>
              </View>
              <View
                style={{
                  display: "flex",
                  flexDirection: "row",
                  marginBottom: 15,
                  gap: 5,
                }}
              >
                <CheckBox
                  onValueChange={(event) =>
                    updateFilter("usedInBron", event ? 1 : undefined)
                  }
                  value={filters.usedInBron}
                />
                <Text style={{ marginRight: 5 }}>{"Bron olunmuşlar"}</Text>
              </View>
              <View
                style={{
                  display: "flex",
                  flexDirection: "row",
                  marginBottom: 15,
                  gap: 5,
                }}
              >
                <CheckBox
                  onValueChange={(event) =>
                    updateFilter("usedInConsignment", event ? 1 : undefined)
                  }
                  value={filters.usedInConsignment}
                />
                <Text style={{ marginRight: 5 }}>
                  {"Konsiqnasiya verilmişlər"}
                </Text>
              </View>
            </View>
            <View
              style={{ width: "100%", marginTop: 15, alignItems: "flex-end" }}
            >
              <View style={{ width: 150 }}>
                <ProButton
                  label="Təsdiq et"
                  type="primary"
                  onClick={handleConfirmClick}
                  padding={"10px 0"}
                  defaultStyle={{ borderRadius: 10 }}
                />
              </View>
            </View>
          </ScrollView>
          <Pressable
            style={[styles.button]}
            onPress={() => {
              setFilters({
                ...filters,
                hasLabel: filter.hasLabel,
                serialNumber: filter.serialNumber,
                inStock: filter.inStock,
                withSalesDraftProductsQuantity:
                  filter.withSalesDraftProductsQuantity,
                hasRoadTax: filter.hasRoadTax,
                isDeleted: filter.isDeleted,
                hasBarcode: filter.hasBarcode,
                haveUnitOfMeasurements: filter.haveUnitOfMeasurements,
                hasMaterials: filter.hasMaterials,
                usedInConsignment: filter.usedInConsignment,
                usedInBron: filter.usedInBron,
                type: filter.type,
                stocks: filter.stocks,
                parentCatalogIds: filter.parentCatalogIds,
                catalogIds: filter.catalogIds,
                brandIds: filter.brandIds,
                ids: filter.ids,
                unitOfMeasurementIds: filter.unitOfMeasurementIds,
                labels: filter.labels,
                parentLabels: filter.parentLabels,
                manufacturers: filter.manufacturers,
              });
              setIsVisible(false);
            }}
          >
            <AntDesign name="close" size={18} color="black" />
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
  },
  modalView: {
    width: "100%",
    height: "100%",
    padding: 30,
    backgroundColor: "white",
    borderRadius: 5,
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
  buttonStyle: {
    borderWidth: 1,
    borderRadius: 5,
    borderColor: "#d9d9d9",
  },
});

export default FilterModal;
