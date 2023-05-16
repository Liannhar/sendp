"use strict";
let {DataTypes} = require('sequelize');
let sequelize = require('../../../../!PROJECTS/sendp/pg/database');

let User = sequelize.define('User', {
    nickname: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    }
});

async function getAllUsers() {
    try {
        return await User.findAll();
    } catch (err) {
        console.error('Ошибка при получении пользователей:', err);
    }
}

module.exports = {
    getAllUsers,
};

module.exports = User;