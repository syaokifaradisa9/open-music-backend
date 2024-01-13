const { SongPayloadSchema } = require('./schema');
const InvariantError = require('../../exceptions/InvariantError');

const SongsValidator = {
  validateSongPayload: (payload) => {
    const validationresult = SongPayloadSchema.validate(payload);
    if (validationresult.error) {
      throw new InvariantError(validationresult.error.message);
    }
  },
};

module.exports = SongsValidator;
