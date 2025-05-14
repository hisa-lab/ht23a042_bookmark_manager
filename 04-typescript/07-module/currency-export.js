"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Currency = void 0;
var rate = {
    USD: 1,
    EUR: 0.9,
    JPY: 108,
    GBP: 0.8,
};
var Currency = {
    exchange: function (currency, unit) {
        var amount = (currency.amount / rate[currency.unit]) * rate[unit];
        return { unit: unit, amount: amount };
    },
};
exports.Currency = Currency;
