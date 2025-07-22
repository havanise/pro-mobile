/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from "react";
import {
  Modal,
  Text,
  View,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView
} from "react-native";
import { AntDesign } from "@expo/vector-icons";
import ProButton from "../ProButton";
import Toast from "react-native-toast-message";
import { getPriceValue, roundTo } from "../../utils";

const math = require("exact-math");
const BigNumber = require("bignumber.js");

const SerialNumber = ({ value, index, onRemove, usedSerialNumber }) => (
  <View style={styles.serialNumber}>
    <Text style={{width: '80%'}}>{value}</Text>
    <ProButton
      label={<AntDesign name="minus" size={18} color="#dedede" />}
      disabled={usedSerialNumber?.includes(value)}
      onClick={() => onRemove(index)}
      //style={styles.minusSerialNumberButton}
      style={{ width: "15%", borderWidth: 1, }}
      defaultStyle={{ borderRadius: 5 }}
      flex={false}
    />
  </View>
);

const AddSerialNumbers = ({
  selectedProducts,
  setSelectedProducts,
  selectedRow,
  isVisible,
  setSerialModalIsVisible = () => {},
  type,
  handleQuantityChange,
  fetchSelectedSerialNumbers,
  setWarningModalVisible = () => {},
  productWithSerialNumbers,
  setProductWithSerialNumbers = () => {},
  setVat
}) => {
  const { productUniqueId, usedSerialNumber } = selectedRow;
  const [serialNumbers, setSerialNumbers] = useState([]);
  const [serialNumberInput, setSerialNumberInput] = useState(undefined);

  const handleSerialNumberChange = (value) => {
    setSerialNumberInput(value);
  };

  const addSerialNumber = () => {
    if (!serialNumberInput) {
      return Toast.show({
        type: "error",
        text2: "Seriya nömrəsi qeyd edilməyib",
        topOffset: 50,
      });
    }

    setSerialNumbers((prevSerialNumbers) => [
      ...prevSerialNumbers,
      serialNumberInput?.trim(),
    ]);
    setSerialNumberInput(undefined);
  };

  const removeSerialNumber = (index) => {
    setSerialNumbers((prevSerialNumbers) =>
      prevSerialNumbers.filter((_, serialIndex) => serialIndex !== index)
    );
  };

  const completeOperation = () => {
    let productId;
    let quantity;
    const newSelectedProducts = selectedProducts.map((selectedProduct) => {
      if (selectedProduct.productUniqueId === productUniqueId) {
        quantity = serialNumbers.length;
        productId = selectedProduct.productUniqueId ?? selectedProduct.id;
       
        const totalPricePerProduct = new BigNumber(
          math.mul(
            Number(selectedProduct.invoicePrice || 0),
            Number(serialNumbers.length || 0)
          )
        );
        const discountedPrice = new BigNumber(
          math.sub(
            Number(selectedProduct.invoicePrice || 0),
            Number(selectedProduct?.discountAmount || 0)
          )
        );
        const totalEndPricePerProduct = new BigNumber(
          math.mul(
            Number(
              getPriceValue(discountedPrice) ??
                (selectedProduct.invoicePrice || 0)
            ),
            Number(serialNumbers.length || 1)
          )
        );
      
        const newTaxAmount =
          math.div(
              math.mul(
                parseFloat(selectedProduct?.taxAmountPercentage ?? 0) ?? 0,
                parseFloat(
                  selectedProduct.invoicePrice 
              ) || 0),
              100
            );
            const totalTaxAmount = math.mul(
              parseFloat(quantity || 0) !== 0
                  ? newTaxAmount
                  : 0,
              parseFloat(quantity || 0)
            );
            const taxAmountWithPrice = math.add(
              parseFloat(selectedProduct.discountedPrice || 0),
              math.div(
                math.mul(
                  parseFloat(quantity || 0) !== 0
                  ? newTaxAmount
                  : 0,
                  parseFloat(selectedProduct.discountedPrice || 0)
                ),
                100
              )
            );
            const totalTaxAmountWithPrice = math.mul(
              parseFloat(taxAmountWithPrice || 0),
              parseFloat(quantity || 0)
            );

        return {
          ...selectedProduct,
          taxAmount:
            parseFloat(quantity || 0) !== 0
              ? newTaxAmount
              : 0,
          originalTaxAmount:
            parseFloat(quantity || 0) !== 0
              ? newTaxAmount
              : 0,
          totalTaxAmount: parseFloat(totalTaxAmount),
          taxAmountWithPrice: parseFloat(taxAmountWithPrice),
          totalTaxAmountWithPrice: parseFloat(totalTaxAmountWithPrice),
          invoiceQuantity: serialNumbers.length,
          discountedPrice:
            selectedProduct.discountPercentage == 0
              ? selectedProduct.invoicePrice
              : getPriceValue(discountedPrice),
          totalPricePerProduct:
            getPriceValue(totalPricePerProduct)?.toString()?.split(".")[1]
              ?.length > 4
              ? getPriceValue(totalPricePerProduct)?.toFixed(4)
              : getPriceValue(totalPricePerProduct),
          totalEndPricePerProduct:
            getPriceValue(totalEndPricePerProduct)?.toString()?.split(".")[1]
              ?.length > 4
              ? getPriceValue(totalEndPricePerProduct)?.toFixed(4)
              : getPriceValue(totalEndPricePerProduct),
          serialNumbers,
        };
      }
      return selectedProduct;
    });

    const filteredProducts = newSelectedProducts?.filter(
      ({ isVatFree }) => isVatFree === false
    );
    const filteredTotalPrice = filteredProducts?.reduce(
      (totalPrice, { totalPricePerProduct }) =>
        math.add(totalPrice, parseFloat(totalPricePerProduct || 0) || 0),
      0
    );

    const totalTaxRoadPrice = selectedProducts?.reduce(
      (acc, product) => math.add(acc, Number(product?.totalRoadTaxAmount ?? 0)),
      0
    );

    const newVatAmount = filteredProducts?.reduce(
      (totalVat, { totalTaxAmount }) =>
        math.add(totalVat, parseFloat(totalTaxAmount || 0) || 0),
      0
    );
    const newVatPercentage = roundTo(
      math.div(
        math.mul(Number(newVatAmount || 0) || 0, 100),
        math.sub(
          Number(filteredTotalPrice || 1) || 1,
          Number(totalTaxRoadPrice || 0) || 0
        ) || 1
      ),
      4
    );

    setVat({
      percentage: newVatPercentage,
      amount: newVatAmount,
    });
    setSelectedProducts(newSelectedProducts);
    setSerialModalIsVisible(false);
  };

  useEffect(() => {
    if (isVisible) {
      setSerialNumbers(selectedRow.serialNumbers || []);
    } else {
      setSerialNumberInput(undefined);
      setSerialNumbers([]);
    }
  }, [isVisible]);

  useEffect(() => {
    if (isVisible && serialNumbers?.length > 0 && type === "purchase") {
      const data = {
        serialNumber_ul: serialNumbers,
      };
      // fetchSelectedSerialNumbers({
      //   data,
      //   onSuccessCallback: ({ data }) => setProductWithSerialNumbers(data),
      // });
    }
  }, [serialNumbers]);

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={() => {
        setSerialModalIsVisible(false);
      }}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <View>
            <Text
              style={{
                fontWeight: 700,
                fontSize: 20,
              }}
            >
              Seriya nömrələri
            </Text>
          </View>
          {serialNumbers?.some((item) => usedSerialNumber?.includes(item)) && (
            <View style={styles.infoWarning}>
              <Text style={styles.fade}>
                İstifadə olunmuş seriya nömrələrini silmək mümkün deyil.
              </Text>
              <View>
                <AntDesign name="exclamation" size={24} color="white" />
              </View>
            </View>
          )}
            <View
              style={{
                display: "flex",
                flexDirection: "row",
                width: "100%",
                alignItems: "center",
              }}
            >
              <View style={{ width: "83%" }}>
                <TextInput
                  value={serialNumberInput}
                  onChangeText={handleSerialNumberChange}
                  style={{
                    marginRight: 15,
                    padding: 5,
                    borderWidth: 1,
                    borderRadius: 5,
                    borderColor: "#dedede",
                  }}
                  placeholder="Yazın"
                />
              </View>
              <ProButton
                label={<AntDesign name="pluscircleo" size={30} color="#dedede" />}
                // style={styles.customCircleButton}
                type="transparent"
                flex={false}
                onClick={addSerialNumber}
              />
            </View>
          <ScrollView style={styles.serialNumbers}>
            {serialNumbers.map((value, index) => (
              <SerialNumber
                usedSerialNumber={usedSerialNumber}
                index={index}
                onRemove={removeSerialNumber}
                value={value}
                key={index}
              />
            ))}
          </ScrollView>

          <View style={{ display: "flex", flexDirection: "row", justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#dedede', paddingTop: 10 }}>
            <ProButton
              label="Əlavə et"
              type="primary"
              flex={false}
              // onClick={handleConfirmClick}
              style={{ width: "45%" }}
              padding={"10px 0"}
              defaultStyle={{ borderRadius: 10 }}
              onClick={() => {
                if (
                  productWithSerialNumbers?.length > 0 &&
                  type === "purchase"
                ) {
                  setWarningModalVisible(true);
                } else {
                  completeOperation();
                }
              }}
              disabled={serialNumbers.length === 0}
            />
            <Text>
              Toplam: <Text>{serialNumbers.length}</Text>
            </Text>
          </View>
          <Pressable
            style={[styles.button, styles.buttonClose]}
            onPress={() => setSerialModalIsVisible(false)}
          >
            <AntDesign name="close" size={14} color="black" />
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
    borderRadius: 20,
    padding: 35,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  buttonStyle: {
    borderWidth: 1,
    borderRadius: 50,
    borderColor: "#dedede",
  },
  button: {
    position: "absolute",
    borderRadius: 20,
    padding: 10,
    right: 0,
  },
  infoWarning: {
    flexDirection: 'row',
    backgroundColor: '#EB573B',
    padding: 5,
    borderRadius: 5,
  },
  fade: {
    color: 'white'
  },
  serialNumber: {
    width: '100%',
    flexDirection: 'row',
  }
});

export default AddSerialNumbers;
