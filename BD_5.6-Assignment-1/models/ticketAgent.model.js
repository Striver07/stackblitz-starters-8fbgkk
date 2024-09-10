let { DataTypes, sequelize } = require("../lib/index");
let { ticket } = require("./ticket.model");
let { agent } = require("./agent.model");

let ticketAgent = sequelize.define("ticketAgent", {
  ticketId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    references: {
      model: ticket,
      key: "id",
    },
  },
  agentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    references: {
      model: agent,
      key: "id",
    },
  },
});

//defining associations//
ticket.belongsToMany(agent, { through: ticketAgent });
agent.belongsToMany(ticket, { through: ticketAgent });
module.exports = { ticketAgent };
