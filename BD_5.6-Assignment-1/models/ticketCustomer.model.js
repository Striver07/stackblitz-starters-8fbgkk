let { DataTypes, sequelize } = require("../lib/index");
let { ticket } = require("./ticket.model");
let { customer } = require("./customer.model");

let ticketCustomer = sequelize.define("ticketCustomer", {
  ticketId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    references: {
      model: ticket,
      key: "id",
    },
  },
  customerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    references: {
      model: customer,
      key: "id",
    },
  },
});

//defining associations//
ticket.belongsToMany(customer, { through: ticketCustomer });
customer.belongsToMany(ticket, { through: ticketCustomer });
module.exports = { ticketCustomer };
