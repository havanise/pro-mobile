import styled from "styled-components/native";
import { RectButton } from "react-native-gesture-handler";
import { theme } from "../../utils";

export const Container = styled(RectButton)`
  padding: ${(props) =>
    props.padding
      ? props.padding
      : props.type === "tab" || props.selected
      ? "10px 0"
      : props.type !== "skeleton"
      ? "19px 0"
      : 0};
  background-color: ${(props) =>
    (props.type === "primary" || props.selected) && props.enabled
      ? theme.colors.primary
      : props.type === "transparent"
      ? theme.colors.white
      : props.type === "danger"
      ? theme.colors.danger
      : "transparent"};
  align-items: center;
`;
export const Label = styled.Text`
  color: ${(props) =>
    props.type === "transparent" || props.type === "skeleton"
      ? theme.colors.text
      : props.type === "tab" && (!props.selected || props.disabled)
      ? theme.colors.grey
      : props.type === "primary" && props.disabled
      ? theme.colors.grey
      : theme.colors.white};
  font-size: 16px;
`;
