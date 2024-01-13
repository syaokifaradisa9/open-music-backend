const CollaborationsHandler = require('./handler');
const routes = require('./routes');

module.exports = {
  name: 'collaborations',
  version: '1.0.0',
  register: async (server, {
    service, usersService, playlistsService, validator,
  }) => {
    const collaborationsHandler = new CollaborationsHandler(
      service,
      usersService,
      playlistsService,
      validator,
    );

    server.route(routes(collaborationsHandler));
  },
};
