import React, { Fragment } from "react";
import { Controller } from "react-hook-form";
import { Text, View, StyleSheet, TextInput } from "react-native";

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
                    {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
                    style && style,
                  ]}
                >
                  <TextInput
                    multiline={multiline}
                    editable={!disabled}
                    // style={}
                    placeholder="Yazın"
                    onBlur={onBlur}
                    onChangeText={(val) => {
                      onChange(val);
                      handleChange(val);
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
                    onChange(val);
                    handleChange(val);
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
