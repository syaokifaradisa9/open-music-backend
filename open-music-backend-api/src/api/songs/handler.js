class SongsHandler {
  constructor(service, validator) {
    this.service = service;
    this.validator = validator;

    this.postSongHandler = this.postSongHandler.bind(this);
    this.getSongsHandler = this.getSongsHandler.bind(this);
    this.getSongByIdHandler = this.getSongByIdHandler.bind(this);
    this.putSongByIdHandler = this.putSongByIdHandler.bind(this);
    this.deleteSongByIdHandler = this.deleteSongByIdHandler.bind(this);
  }

  async postSongHandler(request, h) {
    this.validator.validateSongPayload(request.payload);

    const songId = await this.service.addSong(request.payload);

    const response = h.response({
      status: 'success',
      message: 'Lagu berhasil ditambahkan',
      data: {
        songId,
      },
    });

    response.code(201);
    return response;
  }

  async getSongsHandler(request, h) {
    const { title, performer } = request.query;

    let songs = await this.service.getSongs();

    if (performer) {
      songs = songs.filter(
        (song) => song.performer.toLowerCase().includes(performer.toLowerCase()),
      );
    }

    if (title) {
      songs = songs.filter((song) => song.title.toLowerCase().includes(title.toLowerCase()));
    }

    const response = h.response({
      status: 'success',
      data: {
        songs: songs.map((song) => ({
          id: song.id,
          title: song.title,
          performer: song.performer,
        })),
      },
    });

    response.code(200);
    return response;
  }

  async getSongByIdHandler(request, h) {
    const { id } = request.params;
    const song = await this.service.getSongById(id);

    const response = h.response({
      status: 'success',
      data: {
        song,
      },
    });

    response.code(200);
    return response;
  }

  async putSongByIdHandler(request, h) {
    const { id } = request.params;
    if (id.length !== 21 && !id.includes('song')) {
      const response = h.response({
        status: 'fail',
        message: 'ID tidak valid!',
      });

      response.code(404);
      return response;
    }

    this.validator.validateSongPayload(request.payload);
    await this.service.editSongById(id, request.payload);

    const response = h.response({
      status: 'success',
      message: 'Lagu berhasil diperbarui',
    });

    response.code(200);
    return response;
  }

  async deleteSongByIdHandler(request, h) {
    const { id } = request.params;

    await this.service.deleteSongById(id);

    const response = h.response({
      status: 'success',
      message: 'Lagu berhasil dihapus',
    });

    response.code(200);
    return response;
  }
}

module.exports = SongsHandler;
