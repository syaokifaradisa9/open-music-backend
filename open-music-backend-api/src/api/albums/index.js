const AlbumsHandler = require('./handler');
const routes = require('./routes');

module.exports = {
  name: 'albums',
  version: '1.0.0',
  register: async (server, { service, albumLikeService, validator }) => {
    const albumsHandler = new AlbumsHandler(service, albumLikeService, validator);
    server.route(routes(albumsHandler));
  },
};
