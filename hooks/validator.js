// email validation
export const checkEmailisValid = value =>
    /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(
        value
    );

// max & min length check
export const checkLengthisValid = (value, min = 6, max = 250) =>
    value.length >= min && value.length <= max;

// check for only numbers
export const checkForOnlynumbers = value => /^\d+$/.test(value);

// space check helper
export const checkSpaceinValue = value => /\s/g.test(value);

// check start with space ex.: "__some word"
export const checkStartWithSpace = value => /^\s+/g.test(value);

// check for illegal symbols
export const checkNotAllowedSymbols = value =>
    /^[a-zA-Zа-яА-ЯəüğışçöƏÜĞIŞÇÖİ ]+$/u.test(value);

// check for underscores
export const checkForUnderscores = value => /\_/.test(value);


export const chekPhoneNumber = number => {
    if (number.slice(18, 19) === '_') {
        return false;
    }
    if (
        +number.slice(6, 9) !== 50 &&
        +number.slice(6, 9) !== 51 &&
        +number.slice(6, 9) !== 55 &&
        +number.slice(6, 9) !== 99 &&
        +number.slice(6, 9) !== 70 &&
        +number.slice(6, 9) !== 77
    ) {
        return false;
    }
    if (+number.slice(2, 5) !== 994) {
        return false;
    }
    return true;
};

export const chekHomeNumber = number => {
    if (number.slice(18, 19) === '_') {
        return false;
    }
    if (+number.slice(6, 9) !== 12) {
        return false;
    }
    if (+number.slice(2, 5) !== 994) {
        return false;
    }
    return true;
};
