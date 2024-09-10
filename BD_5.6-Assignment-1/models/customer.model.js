let { DataTypes, sequelize } = require('../lib/index');
let customer = sequelize.define('customer',{
    customerId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true
        }
    },
});

module.exports = { customer };