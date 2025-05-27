import { useState, useEffect } from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import Popover, { PopoverPlacement } from "react-native-popover-view";

const ProTooltip = (props) => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (props.isVisible) {
      setOpen(open);
    } else {
      setOpen(false);
    }
  }, [props.isVisible]);


  return (
    <Popover
      //mode={PopoverMode.TOOLTIP}
      onCloseComplete={(e) => {
        console.log(e, "eeeee");
      }}
      placement={PopoverPlacement.BOTTOM}
      isVisible={open}
      from={
        <TouchableOpacity
          style={props.containerStyle}
          onPress={() => {
            props.notDefaultOpen ? props.onClick() : setOpen(true);
          }}
        >
          {props.trigger}
        </TouchableOpacity>
      }
      popoverStyle={props.popoverStyle || styles.popoverStyle}
      onRequestClose={() => {
        setOpen(false);
      }}
      {...props}
    >
      <View style={{ padding: 10 }}>
        {typeof props.popover === "function" ? props.popover() : props.popover}
      </View>
    </Popover>
  );
};

const styles = StyleSheet.create({
  popoverStyle: {
    padding: 10,
    backgroundColor: "#eee",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});

export default ProTooltip;
