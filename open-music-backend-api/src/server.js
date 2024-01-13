require('dotenv').config();

// File
const path = require('path');
const Inert = require('@hapi/inert');

// Hapi
const Hapi = require('@hapi/hapi');
const Jwt = require('@hapi/jwt');

const uploads = require('./api/uploads');

// Services
const StorageService = require('./services/storage/StorageService');
const CacheService = require('./services/redis/CacheService');

// Exception
const ClientError = require('./exceptions/ClientError');

// Playlist
const playlists = require('./api/playlists');
const PlaylistsService = require('./services/postgres/PlaylistsService');
const playlistValidator = require('./validator/playlists');

// Activity
const PlaylistActivitiesService = require('./services/postgres/PlaylistActivitiesService');

// Albums
const albums = require('./api/albums');
const AlbumService = require('./services/postgres/AlbumsService');
const AlbumValidator = require('./validator/albums');
const UserAlbumLikeService = require('./services/postgres/UserAlbumLikeService');

// Songs
const songs = require('./api/songs');
const SongsService = require('./services/postgres/SongsService');
const SongValidator = require('./validator/songs');

// Users
const users = require('./api/users');
const UsersService = require('./services/postgres/UsersService');
const UsersValidator = require('./validator/users');

// Authentication
const authentications = require('./api/authentications');
const AuthenticationsService = require('./services/postgres/AuthenticationsService');
const TokenManager = require('./tokenize/TokenManager');
const AuthenticationValidator = require('./validator/authentications');

// Collaboration
const collaborations = require('./api/collaborations');
const CollaborationsService = require('./services/postgres/CollaborationsService');
const CollaborationValidator = require('./validator/collaborations');

// Export
const exportsPlugin = require('./api/exports');
const ProducerService = require('./services/rabbitmq/ProducerService');
const ExportsValidator = require('./validator/exports');

const init = async () => {
  const server = Hapi.server({
    port: process.env.PORT,
    host: process.env.HOST,
    routes: {
      cors: {
        origin: ['*'],
      },
    },
  });

  // Inisialisasi Services
  const storageService = new StorageService(path.resolve(__dirname, 'api/uploads/file/images'));
  const cacheService = new CacheService();
  const albumService = new AlbumService(storageService);
  const userAlbumLikeService = new UserAlbumLikeService(cacheService);
  const songsService = new SongsService();
  const usersService = new UsersService();
  const authenticationsService = new AuthenticationsService();
  const playlistsService = new PlaylistsService(cacheService);
  const collaborationsService = new CollaborationsService();
  const playlistActivitiesService = new PlaylistActivitiesService(cacheService);

  // Plugin External
  await server.register([
    {
      plugin: Jwt,
    },
    {
      plugin: Inert,
    },
  ]);

  server.ext('onPreResponse', (request, h) => {
    const { response } = request;

    if (response instanceof Error) {
      if (response instanceof ClientError) {
        const newResponse = h.response({
          status: 'fail',
          message: response.message,
        });

        newResponse.code(response.statusCode);
        return newResponse;
      }

      if (!response.isServer) {
        return h.continue;
      }

      const newResponse = h.response({
        status: 'error',
        message: 'terjadi kegagalan pada server kami',
      });

      newResponse.code(500);
      return newResponse;
    }

    return h.continue;
  });

  // Mendefinisikan Strategi Authenntikasi JWT
  server.auth.strategy('musicapp_jwt', 'jwt', {
    keys: process.env.ACCESS_TOKEN_KEY,
    verify: {
      aud: false,
      iss: false,
      sub: false,
      maxAgeSec: process.env.ACCESS_TOKEN_AGE,
    },
    validate: (artifacts) => ({
      isValid: true,
      credentials: {
        id: artifacts.decoded.payload.id,
      },
    }),
  });

  // Plugin Internal
  await server.register([
    {
      plugin: uploads,
    },
    {
      plugin: albums,
      options: {
        service: albumService,
        albumLikeService: userAlbumLikeService,
        validator: AlbumValidator,
      },
    },
    {
      plugin: songs,
      options: {
        service: songsService,
        validator: SongValidator,
      },
    },
    {
      plugin: users,
      options: {
        service: usersService,
        validator: UsersValidator,
      },
    },
    {
      plugin: authentications,
      options: {
        authenticationsService,
        usersService,
        tokenManager: TokenManager,
        validator: AuthenticationValidator,
      },
    },
    {
      plugin: playlists,
      options: {
        playlistsService,
        songsService,
        activitiesService: playlistActivitiesService,
        validator: playlistValidator,
      },
    },
    {
      plugin: collaborations,
      options: {
        service: collaborationsService,
        usersService,
        playlistsService,
        validator: CollaborationValidator,
      },
    },
    {
      plugin: exportsPlugin,
      options: {
        service: ProducerService,
        playlistsService,
        validator: ExportsValidator,
      },
    },
  ]);

  await server.start();
};

init();
