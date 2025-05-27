import React from "react";
import { View } from "react-native";
import { AntDesign } from "@expo/vector-icons";
import ProFormInput from "../ProFormInput";
import ProButton from "../ProButton";

const Website = ({
  index,
  type,
  handleAddValue,
  handleDeleteValue,
  label,
  control,
}) => {
  return (
    <View style={{ flexDirection: "row", gap: 10, alignItems: "flex-end" }}>
      <ProFormInput
        label={label}
        name={`${type}[${index}]`}
        control={control}
        width="80%"
        keyboardType="url"
        webSiteRule
      />

      {index === 0 ? (
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
      )}
    </View>
  );
};

export default Website;
