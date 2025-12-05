import { Sequelize } from 'sequelize';

const sequelize = new Sequelize({
    dialect : 'sqlite',
    storage : './schedulerpro.sqlite3'
});

export default sequelize;