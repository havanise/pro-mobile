/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Modal,
  Pressable,
  Text,
  ScrollView,
} from "react-native";
import { AntDesign } from "@expo/vector-icons";
import { fetchSalesInvoiceList, getCounterparties } from "../../../../api";
import { ProAsyncSelect, ProButton, ProText } from "../../../../components";
import { useApi } from "../../../../hooks";

const InvoicesFilterModal = ({
  isVisible,
  setIsVisible,
  handleFilters,
  filter,
}) => {
  const [filterInvoices, setFilterInvoices] = useState([]);
  const [filters, setFilters] = useState({
    invoices: [],
  });

  const handleConfirmClick = () => {
    handleFilters({
      ...filters,
    });
    setIsVisible(false);
  };

  const updateFilter = (key, value) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      [key]: value,
    }));
  };

  const { isLoading: isLoadStock, run: runInvoice } = useApi({
    deferFn: fetchSalesInvoiceList,
    onResolve: (data) => {
      setFilterInvoices(
        data.map((item) => ({
          ...item,
          label: item.invoiceNumber,
          value: item.id,
        }))
      );
    },
    onReject: (error) => {
      console.log(error, "rejected");
    },
  });

  useEffect(() => {
    runInvoice({
      filter: {
        excludeZeroAmount: 1,
        excludeEmptyPaymentStatus: 1,
        includeCreditData: 1,
        daysFromLastPaymentDateMin: filters.priceChecked ? 1 : undefined,
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
            Filterlər
          </ProText>
          <ScrollView>
            <View style={{ gap: 20 }}>
              <View
                style={{
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <Text>Qaimə</Text>
                <ProAsyncSelect
                  isMulti
                  async
                  defaultValue={filters.invoices}
                  setData={setFilterInvoices}
                  fetchData={fetchSalesInvoiceList}
                  data={filterInvoices}
                  valueName="invoiceNumber"
                  filter={{
                    limit: 20,
                    page: 1,
                    excludeZeroAmount: 1,
                    excludeEmptyPaymentStatus: 1,
                    includeCreditData: 1,
                    daysFromLastPaymentDateMin: filters.priceChecked
                      ? 1
                      : undefined,
                  }}
                  notForm
                  handleSelectValue={({ list }) => {
                    updateFilter("invoices", list);
                  }}
                />
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
                invoices: filter?.invoices,
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
    marginTop: 22,
  },
  modalView: {
    height: 500,
    minWidth: 300,
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

export default InvoicesFilterModal;
