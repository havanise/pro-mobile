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
import moment from "moment";
import { AntDesign } from "@expo/vector-icons";
import { getCounterparties } from "../../../../api";
import {
  ProAsyncSelect,
  ProButton,
  ProDateRange,
  ProText,
} from "../../../../components";
import { fullDateTimeWithSecond } from "../../../../utils";

const typeOfOperations = [
  { label: "Alış", value: 1 },
  { label: "İdxal alışı", value: 10 },
  { label: "İlkin qalıq", value: 7 },
  { label: "İstehsalat", value: 11 },
  { label: "Geri alma", value: 3 },
  { label: "Transfer", value: 5 },
  { label: "Artırma", value: 14 },
  { label: "Konsiqnasiya", value: 16 },
];

const IncomeInvoiceFilterModal = ({
  isVisible,
  setIsVisible,
  invoice,
  allBusinessUnits,
  handleFilters,
  filterDuplicates,
  filter,
  contacts,
  setContacts,
}) => {
  const [filters, setFilters] = useState({
    contacts: [],
    invoiceTypes: [],
  });

  const [dates, setDates] = useState({ startDate: null, endDate: null });

  const formatToBakuTime = (date) => {
    return moment(date)?.format(fullDateTimeWithSecond);
  };

  const handleConfirmClick = () => {
    handleFilters({
      ...filters,
      datetimeFrom:
        dates.startDate === null
          ? undefined
          : formatToBakuTime(dates.startDate),
      datetimeTo:
        dates.endDate === null ? undefined : formatToBakuTime(dates.endDate),
    });
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
              {/* <View
                style={{
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <Text>Əməliyyat tarixi</Text>
                <>
                  <TouchableOpacity
                    onPress={showDatePicker}
                    style={styles.inputContainerStyle}
                  >
                    {selectedDate ? (
                      <Text style={styles.textStyle}>
                        {moment(selectedDate).format("DD-MM-YYYY") +
                          " " +
                          moment(time).format("HH:mm:ss")}
                      </Text>
                    ) : (
                      <Text style={styles.placeholderStyle}>tes</Text>
                    )}
                  </TouchableOpacity>
                  {show && (
                    <DateTimePicker
                      value={selectedDate}
                      maximumDate={moment().endOf("day").toDate()}
                      mode={mode}
                      is24Hour={true}
                      display="default"
                      onChange={(event, selectedValue) => {
                        setShow(Platform.OS === "ios");
                        if (mode == "date") {
                          const currentDate = selectedValue || new Date();
                          setSelectedDate(currentDate);
                          setMode("time");
                          setShow(Platform.OS !== "ios");
                        } else {
                          const selectedTime = selectedValue || new Date();
                          setTime(selectedTime);
                          setShow(Platform.OS === "ios");
                          setMode("date");
                        }
                      }}
                    />
                  )}
                </>
              </View> */}
              <View style={{ display: "flex", flexDirection: "column" }}>
                <Text>Tarix</Text>
                <ProDateRange onChange={setDates} dates={dates} />
              </View>
              <View
                style={{
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <Text>Qarşı tərəf</Text>
                <ProAsyncSelect
                  isMulti
                  async
                  defaultValue={filters.contacts}
                  setData={setContacts}
                  fetchData={getCounterparties}
                  data={contacts}
                  filter={{ limit: 20, page: 1 }}
                  notForm
                  handleSelectValue={({ list }) => {
                    updateFilter("contacts", list);
                  }}
                />
              </View>

              <View
                style={{
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <Text>Əməliyyat növü</Text>
                <ProAsyncSelect
                  isMulti
                  defaultValue={filters.invoiceTypes}
                  data={typeOfOperations}
                  filter={{}}
                  notForm
                  handleSelectValue={({ list }) => {
                    updateFilter("invoiceTypes", list);
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
                contacts: filter?.contacts,
                invoiceTypes: filter?.invoiceTypes,
                // description: filter?.description,
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

export default IncomeInvoiceFilterModal;
