import React, { useState, useEffect } from "react";
import DateTimePicker from "@react-native-community/datetimepicker";
import moment from "moment";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from "react-native";
import { useForm, Controller } from "react-hook-form";

const ProDateTimePicker = ({
  control,
  name,
  required = false,
  label = "Əməliyyat tarixi",
  editDate = undefined
}) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [time, setTime] = useState(new Date());
  const [show, setShow] = useState(false);
  const [mode, setMode] = useState("date");

  useEffect(() => {
    if (editDate) {
      setSelectedDate(editDate);
      setTime(editDate);
    }
  }, [editDate]);

  const showMode = (currentMode) => {
    setShow(true);
    setMode(currentMode);
  };

  const showDatePicker = () => {
    showMode("date");
  };

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { value, onChange }, fieldState: { error } }) => (
        <>
          <View style={{ display: "flex", flexDirection: "row", gap: 3 }}>
            {label ? <Text>{label}</Text> : null}
            {required ? (
              <Text style={{ color: "red", marginLeft: "5px" }}>*</Text>
            ) : null}
          </View>
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
                  onChange(currentDate);
                  setMode("time");
                  setShow(Platform.OS !== "ios"); // to show time
                } else {
                  const selectedTime = selectedValue || new Date();
                  setTime(selectedTime);
                  setShow(Platform.OS === "ios"); // to hide back the picker
                  setMode("date"); // defaulting to date for next open
                }
              }}
              //   (event, selectedDate) => {
              //   console.log(selectedDate, 'selected')
              //   setSelectedDate(selectedDate)
              //   setShow(false)
              // }}
            />
          )}
          {/* // <DateTimePicker
        //   value={value || new Date()} // Provide a default value if value is empty
        //   mode="datetime" // You can use "time" or "datetime" for different modes
        //   is24Hour={true}
        //   display="default"
        //   onChange={(event, selectedDate) => {
        //     onChange(selectedDate);
        //   }}
        // /> */}
        </>
      )}
    />
  );
};

const styles = StyleSheet.create({
  overlayStyle: {
    flex: 1,
    width: "100%",
    // justifyContent: 'flex-end',
    backgroundColor: "#00000066",
  },
  inputContainerStyle: {
    alignItems: "flex-start",
    justifyContent: "center",
    borderWidth: 0.5,
    borderColor: "#8d908e",
    borderRadius: 8,
    height: 50,
  },
  placeholderStyle: {
    fontSize: 16,
    color: "#CDCDCD",
    marginHorizontal: 10,
  },
  textStyle: {
    fontSize: 16,
    marginHorizontal: 10,
  },
});

export default ProDateTimePicker;
