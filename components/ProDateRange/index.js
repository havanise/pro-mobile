// components/DateTimeSelector.js

import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Platform,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import dayjs from "dayjs";
import moment from "moment";
import { fullDateTimeWithSecond } from "../../utils";

const ProDateRange = ({ onChange, dates }) => {
  const [showPicker, setShowPicker] = useState(false);
  const [activeField, setActiveField] = useState("start"); // 'start' | 'end'
  const [startDate, setStartDate] = useState(dates.startDate || null);
  const [endDate, setEndDate] = useState(dates.endDate || null);
  const [mode, setMode] = useState("date");

  const openPicker = (field) => {
    setActiveField(field);
    setShowPicker(true);
  };

  const applyQuickRange = (type) => {
    const now = dayjs();
    let start = null;
    let end = new Date();

    if (type === "today") {
      start = now.startOf("day").toDate();
    } else if (type === "week") {
      start = now.startOf("week").add(1, "day").toDate(); // Bazar ertəsi
    } else if (type === "month") {
      start = now.startOf("month").toDate();
    }

    setStartDate(start);
    setEndDate(end);
    onChange?.({ startDate: start, endDate: end });
  };

  const formatDate = (date) =>
    date ? moment(date).format(fullDateTimeWithSecond) : "";

  return (
    <View style={styles.container}>
      <View style={styles.inputRow}>
        <TouchableOpacity
          style={styles.inputBox}
          onPress={() => openPicker("start")}
        >
          <TextInput
            style={styles.input}
            placeholder="Başlanğıc"
            value={formatDate(startDate)}
            editable={false}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.inputBox}
          onPress={() => openPicker("end")}
        >
          <TextInput
            style={styles.input}
            placeholder="Son"
            value={formatDate(endDate)}
            editable={false}
          />
        </TouchableOpacity>
      </View>

      {showPicker && (
        <DateTimePicker
          value={
            activeField === "start"
              ? startDate || new Date()
              : endDate || new Date()
          }
          mode={mode}
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={(event, selectedValue) => {
            setShowPicker(Platform.OS === "ios");
            if (mode == "date") {
              const currentDate = selectedValue || new Date();
              if (activeField === "start") {
                setStartDate(currentDate);
                onChange?.({ startDate: currentDate, endDate });
              } else {
                setEndDate(currentDate);
                onChange?.({ startDate, endDate: currentDate });
              }
              setMode("time");
              setShowPicker(Platform.OS !== "ios"); // to show time
            } else {
              const selectedTime = selectedValue || new Date();
              if (activeField === "start") {
                setStartDate(selectedTime);
                onChange?.({ startDate: selectedTime, endDate });
              } else {
                setEndDate(selectedTime);
                onChange?.({ startDate, endDate: selectedTime });
              }
              setShowPicker(Platform.OS === "ios"); // to hide back the picker
              setMode("date"); // defaulting to date for next open
            }
          }}
        />
      )}

      <View style={styles.quickRow}>
        <TouchableOpacity
          style={styles.quickButton}
          onPress={() => applyQuickRange("today")}
        >
          <Text style={styles.quickText}>Bu gün</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickButton}
          onPress={() => applyQuickRange("week")}
        >
          <Text style={styles.quickText}>Bu həftə</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickButton}
          onPress={() => applyQuickRange("month")}
        >
          <Text style={styles.quickText}>Bu ay</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: 20 },
  inputRow: {
    flexDirection: "column",
    gap: 10,
  },
  inputBox: {
    flex: 1,
  },
  input: {
    borderWidth: 1,
    borderRadius: 6,
    padding: 10,
    backgroundColor: "#fff",
  },
  quickRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    gap: 10,
  },
  quickButton: {
    backgroundColor: "#e0e0e0",
    paddingVertical: 2,
    paddingHorizontal: 4,
    borderRadius: 6,
    flex: 1,
    alignItems: "center",
  },
  quickText: {
    fontWeight: "bold",
  },
});
export default ProDateRange;
