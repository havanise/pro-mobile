/* eslint-disable react-hooks/exhaustive-deps */
import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { formatNumberToLocale, defaultNumberFormat } from "../../../utils";

const Dept = (props) => {
  const {
    value = null,
    currency,
    loading = false,
    customStyle = {},
    deptName = "Borc",
  } = props;
  return loading ? (
    <ActivityIndicator color={"gray"} />
  ) : (
    <View style={{ ...styles.deptBox, ...customStyle }}>
      <Text style={styles.dept}>{deptName} :</Text>
      <Text style={styles.value}>
        {formatNumberToLocale(defaultNumberFormat(value || 0))} {currency}
      </Text>
    </View>
  );
};
const styles = StyleSheet.create({
  deptBox: {
    display: "flex",
    alignItems: "center",
    flexDirection: "row",
  },
  dept: {
    fontSize: 13,
    fontWeight: 'bold'
  },
  value: {
    fontSize: 13,
    color: "red",
    marginLeft: 6,
    fontWeight: 'bold'
  },
});

export default Dept;
