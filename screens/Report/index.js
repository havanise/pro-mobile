import React, { useContext, useState, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useActionSheet } from "@expo/react-native-action-sheet";
import { TenantContext, AuthContext } from "../../context";
import {
  clearToken,
  currentMonth,
  currentYear,
  defaultNumberFormat,
  formatNumberToLocale,
} from "../../utils";
import { useApi, useFilterHandle } from "../../hooks";
import { TabView, TabBar } from "react-native-tab-view";
import { Table, Row } from "react-native-reanimated-table";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import XLSX from "xlsx";
import uuid from "react-uuid";
import {
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
  ScrollView,
  useWindowDimensions,
  Modal,
  ActivityIndicator,
  Text,
} from "react-native";
import { DefaultUser, Logo } from "../../assets";
import { Container } from "./styles";
import { getSettings, fetchReportList } from "../../api";
import { createSettings } from "../../api/operation-panel";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import AntDesign from "@expo/vector-icons/AntDesign";
import { PandL_ForDays_TABLE_SETTING_DATA } from "../../utils/table-config/report";
import { ProButton, ProText, SettingModal } from "../../components";
import { fetchMainCurrency } from "../../api/currencies";

const FirstRoute = (props) => {
  const {
    profile,
    BUSINESS_TKN_UNIT,
    statusData,
    allBusinessUnits,
    permissionsByKeyValue,
    mainCurrency,
    setTableSettings,
    tableSettings,
  } = props;
  const [data, setData] = useState({
    tableHead: [],
    widthArr: [],
    tableData: [],
  });
  const [tableConfiguration, setTableConfiguration] = useState([]);
  const [visibleColumns, setVisibleColumns] = useState([]);
  const [settingVisible, setSettingVisible] = useState(false);
  const [tableSettingData, setTableSettingData] = useState(
    PandL_ForDays_TABLE_SETTING_DATA
  );
  const [reportsList, setReportsList] = useState([]);
  const [invoicesCount, setInvoicesCount] = useState(0);
  const [statusLoading, setStatusLoading] = useState(false);
  const [exportModal, setExportModal] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedRow, setSelectedRow] = useState({});

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
    () => {
      // fetchSalesInvoicesCount({
      //   filter: filter,
      // }).then((productData) => {
      //   setInvoicesCount(productData);
      // });
    }
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
      tableSettings?.["PandLforDaysForMobile"]?.columnsOrder?.length > 0 &&
      tableSettings?.["PandLforDaysForMobile"]?.columnsOrder !== null
    ) {
      const parseData = JSON.parse(
        tableSettings?.["PandLforDaysForMobile"]?.columnsOrder
      );
      const columns = parseData
        .filter((column) => column.visible === true)
        .map((column) => column.dataIndex);
      setVisibleColumns(columns);
      setTableSettingData(parseData);
    } else if (tableSettings?.["PandLforDaysForMobile"]?.columnsOrder == null) {
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
      moduleName: "PandLforDaysForMobile",
      columnsOrder: filterColumnData,
    }).then((res) => {
      const newTableSettings = {
        ...tableSettings,
        [`PandLforDaysForMobile`]: { columnsOrder: filterColumnData },
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
          columnSource={tableSettingData.map((item) => {
            return { ...item, name: `${item.name}, ${mainCurrency?.code}` };
          })}
          AllStandartColumns={PandL_ForDays_TABLE_SETTING_DATA.map((item) => {
            return { ...item, name: `${item.name}, ${mainCurrency?.code}` };
          })}
        />
      </Modal>
      <View
        style={{
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

const Report = ({ navigation }) => {
  useContext(TenantContext);
  const {
    profile,
    tenant,
    permissionsByKeyValue,
    BUSINESS_TKN_UNIT,
    tableSettings,
    setTableSettings,
  } = useContext(TenantContext);
  const [isLogged, setIsLogged] = useContext(AuthContext);
  const { showActionSheetWithOptions } = useActionSheet();
  const layout = useWindowDimensions();

  const [index, setIndex] = useState(0);
  const [mainCurrency, setMainCurrency] = useState();
  const [routes] = useState([{ key: "first", title: "Mənfəət və Zərər" }]);

  const doUserLogOut = () => {
    const options = ["Çıxış"];
    const cancelButtonIndex = 999;
    const containerStyle = {
      maxHeight: 400,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
    };

    showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex,
        containerStyle,
      },
      async (selectedIndex) => {
        if (selectedIndex === 0) {
          return await clearToken()
            .then(async () => {
              setIsLogged(false);
              return true;
            })
            .catch((error) => {
              Alert.alert("Error!", error.message);
              return false;
            });
        }
      }
    );
  };

  useEffect(() => {
    fetchMainCurrency().then((res) => {
      setMainCurrency(res);
    });
  }, []);

  const renderScene = ({ route }) => {
    switch (route.key) {
      case "first":
        return (
          <FirstRoute
            navigation={navigation}
            BUSINESS_TKN_UNIT={BUSINESS_TKN_UNIT}
            profile={profile}
            // allBusinessUnits={allBusinessUnits}
            // statusData={statusData}
            permissionsByKeyValue={permissionsByKeyValue}
            mainCurrency={mainCurrency}
            tableSettings={tableSettings}
            setTableSettings={setTableSettings}
          />
        );

      default:
        return null;
    }
  };

  const renderBadge = ({ route }) => {
    if (route.key === "albums") {
      return (
        <View style={styles.badge}>
          <Text style={styles.count}>42</Text>
        </View>
      );
    }
    return null;
  };

  const renderTabBar = (props) => (
    <TabBar {...props} renderBadge={renderBadge} style={styles.tabbar} />
  );
  return (
    <SafeAreaView>
      <Container>
        <View style={styles.inputContainer}>
          <Image source={Logo} />
          <TouchableOpacity
            onPress={() => {
              doUserLogOut();
            }}
          >
            {profile?.attachment?.thumb ? (
              <Image
                src={profile?.attachment?.thumb}
                style={{ borderRadius: 50, width: 40, height: 40 }}
              />
            ) : (
              <Image
                source={DefaultUser}
                style={{ borderRadius: 50, width: 40, height: 40 }}
              />
            )}
          </TouchableOpacity>
        </View>
      </Container>
      <View
        style={{
          height: "100%",
        }}
      >
        <TabView
          navigationState={{ index, routes }}
          renderScene={renderScene}
          onIndexChange={setIndex}
          initialLayout={{ width: layout.width }}
          renderTabBar={renderTabBar}
          swipeEnabled={false}
        />
      </View>
      {/* <View style={styles.container}>
       
        <View style={styles.textBorder}>
          <ProText
            variant="heading"
            style={{ color: "black", textAlign: "center", fontWeight: 600 }}
          >
            Hal-hazırda daxil olduğunuz modul üzrə yaxşılaşdırma işləri gedir!
          </ProText>
          <View style={styles.quote}></View>
        </View>
      </View> */}
    </SafeAreaView>
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
  tabbar: {
    backgroundColor: "#37B874",
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
  inputContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 10,
  },
  textBorder: {
    borderWidth: 1,
    borderRadius: 30,
    borderColor: "#6fc99c",
    backgroundColor: "#6fc99c",
    margin: 40,
    marginTop: -40,
    padding: 40,
  },
  container: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
  },
  quote: {
    display: "flex",
    borderWidth: 38,
    borderBottomColor: "transparent",
    borderLeftColor: "#6fc99c",
    borderRightColor: "transparent",
    borderTopColor: "transparent",
    position: "absolute",
    bottom: -35,
    left: 70,
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
export default Report;
