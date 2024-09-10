let { DataTypes, sequelize } = require("../lib/index");
let ticket = sequelize.define("ticket", {
    title: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    description: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    status: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    priority: {
        type: DataTypes.STRING,
        allowNull: false,
    },

});

module.exports = { ticket };
