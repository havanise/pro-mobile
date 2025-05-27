import React, { useState, useEffect } from "react";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
} from "react-native";
import { theme } from "../../utils";

const ProSearch = ({ onSearch, value = "" }) => {
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    if (value !== "") {
      setSearchText(value);
    }
  }, [value]);

  const handleSearch = () => {
    if (onSearch) {
      onSearch(searchText);
    }
  };
  let textInput = React.useRef(null);

  focusedInput = () => {
    textInput.setNativeProps({
      style: { borderColor: `${theme.colors.primary}` },
    });
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Search..."
        value={searchText}
        onChangeText={setSearchText}
        onSubmitEditing={handleSearch}
      />

      <TouchableOpacity onPress={handleSearch} style={styles.button}>
        <FontAwesome
          name="search"
          size={20}
          color="black"
          style={styles.buttonIcon}
        />
      </TouchableOpacity>
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: "#fff",
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  button: {
    padding: 5,
  },
  buttonIcon: {
    width: 20,
    height: 20,
    tintColor: "#888",
  },
});
export default ProSearch;
