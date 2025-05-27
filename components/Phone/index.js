import React, { useState } from "react";
import { TextInput, StyleSheet, Text, View } from "react-native";
import { AntDesign } from "@expo/vector-icons";
import { messages } from "../../utils";
import ProButton from "../ProButton";
import Checkbox from "expo-checkbox";
import { Controller } from "react-hook-form";

const Phone = ({
  index,
  type,
  handleAddValue,
  handleDeleteValue,
  label,
  control,
  checkBox,
  checkedMobile,
  handleCheckboxMobile,
  fromOperation,
}) => {
  const [phone, setPhone] = useState("");

  //  Telefon nömrəsini formatlayan funksiya
  const formatPhoneNumber = (input) => {
    // Yalnız rəqəmləri saxla
    let digits = input.replace(/\D/g, "");

    // Maksimum 10 rəqəm saxla
    if (digits.length > 12) {
      digits = digits.substring(0, 12);
    }
    // console.log(digits);

    let formatted = "";
    if (digits.length > 0) {
      formatted = `(${digits.substring(0, 3)}`;
      console.log(formatted, 1);
    }
    if (digits.length > 3) {
      formatted += `) ${digits.substring(3, 5)}`;
      console.log(formatted, 2);
    }
    if (digits.length > 5) {
      formatted += ` ${digits.substring(5, 8)}`;
      console.log(formatted, 3);
    }
    if (digits.length > 8) {
      formatted += ` ${digits.substring(8, 10)}`;
      console.log(formatted, 4);
    }
    if (digits.length > 10) {
      formatted += ` ${digits.substring(10, 12)}`;
      console.log(formatted, 4);
    }

    return formatted;
  };

  return (
    <View style={{ flexDirection: "row", gap: 10, alignItems: "flex-end" }}>
      <View
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 10,
          width: !fromOperation ? "80%" : "100%",
        }}
      >
        {
          <View style={{ display: "flex", flexDirection: "row", gap: 3 }}>
            {label ? <Text>{label}</Text> : null}
            <Text style={{ color: "red", marginLeft: "5px" }}>
              {checkedMobile ? "*" : null}
            </Text>

            {checkBox && index === 0 ? (
              <Checkbox
                onValueChange={(event) => handleCheckboxMobile(event)}
                value={checkedMobile}
                style={{ marginLeft: "8px" }}
              />
            ) : null}
          </View>
        }
        <Controller
          control={control}
          rules={{
            required: checkedMobile ? "Bu dəyər boş olmamalıdır" : false,
            maxLength: { value: 18, message: messages.maxtextLimitMessage(18) },
          }}
          render={({
            field: { value, onChange, onBlur },
            fieldState: { error },
          }) => {
            return (
              <>
                <TextInput
                  style={[
                    styles.dropdown,
                    !checkedMobile && { backgroundColor: "#ececec" },
                  ]}
                  maxLength={18}
                  onBlur={onBlur}
                  onChangeText={(input) => {
                    const formatted = formatPhoneNumber(input);
                    setPhone(formatted);
                    onChange(formatted);
                  }}
                  value={phone}
                  placeholder="(994) 55 555 55 55"
                  keyboardType="phone-pad"
                  editable={checkedMobile}
                />

                {error && <Text style={{ color: "red" }}>{error.message}</Text>}
              </>
            );
          }}
          name={`${type}[${index}]`}
        />
      </View>
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

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    padding: 16,
  },
  dropdown: {
    height: 50,
    borderColor: "gray",
    borderWidth: 0.5,
    borderRadius: 8,
    paddingHorizontal: 8,
  },
  icon: {
    marginRight: 5,
  },
  placeholderStyle: {
    fontSize: 16,
  },
  selectedTextStyle: {
    fontSize: 16,
  },
  iconStyle: {
    width: 20,
    height: 20,
  },
  inputSearchStyle: {
    height: 40,
    fontSize: 16,
  },
});

export default Phone;
