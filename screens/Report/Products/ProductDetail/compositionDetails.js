import React, { useEffect, useRef, useState } from "react";
import { Table, Row } from "react-native-reanimated-table";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { find } from "lodash";
import math from "exact-math";
import { ProTooltip, ProAsyncSelect } from "../../../../components";
import { defaultNumberFormat, formatNumberToLocale } from "../../../../utils";

const tableData = {
  tableHead: ["No", "Məhsul adı", "Miqdar", "Ölçü vahidi"],
  widthArr: [50, 140, 140, 140],
  tableData: [],
};

function CompositionDetails({ data, row }) {
  const [tData, setTData] = useState(tableData);
  const [filters, setFilters] = useState({
    productNames: [],
  });

  useEffect(() => {
    if (data) {
      setTData({
        ...tData,
        tableData: getFilteredComposition(data, filters).map(
          ({ product, unitOfMeasurement, materialQuantity }, index) => {
            const measurementData = [
              product.unitOfMeasurement,
              ...product.unitOfMeasurements.map((unit) => ({
                ...unit,
                ...unit.unitOfMeasurement,
              })),
            ];

            const rowUnitMeasurement = find(
              measurementData,
              (unit) => unit.id === unitOfMeasurement?.id
            );

            const rowMeasurements = measurementData?.filter(
              (unit) => unit.id !== unitOfMeasurement?.id
            );
            return [
              index + 1,
              product?.name,
              <View style={{ display: "flex" }}>
                <Text>
                  {formatNumberToLocale(
                    defaultNumberFormat(materialQuantity || 0)
                  )}
                </Text>

                {rowMeasurements.length !== 0 ? (
                  <ProTooltip
                    containerStyle={{ width: 145, height: "auto" }}
                    popover={rowMeasurements?.map((unitOfMeasurement) => (
                      <Text>
                        {`1 ${rowUnitMeasurement?.name} = ${Number(
                          math.div(
                            Number(
                              rowUnitMeasurement?.coefficientRelativeToMain ?? 1
                            ),
                            Number(
                              unitOfMeasurement?.coefficientRelativeToMain ?? 1
                            )
                          ) || 0
                        )} ${unitOfMeasurement.name}`}
                      </Text>
                    ))}
                    trigger={<FontAwesome name="info-circle" size={18} />}
                  />
                ) : null}
              </View>,
              <Text>{unitOfMeasurement?.name || "-"}</Text>,
            ];
          }
        ),
      });
    }
  }, [data, filters]);

  const handleFilter = (type, value) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      [type]: value,
    }));
  };

  const getFilteredComposition = (data, { productNames }) => {
    if (productNames.length > 0) {
      const newtableDatas = data.filter(({ product }) => {
        if (
          productNames.length > 0 ? productNames.includes(product.name) : true
        ) {
          return true;
        }
        return false;
      });
      return newtableDatas;
    }
    return data;
  };

  const filterDuplicates = (data, field) => {
    const data1 = [];
    return data.reduce((total, current) => {
      if (data1.includes(current?.product[field])) {
        return total;
      }
      data1.push(current?.product[field]);
      return [...total, { name: current?.product[field], id: current?.product?.id }];
    }, []);
  };

  return (
    <View style={{ width: "100%" }}>
      <View
        style={{
          justifyContent: "space-between",
          width: "100%",
          marginTop: 40,
        }}
      >
        <View>
          {row ? (
            <View style={{ marginBottom: 6 }}>
              <ProTooltip
                containerStyle={{ width: 145, height: "auto" }}
                popover={<Text>{row.name || ""}</Text>}
                trigger={
                  <Text>
                    {row.name?.length > 25
                      ? row.name.slice(0, 25) + "..."
                      : row.name}
                  </Text>
                }
              />
            </View>
          ) : (
            ""
          )}
        </View>
      </View>
      <View
        style={{
          width: "100%",
        }}
      >
        {row && (
          <View style={{ marginBottom: 6 }}>
            <Text
              style={{
                fontSize: 18,
              }}
            >
              {"Təyin olunmuş say"}: {Number(data?.[0].quantity || 0)}{" "}
              {row.unitOfMeasurementName}
            </Text>
          </View>
        )}
      </View>
      <View
        style={{
          justifyContent: "space-between",
          width: "100%",
          marginTop: 40,
        }}
      >
        <View style={{ display: "flex", width: "70%" }}>
          <View
            style={{
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Text>Məhsul adı</Text>
            <ProAsyncSelect
              isMulti
              defaultValue={filters.productNames}
              data={filterDuplicates(data, "name").map((item) => ({
                ...item,
                label: item.name,
                value: item.name,
                id: item.name
              }))}
              filter={{}}
              notForm
              handleSelectValue={({ id, list }) => {
                handleFilter("productNames", list);
              }}
            />
          </View>
        </View>
      </View>
      <ScrollView style={{ marginTop: 15 }} horizontal={true}>
        <Table borderStyle={{ borderWidth: 1, borderColor: "white" }}>
          <Row
            data={tData.tableHead}
            widthArr={tData.widthArr}
            style={styles.head}
            textStyle={styles.headText}
          />
          {tData.tableData.map((rowData, index) => (
            <Row
              key={index}
              data={rowData}
              widthArr={tData.widthArr}
              style={styles.rowSection}
              textStyle={styles.text}
            />
          ))}
        </Table>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  rowSection: { flexDirection: "row", borderWidth: 1, borderColor: "#eeeeee" },
  head: { height: 44, backgroundColor: "#55ab80" },
  headText: {
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
    color: "white",
  },
  text: { margin: 6, fontSize: 14, textAlign: "center" },
});

export default CompositionDetails;
