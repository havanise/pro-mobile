/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from "react";
import { StyleSheet, View, Modal, Pressable, Text } from "react-native";
import { AntDesign } from "@expo/vector-icons";
import { TabBar, TabView } from "react-native-tab-view";
import { fetchSalesInvoiceInfo } from "../../api";
import MoreWarehouseDetail from "./MoreWarehouseDetails/MoreWarehouseDetail";
import InvoiceContain from "./MoreWarehouseDetails/InvoiceContain";

import math from "exact-math";

const WarehouseDetail = ({
  isVisible,
  handleModal,
  row,
  allBusinessUnits,
  profile,
}) => {
  const [index, setIndex] = useState(0);
  const [detailsData, setDetailsData] = useState([]);
  const [tableDatas, setTableDatas] = useState([]);
  const [warehouseData, setWarehouseData] = useState([]);
  const [routes, setRoutes] = useState([
    { key: "first", title: "Əlavə məlumat" },
    { key: "second", title: "Qaimənin tərkibi" },
  ]);

  useEffect(() => {
    if (row.invoice_id) {
      fetchSalesInvoiceInfo({
        apiEnd: Number(row.invoice_id),
      }).then((res) => {
        if (res.invoiceProducts && res.invoiceProducts.content) {
          setTableDatas([
            ...Object.keys(res.invoiceProducts.content).map(
              (index) => res.invoiceProducts.content[index]
            ),
          ]);
          setRoutes([
            { key: "first", title: "Əlavə məlumat" },
            {
              key: "second",
              title: `Qaimənin tərkibi (${[
                ...Object.keys(res.invoiceProducts.content).map(
                  (index) => res.invoiceProducts.content[index]
                ),
              ].reduce(
                (total, { quantity }) => math.add(total, Number(quantity) || 0),
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
          <MoreWarehouseDetail
            details={detailsData}
            allBusinessUnits={allBusinessUnits}
            profile={profile}
          ></MoreWarehouseDetail>
        );
      case "second":
        return (
          <InvoiceContain
            details={detailsData}
            tableDatas={tableDatas}
            warehouseData={warehouseData}
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

export default WarehouseDetail;
