import React from "react";
import { formatNumberToLocale, defaultNumberFormat } from "../../../utils";
import { Text, View, ActivityIndicator, StyleSheet } from "react-native";
import CheckBox from "expo-checkbox";

export const AdvancePayment = (props) => {
  const {
    advancePayment,
    loading = false,
    onChange,
    checked,
    disabled,
    title = "Avansdan ödə",
    subTitle = "Avans:",
    mainCurrencyCode = "AZN",
  } = props;
  return loading ? (
    <ActivityIndicator color={"gray"} />
  ) : (
    <View style={styles.advancePaymentBox}>
      <View style={checked ? styles.details : styles.fadeDetails}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.avansBox}>
          <View style={styles.subtitle}>
            <Text>{subTitle}</Text>
          </View>
          <View style={styles.subtitle}>
            {!advancePayment?.myAmount?.length ? (
              <Text>0 {mainCurrencyCode}</Text>
            ) : (
              advancePayment?.myAmount?.map(
                ({ amount, code, currencyId, fromFront }) =>
                  amount > 0 ? (
                    <Text style={{ color: "#55AB80" }}>
                      {formatNumberToLocale(defaultNumberFormat(amount))}
                      {code}
                    </Text>
                  ) : (
                    <Text style={{ color: "#FF716A" }}>
                      {formatNumberToLocale(defaultNumberFormat(amount))}
                      {code}
                    </Text>
                  )
              )
            )}

            <Text style={{ color: "#FF716A" }}>
              {advancePayment?.contactsAmount?.map(
                ({ amount, code, currencyId, fromFront }) =>
                  `${formatNumberToLocale(
                    defaultNumberFormat(amount)
                  )} ${code}, `
              )}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.box}>
        <CheckBox
          value={checked}
          onValueChange={(event) => onChange(event)}
          style={styles.checkbox}
          checked={checked}
          disabled={disabled}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  advancePaymentBox: {
    width: "100%",
    display: "flex",
    paddingTop: 10,
    paddingLeft: 14,
    paddingBottom: 10,
    paddingRight: 14,
    alignItems: "center",
    justifyContent: "space-between",
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "rgba(131, 131, 131, 0.28)",
  },
  details: {
    display: "flex",
    flexDirection: "column",
    transition: "opacity ease-in-out 150ms",
  },
  avansBox: {
    display: "flex",
    flexDirection: "row",
  },
  subtitle: {
    display: "flex",
    marginRight: 4,
  },
  fadeDetails: {
    display: "flex",
    flexDirection: "column",
    opacity: 0.6,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
  },

  box: {
    height: "24px",
    width: "24px",
    backgroundColor: "rgba(131, 131, 131, 0.58)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
  },
});

export default AdvancePayment;
