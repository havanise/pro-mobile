import moment from "moment";
import { Platform } from "react-native";

export const accountTypes = [
  { id: 1, value: 1, label: "Nağd" },
  { id: 2, value: 2, label: "Bank" },
  { id: 3, value: 3, label: "Kart" },
  { id: 4, value: 4, label: "Digər" },
];

export const changeNumber = (input) => {
  if (typeof input === 'string') {
    input = input.replace(',', '.');
  }
  return input;
}

export const parseNumber = (input) => {
  return Number(changeNumber(input));
}

export const re_paymentAmount = Platform.OS === "ios" ? /^[0-9]{1,9}[.,]?[0-9]{0,2}$/ : /^[0-9]{1,9}\.?[0-9]{0,2}$/;
export const re_amount = Platform.OS === "ios" ? /^[0-9]{0,12}[.,]?[0-9]{0,4}$/ : /^[0-9]{0,12}\.?[0-9]{0,4}$/;
export const regex_amount = Platform.OS === "ios" ? /^[0-9]{0,13}[.,]?[0-9]{0,13}$/ : /^[0-9]{0,13}\.?[0-9]{0,13}$/;
export const re_percent = Platform.OS === "ios" ? /^[0-9]{1,9}[.,]?[0-9]{0,4}$/ : /^[0-9]{1,9}\.?[0-9]{0,4}$/;

export const currentYear = moment().year();
export const currentMonth = moment().month() + 1;
export const currentDay = moment().format("DD");

export const dateFormat = "DD-MM-YYYY";
export const fullDateTimeWithSecond = "DD-MM-YYYY HH:mm:ss";

export const today = moment().format(dateFormat);

export const contactTypes = [
  {
    id: 1,
    value: 1,
    label: "Fiziki şəxs",
    name: "Fiziki şəxs",
  },
  {
    id: 2,
    value: 2,
    label: "Hüquqi şəxs",
    name: "Hüquqi şəxs",
  },
];

export const contactCategories = {
  1: {
    id: 1,
    value: 1,
    label: "Alıcı",
    name: "Alıcı",
  },
  4: {
    id: 4,
    value: 4,
    label: "Təchizatçı",
    name: "Təchizatçı",
  },
  8: {
    id: 8,
    value: 8,
    label: "İstehsalçı",
    name: "İstehsalçı",
  },
};

export const paymentType = [
  { name: "Qaimə", id: 9, key: "transaction_invoice_payment" },
  { name: "Qaimə (ƏDV)", id: 10, key: "transaction_vat_invoice_payment" },
  { name: "Əməkhaqqı", id: 6, key: "salary_payment" },
  { name: "Transfer", id: 4, key: "money_transfer" },
  {
    name: "Təhtəl hesab",
    id: 12,
    key: "transaction_balance_creation_payment",
  },
  {
    name: "Təsisçi",
    id: 7,
    key: "transaction_tenant_person_payment",
  },
  { name: "Avans əsas", id: 11, key: "transaction_advance_payment" },
  { name: "Avans (ƏDV)", id: 24, key: "transaction_vat_advance" },
  { name: "Xərclər", id: 8, key: "transaction_expense_payment" },
  { name: "Valyuta mübadiləsi", id: 13, key: "transaction_exchange" },
  {
    name: "İlkin hesab qalığı",
    id: 14,
    key: "cashbox_balance_report",
  },
  {
    name: "İlkin avans qalığı",
    id: 15,
    key: "initial_remains_prepayment",
  },
  {
    name: "İlkin təhtəl hesab qalığı",
    id: 17,
    key: "transaction_initial_employee_payment",
  },
  {
    name: "İlkin kapital qalığı",
    id: 18,
    key: "initial_remains_capital",
  },
  { name: "Dividend", id: 16, key: "transaction_dividend" },
  { name: "Borc silinməsi", id: 19, key: "transaction_debt_relief" },
  { name: "Artırma", id: 21, key: "transaction_increase" },
  { name: "Azaltma", id: 22, key: "transaction_decrease" },
  { name: "Barter", id: 23, key: "transaction_barter" },
];

export const saleType = [
  { name: "Alış", id: 1, key: "purchase_invoice" },
  { name: "Satış", id: 2, key: "sales_invoice" },
  { name: "Geri Alma", id: 3, key: "return_from_customer_invoice" },
  { name: "Geri Qaytarma", id: 4, key: "return_to_supplier_invoice" },
  { name: "Transfer", id: 5, key: "transfer_invoice" },
  { name: "Silinmə", id: 6, key: "remove_invoice" },
  { name: "Qaralama", id: 8, key: "draft_invoice" },
  { name: "İdxal alışı", id: 10, key: "import_purchase" },
  { name: "İstehsalat", id: 11, key: "production_invoice" },
  { name: "Anbara göndərmə", id: 19, key: "production_invoice" },
  { name: "Artırma", id: 14, key: "product_increase_invoice" },
  { name: "Azaltma", id: 15, key: "product_decrease_invoice" },
  { name: "Konsiqnasiyaya vermə", id: 16, key: "stock_consignment" },
  { name: "Konsiqnasiyadan gerialma", id: 17, key: "stock_consignment" },
  {
    name: "Konsiqnasiyadan satış",
    id: 100,
    key: "stock_consignment",
  },
];
