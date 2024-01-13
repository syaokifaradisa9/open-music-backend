class AlbumsHandler {
  constructor(service, albumLikeService, validator) {
    this.service = service;
    this.albumLikeService = albumLikeService;
    this.validator = validator;

    this.postAlbumHandler = this.postAlbumHandler.bind(this);
    this.getAlbumByIdHandler = this.getAlbumByIdHandler.bind(this);
    this.putAlbumByIdHandler = this.putAlbumByIdHandler.bind(this);
    this.deleteAlbumByIdHandler = this.deleteAlbumByIdHandler.bind(this);

    this.postUploadAlbumCoverHandler = this.postUploadAlbumCoverHandler.bind(this);

    this.postLikeAlbumHandler = this.postLikeAlbumHandler.bind(this);
    this.getLikeAlbumHandler = this.getLikeAlbumHandler.bind(this);
    this.deleteLikeAlbumHandler = this.deleteLikeAlbumHandler.bind(this);
  }

  async postAlbumHandler(request, h) {
    this.validator.validateAlbumPayload(request.payload);
    const { name, year } = request.payload;

    const albumId = await this.service.addAlbum({ name, year });

    const response = h.response({
      status: 'success',
      data: {
        albumId,
      },
    });

    response.code(201);
    return response;
  }

  async postLikeAlbumHandler(request, h) {
    const { id } = request.params;
    const { id: credentialId } = request.auth.credentials;

    await this.service.getAlbumById(id);
    await this.albumLikeService.checkUserAlbumLikeStatus({
      userId: credentialId,
      albumId: id,
    });

    await this.albumLikeService.addUserAlbumLikeByAlbumId({
      userId: credentialId,
      albumId: id,
    });

    const response = h.response({
      status: 'success',
      message: 'Sukses menyukai album',
    });

    response.code(201);
    return response;
  }

  async postUploadAlbumCoverHandler(request, h) {
    const { cover } = request.payload;
    this.validator.validateAlbumCoverHeaders(cover.hapi.headers);

    const { id } = request.params;
    const filename = await this.service.addAlbumCover({
      albumId: id,
      file: cover,
      meta: cover.hapi,
    });

    const response = h.response({
      status: 'success',
      message: 'Cover album berhasil diupload',
      data: {
        fileLocation: `http://${process.env.HOST}:${process.env.PORT}/upload/images/${filename}`,
      },
    });

    response.code(201);
    return response;
  }

  async getAlbumByIdHandler(request, h) {
    const { id } = request.params;

    const album = await this.service.getAlbumById(id);
    const songs = await this.service.getSongByAlbumId(id);

    const response = h.response({
      status: 'success',
      data: {
        album: {
          id: album.id,
          name: album.name,
          year: album.year,
          coverUrl: album.cover == null ? null : `http://${process.env.HOST}:${process.env.PORT}/upload/images/${album.cover}`,
          songs: songs.map((song) => ({
            id: song.id,
            title: song.title,
            performer: song.performer,
          })),
        },
      },
    });

    response.code(200);
    return response;
  }

  async getLikeAlbumHandler(request, h) {
    const { id } = request.params;

    const { count, isCache } = await this.albumLikeService.getUserAlbumLikeByAlbumId({ id });
    const response = h.response({
      status: 'success',
      data: {
        likes: count,
      },
    });

    response.code(200);
    if (isCache) {
      response.header('X-Data-Source', 'cache');
    }
    return response;
  }

  async putAlbumByIdHandler(request, h) {
    const { id } = request.params;

    if (id.length !== 22 && !id.includes('album')) {
      const response = h.response({
        status: 'fail',
        message: 'ID tidak valid!',
      });

      response.code(404);
      return response;
    }

    this.validator.validateAlbumPayload(request.payload);
    await this.service.editAlbumById(id, request.payload);

    const response = h.response({
      status: 'success',
      message: 'Album berhasil diperbarui',
    });

    response.code(200);
    return response;
  }

  async deleteAlbumByIdHandler(request, h) {
    const { id } = request.params;

    await this.service.deleteAlbumById(id);

    const response = h.response({
      status: 'success',
      message: 'Album berhasil dihapus',
    });

    response.code(200);
    return response;
  }

  async deleteLikeAlbumHandler(request, h) {
    const { id } = request.params;
    const { id: credentialId } = request.auth.credentials;

    await this.albumLikeService.deleteUserAlbumLikeByAlbumId({
      userId: credentialId,
      albumId: id,
    });

    const response = h.response({
      status: 'success',
      message: 'Sukses membatalkan menyukai album',
    });

    response.code(200);
    return response;
  }
}

module.exports = AlbumsHandler;
