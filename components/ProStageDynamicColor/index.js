import React from "react";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import ProAsyncSelectForStage from "../ProAsyncSelectForStage";

const ProStageDynamicColor = (props) => {
  const {
    visualStage,
    statuses = [],
    onChange = () => {},
    disabled = false,
    color,
  } = props;

  return (
    <ProAsyncSelectForStage
      data={statuses}
      style={
        color
          ? { backgroundColor: `${color}`, height: 30, marginBottom: 10 }
          : { height: 40 }
      }
      defaultValue={visualStage?.id}
      handleChange={onChange}
      disabled={disabled}
      icon={<FontAwesome name="circle" size={10} color={color} />}
    />
  );
};

export default ProStageDynamicColor;
