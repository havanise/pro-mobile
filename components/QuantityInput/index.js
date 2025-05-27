import { useState } from "react";
import { AntDesign } from "@expo/vector-icons";
import ProTooltip from "../ProTooltip";
import { Text, TextInput, View } from "react-native";
import ProInput from "../ProInput";
import ProButton from "../ProButton";

import math from "exact-math";
import { re_amount } from "../../utils";

const QuantityInput = (props) => {
  const {
    value = "",
    product = {},
    disabled = false,
    onChange,
    hasMultiMeasurement = false,
    selectedProduct,
  } = props;

  const { quantity = 0, convertedQuantity = 0 } = product;

  const increase = () => {
    const currentQuantity = hasMultiMeasurement ? convertedQuantity : quantity;
    const remainQuantity =
      math.sub(Number(currentQuantity), Number(value || 0)) < 1
        ? currentQuantity - value
        : 1;
    onChange(math.add(Number(value || 0), Math.abs(remainQuantity)), product);
  };

  const decrease = () => {
    if (Number(value || 0) < 1) {
      onChange(0, product);
      return;
    }
    onChange(Number(value) - 1, product);
  };

  const handleChange = (newInvoiceQuantity) => {
    if (
      re_amount.test(newInvoiceQuantity) &&
      Number(newInvoiceQuantity) <=
        Number(hasMultiMeasurement ? convertedQuantity : quantity)
    ) {
      return onChange(newInvoiceQuantity, product);
    }
    if (newInvoiceQuantity === "") {
      onChange(null, product);
    }
  };

  return (
    // <ProTooltip
    //   containerStyle={{ width: 145, height: "auto" }}
    //   popover={
    //     <Text>
    //       Məhsuldan istifadə olunduğu üçün say minimum{" "}
    //       {selectedProduct?.[0]?.usedQuantity} olaraq dəyişdirilə bilər.
    //     </Text>
    //   }
    //   isVisible={Number(value || 0) < selectedProduct?.[0]?.usedQuantity}
    //   notDefaultOpen
    //   trigger={

    //   }
    // />
    <View
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
      }}
    >
      <ProButton
        label={<AntDesign name="minus" size={16} color="#dedede" />}
        type="transparent"
        style={{ width: "15%", borderWidth: 1 }}
        defaultStyle={{ borderRadius: 5 }}
        flex={false}
        onClick={decrease}
        disabled={disabled}
      />
      <TextInput
        value={value}
        keyboardType="numeric"
        onChangeText={(event) => {
          handleChange(event);
        }}
        style={{
          margin: 5,
          padding: 5,
          height: "60%",
          width: "50%",
          borderWidth: 1,
          borderRadius: 5,
          borderColor: "#D0DBEA",
        }}
        disabled={disabled}
      />
      <ProButton
        label={<AntDesign name="pluscircleo" size={16} color="#dedede" />}
        type="transparent"
        style={{ width: "15%", borderWidth: 1 }}
        defaultStyle={{ borderRadius: 5 }}
        flex={false}
        onClick={increase}
        disabled={disabled}
      />
    </View>
  );
};

export default QuantityInput;
