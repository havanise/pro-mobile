/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from "react";
import { StyleSheet, View, Modal, Pressable, Text } from "react-native";
import { AntDesign } from "@expo/vector-icons";
import { TabBar, TabView } from "react-native-tab-view";
import {
  fetchSalesInvoiceList,
  getCompositon,
  getCounterparties,
} from "../../../../api";
import ProductDetails from "./productDetails";
import CompositionDetails from "./compositionDetails";
import OtherMeasurementTab from "./OtherMeasurementTab";
import IncomeInvoice from "./IncomeInvoice";
import { defaultNumberFormat } from "../../../../utils";
import { useApi } from "../../../../hooks";
import { fetchMainCurrency } from "../../../../api/currencies";

const ProductDetail = ({
  isVisible,
  handleModal,
  row,
  allBusinessUnits,
  profile,
}) => {
  const { id } = row;
  const [index, setIndex] = useState(0);
  const [data, setData] = useState(null);
  const [counterparties, setCounterparties] = useState([]);
  const [incomeInvoice, setIncomeInvoice] = useState([]);
  const [excludedGoodsInvoice, setExcludedGoodsInvoice] = useState([]);
  const [priceTypes, setPriceTypes] = useState([]);
  const [product, setProduct] = useState({});
  const [mainCurrency, setMainCurrency] = useState();
  const [routes, setRoutes] = useState([
    { key: "first", title: "Əlavə məlumat" },
    { key: "fourth", title: "Daxil olma" },
    { key: "fifth", title: "Xaric olma" },
  ]);

  useEffect(() => {
    if (data && data.length > 0 && product?.unitOfMeasurements?.length > 0) {
      setRoutes([
        { key: "first", title: "Əlavə məlumat" },
        { key: "second", title: "Tərkib" },
        { key: "third", title: "Digər ölçü vahidləri" },
        { key: "fourth", title: "Daxil olma" },
        { key: "fifth", title: "Xaric olma" },
      ]);
    } else if (data && data.length > 0) {
      setRoutes([
        { key: "first", title: "Əlavə məlumat" },
        { key: "second", title: "Tərkib" },
        { key: "fourth", title: "Daxil olma" },
        { key: "fifth", title: "Xaric olma" },
      ]);
    } else if (product?.unitOfMeasurements?.length > 0) {
      setRoutes([
        { key: "first", title: "Əlavə məlumat" },
        { key: "third", title: "Digər ölçü vahidləri" },
        { key: "fourth", title: "Daxil olma" },
        { key: "fifth", title: "Xaric olma" },
      ]);
    }
  }, [data, product]);

  useEffect(() => {
    fetchMainCurrency().then((res) => {
      setMainCurrency(res);
    });
  }, []);

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

  useEffect(() => {
    if (id) {
      setExcludedGoodsInvoice([]);
      setIncomeInvoice([]);
      runCounterParty({
        filter: {
          limit: 20,
          page: 1,
        },
      });

      getCompositon({
        id: id,
      }).then((res) => {
        setData(res);
      });

      // fetchSalesInvoiceList({
      //   filter: {
      //     stockIncreaseType: 1,
      //     products: [id],
      //     isDeleted: 0,
      //     includeTransfer: 0,
      //     showProductPricePerItem: 1,
      //     limit: 1000,
      //   },
      //   withResp: true,
      // }).then((res) => {
      //   setIncomeInvoice(res.data);
      //   setPriceTypes([
      //     {
      //       name: "Ortalama maya dəyəri:",
      //       value: Number(defaultNumberFormat(res?.avgPrice) || "-"),
      //     },
      //     {
      //       name: "Maksimal maya dəyəri:",
      //       value: Number(defaultNumberFormat(res?.maxPrice) || "-"),
      //     },
      //     {
      //       name: "Minimal maya dəyəri:",
      //       value: Number(defaultNumberFormat(res?.minPrice) || "-"),
      //     },
      //   ]);
      // });

      // fetchSalesInvoiceList({
      //   filter: {
      //     stockDecreaseType: 1,
      //     products: [id],
      //     isDeleted: 0,
      //     includeTransfer: 0,
      //     limit: 1000,
      //   },
      // }).then((res) => {
      //   setExcludedGoodsInvoice(res);
      // });
    }
  }, [id]);

  const renderScene = ({ route }) => {
    switch (route.key) {
      case "first":
        return (
          <ProductDetails row={row} product={product} setProduct={setProduct} />
        );
      case "second":
        return <CompositionDetails data={data} row={row} />;
      case "third":
        return <OtherMeasurementTab row={row} product={product} />;
      case "fourth":
        return (
          <IncomeInvoice
            mainCurrency={mainCurrency}
            // permissionsByKeyValue={permissionsByKeyValue}
            details={incomeInvoice}
            titleName={row.product_name}
            titleStock={row.stock_name}
            moduleTitle={"Daxil olma"}
            type={true}
            setIncomeInvoice={setIncomeInvoice}
            id={id}
            priceTypes={priceTypes}
            allBusinessUnits={allBusinessUnits}
            counterparties={counterparties}
            setCounterparties={setCounterparties}
          />
        );
      case "fifth":
        return (
          <IncomeInvoice
            mainCurrency={mainCurrency}
            // permissionsByKeyValue={permissionsByKeyValue}
            details={excludedGoodsInvoice}
            titleName={row.product_name}
            titleStock={row.stock_name}
            moduleTitle={"Xaric olma"}
            setExcludedGoodsInvoice={setExcludedGoodsInvoice}
            id={id}
            allBusinessUnits={allBusinessUnits}
            counterparties={counterparties}
            setCounterparties={setCounterparties}
          />
        );
      default:
        return null;
    }
  };

  const renderBadge = ({ route }) => {
    if (route.key === "albums") {
      return (
        <View>
          <Text>42</Text>
        </View>
      );
    }
    return null;
  };

  const renderTabBar = (props) => (
    <TabBar
      {...props}
      scrollEnabled
      renderBadge={renderBadge}
      // labelStyle={{ color: "#37B874" }}
      style={styles.tabbar}
    />
  );

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={() => {
        handleModal(false);
      }}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <TabView
            navigationState={{ index, routes }}
            renderScene={renderScene}
            onIndexChange={setIndex}
            renderTabBar={renderTabBar}
            swipeEnabled={false}
          />

          <Pressable style={[styles.button]} onPress={() => handleModal(false)}>
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
    marginTop: 22,
  },
  modalView: {
    width: "90%",
    height: "80%",
    padding: 30,
    margin: 20,
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
    borderColor: "transparent",
  },
  tabbar: {
    backgroundColor: "#37B874",
  },
});

export default ProductDetail;
