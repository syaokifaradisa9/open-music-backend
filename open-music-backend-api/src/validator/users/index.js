const InvariantError = require('../../exceptions/InvariantError');
const { UserPayloadSchema } = require('./schema');

const UserValidator = {
  validateUserPayload: (payload) => {
    const validatedResult = UserPayloadSchema.validate(payload);

    if (validatedResult.error) {
      throw new InvariantError(validatedResult.error.message);
    }
  },
};

module.exports = UserValidator;
