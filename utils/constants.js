import moment from "moment";

export const accountTypes = [
  { id: 1, label: "Nağd" },
  { id: 2, label: "Bank" },
  { id: 3, label: "Kart" },
  { id: 4, label: "Digər" },
];

export const re_paymentAmount = /^[0-9]{1,9}\.?[0-9]{0,2}$/;
export const re_amount = /^[0-9]{0,12}\.?[0-9]{0,4}$/;
export const re_percent = /^[0-9]{1,9}\.?[0-9]{0,4}$/;

export const currentYear = moment().year();
export const currentMonth = moment().month() + 1;
export const currentDay = moment().format("DD");

export const dateFormat = "DD-MM-YYYY";
export const fullDateTimeWithSecond = "DD-MM-YYYY HH:mm:ss";

export const today = moment().format(dateFormat);
