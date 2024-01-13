const { nanoid } = require('nanoid');
const { Pool } = require('pg');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');
const ClientError = require('../../exceptions/ClientError');

class UserAlbumLikeService {
  constructor(cacheService) {
    this.cacheService = cacheService;
    this.pool = new Pool();
  }

  async addUserAlbumLikeByAlbumId({ userId, albumId }) {
    const id = `user-album-like-${nanoid(16)}`;

    const query = {
      text: 'INSERT INTO user_album_likes values($1, $2, $3) RETURNING id',
      values: [id, userId, albumId],
    };

    const result = await this.pool.query(query);

    if (!result.rows[0].id) {
      return new InvariantError('Gagal menyukai album');
    }

    this.cacheService.delete(`likes:${albumId}`);

    return result.rows[0].id;
  }

  async getUserAlbumLikeByAlbumId({ id }) {
    let count = 0;
    let isCache = false;

    try {
      count = await this.cacheService.get(`likes:${id}`);
      count = parseInt(count, 10);
      isCache = true;
    } catch (error) {
      const query = {
        text: 'SELECT id FROM user_album_likes WHERE album_id = $1',
        values: [id],
      };

      const result = await this.pool.query(query);
      await this.cacheService.set(`likes:${id}`, result.rowCount);
      count = result.rowCount;
    }

    return {
      count,
      isCache,
    };
  }

  async deleteUserAlbumLikeByAlbumId({ userId, albumId }) {
    const query = {
      text: 'DELETE FROM user_album_likes WHERE album_id = $1 AND user_id = $2 RETURNING id',
      values: [albumId, userId],
    };

    const result = await this.pool.query(query);
    if (!result.rowCount) {
      throw new NotFoundError('Gagal membatalkan menyukai album, Id tidak ditemukan!');
    }

    this.cacheService.delete(`likes:${albumId}`);
  }

  async checkUserAlbumLikeStatus({ userId, albumId }) {
    const query = {
      text: 'SELECT id FROM user_album_likes WHERE album_id = $1 AND user_id = $2',
      values: [albumId, userId],
    };

    const result = await this.pool.query(query);
    if (result.rowCount) {
      throw new ClientError('Anda sudah pernah menyukai album ini');
    }
  }
}

module.exports = UserAlbumLikeService;
