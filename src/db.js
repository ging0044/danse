require("dotenv").config();

import Sequelize from "sequelize";
//import fs from "fs";
//import path from "path";

export const sequelize = new Sequelize(
  {
    database: process.env.DB_NAME,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    dialect: process.env.DB_TYPE,
    port: process.env.DB_PORT,
    operatorsAliases: false,
  }
);

export const Stop = sequelize.define("stop", {
  id: {
    type: Sequelize.STRING,
    primaryKey: true,
  },
  stopped: {
    type: Sequelize.BOOLEAN,
  },
}, {
  timestamps: false,
});

/**
 * get DB entry by ID
 * @param id
 * @returns {*|T}
 */
export function getStopByChannelID(id) {
  return Stop.find({
    where: {
      id: {
        [Sequelize.Op.eq]: id,
      }
    },
  });
}

/**
 * updates stopped status of DB entry
 * @param id
 * @param stopped
 * @returns {Promise.<this>}
 */
export function updateStop(id, stopped) {
  return Stop.update({
    stopped,
  }, {
    where: {
      id: {
        [Sequelize.Op.eq]: id,
      }
    },
  });
}

export function createOrUpdateStop(id, stopped) {
  Stop.create({ id, stopped })
    .catch(() => {
      Stop.update({
        stopped,
      }, {
        where: {
          id: {
            [Sequelize.Op.eq]: id,
          }
        },
      }).catch(console.error);
    });
}