let sq = require('sequelize');
let sequelize = new sq.Sequelize({
  dialect: 'sqlite',
  storage: './BD_5.6-Assignment-1/database.sqlite',
});

module.exports = { DataTypes: sq.DataTypes, sequelize };