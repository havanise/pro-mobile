/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from "react";
import { StyleSheet, View, Modal, Pressable, Text } from "react-native";
import { AntDesign } from "@expo/vector-icons";
import { TabBar, TabView } from "react-native-tab-view";
import { fetchSalesInvoiceInfo } from "../../api";
import MoreSaleDetail from "./MoreSaleDetails/MoreSaleDetail";
import InvoiceContain from "./MoreSaleDetails/InvoiceContain";

import math from "exact-math";

const SaleDetail = ({ isVisible, handleModal, row, allBusinessUnits, profile, fromFinance = false }) => {
  const [index, setIndex] = useState(0);
  const [detailsData, setDetailsData] = useState([]);
  const [tableDatas, setTableDatas] = useState([]);
  const [warehouseData, setWarehouseData] = useState([]);
  const [routes, setRoutes] = useState([
    { key: "first", title: "Əlavə məlumat" },
    { key: "second", title: "Qaimənin tərkibi" },
  ]);

  useEffect(() => {
    if (row.id) {
      fetchSalesInvoiceInfo({
        apiEnd: Number(row.id),
      }).then((res) => {
        if (res.invoiceProducts && res.invoiceProducts.content) {
          const invoiceProductsContent = res?.invoiceProducts?.content?.reduce(
            (acc, curr) => {
              const currentProduct = acc.find(
                (product) => product?.uniqueKey === curr.uniqueKey
              );
              if (currentProduct && currentProduct.isWithoutSerialNumber) {
                currentProduct.quantity = math.add(
                  Number(currentProduct.quantity || 0),
                  Number(curr.quantity || 0)
                );
                currentProduct.usedQuantity = math.add(
                  Number(currentProduct.usedQuantity || 0),
                  Number(curr.usedQuantity || 0)
                );
                currentProduct.originalQuantity = math.add(
                  Number(currentProduct.originalQuantity || 0),
                  Number(curr.originalQuantity || 0)
                );
              } else {
                acc.push({ ...curr });
              }
              return acc;
            },
            []
          );
          setWarehouseData(res?.invoiceProducts?.content);
          setTableDatas(invoiceProductsContent);
          setRoutes([
            { key: "first", title: "Əlavə məlumat" },
            {
              key: "second",
              title: `Qaimənin tərkibi (${invoiceProductsContent.reduce(
                (total, { originalQuantity }) =>
                  math.add(total, Number(originalQuantity) || 0),
                0
              )})`,
            },
          ]);
          setDetailsData(res);
        }
      });
    }
  }, [row]);

  const renderScene = ({ route }) => {
    switch (route.key) {
      case "first":
        return (
          <MoreSaleDetail
            details={detailsData}
            allBusinessUnits={allBusinessUnits}
            profile={profile}
          ></MoreSaleDetail>
        );
      case "second":
        return (
          <InvoiceContain
            details={detailsData}
            tableDatas={tableDatas}
            warehouseData={warehouseData}
            fromFinance={fromFinance}
          ></InvoiceContain>
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

export default SaleDetail;
