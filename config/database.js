const { Sequelize } = require("sequelize");
require("dotenv").config();

if (
  typeof Sequelize.Model !== "undefined" &&
  typeof Sequelize.Model.prototype.findByPk !== "function"
) {
  Sequelize.Model.prototype.findByPk = function findByPk(id, options) {
    return this.findById(id, options);
  };
}

const sequelizeModule = require("sequelize");

if (!sequelizeModule.Op) {
  sequelizeModule.Op = {
    eq: "$eq",
    ne: "$ne",
    gte: "$gte",
    gt: "$gt",
    lte: "$lte",
    lt: "$lt",
    not: "$not",
    in: "$in",
    notIn: "$notIn",
    is: "$is",
    like: "$like",
    notLike: "$notLike",
    iLike: "$iLike",
    notILike: "$notILike",
    regexp: "$regexp",
    notRegexp: "$notRegexp",
    iRegexp: "$iRegexp",
    notIRegexp: "$notIRegexp",
    between: "$between",
    notBetween: "$notBetween",
    overlap: "$overlap",
    contains: "$contains",
    contained: "$contained",
    adjacent: "$adjacent",
    strictLeft: "$strictLeft",
    strictRight: "$strictRight",
    noExtendRight: "$noExtendRight",
    noExtendLeft: "$noExtendLeft",
    any: "$any",
    all: "$all",
    and: "$and",
    or: "$or",
  };
}

const dbType = process.env.DB_TYPE || "sqlite";

let sequelize;

if (dbType === "sqlite") {
  sequelize = new Sequelize({
    dialect: "sqlite",
    storage: process.env.DB_PATH || "./database.sqlite",
    logging: process.env.NODE_ENV === "development" ? console.log : false,
  });
} else if (dbType === "mysql") {
  sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      dialect: "mysql",
      logging: process.env.NODE_ENV === "development" ? console.log : false,
    },
  );
}

module.exports = sequelize;
