class ExportsHandler {
  constructor(service, playlistsService, validator) {
    this.service = service;
    this.playlistsService = playlistsService;
    this.validator = validator;

    this.postExportMusicHandler = this.postExportMusicHandler.bind(this);
  }

  async postExportMusicHandler(request, h) {
    this.validator.validateExportNotesPayload(request.payload);
    const { playlistId } = request.params;
    const { id: credentialId } = request.auth.credentials;

    await this.playlistsService.getPlaylistById({ id: playlistId });
    await this.playlistsService.checkOwnerToPlaylist({
      id: playlistId,
      owner: credentialId,
    });

    const message = {
      playlistId,
      targetEmail: request.payload.targetEmail,
    };

    await this.service.sendMessage('export:playlist', JSON.stringify(message));

    const response = h.response({
      status: 'success',
      message: 'Permintaan Anda sedang kami proses',
    });

    response.code(201);
    return response;
  }
}

module.exports = ExportsHandler;
