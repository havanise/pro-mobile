/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { List, IconButton } from "react-native-paper";
import { FontAwesome } from "@expo/vector-icons";
import { ProTooltip } from "../../../../components";

function Detail({ primary, secondary }) {
  return (
    <View
      style={{
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
      }}
    >
      <Text>{primary}</Text>

      <Text>{secondary}</Text>
    </View>
  );
}

function OtherMeasurementTab(props) {
  const { row, isLoading, product } = props;

  const [expanded, setExpanded] = useState(0);

  return (
    <List.Section>
      {product.unitOfMeasurements?.map((unit, index) => (
        <View style={styles.accordionContainer}>
          <TouchableOpacity
            onPress={() => {
              expanded === index ? setExpanded(false) : setExpanded(index);
            }}
            style={styles.header}
          >
            <Text style={styles.title}>Ölçü vahidi</Text>
            <View style={styles.spacer} />
            <Text style={styles.description}>{unit.unitOfMeasurementName}</Text>
            <IconButton
              icon={expanded === index ? "chevron-up" : "chevron-down"}
              size={20}
              onPress={() => {
                expanded === index ? setExpanded(false) : setExpanded(index);
              }}
            />
          </TouchableOpacity>

          {expanded === index && (
            <View style={styles.content}>
              <View style={styles.panelContent}>
                <ScrollView>
                  <Detail
                    primary={"Üst ölçü vahidi"}
                    secondary={
                      <View
                        style={{
                          display: "flex",
                          flexDirection: "row",
                          alignItems: "center",
                        }}
                      >
                        <Text style={styles.inlineText}>
                          {index === 0
                            ? product.unitOfMeasurementName
                            : product.unitOfMeasurements?.[index - 1]
                                ?.unitOfMeasurementName}
                        </Text>
                        {unit?.coefficient && (
                          <IconButton
                            icon="information"
                            size={20}
                            onPress={() =>
                              alert(
                                `1 ${unit.unitOfMeasurementName} = ${
                                  unit.coefficient
                                } ${
                                  index === 0
                                    ? product.unitOfMeasurementName
                                    : product.unitOfMeasurements?.[index - 1]
                                        ?.unitOfMeasurementName
                                }`
                              )
                            }
                          />
                        )}
                      </View>
                    }
                  />

                  <Detail
                    primary={"Satış qiyməti"}
                    secondary={
                      Number(unit?.salesPrice)
                        ? `${formatNumberToLocale(
                            defaultNumberFormat(unit?.salesPrice || 0)
                          )} ${unit?.tenantCurrencyCode || ""}`
                        : "-"
                    }
                  />
                </ScrollView>

                {/* {unit.specificPrices
              ?.filter((productPrice) => productPrice.amount)
              .map((type, key) => (
                <CustomerTypeDetail
                  key={key}
                  name={type.price_type_name}
                  currency={unit?.tenantCurrencyCode ?? product.currencyCode}
                  price={type.amount ?? unit?.salesPrice}
                  discount={
                    type.amount === null
                      ? 0
                      : 100 -
                        Number(type.amount * 100) /
                          Number(unit?.salesPrice || 1)
                  }
                />
              ))} */}
              </View>
            </View>
          )}
        </View>
      ))}
    </List.Section>
  );
}

const styles = StyleSheet.create({
  accordionContainer: {
    borderBottomWidth: 1,
    borderColor: "#ccc",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
  },
  title: {
    fontWeight: "bold",
    fontSize: 16,
  },
  spacer: {
    flex: 1,
  },
  description: {
    fontSize: 14,
    color: "gray",
    marginRight: 4,
  },
  content: {
    padding: 12,
    backgroundColor: "#f9f9f9",
  },
});

export default OtherMeasurementTab;
