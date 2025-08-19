/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from "react";
import { StyleSheet, View, Modal, Pressable, Text } from "react-native";
import { AntDesign } from "@expo/vector-icons";
import { TabBar, TabView } from "react-native-tab-view";
import { fetchSalesInvoiceList, fetchTransactionsCount } from "../../../../api";
import Invoices from "./Invoices";
import PayableInvoices from "./PayableInvoices";
import Barter from "./Barter";

const RecievablesDetail = ({
  isVisible,
  handleModal,
  row,
  mainCurrency,
  filterTable,
  detailFilters,
}) => {
  const { id, contactId } = row;
  const [index, setIndex] = useState(0);
  const [invoices, setInvoices] = useState([]);
  const [payableInvoices, setPayableInvoices] = useState([]);
  const [barterInvoices, setBarterInvoices] = useState([]);
  const [barterDataCount, setBarterDataCount] = useState(0);

  const [product, setProduct] = useState({});

  const [routes, setRoutes] = useState([
    { key: "first", title: "Qaimələr" },
    { key: "second", title: "Ödənişlər" },
  ]);

  useEffect(() => {
    if (barterDataCount > 0) {
      setRoutes([
        { key: "first", title: "Qaimələr" },
        { key: "second", title: "Ödənişlər" },
        { key: "third", title: "Barter" },
      ]);
    }
  }, [barterDataCount]);

  useEffect(() => {
    if (contactId) {
      // setPayableInvoices([]);
      // setInvoices([]);
      // setBarterInvoices([]);

      fetchTransactionsCount({
        filter: {
          contacts: [contactId],
          stocks: filterTable.stocks,
          invoiceCurrencyId: filterTable.currencyId,
          transactionTypes: [23],
          vat: 0,
          page: 1,
          limit: 1000,
          datetime: filterTable.datetime,
        },
      }).then((productData) => {
        setBarterDataCount(productData);
      });
      // fetchTransactionList({
      //   filter: {
      //     contacts: [contactId],
      //     cashInOrCashOut: [1],
      //     stocks: filterTable.stocks,
      //     invoiceCurrencyId: selectedCurrency,
      //     transactionTypes: index === 2 ? [23] : [9, 19],
      //     vat: 0,
      //     page: 1,
      //     limit: paymentPageSize,
      //     datetime: filterTable.datetime,
      //   },
      // }).then((productData) => {
      //   setTransactionsList(productData);
      // });
    }
  }, [contactId, filterTable, index]);

  const renderScene = ({ route }) => {
    switch (route.key) {
      case "first":
        return (
          <Invoices
            row={row}
            invoices={invoices}
            setInvoices={setInvoices}
            contactId={contactId}
            detailFilters={detailFilters}
          />
        );
      case "second":
        return (
          <PayableInvoices
            isVisible={isVisible}
            row={row}
            payableInvoices={payableInvoices}
            setPayableInvoices={setPayableInvoices}
            mainCurrency={mainCurrency}
            filterTable={filterTable}
            contactId={contactId}
          />
        );
      case "third":
        return (
          <Barter
            isVisible={isVisible}
            row={row}
            barterInvoices={barterInvoices}
            setBarterInvoices={setBarterInvoices}
            mainCurrency={mainCurrency}
            filterTable={filterTable}
            contactId={contactId}
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

export default RecievablesDetail;
