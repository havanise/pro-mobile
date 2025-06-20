import BigNumber from 'bignumber.js';
const commaNumber = require("comma-number");
const math = require("exact-math");

export const roundTo = (number, precision, method = "round") => {
  if (typeof number !== "number") {
    throw new TypeError("Expected value to be a number");
  }

  if (precision === Number.POSITIVE_INFINITY) {
    return number;
  }

  if (!Number.isInteger(precision)) {
    throw new TypeError("Expected precision to be an integer");
  }

  const isRoundingAndNegative = method === "round" && number < 0;
  if (isRoundingAndNegative) {
    number = Math.abs(number);
  }

  const power = 10 ** precision;

  let result = Math[method]((number * power).toPrecision(15)) / power;

  if (isRoundingAndNegative) {
    result = -result;
  }

  return result;
};

export const roundToDown = (number, precision = 2) => {
  return roundTo(number, precision, "floor");
};

export const roundToUp = (number, precision = 2) => {
  return roundTo(number, precision, "ceil");
};

// Get Number with comma
export const formatNumberToLocale = (number) => commaNumber(number);

// Check leading zeroes
export const defaultNumberFormat = (number) => {
  if (roundToDown(Number(number), 1) === Number(number)) {
    return roundToDown(Number(number), 2).toFixed(2);
  }
  return roundToDown(Number(number), 4);
};

// export const roundToDown = number => roundTo.down(Number(number), 4);
// export const roundToUp = number => roundTo.up(Number(number), 4);
// export const round = number => roundTo.up(Number(number), 2);
export const getPriceValue = (number) => roundTo(Number(number), 4);

export const customRound = (amount, rate = 1, floatPoint = 4) =>
  roundToDown(Number(rate) * Number(amount), floatPoint) <
  Number(rate) * Number(amount)
    ? roundToDown(Number(rate) * Number(amount) + 0.01, floatPoint)
    : roundToDown(Number(rate) * Number(amount), 4);

export const customRoundWithBigNumber = (amount, rate = 1) =>
  roundToUp(
    Number(new BigNumber(rate).multipliedBy(new BigNumber(amount || 0))),
    2
  );

export const getDifference = (debt, amount, rate) =>
  (Number(amount) * 10000 - (Number(debt) / Number(rate)) * 10000) / 10000;

export const getPercentage = (amount, percent) =>
  math.div(math.mul(Number(amount), Number(percent || 0)), 100);

export function toFixedNumber(value, float = 2) {
  return value === null || !value ? 0 : Number(Number(value).toFixed(float));
}