const { AlbumPayloadSchema, AlbumCoverPayloadSchema } = require('./schema');
const InvariantError = require('../../exceptions/InvariantError');
const ClientError = require('../../exceptions/ClientError');

const AlbumsValidator = {
  validateAlbumPayload: (payload) => {
    const validationresult = AlbumPayloadSchema.validate(payload);
    if (validationresult.error) {
      throw new InvariantError(validationresult.error.message);
    }
  },
  validateAlbumCoverHeaders: (headers) => {
    const validationResult = AlbumCoverPayloadSchema.validate(headers);
    if (validationResult.error) {
      throw new ClientError(validationResult.error.message);
    }
  },
};

module.exports = AlbumsValidator;
