/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useCallback } from "react";
import _ from "lodash";
import { ProButton } from "../../components";
import { AntDesign } from "@expo/vector-icons";
import {
  Text,
  View,
  StyleSheet,
  Pressable,
  TouchableOpacity,
} from "react-native";
import DraggableFlatList from "react-native-draggable-flatlist";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import CheckBox from "expo-checkbox";

const math = require("exact-math");

const SettingModal = (props) => {
  const {
    isVisible = false,
    saveSetting = () => {},
    handleModal = () => {},
    columnSource,
    AllStandartColumns,
    setVisible,
  } = props;

  const [allColumn, setAllColumn] = useState([]);
  const [allCheck, setAllCheck] = useState(true);

  useEffect(() => {
    setAllColumn(columnSource);
  }, [columnSource]);

  const handleCheckboxChange = (index) => {
    const newColums = _.cloneDeep(allColumn);
    const selectedIndex = newColums.findIndex(
      (column) => column.dataIndex === index
    );
    newColums[selectedIndex].visible = !newColums[selectedIndex].visible;

    setAllColumn(newColums);
  };

  const isStandartHidden = () => {
    const isStandart = columnSource
      ?.filter((col) => col.standart === true)
      ?.some((col) => col.visible === false);
    const nonStandart = columnSource
      ?.filter((col) => col.standart === false)
      ?.some((col) => col.visible === true);
    return isStandart || nonStandart;
  };

  useEffect(() => {
    if (isStandartHidden()) {
      setAllCheck(false);
    } else {
      if (isVisible === false) {
        setAllCheck(true);
      }
    }
    if (isVisible === false) {
      setAllColumn(columnSource);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columnSource, isVisible]);

  const selectStandartColumns = () => {
    setAllCheck((prevState) => !prevState);
    setAllColumn(
      AllStandartColumns?.map((column) => {
        if (column?.hasPermission === false) {
          return { ...column, visible: false, fixed: true };
        }
        return column;
      })
    );
  };

  const renderItem = useCallback(
    ({ item, getIndex, drag }) => {
      return (
        <View
          style={{
            display: "flex",
            flexDirection: "row",
            width: "100%",
            justifyContent: "space-between",
            marginBottom: 10,
          }}
        >
          <TouchableOpacity
            style={{
              justifyContent: "center",
            }}
            onLongPress={allCheck && item.standart === false ? () => {} : drag}
          >
            <Text
              style={{
                color: "black",
                fontSize: 16,
              }}
            >
              {item.name}
            </Text>
          </TouchableOpacity>
          <CheckBox
            onValueChange={(event) => handleCheckboxChange(item.dataIndex)}
            value={item.visible}
            style={{ marginLeft: "8px" }}
            disabled={allCheck || item.fixed}
          />
        </View>
      );
    },
    [allCheck, allColumn]
  );

  const getSelectedCount = () => {
    const selectedColumnsCount = allColumn?.filter(
      (column) => column?.visible === true
    ).length;
    return selectedColumnsCount;
  };

  return (
    <>
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <View style={{ height: "90%" }}>
            <View style={{ rowGap: 10 }}>
              <View
                style={{
                  width: "100%",
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Text variant="heading" style={{ color: "black" }}>
                  Seçilmiş sütunlar
                </Text>
                <Text>{`${getSelectedCount()} / ${columnSource.length}`}</Text>
              </View>
              <View
                style={{ display: "flex", flexDirection: "row", width: "100%" }}
              >
                <CheckBox
                  value={allCheck}
                  onValueChange={selectStandartColumns}
                />
                <Text> Standart sütunlar</Text>
              </View>
            </View>
            <View
              style={{
                marginTop: 10,
                marginBottom: 30,
                padding: 10,
                borderRadius: 4,
                backgroundColor: "#fff",
                display: "flex",
              }}
            >
              {allCheck ? (
                <GestureHandlerRootView style={{ flex: 1 }}>
                  <DraggableFlatList
                    data={[
                      ...allColumn?.filter((col) => col.standart === true),
                      ...allColumn?.filter((col) => col.standart === false),
                    ]}
                    renderItem={renderItem}
                    keyExtractor={(item, index) => `draggable-item-${index}`}
                    onDragEnd={({ data }) => setAllColumn(data)}
                  />
                </GestureHandlerRootView>
              ) : (
                <GestureHandlerRootView style={{ flex: 1 }}>
                  <DraggableFlatList
                    data={allColumn}
                    renderItem={renderItem}
                    keyExtractor={(item, index) => `draggable-item-${index}`}
                    onDragEnd={({ data }) => setAllColumn(data)}
                  />
                </GestureHandlerRootView>
              )}
            </View>
          </View>

          <View style={{ marginTop: 10, width: "100%" }}>
            <ProButton
              label="Yadda saxla"
              type="primary"
              flex={false}
              onClick={() => saveSetting(allColumn)}
              style={{ width: "45%" }}
              padding={"10px"}
              defaultStyle={{ borderRadius: 10 }}
            />
          </View>

          <Pressable
            style={[styles.button, styles.buttonClose]}
            onPress={() => setVisible(false)}
          >
            <AntDesign name="close" size={14} color="black" />
          </Pressable>
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  tabbar: {
    backgroundColor: "#37B874",
  },
  container: {
    flex: 1,
    padding: 16,
    paddingTop: 30,
    backgroundColor: "#fff",
    gap: 10,
  },
  rowSection: { flexDirection: "row", borderWidth: 1, borderColor: "#eeeeee" },
  head: { height: 44, backgroundColor: "#55ab80" },
  headText: {
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
    color: "white",
  },
  text: { margin: 6, fontSize: 14, textAlign: "center" },

  btn: { width: 58, height: 18, backgroundColor: "#78B7BB", borderRadius: 2 },
  btnText: { textAlign: "center", color: "#fff" },
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
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  button: {
    position: "absolute",
    borderRadius: 20,
    padding: 10,
    right: 0,
  },
  head: { height: 44, backgroundColor: "#55ab80" },
  headText: {
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
    color: "white",
  },
  text: { margin: 6, fontSize: 14, textAlign: "center" },
});

export default SettingModal;
