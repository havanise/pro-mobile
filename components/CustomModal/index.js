// components/AnimatedModal.js
import React, { useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
  Pressable,
} from "react-native";
import { AntDesign } from "@expo/vector-icons";

const SCREEN_HEIGHT = Dimensions.get("window").height;

const CustomModal = ({ visible, onClose, children, backgroundOpacity = 0.5 }) => {
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(translateY, {
        toValue: SCREEN_HEIGHT,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  if (!visible && translateY.__getValue() === SCREEN_HEIGHT) return null;

  return (
    <View style={styles.overlay}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={[styles.backdrop, { backgroundColor: `rgba(0,0,0,${backgroundOpacity})` }]} />
      </TouchableWithoutFeedback>

      <Animated.View style={[styles.modalContent, { transform: [{ translateY }] }]}>
        <Pressable onPress={onClose} style={styles.closeBtn}>
            <AntDesign name="close" size={14} color="black" />
        </Pressable>

        {children}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
    justifyContent: "flex-end", // bottom sheet effekti üçün
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    minHeight: 200,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
  },
  closeBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 2,
  },
  closeIcon: {
    width: 20,
    height: 20,
    backgroundColor: "gray",
    borderRadius: 10,
  },
});

export default CustomModal;
