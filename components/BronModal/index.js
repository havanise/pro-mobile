/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useContext } from "react";
import {
  Modal,
  StyleSheet,
  View,
  Pressable,
  Text,
  ScrollView,
} from "react-native";
import { Table, Row } from "react-native-reanimated-table";
import { AntDesign } from "@expo/vector-icons";
import { ProButton, ProText } from "../../components";
import {
  fetchSalesProductsFromCatalog,
  fetchProductsFromCatalog,
  fetchSalesInvoiceList,
  fetchSalesInvoicesCount,
} from "../../api";
import { TenantContext } from "../../context";
import { useApi } from "../../hooks";
import { defaultNumberFormat, formatNumberToLocale } from "../../utils";

const tableData = {
  tableHead: [
    "No",
    "Qarşı tərəf",
    "Anbar",
    "Başlama tarixi",
    "Bitmə tarixi",
    "Qaimə",
    "Məhsul miqdarı",
  ],
  widthArr: [50, 140, 140, 140, 140, 100, 120],
  tableData: [],
};

const BronModal = ({ isVisible, setIsVisible, productData }) => {
  const [data, setData] = useState(tableData);
  const [tableSource, setTableSource] = useState([]);
  const [invoiceCount, setIvoiceCount] = useState([]);
  const { BUSINESS_TKN_UNIT } = useContext(TenantContext);

  useEffect(() => {
    if (!isVisible) {
      setIsVisible(false);
    } else {
      fetchSalesInvoiceList({
        filter: {
          limit: 8,
          page: 1,
          isDeleted: 0,
          invoiceTypes: [9],
          bronStatus: "active",
          products: [productData?.id],
          showProductQuantityPerItem: 1,
          stocks: productData?.stocks ? [productData?.stocks] : undefined,
        },
      }).then((productData) => {
        setTableSource(productData);
      });
      fetchSalesInvoicesCount({
        filter: {
          limit: 8,
          page: 1,
          isDeleted: 0,
          invoiceTypes: [9],
          bronStatus: "active",
          products: [productData?.id],
          showProductQuantityPerItem: 1,
          stocks: productData?.stocks ? [productData?.stocks] : undefined,
        },
      }).then((productData) => {
        console.log(productData, "say");
      });
    }
  }, [isVisible]);

  useEffect(() => {
    setData({
      ...data,
      tableData: tableSource?.map(
        (
          {
            clientName,
            stockName,
            createdAt,
            totalQuantity,
            bronEndDate,
            invoiceNumber,
          },
          index
        ) => {
          return [
            index + 1,
            clientName,
            stockName,
            createdAt,
            bronEndDate || "Müddətsiz",
            invoiceNumber,
            formatNumberToLocale(defaultNumberFormat(totalQuantity)),
          ];
        }
      ),
    });
  }, [tableSource]);

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
          <ProText variant="heading" style={{ color: "black" }}>
            {productData?.name}
          </ProText>
          <ScrollView style={{ marginTop: 15 }} horizontal={true}>
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
          <Pressable
            style={[styles.button, styles.buttonClose]}
            onPress={() => setIsVisible(false)}
          >
            <AntDesign name="close" size={14} color="black" />
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
    margin: 20,
    backgroundColor: "white",
    borderRadius: 20,
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
  selectBox: {
    marginBottom: 20,
  },
  selectLabel: {
    fontSize: 14,
  },
  buttons: {},
  button: {
    position: "absolute",
    borderRadius: 20,
    padding: 10,
    right: 0,
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
});

export default BronModal;
