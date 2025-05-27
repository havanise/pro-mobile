import React from "react";
import { View } from "react-native";
import { AntDesign } from "@expo/vector-icons";
import ProFormInput from "../ProFormInput";
import ProButton from "../ProButton";

const Email = ({
  index,
  type,
  handleAddValue,
  handleDeleteValue,
  label,
  control,
  fromOperation,
}) => {
  return (
    <View style={{ flexDirection: "row", gap: 10, alignItems: "flex-end" }}>
      <ProFormInput
        label={label}
        name={`${type}[${index}]`}
        control={control}
        width={!fromOperation ? "80%": "100%"}
        keyboardType="email-address"
        emailRule
      />

      {!fromOperation ? (
        index === 0 ? (
          <ProButton
            label={<AntDesign name="pluscircle" size={30} color="black" />}
            type="transparent"
            flex={false}
            onClick={() => handleAddValue(type)}
          />
        ) : (
          <ProButton
            label={<AntDesign name="minuscircle" size={30} color="#FF716A" />}
            type="transparent"
            flex={false}
            onClick={() => handleDeleteValue(type, index)}
          />
        )
      ) : null}
    </View>
  );
};

export default Email;
