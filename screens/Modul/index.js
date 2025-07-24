import React, { useContext, useState, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useActionSheet } from "@expo/react-native-action-sheet";
import { TenantContext, AuthContext } from "../../context";
import uuid from "react-uuid";
import {
  clearToken,
  defaultNumberFormat,
  formatNumberToLocale,
  getData,
  groupByKey,
  roundToDown,
} from "../../utils";
import { getHighestPermissionKey } from "../../utils/permissions";
import { useApi, useFilterHandle } from "../../hooks";
import { Table, Row } from "react-native-reanimated-table";
import Toast from "react-native-toast-message";
import Entypo from "@expo/vector-icons/Entypo";
import { Sales_Invoices_TABLE_SETTING_DATA } from "../../utils/table-config/salesBuyModule";
import { TRANSACTION_LIST_TABLE_SETTING_DATA } from "../../utils/table-config/financeModule";
import {
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
  useWindowDimensions,
  ScrollView,
  Text,
  Modal,
  ActivityIndicator,
  Pressable,
  Platform
} from "react-native";
import {
  getSettings,
  fetchSalesInvoicesCount,
  fetchSalesInvoiceList,
  fetchTransactionList,
  fetchTransactionsCount,
  fetchStatusOperations,
  editInvoiceStatus,
  fetchBarterInvoices,
  deleteInvoice,
  deleteTransaction,
  fetchSalesInvoiceInfo,
  fetchSalesBuysForms,
} from "../../api";
import SaleDetail from "./SaleDetail";
import { TabView, TabBar } from "react-native-tab-view";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import AntDesign from "@expo/vector-icons/AntDesign";
import { DefaultUser, Logo } from "../../assets";
import { Container } from "./styles";
import Pagination from "@cherry-soft/react-native-basic-pagination";

import {
  ProButton,
  ProStageDynamicColor,
  ProText,
  ProTooltip,
  ProWarningModal,
  SettingModal,
} from "../../components";
import { createSettings, getBusinessUnit } from "../../api/operation-panel";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import XLSX from "xlsx";
import FinanceDetail from "./FinanceDetail";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { fetchMainCurrency } from "../../api/currencies";
import WarehouseDetail from "./WarehouseDetail";
import { RadioButton } from "react-native-paper";
import { TextInput } from "react-native";

import math from "exact-math";
import Forms from "../../components/Forms";
import { paymentType, saleType } from "../../utils/constants";

export const paymentAvailableInvoiceTypes = [1, 2, 3, 4, 10];

export const getStatusOfOperationLabel = (statusOfOperation) =>
  statusOfOperation === 1 ? (
    <Text
      style={{
        color: "#F3B753",
        background: "#FDF7EA",
        textAlign: "center",
      }}
    >
      Aktiv
    </Text>
  ) : statusOfOperation === 2 ? (
    <Text
      style={{
        color: "#B16FE4",
        background: "#F6EEFC",
        textAlign: "center",
      }}
    >
      Qaralama
    </Text>
  ) : (
    <Text
      style={{
        color: "#C4C4C4",
        background: "#F8F8F8",
        textAlign: "center",
      }}
    >
      Silinib
    </Text>
  );

const operationTypesByPermissionKey = {
  9: "transaction_invoice_payment",
  10: "transaction_invoice_payment",
  8: "transaction_expense_payment",
  4: "money_transfer",
  6: "salary_payment",
  7: "transaction_balance_creation_payment",
  11: "transaction_advance_payment",
  12: "transaction_tenant_person_payment",
  13: "transaction_exchange",
  14: "cashbox_balance_report",
  16: "transaction_dividend",
  19: "transaction_debt_relief",
  20: "transaction_debt_relief_tax",
  21: "transaction_increase",
  22: "transaction_decrease",
  23: "transaction_barter",
  24: "transaction_advance_payment",
};

export const saleTypesByPermissionKeys = {
  1: "purchase_invoice",
  2: "sales_invoice",
  3: "return_from_customer_invoice",
  4: "return_to_supplier_invoice",
  5: "transfer_invoice",
  6: "remove_invoice",
  8: "draft_invoice",
  10: "import_purchase",
  11: "production_invoice",
  14: "product_increase_invoice",
  15: "product_decrease_invoice",
  16: "stock_consignment",
  17: "stock_consignment",
  19: "production_invoice",
};

export const isTransactionTypeAllowed = (
  selectedType,
  transactionType,
  typeId,
  options
) => {
  return (
    transactionType.includes(selectedType) &&
    ((options?.length !== 0 &&
      options?.find(({ id }) => id === typeId)?.checked) ||
      options?.length === 0)
  );
};

const getExcelPaymentStatus = (paymentStatus) => {
  switch (paymentStatus) {
    case 1:
      return "Açıq";

    case 2:
      return "Qismən ödənilib";
    case 3:
      return "Ödənilib";
    default:
      break;
  }
};

const formatNumberForExcel = (number) => {
  return number.toString().replace(".", ",");
};

export const getInvoiceType = (invoiceType) => {
  switch (invoiceType) {
    case 1:
      return "Alış";
    case 2:
      return "Satış";
    case 3:
      return "Geri alma";
    case 4:
      return "Geri qaytarma";
    case 5:
      return "Transfer";
    case 6:
      return "Silinmə";
    case 9:
      return "Bron";
    case 10:
      return "İdxal";
    case 11:
      return "İstehsalat";
    case 14:
      return "Artırma";
    case 15:
      return "Azaltma";
    case 16:
      return "Konsiqnasiyaya vermə";
    case 17:
      return "Konsiqnasiyadan gerialma";
    case 18:
      return "Təklif";
    case 19:
      return "Anbara göndərmə";
    default:
      return "Qaralama";
  }
};

export const getGroupedData = (invoiceType, permissionsByKeyValue) =>
  invoiceType
    ? groupByKey(
        Object.values(permissionsByKeyValue),
        "group_key"
      ).status.reduce((result, item) => {
        if (
          (invoiceType == 1 && item.key == "status_purchase") ||
          (invoiceType == 2 && item.key == "status_sales") ||
          (invoiceType == 10 && item.key == "status_import_purchase") ||
          (invoiceType == 3 && item.key == "status_return_from_customer") ||
          (invoiceType == 4 && item.key == "status_return_to_supplier") ||
          (invoiceType == 5 && item.key == "status_transfer") ||
          (invoiceType == 15 && item.key == "status_product_decrease") ||
          (invoiceType == 14 && item.key == "status_product_increase") ||
          (invoiceType == 9 && item.key == "status_bron") ||
          (invoiceType == 11 && item.key == "status_production") ||
          (invoiceType == 16 && item.key == "status_consignment") ||
          (invoiceType == 17 && item.key == "status_consignment_return") ||
          (invoiceType == 7 && item.key == "status_init") ||
          (invoiceType == 6 && item.key == "status_remove") ||
          (invoiceType == 8 && item.key == "status_draft")
        ) {
          result[item.key] = item;
        }
        return result;
      }, {})
    : {};

export const contactCategories = {
  1: {
    id: 1,
    name: "Alıcı",
  },
  4: {
    id: 4,
    name: "Təchizatçı",
  },
  8: {
    id: 8,
    name: "İstehsalçı",
  },
};

export const getPaymentStatus = (paymentStatus) => {
  switch (paymentStatus) {
    case 1:
      return (
        <Text
          style={{
            color: "#4E9CDF",
            background: "#EAF3FB",
            textAlign: "center",
          }}
        >
          Açıq
        </Text>
      );
    case 2:
      return (
        <Text
          style={{
            color: "#F3B753",
            background: "#FDF7EA",
            textAlign: "center",
          }}
        >
          Qismən ödənilib
        </Text>
      );
    case 3:
      return (
        <Text
          style={{
            color: "#55AB80",
            background: "#EBF5F0",
            textAlign: "center",
          }}
        >
          Ödənilib
        </Text>
      );
    default:
      break;
  }
};

const getExcelStatusOfOperationLabel = (statusOfOperation) => {
  switch (statusOfOperation) {
    case 1:
      return "Aktiv";
    case 2:
      return "Qaralama";
    default:
      return "Silinib";
  }
};

const FirstRoute = (props) => {
  const {
    navigation,
    profile,
    tenant,
    BUSINESS_TKN_UNIT,
    statusData,
    allBusinessUnits,
    permissionsByKeyValue,
    setTableSettings,
    tableSettings,
    permissions,
  } = props;
  const [data, setData] = useState({
    tableHead: [],
    widthArr: [],
    tableData: [],
  });
  // const [tableConfiguration, setTableConfiguration] = useState([]);
  const [visibleColumns, setVisibleColumns] = useState([]);
  const [settingVisible, setSettingVisible] = useState(false);
  const [tableSettingData, setTableSettingData] = useState(
    Sales_Invoices_TABLE_SETTING_DATA
  );

  const [pageSize, setPageSize] = useState(8);
  const [currentPage, setCurrentPage] = useState(1);
  const [invoicesList, setInvoicesList] = useState([]);
  const [invoicesCount, setInvoicesCount] = useState(0);
  const [statusLoading, setStatusLoading] = useState(false);
  const [exportModal, setExportModal] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedRow, setSelectedRow] = useState({});
  const [isModalVisible, setModalVisible] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState("");
  const [removeModalVisible, setRemoveModalVisible] = useState(false);
  const [deleteModalIsVisible, setDeleteModalVisibe] = useState(false);
  const [deleteType, setDeleteType] = useState(0);
  const [description, setDescription] = useState(undefined);
  const [formModal, setFormModal] = useState(false);
  const [formsData, setFormsData] = useState(undefined);
  const [salesBuysForms, setSalesBuysForms] = useState([]);
  const [filtersForRemove, setFiltersForRemove] = useState({
    value: undefined,
    filters: undefined,
    row: undefined,
  });

  const [filter, onFilter, setFilter] = useFilterHandle(
    {
      limit: pageSize,
      page: currentPage,
      bypass: 0,
      isDeleted: 0,
      businessUnitIds: BUSINESS_TKN_UNIT ? [BUSINESS_TKN_UNIT] : undefined,
      considerSettings: 1,
      sortOrder: "desc",
      orderBy: "createdAt",
      notInvoiceTypes: [18],
    },
    () => {
      fetchSalesInvoiceList({
        filter: filter,
      }).then((productData) => {
        setInvoicesList(productData);
      });
      fetchSalesInvoicesCount({
        filter: filter,
      }).then((productData) => {
        setInvoicesCount(productData);
      });
    }
  );

  const handlePaginationChange = (value) => {
    onFilter("page", value);
    return (() => setCurrentPage(value))();
  };

  const onRemoveProduct = (operationId, filters, row) => {
    Alert.alert("Diqqət!", `Əməliyyatı silmək istədiyinizə əminsiniz?`, [
      {
        text: "İmtina",
        onPress: () => console.log("Cancel Pressed"),
        style: "cancel",
      },
      {
        text: "Sil",
        onPress: () => {
          deleteInvoiceAction(operationId, filters);
        },
      },
    ]);
  };

  const deleteInvoiceAction = (operationId, filters) => {
    deleteInvoice({
      apiEnd: operationId,
      filters: {
        isHidden: undefined,
      },
    })
      .then(() => {
        setSelectedRow({});
        setModalVisible(false);
        if ((invoicesCount - 1) % pageSize == 0 && currentPage > 1) {
          handlePaginationChange(currentPage - 1);
        } else {
          fetchSalesInvoiceList({
            filter: filters,
          }).then((productData) => {
            setInvoicesList(productData);
          });
          fetchSalesInvoicesCount({
            filter: filters,
          }).then((productData) => {
            setInvoicesCount(productData);
          });
        }
      })
      .catch((error) => {
        if (
          error?.data?.error?.errors?.key ===
          "Invoice is used as import purchase expense"
        ) {
          Toast.show({
            type: "error",
            text2:
              "Bu qaimə idxal alış qaiməsində əlavə xərc olaraq daxil edildiyi üçün silinə bilməz",
            topOffset: 50,
          });
        }

        Toast.show({
          type: "error",
          text2: error?.data?.error?.message,
          topOffset: 50,
        });
      });
  };

  const handleRemoveReturnToAndFromCustomer = () => {
    const { value: operationId, filters } = filtersForRemove;

    setRemoveModalVisible(false);
    deleteInvoiceAction(operationId, filters);
  };

  const handleDeleteOperation = (id, reason, deleteType) => {
    deleteInvoice({
      apiEnd: id,
      filters: {
        deleteReason: reason,
        deleteRelatedOperations: deleteType,
      },
    }).then(() => {
      Toast.show({
        type: "success",
        text1: "Əməliyyat uğurla tamamlandı.",
      });
      setDeleteType(0);
      setSelectedRow({});
      setDescription(undefined);
      setDeleteModalVisibe(false);
      setModalVisible(false);

      if ((invoicesCount - 1) % pageSize == 0 && currentPage > 1) {
        handlePaginationChange(currentPage - 1);
      } else {
        fetchSalesInvoiceList({
          filter: filter,
        }).then((productData) => {
          setInvoicesList(productData);
        });
        fetchSalesInvoicesCount({
          filter: filter,
        }).then((productData) => {
          setInvoicesCount(productData);
        });
      }
    });
  };

  useEffect(() => {
    fetchSalesBuysForms({}).then((res) => {
      setSalesBuysForms([
        ...Object.values(res).filter(
          ({ type }) => type !== 9 && type !== 10 && type !== 12
        ),
      ]);
    });
  }, []);

  useEffect(() => {
    const columns = [];
    let column = visibleColumns;

    const handleCategoryNames = (categories = []) =>
      categories.map((category) => contactCategories[category]?.name);
    setData({
      tableHead: [
        "No",
        ...visibleColumns.map((item) => {
          return Sales_Invoices_TABLE_SETTING_DATA.find(
            (i) => i.dataIndex === item
          )?.name;
        }),
      ],
      widthArr: [
        60,
        ...visibleColumns.map((el) => {
          return 100;
        }),
      ],
      tableData: getInvoicesWithVat(invoicesList)?.map(
        (
          {
            counterpartyType,
            counterpartyCategoryIds,
            invoiceType,
            createdAt,
            operationDate,
            invoiceTypeNumber,
            paymentStatus,
            isVat,
            taxPaymentStatus,
            daysFromLastPaymentDate,
            currencyCode,
            mainCurrencyCode,
            firstOpenCreditDate,
            counterparty,
            counterpartyName,
            contractSerialNumber,
            totalRoadTaxAmount,
            contractNo,
            counterpartyHeadContactName,
            invoiceNumber,
            isDeleted,
            endPrice,
            endPriceCache,
            invoiceCode,
            endPriceInMainCurrency,
            salesmanLastName,
            salesmanName,
            statusOfOperationLabel,
            businessUnitId,
            statusColor,
            statusId,
            statusName,
            draftType,
            totalPaymentsAmountConvertedToMainCurrency,
            amount,
            totalSalariesAmountConvertedToMainCurrency,
            totalRemoveInvoicesAmountConvertedToMainCurrency,
            operatorLastname,
            operatorName,
            stockName,
            discountAmount,
            discountPercentage,
            taxPercentage,
            totalQuantity,
            taxCurrencyCode,
            taxAmount,
            agentName,
            description,
            counterpartyPhoneNumbers,
            counterpartyEmails,
            counterpartyId,
            counterpartyVoen,
            counterpartyWebsites,
            counterpartyAddress,
            counterpartyPriceType,
            counterpartyDescription,
            counterpartyOfficialName,
            counterpartyGeneralDirector,
            counterpartyBankName,
            counterpartySwift,
            endPriceAmountWithTax,
            counterpartyCompanyVoen,
            counterpartySettlementAccount,
            counterpartyBankCode,
            counterpartyCorrespondentAccount,
            counterpartyBankVoen,
            id,
          },
          index
        ) => {
          columns[column.indexOf("counterpartyType")] =
            counterpartyType === "Legal entity" ? (
              <Text>Hüquqi şəxs</Text>
            ) : (
              <Text>Fiziki şəxs</Text>
            );
          columns[column.indexOf("counterpartyCategoryIds")] = (
            <View
              style={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "center",
              }}
            >
              <Text>
                {handleCategoryNames(counterpartyCategoryIds)[0] || "-"}
              </Text>
              {counterpartyCategoryIds?.[0] && (
                <ProTooltip
                  containerStyle={{ width: 145, height: "auto" }}
                  popover={
                    <View style={{ display: "flex", flexDirection: "column" }}>
                      {handleCategoryNames(counterpartyCategoryIds).map(
                        (item) => (
                          <Text>{item}</Text>
                        )
                      )}
                    </View>
                  }
                  trigger={
                    <Entypo
                      name="dots-three-vertical"
                      size={20}
                      color="black"
                    />
                  }
                />
              )}
            </View>
          );
          columns[column.indexOf("invoiceType")] = <Text>{invoiceType}</Text>;
          columns[column.indexOf("createdAt")] = (
            <Text>
              {createdAt?.replace(/(\d{4})-(\d\d)-(\d\d)/, "$3-$2-$1")}
            </Text>
          );

          columns[column.indexOf("operationDate")] = (
            <Text>{operationDate?.split("   ")}</Text>
          );
          const conditions = [
            invoiceTypeNumber === 19,
            paymentStatus === 3 && isVat,
            taxPaymentStatus === 3 && isVat,
            [3, 5, 6, 8, 11, 14, 15].includes(invoiceTypeNumber),
          ];
          columns[column.indexOf("daysFromLastPaymentDate")] = conditions.some(
            (condition) => condition
          ) ? (
            <Text> - </Text>
          ) : daysFromLastPaymentDate !== null ? (
            <View style={{ display: "flex", flexDirection: "row" }}>
              <Text>
                {formatNumberToLocale(
                  defaultNumberFormat(daysFromLastPaymentDate)
                )
                  .split(".")?.[0]
                  .replace(/,/g, " ")}
              </Text>
              <Text>
                ,
                {
                  formatNumberToLocale(
                    defaultNumberFormat(daysFromLastPaymentDate)
                  ).split(".")?.[1]
                }
              </Text>
            </View>
          ) : (
            <Text> </Text>
          );

          const currencyCodes = currencyCode || mainCurrencyCode;
          columns[column.indexOf("counterparty")] =
            invoiceTypeNumber === 10 && isVat ? (
              <Text>{counterpartyName}</Text>
            ) : (
              <Text>{counterparty}</Text>
            );
          columns[column.indexOf("firstOpenCreditDate")] = (
            <Text>{firstOpenCreditDate}</Text>
          );
          columns[column.indexOf("contractNo")] = contractNo ? (
            invoiceTypeNumber === 19 ? (
              <Text>-</Text>
            ) : (
              <Text>{contractNo}</Text>
            )
          ) : invoiceTypeNumber === 19 ? (
            <Text>-</Text>
          ) : (
            <Text>{contractSerialNumber || "-"}</Text>
          );
          columns[column.indexOf("totalRoadTaxAmount")] = Number(
            totalRoadTaxAmount || 0
          ) ? (
            <View style={{ display: "flex", flexDirection: "row" }}>
              <Text>
                {formatNumberToLocale(defaultNumberFormat(totalRoadTaxAmount))
                  .split(".")?.[0]
                  .replace(/,/g, " ")}
              </Text>
              <Text>
                ,
                {
                  formatNumberToLocale(
                    defaultNumberFormat(totalRoadTaxAmount)
                  ).split(".")?.[1]
                }{" "}
              </Text>
              <Text>{currencyCodes}</Text>
            </View>
          ) : (
            <Text>-</Text>
          );

          columns[column.indexOf("counterpartyHeadContactName")] =
            invoiceTypeNumber === 19 ? (
              <Text>-</Text>
            ) : (
              <Text>{counterpartyHeadContactName || "-"}</Text>
            );
          columns[column.indexOf("invoiceNumber")] = !invoiceNumber ? (
            <Text>-</Text>
          ) : (
            <Text>{invoiceNumber}</Text>
          );

          columns[column.indexOf("paymentStatus")] =
            isDeleted === true ||
            paymentStatus === null ||
            (paymentStatus === 3 && Number(endPrice) === 0) ? (
              <Text style={{ textAlign: "center" }}>-</Text>
            ) : paymentAvailableInvoiceTypes.includes(invoiceTypeNumber) ? (
              isVat ? (
                <View>{getPaymentStatus(taxPaymentStatus)}</View>
              ) : (
                <View>{getPaymentStatus(paymentStatus)}</View>
              )
            ) : (
              <Text style={{ textAlign: "center" }}>-</Text>
            );

          columns[column.indexOf("endPrice")] =
            invoiceCode === 17 ? (
              <Text>-</Text>
            ) : (
              <View style={{ display: "flex", flexDirection: "row" }}>
                <Text>
                  {formatNumberToLocale(defaultNumberFormat(endPrice || 0))
                    .split(".")?.[0]
                    .replace(/,/g, " ")}
                </Text>
                <Text>
                  ,
                  {
                    formatNumberToLocale(
                      defaultNumberFormat(endPrice || 0)
                    ).split(".")?.[1]
                  }{" "}
                </Text>
                <Text>{currencyCodes}</Text>
              </View>
            );

          columns[column.indexOf("endPriceInMainCurrency")] =
            invoiceCode === 17 ? (
              <Text>-</Text>
            ) : (
              <View style={{ display: "flex", flexDirection: "row" }}>
                <Text>
                  {formatNumberToLocale(
                    defaultNumberFormat(endPriceInMainCurrency || 0)
                  )
                    .split(".")?.[0]
                    .replace(/,/g, " ")}
                </Text>
                <Text>
                  ,
                  {
                    formatNumberToLocale(
                      defaultNumberFormat(endPriceInMainCurrency || 0)
                    ).split(".")?.[1]
                  }
                </Text>
              </View>
            );

          columns[column.indexOf("amount")] =
            invoiceCode === 17 || invoiceTypeNumber === 19 ? (
              <Text>-</Text>
            ) : (
              <View style={{ display: "flex", flexDirection: "row" }}>
                <Text>
                  {formatNumberToLocale(defaultNumberFormat(amount || 0))
                    .split(".")?.[0]
                    .replace(/,/g, " ")}
                </Text>
                <Text>
                  ,
                  {
                    formatNumberToLocale(
                      defaultNumberFormat(amount || 0)
                    ).split(".")?.[1]
                  }{" "}
                </Text>
                <Text>{currencyCodes}</Text>
              </View>
            );

          columns[
            column.indexOf("totalPaymentsAmountConvertedToMainCurrency")
          ] =
            invoiceTypeNumber === 19 ? (
              <Text>-</Text>
            ) : (
              <View style={{ display: "flex", flexDirection: "row" }}>
                <Text>
                  {formatNumberToLocale(
                    defaultNumberFormat(
                      totalPaymentsAmountConvertedToMainCurrency || 0
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
                        totalPaymentsAmountConvertedToMainCurrency || 0
                      )
                    ).split(".")?.[1]
                  }
                </Text>
              </View>
            );

          columns[
            column.indexOf("totalSalariesAmountConvertedToMainCurrency")
          ] =
            invoiceTypeNumber === 19 ? (
              <Text>-</Text>
            ) : (
              <View style={{ display: "flex", flexDirection: "row" }}>
                <Text>
                  {formatNumberToLocale(
                    defaultNumberFormat(
                      totalSalariesAmountConvertedToMainCurrency || 0
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
                        totalSalariesAmountConvertedToMainCurrency || 0
                      )
                    ).split(".")?.[1]
                  }
                </Text>
              </View>
            );

          columns[
            column.indexOf("totalRemoveInvoicesAmountConvertedToMainCurrency")
          ] =
            invoiceTypeNumber === 19 ? (
              <Text>-</Text>
            ) : (
              <View style={{ display: "flex", flexDirection: "row" }}>
                <Text>
                  {formatNumberToLocale(
                    defaultNumberFormat(
                      totalRemoveInvoicesAmountConvertedToMainCurrency || 0
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
                        totalRemoveInvoicesAmountConvertedToMainCurrency || 0
                      )
                    ).split(".")?.[1]
                  }
                </Text>
              </View>
            );

          columns[column.indexOf("operatorName")] = (
            <Text>{`${operatorName} ${operatorLastname}` || "-"}</Text>
          );

          columns[column.indexOf("stockName")] = stockName ? (
            <Text>{stockName}</Text>
          ) : (
            <Text>Konsiqnasiya</Text>
          );

          const excludedInvoiceTypes = [
            "Silinmə",
            "Transfer",
            "İstehsalat",
            "Azaltma",
            "Anbara göndərmə",
            "Konsiqnasiyadan gerialma",
            "Artırma",
          ];

          const remainingAmountCache = Number(endPriceCache);

          columns[column.indexOf("endPriceCache")] =
            excludedInvoiceTypes.includes(invoiceType) ? (
              <Text>-</Text>
            ) : remainingAmountCache ? (
              <View style={{ display: "flex", flexDirection: "row" }}>
                <Text>
                  {formatNumberToLocale(
                    defaultNumberFormat(remainingAmountCache || 0)
                  )
                    .split(".")?.[0]
                    .replace(/,/g, " ")}
                </Text>
                <Text>
                  ,
                  {
                    formatNumberToLocale(
                      defaultNumberFormat(remainingAmountCache || 0)
                    ).split(".")?.[1]
                  }
                </Text>
                <Text>{currencyCodes}</Text>
              </View>
            ) : (
              <Text>-</Text>
            );

          columns[column.indexOf("discountPercentage")] =
            Number(discountPercentage) !== 0 ? (
              <View style={{ display: "flex", flexDirection: "row" }}>
                <Text>
                  {formatNumberToLocale(
                    defaultNumberFormat(discountPercentage || 0)
                  )
                    .split(".")?.[0]
                    .replace(/,/g, " ")}
                </Text>
                <Text>
                  ,
                  {
                    formatNumberToLocale(
                      defaultNumberFormat(discountPercentage || 0)
                    ).split(".")?.[1]
                  }
                </Text>
              </View>
            ) : (
              <Text>-</Text>
            );

          columns[column.indexOf("discountAmount")] = discountAmount ? (
            <View style={{ display: "flex", flexDirection: "row" }}>
              <Text>
                {formatNumberToLocale(defaultNumberFormat(discountAmount || 0))
                  .split(".")?.[0]
                  .replace(/,/g, " ")}
              </Text>
              <Text>
                ,
                {
                  formatNumberToLocale(
                    defaultNumberFormat(discountAmount || 0)
                  ).split(".")?.[1]
                }
              </Text>
              <Text>{currencyCodes}</Text>
            </View>
          ) : (
            <Text>-</Text>
          );

          columns[column.indexOf("totalQuantity")] = totalQuantity ? (
            <Text>
              {formatNumberToLocale(defaultNumberFormat(totalQuantity || 0))
                .split(".")?.[0]
                .replace(/,/g, " ")}{" "}
              {
                formatNumberToLocale(
                  defaultNumberFormat(totalQuantity || 0)
                ).split(".")?.[1]
              }
            </Text>
          ) : (
            <Text>-</Text>
          );

          columns[column.indexOf("taxPercentage")] =
            Number(taxPercentage) !== 0 && invoiceTypeNumber !== 10 ? (
              <Text>
                {formatNumberToLocale(defaultNumberFormat(taxPercentage || 0))
                  .split(".")?.[0]
                  .replace(/,/g, " ")}{" "}
                {
                  formatNumberToLocale(
                    defaultNumberFormat(taxPercentage || 0)
                  ).split(".")?.[1]
                }
              </Text>
            ) : (
              <Text>-</Text>
            );

          columns[column.indexOf("taxAmount")] = taxAmount ? (
            <View style={{ display: "flex", flexDirection: "row" }}>
              <Text>
                {formatNumberToLocale(defaultNumberFormat(taxAmount || 0))
                  .split(".")?.[0]
                  .replace(/,/g, " ")}
              </Text>
              <Text>
                .
                {
                  formatNumberToLocale(
                    defaultNumberFormat(taxAmount || 0)
                  ).split(".")?.[1]
                }
              </Text>
              <Text>{taxCurrencyCode}</Text>
            </View>
          ) : (
            <Text>-</Text>
          );

          columns[column.indexOf("agentName")] = agentName ? (
            <Text>{agentName}</Text>
          ) : (
            <Text>-</Text>
          );

          columns[column.indexOf("description")] = description ? (
            <Text>{description}</Text>
          ) : (
            <Text>-</Text>
          );

          columns[column.indexOf("counterpartyPhoneNumbers")] = (
            <View
              style={{
                display: "flex",
                flexDirection: "row",
              }}
            >
              <Text>{counterpartyPhoneNumbers?.[0] || "-"}</Text>
              {counterpartyPhoneNumbers?.[0] && (
                <ProTooltip
                  containerStyle={{ width: 145, height: "auto" }}
                  popover={
                    <View style={{ display: "flex", flexDirection: "column" }}>
                      {counterpartyPhoneNumbers.map((item) => (
                        <Text>{item}</Text>
                      ))}
                    </View>
                  }
                  trigger={
                    <Entypo
                      name="dots-three-vertical"
                      size={20}
                      color="black"
                    />
                  }
                />
              )}
            </View>
          );

          columns[column.indexOf("counterpartyEmails")] = (
            <Text>{counterpartyEmails?.[0] || "-"}</Text>
          );

          columns[column.indexOf("counterpartyId")] = (
            <Text>{counterpartyId || "-"}</Text>
          );

          columns[column.indexOf("counterpartyVoen")] = (
            <Text>{counterpartyVoen || "-"}</Text>
          );

          columns[column.indexOf("counterpartyWebsites")] = (
            <Text>{counterpartyWebsites?.[0] || "-"}</Text>
          );

          columns[column.indexOf("counterpartyAddress")] = (
            <Text>{counterpartyAddress || "-"}</Text>
          );
          columns[column.indexOf("counterpartyPriceType")] = (
            <Text>{counterpartyPriceType || "Satış"}</Text>
          );
          columns[column.indexOf("counterpartyDescription")] = (
            <Text>
              {counterpartyDescription ? counterpartyDescription : "-"}
            </Text>
          );

          columns[column.indexOf("counterpartyOfficialName")] = (
            <Text>
              {counterpartyOfficialName ? counterpartyOfficialName : "-"}
            </Text>
          );

          columns[column.indexOf("counterpartyGeneralDirector")] = (
            <Text>
              {counterpartyGeneralDirector ? counterpartyGeneralDirector : "-"}
            </Text>
          );

          columns[column.indexOf("counterpartyCompanyVoen")] = (
            <Text>
              {counterpartyCompanyVoen ? counterpartyCompanyVoen : "-"}
            </Text>
          );
          columns[column.indexOf("counterpartyBankName")] = (
            <Text>{counterpartyBankName ? counterpartyBankName : "-"}</Text>
          );
          const excludedInvoiceTypeNumbers = [3, 5, 6, 11, 14, 15, 17];
          columns[column.indexOf("endPriceAmountWithTax")] =
            excludedInvoiceTypeNumbers.includes(invoiceTypeNumber) ||
            (invoiceTypeNumber === 8 && ![5, 6, 14, 15].includes(draftType)) ? (
              <Text>-</Text>
            ) : endPriceAmountWithTax ? (
              <View style={{ display: "flex", flexDirection: "row" }}>
                <Text>
                  {formatNumberToLocale(
                    defaultNumberFormat(endPriceAmountWithTax || 0)
                  )
                    .split(".")?.[0]
                    .replace(/,/g, " ")}
                </Text>
                <Text>
                  {`.${
                    formatNumberToLocale(
                      defaultNumberFormat(endPriceAmountWithTax || 0)
                    ).split(".")?.[1]
                  }`}{" "}
                </Text>
                <Text>{currencyCodes}</Text>
              </View>
            ) : (
              <Text>-</Text>
            );

          columns[column.indexOf("counterpartyBankVoen")] = (
            <Text>{counterpartyBankVoen ? counterpartyBankVoen : "-"}</Text>
          );

          columns[column.indexOf("counterpartyBankCode")] = (
            <Text>{counterpartyBankCode ? counterpartyBankCode : "-"}</Text>
          );

          columns[column.indexOf("counterpartyCorrespondentAccount")] = (
            <Text>{counterpartyCorrespondentAccount || "-"}</Text>
          );
          columns[column.indexOf("counterpartySettlementAccount")] = (
            <Text>{counterpartySettlementAccount || "-"}</Text>
          );
          columns[column.indexOf("counterpartySwift")] = (
            <Text>{counterpartySwift || "-"}</Text>
          );

          columns[column.indexOf("salesmanName")] =
            invoiceTypeNumber === 19 ? (
              <Text>-</Text>
            ) : (
              <Text>
                {salesmanName ? `${salesmanName} ${salesmanLastName}` : "-"}
              </Text>
            );

          const groupedData = getGroupedData(
            invoiceTypeNumber,
            permissionsByKeyValue
          );
          const PermissionsForStatus = Object.values(groupedData)?.find(
            (item) => item.permission === 0
          );
          const PermissionsForStatusDisabled = Object.values(groupedData)?.find(
            (item) => item.permission === 1
          );
          const operationType =
            draftType !== null ? draftType : invoiceTypeNumber;

          const isStatusActive =
            statusId &&
            statusData?.some(
              (status) =>
                status.operationId === operationType && status.isStatusActive
            );
          const { statuses } =
            statusData?.find((item) => item.operationId === operationType) ||
            {};
          const formattedStatusData = statuses?.map((item) => ({
            id: item.id,
            label: item.name,
            color: `#${item.color.toString(16).padStart(6, "0")}`,
          }));

          const visualStage =
            formattedStatusData?.find((item) => item.id === statusId)?.label ||
            statusName;

          columns[column.indexOf("statusName")] =
            PermissionsForStatus || !isStatusActive ? (
              <Text>-</Text>
            ) : (
              <ProStageDynamicColor
                disabled={!!PermissionsForStatusDisabled}
                visualStage={{ id: visualStage }}
                statuses={
                  statuses
                    ? formattedStatusData
                    : [
                        {
                          id: statusId,
                          label: statusName,
                          color: `#${statusColor
                            .toString(16)
                            .padStart(6, "0")}`,
                        },
                      ]
                }
                color={`#${statusColor?.toString(16).padStart(6, "0")}`}
                onChange={(newStageId) => handleStageChange(newStageId, id)}
                statusName={statusName}
              />
            );

          columns[column.indexOf("businessUnitId")] = (
            <Text>
              {allBusinessUnits?.find(({ id }) => id === businessUnitId)?.name}
            </Text>
          );

          columns[column.indexOf("statusOfOperationLabel")] = (
            <View>{statusOfOperationLabel}</View>
          );
          return [(currentPage - 1) * pageSize + index + 1, ...columns];
        }
      ),
    });
  }, [visibleColumns, invoicesList, allBusinessUnits]);

  const handleView = (row) => {
    setShowModal(true);
  };

  const handleStageChange = (newStageId, invoiceId) => {
    setStatusLoading(true);
    editInvoiceStatus({
      statusId: newStageId,
      id: Number(invoiceId),
    }).then(() => {
      setStatusLoading(false);
      fetchSalesInvoiceList({
        filter: filter,
      }).then((productData) => {
        setInvoicesList(productData);
      });
    });
  };

  const getEndPrice = (endPrice, data) => {
    const { invoiceType } = data;
    return invoiceType === "Transfer" || invoiceType === "Silinmə"
      ? null
      : roundToDown(Number(endPrice), 2);
  };

  const getEndPriceInMainCurrency = (endPriceInMainCurrency, data) => {
    const { invoiceType } = data;
    return invoiceType === "Transfer" || invoiceType === "Silinmə"
      ? null
      : roundToDown(Number(endPriceInMainCurrency), 2);
  };

  const getInvoicesWithVat = (invoices) => {
    const newInvoices =
      invoices &&
      invoices.length > 0 &&
      invoices?.reduce((acc, cur) => {
        if (Number(cur.taxAmount) !== 0 || Number(cur.taxPercentage) !== 0) {
          return acc.concat([
            {
              ...cur,
              rowId: `${cur.id}`,
              isDeleted: cur.statusOfOperation === 3,
              invoiceTypeNumber: cur.invoiceType,
              invoiceType: getInvoiceType(cur.invoiceType),
              invoiceCode: cur.invoiceType,
              endPriceCache: formatNumberToLocale(
                defaultNumberFormat(
                  Number(cur.endPrice) - Number(cur.paidAmount)
                )
              ),
              endPrice: getEndPrice(cur.endPrice, cur),
              endPriceInMainCurrency: getEndPriceInMainCurrency(
                cur.endPriceInMainCurrency,
                cur
              ),
              statusOfOperationLabel: getStatusOfOperationLabel(
                cur.statusOfOperation
              ),
            },
            {
              ...cur,
              rowId: `${cur.id}-vat`,
              invoiceTypeNumber: cur.invoiceType,
              currencyCode: cur.taxCurrencyCode || cur.currencyCode,
              isDeleted: cur.statusOfOperation === 3,
              invoiceType: `${getInvoiceType(cur.invoiceType)}(Vergi)`,
              amount: cur.taxAmount,
              endPriceCache: formatNumberToLocale(
                defaultNumberFormat(
                  Number(cur.taxAmount) - Number(cur.paidTaxAmount) || 0
                )
              ),
              taxAmount: null,
              endPriceAmountWithTax: null,
              taxPercentage: null,
              discountAmount: null,
              discountPercentage: null,
              paidAmount: cur.paidTaxAmount,
              endPrice: getEndPrice(cur.taxAmount, cur),
              endPriceInMainCurrency: getEndPriceInMainCurrency(
                cur.taxAmountInMainCurrency,
                cur
              ),
              statusOfOperationLabel: getStatusOfOperationLabel(
                cur.statusOfOperation
              ),
              isVat: true,
            },
          ]);
        }
        return acc.concat([
          {
            ...cur,
            rowId: `${cur.id}`,
            invoiceTypeNumber: cur.invoiceType,
            invoiceType: getInvoiceType(cur.invoiceType),
            invoiceCode: cur.invoiceType,
            isDeleted: cur.statusOfOperation === 3,
            endPriceCache: formatNumberToLocale(
              defaultNumberFormat(Number(cur.endPrice) - Number(cur.paidAmount))
            ),
            endPrice: getEndPrice(cur.endPrice, cur),
            endPriceInMainCurrency: getEndPriceInMainCurrency(
              cur.endPriceInMainCurrency,
              cur
            ),
            statusOfOperationLabel: getStatusOfOperationLabel(
              cur.statusOfOperation
            ),
          },
        ]);
      }, []);

    return newInvoices || [];
  };

  useEffect(() => {
    if (
      tableSettings?.["SalesOperationsForMob"]?.columnsOrder?.length > 0 &&
      tableSettings?.["SalesOperationsForMob"]?.columnsOrder !== null
    ) {
      const parseData = JSON.parse(
        tableSettings?.["SalesOperationsForMob"]?.columnsOrder
      );
      const columns = parseData
        .filter((column) => column.visible === true)
        .map((column) => column.dataIndex);
      setVisibleColumns(columns);
      setTableSettingData(parseData);
    } else if (tableSettings?.["SalesOperationsForMob"]?.columnsOrder == null) {
      const column = Sales_Invoices_TABLE_SETTING_DATA.filter(
        (column) => column.visible === true
      ).map((column) => column.dataIndex);
      setVisibleColumns(column);
      setTableSettingData(Sales_Invoices_TABLE_SETTING_DATA);
    }
  }, [tableSettings]);

  const handleSaveSettingModal = (column) => {
    const tableColumn = column
      .filter((col) => col.visible === true)
      .map((col) => col.dataIndex);
    const filterColumn = column.filter((col) => col.dataIndex !== "id");
    const filterColumnData = JSON.stringify(filterColumn);

    createSettings({
      moduleName: "SalesOperationsForMob",
      columnsOrder: filterColumnData,
    }).then((res) => {
      const newTableSettings = {
        ...tableSettings,
        [`SalesOperationsForMob`]: { columnsOrder: filterColumnData },
      };
      setTableSettings(newTableSettings);
    });
    setVisibleColumns(tableColumn);
    setTableSettingData(column);

    setSettingVisible(false);
  };

  const handleExport = () => {
    setExportModal(true);
    fetchSalesInvoiceList({
      filter: { ...filter, limit: 5000, page: undefined },
    }).then((productData) => {
      exportDataToExcel(getInvoicesWithVat(productData));
      setExportModal(false);
    });
  };

  const exportDataToExcel = async (exData) => {
    const columnClone = [...visibleColumns];
    const data = (exData === false ? [{}] : getInvoicesWithVat(exData)).map(
      (item, index) => {
        const arr = [];
        const endPriceInMainCurrency = formatNumberToLocale(
          defaultNumberFormat(Number(item.endPriceInMainCurrency) || 0)
        );
        columnClone.includes("counterpartyType") &&
          (arr[columnClone.indexOf("counterpartyType")] = {
            "Əlaqə tipi":
              item.counterpartyType === "Legal entity"
                ? "Hüquqi şəxs"
                : "Fiziki şəxs",
          });
        columnClone.includes("counterpartyCategoryIds") &&
          (arr[columnClone.indexOf("counterpartyCategoryIds")] = {
            Kateqoriya:
              handleCategoryNames(item.counterpartyCategoryIds)?.join() || "-",
          });
        columnClone.includes("invoiceType") &&
          (arr[columnClone.indexOf("invoiceType")] = {
            "Əməliyyat növü": item.invoiceType || "-",
          });
        columnClone.includes("createdAt") &&
          (arr[columnClone.indexOf("createdAt")] = {
            "İcra tarixi":
              item.createdAt?.replace(/(\d{4})-(\d\d)-(\d\d)/, "$3-$2-$1") ||
              "-",
          });
        columnClone.includes("operationDate") &&
          (arr[columnClone.indexOf("operationDate")] = {
            "Əməliyyat tarixi": item.operationDate || "-",
          });
        columnClone.includes("daysFromLastPaymentDate") &&
          (arr[columnClone.indexOf("daysFromLastPaymentDate")] = {
            "Gecikmə (gün)": item.daysFromLastPaymentDate || "-",
          });
        columnClone.includes("counterparty") &&
          (arr[columnClone.indexOf("counterparty")] = {
            "Qarşı tərəf": item.counterparty || "-",
          });
        columnClone.includes("firstOpenCreditDate") &&
          (arr[columnClone.indexOf("firstOpenCreditDate")] = {
            "Ödəniş tarixi": item.firstOpenCreditDate || "-",
          });
        columnClone.includes("contractNo") &&
          (arr[columnClone.indexOf("contractNo")] = {
            Müqavilə: item.contractNo || "-",
          });
        columnClone.includes("counterpartyHeadContactName") &&
          (arr[columnClone.indexOf("counterpartyHeadContactName")] = {
            "Baş əlaqə": item.counterpartyHeadContactName || "-",
          });
        columnClone.includes("invoiceNumber") &&
          (arr[columnClone.indexOf("invoiceNumber")] = {
            Qaimə: item.invoiceNumber || "-",
          });
        columnClone.includes("paymentStatus") &&
          (arr[columnClone.indexOf("paymentStatus")] = {
            "Ödəniş statusu":
              item.isDeleted === true ||
              (item.paymentStatus === 3 && Number(item.endPrice) === 0)
                ? "-"
                : paymentAvailableInvoiceTypes.includes(item.invoiceTypeNumber)
                ? item.isVat
                  ? getExcelPaymentStatus(item.taxPaymentStatus)
                  : getExcelPaymentStatus(item.paymentStatus)
                : "-",
          });
        columnClone.includes("endPrice") &&
          (arr[columnClone.indexOf("endPrice")] = {
            "Son qiymət":
              `${formatNumberForExcel(Number(item.endPrice || 0))} ${
                item.currencyCode || item.mainCurrencyCode
              }` || "-",
          });
        columnClone.includes("endPriceInMainCurrency") &&
          (arr[columnClone.indexOf("endPriceInMainCurrency")] = {
            "Son qiymət (Əsas valyuta)": Number(
              endPriceInMainCurrency.replaceAll(",", "")
            ),
          });
        columnClone.includes("totalRoadTaxAmount") &&
          (arr[columnClone.indexOf("totalRoadTaxAmount")] = {
            "Yol vergisi": item.totalRoadTaxAmount
              ? `${formatNumberForExcel(Number(item.totalRoadTaxAmount) || 0)}
                    ${item.currencyCode || item.mainCurrencyCode}`
              : "-",
          });
        columnClone.includes("businessUnitId") &&
          (arr[columnClone.indexOf("businessUnitId")] = {
            "Biznes blok":
              `${
                allBusinessUnits?.find(({ id }) => id === item.businessUnitId)
                  ?.name
              }` || "-",
          });
        columnClone.includes("salesmanName") &&
          (arr[columnClone.indexOf("salesmanName")] = {
            Menecer: `${item.salesmanName} ${item.salesmanLastName}` || "-",
          });
        columnClone.includes("statusName") &&
          (arr[columnClone.indexOf("statusName")] = {
            "İcra statusu": item.statusName || "-",
          });
        columnClone.includes("statusOfOperationLabel") &&
          (arr[columnClone.indexOf("statusOfOperationLabel")] = {
            Status:
              `${getExcelStatusOfOperationLabel(item.statusOfOperation)}` ||
              "-",
          });
        columnClone.includes("amount") &&
          (arr[columnClone.indexOf("amount")] = {
            Məbləğ:
              `${formatNumberForExcel(Number(item.amount || 0))} ${
                item.currencyCode || item.mainCurrencyCode
              }` || "-",
          });
        columnClone.includes("totalPaymentsAmountConvertedToMainCurrency") &&
          (arr[
            columnClone.indexOf("totalPaymentsAmountConvertedToMainCurrency")
          ] = {
            "Xərc məbləği":
              `${formatNumberForExcel(
                Number(item.totalPaymentsAmountConvertedToMainCurrency) || 0
              )}` || "-",
          });
        columnClone.includes("totalSalariesAmountConvertedToMainCurrency") &&
          (arr[
            columnClone.indexOf("totalSalariesAmountConvertedToMainCurrency")
          ] = {
            Əməkhaqqı:
              `${formatNumberForExcel(
                Number(item.totalSalariesAmountConvertedToMainCurrency) || 0
              )}` || "-",
          });
        columnClone.includes(
          "totalRemoveInvoicesAmountConvertedToMainCurrency"
        ) &&
          (arr[
            columnClone.indexOf(
              "totalRemoveInvoicesAmountConvertedToMainCurrency"
            )
          ] = {
            "Silinmiş mallar":
              `${formatNumberForExcel(
                Number(item.totalRemoveInvoicesAmountConvertedToMainCurrency) ||
                  0
              )}` || "-",
          });
        columnClone.includes("operatorName") &&
          (arr[columnClone.indexOf("operatorName")] = {
            "Əlavə olunub":
              `${item.operatorName} ${item.operatorLastname}` || "-",
          });
        columnClone.includes("stockName") &&
          (arr[columnClone.indexOf("stockName")] = {
            Anbar: item.stockName || "-",
          });
        columnClone.includes("endPriceCache") &&
          (arr[columnClone.indexOf("endPriceCache")] = {
            Ödənilməlidir:
              item.invoiceType == "Silinmə" ||
              item.invoiceType == "Transfer" ||
              item.invoiceType == "İstehsalat"
                ? "-"
                : Number(item.endPrice) - Number(item.paidAmount) !== 0
                ? `${formatNumberForExcel(
                    Number(item.endPrice) - Number(item.paidAmount) || 0
                  )} ${item.currencyCode || item.mainCurrencyCode}`
                : "-",
          });
        columnClone.includes("discountPercentage") &&
          (arr[columnClone.indexOf("discountPercentage")] = {
            "Endirim (%)":
              Number(item.discountPercentage) !== 0
                ? `${formatNumberForExcel(
                    Number(item.discountPercentage)?.toFixed(4) || 0
                  )} %`
                : "-",
          });
        columnClone.includes("discountAmount") &&
          (arr[columnClone.indexOf("discountAmount")] = {
            Endirim: item.discountAmount
              ? `${item.discountAmount} ${item.currencyCode} `
              : "-",
          });
        columnClone.includes("totalQuantity") &&
          (arr[columnClone.indexOf("totalQuantity")] = {
            "Məhsul miqdarı":
              Number(
                formatNumberToLocale(
                  defaultNumberFormat(Number(item.totalQuantity) || 0)
                ).replaceAll(",", "")
              ) || "-",
          });
        columnClone.includes("taxPercentage") &&
          (arr[columnClone.indexOf("taxPercentage")] = {
            "Vergi (%)":
              Number(item.taxPercentage) !== 0
                ? `${formatNumberForExcel(
                    Number(item.taxPercentage)?.toFixed(4) || 0
                  )} %`
                : "-",
          });
        columnClone.includes("taxAmount") &&
          (arr[columnClone.indexOf("taxAmount")] = {
            Vergi: item.taxAmount
              ? `${formatNumberForExcel(
                  Number(item.taxAmount) - Number(item.paidTaxAmount || 0) || 0
                )} ${item.taxCurrencyCode}`
              : "-",
          });
        columnClone.includes("endPriceAmountWithTax") &&
          (arr[columnClone.indexOf("endPriceAmountWithTax")] = {
            "Yekun ƏDV ilə":
              item.endPriceAmountWithTax &&
              item.invoiceTypeNumber !== 5 &&
              item.invoiceTypeNumber !== 6 &&
              item.invoiceTypeNumber !== 10 &&
              item.invoiceTypeNumber !== 11 &&
              item.invoiceTypeNumber !== 14 &&
              item.invoiceTypeNumber !== 15
                ? `${formatNumberForExcel(
                    Number(item.endPriceAmountWithTax) || 0
                  )} ${item.currencyCode}`
                : "-",
          });
        columnClone.includes("agentName") &&
          (arr[columnClone.indexOf("agentName")] = {
            Agent: item.agentName || "-",
          });
        columnClone.includes("description") &&
          (arr[columnClone.indexOf("description")] = {
            "Əlavə məlumat": item.description || "-",
          });
        columnClone.includes("counterpartyPhoneNumbers") &&
          (arr[columnClone.indexOf("counterpartyPhoneNumbers")] = {
            Telefon: item.counterpartyPhoneNumbers?.join() || "-",
          });

        columnClone.includes("counterpartyEmails") &&
          (arr[columnClone.indexOf("counterpartyEmails")] = {
            Email: item.counterpartyEmails?.join() || "-",
          });

        columnClone.includes("counterpartyId") &&
          (arr[columnClone.indexOf("counterpartyId")] = {
            "ID nömrə": item.counterpartyId || "-",
          });
        columnClone.includes("counterpartyVoen") &&
          (arr[columnClone.indexOf("counterpartyVoen")] = {
            VÖEN: item.counterpartyVoen || "-",
          });
        columnClone.includes("counterpartyWebsites") &&
          (arr[columnClone.indexOf("counterpartyWebsites")] = {
            Websayt: item.counterpartyWebsites?.join() || "-",
          });
        columnClone.includes("counterpartyAddress") &&
          (arr[columnClone.indexOf("counterpartyAddress")] = {
            Ünvan: item.counterpartyAddress || "-",
          });
        columnClone.includes("counterpartyPriceType") &&
          (arr[columnClone.indexOf("counterpartyPriceType")] = {
            "Qiymət tipi": item.counterpartyPriceType || "Satış",
          });
        columnClone.includes("counterpartyDescription") &&
          (arr[columnClone.indexOf("counterpartyDescription")] = {
            "Əlavə məlumat (Əlaqə)": item.counterpartyDescription || "-",
          });
        columnClone.includes("counterpartyOfficialName") &&
          (arr[columnClone.indexOf("counterpartyOfficialName")] = {
            "Şirkət adı": item.counterpartyOfficialName || "-",
          });
        columnClone.includes("counterpartyGeneralDirector") &&
          (arr[columnClone.indexOf("counterpartyGeneralDirector")] = {
            "Baş direktor": item.counterpartyGeneralDirector || "-",
          });
        columnClone.includes("counterpartyBankVoen") &&
          (arr[columnClone.indexOf("counterpartyBankVoen")] = {
            "VÖEN (Bank)": item.counterpartyBankVoen || "-",
          });
        columnClone.includes("counterpartyBankName") &&
          (arr[columnClone.indexOf("counterpartyBankName")] = {
            "Bank adı": item.counterpartyBankName || "-",
          });
        columnClone.includes("counterpartyBankCode") &&
          (arr[columnClone.indexOf("counterpartyBankCode")] = {
            Kod: item.counterpartyBankCode || "-",
          });
        columnClone.includes("counterpartyCorrespondentAccount") &&
          (arr[columnClone.indexOf("counterpartyCorrespondentAccount")] = {
            "Müxbir hesab (M/h)": item.counterpartyCorrespondentAccount || "-",
          });
        columnClone.includes("counterpartySettlementAccount") &&
          (arr[columnClone.indexOf("counterpartySettlementAccount")] = {
            "Hesablaşma hesabı (H/h)":
              item.counterpartySettlementAccount || "-",
          });

        columnClone.includes("counterpartySwift") &&
          (arr[columnClone.indexOf("counterpartySwift")] = {
            "S.W.I.F.T.": item.counterpartySwift || "-",
          });
        arr.unshift({ No: index + 1 });

        return Object.assign({}, ...arr);
      }
    );
    let sample_data_to_export = data;

    var ws = XLSX.utils.json_to_sheet(sample_data_to_export);
    var wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Cities");

    const base64 = XLSX.write(wb, { type: "base64", bookType: "xlsx" });
    const filename = FileSystem.documentDirectory + `invoice${uuid()}}.xlsx`;

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

  const handleLongPress = (row, index) => {
    const updatedSelectedRow =
      row?.invoiceTypeNumber === 19
        ? {
            ...row,
            id: row?.attachedInvoice,
            transferId: row?.id,
            index: index,
          }
        : { ...row, index: index };
    setSelectedRow(updatedSelectedRow);
    setModalVisible(true);
  };

  const handleFormModal = (invoiceTypeNumber, draftType, id) => {
    // setSelectedExportRow(row);
    if (invoiceTypeNumber === 1 || draftType === 1) {
      const formData = salesBuysForms.filter(
        (salesBuys) => salesBuys.type === 1
      );
      if (id && (formData.length === 0 || formData?.[0]?.docs?.length === 0)) {
        Toast.show({
          type: "error",
          text2: "Bu sənəd üzrə ixrac forması yoxdur.",
          topOffset: 50,
        });
      } else {
        setModalVisible(false);
        setFormModal(true);
        setFormsData(formData);
      }
    } else if (invoiceTypeNumber === 5 || draftType === 5) {
      const formData = salesBuysForms.filter(
        (salesBuys) => salesBuys.type === 6
      );
      if (id && (formData.length === 0 || formData?.[0]?.docs?.length === 0)) {
        Toast.show({
          type: "error",
          text2: "Bu sənəd üzrə ixrac forması yoxdur.",
          topOffset: 50,
        });
      } else {
        setModalVisible(false);
        setFormModal(true);
        setFormsData(formData);
      }
    } else if (invoiceTypeNumber === 6 || draftType === 6) {
      const formData = salesBuysForms.filter(
        (salesBuys) => salesBuys.type === 7
      );
      if (id && (formData.length === 0 || formData?.[0]?.docs?.length === 0)) {
        Toast.show({
          type: "error",
          text2: "Bu sənəd üzrə ixrac forması yoxdur.",
          topOffset: 50,
        });
      } else {
        setModalVisible(false);
        setFormModal(true);
        setFormsData(formData);
      }
    } else if (invoiceTypeNumber === 11 || draftType === 11) {
      const formData = salesBuysForms.filter(
        (salesBuys) => salesBuys.type === 11
      );
      if (id && (formData.length === 0 || formData?.[0]?.docs?.length === 0)) {
        Toast.show({
          type: "error",
          text2: "Bu sənəd üzrə ixrac forması yoxdur.",
          topOffset: 50,
        });
      } else {
        setModalVisible(false);
        setFormModal(true);
        setFormsData(formData);
      }
    } else if (invoiceTypeNumber === 14 || draftType === 14) {
      const formData = salesBuysForms.filter(
        (salesBuys) => salesBuys.type === 22
      );
      if (id && (formData.length === 0 || formData?.[0]?.docs?.length === 0)) {
        Toast.show({
          type: "error",
          text2: "Bu sənəd üzrə ixrac forması yoxdur.",
          topOffset: 50,
        });
      } else {
        setModalVisible(false);
        setFormModal(true);
        setFormsData(formData);
      }
    } else if (invoiceTypeNumber === 15 || draftType === 15) {
      const formData = salesBuysForms.filter(
        (salesBuys) => salesBuys.type === 23
      );
      if (id && (formData.length === 0 || formData?.[0]?.docs?.length === 0)) {
        Toast.show({
          type: "error",
          text2: "Bu sənəd üzrə ixrac forması yoxdur.",
          topOffset: 50,
        });
      } else {
        setModalVisible(false);
        setFormModal(true);
        setFormsData(formData);
      }
    } else if (invoiceTypeNumber === 10 || draftType === 10) {
      const formData = salesBuysForms.filter(
        (salesBuys) => salesBuys.type === 2
      );
      if (id && (formData.length === 0 || formData?.[0]?.docs?.length === 0)) {
        Toast.show({
          type: "error",
          text2: "Bu sənəd üzrə ixrac forması yoxdur.",
          topOffset: 50,
        });
      } else {
        setModalVisible(false);
        setFormModal(true);
        setFormsData(formData);
      }
    } else if (draftType !== null) {
      const formData = salesBuysForms.filter(
        (salesBuys) => draftType + 1 === salesBuys.type
      );
      if (id && (formData.length === 0 || formData?.[0]?.docs?.length === 0)) {
        Toast.show({
          type: "error",
          text2: "Bu sənəd üzrə ixrac forması yoxdur.",
          topOffset: 50,
        });
      } else {
        setModalVisible(false);
        setFormModal(true);
        setFormsData(formData);
      }
    } else if (invoiceTypeNumber === 16) {
      const formData = salesBuysForms.filter(
        (salesBuys) => salesBuys.type === 27
      );
      if (id && (formData.length === 0 || formData?.[0]?.docs?.length === 0)) {
        Toast.show({
          type: "error",
          text2: "Bu sənəd üzrə ixrac forması yoxdur.",
          topOffset: 50,
        });
      } else {
        setModalVisible(false);
        setFormModal(true);
        setFormsData(formData);
      }
    } else if (invoiceTypeNumber === 17) {
      const formData = salesBuysForms.filter(
        (salesBuys) => salesBuys.type === 28
      );
      if (id && (formData.length === 0 || formData?.[0]?.docs?.length === 0)) {
        Toast.show({
          type: "error",
          text2: "Bu sənəd üzrə ixrac forması yoxdur.",
          topOffset: 50,
        });
      } else {
        setModalVisible(false);
        setFormModal(true);
        setFormsData(formData);
      }
    } else {
      const formData = salesBuysForms.filter(
        (salesBuys) => invoiceTypeNumber + 1 === salesBuys.type
      );
      if (id && (formData.length === 0 || formData?.[0]?.docs?.length === 0)) {
        Toast.show({
          type: "error",
          text2: "Bu sənəd üzrə ixrac forması yoxdur.",
          topOffset: 50,
        });
      } else {
        setModalVisible(false);
        setFormModal(true);
        setFormsData(formData);
      }
    }
  };

  const salePermissions = permissions.filter(
    ({ group_key, sub_group_key }) =>
      group_key === "sales" && sub_group_key === "operations"
  );

  const getPermission = (row) => {
    return salePermissions.find(({ key }) => {
      return (
        key === saleType.find(({ id }) => id === row.invoiceTypeNumber)?.key
      );
    })?.permission;
  };

  return (
    <>
      <Modal
        animationType="slide"
        transparent={true}
        visible={formModal}
        onRequestClose={() => {
          setFormModal(false);
        }}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Forms
              row={selectedRow}
              formsData={formsData}
              setVisible={setFormModal}
              visible={formModal}
              tenant={tenant?.id}
            />
          </View>
        </View>
      </Modal>
      <ProWarningModal
        open={removeModalVisible}
        bodyContent=""
        continueText="Davam et"
        okFunc={() => {
          handleRemoveReturnToAndFromCustomer();
        }}
        onCancel={() => setRemoveModalVisible(false)}
        bodyTitle="Sənəd silindikdə, ona bağlı olan bütün əlaqəli sənədlər (ödəniş, avans və əzəvləşdirmə) silinəcəkdir!"
      />
      <ProWarningModal
        open={deleteModalIsVisible}
        bodyTitle={`${invoiceToDelete} nömrəli müqavilə silindikdə, müqaviləyə bağlı olan:`}
        bodyContent={
          <View
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              marginTop: "25px",
            }}
          >
            <RadioButton.Group
              onValueChange={(newValue) => setDeleteType(newValue)}
              value={deleteType}
            >
              <View>
                <Text>
                  Silinmə, Xərc və ƏH sənədləri qorunsun və "Baş ofis" xərc
                  mərkəzinə bağlansın.
                </Text>
                <RadioButton.Android value={0} />
              </View>
              <View>
                <Text>Silinmə, Xərc və ƏH sənədləri avtomatik silinsin.</Text>
                <RadioButton.Android value={1} />
              </View>
            </RadioButton.Group>
            <View
              style={{
                paddingTop: 24,
                paddingBottom: 12,
                width: "100%",
                textAlign: "left",
              }}
            >
              <Text style={styles.deleteModalTitle}>
                Silinmə səbəbini qeyd edin
              </Text>
              <TextInput
                multiline={true}
                placeholder="Yazın"
                onChangeText={(val) => {
                  setDescription(val);
                }}
                style={{
                  marginRight: 15,
                  padding: 5,
                  borderWidth: 1,
                  borderRadius: 5,
                  borderColor: "#dedede",
                }}
                value={description}
              />
            </View>
          </View>
        }
        continueText="Təsdiq et"
        onCancel={() => {
          setDeleteModalVisibe(false);
          setDeleteType(0);
        }}
        okFunc={() => {
          handleDeleteOperation(selectedRow.id, description, deleteType);
        }}
      />
      {showModal ? (
        selectedRow?.invoiceTypeNumber === 19 ? (
          <WarehouseDetail
            row={{
              ...selectedRow,
              invoice_id: selectedRow?.transferId,
              invoiceType: selectedRow?.invoiceTypeNumber,
            }}
            isVisible={showModal}
            handleModal={(isSubmit = false) => {
              if (isSubmit) {
                console.log("ok");
              }

              setShowModal(false);
              if(Platform.OS === "ios" ) {setModalVisible(true);}
            }}
            allBusinessUnits={allBusinessUnits}
            profile={profile}
          />
        ) : (
          <SaleDetail
            isVisible={showModal}
            handleModal={(isSubmit = false) => {
              if (isSubmit) {
                console.log("ok");
              }

              setShowModal(false);
              if(Platform.OS === "ios" ) {setModalVisible(true);}
            }}
            row={selectedRow}
            allBusinessUnits={allBusinessUnits}
            profile={profile}
          />
        )
      ) : null}
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
          AllStandartColumns={Sales_Invoices_TABLE_SETTING_DATA}
        />
      </Modal>
      <ScrollView>
        <View
          style={{
            paddingTop: 40,
            paddingLeft: 10,
            paddingRight: 10,
            paddingBottom: 40,
          }}
        >
          <View
            style={{
              marginTop: 10,
              marginBottom: 20,
              padding: 10,
              borderRadius: 4,
              backgroundColor: "#fff",
              display: "flex",
              gap: 10,
            }}
          >
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
            <View style={{ display: "flex", alignItems: "flex-end" }}>
              <ScrollView nestedScrollEnabled={true} horizontal={true}>
                {statusLoading ? (
                  <ActivityIndicator color={"#37B874"} />
                ) : (
                  <Table borderStyle={{ borderWidth: 1, borderColor: "white" }}>
                    <Row
                      data={data.tableHead}
                      widthArr={data.widthArr}
                      style={styles.head}
                      textStyle={styles.headText}
                    />
                    {data.tableData.map((rowData, index) => (
                      <TouchableOpacity
                        key={index}
                        onLongPress={() =>
                          handleLongPress(
                            getInvoicesWithVat(invoicesList)[index],
                            index
                          )
                        }
                        delayLongPress={1500}
                      >
                        <Row
                          key={index}
                          data={rowData}
                          widthArr={data.widthArr}
                          style={
                            isModalVisible && index === selectedRow?.index
                              ? {
                                  ...styles.rowSection,
                                  backgroundColor: "#eee",
                                }
                              : styles.rowSection
                          }
                          textStyle={styles.text}
                        />
                      </TouchableOpacity>
                    ))}
                    <Modal
                      visible={isModalVisible}
                      transparent
                      animationType="slide"
                      onRequestClose={() => setModalVisible(false)}
                    >
                      <TouchableOpacity
                        style={styles.overlay}
                        activeOpacity={1}
                        onPress={() => {
                          setModalVisible(false);
                        }}
                        pointerEvents="box-none"
                      >
                        <View
                          style={[
                            styles.modalContainer,
                            { zIndex: 10, elevation: 10 },
                          ]}
                        >
                          <Text style={styles.viewModalHeading}>
                            {selectedRow?.invoiceNumber}
                          </Text>
                          <View style={styles.modalContent}>
                            <TouchableOpacity
                              style={styles.iconButton}
                              onPress={() => {
                                if (Platform.OS === "ios" ) {setModalVisible(false);}
                                
                                handleView();
                              }}
                              onLongPress={() => {
                                if (Platform.OS === "ios" ) {setModalVisible(false);}
                                handleView();
                              }}
                            >
                              <AntDesign
                                name="eyeo"
                                size={24}
                                color="black"
                                style={{ padding: 5 }}
                              />
                            </TouchableOpacity>
                            {getPermission(selectedRow) === 2 &&
                              (tenant?.isAdmin ||
                                isTransactionTypeAllowed(
                                  selectedRow?.invoiceTypeNumber,
                                  [
                                    1, 2, 3, 4, 5, 6, 8, 10, 11, 14, 15, 16, 17,
                                    19,
                                  ],
                                  0,
                                  permissionsByKeyValue[
                                    saleTypesByPermissionKeys[
                                      selectedRow?.invoiceTypeNumber
                                    ]
                                  ]?.options
                                )) && (
                                <TouchableOpacity
                                  style={styles.iconButton}
                                  onPress={() => {
                                    setModalVisible(false);
                                    if (
                                      selectedRow.invoiceTypeNumber === 3 ||
                                      selectedRow.invoiceTypeNumber === 4
                                    ) {
                                      setRemoveModalVisible(true);
                                      setFiltersForRemove({
                                        value: selectedRow?.id,
                                        filters: filter,
                                        row: selectedRow,
                                      });
                                    } else {
                                      if (
                                        selectedRow.totalPaymentsAmountConvertedToMainCurrency ===
                                          null &&
                                        selectedRow.totalSalariesAmountConvertedToMainCurrency ===
                                          null &&
                                        selectedRow.totalRemoveInvoicesAmountConvertedToMainCurrency ===
                                          null
                                      ) {
                                        onRemoveProduct(
                                          selectedRow?.id,
                                          filter,
                                          selectedRow
                                        );
                                      } else {
                                        setInvoiceToDelete(
                                          selectedRow.invoiceNumber
                                        );
                                        setDeleteModalVisibe(true);
                                      }
                                    }
                                  }}
                                  onLongPress={() => {
                                    setModalVisible(false);
                                    if (
                                      selectedRow.invoiceTypeNumber === 3 ||
                                      selectedRow.invoiceTypeNumber === 4
                                    ) {
                                      setRemoveModalVisible(true);
                                      setFiltersForRemove({
                                        value: selectedRow?.id,
                                        filters: filter,
                                        row: selectedRow,
                                      });
                                    } else {
                                      if (
                                        selectedRow.totalPaymentsAmountConvertedToMainCurrency ===
                                          null &&
                                        selectedRow.totalSalariesAmountConvertedToMainCurrency ===
                                          null &&
                                        selectedRow.totalRemoveInvoicesAmountConvertedToMainCurrency ===
                                          null
                                      ) {
                                        onRemoveProduct(
                                          selectedRow?.id,
                                          filter,
                                          selectedRow
                                        );
                                      } else {
                                        setInvoiceToDelete(
                                          selectedRow.invoiceNumber
                                        );
                                        setDeleteModalVisibe(true);
                                      }
                                    }
                                  }}
                                >
                                  <FontAwesome
                                    name="trash"
                                    size={24}
                                    color="black"
                                    style={{ padding: 5 }}
                                  />
                                </TouchableOpacity>
                              )}
                            {getPermission(selectedRow) === 2 && (
                              <TouchableOpacity
                                style={styles.iconButton}
                                onPress={() => {
                                  handleFormModal(
                                    selectedRow?.invoiceTypeNumber,
                                    selectedRow?.draftType,
                                    selectedRow?.id
                                  );
                                }}
                                onLongPress={() => {
                                  handleFormModal(
                                    selectedRow?.invoiceTypeNumber,
                                    selectedRow?.draftType,
                                    selectedRow?.id
                                  );
                                }}
                              >
                                <MaterialCommunityIcons
                                  name="file-download-outline"
                                  size={24}
                                  color="black"
                                  style={{ padding: 5 }}
                                />
                              </TouchableOpacity>
                            )}
                            {getPermission(selectedRow) === 2 &&
                              [1, 2, 3, 5, 6].includes(
                                selectedRow?.invoiceTypeNumber
                              ) &&
                              (tenant?.isAdmin ||
                                isTransactionTypeAllowed(
                                  selectedRow?.invoiceTypeNumber,
                                  [
                                    1, 2, 3, 4, 5, 6, 8, 10, 11, 14, 15, 16, 17,
                                    19,
                                  ],
                                  1,
                                  permissionsByKeyValue[
                                    saleTypesByPermissionKeys[
                                      selectedRow?.invoiceTypeNumber
                                    ]
                                  ]?.options
                                )) && (
                                <TouchableOpacity
                                  style={styles.iconButton}
                                  onPress={() => {
                                    fetchSalesInvoiceInfo({
                                      apiEnd: Number(selectedRow.id),
                                      filter: {
                                        businessUnitIds:
                                          selectedRow.businessUnitId !==
                                            undefined &&
                                          selectedRow.businessUnitId === null
                                            ? [0]
                                            : selectedRow.businessUnitId
                                            ? [selectedRow.businessUnitId]
                                            : undefined,
                                        withRoadTaxes: 1,
                                      },
                                    }).then((data) => {
                                      setModalVisible(false);
                                      if (
                                        !data.canEdit &&
                                        data.invoiceType !== 2 &&
                                        data.invoiceType !== 1 &&
                                        data.invoiceType !== 3 &&
                                        data.invoiceType !== 4 &&
                                        data.invoiceType !== 5 &&
                                        data.invoiceType !== 10 &&
                                        data.invoiceType !== 14 &&
                                        data.invoiceType !== 15
                                      ) {
                                        Toast.show({
                                          type: "error",
                                          text2:
                                            "Bu qaimədə düzəliş oluna bilməz.",
                                          topOffset: 50,
                                        });

                                        navigation.pop();
                                      } else {
                                        // setInvoiceInfo(data);
                                        switch (selectedRow.invoiceTypeNumber) {
                                          case 1:
                                            navigation.push("Purchase", {
                                              id: selectedRow.id,
                                              businessUnit:
                                                selectedRow.businessUnitId,
                                              invoiceInfo: data,
                                            });
                                            break;
                                          case 2:
                                            navigation.push("Sale", {
                                              id: selectedRow.id,
                                              businessUnit:
                                                selectedRow.businessUnitId,
                                              invoiceInfo: data,
                                            });
                                            break;
                                          case 3:
                                            navigation.push(
                                              "ReturnFromCustomer",
                                              {
                                                id: selectedRow.id,
                                                businessUnit:
                                                  selectedRow.businessUnitId,
                                                invoiceInfo: data,
                                              }
                                            );
                                            break;
                                          case 5:
                                            navigation.push("SaleTransfer", {
                                              id: selectedRow.id,
                                              businessUnit:
                                                selectedRow.businessUnitId,
                                              invoiceInfo: data,
                                            });
                                            break;
                                          case 6:
                                            navigation.push("WritingOff", {
                                              id: selectedRow.id,
                                              businessUnit:
                                                selectedRow.businessUnitId,
                                              invoiceInfo: data,
                                            });
                                            break;
                                          default:
                                            break;
                                        }
                                      }
                                    });
                                  }}
                                  onLongPress={() => {
                                    fetchSalesInvoiceInfo({
                                      apiEnd: Number(selectedRow.id),
                                      filter: {
                                        businessUnitIds:
                                          selectedRow.businessUnitId !==
                                            undefined &&
                                          selectedRow.businessUnitId === null
                                            ? [0]
                                            : selectedRow.businessUnitId
                                            ? [selectedRow.businessUnitId]
                                            : undefined,
                                        withRoadTaxes: 1,
                                      },
                                    }).then((data) => {
                                      setModalVisible(false);
                                      if (
                                        !data.canEdit &&
                                        data.invoiceType !== 2 &&
                                        data.invoiceType !== 1 &&
                                        data.invoiceType !== 3 &&
                                        data.invoiceType !== 4 &&
                                        data.invoiceType !== 5 &&
                                        data.invoiceType !== 10 &&
                                        data.invoiceType !== 14 &&
                                        data.invoiceType !== 15
                                      ) {
                                        Toast.show({
                                          type: "error",
                                          text2:
                                            "Bu qaimədə düzəliş oluna bilməz.",
                                          topOffset: 50,
                                        });

                                        navigation.pop();
                                      } else {
                                        // setInvoiceInfo(data);
                                        switch (selectedRow.invoiceTypeNumber) {
                                          case 1:
                                            navigation.push("Purchase", {
                                              id: selectedRow.id,
                                              businessUnit:
                                                selectedRow.businessUnitId,
                                              invoiceInfo: data,
                                            });
                                            break;
                                          case 2:
                                            navigation.push("Sale", {
                                              id: selectedRow.id,
                                              businessUnit:
                                                selectedRow.businessUnitId,
                                              invoiceInfo: data,
                                            });
                                            break;
                                          case 4:
                                            navigation.push(
                                              "ReturnFromCustomer",
                                              {
                                                id: selectedRow.id,
                                                businessUnit:
                                                  selectedRow.businessUnitId,
                                                invoiceInfo: data,
                                              }
                                            );
                                            break;
                                          case 5:
                                            navigation.push("SaleTransfer", {
                                              id: selectedRow.id,
                                              businessUnit:
                                                selectedRow.businessUnitId,
                                              invoiceInfo: data,
                                            });
                                            break;
                                          case 6:
                                            navigation.push("WritingOff", {
                                              id: selectedRow.id,
                                              businessUnit:
                                                selectedRow.businessUnitId,
                                              invoiceInfo: data,
                                            });
                                            break;
                                          default:
                                            break;
                                        }
                                      }
                                    });
                                  }}
                                >
                                  <FontAwesome
                                    name="pencil"
                                    size={24}
                                    color="black"
                                    style={{ padding: 5 }}
                                  />
                                </TouchableOpacity>
                              )}
                          </View>
                        </View>
                      </TouchableOpacity>
                    </Modal>
                  </Table>
                )}
              </ScrollView>
            </View>
            <View style={{ marginBottom: 25 }}>
              <Pagination
                totalItems={invoicesCount}
                pageSize={pageSize}
                currentPage={currentPage}
                onPageChange={handlePaginationChange}
                textStyle={{ fontSize: 6 }}
              />
            </View>
          </View>
        </View>
      </ScrollView>
    </>
  );
};

const SecondRoute = (props) => {
  const {
    tenant,
    profile,
    mainCurrency,
    allBusinessUnits,
    setTableSettings,
    tableSettings,
    navigation,
    permissionsByKeyValue,
    permissions,
  } = props;
  const [data, setData] = useState({
    tableHead: [],
    widthArr: [],
    tableData: [],
  });
  // const [tableConfiguration, setTableConfiguration] = useState([]);
  const [visibleColumns, setVisibleColumns] = useState([]);
  const [settingVisible, setSettingVisible] = useState(false);
  const [tableSettingData, setTableSettingData] = useState(
    TRANSACTION_LIST_TABLE_SETTING_DATA
  );

  const [pageSize, setPageSize] = useState(8);
  const [currentPage, setCurrentPage] = useState(1);
  const [transactionsList, setTransactionsList] = useState([]);
  const [transactionsCount, setTransactionsCount] = useState(0);
  const [exportModal, setExportModal] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedRow, setSelectedRow] = useState([]);
  const [barterInvoices, setBarterInvoices] = useState([]);
  const [isModalVisible, setModalVisible] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [description, setDescription] = useState();
  const [formModal, setFormModal] = useState(false);
  const [financeForms, setFinanceForms] = useState([]);
  const [formsData, setFormsData] = useState(undefined);

  const financePermissions = permissions.filter(
    ({ group_key, sub_group_key }) =>
      group_key === "transaction" && sub_group_key === "operations"
  );
  const [filter, onFilter, setFilter] = useFilterHandle(
    {
      limit: pageSize,
      page: currentPage,
      bypass: 0,
      withSerialNumber: 1,
      sortOrder: null,
      orderBy: "createdAt",
      excludeReturnInvoicePayments: 1,
    },
    () => {
      fetchTransactionList({
        filter: filter,
      }).then((productData) => {
        setTransactionsList(productData);
      });
      fetchTransactionsCount({
        filter: filter,
      }).then((productData) => {
        setTransactionsCount(productData);
      });
    }
  );

  const handlePaginationChange = (value) => {
    onFilter("page", value);
    return (() => setCurrentPage(value))();
  };

  const handleDetailsModal = (row) => {
    setSelectedRow({
      ...row,
      id: row?.paymentInvoiceId,
      invoiceTypeNumber: row?.paymentInvoiceType,
    });

    if (row.transactionType === 23) {
      fetchBarterInvoices({
        transactionId: row?.cashboxTransactionId,
      }).then((res) => {
        const inv = Object.values(res?.invoices)?.map((barterInv) => {
          return {
            ...barterInv,
            invoiceId: barterInv?.id,
          };
        });
        setBarterInvoices(inv);
      });
    }
    setShowModal(!showModal);
  };
  useEffect(() => {
    fetchSalesBuysForms({}).then((res) => {
      setFinanceForms([
        ...Object.values(res).filter(
          ({ type }) =>
            type === 13 ||
            type === 18 ||
            type === 19 ||
            type === 15 ||
            type === 16 ||
            type === 17 ||
            type === 14 ||
            type === 20 ||
            type === 21 ||
            type === 24 ||
            type === 29
        ),
      ]);
    });
  }, []);
  useEffect(() => {
    const columns = [];
    let column = visibleColumns;
    setData({
      tableHead: [
        "No",
        ...visibleColumns.map((item) => {
          return TRANSACTION_LIST_TABLE_SETTING_DATA.find(
            (i) => i.dataIndex === item
          )?.name;
        }),
      ],
      widthArr: [
        60,
        ...visibleColumns.map((el) => {
          return 100;
        }),
      ],
      tableData: transactionsList?.map(
        (
          {
            cashboxName,
            createdAt,
            dateOfTransaction,
            documentNumber,
            operationDirectionId,
            transactionType,
            subCategoryName,
            contactOrEmployee,
            paymentInvoiceInvoiceNumber,
            categoryName,
            contractNo,
            contractSerialNumber,
            amount,
            invoicePaymentAmountConvertedToInvoiceCurrency,
            operationDirectionName,
            invoiceCurrencyCode,
            currencyCode,
            mainCurrency,
            amountConvertedToMainCurrency,
            status,
            createdByLastname,
            createdByName,
            paymentTypeName,
            description,
            businessUnits,
            businessUnitId,
          },
          index
        ) => {
          columns[column.indexOf("cashboxName")] = <Text>{cashboxName}</Text>;

          columns[column.indexOf("createdAt")] = (
            <Text>{createdAt?.split("  ")}</Text>
          );
          columns[column.indexOf("dateOfTransaction")] = (
            <Text>{dateOfTransaction}</Text>
          );
          columns[column.indexOf("documentNumber")] = (
            <Text>{documentNumber}</Text>
          );
          columns[column.indexOf("operationDirectionId")] =
            operationDirectionId === -1 ? (
              <Text>Məxaric</Text>
            ) : operationDirectionId === 1 ? (
              <Text>Mədaxil</Text>
            ) : operationDirectionId === 2 ? (
              <Text>Balans</Text>
            ) : (
              <Text>-</Text>
            );
          columns[column.indexOf("categoryName")] =
            transactionType === 14 ? (
              <Text>İlkin qalıq</Text>
            ) : (
              <Text>{categoryName}</Text>
            );
          columns[column.indexOf("subCategoryName")] =
            transactionType === 14 ? (
              <Text>Hesab</Text>
            ) : (
              <Text>{subCategoryName || "-"}</Text>
            );

          columns[column.indexOf("contactOrEmployee")] = (
            <Text>{contactOrEmployee || "-"}</Text>
          );

          columns[column.indexOf("paymentInvoiceInvoiceNumber")] =
            transactionType == 23 ? (
              <Text>-</Text>
            ) : (
              <Text>
                {paymentInvoiceInvoiceNumber
                  ? paymentInvoiceInvoiceNumber
                  : contractNo
                  ? `${contractSerialNumber} - ${contractNo}`
                  : contractSerialNumber || tenant?.name}
              </Text>
            );

          const isCashOut = operationDirectionName === "Cash out";

          const amounts =
            mainCurrency?.code === invoiceCurrencyCode &&
            mainCurrency?.code === currencyCode
              ? invoicePaymentAmountConvertedToInvoiceCurrency
              : amount;

          columns[column.indexOf("amount")] =
            transactionType == 23 ? (
              <Text>-</Text>
            ) : (
              <View style={{ display: "flex", flexDirection: "row" }}>
                <Text>
                  {isCashOut ? "-" : ""}
                  {formatNumberToLocale(defaultNumberFormat(amounts || 0))
                    .split(".")[0]
                    .replace(/,/g, " ")}
                </Text>
                <Text>
                  ,
                  {
                    formatNumberToLocale(
                      defaultNumberFormat(amounts || 0)
                    ).split(".")[1]
                  }{" "}
                </Text>
                <Text>{currencyCode}</Text>
              </View>
            );
          columns[column.indexOf("amountConvertedToMainCurrency")] =
            transactionType == 23 ? (
              <Text>-</Text>
            ) : (
              <View style={{ display: "flex", flexDirection: "row" }}>
                <Text>
                  {formatNumberToLocale(
                    defaultNumberFormat(amountConvertedToMainCurrency || 0)
                  )
                    .split(".")[0]
                    .replace(/,/g, " ")}
                </Text>
                <Text>
                  ,
                  {
                    formatNumberToLocale(
                      defaultNumberFormat(amountConvertedToMainCurrency || 0)
                    ).split(".")[1]
                  }
                </Text>
              </View>
            );

          columns[column.indexOf("status")] =
            transactionType == 23 ? (
              <Text>-</Text>
            ) : (
              status && (
                <Text>
                  {status === "active"
                    ? "aktiv"
                    : status === "silinib"
                    ? "silinib"
                    : "silinib"}
                </Text>
              )
            );
          columns[column.indexOf("createdByName")] =
            transactionType == 23 ? (
              <Text>-</Text>
            ) : (
              <Text>{`${createdByName} ${createdByLastname}` || "-"}</Text>
            );
          columns[column.indexOf("paymentTypeName")] = (
            <Text>
              {paymentTypeName === "Nəğd"
                ? "Nəğd"
                : paymentTypeName === "Bank"
                ? "Bank Transferi"
                : paymentTypeName === "Kart"
                ? "Kart ödənişi"
                : paymentTypeName === "Digər"
                ? "Digər"
                : "-"}
            </Text>
          );

          columns[column.indexOf("description")] = (
            <Text>{description || "-"}</Text>
          );

          columns[column.indexOf("businessUnitId")] = (
            <Text>
              {allBusinessUnits?.find(({ id }) => id === businessUnitId)
                ?.name || "-"}
            </Text>
          );

          return [(currentPage - 1) * pageSize + index + 1, ...columns];
        }
      ),
    });
  }, [visibleColumns, transactionsList]);

  useEffect(() => {
    if (
      tableSettings?.["TransactionOperationsForMob"]?.columnsOrder?.length >
        0 &&
      tableSettings?.["TransactionOperationsForMob"]?.columnsOrder !== null
    ) {
      const parseData = JSON.parse(
        tableSettings?.["TransactionOperationsForMob"]?.columnsOrder
      );
      const columns = parseData
        .filter((column) => column.visible === true)
        .map((column) => column.dataIndex);
      setVisibleColumns(columns);
      setTableSettingData(parseData);
    } else if (
      tableSettings?.["TransactionOperationsForMob"]?.columnsOrder == null
    ) {
      const column = TRANSACTION_LIST_TABLE_SETTING_DATA.filter(
        (column) => column.visible === true
      ).map((column) => column.dataIndex);
      setVisibleColumns(column);
      setTableSettingData(TRANSACTION_LIST_TABLE_SETTING_DATA);
    }
  }, [tableSettings]);

  const handleSaveSettingModal = (column) => {
    const tableColumn = column
      .filter((col) => col.visible === true)
      .map((col) => col.dataIndex);
    const filterColumn = column.filter((col) => col.dataIndex !== "id");
    const filterColumnData = JSON.stringify(filterColumn);

    createSettings({
      moduleName: "TransactionOperationsForMob",
      columnsOrder: filterColumnData,
    }).then((res) => {
      const newTableSettings = {
        ...tableSettings,
        [`TransactionOperationsForMob`]: { columnsOrder: filterColumnData },
      };
      setTableSettings(newTableSettings);
    });
    setVisibleColumns(tableColumn);
    setTableSettingData(column);

    setSettingVisible(false);
  };
  const handleExport = () => {
    setExportModal(true);
    fetchTransactionList({
      filter: { ...filter, limit: 5000, page: undefined },
    }).then((productData) => {
      exportDataToExcel(productData);
      setExportModal(false);
    });
  };

  const exportDataToExcel = async (exData) => {
    const columnClone = [...visibleColumns];
    const data = exData?.map((item, index) => {
      const arr = [];
      columnClone.includes("cashboxName") &&
        (arr[columnClone.indexOf("cashboxName")] = {
          Hesab: item.cashboxName || "-",
        });
      columnClone.includes("createdAt") &&
        (arr[columnClone.indexOf("createdAt")] = {
          "İcra tarixi":
            item.createdAt?.replace(/(\d{4})-(\d\d)-(\d\d)/, "$3-$2-$1") || "-",
        });
      columnClone.includes("dateOfTransaction") &&
        (arr[columnClone.indexOf("dateOfTransaction")] = {
          "Əməliyyat tarixi": item.dateOfTransaction || "-",
        });
      columnClone.includes("documentNumber") &&
        (arr[columnClone.indexOf("documentNumber")] = {
          Sənəd: item.documentNumber || "-",
        });
      columnClone.includes("operationDirectionId") &&
        (arr[columnClone.indexOf("operationDirectionId")] = {
          Növ:
            item.operationDirectionId == -1
              ? "Məxaric"
              : item.operationDirectionId == 1
              ? "Mədaxil"
              : item.operationDirectionId == 2
              ? "Balans"
              : "-",
        });
      columnClone.includes("categoryName") &&
        (arr[columnClone.indexOf("categoryName")] = {
          Kateqoriya:
            item.transactionType === 14
              ? "İlkin qalıq"
              : item.categoryName || "-",
        });
      columnClone.includes("subCategoryName") &&
        (arr[columnClone.indexOf("subCategoryName")] = {
          "Alt kateqoriya":
            item.transactionType === 14 ? "Hesab" : item.subCategoryName || "-",
        });
      columnClone.includes("contactOrEmployee") &&
        (arr[columnClone.indexOf("contactOrEmployee")] = {
          "Qarşı tərəf": item.contactOrEmployee || "-",
        });
      columnClone.includes("paymentInvoiceInvoiceNumber") &&
        (arr[columnClone.indexOf("paymentInvoiceInvoiceNumber")] = {
          "Xərc Mərkəzi": item?.paymentInvoiceInvoiceNumber
            ? item?.paymentInvoiceInvoiceNumber
            : item?.contractSerialNumber || tenant?.name || "-",
        });
      columnClone.includes("amount") &&
        (arr[columnClone.indexOf("amount")] = {
          Məbləğ:
            `${item.operationDirectionName === "Cash out" ? "-" : ""} ${
              item.mainCurrencyCode === item.invoiceCurrencyCode &&
              item.mainCurrencyCode === item.currencyCode
                ? formatNumberForExcel(
                    Number(
                      item.invoicePaymentAmountConvertedToInvoiceCurrency || 0
                    )
                  )
                : formatNumberForExcel(Number(item.amount || 0))
            } ${item.currencyCode || item.mainCurrencyCode}` || "-",
        });
      columnClone.includes("amountConvertedToMainCurrency") &&
        (arr[columnClone.indexOf("amountConvertedToMainCurrency")] = {
          "Əsas valyuta":
            item.operationDirectionName === "Cash out"
              ? -Number(item.amountConvertedToMainCurrency) || "-"
              : Number(item.amountConvertedToMainCurrency) || "-",
        });
      columnClone.includes("businessUnitId") &&
        (arr[columnClone.indexOf("businessUnitId")] = {
          "Biznes blok":
            `${
              allBusinessUnits?.find(({ id }) => id === item.businessUnitId)
                ?.name
            }` || "-",
        });
      columnClone.includes("status") &&
        (arr[columnClone.indexOf("status")] = {
          Status: item.status == "active" ? "aktiv" : "silinib" || "-",
        });
      columnClone.includes("createdByName") &&
        (arr[columnClone.indexOf("createdByName")] = {
          "Məsul şəxs":
            `${item.createdByName} ${item.createdByLastname}` || "-",
        });
      columnClone.includes("paymentTypeName") &&
        (arr[columnClone.indexOf("paymentTypeName")] = {
          "Ödəniş növü": getExcelPaymentStatus(item.paymentTypeName) || "-",
        });
      columnClone.includes("description") &&
        (arr[columnClone.indexOf("description")] = {
          "Əlavə məlumat": item.description || "-",
        });

      arr.unshift({ No: index + 1 });

      return Object.assign({}, ...arr);
    });
    let sample_data_to_export = data;

    var ws = XLSX.utils.json_to_sheet(sample_data_to_export);
    var wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Cities");

    const base64 = XLSX.write(wb, { type: "base64", bookType: "xlsx" });
    const filename =
      FileSystem.documentDirectory + `transaction${uuid()}}.xlsx`;

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
    }}
    else if (Platform.OS === 'ios') {
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

  const handleDeleteOperation = (item, reason, row) => {
    deleteTransaction({
      apiEnd: item,
      filters: {
        deletionReason: reason,
      },
    })
      .then(() => {
        setModalVisible(false);
        setDeleteModal(false);
        setDescription();
        if ((transactionsCount - 1) % pageSize == 0 && currentPage > 1) {
          handlePaginationChange(currentPage - 1);
        } else {
          fetchTransactionList({
            filter: filter,
          }).then((productData) => {
            setTransactionsList(productData);
          });
          fetchTransactionsCount({
            filter: filter,
          }).then((productData) => {
            setTransactionsCount(productData);
          });
        }
      })
      .catch((err) => {
        setModalVisible(false);
        setDeleteModal(false);
        setDescription();
        const errData = err?.data?.error;
        if (
          errData?.code === "advance_transaction_constraint" ||
          errData?.code === "employee_payment_transaction_constraint" ||
          errData?.code === 404
        ) {
          return Toast.show({
            type: "error",
            text2: errData?.message,
            topOffset: 50,
          });
        } else {
          const cashboxName =
            errData?.errorData?.cashbox.length > 15
              ? `${errData?.errorData?.cashbox.substring(0, 15)} ...`
              : errData?.errorData?.cashbox;
          return Toast.show({
            type: "error",
            text2: `Bu əməliyyat hesabda kifayət qədər vəsait olmadığından silinə bilməz. ${cashboxName} hesabına ən az ${math.mul(
              Number(errData?.errorData.amount || 0),
              -1
            )} ${errData?.errorData?.currencyCode} əlavə olunmalıdır. Tarix: ${
              errData?.errorData?.date
            }`,
            topOffset: 50,
          });
        }
      });
  };

  const handleFormModal = (transactionType, id) => {
    if (transactionType === 8) {
      const formData = financeForms.filter(
        (salesBuys) => salesBuys.type === 19
      );

      if (id && (formData.length === 0 || formData?.[0]?.docs?.length === 0)) {
        Toast.show({
          type: "error",
          text2: "Bu sənəd üzrə ixrac forması yoxdur.",
          topOffset: 50,
        });
      } else {
        setFormModal(true);
        setModalVisible(false);
        setFormsData(formData);
      }
    } else if (transactionType === 11) {
      const formData = financeForms.filter(
        (salesBuys) => salesBuys.type === 18
      );

      if (id && (formData.length === 0 || formData?.[0]?.docs?.length === 0)) {
        Toast.show({
          type: "error",
          text2: "Bu sənəd üzrə ixrac forması yoxdur.",
          topOffset: 50,
        });
      } else {
        setFormModal(true);
        setModalVisible(false);
        setFormsData(formData);
      }
    } else if (transactionType === 4) {
      const formData = financeForms.filter(
        (salesBuys) => salesBuys.type === 15
      );

      if (id && (formData.length === 0 || formData?.[0]?.docs?.length === 0)) {
        Toast.show({
          type: "error",
          text2: "Bu sənəd üzrə ixrac forması yoxdur.",
          topOffset: 50,
        });
      } else {
        setFormModal(true);
        setModalVisible(false);
        setFormsData(formData);
      }
    } else if (transactionType === 16) {
      const formData = financeForms.filter(
        (salesBuys) => salesBuys.type === 24
      );

      if (id && (formData.length === 0 || formData?.[0]?.docs?.length === 0)) {
        Toast.show({
          type: "error",
          text2: "Bu sənəd üzrə ixrac forması yoxdur.",
          topOffset: 50,
        });
      } else {
        setFormModal(true);
        setModalVisible(false);
        setFormsData(formData);
      }
    } else if (transactionType === 6) {
      const formData = financeForms.filter(
        (salesBuys) => salesBuys.type === 14
      );

      if (id && (formData.length === 0 || formData?.[0]?.docs?.length === 0)) {
        Toast.show({
          type: "error",
          text2: "Bu sənəd üzrə ixrac forması yoxdur.",
          topOffset: 50,
        });
      } else {
        setModalVisible(false);
        setFormModal(true);
        setFormsData(formData);
      }
    } else if (transactionType === 14) {
      const formData = financeForms.filter(
        (salesBuys) => salesBuys.type === 21
      );

      if (id && (formData.length === 0 || formData?.[0]?.docs?.length === 0)) {
        Toast.show({
          type: "error",
          text2: "Bu sənəd üzrə ixrac forması yoxdur.",
          topOffset: 50,
        });
      } else {
        setModalVisible(false);
        setFormModal(true);
        setFormsData(formData);
      }
    } else if (transactionType === 7) {
      const formData = financeForms.filter(
        (salesBuys) => salesBuys.type === 17
      );

      if (id && (formData.length === 0 || formData?.[0]?.docs?.length === 0)) {
        Toast.show({
          type: "error",
          text2: "Bu sənəd üzrə ixrac forması yoxdur.",
          topOffset: 50,
        });
      } else {
        setModalVisible(false);
        setFormModal(true);
        setFormsData(formData);
      }
    } else if (transactionType === 12) {
      const formData = financeForms.filter(
        (salesBuys) => salesBuys.type === 16
      );

      if (id && (formData.length === 0 || formData?.[0]?.docs?.length === 0)) {
        Toast.show({
          type: "error",
          text2: "Bu sənəd üzrə ixrac forması yoxdur.",
          topOffset: 50,
        });
      } else {
        setModalVisible(false);
        setFormModal(true);
        setFormsData(formData);
      }
    } else if (transactionType === 13) {
      const formData = financeForms.filter(
        (salesBuys) => salesBuys.type === 20
      );

      if (id && (formData.length === 0 || formData?.[0]?.docs?.length === 0)) {
        Toast.show({
          type: "error",
          text2: "Bu sənəd üzrə ixrac forması yoxdur.",
          topOffset: 50,
        });
      } else {
        setModalVisible(false);
        setFormModal(true);
        setFormsData(formData);
      }
    } else if (transactionType === 9 || transactionType === 10) {
      const formData = financeForms.filter(
        (salesBuys) => salesBuys.type === 13
      );

      if (id && (formData.length === 0 || formData?.[0]?.docs?.length === 0)) {
        Toast.show({
          type: "error",
          text2: "Bu sənəd üzrə ixrac forması yoxdur.",
          topOffset: 50,
        });
      } else {
        setModalVisible(false);
        setFormModal(true);
        setFormsData(formData);
      }
    } else if (transactionType === 23) {
      const formData = financeForms.filter(
        (salesBuys) => salesBuys.type === 29
      );

      if (id && (formData.length === 0 || formData?.[0]?.docs?.length === 0)) {
        Toast.show({
          type: "error",
          text2: "Bu sənəd üzrə ixrac forması yoxdur.",
          topOffset: 50,
        });
      } else {
        setModalVisible(false);
        setFormModal(true);
        setFormsData(formData);
      }
    } else {
      Toast.show({
        type: "error",
        text2: "Bu sənəd üzrə ixrac forması yoxdur.",
        topOffset: 50,
      });
    }
  };

  const getPermission = (row) => {
    return financePermissions.find(({ key }) => {
      if (
        paymentType.find(({ id }) => id === row.transactionType)?.key ===
        "transaction_vat_advance"
      ) {
        return financePermissions.find(
          ({ key }) => key === "transaction_advance_payment"
        );
      } else if (
        paymentType.find(({ id }) => id === row.transactionType)?.key ===
        "transaction_vat_invoice_payment"
      ) {
        return financePermissions.find(
          ({ key }) => key === "transaction_invoice_payment"
        );
      } else {
        return (
          key === paymentType.find(({ id }) => id === row.transactionType)?.key
        );
      }
    })?.permission;
  };

  return (
    <>
      <Modal
        animationType="slide"
        transparent={true}
        visible={formModal}
        onRequestClose={() => {
          setFormModal(false);
        }}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Forms
              row={selectedRow}
              formsData={formsData}
              setVisible={setFormModal}
              visible={formModal}
              fromFinance
              tenant={tenant?.id}
            />
          </View>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        visible={deleteModal}
        onRequestClose={() => {
          setDeleteModal(false);
          setDescription();
        }}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <ProText
              variant="heading"
              fontWeight={700}
              style={{ color: "black" }}
              textAlign="center"
            >
              Silinmə səbəbini qeyd edin
            </ProText>

            <View
              style={{
                marginTop: 12,
                marginBottom: 12,
                display: "flex",
                flexDirection: "row",
                width: "100%",
                alignItems: "center",
              }}
            >
              <View style={{ width: "100%" }}>
                <TextInput
                  multiline={true}
                  placeholder="Yazın"
                  onChangeText={(val) => {
                    setDescription(val);
                  }}
                  style={{
                    padding: 5,
                    borderWidth: 1,
                    borderRadius: 5,
                    borderColor: "#dedede",
                  }}
                  value={description}
                />
              </View>
            </View>

            <View style={{ flexDirection: "row", gap: 10 }}>
              <ProButton
                label="Təsdiq et"
                type="primary"
                onClick={() => {
                  handleDeleteOperation(
                    selectedRow.cashboxTransactionId,
                    description,
                    selectedRow
                  );
                }}
              />
              <ProButton
                label="İmtina"
                type="transparent"
                onClick={() => {
                  setDeleteModal(false);
                  setDescription();
                }}
                defaultStyle={{ borderRadius: 5 }}
              />
            </View>

            <Pressable
              style={[styles.button]}
              onPress={() => {
                setDeleteModal(false);
                setDescription();
              }}
            >
              <AntDesign name="close" size={14} color="black" />
            </Pressable>
          </View>
        </View>
      </Modal>
      {showModal && (
        <FinanceDetail
          isVisible={showModal}
          handleModal={(isSubmit = false) => {
            if (isSubmit) {
              console.log("ok");
            }

            setShowModal(false);
            if(Platform.OS === "ios" ) {setModalVisible(true);}
          }}
          allBusinessUnits={allBusinessUnits}
          profile={profile}
          tenant={tenant}
          data={selectedRow}
          mainCurrency={mainCurrency}
          barterInvoices={barterInvoices}
        />
      )}
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
          AllStandartColumns={TRANSACTION_LIST_TABLE_SETTING_DATA}
        />
      </Modal>
      <ScrollView>
        <View
          style={{
            paddingTop: 40,
            paddingLeft: 10,
            paddingRight: 10,
            paddingBottom: 40,
          }}
        >
          <View
            style={{
              marginTop: 10,
              marginBottom: 20,
              padding: 10,
              borderRadius: 4,
              backgroundColor: "#fff",
              display: "flex",
              gap: 10,
            }}
          >
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
            <View style={{ display: "flex", alignItems: "flex-end" }}>
              <ScrollView nestedScrollEnabled={true} horizontal={true}>
                <Table borderStyle={{ borderWidth: 1, borderColor: "white" }}>
                  <Row
                    data={data.tableHead}
                    widthArr={data.widthArr}
                    style={styles.head}
                    textStyle={styles.headText}
                  />
                  {data.tableData.map((rowData, index) => (
                    <TouchableOpacity
                      key={index}
                      onLongPress={() => {
                        setSelectedRow(transactionsList[index]);
                        setModalVisible(true);
                      }}
                      delayLongPress={1500}
                    >
                      <Row
                        key={index}
                        data={rowData}
                        widthArr={data.widthArr}
                        style={styles.rowSection}
                        textStyle={styles.text}
                      />
                    </TouchableOpacity>
                  ))}
                  <Modal
                    visible={isModalVisible}
                    transparent
                    animationType="slide"
                    onRequestClose={() => setModalVisible(false)}
                  >
                    <TouchableOpacity
                      style={styles.overlay}
                      activeOpacity={1}
                      onPress={() => {
                        setModalVisible(false);
                      }}
                      pointerEvents="box-none"
                    >
                      <View
                        style={[
                          styles.modalContainer,
                          { zIndex: 10, elevation: 10 },
                        ]}
                      >
                        <Text style={styles.viewModalHeading}>
                          {selectedRow?.documentNumber}
                        </Text>
                        <View style={styles.modalContent}>
                          <TouchableOpacity
                            style={styles.iconButton}
                            onPress={() => {
                              if(Platform.OS === "ios" ) {setModalVisible(false);}
                              handleDetailsModal(selectedRow);
                            }}
                            onLongPress={() => {
                              if(Platform.OS === "ios" ) {setModalVisible(false);}
                              handleDetailsModal(selectedRow);
                            }}
                          >
                            <AntDesign
                              name="eyeo"
                              size={24}
                              color="black"
                              style={{ padding: 5 }}
                            />
                          </TouchableOpacity>
                          {getPermission(selectedRow) === 2 &&
                            (tenant?.isAdmin ||
                              isTransactionTypeAllowed(
                                selectedRow?.transactionType,
                                Object.keys(operationTypesByPermissionKey)?.map(
                                  (i) => Number(i)
                                ),
                                0,
                                permissionsByKeyValue[
                                  operationTypesByPermissionKey[
                                    selectedRow?.transactionType
                                  ]
                                ]?.options
                              )) && (
                              <TouchableOpacity
                                style={styles.iconButton}
                                onPress={() => {
                                  setModalVisible(false);
                                  setDeleteModal(true);
                                }}
                                onLongPress={() => {
                                  setModalVisible(false);
                                  setDeleteModal(true);
                                }}
                              >
                                <FontAwesome
                                  name="trash"
                                  size={24}
                                  color="black"
                                  style={{ padding: 5 }}
                                />
                              </TouchableOpacity>
                            )}
                          {getPermission(selectedRow) === 2 && (
                            <TouchableOpacity
                              style={styles.iconButton}
                              onPress={() => {
                                handleFormModal(
                                  selectedRow?.transactionType,
                                  selectedRow?.id
                                );
                              }}
                              onLongPress={() => {
                                handleFormModal(
                                  selectedRow?.transactionType,
                                  selectedRow?.id
                                );
                              }}
                            >
                              <MaterialCommunityIcons
                                name="file-download-outline"
                                size={24}
                                color="black"
                                style={{ padding: 5 }}
                              />
                            </TouchableOpacity>
                          )}
                          {getPermission(selectedRow) === 2 &&
                            [4, 8, 9, 10].includes(selectedRow?.transactionType) &&
                            (tenant?.isAdmin ||
                              isTransactionTypeAllowed(
                                selectedRow?.transactionType,
                                Object.keys(operationTypesByPermissionKey)?.map(
                                  (i) => Number(i)
                                ),
                                1,
                                permissionsByKeyValue[
                                  operationTypesByPermissionKey[
                                    selectedRow?.transactionType
                                  ]
                                ]?.options
                              )) && (
                              <TouchableOpacity
                                style={styles.iconButton}
                                onPress={() => {
                                  fetchTransactionList({
                                    filter: {
                                      ids: [selectedRow.cashboxTransactionId],
                                    },
                                  }).then((data) => {
                                    console.log(data, 'data')
                                    setModalVisible(false)
                                    switch (selectedRow.transactionType) {
                                      case 4:
                                        navigation.push("FinanceTransfer", {
                                          id: selectedRow.cashboxTransactionId,
                                          businessUnit:
                                            selectedRow.businessUnitId,
                                          operationList: data,
                                        });
                                        break;
                                      case 8:
                                        navigation.push("Payments", {
                                          id: selectedRow.cashboxTransactionId,
                                          businessUnit:
                                            selectedRow.businessUnitId,
                                          operationList: data,
                                        });
                                        break;
                                      case 9:
                                      case 10:
                                        navigation.push("Invoice", {
                                          id: selectedRow.cashboxTransactionId,
                                          businessUnit:
                                            selectedRow.businessUnitId,
                                          operationList: data,
                                          isQueryVat:
                                            selectedRow?.transactionType == 10
                                              ? true
                                              : false,
                                        });
                                        break;
                                      default:
                                        break;
                                    }
                                  });
                                }}
                                onLongPress={() => {
                                  fetchTransactionList({
                                    filter: {
                                      ids: [selectedRow.cashboxTransactionId],
                                    },
                                  }).then((data) => {
                                    setModalVisible(false);
                                    switch (selectedRow.transactionType) {
                                      case 4:
                                        navigation.push("FinanceTransfer", {
                                          id: selectedRow.cashboxTransactionId,
                                          businessUnit:
                                            selectedRow.businessUnitId,
                                          operationList: data,
                                        });
                                        break;
                                      case 8:
                                        navigation.push("Payments", {
                                          id: selectedRow.cashboxTransactionId,
                                          businessUnit:
                                            selectedRow.businessUnitId,
                                          operationList: data,
                                        });
                                        break;
                                      case 9:
                                        navigation.push("Invoice", {
                                          id: selectedRow.cashboxTransactionId,
                                          businessUnit:
                                            selectedRow.businessUnitId,
                                          operationList: data,
                                          isQueryVat:
                                            selectedRow?.transactionType == 10
                                              ? true
                                              : false,
                                        });
                                        break;
                                      default:
                                        break;
                                    }
                                  });
                                }}
                              >
                                <FontAwesome
                                  name="pencil"
                                  size={24}
                                  color="black"
                                  style={{ padding: 5 }}
                                />
                              </TouchableOpacity>
                            )}
                        </View>
                      </View>
                    </TouchableOpacity>
                  </Modal>
                </Table>
              </ScrollView>
            </View>
            <View style={{ marginBottom: 25 }}>
              <Pagination
                totalItems={transactionsCount}
                pageSize={pageSize}
                currentPage={currentPage}
                onPageChange={handlePaginationChange}
                textStyle={{ fontSize: 6 }}
              />
            </View>
          </View>
        </View>
      </ScrollView>
    </>
  );
};

const Modul = ({ navigation }) => {
  const [isLogged, setIsLogged] = useContext(AuthContext);
  const { showActionSheetWithOptions } = useActionSheet();
  const [index, setIndex] = useState(0);
  const [allBusinessUnits, setAllBusinessUnits] = useState(undefined);
  const [statusData, setStatusData] = useState([]);
  const [mainCurrency, setMainCurrency] = useState({});

  const layout = useWindowDimensions();

  const {
    profile,
    tenant,
    permissionsByKeyValue,
    BUSINESS_TKN_UNIT,
    tableSettings,
    setTableSettings,
    permissions,
  } = useContext(TenantContext);

  const [routes] = React.useState([
    { key: "first", title: "Ticarət" },
    { key: "second", title: "Maliyyə" },
  ]);

  useEffect(() => {
    getBusinessUnit({}).then((res) => {
      setAllBusinessUnits(res);
    });
    fetchStatusOperations({}).then((res) => {
      setStatusData(
        res.filter((item) => item.operationId !== 12 && item.operationId !== 7)
      );
    });
    fetchMainCurrency().then((res) => {
      setMainCurrency(res);
    });
  }, []);

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

  const renderScene = ({ route }) => {
    switch (route.key) {
      case "first":
        return (
          <FirstRoute
            navigation={navigation}
            BUSINESS_TKN_UNIT={BUSINESS_TKN_UNIT}
            profile={profile}
            allBusinessUnits={allBusinessUnits}
            statusData={statusData}
            permissionsByKeyValue={permissionsByKeyValue}
            tableSettings={tableSettings}
            setTableSettings={setTableSettings}
            tenant={tenant}
            permissions={permissions}
          />
        );
      case "second":
        return (
          <SecondRoute
            navigation={navigation}
            ptofile={profile}
            tenant={tenant}
            BUSINESS_TKN_UNIT={BUSINESS_TKN_UNIT}
            allBusinessUnits={allBusinessUnits}
            permissionsByKeyValue={permissionsByKeyValue}
            mainCurrency={mainCurrency}
            tableSettings={tableSettings}
            setTableSettings={setTableSettings}
            permissions={permissions}
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
    </SafeAreaView>
  );
};
const styles = StyleSheet.create({
  tabbar: {
    backgroundColor: "#37B874",
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
  rowSection: { flexDirection: "row", borderWidth: 1, borderColor: "#eeeeee" },
  head: { height: 44, backgroundColor: "#55ab80" },
  headText: {
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
    color: "white",
  },
  text: { margin: 6, fontSize: 14, textAlign: "center" },
  buttonStyle: {
    borderWidth: 1,
    borderColor: "#55ab80",
    borderRadius: 5,
    paddingLeft: 12,
    paddingRight: 12,
    marginLeft: 14,
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
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)", // Semi-transparent background for focus effect
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "white",
    padding: 10,
    borderRadius: 10,
  },
  viewModalHeading: {
    fontWeight: "bold",
    marginBottom: 15,
  },
  modalContent: {
    gap: 18,
    alignItems: "center",
    flexDirection: "row",
    position: "relative",
  },
  deleteModalTitle: {
    fontSize: 19,
    fontWeight: "bolder",
    color: "black",
  },
  button: {
    position: "absolute",
    borderRadius: 20,
    padding: 10,
    right: 0,
  },
});
export default Modul;
