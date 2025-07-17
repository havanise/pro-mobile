import React, { Fragment } from "react";
import { Controller } from "react-hook-form";
import { Text, View, StyleSheet, TextInput } from "react-native";
import { messages } from "../../utils";

const ProFormInput = ({
  label,
  required = false,
  name,
  control,
  disabled = false,
  style = undefined,
  width = "100%",
  multiline = false,
  keyboardType,
  handleChange = () => {},
  suffix = false,
  maxLength = false,
  minLength = false,
  emailRule = false,
  webSiteRule = false,
  phoneRule = false,
  regex = false,
  checkPositive = false
}) => {
  return (
    <View
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 10,
        width: width,
      }}
    >
      <View style={{ display: "flex", flexDirection: "row", gap: 3 }}>
        {label ? <Text>{label}</Text> : null}
        {required ? (
          <Text style={{ color: "red", marginLeft: "5px" }}>*</Text>
        ) : null}
      </View>
      <Controller
        control={control}
        rules={{
          required: required ? "Bu dəyər boş olmamalıdır" : false,
          maxLength: maxLength
            ? {
                value: maxLength,
                message: messages.maxtextLimitMessage(maxLength),
              }
            : {},
          minLength: minLength
            ? {
                value: minLength,
                message: messages.mintextLimitMessage(minLength),
              }
            : {},
            validate: value => {
              if (checkPositive && Number(value) <= 0) {
                return "Məbləğ 0-dan böyük olmalıdır";
              }
              return true;
            },
          pattern: emailRule
            ? {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: "Düzgün email daxil edin!",
              }
            : webSiteRule
            ? {
                value: /^(https?:\/\/)?([\w.-]+)\.([a-z]{2,6})(\/[\w.-]*)*\/?$/,
                message: "Düzgün vebsayt ünvanı daxil edin!",
              }
            : phoneRule
            ? {
                value: /^\d{12}$/,
                message: "Düzgün telefon nömrəsi daxil edin!",
              }
            : {},
        }}
        render={({
          field: { value, onChange, onBlur },
          fieldState: { error },
        }) => {
          return (
            <>
              {suffix ? (
                <View
                  style={[
                    styles.dropdown,
                    disabled && { backgroundColor: "#ececec" },
                    {
                      flexDirection: "row",
                      alignItems: "center",
                    },
                    style && style,
                  ]}
                >
                  <TextInput
                    multiline={multiline}
                    editable={!disabled}
                    style={{
                      width: '90%',
                      padding: 5,
                    }}
                    placeholder="Yazın"
                    onBlur={onBlur}
                    onChangeText={(val) => {
                      if (regex) {
                        const filteredValue = val.replace(regex, "");
                        onChange(filteredValue);
                        handleChange(filteredValue);
                      } else {
                        onChange(val);
                        handleChange(val);
                      }
                    }}
                    value={value}
                    keyboardType={keyboardType}
                  />
                  <Text>{suffix}</Text>
                </View>
              ) : (
                <TextInput
                  multiline={multiline}
                  editable={!disabled}
                  style={[
                    styles.dropdown,
                    //   isFocus && { borderColor: "blue" },
                    disabled && { backgroundColor: "#ececec" },
                    style && style,
                  ]}
                  placeholder="Yazın"
                  onBlur={onBlur}
                  onChangeText={(val) => {
                    if (regex) {
                      const newValue = val.replace(regex, "");
                      onChange(newValue);
                      handleChange(newValue);
                    } else {
                      onChange(val);
                      handleChange(val);
                    }
                  }}
                  value={value}
                  keyboardType={keyboardType}
                />
              )}
              {error && <Text style={{ color: "red" }}>{error.message}</Text>}
            </>
          );
        }}
        name={name}
      />
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

export default ProFormInput;
