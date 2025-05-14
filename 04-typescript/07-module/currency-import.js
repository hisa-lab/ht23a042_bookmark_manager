"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var currency_export_1 = require("./currency-export");
var dollars = {
    unit: "USD",
    amount: 100,
};
console.log(dollars);
console.log(currency_export_1.Currency.exchange(dollars, "JPY"));
