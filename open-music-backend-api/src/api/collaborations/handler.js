class CollaborationsHandler {
  constructor(service, usersService, playlistsService, validator) {
    this.service = service;
    this.usersService = usersService;
    this.playlistsService = playlistsService;
    this.validator = validator;

    this.postCollaborationHandler = this.postCollaborationHandler.bind(this);
    this.deleteCollaborationHandler = this.deleteCollaborationHandler.bind(this);
  }

  async postCollaborationHandler(request, h) {
    this.validator.validateCollaborationPayload(request.payload);

    const { playlistId, userId } = request.payload;
    const { id: credentialId } = request.auth.credentials;

    await this.playlistsService.getPlaylistById({ id: playlistId });
    await this.usersService.getUserById(userId);
    await this.playlistsService.checkAccessToPlaylist({
      id: playlistId,
      owner: credentialId,
    });

    const collaborationId = await this.service.addCollaboration({
      playlistId, userId,
    });

    const response = h.response({
      status: 'success',
      data: {
        collaborationId,
      },
    });

    response.code(201);
    return response;
  }

  async deleteCollaborationHandler(request, h) {
    this.validator.validateCollaborationPayload(request.payload);

    const { playlistId, userId } = request.payload;
    const { id: credentialId } = request.auth.credentials;

    await this.playlistsService.checkOwnerToPlaylist({
      id: playlistId,
      owner: credentialId,
    });

    await this.service.deleteCollaboration({
      playlistId, userId,
    });

    const response = h.response({
      status: 'success',
      message: 'Menghapus kolaborator sukses',
    });

    response.code(200);
    return response;
  }
}

module.exports = CollaborationsHandler;
