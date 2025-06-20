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
import { ProAsyncSelect, ProButton, ProText } from "../../components";
import ProSearch from "../../components/ProSearch";

const AddInvoiceFilterModal = ({
  isVisible,
  setIsVisible,
  invoice,
  allBusinessUnits,
  handleFilters,
  filterDuplicates,
  filter,
}) => {
  const [filters, setFilters] = useState({
    invoices: [],
    businessUnitIds: [],
    description: "",
  });

  const handleConfirmClick = () => {
    handleFilters(filters);
    setIsVisible(false);
  };

  const updateFilter = (key, value) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      [key]: value,
    }));
  };

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
                  defaultValue={filters.invoices}
                  data={invoice?.map((item) => ({
                    ...item,
                    value: item.id,
                  }))}
                  filter={{}}
                  notForm
                  handleSelectValue={({ list }) => {
                    updateFilter("invoices", list);
                  }}
                />
              </View>
              <View
                style={{
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <Text>Biznes blok</Text>
                <ProAsyncSelect
                  isMulti
                  defaultValue={filters.businessUnitIds?.map((item) => {
                        return item === 0 ? null : item;
                      })}
                  data={filterDuplicates(
                    invoice?.map((item) => ({
                      id:
                        item.business_unit_id === null
                          ? allBusinessUnits[0]?.id
                          : item.business_unit_id,
                      value:
                        item.business_unit_id === null
                          ? allBusinessUnits[0]?.id
                          : item.business_unit_id,
                      name:
                        item.business_unit_name === null
                          ? allBusinessUnits[0]?.name
                          : item.business_unit_name,
                      label:
                        item.business_unit_name === null
                          ? allBusinessUnits[0]?.name
                          : item.business_unit_name,
                    }))
                  )}
                  filter={{}}
                  notForm
                  handleSelectValue={({ list }) => {
                    updateFilter("businessUnitIds", list.map((item) => {
                        return item === null ? 0 : item;
                      }));
                  }}
                />
              </View>

              <View
                style={{
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <Text>Əlavə məlumat</Text>
                <ProSearch
                  onSearch={(val) => updateFilter("description", val)}
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
                businessUnitIds: filter?.businessUnitIds,
                description: filter?.description,
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

export default AddInvoiceFilterModal;
