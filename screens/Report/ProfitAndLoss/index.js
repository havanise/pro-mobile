import React, { useState, useEffect, useContext } from "react";
import { ProButton, ProText, SettingModal } from "../../../components";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import AntDesign from "@expo/vector-icons/AntDesign";
import {
  View,
  StyleSheet,
  Text,
  Modal,
  ActivityIndicator,
  ScrollView,
  Platform
} from "react-native";
import uuid from "react-uuid";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import XLSX from "xlsx";
import { Table, Row } from "react-native-reanimated-table";
import { createSettings, fetchReportList } from "../../../api";
import { PandL_ForDays_TABLE_SETTING_DATA } from "../../../utils/table-config/report";
import { useFilterHandle } from "../../../hooks";
import {
  currentMonth,
  currentYear,
  defaultNumberFormat,
  formatNumberToLocale,
} from "../../../utils";

const ProfitAndLoss = (props) => {
  const {
    allBusinessUnits,
    mainCurrency,
    setTableSettings,
    tableSettings,
    permissions
  } = props;
  const [data, setData] = useState({
    tableHead: [],
    widthArr: [],
    tableData: [],
  });
  const [visibleColumns, setVisibleColumns] = useState([]);
  const [settingVisible, setSettingVisible] = useState(false);
  const [tableSettingData, setTableSettingData] = useState(
    PandL_ForDays_TABLE_SETTING_DATA
  );
  const [exportModal, setExportModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const [filter, onFilter, setFilter] = useFilterHandle(
    {
      years: [currentYear],
      months: [currentMonth],
      businessUnitIds:
        allBusinessUnits?.length === 1
          ? allBusinessUnits[0]?.id !== null
            ? [allBusinessUnits[0]?.id]
            : undefined
          : undefined,
      groupByPeriod: "day",
    },
    ({ filters }) => {}
  );
  const handleExport = () => {
    setExportModal(true);
    fetchReportList({
      filter: {
        years: [currentYear],
        months: [currentMonth],
        businessUnitIds:
          allBusinessUnits?.length === 1
            ? allBusinessUnits[0]?.id !== null
              ? [allBusinessUnits[0]?.id]
              : undefined
            : undefined,
        groupByPeriod: "day",
      },
    }).then((productData) => {
      exportDataToExcel(productData);
      setExportModal(false);
    });
  };

  const exportDataToExcel = async (exData) => {
    const columnClone = [...visibleColumns];
    const getList = (key) => {
      return exData?.find((item) => item.key === key);
    };
    const data = Object.keys(exData?.[0]?.data || {})
      ?.sort(function (a, b) {
        return b - a;
      })
      ?.map((item, index) => {
        const arr = [];
        columnClone.includes(0) &&
          (arr[columnClone.indexOf(0)] = {
            [`Satışdan gəlir, ${mainCurrency.code}`]:
              getList(0)?.data?.[item] || "-",
          });
        columnClone.includes(1) &&
          (arr[columnClone.indexOf(1)] = {
            [`Satışdan maya dəyəri, ${mainCurrency.code}`]:
              getList(1)?.data?.[item] || "-",
          });
        columnClone.includes(2) &&
          (arr[columnClone.indexOf(2)] = {
            [`Məcmu mənfəət (zərər), ${mainCurrency.code}`]:
              getList(2)?.data?.[item] || "-",
          });
        columnClone.includes(3) &&
          (arr[columnClone.indexOf(3)] = {
            [`İnzibati xərclər, ${mainCurrency.code}`]:
              getList(3)?.data?.[item] || "-",
          });
        columnClone.includes(4) &&
          (arr[columnClone.indexOf(4)] = {
            [`Əməliyyat xəcləri, ${mainCurrency.code}`]:
              getList(4)?.data?.[item] || "-",
          });
        columnClone.includes(5) &&
          (arr[columnClone.indexOf(5)] = {
            [`Digər xərclər, ${mainCurrency.code}`]:
              getList(5)?.data?.[item] || "-",
          });
        columnClone.includes(6) &&
          (arr[columnClone.indexOf(6)] = {
            [`Əməliyyat mənfəəti (zərəri), ${mainCurrency.code}`]:
              getList(6)?.data?.[item] || "-",
          });
        columnClone.includes(7) &&
          (arr[columnClone.indexOf(7)] = {
            [`Maliyyə xərcləri, ${mainCurrency.code}`]:
              getList(7)?.data?.[item] || "-",
          });
        columnClone.includes(8) &&
          (arr[columnClone.indexOf(8)] = {
            [`Vergidən öncəki mənfəət (zərər), ${mainCurrency.code}`]:
              getList(8)?.data?.[item] || "-",
          });
        columnClone.includes(9) &&
          (arr[columnClone.indexOf(9)] = {
            [`Mənfəətdən vergilər xərci, ${mainCurrency.code}`]:
              getList(9)?.data?.[item] || "-",
          });
        columnClone.includes(10) &&
          (arr[columnClone.indexOf(10)] = {
            [`Xalis mənfəət (zərər), ${mainCurrency.code}`]:
              getList(10)?.data?.[item] || "-",
          });
        columnClone.includes(14) &&
          (arr[columnClone.indexOf(14)] = {
            [`Silinmiş mallar, ${mainCurrency.code}`]:
              getList(14)?.data?.[item] || "-",
          });
        columnClone.includes(15) &&
          (arr[columnClone.indexOf(15)] = {
            [`Əməkhaqqı fondu, ${mainCurrency.code}`]:
              getList(15)?.data?.[item] || "-",
          });
        columnClone.includes(16) &&
          (arr[columnClone.indexOf(16)] = {
            [`Geri alınmış mallarda itirilmiş mənfəət, ${mainCurrency.code}`]:
              getList(16)?.data?.[item] || "-",
          });

        columnClone.includes(19) &&
          (arr[columnClone.indexOf(19)] = {
            [`Dəqiqləşdirişmiş xalis mənfəət (zərər), ${mainCurrency.code}`]:
              getList(19)?.data?.[item] || "-",
          });
        const formattedDay = String(item).padStart(2, "0");
        const formattedMonth = String([currentMonth]).padStart(2, "0");
        const formattedYears = String([currentYear]).padStart(2, "0");
        arr.unshift({
          Tarix: `${formattedDay}-${formattedMonth}-${formattedYears}`,
        });

        return Object.assign({}, ...arr);
      });
    let sample_data_to_export = data;

    var ws = XLSX.utils.json_to_sheet(sample_data_to_export);
    var wb = XLSX.utils.book_new();
    var wscols = [];
    var cols_width = 20; // Default cell width
    wscols.push({
      wch: 12,
    }); // Set 1stColumn @32 character wide
    for (var i = 0; i < data.length; i++) {
      // Increase/Decrease condition_value based on the nmbr of columns you've on your excel sheet
      wscols.push({
        wch: cols_width,
      });
    }
    ws["!cols"] = wscols;
    XLSX.utils.book_append_sheet(wb, ws, "Cities");

    const base64 = XLSX.write(wb, { type: "base64", bookType: "xlsx" });
    const filename = FileSystem.documentDirectory + `report${uuid()}}.xlsx`;


    if (Platform.OS === 'android') {
      const permissions =
        await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();

      if (permissions.granted) {
        await FileSystem.StorageAccessFramework.createFileAsync(
          permissions.directoryUri,
          filename,
          "application/xls"
        )
          .then(async (uri) => {
            await FileSystem.writeAsStringAsync(uri, base64, {
              encoding: FileSystem.EncodingType.Base64,
            });
          })
          .catch((e) => console.log(e));
      } else {
        Sharing.shareAsync(filename);
      }
    } else if (Platform.OS === 'ios') {
      const fileUri = FileSystem.documentDirectory + `invoice${uuid()}}.xlsx`;

      await FileSystem.writeAsStringAsync(fileUri, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      await Sharing.shareAsync(fileUri, {
        UTI: "com.microsoft.excel.xlsx",
        mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
    }
  };

  useEffect(() => {
    const columns = [];
    let column = visibleColumns;
    if (visibleColumns !== undefined && mainCurrency) {
      fetchReportList({
        filter: filter,
      }).then((productData) => {
        const getList = (key) => {
          return productData?.find((item) => item.key === key);
        };

        setData({
          tableHead: [
            "Tarix",
            ...visibleColumns.map((item) => {
              return `${
                PandL_ForDays_TABLE_SETTING_DATA.find(
                  (i) => i.dataIndex === item
                ).name
              }, ${mainCurrency?.code}`;
            }),
          ],
          widthArr: [
            100,
            ...visibleColumns.map((el) => {
              return 140;
            }),
          ],
          tableData: Object.keys(productData?.[0]?.data || {})
            ?.sort(function (a, b) {
              return b - a;
            })
            ?.map((item) => {
              columns[column.indexOf(0)] = (
                <View style={{ display: "flex", flexDirection: "row" }}>
                  <Text>
                    {formatNumberToLocale(
                      defaultNumberFormat(getList(0)?.data?.[item] || 0)
                    )
                      .split(".")?.[0]
                      .replace(/,/g, " ")}
                  </Text>
                  <Text>
                    ,
                    {
                      formatNumberToLocale(
                        defaultNumberFormat(getList(0)?.data?.[item] || 0)
                      ).split(".")?.[1]
                    }
                  </Text>
                </View>
              );
              columns[column.indexOf(1)] = (
                <View style={{ display: "flex", flexDirection: "row" }}>
                  <Text>
                    {formatNumberToLocale(
                      defaultNumberFormat(getList(1)?.data?.[item] || 0)
                    )
                      .split(".")?.[0]
                      .replace(/,/g, " ")}
                  </Text>
                  <Text>
                    ,
                    {
                      formatNumberToLocale(
                        defaultNumberFormat(getList(1)?.data?.[item] || 0)
                      ).split(".")?.[1]
                    }
                  </Text>
                </View>
              );
              columns[column.indexOf(2)] = (
                <View style={{ display: "flex", flexDirection: "row" }}>
                  <Text>
                    {formatNumberToLocale(
                      defaultNumberFormat(getList(2)?.data?.[item] || 0)
                    )
                      .split(".")?.[0]
                      .replace(/,/g, " ")}
                  </Text>
                  <Text>
                    ,
                    {
                      formatNumberToLocale(
                        defaultNumberFormat(getList(2)?.data?.[item] || 0)
                      ).split(".")?.[1]
                    }
                  </Text>
                </View>
              );
              columns[column.indexOf(3)] = (
                <View style={{ display: "flex", flexDirection: "row" }}>
                  <Text>
                    {formatNumberToLocale(
                      defaultNumberFormat(getList(3)?.data?.[item] || 0)
                    )
                      .split(".")?.[0]
                      .replace(/,/g, " ")}
                  </Text>
                  <Text>
                    ,
                    {
                      formatNumberToLocale(
                        defaultNumberFormat(getList(3)?.data?.[item] || 0)
                      ).split(".")?.[1]
                    }
                  </Text>
                </View>
              );
              columns[column.indexOf(4)] = (
                <View style={{ display: "flex", flexDirection: "row" }}>
                  <Text>
                    {formatNumberToLocale(
                      defaultNumberFormat(getList(4)?.data?.[item] || 0)
                    )
                      .split(".")?.[0]
                      .replace(/,/g, " ")}
                  </Text>
                  <Text>
                    ,
                    {
                      formatNumberToLocale(
                        defaultNumberFormat(getList(4)?.data?.[item] || 0)
                      ).split(".")?.[1]
                    }
                  </Text>
                </View>
              );
              columns[column.indexOf(5)] = (
                <View style={{ display: "flex", flexDirection: "row" }}>
                  <Text>
                    {formatNumberToLocale(
                      defaultNumberFormat(getList(5)?.data?.[item] || 0)
                    )
                      .split(".")?.[0]
                      .replace(/,/g, " ")}
                  </Text>
                  <Text>
                    ,
                    {
                      formatNumberToLocale(
                        defaultNumberFormat(getList(5)?.data?.[item] || 0)
                      ).split(".")?.[1]
                    }
                  </Text>
                </View>
              );
              columns[column.indexOf(6)] = (
                <View style={{ display: "flex", flexDirection: "row" }}>
                  <Text>
                    {formatNumberToLocale(
                      defaultNumberFormat(getList(6)?.data?.[item] || 0)
                    )
                      .split(".")?.[0]
                      .replace(/,/g, " ")}
                  </Text>
                  <Text>
                    ,
                    {
                      formatNumberToLocale(
                        defaultNumberFormat(getList(6)?.data?.[item] || 0)
                      ).split(".")?.[1]
                    }
                  </Text>
                </View>
              );
              columns[column.indexOf(7)] = (
                <View style={{ display: "flex", flexDirection: "row" }}>
                  <Text>
                    {formatNumberToLocale(
                      defaultNumberFormat(getList(7)?.data?.[item] || 0)
                    )
                      .split(".")?.[0]
                      .replace(/,/g, " ")}
                  </Text>
                  <Text>
                    ,
                    {
                      formatNumberToLocale(
                        defaultNumberFormat(getList(7)?.data?.[item] || 0)
                      ).split(".")?.[1]
                    }
                  </Text>
                </View>
              );
              columns[column.indexOf(8)] = (
                <View style={{ display: "flex", flexDirection: "row" }}>
                  <Text>
                    {formatNumberToLocale(
                      defaultNumberFormat(getList(8)?.data?.[item] || 0)
                    )
                      .split(".")?.[0]
                      .replace(/,/g, " ")}
                  </Text>
                  <Text>
                    ,
                    {
                      formatNumberToLocale(
                        defaultNumberFormat(getList(8)?.data?.[item] || 0)
                      ).split(".")?.[1]
                    }
                  </Text>
                </View>
              );
              columns[column.indexOf(9)] = (
                <View style={{ display: "flex", flexDirection: "row" }}>
                  <Text>
                    {formatNumberToLocale(
                      defaultNumberFormat(getList(9)?.data?.[item] || 0)
                    )
                      .split(".")?.[0]
                      .replace(/,/g, " ")}
                  </Text>
                  <Text>
                    ,
                    {
                      formatNumberToLocale(
                        defaultNumberFormat(getList(9)?.data?.[item] || 0)
                      ).split(".")?.[1]
                    }
                  </Text>
                </View>
              );

              columns[column.indexOf(10)] = (
                <View style={{ display: "flex", flexDirection: "row" }}>
                  <Text>
                    {formatNumberToLocale(
                      defaultNumberFormat(getList(10)?.data?.[item] || 0)
                    )
                      .split(".")?.[0]
                      .replace(/,/g, " ")}
                  </Text>
                  <Text>
                    ,
                    {
                      formatNumberToLocale(
                        defaultNumberFormat(getList(10)?.data?.[item] || 0)
                      ).split(".")?.[1]
                    }
                  </Text>
                </View>
              );
              columns[column.indexOf(14)] = (
                <View style={{ display: "flex", flexDirection: "row" }}>
                  <Text>
                    {formatNumberToLocale(
                      defaultNumberFormat(getList(14)?.data?.[item] || 0)
                    )
                      .split(".")?.[0]
                      .replace(/,/g, " ")}
                  </Text>
                  <Text>
                    ,
                    {
                      formatNumberToLocale(
                        defaultNumberFormat(getList(14)?.data?.[item] || 0)
                      ).split(".")?.[1]
                    }
                  </Text>
                </View>
              );
              columns[column.indexOf(15)] = (
                <View style={{ display: "flex", flexDirection: "row" }}>
                  <Text>
                    {formatNumberToLocale(
                      defaultNumberFormat(getList(15)?.data?.[item] || 0)
                    )
                      .split(".")?.[0]
                      .replace(/,/g, " ")}
                  </Text>
                  <Text>
                    ,
                    {
                      formatNumberToLocale(
                        defaultNumberFormat(getList(15)?.data?.[item] || 0)
                      ).split(".")?.[1]
                    }
                  </Text>
                </View>
              );
              columns[column.indexOf(16)] = (
                <View style={{ display: "flex", flexDirection: "row" }}>
                  <Text>
                    {formatNumberToLocale(
                      defaultNumberFormat(getList(16)?.data?.[item] || 0)
                    )
                      .split(".")?.[0]
                      .replace(/,/g, " ")}
                  </Text>
                  <Text>
                    ,
                    {
                      formatNumberToLocale(
                        defaultNumberFormat(getList(16)?.data?.[item] || 0)
                      ).split(".")?.[1]
                    }
                  </Text>
                </View>
              );

              columns[column.indexOf(19)] = (
                <View style={{ display: "flex", flexDirection: "row" }}>
                  <Text>
                    {formatNumberToLocale(
                      defaultNumberFormat(getList(19)?.data?.[item] || 0)
                    )
                      .split(".")?.[0]
                      .replace(/,/g, " ")}
                  </Text>
                  <Text>
                    ,
                    {
                      formatNumberToLocale(
                        defaultNumberFormat(getList(19)?.data?.[item] || 0)
                      ).split(".")?.[1]
                    }
                  </Text>
                </View>
              );

              const formattedDay = String(item).padStart(2, "0");
              const formattedMonth = String(filter.months).padStart(2, "0");
              const formattedYears = String(filter.years).padStart(2, "0");

              // columns.unshift(<Text>{formattedDay}-{formattedMonth}-{formattedYears}</Text>)
              return [
                <Text>
                  {formattedDay}-{formattedMonth}-{formattedYears}
                </Text>,
                ...columns,
              ];
            }),
        });
      });
    }
  }, [visibleColumns, allBusinessUnits, mainCurrency]);

  useEffect(() => {
    if (
      tableSettings?.["PandLforDaysForMob"]?.columnsOrder?.length > 0 &&
      tableSettings?.["PandLforDaysForMob"]?.columnsOrder !== null
    ) {
      const parseData = JSON.parse(
        tableSettings?.["PandLforDaysForMob"]?.columnsOrder
      );
      const columns = parseData
        .filter((column) => column.visible === true)
        .map((column) => column.dataIndex);
      setVisibleColumns(columns);
      setTableSettingData(parseData);
    } else if (tableSettings?.["PandLforDaysForMob"]?.columnsOrder == null) {
      const column = PandL_ForDays_TABLE_SETTING_DATA.filter(
        (column) => column.visible === true
      ).map((column) => column.dataIndex);
      setVisibleColumns(column);
      setTableSettingData(PandL_ForDays_TABLE_SETTING_DATA);
    }
  }, [tableSettings]);

  const handleSaveSettingModal = (column) => {
    const tableColumn = column
      .filter((col) => col.visible === true)
      .map((col) => col.dataIndex);
    const filterColumn = column.filter((col) => col.dataIndex !== "id");
    const filterColumnData = JSON.stringify(filterColumn);

    createSettings({
      moduleName: "PandLforDaysForMob",
      columnsOrder: filterColumnData,
    }).then((res) => {
      const newTableSettings = {
        ...tableSettings,
        [`PandLforDaysForMob`]: { columnsOrder: filterColumnData },
      };
      setTableSettings(newTableSettings);
    });
    setVisibleColumns(tableColumn);
    setTableSettingData(column);

    setSettingVisible(false);
  };

  return (
    <>
      <Modal animationType="slide" transparent={true} visible={exportModal}>
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <ProText variant="heading" style={{ color: "black" }}>
              Excel sənədi yüklənir.......
            </ProText>
            <Text>Yüklənmə prosesi 1-2 dəqiqə davam edə bilər......</Text>
            <ActivityIndicator color={"#37B874"} />
          </View>
        </View>
      </Modal>
      <Modal
        animationType="slide"
        transparent={true}
        visible={settingVisible}
        onRequestClose={() => {
          setSettingVisible(false);
        }}
      >
        <SettingModal
          saveSetting={handleSaveSettingModal}
          setVisible={setSettingVisible}
          isVisible={settingVisible}
          columnSource={tableSettingData}
          AllStandartColumns={PandL_ForDays_TABLE_SETTING_DATA}
          fromPandL={mainCurrency}
        />
      </Modal>
      <View
        style={{
          flex: 1,
          paddingBottom: 40,
        }}
      >
        <View
          style={{
            marginBottom: 20,
            padding: 10,
            borderRadius: 4,
            backgroundColor: "#fff",
            display: "flex",
            gap: 10,
          }}
        >
          <View
            display="flex"
            flexDirection="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <ProButton
              label="Günlər üzrə"
              type={"tab"}
              defaultStyle={{ borderRadius: 30 }}
              buttonBorder={styles.buttonTabStyle}
            />
            <View display="flex" flexDirection="row" justifyContent="flex-end">
              <ProButton
                label={<AntDesign name="setting" size={18} color="#55ab80" />}
                type="transparent"
                onClick={() => setSettingVisible(true)}
                defaultStyle={{ borderRadius: 5 }}
                buttonBorder={styles.buttonStyle}
                flex={false}
              />
              {permissions.find((item) => item.key === "profit_and_loss_report")
                .permission === 2 && (
                 <ProButton
                  label={
                    <MaterialCommunityIcons
                      name="microsoft-excel"
                      size={18}
                      color="#55ab80"
                    />
                  }
                  onClick={() => handleExport()}
                  buttonBorder={styles.buttonStyle}
                  type="transparent"
                  defaultStyle={{ borderRadius: 5 }}
                  flex={false}
                />
              )}
            </View>
          </View>

          <ScrollView
            onScrollEndDrag={(e) => {
              if (!loading) {
                let paddingToBottom = 10;
                paddingToBottom += e.nativeEvent.layoutMeasurement.height;
                if (
                  e.nativeEvent.contentOffset.y >=
                  e.nativeEvent.contentSize.height - paddingToBottom
                ) {
                  setLoading(true);
                  if (filter.months[0] === 0) {
                    const columns = [];
                    let column = visibleColumns;
                    if (visibleColumns !== undefined) {
                      setFilter({
                        ...filter,
                        months: [12],
                        years: [filter.years[0] - 1],
                      });
                      fetchReportList({
                        filter: {
                          ...filter,
                          months: [12],
                          years: [filter.years[0] - 1],
                        },
                      }).then((productData) => {
                        const getList = (key) => {
                          return productData?.find((item) => item.key === key);
                        };
                        setLoading(false);
                        setData({
                          ...data,
                          tableData: [
                            ...data.tableData,
                            ...Object.keys(productData?.[0]?.data || {})
                              ?.sort(function (a, b) {
                                return b - a;
                              })
                              ?.map((item) => {
                                columns[column.indexOf(0)] = (
                                  <View
                                    style={{
                                      display: "flex",
                                      flexDirection: "row",
                                    }}
                                  >
                                    <Text>
                                      {formatNumberToLocale(
                                        defaultNumberFormat(
                                          getList(0)?.data?.[item] || 0
                                        )
                                      )
                                        .split(".")?.[0]
                                        .replace(/,/g, " ")}
                                    </Text>
                                    <Text>
                                      ,
                                      {
                                        formatNumberToLocale(
                                          defaultNumberFormat(
                                            getList(0)?.data?.[item] || 0
                                          )
                                        ).split(".")?.[1]
                                      }
                                    </Text>
                                  </View>
                                );
                                columns[column.indexOf(1)] = (
                                  <View
                                    style={{
                                      display: "flex",
                                      flexDirection: "row",
                                    }}
                                  >
                                    <Text>
                                      {formatNumberToLocale(
                                        defaultNumberFormat(
                                          getList(1)?.data?.[item] || 0
                                        )
                                      )
                                        .split(".")?.[0]
                                        .replace(/,/g, " ")}
                                    </Text>
                                    <Text>
                                      ,
                                      {
                                        formatNumberToLocale(
                                          defaultNumberFormat(
                                            getList(1)?.data?.[item] || 0
                                          )
                                        ).split(".")?.[1]
                                      }
                                    </Text>
                                  </View>
                                );
                                columns[column.indexOf(2)] = (
                                  <View
                                    style={{
                                      display: "flex",
                                      flexDirection: "row",
                                    }}
                                  >
                                    <Text>
                                      {formatNumberToLocale(
                                        defaultNumberFormat(
                                          getList(2)?.data?.[item] || 0
                                        )
                                      )
                                        .split(".")?.[0]
                                        .replace(/,/g, " ")}
                                    </Text>
                                    <Text>
                                      ,
                                      {
                                        formatNumberToLocale(
                                          defaultNumberFormat(
                                            getList(2)?.data?.[item] || 0
                                          )
                                        ).split(".")?.[1]
                                      }
                                    </Text>
                                  </View>
                                );
                                columns[column.indexOf(3)] = (
                                  <View
                                    style={{
                                      display: "flex",
                                      flexDirection: "row",
                                    }}
                                  >
                                    <Text>
                                      {formatNumberToLocale(
                                        defaultNumberFormat(
                                          getList(3)?.data?.[item] || 0
                                        )
                                      )
                                        .split(".")?.[0]
                                        .replace(/,/g, " ")}
                                    </Text>
                                    <Text>
                                      ,
                                      {
                                        formatNumberToLocale(
                                          defaultNumberFormat(
                                            getList(3)?.data?.[item] || 0
                                          )
                                        ).split(".")?.[1]
                                      }
                                    </Text>
                                  </View>
                                );
                                columns[column.indexOf(4)] = (
                                  <View
                                    style={{
                                      display: "flex",
                                      flexDirection: "row",
                                    }}
                                  >
                                    <Text>
                                      {formatNumberToLocale(
                                        defaultNumberFormat(
                                          getList(4)?.data?.[item] || 0
                                        )
                                      )
                                        .split(".")?.[0]
                                        .replace(/,/g, " ")}
                                    </Text>
                                    <Text>
                                      ,
                                      {
                                        formatNumberToLocale(
                                          defaultNumberFormat(
                                            getList(4)?.data?.[item] || 0
                                          )
                                        ).split(".")?.[1]
                                      }
                                    </Text>
                                  </View>
                                );
                                columns[column.indexOf(5)] = (
                                  <View
                                    style={{
                                      display: "flex",
                                      flexDirection: "row",
                                    }}
                                  >
                                    <Text>
                                      {formatNumberToLocale(
                                        defaultNumberFormat(
                                          getList(5)?.data?.[item] || 0
                                        )
                                      )
                                        .split(".")?.[0]
                                        .replace(/,/g, " ")}
                                    </Text>
                                    <Text>
                                      ,
                                      {
                                        formatNumberToLocale(
                                          defaultNumberFormat(
                                            getList(5)?.data?.[item] || 0
                                          )
                                        ).split(".")?.[1]
                                      }
                                    </Text>
                                  </View>
                                );
                                columns[column.indexOf(6)] = (
                                  <View
                                    style={{
                                      display: "flex",
                                      flexDirection: "row",
                                    }}
                                  >
                                    <Text>
                                      {formatNumberToLocale(
                                        defaultNumberFormat(
                                          getList(6)?.data?.[item] || 0
                                        )
                                      )
                                        .split(".")?.[0]
                                        .replace(/,/g, " ")}
                                    </Text>
                                    <Text>
                                      ,
                                      {
                                        formatNumberToLocale(
                                          defaultNumberFormat(
                                            getList(6)?.data?.[item] || 0
                                          )
                                        ).split(".")?.[1]
                                      }
                                    </Text>
                                  </View>
                                );
                                columns[column.indexOf(7)] = (
                                  <View
                                    style={{
                                      display: "flex",
                                      flexDirection: "row",
                                    }}
                                  >
                                    <Text>
                                      {formatNumberToLocale(
                                        defaultNumberFormat(
                                          getList(7)?.data?.[item] || 0
                                        )
                                      )
                                        .split(".")?.[0]
                                        .replace(/,/g, " ")}
                                    </Text>
                                    <Text>
                                      ,
                                      {
                                        formatNumberToLocale(
                                          defaultNumberFormat(
                                            getList(7)?.data?.[item] || 0
                                          )
                                        ).split(".")?.[1]
                                      }
                                    </Text>
                                  </View>
                                );
                                columns[column.indexOf(8)] = (
                                  <View
                                    style={{
                                      display: "flex",
                                      flexDirection: "row",
                                    }}
                                  >
                                    <Text>
                                      {formatNumberToLocale(
                                        defaultNumberFormat(
                                          getList(8)?.data?.[item] || 0
                                        )
                                      )
                                        .split(".")?.[0]
                                        .replace(/,/g, " ")}
                                    </Text>
                                    <Text>
                                      ,
                                      {
                                        formatNumberToLocale(
                                          defaultNumberFormat(
                                            getList(8)?.data?.[item] || 0
                                          )
                                        ).split(".")?.[1]
                                      }
                                    </Text>
                                  </View>
                                );
                                columns[column.indexOf(9)] = (
                                  <View
                                    style={{
                                      display: "flex",
                                      flexDirection: "row",
                                    }}
                                  >
                                    <Text>
                                      {formatNumberToLocale(
                                        defaultNumberFormat(
                                          getList(9)?.data?.[item] || 0
                                        )
                                      )
                                        .split(".")?.[0]
                                        .replace(/,/g, " ")}
                                    </Text>
                                    <Text>
                                      ,
                                      {
                                        formatNumberToLocale(
                                          defaultNumberFormat(
                                            getList(9)?.data?.[item] || 0
                                          )
                                        ).split(".")?.[1]
                                      }
                                    </Text>
                                  </View>
                                );

                                columns[column.indexOf(10)] = (
                                  <View
                                    style={{
                                      display: "flex",
                                      flexDirection: "row",
                                    }}
                                  >
                                    <Text>
                                      {formatNumberToLocale(
                                        defaultNumberFormat(
                                          getList(10)?.data?.[item] || 0
                                        )
                                      )
                                        .split(".")?.[0]
                                        .replace(/,/g, " ")}
                                    </Text>
                                    <Text>
                                      ,
                                      {
                                        formatNumberToLocale(
                                          defaultNumberFormat(
                                            getList(10)?.data?.[item] || 0
                                          )
                                        ).split(".")?.[1]
                                      }
                                    </Text>
                                  </View>
                                );
                                columns[column.indexOf(14)] = (
                                  <View
                                    style={{
                                      display: "flex",
                                      flexDirection: "row",
                                    }}
                                  >
                                    <Text>
                                      {formatNumberToLocale(
                                        defaultNumberFormat(
                                          getList(14)?.data?.[item] || 0
                                        )
                                      )
                                        .split(".")?.[0]
                                        .replace(/,/g, " ")}
                                    </Text>
                                    <Text>
                                      ,
                                      {
                                        formatNumberToLocale(
                                          defaultNumberFormat(
                                            getList(14)?.data?.[item] || 0
                                          )
                                        ).split(".")?.[1]
                                      }
                                    </Text>
                                  </View>
                                );
                                columns[column.indexOf(15)] = (
                                  <View
                                    style={{
                                      display: "flex",
                                      flexDirection: "row",
                                    }}
                                  >
                                    <Text>
                                      {formatNumberToLocale(
                                        defaultNumberFormat(
                                          getList(15)?.data?.[item] || 0
                                        )
                                      )
                                        .split(".")?.[0]
                                        .replace(/,/g, " ")}
                                    </Text>
                                    <Text>
                                      ,
                                      {
                                        formatNumberToLocale(
                                          defaultNumberFormat(
                                            getList(15)?.data?.[item] || 0
                                          )
                                        ).split(".")?.[1]
                                      }
                                    </Text>
                                  </View>
                                );
                                columns[column.indexOf(16)] = (
                                  <View
                                    style={{
                                      display: "flex",
                                      flexDirection: "row",
                                    }}
                                  >
                                    <Text>
                                      {formatNumberToLocale(
                                        defaultNumberFormat(
                                          getList(16)?.data?.[item] || 0
                                        )
                                      )
                                        .split(".")?.[0]
                                        .replace(/,/g, " ")}
                                    </Text>
                                    <Text>
                                      ,
                                      {
                                        formatNumberToLocale(
                                          defaultNumberFormat(
                                            getList(16)?.data?.[item] || 0
                                          )
                                        ).split(".")?.[1]
                                      }
                                    </Text>
                                  </View>
                                );

                                columns[column.indexOf(19)] = (
                                  <View
                                    style={{
                                      display: "flex",
                                      flexDirection: "row",
                                    }}
                                  >
                                    <Text>
                                      {formatNumberToLocale(
                                        defaultNumberFormat(
                                          getList(19)?.data?.[item] || 0
                                        )
                                      )
                                        .split(".")?.[0]
                                        .replace(/,/g, " ")}
                                    </Text>
                                    <Text>
                                      ,
                                      {
                                        formatNumberToLocale(
                                          defaultNumberFormat(
                                            getList(19)?.data?.[item] || 0
                                          )
                                        ).split(".")?.[1]
                                      }
                                    </Text>
                                  </View>
                                );

                                const formattedDay = String(item).padStart(
                                  2,
                                  "0"
                                );
                                const formattedMonth = String([12]).padStart(
                                  2,
                                  "0"
                                );
                                const formattedYears = String([
                                  filter.years[0] - 1,
                                ]).padStart(2, "0");

                                // columns.unshift(<Text>{formattedDay}-{formattedMonth}-{formattedYears}</Text>)
                                return [
                                  <Text>
                                    {formattedDay}-{formattedMonth}-
                                    {formattedYears}
                                  </Text>,
                                  ...columns,
                                ];
                              }),
                          ],
                        });
                      });
                    }
                  } else {
                    const columns = [];
                    let column = visibleColumns;
                    if (visibleColumns !== undefined) {
                      fetchReportList({
                        filter: {
                          ...filter,
                          months: [filter.months[0] - 1],
                        },
                      }).then((productData) => {
                        const getList = (key) => {
                          return productData?.find((item) => item.key === key);
                        };
                        setFilter({
                          ...filter,
                          months: [filter.months[0] - 1],
                        });
                        setLoading(false);
                        setData({
                          ...data,
                          tableData: [
                            ...data.tableData,
                            ...Object.keys(productData?.[0]?.data || {})
                              ?.sort(function (a, b) {
                                return b - a;
                              })
                              ?.map((item) => {
                                columns[column.indexOf(0)] = (
                                  <View
                                    style={{
                                      display: "flex",
                                      flexDirection: "row",
                                    }}
                                  >
                                    <Text>
                                      {formatNumberToLocale(
                                        defaultNumberFormat(
                                          getList(0)?.data?.[item] || 0
                                        )
                                      )
                                        .split(".")?.[0]
                                        .replace(/,/g, " ")}
                                    </Text>
                                    <Text>
                                      ,
                                      {
                                        formatNumberToLocale(
                                          defaultNumberFormat(
                                            getList(0)?.data?.[item] || 0
                                          )
                                        ).split(".")?.[1]
                                      }
                                    </Text>
                                  </View>
                                );
                                columns[column.indexOf(1)] = (
                                  <View
                                    style={{
                                      display: "flex",
                                      flexDirection: "row",
                                    }}
                                  >
                                    <Text>
                                      {formatNumberToLocale(
                                        defaultNumberFormat(
                                          getList(1)?.data?.[item] || 0
                                        )
                                      )
                                        .split(".")?.[0]
                                        .replace(/,/g, " ")}
                                    </Text>
                                    <Text>
                                      ,
                                      {
                                        formatNumberToLocale(
                                          defaultNumberFormat(
                                            getList(1)?.data?.[item] || 0
                                          )
                                        ).split(".")?.[1]
                                      }
                                    </Text>
                                  </View>
                                );
                                columns[column.indexOf(2)] = (
                                  <View
                                    style={{
                                      display: "flex",
                                      flexDirection: "row",
                                    }}
                                  >
                                    <Text>
                                      {formatNumberToLocale(
                                        defaultNumberFormat(
                                          getList(2)?.data?.[item] || 0
                                        )
                                      )
                                        .split(".")?.[0]
                                        .replace(/,/g, " ")}
                                    </Text>
                                    <Text>
                                      ,
                                      {
                                        formatNumberToLocale(
                                          defaultNumberFormat(
                                            getList(2)?.data?.[item] || 0
                                          )
                                        ).split(".")?.[1]
                                      }
                                    </Text>
                                  </View>
                                );
                                columns[column.indexOf(3)] = (
                                  <View
                                    style={{
                                      display: "flex",
                                      flexDirection: "row",
                                    }}
                                  >
                                    <Text>
                                      {formatNumberToLocale(
                                        defaultNumberFormat(
                                          getList(3)?.data?.[item] || 0
                                        )
                                      )
                                        .split(".")?.[0]
                                        .replace(/,/g, " ")}
                                    </Text>
                                    <Text>
                                      ,
                                      {
                                        formatNumberToLocale(
                                          defaultNumberFormat(
                                            getList(3)?.data?.[item] || 0
                                          )
                                        ).split(".")?.[1]
                                      }
                                    </Text>
                                  </View>
                                );
                                columns[column.indexOf(4)] = (
                                  <View
                                    style={{
                                      display: "flex",
                                      flexDirection: "row",
                                    }}
                                  >
                                    <Text>
                                      {formatNumberToLocale(
                                        defaultNumberFormat(
                                          getList(4)?.data?.[item] || 0
                                        )
                                      )
                                        .split(".")?.[0]
                                        .replace(/,/g, " ")}
                                    </Text>
                                    <Text>
                                      ,
                                      {
                                        formatNumberToLocale(
                                          defaultNumberFormat(
                                            getList(4)?.data?.[item] || 0
                                          )
                                        ).split(".")?.[1]
                                      }
                                    </Text>
                                  </View>
                                );
                                columns[column.indexOf(5)] = (
                                  <View
                                    style={{
                                      display: "flex",
                                      flexDirection: "row",
                                    }}
                                  >
                                    <Text>
                                      {formatNumberToLocale(
                                        defaultNumberFormat(
                                          getList(5)?.data?.[item] || 0
                                        )
                                      )
                                        .split(".")?.[0]
                                        .replace(/,/g, " ")}
                                    </Text>
                                    <Text>
                                      ,
                                      {
                                        formatNumberToLocale(
                                          defaultNumberFormat(
                                            getList(5)?.data?.[item] || 0
                                          )
                                        ).split(".")?.[1]
                                      }
                                    </Text>
                                  </View>
                                );
                                columns[column.indexOf(6)] = (
                                  <View
                                    style={{
                                      display: "flex",
                                      flexDirection: "row",
                                    }}
                                  >
                                    <Text>
                                      {formatNumberToLocale(
                                        defaultNumberFormat(
                                          getList(6)?.data?.[item] || 0
                                        )
                                      )
                                        .split(".")?.[0]
                                        .replace(/,/g, " ")}
                                    </Text>
                                    <Text>
                                      ,
                                      {
                                        formatNumberToLocale(
                                          defaultNumberFormat(
                                            getList(6)?.data?.[item] || 0
                                          )
                                        ).split(".")?.[1]
                                      }
                                    </Text>
                                  </View>
                                );
                                columns[column.indexOf(7)] = (
                                  <View
                                    style={{
                                      display: "flex",
                                      flexDirection: "row",
                                    }}
                                  >
                                    <Text>
                                      {formatNumberToLocale(
                                        defaultNumberFormat(
                                          getList(7)?.data?.[item] || 0
                                        )
                                      )
                                        .split(".")?.[0]
                                        .replace(/,/g, " ")}
                                    </Text>
                                    <Text>
                                      ,
                                      {
                                        formatNumberToLocale(
                                          defaultNumberFormat(
                                            getList(7)?.data?.[item] || 0
                                          )
                                        ).split(".")?.[1]
                                      }
                                    </Text>
                                  </View>
                                );
                                columns[column.indexOf(8)] = (
                                  <View
                                    style={{
                                      display: "flex",
                                      flexDirection: "row",
                                    }}
                                  >
                                    <Text>
                                      {formatNumberToLocale(
                                        defaultNumberFormat(
                                          getList(8)?.data?.[item] || 0
                                        )
                                      )
                                        .split(".")?.[0]
                                        .replace(/,/g, " ")}
                                    </Text>
                                    <Text>
                                      ,
                                      {
                                        formatNumberToLocale(
                                          defaultNumberFormat(
                                            getList(8)?.data?.[item] || 0
                                          )
                                        ).split(".")?.[1]
                                      }
                                    </Text>
                                  </View>
                                );
                                columns[column.indexOf(9)] = (
                                  <View
                                    style={{
                                      display: "flex",
                                      flexDirection: "row",
                                    }}
                                  >
                                    <Text>
                                      {formatNumberToLocale(
                                        defaultNumberFormat(
                                          getList(9)?.data?.[item] || 0
                                        )
                                      )
                                        .split(".")?.[0]
                                        .replace(/,/g, " ")}
                                    </Text>
                                    <Text>
                                      ,
                                      {
                                        formatNumberToLocale(
                                          defaultNumberFormat(
                                            getList(9)?.data?.[item] || 0
                                          )
                                        ).split(".")?.[1]
                                      }
                                    </Text>
                                  </View>
                                );

                                columns[column.indexOf(10)] = (
                                  <View
                                    style={{
                                      display: "flex",
                                      flexDirection: "row",
                                    }}
                                  >
                                    <Text>
                                      {formatNumberToLocale(
                                        defaultNumberFormat(
                                          getList(10)?.data?.[item] || 0
                                        )
                                      )
                                        .split(".")?.[0]
                                        .replace(/,/g, " ")}
                                    </Text>
                                    <Text>
                                      ,
                                      {
                                        formatNumberToLocale(
                                          defaultNumberFormat(
                                            getList(10)?.data?.[item] || 0
                                          )
                                        ).split(".")?.[1]
                                      }
                                    </Text>
                                  </View>
                                );
                                columns[column.indexOf(14)] = (
                                  <View
                                    style={{
                                      display: "flex",
                                      flexDirection: "row",
                                    }}
                                  >
                                    <Text>
                                      {formatNumberToLocale(
                                        defaultNumberFormat(
                                          getList(14)?.data?.[item] || 0
                                        )
                                      )
                                        .split(".")?.[0]
                                        .replace(/,/g, " ")}
                                    </Text>
                                    <Text>
                                      ,
                                      {
                                        formatNumberToLocale(
                                          defaultNumberFormat(
                                            getList(14)?.data?.[item] || 0
                                          )
                                        ).split(".")?.[1]
                                      }
                                    </Text>
                                  </View>
                                );
                                columns[column.indexOf(15)] = (
                                  <View
                                    style={{
                                      display: "flex",
                                      flexDirection: "row",
                                    }}
                                  >
                                    <Text>
                                      {formatNumberToLocale(
                                        defaultNumberFormat(
                                          getList(15)?.data?.[item] || 0
                                        )
                                      )
                                        .split(".")?.[0]
                                        .replace(/,/g, " ")}
                                    </Text>
                                    <Text>
                                      ,
                                      {
                                        formatNumberToLocale(
                                          defaultNumberFormat(
                                            getList(15)?.data?.[item] || 0
                                          )
                                        ).split(".")?.[1]
                                      }
                                    </Text>
                                  </View>
                                );
                                columns[column.indexOf(16)] = (
                                  <View
                                    style={{
                                      display: "flex",
                                      flexDirection: "row",
                                    }}
                                  >
                                    <Text>
                                      {formatNumberToLocale(
                                        defaultNumberFormat(
                                          getList(16)?.data?.[item] || 0
                                        )
                                      )
                                        .split(".")?.[0]
                                        .replace(/,/g, " ")}
                                    </Text>
                                    <Text>
                                      ,
                                      {
                                        formatNumberToLocale(
                                          defaultNumberFormat(
                                            getList(16)?.data?.[item] || 0
                                          )
                                        ).split(".")?.[1]
                                      }
                                    </Text>
                                  </View>
                                );

                                columns[column.indexOf(19)] = (
                                  <View
                                    style={{
                                      display: "flex",
                                      flexDirection: "row",
                                    }}
                                  >
                                    <Text>
                                      {formatNumberToLocale(
                                        defaultNumberFormat(
                                          getList(19)?.data?.[item] || 0
                                        )
                                      )
                                        .split(".")?.[0]
                                        .replace(/,/g, " ")}
                                    </Text>
                                    <Text>
                                      ,
                                      {
                                        formatNumberToLocale(
                                          defaultNumberFormat(
                                            getList(19)?.data?.[item] || 0
                                          )
                                        ).split(".")?.[1]
                                      }
                                    </Text>
                                  </View>
                                );

                                const formattedDay = String(item).padStart(
                                  2,
                                  "0"
                                );
                                const formattedMonth = String([
                                  filter.months[0] - 1,
                                ]).padStart(2, "0");
                                const formattedYears = String(
                                  filter.years
                                ).padStart(2, "0");

                                // columns.unshift(<Text>{formattedDay}-{formattedMonth}-{formattedYears}</Text>)
                                return [
                                  <Text>
                                    {formattedDay}-{formattedMonth}-
                                    {formattedYears}
                                  </Text>,
                                  ...columns,
                                ];
                              }),
                          ],
                        });
                      });
                    }
                  }
                }
              }
            }}
          >
            <ScrollView nestedScrollEnabled={true} horizontal={true}>
              <View style={{ marginBottom: 40 }}>
                <Table
                  style={{ marginBottom: 150 }}
                  borderStyle={{ borderWidth: 1, borderColor: "white" }}
                >
                  <Row
                    data={data.tableHead}
                    widthArr={data.widthArr}
                    style={styles.head}
                    textStyle={styles.headText}
                  />
                  {data?.tableData?.map((rowData, index) => (
                    <Row
                      key={index}
                      data={rowData}
                      widthArr={data.widthArr}
                      style={styles.rowSection}
                      textStyle={styles.text}
                    />
                  ))}
                </Table>
              </View>
            </ScrollView>
          </ScrollView>
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  head: { height: 44, backgroundColor: "#55ab80" },
  headText: {
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
    color: "white",
  },
  rowSection: { flexDirection: "row", borderWidth: 1, borderColor: "#eeeeee" },
  text: { margin: 6, fontSize: 14, textAlign: "center" },
  buttonStyle: {
    borderWidth: 1,
    borderColor: "#55ab80",
    borderRadius: 5,
    paddingLeft: 12,
    paddingRight: 12,
    marginLeft: 14,
  },
  buttonTabStyle: {
    borderWidth: 1,
    borderRadius: 30,
    borderColor: "#55ab80",
    width: "50%",
  },
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
});
export default ProfitAndLoss;
