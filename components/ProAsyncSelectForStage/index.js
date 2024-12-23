import React, { useState } from "react";
import { FontAwesome, Entypo } from "@expo/vector-icons";
import { Controller } from "react-hook-form";
import { Dropdown, MultiSelect } from "react-native-element-dropdown";
import { Text, RefreshControl, View, StyleSheet } from "react-native";

const ProAsyncSelectForStage = ({
  data = [],
  notValue = false,
  disabled = false,
  handleSelectValue = () => {},
  defaultValue = false,
  style = undefined,
  width = "100%",
  selectedValueFromParent = undefined,
  handleChange,
}) => {
  const [isFocus, setIsFocus] = useState(false);
  const [selectedValue, setSelectedValue] = useState(defaultValue);

  const renderItem = (item) => {
    return (
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          padding: 7,
          gap: 5,
          justifyContent: "center",
        }}
      >
        <FontAwesome name="circle" size={10} color={item.color} />
        <Text style={styles.selectedTextStyle}>{item.label}</Text>
      </View>
    );
  };

  return (
    <View
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 10,
        width: width,
      }}
    >
      <Dropdown
        renderItem={renderItem}
        disable={disabled}
        style={[
          styles.dropdown,
          disabled && { backgroundColor: "#ececec" },
          style && style,
        ]}
        placeholderStyle={styles.placeholderStyle}
        selectedTextStyle={styles.selectedTextStyle}
        inputSearchStyle={styles.inputSearchStyle}
        data={data}
        search={false}
        maxHeight={300}
        labelField="label"
        valueField="value"
        placeholder={defaultValue}
        searchPlaceholder="Search..."
        renderRightIcon={() => null}
        value={
          notValue
            ? undefined
            : selectedValueFromParent
            ? selectedValueFromParent
            : selectedValue
        }
        onFocus={() => {
          setIsFocus(true);
        }}
        onBlur={() => {
          setIsFocus(false);
        }}
        onChange={(item) => {
          if (handleChange) {
            handleChange(item.id);
          } else {
            setSelectedValue(item.value);
            handleSelectValue(item.id);
            setIsFocus(false);
          }
        }}
        flatListProps={{
          refreshControl: <RefreshControl refreshing={false} />,
          onEndReachedThreshold: 0.5,
          onEndReached: () => {},
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  paragraph: { color: "red", marginLeft: 5 },
  container: {
    backgroundColor: "white",
    padding: 16,
  },
  dropdown: {
    height: 50,
    borderColor: "transparent",
    borderWidth: 0.5,
    borderRadius: 8,
    paddingHorizontal: 8,
  },
  icon: {
    marginRight: 5,
  },
  placeholderStyle: {
    fontSize: 12,
    color: "white",
    textAlign: "center",
  },
  selectedTextStyle: {
    fontSize: 12,
    textAlign: "center",
  },
  iconStyle: {
    width: 20,
    height: 20,
  },
  inputSearchStyle: {
    height: 40,
    fontSize: 16,
  },
  formDropdown: {
    height: 50,
    borderColor: "gray",
    borderWidth: 0.5,
    borderRadius: 8,
    paddingHorizontal: 8,
  },
  formPlaceholderStyle: {
    fontSize: 16,
  },
  formSelectedTextStyle: {
    fontSize: 16,
  },
});

export default ProAsyncSelectForStage;
