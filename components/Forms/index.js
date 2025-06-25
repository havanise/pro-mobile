import React, { useState } from "react";
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Print from "expo-print";
import {
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  Text,
  Pressable,
} from "react-native";
import ProText from "../ProText";
import { AntDesign } from "@expo/vector-icons";
import { FileWord } from "../../assets";
import ProButton from "../ProButton";
import { getData } from "../../utils";

const Forms = (props) => {
  const {
    row,
    formsData,
    tenant,
    fromContract,
    fromStockStatus,
    visible,
    setVisible,
    fromFinance = undefined,
  } = props;

  const [isHovered, setIsHovered] = useState(false);

  const handlePrintPdf = async (docId, sampleDocId) => {
    const token = await getData("TKN").then((result) => {
      return result;
    });
    // devcore.prospectsmb.com/v1
    // core.prospect.az/v1
    const url = fromFinance
      ? `https://core.prospect.az/v1/transactions/exportToWord/${row.cashboxTransactionMoneyId}?format=pdf&sampleDocumentId=${sampleDocId}&tenant=${tenant}&token=${token}`
      : fromContract
      ? `https://core.prospect.az/v1/sales/contracts/export/${docId}?format=pdf&sampleDocumentId=${sampleDocId}&tenant=${tenant}&token=${token}`
      : fromStockStatus
      ? `https://core.prospect.az/v1/sales/stock-statuses/export/${docId}?format=pdf&sampleDocumentId=${sampleDocId}&tenant=${tenant}&token=${token}`
      : `https://core.prospect.az/v1/sales/invoices/export/invoice/${docId}?format=pdf&sampleDocumentId=${sampleDocId}&tenant=${tenant}&token=${token}`;

    try {
      await Print.printAsync({ uri: url });
    } catch (error) {
      console.error("Print error:", error);
    }
  };

  return (
    <>
      <View style={{ alignItems: "center", marginBottom: 18 }}>
        <MaterialCommunityIcons
          name="file-download-outline"
          size={34}
          color="black"
        />
        <ProText variant={"heading"} style={{ color: "black" }}>
          Sənədi yükləyin
        </ProText>
      </View>

      <View
        style={{
          padding: "20px 0",
          width: "100%",
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 10,
          alignItems: 'center',
        }}
      >
        {formsData?.[0]?.docs.map((document) => (
          <View>
            <TouchableOpacity
              //   activeOpacity={1}
              onPress={() => setIsHovered(!isHovered)}
              style={styles.imageWrapper}
            >
              <Image
                source={FileWord}
                style={styles.image}
                resizeMode="cover"
              />

              {isHovered && (
                <View style={styles.overlay}>
                  {/* <DetailButton
                        className={styles.descriptionIcon}
                        onClick={() =>
                          handleDocumentDetailClick(row.id, document?.id)
                        }
                      /> */}
                  <MaterialIcons
                    name="file-download"
                    size={24}
                    color="white"
                    style={styles.downloadIcon}
                  />
                  <TouchableOpacity
                    style={styles.iconButton}
                    onPress={() => {
                      handlePrintPdf(row.id, document?.id);
                    }}
                  >
                    <MaterialCommunityIcons
                      name="file-download-outline"
                      size={24}
                      color="white"
                    />
                  </TouchableOpacity>
                </View>
              )}
            </TouchableOpacity>

            <Text>
              {document.name.length > 10
                ? `${document.name.slice(0, 10)}...`
                : document.name}
            </Text>
          </View>
        ))}
      </View>
      <Pressable
        style={[styles.button, styles.buttonClose]}
        onPress={() => setVisible(false)}
      >
        <AntDesign name="close" size={14} color="black" />
      </Pressable>
    </>
  );
};

const styles = StyleSheet.create({
  loading: {
    padding: "20px 50px",
    borderRadius: 15,
  },
  imageWrapper: {
    position: "relative",
    width: 70,
    height: 70,
    borderRadius: 10,
    overflow: "hidden", // Ensures the icon doesn't overflow the image
  },
  image: {
    width: 70,
    height: 70,
  },
  button: {
    position: "absolute",
    borderRadius: 20,
    padding: 10,
    right: 0,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject, // Makes it cover the entire image
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    backgroundColor: "rgba(0, 0, 0, 0.3)", // Semi-transparent dark overlay
    gap: 5
  },
  downloadIcon: {
    opacity: 0.7,
  },
});

export default Forms;
