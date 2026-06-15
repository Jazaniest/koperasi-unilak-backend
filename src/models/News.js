const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

const News = sequelize.define('News', {
    id: {
        type: DataTypes.STRING(20),
        primaryKey: true,
    },
    title: {
        type: DataTypes.STRING(255),
        allowNull: false,
    },
    slug: {
        type: DataTypes.STRING(300),
        allowNull: false,
        unique: true,
    },
    excerpt: {
        // Ringkasan singkat yang tampil di card landing page
        type: DataTypes.TEXT,
        allowNull: true,
    },
    content: {
        type: DataTypes.TEXT('long'),
        allowNull: false,
    },
    thumbnail_url: {
        type: DataTypes.STRING(500),
        allowNull: true,
    },
    is_published: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    published_at: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    created_by: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'Users', key: 'id' },
    },
}, {
    tableName: 'news',
    underscored: true,
    timestamps: true,
})

module.exports = News