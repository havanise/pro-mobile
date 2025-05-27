import React, { useMemo, useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  useWindowDimensions,
  ScrollView,
  StyleSheet,
  Modal,
  Pressable,
  TouchableOpacity,
} from "react-native";
import moment from "moment";
import CheckBox from "expo-checkbox";
import { TenantContext } from "../../context";
import { find, isNil, filter, uniqBy, isEmpty, map } from "lodash";
import { AntDesign } from "@expo/vector-icons";
import {
  ProAsyncSelect,
  ProText,
  ProButton,
  ProFormInput,
  SettingModal,
} from "../../components";
import { useForm } from "react-hook-form";
import { Table, Row } from "react-native-reanimated-table";
import { fetchSalesInvoiceList, fetchSalesInvoicesCount } from "../../api";
import {
  defaultNumberFormat,
  formatNumberToLocale,
  roundToDown,
  roundTo,
  fullDateTimeWithSecond,
  customRound,
} from "../../utils";
import { createSettings, getBusinessUnit } from "../../api/operation-panel";
import { RadioButton } from "react-native-paper";
import AddInvoiceFilterModal from "./AddInvoiceFilterModal";
import { getPaymentStatus } from "../Modul";
import Pagination from "@cherry-soft/react-native-basic-pagination";
import { Add_Multiple_Inv_Modal_Table_Data } from "../../utils/table-config/financeModule";
import SaleDetail from "../Modul/SaleDetail";

const math = require("exact-math");
const BigNumber = require("bignumber.js");

const tableData = {
  tableHead: [
    "",
    "No",
    "Tarix",
    "Biznes blok",
    "Müqavilə",
    "Qaimə",
    "Qalıq borc",
    "Ödəniləcək məbləğ",
    "Ödəniş statusu",
    "İcra statusu",
    "Əlavə məlumat",
  ],
  widthArr: [50, 50, 140, 100, 100, 100, 120, 140, 100, 100, 100],
  tableData: [],
};

const getTableInvoiceList = (
  invoices,
  type,
  edit,
  operationsList,
  isVat,
  counterparty,
  vatChecked = 1,
  allInvoice
) => {
  const tableInvoices = allInvoice?.flatMap((invoice) => {
    const currentInvoice = invoices.filter((inv) => inv.id === invoice.id);

    // If exactly two invoices match, return them as a flat array
    if (currentInvoice.length === 2) {
      return currentInvoice;
    }
    // Otherwise, return the first (or only) matching invoice as an array
    return currentInvoice.length ? [currentInvoice[0]] : [];
  });

  const invoicesWithVat =
    tableInvoices?.length > 0 || edit
      ? [
          edit &&
          operationsList.length > 0 &&
          operationsList[0].contactId === counterparty &&
          (!tableInvoices
            .filter(
              ({ id, isTax }) =>
                id === Number(operationsList[0].invoiceId) && isVat === isTax
            )
            .map(({ id }) => id)
            .includes(Number(operationsList?.[0]?.invoiceId)) ||
            (operationsList[0].transactionType === 10 &&
              tableInvoices.filter(
                ({ id, isTax }) =>
                  id === Number(operationsList[0].invoiceId) && isTax
              ).length === 0))
            ? {
                id: operationsList[0].invoiceId,
                invoiceType: operationsList[0].invoiceType,
                invoiceNumber: operationsList[0].invoiceNumber,
                remainingInvoiceDebt: 0,
                remainingInvoiceDebtWithCredit: 0,
                debtAmount: 0,
                currencyCode: operationsList[0].invoiceCurrencyCode,
                currencyId: operationsList[0].invoiceCurrencyId,
                fromEdit: true,
                isTax: operationsList[0].transactionType === 10,
              }
            : {},
          ...tableInvoices,
        ]
          .filter((invoice) =>
            type === 1
              ? invoice.invoiceType === 2 ||
                invoice.invoiceType === 4 ||
                invoice.invoiceType === 13
              : invoice.invoiceType === 1 ||
                invoice.invoiceType === 3 ||
                invoice.invoiceType === 10 ||
                invoice.invoiceType === 12
          )
          .map((currentInvoice) => {
            if (currentInvoice.isTax && vatChecked !== 3) {
              return {
                ...currentInvoice,
                id: `${currentInvoice.id}-vat`,
                invoiceNumber: `${currentInvoice.invoiceNumber}(VAT)`,
                debtAmount: Number(currentInvoice.remainingInvoiceDebt),
                isTax: true,
              };
            }
            return {
              ...currentInvoice,
              debtAmount: Number(currentInvoice.remainingInvoiceDebt),
            };
          })
          .map((currentInvoice) => {
            if (vatChecked === 3) {
              const foundInvoice = find(
                allInvoice,
                (invoice) => invoice?.id === currentInvoice?.id
              );

              if (
                Number(foundInvoice?.taxAmount ?? 0) > 0 &&
                math.sub(
                  Number(foundInvoice?.taxAmount ?? 0),
                  Number(foundInvoice?.paidTaxAmount ?? 0)
                ) > 0
              ) {
                const debtAmount = math.sub(
                  Number(foundInvoice.endPriceCache ?? 0),
                  Number(foundInvoice.paidAmount ?? 0)
                );
                return {
                  ...currentInvoice,
                  vatId: `${currentInvoice?.id}-vat`,
                  invoiceVatNumber: `${currentInvoice?.invoiceNumber}(VAT)`,
                  remainingInvoiceDebtWithCredit: math.sub(
                    Number(foundInvoice.endPriceCache ?? 0),
                    Number(foundInvoice.paidAmount ?? 0)
                  ),
                  remainingInvoiceVatDebtWithCredit: math.sub(
                    Number(foundInvoice.taxAmount ?? 0),
                    Number(foundInvoice.paidTaxAmount ?? 0)
                  ),
                  isInvoiceAmountPaid: debtAmount === 0,
                  debtAmount,
                  debtVatAmount: math.sub(
                    Number(foundInvoice.taxAmount ?? 0),
                    Number(foundInvoice.paidTaxAmount ?? 0)
                  ),
                  isTax: false,
                };
              }
              return currentInvoice;
            }
            return currentInvoice;
          })
      : [];
  return vatChecked === 3 ? uniqBy(invoicesWithVat, "id") : invoicesWithVat;
};

const AddInvoice = ({
  isVisible,
  setIsVisible,
  allInvoice,
  setAllInvoice,
  setCheckList,
  selectedInvoices,
  counterparty,
  type,
  editId,
  invoices,
  payOrderedValue,
  operationsList,
  paymentAmount,
  checkList,
  setPayOrderedValue,
  currencies,
  setUseAdvance,
  setPaymentAmountWithoutRound,
  setInvoiceData,
  setInvoicesAddedFromModal,
  setSelectedInvoices,
  invoiceData,
  setFieldsValue,
}) => {
  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    getValues,
    setValue: setModalFieldsValue,
    watch,
  } = useForm({});

  const [invoice, setInvoice] = useState([]);
  const [allBusinessUnits, setAllBusinessUnits] = useState([]);
  const [payOrdered, setPayOrdered] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);
  const [payOrderedForEdit, setPayOrderedForEdit] = useState(false);
  const [payCurrencyForEdit, setPayCurrencyForEdit] = useState(false);
  const [paymentForEdit, setPaymentForEdit] = useState(false);
  const [vatChecked, setVatChecked] = useState(1);
  const [radioButtonHandled, setRadioButtonHandled] = useState(false);
  const [firstRender, setFirstRender] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [filterVisible, setFilterVisible] = useState(false);
  const [invoicesCount, setInvoicesCount] = useState(0);
  const [settingVisible, setSettingVisible] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedRow, setSelectedRow] = useState({});
  const [tableSettingData, setTableSettingData] = useState(
    Add_Multiple_Inv_Modal_Table_Data
  );
  const [invoiceFilters, setInvoiceFilters] = useState({
    invoices: [],
    businessUnitIds: [],
    description: "",
    sort: "",
    orderBy: "",
  });
  const [statusData, setStatusData] = useState([]);
  const [data, setData] = useState(tableData);
  const remainingRef = React.useRef([]);

  const {
    profile,
    BUSINESS_TKN_UNIT,
    userSettings,
    setTableSettings,
    tableSettings,
    permissionsByKeyValue,
  } = useContext(TenantContext);

  const addInvoiceItems = (item) => [
    {
      ...item,
      // mustVatPay: 0,
      remainingInvoiceVatDebt: 0,
      remainingVatDebtAmountInMainCurrency: 0,
      remainingInvoiceVatDebtWithCredit: 0,
      debtVatAmount: 0,
      invoiceVatDebtAmount: 0,
      invoiceVatDebtAmountWithCredit: 0,
      isTax: false,
    },
    {
      ...item,
      id: item.vatId,
      mustPay: 0,
      remainingInvoiceDebt: 0,
      remainingDebtAmountInMainCurrency: 0,
      remainingInvoiceDebtWithCredit: 0,
      debtAmount: 0,
      invoiceDebtAmount: 0,
      invoiceDebtAmountWithCredit: 0,
      isTax: true,
    },
  ];

  const handleCheckboxes = (row, checked) => {
    if (checked) {
      const collection = invoice;
      setCheckList((prevState) => ({
        checkedListAll: filter(
          vatChecked === 3
            ? [...prevState.checkedListAll, ...addInvoiceItems(row)]
            : [...prevState.checkedListAll, row],
          Boolean
        ),
        ItemsChecked:
          collection.length ===
          uniqBy(prevState.checkedListAll, (item) => item?.invoiceNumber)
            .length +
            1,
      }));
    } else {
      setCheckList((prevState) => ({
        checkedListAll: prevState.checkedListAll?.filter((item) =>
          vatChecked !== 3 ? item?.id !== row.id : item?.vatId !== row.vatId
        ),
        ItemsChecked: false,
      }));
    }
  };

  const handlePriceChange = (productId, newPrice, limit = 100000000, type) => {
    const re = /^[0-9]{1,9}\.?[0-9]{0,2}$/;
    if (
      (re.test(Number(newPrice)) && Number(newPrice) <= Number(limit)) ||
      newPrice === ""
    ) {
      const newInvoices = invoice?.map((item) => {
        if (item.id === productId) {
          return {
            ...item,
            ...(type !== "vat"
              ? {
                  mustPay: newPrice,
                }
              : {
                  mustVatPay: newPrice,
                }),
          };
        }
        return item;
      });
      const newCheckList = checkList.checkedListAll?.map((item) => {
        if (item.id === productId) {
          return {
            ...item,
            ...(type !== "vat"
              ? {
                  mustPay: newPrice,
                }
              : {
                  mustVatPay: newPrice,
                }),
          };
        }
        if (item.id === productId + "-vat" && type === "vat") {
          return {
            ...item,
            ...{ mustVatPay: 0 },
          };
        }
        return item;
      });
      setCheckList((prevState) => ({
        ...prevState,
        checkedListAll: newCheckList,
      }));

      setInvoice(newInvoices);
    }
  };

  const handleSaveSettingModal = (column) => {
    const tableColumn = column
      .filter((col) => col.visible === true)
      .map((col) => col.dataIndex);
    const filterColumn = column.filter((col) => col.dataIndex !== "id");
    const filterColumnData = JSON.stringify(filterColumn);

    createSettings({
      moduleName: "Finance_Add-Multi-Invoices_Mobile",
      columnsOrder: filterColumnData,
    }).then((res) => {
      const newTableSettings = {
        ...userSettings,
        [`Finance_Add-Multi-Invoices_Mobile`]: {
          columnsOrder: filterColumnData,
        },
      };
      setTableSettings(newTableSettings);
    });

    setVisibleColumns(tableColumn);
    setTableSettingData(column);

    setSettingVisible(false);
  };

  useEffect(() => {
    const columnsConfig =
      tableSettings?.["Finance_Add-Multi-Invoices_Mobile"]?.columnsOrder;
    if (columnsConfig?.length > 0 && columnsConfig !== null) {
      const parseData = JSON.parse(columnsConfig);
      const columns = parseData
        .filter((column) => column.visible === true)
        .map((column) => column.dataIndex);
      setVisibleColumns(columns);
      setTableSettingData(parseData);
    } else if (columnsConfig == null) {
      const column = Add_Multiple_Inv_Modal_Table_Data.filter(
        (column) => column.visible === true
      ).map((column) => column.dataIndex);
      setVisibleColumns(column);
      setTableSettingData(Add_Multiple_Inv_Modal_Table_Data);
    }
  }, [tableSettings]);

  useEffect(() => {
    const columns = [];
    let column = visibleColumns;
    let filteredData = invoice?.filter((item) => item?.invoiceType !== 10);
    if (visibleColumns !== undefined && invoice) {
      setData({
        tableHead: [
          "",
          "No",
          ...visibleColumns.map((item) => {
            return Add_Multiple_Inv_Modal_Table_Data.find(
              (i) => i.dataIndex === item
            ).name;
          }),
        ],
        widthArr: [
          70,
          70,
          ...visibleColumns.map((el) => {
            return 140;
          }),
        ],

        tableData: filteredData?.map((item, index) => {
          columns[column.indexOf("operationDate")] = (
            <Text>{item.operationDate}</Text>
          );
          columns[column.indexOf("business_unit_name")] = (
            <View>
              {item.business_unit_name ? (
                <Text>{item.business_unit_name}</Text>
              ) : (
                <Text>{allBusinessUnits[0]?.name || "-"}</Text>
              )}
            </View>
          );
          columns[column.indexOf("contract_serial_number")] = (
            <Text>{item.contract_serial_number}</Text>
          );
          columns[column.indexOf("invoiceNumber")] = (
            <Text>{item.invoiceNumber}</Text>
          );
          columns[column.indexOf("remainingInvoiceDebtWithCredit")] = (
            <Text>
              {formatNumberToLocale(
                defaultNumberFormat(item.remainingInvoiceDebtWithCredit)
              )}
            </Text>
          );
          columns[column.indexOf("mustPay")] = (
            <View>
              <TextInput
                value={item.mustPay ? `${item.mustPay}` : undefined}
                keyboardType="numeric"
                onChangeText={(event) => {
                  handlePriceChange(
                    id,
                    event,
                    item.remainingInvoiceDebtWithCredit,
                    null
                  );
                }}
                editable={!payOrdered}
                style={
                  !payOrdered
                    ? {
                        margin: 10,
                        padding: 5,
                        borderWidth: 1,
                        borderRadius: 5,
                        borderColor: "#D0DBEA",
                      }
                    : {
                        margin: 10,
                        padding: 5,
                        borderWidth: 1,
                        borderRadius: 5,
                        borderColor: "#D0DBEA",
                        backgroundColor: "#ececec",
                      }
                }
              />
            </View>
          );
          columns[column.indexOf("paymentStatus")] = getPaymentStatus(
            item.paymentStatus
          );
          columns[column.indexOf("statusName")] = (
            <Text>{item.statusName}</Text>
          );

          columns[column.indexOf("description")] = (
            <Text>{item.description}</Text>
          );

          columns[column.indexOf("actions")] = (
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => {
                setSelectedRow(filteredData[index]);
                setShowModal(true);
              }}
              onLongPress={() => {
                setSelectedRow(filteredData[index]);
                setShowModal(true);
              }}
            >
              <AntDesign
                name="eyeo"
                size={24}
                color="black"
                style={{ padding: 5 }}
              />
            </TouchableOpacity>
          );
          return [
            <CheckBox
              disabled={
                (checkList.checkedListAll.length > 0 &&
                  checkList.checkedListAll[0]?.currencyId !==
                    item.currencyId) ||
                payOrdered
              }
              onValueChange={(event) => {
                handleCheckboxes(filteredData[index], event);
              }}
              value={
                !isEmpty(
                  find(checkList.checkedListAll, (it) => it?.id == item.id)
                )
              }
            />,
            <Text>{(currentPage - 1) * pageSize + index + 1}</Text>,
            ...columns,
          ];
        }),
      });
    }
  }, [visibleColumns, allBusinessUnits, payOrdered, invoice, checkList]);

  useEffect(() => {
    getBusinessUnit({}).then((res) => {
      setAllBusinessUnits(res);
    });
    // fetchStatusOperations({}).then((res) => {
    //   setStatusData(
    //     res.filter((item) => item.operationId !== 12 && item.operationId !== 7)
    //   );
    // });
  }, []);

  useEffect(() => {
    if (getValues("payment") !== undefined && getValues("payment") !== false) {
      remainingRef.current = getValues("payment");

      const selectedMustPaySum = invoice?.reduce(
        (total, { remainingInvoiceDebtWithCredit }) =>
          math.add(total, Number(remainingInvoiceDebtWithCredit) || 0),
        0
      );

      const difference = math.sub(
        Number(payOrderedValue ?? 0),
        selectedMustPaySum
      );
      const newInv = invoice.map((inv, index) => {
        const lastInvoiceIndex = invoice?.length - 1;
        if (difference > 0 && payOrdered && index === lastInvoiceIndex) {
          const lastmustPay = math.add(
            inv.remainingInvoiceDebtWithCredit,
            difference
          );
          return {
            ...inv,
            mustPay: roundToDown(Number(lastmustPay), 2),
          };
        }
        if (
          Number(remainingRef.current || 0) >=
          Number(inv.remainingInvoiceDebtWithCredit || 0)
        ) {
          const sub = math.sub(
            Number(remainingRef.current),
            roundToDown(Number(inv.remainingInvoiceDebtWithCredit), 2)
          );

          remainingRef.current = sub;
          if (vatChecked === 3) {
            if (Number(inv.remainingInvoiceVatDebtWithCredit || 0) >= sub) {
              remainingRef.current = 0;
              return {
                ...inv,
                mustPay: roundToDown(
                  Number(inv.remainingInvoiceDebtWithCredit),
                  2
                ),
                mustVatPay: roundToDown(Number(sub), 2),
              };
            } else {
              remainingRef.current = math.sub(
                sub,
                Number(inv.remainingInvoiceVatDebtWithCredit)
              );
              return {
                ...inv,
                mustPay: roundToDown(
                  Number(inv.remainingInvoiceDebtWithCredit),
                  2
                ),
                mustVatPay: roundToDown(
                  Number(inv.remainingInvoiceVatDebtWithCredit),
                  2
                ),
              };
            }
          }
          return {
            ...inv,
            mustPay: roundToDown(Number(inv.remainingInvoiceDebtWithCredit), 2),
          };
        }
        if (
          Number(remainingRef.current) <
          Number(inv.remainingInvoiceDebtWithCredit)
        ) {
          const itemQuantity = Number(remainingRef.current);
          remainingRef.current = 0;
          return {
            ...inv,
            mustPay: itemQuantity,
            ...(vatChecked === 3 && {
              mustVatPay: 0,
            }),
          };
        }
      });
      setInvoice(newInv);

      setCheckList({
        checkedListAll: newInv
          .reduce((acc, curr) => {
            if (curr.vatId && vatChecked === 3) {
              acc.push(...addInvoiceItems(curr));
            } else {
              acc.push(curr);
            }
            return acc; // Always return the accumulator
          }, [])
          .filter((item) =>
            vatChecked == 3
              ? Number(item?.mustPay) > 0 || Number(item?.mustVatPay) > 0
              : Number(item?.mustPay) > 0
          ),
        ItemsChecked:
          newInv.filter((item) =>
            vatChecked == 3
              ? Number(item?.mustPay) > 0 || Number(item?.mustVatPay) > 0
              : Number(item?.mustPay) > 0
          )?.length === newInv.length,
      });
    }
  }, [getValues("payment")]);

  useEffect(() => {
    if (isVisible && !isNil(vatChecked)) {
      setFirstRender(false);
      remainingRef.current = getValues("payment") ? getValues("payment") : 0;
      const selectedMustPaySum = invoice?.reduce(
        (total, { remainingInvoiceDebtWithCredit }) =>
          math.add(total, Number(remainingInvoiceDebtWithCredit) || 0),
        0
      );
      const difference = math.sub(
        Number(payOrderedValue ?? 0),
        selectedMustPaySum
      );

      const curr = payCurrencyForEdit || getValues("currency");
      const invoiceList = filter(
        curr
          ? invoices.filter(({ currencyId }) => currencyId === curr)
          : invoices,
        (currentInvoice) =>
          find(allInvoice, (invoice) => invoice?.id === currentInvoice?.id)
      );

      const newInv =
        vatChecked === 2
          ? payOrdered
            ? getTableInvoiceList(
                invoiceList,
                type,
                editId,
                operationsList,
                false,
                null,
                vatChecked,
                allInvoice
              )
                .filter(
                  (invoice) =>
                    (Number(invoice.debtAmount) ||
                      Number(invoice.debtVatAmount) ||
                      invoice.fromEdit) &&
                    invoice.isTax
                )
                .sort((a, b) => {
                  const dateA = new Date(
                    moment(a.operationDate, fullDateTimeWithSecond).format(
                      "MM-DD-YYYY HH:mm:ss"
                    )
                  ).getTime();
                  const dateB = new Date(
                    moment(b.operationDate, fullDateTimeWithSecond).format(
                      "MM-DD-YYYY HH:mm:ss"
                    )
                  ).getTime();
                  if (dateA < dateB) {
                    return -1;
                  }
                  if (dateA > dateB) {
                    return 1;
                  }
                  return 0;
                })
                .map((inv, index) => {
                  const lastInvoiceIndex = invoice?.length - 1;
                  if (
                    difference > 0 &&
                    payOrdered &&
                    index === lastInvoiceIndex
                  ) {
                    const lastmustPay = math.add(
                      inv.remainingInvoiceDebtWithCredit,
                      difference
                    );
                    return {
                      ...inv,
                      mustPay: roundToDown(Number(lastmustPay), 2),
                    };
                  }
                  if (
                    Number(remainingRef.current || 0) >=
                    Number(inv.remainingInvoiceDebtWithCredit)
                  ) {
                    const sub = math.sub(
                      Number(remainingRef.current),
                      roundToDown(Number(inv.remainingInvoiceDebtWithCredit), 2)
                    );
                    remainingRef.current = sub;
                    return {
                      ...inv,
                      mustPay: roundToDown(
                        Number(inv.remainingInvoiceDebtWithCredit),
                        2
                      ),
                    };
                  }
                  if (
                    Number(remainingRef.current) <
                    Number(inv.remainingInvoiceDebtWithCredit)
                  ) {
                    const itemQuantity = Number(remainingRef.current);
                    remainingRef.current = 0;
                    return {
                      ...inv,
                      mustPay: itemQuantity,
                    };
                  }
                })
            : getTableInvoiceList(
                invoiceList,
                type,
                editId,
                operationsList,
                false,
                null,
                vatChecked,
                allInvoice
              )
                .filter(
                  (invoice) =>
                    (Number(invoice.debtAmount) ||
                      Number(invoice.debtVatAmount) ||
                      invoice.fromEdit) &&
                    invoice.isTax
                )
                .map((item) => ({
                  ...item,
                  mustPay:
                    firstRender &&
                    selectedInvoices
                      .map((selectedInvoice) => selectedInvoice?.id)
                      .includes(item.id)
                      ? selectedInvoices.find(
                          (selectedInvoice) => selectedInvoice?.id === item.id
                        )?.mustPay
                      : selectedInvoices?.length === 1 &&
                        item.id === selectedInvoices?.[0]?.id
                      ? item.currencyId === selectedInvoices?.[0]?.currencyId
                        ? Number(paymentAmount) ===
                          customRound(
                            selectedInvoices?.[0]
                              ?.remainingInvoiceDebtWithCredit,
                            1,
                            2
                          )
                          ? roundToDown(
                              Number(
                                selectedInvoices?.[0]
                                  ?.remainingInvoiceDebtWithCredit
                              ),
                              2
                            )
                          : roundTo(
                              math.mul(
                                Number(invoiceData.rate || 1),
                                Number(paymentAmount || 0)
                              ),
                              2
                            )
                        : Number(paymentAmount)
                      : roundToDown(
                          Number(item.remainingInvoiceDebtWithCredit),
                          2
                        ),
                }))
          : payOrdered
          ? getTableInvoiceList(
              invoiceList,
              type,
              editId,
              operationsList,
              false,
              null,
              vatChecked,
              allInvoice
            )
              .filter(
                (invoice) =>
                  (Number(invoice.debtAmount) ||
                    Number(invoice.debtVatAmount) ||
                    invoice.fromEdit) &&
                  !invoice.isTax
              )
              .sort((a, b) => {
                const dateA = new Date(
                  moment(a.operationDate, fullDateTimeWithSecond).format(
                    "MM-DD-YYYY HH:mm:ss"
                  )
                ).getTime();
                const dateB = new Date(
                  moment(b.operationDate, fullDateTimeWithSecond).format(
                    "MM-DD-YYYY HH:mm:ss"
                  )
                ).getTime();
                if (dateA < dateB) {
                  return -1;
                }
                if (dateA > dateB) {
                  return 1;
                }
                return 0;
              })
              .map((inv, index) => {
                const lastInvoiceIndex = invoice?.length - 1;
                if (
                  difference > 0 &&
                  payOrdered &&
                  index === lastInvoiceIndex
                ) {
                  const lastmustPay = math.add(
                    inv.remainingInvoiceDebtWithCredit,
                    difference
                  );

                  return {
                    ...inv,
                    mustPay: roundToDown(Number(lastmustPay), 2),
                    mustVatPay:
                      vatChecked === 3
                        ? roundToDown(
                            math.add(
                              inv?.remainingInvoiceVatDebtWithCredit,
                              difference
                            ),
                            2
                          )
                        : null,
                  };
                }
                if (
                  Number(remainingRef.current || 0) >=
                  Number(inv.remainingInvoiceDebtWithCredit)
                ) {
                  const sub = math.sub(
                    Number(remainingRef.current),
                    roundToDown(Number(inv.remainingInvoiceDebtWithCredit), 2)
                  );

                  remainingRef.current = sub;
                  if (vatChecked === 3) {
                    if (
                      Number(inv.remainingInvoiceVatDebtWithCredit || 0) >= sub
                    ) {
                      remainingRef.current = 0;
                      return {
                        ...inv,
                        mustPay: roundToDown(
                          Number(inv.remainingInvoiceDebtWithCredit),
                          2
                        ),
                        mustVatPay: roundToDown(Number(sub), 2),
                      };
                    } else {
                      remainingRef.current = math.sub(
                        sub,
                        Number(inv.remainingInvoiceVatDebtWithCredit)
                      );
                      return {
                        ...inv,
                        mustPay: roundToDown(
                          Number(inv.remainingInvoiceDebtWithCredit),
                          2
                        ),
                        mustVatPay: roundToDown(
                          Number(inv.remainingInvoiceVatDebtWithCredit),
                          2
                        ),
                      };
                    }
                  }
                  return {
                    ...inv,
                    mustPay: roundToDown(
                      Number(inv.remainingInvoiceDebtWithCredit),
                      2
                    ),
                  };
                }
                if (
                  Number(remainingRef.current) <
                  Number(inv.remainingInvoiceDebtWithCredit)
                ) {
                  const itemQuantity = Number(remainingRef.current);

                  remainingRef.current = 0;
                  return {
                    ...inv,
                    mustPay: itemQuantity,
                  };
                }
              })
          : getTableInvoiceList(
              invoiceList,
              type,
              editId,
              operationsList,
              false,
              null,
              vatChecked,
              allInvoice
            )
              .filter(
                (invoice) =>
                  (Number(invoice.debtAmount) ||
                    Number(invoice.debtVatAmount) ||
                    invoice.fromEdit) &&
                  !invoice.isTax
              )
              .map((item) => ({
                ...item,
                mustPay: payOrdered
                  ? 0
                  : firstRender &&
                    selectedInvoices?.length > 1 &&
                    selectedInvoices
                      .map((selectedInvoice) => selectedInvoice?.id)
                      .includes(item.id)
                  ? selectedInvoices.find(
                      (selectedInvoice) => selectedInvoice?.id === item.id
                    )?.mustPay
                  : selectedInvoices?.length === 1 &&
                    item.id === selectedInvoices?.[0].id
                  ? item.currencyId === selectedInvoices?.[0]?.currencyId
                    ? Number(paymentAmount) ===
                      customRound(
                        selectedInvoices?.[0]?.remainingInvoiceDebtWithCredit,
                        1,
                        2
                      )
                      ? roundToDown(
                          Number(
                            selectedInvoices?.[0]
                              ?.remainingInvoiceDebtWithCredit
                          ),
                          2
                        )
                      : roundTo(
                          math.mul(
                            Number(invoiceData.rate || 1),
                            Number(paymentAmount || 0)
                          ),
                          2
                        )
                    : Number(paymentAmount)
                  : roundToDown(Number(item.remainingInvoiceDebtWithCredit), 2),
                mustVatPay: payOrdered
                  ? 0
                  : firstRender &&
                    selectedInvoices
                      .map((selectedInvoice) => selectedInvoice?.id)
                      .includes(item.id)
                  ? selectedInvoices.find(
                      (selectedInvoice) => selectedInvoice?.id === item.id
                    )?.mustVatPay
                  : selectedInvoices?.length === 1 &&
                    item.id === selectedInvoices?.[0].id
                  ? roundToDown(
                      Number(
                        selectedInvoices?.[0]?.remainingInvoiceVatDebtWithCredit
                      ),
                      2
                    )
                  : roundToDown(
                      Number(item.remainingInvoiceVatDebtWithCredit),
                      2
                    ),
                satusName: item?.statusName,
                paymentStatus: item?.paymentStatus,
              }));
      const currentInvoices = map(newInv, (inv) => {
        const curr = filter(checkList.checkedListAll, (selectedInv) =>
          vatChecked === 3
            ? selectedInv.vatId === inv.vatId || selectedInv.id === inv.id
            : selectedInv.id === inv.id
        );
        if (!isEmpty(curr) && curr.length === 1) {
          return curr[0];
        }
        if (curr.length === 2) {
          return {
            ...curr[0],
            id: curr[0].id,
            vatId: curr[1]?.vatId,
            mustVatPay: curr[1].mustVatPay,
            remainingInvoiceVatDebt: curr[1]?.remainingInvoiceVatDebt,
            remainingVatDebtAmountInMainCurrency:
              curr[1]?.remainingVatDebtAmountInMainCurrency,
            remainingInvoiceVatDebtWithCredit:
              curr[1]?.remainingInvoiceVatDebtWithCredit,
            debtVatAmount: curr[1]?.debtVatAmount,
            invoiceVatDebtAmount: curr[1]?.invoiceVatDebtAmount,
            invoiceVatDebtAmountWithCredit:
              curr[1]?.invoiceVatDebtAmountWithCredit,
            isTax: true,
          };
        }
        return inv;
      });
      setInvoice(currentInvoices);
    } else {
      setFirstRender(true);
    }
  }, [
    editId,
    invoices,
    operationsList,
    type,
    vatChecked,
    isVisible,
    allInvoice,
    selectedInvoices,
    paymentAmount,
    payOrdered,
    getValues("currency"),
  ]);

  useEffect(() => {
    if (radioButtonHandled) {
      if (counterparty && isVisible === true) {
        setTableLoading(true);

        let order;
        const config = userSettings?.dateSortingConfig;
        if (config) order = JSON.parse(config).orderConfig;

        const hasDebt = [1, 3].includes(vatChecked) ? 1 : undefined;
        const hasTaxDebt = [2, 3].includes(vatChecked) ? 1 : undefined;
        const filters = {
          contacts: [counterparty],
          invoiceTypes: type === 1 ? [2, 4, 13] : [1, 3, 12],
          // paymentStatuses: [1, 2],
          isDeleted: 0,
          limit: pageSize,
          hasDebt,
          hasTaxDebt,
          page: 1,
          fromPayment: 1,
          sort: order ? order : undefined,
          orderBy: order ? "operationDate" : undefined,
        };

        fetchSalesInvoiceList({
          filter: filters,
        }).then((productData) => {
          setAllInvoice(productData);
          setTableLoading(false);
        });
        fetchSalesInvoicesCount({
          filter: filters,
        }).then((productData) => {
          setInvoicesCount(productData);
        });
      } else {
        setInvoice([]);
      }
    }
  }, [counterparty, editId, type, isVisible, radioButtonHandled, userSettings]);

  useEffect(() => {
    if (isVisible) {
      setPayOrdered(payOrderedForEdit);
      setModalFieldsValue("currency", payCurrencyForEdit);
      setModalFieldsValue("payment", paymentForEdit);
      if (selectedInvoices.length > 0) {
        setCheckList({
          checkedListAll: selectedInvoices,
          ItemsChecked:
            selectedInvoices.length ===
            invoice?.filter(
              (item) => item.currencyId === selectedInvoices?.[0]?.currencyId
            ).length,
        });
        setVatChecked(selectedInvoices[0]?.isTax ? 2 : vatChecked ?? 1);
        setRadioButtonHandled(true);
      } else {
        setCheckList({
          checkedListAll: [],
          ItemsChecked: false,
        });
        setVatChecked(1);
        setRadioButtonHandled(true);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedInvoices, isVisible, setCheckList]);

  const filterDuplicates = (invoicesByProduct, field = "id") => {
    const data = [];
    return invoicesByProduct?.reduce((total, current) => {
      const value = current[field];

      if (data.includes(value)) {
        return total;
      }
      data.push(value);
      return [...total, current];
    }, []);
  };

  const handleFilters = (filters) => {
    setInvoiceFilters({ ...invoiceFilters, ...filters });

    handlePaginationChange(1, vatChecked, {
      ...invoiceFilters,
      ...filters,
    });
  };

  const handlePaginationChange = (value, checkType, invFilters, size) => {
    setTableLoading(true);
    let order;
    const config = userSettings?.dateSortingConfig;
    if (config) order = JSON.parse(config).orderConfig;

    const hasDebt = [1, 3].includes(checkType) ? 1 : undefined;
    const hasTaxDebt = [2, 3].includes(checkType) ? 1 : undefined;
    const filters = {
      contacts: [counterparty],
      invoiceTypes: type === 1 ? [2, 4, 13] : [1, 3, 12],
      // paymentStatuses: [1, 2],
      isDeleted: 0,
      limit: size ?? pageSize,
      page: value,
      hasDebt,
      hasTaxDebt,
      invoices: !isNil(invFilters)
        ? invFilters.invoices
        : invoiceFilters.invoices,
      description: !isNil(invFilters)
        ? invFilters.description
        : invoiceFilters.description,
      fromPayment: 1,
      sort: order ? order : undefined,
      orderBy: order ? "operationDate" : undefined,
    };

    fetchSalesInvoiceList({
      filter: filters,
    }).then((productData) => {
      setAllInvoice(productData);
      setTableLoading(false);
    });

    if (value === 1) {
      fetchSalesInvoicesCount({
        filter: filters,
      }).then((productData) => {
        setInvoicesCount(productData);
      });
    }
    return (() => setCurrentPage(value))();
  };

  const handlePageSizeChange = (_, size, check) => {
    setPageSize(size);
    handlePaginationChange(1, check, invoiceFilters, size);
  };

  const onSubmit = (values) => {
    if (checkList.checkedListAll.length > 1) {
      setUseAdvance(false);
    }
    if (
      !map(checkList.checkedListAll, (item) => item?.id)?.includes(
        invoiceData?.invoice?.id
      )
    ) {
      setPaymentAmountWithoutRound(undefined);
      setInvoiceData((prevData) => ({
        ...prevData,
        invoice: undefined,
      }));
      setFieldsValue("invoice", undefined);
      setFieldsValue("paymentAmount", undefined);
    }
    setInvoiceData((prevData) => ({
      ...prevData,
      invoice:
        vatChecked !== 3
          ? {
              ...checkList.checkedListAll[0],
              id: checkList.checkedListAll[0]?.id,
              debtAmount:
                checkList.checkedListAll[0]?.remainingInvoiceDebtWithCredit,
              debtVatAmount:
                checkList.checkedListAll[0]?.remainingInvoiceVatDebtWithCredit,
            }
          : {},
      currency: currencies?.find(
        ({ id }) => id === checkList.checkedListAll?.[0]?.currencyId
      ),
    }));
    setFieldsValue("currency", checkList.checkedListAll?.[0]?.currencyId);
    setFieldsValue("invoice", undefined)
    setInvoicesAddedFromModal(true);
    setSelectedInvoices(checkList.checkedListAll);
    setPayCurrencyForEdit(values.currency);
    setPaymentForEdit(values.payment);
    setPayOrderedForEdit(payOrdered);
    setIsVisible(false);
    setCurrentPage(1);
  };

  return (
    <>
      {showModal ? (
        <SaleDetail
          isVisible={showModal}
          handleModal={(isSubmit = false) => {
            if (isSubmit) {
              console.log("ok");
            }

            setShowModal(false);
          }}
          row={selectedRow}
          allBusinessUnits={allBusinessUnits}
          profile={profile}
        />
      ) : null}
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
          AllStandartColumns={Add_Multiple_Inv_Modal_Table_Data}
        />
      </Modal>
      <AddInvoiceFilterModal
        isVisible={filterVisible}
        setIsVisible={setFilterVisible}
        handleFilters={handleFilters}
        invoice={invoice}
        allBusinessUnits={allBusinessUnits}
        filterDuplicates={filterDuplicates}
        // setFilter={setFilter}
        filter={invoiceFilters}
      />
      <Modal
        animationType="slide"
        transparent={true}
        visible={isVisible}
        onRequestClose={() => {
          setIsVisible(false);
        }}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <ProText variant="heading" style={{ color: "black" }}>
              {allInvoice.find(({ id }) => id === invoice?.[0]?.id)
                ?.counterparty || allInvoice?.[0]?.counterparty}
            </ProText>

            <RadioButton.Group
              onValueChange={(newValue) => {
                setCheckList({
                  checkedListAll: [],
                  ItemsChecked: false,
                });
                setVatChecked(newValue ?? 1);
                handlePageSizeChange(1, pageSize, newValue);
              }}
              value={vatChecked}
            >
              <View
                style={{
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <View
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                >
                  <Text>Qaimələr</Text>
                  <RadioButton value={1} />
                </View>
                <View
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                >
                  <Text>ƏDV qaimələri</Text>
                  <RadioButton value={2} />
                </View>
                <View
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                >
                  <Text>Qaimələr + ƏDV</Text>
                  <RadioButton value={3} />
                </View>
              </View>
            </RadioButton.Group>
            <ScrollView>
              <View
                display="flex"
                flexDirection="row"
                alignItems="flex-end"
                justifyContent={"space-between"}
              >
                <View
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    marginBottom: 15,
                    gap: 5,
                  }}
                >
                  <Text style={{ marginRight: 5 }}>Sıra ilə ödəmə</Text>
                  <CheckBox
                    onValueChange={(event) => {
                      setPayOrdered(event);
                      setPayOrderedValue(0);
                      handlePageSizeChange(1, 20, vatChecked);
                    }}
                    value={payOrdered}
                  />
                </View>
                <View display="flex" flexDirection="row" alignItems="flex-end">
                  <ProButton
                    label={
                      <AntDesign name="filter" size={18} color="#55ab80" />
                    }
                    type="transparent"
                    onClick={() => setFilterVisible(true)}
                    defaultStyle={{ borderRadius: 5 }}
                    buttonBorder={styles.buttonStyle}
                    flex={false}
                  />
                  {vatChecked !== 3 && (
                    <ProButton
                      label={
                        <AntDesign name="setting" size={18} color="#55ab80" />
                      }
                      type="transparent"
                      onClick={() => setSettingVisible(true)}
                      defaultStyle={{ borderRadius: 5 }}
                      buttonBorder={styles.buttonStyle}
                      flex={false}
                    />
                  )}
                </View>
              </View>

              <View>
                {payOrdered && (
                  <View
                    style={{ display: "flex", flexDirection: "row", gap: 5 }}
                  >
                    <ProFormInput
                      label="Ödəniləcək məbləğ"
                      required={payOrdered}
                      name="payment"
                      control={control}
                      checkPositive
                      keyboardType="numeric"
                      width="50%"
                      handleChange={(value) => {
                        const re = /^[0-9]{1,9}\.?[0-9]{0,2}$/;
                        if (re.test(value) && value <= 1000000) {
                          setPayOrderedValue(Number(value));
                          return value;
                        }
                        if (value === "") {
                          setPayOrderedValue(0);
                          return null;
                        }
                        return getValues("payment");
                      }}
                    />
                    <ProAsyncSelect
                      label="Valyuta"
                      data={currencies}
                      setData={() => {}}
                      fetchData={() => {}}
                      async={false}
                      filter={{ limit: 1000, withRatesOnly: 1 }}
                      required={payOrdered}
                      control={control}
                      allowClear={false}
                      name="currency"
                      width="50%"
                      // handleSelectValue={(id) => {
                      //   handleCurrencyChange(id);
                      // }}
                    />
                  </View>
                )}
              </View>
              <ScrollView style={{ marginTop: 15 }} horizontal={true}>
                <Table borderStyle={{ borderWidth: 1, borderColor: "white" }}>
                  <Row
                    data={vatChecked === 3 ? data.vatTableHead : data.tableHead}
                    widthArr={data.widthArr}
                    style={styles.head}
                    textStyle={styles.headText}
                  />
                  {data.tableData.map((rowData, index) => (
                    <Row
                      key={index}
                      data={rowData}
                      widthArr={data.widthArr}
                      style={styles.rowSection}
                      textStyle={styles.text}
                    />
                  ))}
                </Table>
              </ScrollView>
              <View
                style={{
                  display: "flex",
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <Text>Toplam</Text>
                {payOrdered && (
                  <Text>
                    {formatNumberToLocale(
                      defaultNumberFormat(
                        checkList.checkedListAll?.reduce(
                          (total, { remainingInvoiceDebtWithCredit }) =>
                            math.add(
                              total,
                              Number(remainingInvoiceDebtWithCredit) || 0
                            ),
                          0
                        )
                      )
                    )}{" "}
                    {currencies.find(
                      ({ id }) => id === Number(getValues("currency"))
                    )?.code || ""}
                  </Text>
                )}

                <Text>
                  {formatNumberToLocale(
                    defaultNumberFormat(
                      payOrdered
                        ? payOrderedValue
                        : uniqBy(
                            checkList.checkedListAll,
                            "invoiceNumber"
                          )?.reduce(
                            (total, { mustPay, mustVatPay }) =>
                              math.add(
                                total,
                                Number(mustPay) || 0,
                                vatChecked === 3 ? Number(mustVatPay || 0) : 0
                              ),
                            0
                          )
                    )
                  )}{" "}
                  {checkList.checkedListAll[0]?.currencyCode || ""}
                </Text>
              </View>
              <View>
                <Pagination
                  totalItems={invoicesCount}
                  pageSize={pageSize}
                  currentPage={currentPage}
                  onPageChange={handlePaginationChange}
                  textStyle={{ fontSize: 6 }}
                />
              </View>
              <View
                style={{ width: "100%", marginTop: 15, alignItems: "flex-end" }}
              >
                <View style={{ width: 150 }}>
                  <ProButton
                    label="Təsdiq et"
                    type="primary"
                    onClick={handleSubmit(onSubmit)}
                    padding={"10px 0"}
                    defaultStyle={{ borderRadius: 10 }}
                  />
                </View>
              </View>
            </ScrollView>
            <Pressable
              style={[styles.button, styles.buttonClose]}
              onPress={() => setIsVisible(false)}
            >
              <AntDesign name="close" size={14} color="black" />
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalView: {
    width: "100%",
    height: "100%",
    padding: 30,
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
  button: {
    position: "absolute",
    borderRadius: 20,
    padding: 10,
    right: 0,
  },
  buttonStyle: {
    borderWidth: 1,
    borderColor: "#55ab80",
    borderRadius: 5,
    paddingLeft: 12,
    paddingRight: 12,
    marginLeft: 14,
  },
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
});

export default AddInvoice;
