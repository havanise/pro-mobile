import React from "react";
import { View, StyleSheet, Text } from "react-native";
import ProButton from "../ProButton";

const PaymentType = ({
  typeOfPayment,
  disabled,
  changeTypeOfPayment,
  type,
}) => {
  return (
    <View>
      <Text>Ödəniş növü</Text>
      <View style={{ display: "flex", flexDirection: "row", gap: 10 }}>
        <ProButton
          label="Nağd"
          type="tab"
          defaultStyle={{ borderRadius: 20 }}
          buttonBorder={styles.buttonStyle}
          selected={typeOfPayment === 1 && !disabled}
          onClick={() => {
            changeTypeOfPayment(1, type);
          }}
          disabled={disabled}
        />
        <ProButton
          label="Bank"
          type="tab"
          defaultStyle={{ borderRadius: 20 }}
          buttonBorder={styles.buttonStyle}
          selected={typeOfPayment === 2 && !disabled}
          disabled={disabled}
          onClick={() => {
            changeTypeOfPayment(2, type);
          }}
        />
        <ProButton
          label="Kart"
          type="tab"
          defaultStyle={{ borderRadius: 20 }}
          buttonBorder={styles.buttonStyle}
          selected={typeOfPayment === 3 && !disabled}
          disabled={disabled}
          onClick={() => {
            changeTypeOfPayment(3, type);
          }}
        />
        <ProButton
          label="Digər"
          type="tab"
          defaultStyle={{ borderRadius: 20 }}
          buttonBorder={styles.buttonStyle}
          selected={typeOfPayment === 4 && !disabled}
          disabled={disabled}
          onClick={() => {
            changeTypeOfPayment(4, type);
          }}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  buttonStyle: {
    borderWidth: 1,
    borderRadius: 30,
    borderColor: "#d9d9d9",
  },
});

export default PaymentType;
