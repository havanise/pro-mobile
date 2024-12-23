import React from "react";
import { ActivityIndicator, View, StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { theme } from "../../utils";

import { Container, Label } from "./styles";

const ProButton = ({
  label,
  type = "primary",
  onClick,
  loading,
  rest,
  defaultStyle,
  flex = true,
  style,
  buttonBorder = {},
  selected = false,
  disabled = false,
  padding=undefined
}) => {

  return (
    <GestureHandlerRootView style={flex ? { flex: 1 } : style}>
      <View
        style={
          disabled ? { ...buttonBorder, backgroundColor: "#eee" } : buttonBorder
        }
      >
        <Container
          type={type}
          style={defaultStyle}
          onPress={onClick}
          selected={selected}
          padding={padding}
          {...rest}
          enabled={!loading && !disabled}
        >
          <View accessible accessibilityRole="button">
            {loading ? (
              <ActivityIndicator
                color={
                  type === "primary" || (selected && !disabled)
                    ? theme.colors.white
                    : theme.colors.primary
                }
              />
            ) : (
              <Label
                type={type}
                selected={selected}
                disabled={disabled}
                style={
                  type === "tab"
                    ? {
                        color: !selected || disabled ? "#505050" : "#ffffff",
                      }
                    : {}
                }
              >
                {label}
              </Label>
            )}
          </View>
        </Container>
      </View>
    </GestureHandlerRootView>
  );
};

export default ProButton;
