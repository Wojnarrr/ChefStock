const roundStock = (value, decimals = 3) => {
    return Number(value.toFixed(decimals));
};

module.exports = roundStock;