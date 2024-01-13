class PlaylistHandler {
  constructor(service, songsService, activitiesService, validator) {
    this.service = service;
    this.songsService = songsService;
    this.activitiesService = activitiesService;
    this.validator = validator;

    this.postPlaylistHandler = this.postPlaylistHandler.bind(this);
    this.getPlaylistsHandler = this.getPlaylistsHandler.bind(this);
    this.deletePlaylistByIdHandler = this.deletePlaylistByIdHandler.bind(this);

    this.postPlaylistSongHandler = this.postPlaylistSongHandler.bind(this);
    this.getPlaylistSongByIdHandler = this.getPlaylistSongByIdHandler.bind(this);
    this.deletePlaylistSongByIdHandler = this.deletePlaylistSongByIdHandler.bind(this);

    this.getPlaylistActivitiesByIdHandler = this.getPlaylistActivitiesByIdHandler.bind(this);
  }

  async postPlaylistHandler(request, h) {
    this.validator.validatePlaylistPayload(request.payload);

    const { id: credentialId } = request.auth.credentials;
    const { name } = request.payload;

    const playlistId = await this.service.addPlaylist({
      name,
      owner: credentialId,
    });

    const response = h.response({
      status: 'success',
      message: 'Playlist berhasil ditambahkan',
      data: {
        playlistId,
      },
    });

    response.code(201);
    return response;
  }

  async getPlaylistsHandler(request, h) {
    const { id: credentialId } = request.auth.credentials;

    const { data, isCache } = await this.service.getPlaylists({
      owner: credentialId,
    });

    const response = h.response({
      status: 'success',
      data: {
        playlists: data.map((playlist) => ({
          id: playlist.id,
          name: playlist.name,
          username: playlist.username,
        })),
      },
    });

    response.code(200);
    if (isCache) {
      response.header('X-Data-Source', 'cache');
    }
    return response;
  }

  async deletePlaylistByIdHandler(request, h) {
    const { id } = request.params;
    const { id: credentialId } = request.auth.credentials;

    await this.service.checkOwnerToPlaylist({
      id,
      owner: credentialId,
    });

    await this.service.deletePlaylist({ id });

    const response = h.response({
      status: 'success',
      message: 'Playlist berhasil dihapus',
    });
    response.code(200);

    return response;
  }

  async postPlaylistSongHandler(request, h) {
    this.validator.validatePlaylistSongPayload(request.payload);

    const { id } = request.params;
    const { songId } = request.payload;
    const { id: credentialId } = request.auth.credentials;

    if (typeof songId !== 'string') {
      const response = h.response({
        status: 'fail',
        message: 'ID tidak valid!',
      });

      response.code(400);
      return response;
    }

    await this.service.getPlaylistById({ id });
    await this.songsService.getSongById(songId);
    await this.service.checkAccessToPlaylist({
      id,
      owner: credentialId,
    });

    await this.service.addSongToPlaylist({
      playlistId: id,
      songId,
    });

    await this.activitiesService.addActivity({
      playlistId: id,
      songId,
      userId: credentialId,
      action: 'add',
    });

    const response = h.response({
      status: 'success',
      message: 'Lagu berhasil ditambahkan ke dalam playlist',
    });

    response.code(201);
    return response;
  }

  async getPlaylistSongByIdHandler(request, h) {
    const { id } = request.params;
    const { id: credentialId } = request.auth.credentials;

    const playlist = await this.service.getPlaylistById({ id });
    await this.service.checkAccessToPlaylist({
      id,
      owner: credentialId,
    });

    const results = await this.service.getSongsFromPlaylist({
      playlistId: id,
    });

    const response = h.response({
      status: 'success',
      data: ({
        playlist: {
          id: playlist.id,
          name: playlist.name,
          username: playlist.username,
          songs: results.map((song) => ({
            id: song.id,
            title: song.title,
            performer: song.performer,
          })),
        },
      }),
    });

    response.code(200);
    return response;
  }

  async deletePlaylistSongByIdHandler(request, h) {
    const { id } = request.params;
    const { songId } = request.payload;
    const { id: credentialId } = request.auth.credentials;

    if (typeof songId !== 'string') {
      const response = h.response({
        status: 'fail',
        message: 'ID tidak valid!',
      });

      response.code(400);
      return response;
    }

    await this.service.checkAccessToPlaylist({
      id,
      owner: credentialId,
    });

    await this.service.deleteSongFromPlaylist({
      playlistId: id,
      songId,
    });

    await this.activitiesService.addActivity({
      playlistId: id,
      songId,
      userId: credentialId,
      action: 'delete',
    });

    const response = h.response({
      status: 'success',
      message: 'Berhasil menghapus lagu dalam playlist',
    });

    response.code(200);
    return response;
  }

  async getPlaylistActivitiesByIdHandler(request, h) {
    const { id } = request.params;
    const { id: credentialId } = request.auth.credentials;

    const playlist = await this.service.getPlaylistById({ id });
    await this.service.checkAccessToPlaylist({
      id,
      owner: credentialId,
    });

    const { data, isCache } = await this.activitiesService.getActivities({ playlistId: id });

    const response = h.response({
      status: 'success',
      data: {
        playlistId: playlist.id,
        activities: data.map((activity) => ({
          username: activity.username,
          title: activity.title,
          action: activity.action,
          time: activity.time,
        })),
      },
    });

    response.code(200);
    if (isCache) {
      response.header('X-Data-Source', 'cache');
    }
    return response;
  }
}

module.exports = PlaylistHandler;
