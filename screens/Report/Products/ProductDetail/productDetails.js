/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image
} from "react-native";
import Entypo from "@expo/vector-icons/Entypo";
import { FontAwesome } from "@expo/vector-icons";
import { entries, groupBy, isEmpty, map, filter } from "lodash";
import { defaultNumberFormat, formatNumberToLocale } from "../../../../utils";
import { ProTooltip } from "../../../../components";
import { fetchProduct } from "../../../../api/sale";

function Detail({ primary, secondary }) {
  return (
    <View
      style={{
        display: "flex",
        flexDirection: "row",
        paddingBottom: 10,
        paddingTop: 10,
        justifyContent: "space-between",
        borderBottomWidth: 1,
        borderColor: "#efefef",
      }}
    >
      <Text>{primary}</Text>

      <Text>{secondary}</Text>
    </View>
  );
}

const ProductDetails = (props) => {
  const { row, isLoading, product, setProduct } = props;

  const componentRef = useRef();
  const [previewVisible, setPreviewVisible] = useState(false);

  const [collapse, setCollapse] = useState(true);
  const [brandCollapse, setBrandCollapse] = useState({});

  useEffect(() => {
    if (row?.id) {
      fetchProduct({ apiEnd: row.id }).then((res) => setProduct(res));
      // fetchCurrencies();
    }
  }, [row]);

  const {
    name,
    brandName,
    currencyCode,
    catalogName,
    barcode,
    productCode,
    description,
    productPrices,
    unitOfMeasurementName,
    salesPrice,
    roadTax_ul,
    isServiceType,
    parentCatalogName,
    isWithoutSerialNumber,
    quantity,
    labels,
    minimumStockQuantity,
    lifetime,
  } = product;

  return isLoading ? (
    <ActivityIndicator color={"gray"} />
  ) : (
    <View>
      <View style={{ marginTop: 10, marginBottom: 10 }}>
        <ProTooltip
          containerStyle={{ width: 145, height: "auto" }}
          popover={
            <Text>{name?.length > 25 ? name.slice(0, 25) + "..." : name}</Text>
          }
          trigger={<Text style={styles.modalTitle}>{name}</Text>}
        />
      </View>

      <ScrollView style={{ marginBottom: 80 }}>
        <Detail
          primary={"Məhsul Tipi"}
          secondary={isServiceType ? "Servis" : "Məhsul"}
        />

        <Detail
          primary={"Seriya Nömrəsi"}
          secondary={isWithoutSerialNumber ? "Yox" : "Hə"}
        />

        <Detail primary={"Barkod"} secondary={barcode || "-"} />
        <Detail primary={"Məhsul kodu"} secondary={productCode || "-"} />

        <Detail primary={"Kataloq"} secondary={parentCatalogName || "-"} />

        <Detail
          primary={"Alt kataloq"}
          secondary={catalogName === parentCatalogName ? "-" : catalogName}
        />

        <Detail
          primary={"Məhsul adı"}
          secondary={
            (
              <Text>
                {name?.length > 25 ? name.slice(0, 25) + "..." : name}
              </Text>
            ) || "-"
          }
        />

        <Detail
          primary={"Marka adı"}
          secondary={
            (
              <Text>
                {brandName?.length > 25
                  ? brandName.slice(0, 25) + "..."
                  : brandName ?? "-"}
              </Text>
            ) || "-"
          }
        />

        {row?.attachmentId !== null ? (
          <Detail
            primary={"Fotoşəkil"}
            secondary={
              <View className={styles.fileIcon}>
                <Image
                  src={row.attachmentUrl}
                  style={{ borderRadius: 50, width: 40, height: 40 }}
                />

                {/* <div className={styles.description}>
                <div className={styles.descriptionIcons}>
                  <DetailButton
                    className={styles.descriptionIcon}
                    onClick={() => setPreviewVisible(true)}
                  />
                </div>
              </div> */}
              </View>
            }
          />
        ) : null}
        <Detail
          primary={"Anbar qalığı"}
          secondary={
            row.quantity && row.quantity !== null
              ? formatNumberToLocale(defaultNumberFormat(row.quantity))
              : "-"
          }
        />

        <Detail
          primary={"Ölçü vahidi"}
          secondary={unitOfMeasurementName || "-"}
        />

        <Detail
          primary={"Satış qiyməti"}
          secondary={
            Number(salesPrice)
              ? `${formatNumberToLocale(defaultNumberFormat(salesPrice))} ${
                  currencyCode || ""
                }`
              : "-"
          }
        />

        <Detail
          primary={"Yol vergisi"}
          secondary={
            !isEmpty(row?.roadTaxes) ? (
              <>
                <Text>
                  {formatNumberToLocale(
                    defaultNumberFormat(row?.roadTaxes?.[0]?.amount)
                  )}{" "}
                  {row?.roadTaxes[0]?.currencyCode}
                </Text>
                {filter(row?.roadTaxes, (_, index) => index !== 0)?.length >
                0 ? (
                  <ProTooltip
                    containerStyle={{ width: 145, height: "auto" }}
                    popover={
                      <View
                        style={{
                          display: "flex",
                          flexDirection: "column",
                        }}
                      >
                        {filter(row?.roadTaxes, (_, index) => index !== 0)?.map(
                          (tax) => (
                            <Text>
                              {Number(tax?.amount ?? 0)} {tax?.currencyCode}
                            </Text>
                          )
                        )}
                      </View>
                    }
                    trigger={<FontAwesome name="info-circle" size={18} />}
                  />
                ) : null}
              </>
            ) : (
              "-"
            )
          }
        />

        <Detail
          primary={"İstismar müddəti"}
          secondary={Number(lifetime) ? `${Number(lifetime)} gün` : "-"}
        />

        <Detail
          primary={"Anbarlar üzrə minimal qalıq"}
          secondary={
            minimumStockQuantity
              ? `${Number(minimumStockQuantity)} ${unitOfMeasurementName}`
              : "-"
          }
        />

        <Detail
          primary={"Status"}
          secondary={
            row.isDeleted ? (
              <Text
                style={{
                  color: "#C4C4C4",
                  background: "#F8F8F8",
                  textAlign: "center",
                }}
              >
                Silinib
              </Text>
            ) : (
              (
                <Text
                  style={{
                    color: "#F3B753",
                    background: "#FDF7EA",
                    textAlign: "center",
                  }}
                >
                  Aktiv
                </Text>
              ) || "-"
            )
          }
        />

        {description ? (
          <View>
            <TouchableOpacity
              onPress={() => {
                setCollapse(!collapse);
              }}
            >
              <View style={{ ...styles.row, ...styles.withoutBorder }}>
                <Text style={styles.text}>Əlavə məlumat</Text>
                <Entypo
                  name={collapse ? "chevron-small-right" : "chevron-small-down"}
                  size={20}
                  color="black"
                />
              </View>
            </TouchableOpacity>
            {collapse && <Text>{description}</Text>}
          </View>
        ) : (
          <View style={styles.row}>
            <Text style={styles.text}>Əlavə məlumat</Text>
            <Text>{description || "-"}</Text>
          </View>
        )}

        {entries(groupBy(labels, (row) => row.parent.name))?.map((label) => (
          <View>
            <TouchableOpacity
              onPress={() => {
                setBrandCollapse((prev) => ({
                  ...prev,
                  [label[0]]: !prev[label[0]],
                }));
              }}
            >
              <View style={{ ...styles.row, ...styles.withoutBorder }}>
                <Text style={styles.text}>{label[0]}</Text>
                <Entypo
                  name={
                    brandCollapse[label[0]]
                      ? "chevron-small-right"
                      : "chevron-small-down"
                  }
                  size={20}
                  color="black"
                />
              </View>
            </TouchableOpacity>
            {!brandCollapse[label[0]] && (
              <Text>
                {map(label[1], (child) => (
                  <View style={{}}>
                    <View
                      style={{
                        backgroundColor: `#${child.parent.color
                          .toString(16)
                          .padStart(6, "0")}`,
                        paddingTop: 6,
                        paddingBottom: 6,
                        paddingLeft: 8,
                        paddingRight: 8,
                        marginLeft: 5,
                      }}
                    >
                      <Text style={{ color: "#fff" }}>{child.name}</Text>
                    </View>
                  </View>
                ))}
              </Text>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  modalTitle: {
    fontWeight: "bold",
    fontSize: 24,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderColor: "#efefef",
    paddingBottom: 10,
    paddingTop: 10,
  },
  withoutBorder: {
    borderBottomWidth: 0,
  },
});

export default ProductDetails;
