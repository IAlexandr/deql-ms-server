import SequelizeModels from 'sequelize-models';

export default function({ dbConnection, exportTableNames }) {
  return new Promise(resolve => {
    const { host, port, dialect, username, password, schema } = dbConnection;
    var seqModels = new SequelizeModels({
      connection: {
        host,
        port,
        dialect,
        username,
        schema,
        password,
      },

      // Models loading options
      models: {
        autoLoad: true,
        // path: '/models',
      },

      // Sequelize options passed directly to Sequelize constructor
      sequelizeOptions: {
        define: {
          // freezeTableName: true,
          // underscored: true,
        },
      },
    });

    seqModels
      .getSchema({ exportTableNames })
      .then(schema => resolve(schema));
  });
}
