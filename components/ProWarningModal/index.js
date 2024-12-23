import React from "react";
import { Modal, Text, View, StyleSheet, Pressable } from "react-native";
import { AntDesign } from "@expo/vector-icons";
import ProButton from "../ProButton";
import ProText from "../ProText";

const ProWarningModal = (props) => {
  const {
    header = "Diqqət!",
    bodyTitle = "İmtina etmək istədiyinizdən əminsinizmi?",
    bodyContent = "İmtina etdiyiniz halda əlavə etdiyiniz məlumatlar yadda saxlanılmadan səhifə bağlanacaq.",
    cancelText = "Geri",
    continueText = "Davam et",
    titleIcon,
    open,
    onCancel,
    okFunc,
    isLoading,
    initRemains,
    ...rest
  } = props;
  return (
    <Modal animationType="slide" transparent={true} visible={open}>
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <View style={styles.modalHeader}>
            <AntDesign name="warning" size={100} color="white" />
          </View>
          <View style={{ padding: 35 }}>
            <ProText
              variant="heading"
              fontWeight={700}
              style={{ color: "black" }}
              textAlign="center"
            >
              {header}
            </ProText>

            <View style={{ marginTop: 12, marginBottom: 12 }}>
              <Text style={{ fontSize: 16 }}>{bodyTitle}</Text>
              {initRemains !== true ? <Text>{bodyContent}</Text> : null}
            </View>
            <View style={{ flexDirection: "row", gap: 10 }}>
              {continueText !== null && (
                <ProButton
                  label={continueText}
                  type="danger"
                  onClick={okFunc}
                  // className={
                  //   initRemains !== true ? styles.deleteButton : styles.forwardButton
                  // }
                  loading={isLoading}
                  defaultStyle={{ borderRadius: 5 }}
                  buttonBorder={styles.buttonStyle}
                />
              )}
              {cancelText !== null && (
                <ProButton
                  label={cancelText}
                  type="transparent"
                  onClick={onCancel}
                  // className={styles.cancelButton}
                  loading={isLoading}
                  defaultStyle={{ borderRadius: 5 }}
                  buttonBorder={styles.buttonStyle}
                />
              )}
            </View>
          </View>
          <Pressable style={[styles.button]} onPress={onCancel}>
            <AntDesign name="close" size={18} color="white" />
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 22,
  },
  modalView: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 5,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    backgroundColor: "#d0021b",
    paddingTop: 16,
    paddingBottom: 16,
    alignItems: "center",
  },
  button: {
    position: "absolute",
    borderRadius: 20,
    padding: 10,
    right: 0,
  },
  buttonStyle: {
    borderWidth: 1,
    borderRadius: 5,
    borderColor: "transparent",
  },
});

export default ProWarningModal;
