const { Pool } = require('pg');
const { nanoid } = require('nanoid');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');
const ForbiddenError = require('../../exceptions/ForbiddenError');

class PlaylistsService {
  constructor(cacheService) {
    this.pool = new Pool();
    this.cacheService = cacheService;
  }

  async addPlaylist({ name, owner }) {
    const id = `playlist-${nanoid(16)}`;

    const query = {
      text: 'INSERT INTO playlists VALUES($1, $2, $3) RETURNING id',
      values: [id, name, owner],
    };

    const result = await this.pool.query(query);
    if (!result.rows[0].id) {
      return new InvariantError('Playlist gagal ditambahkan');
    }

    this.cacheService.delete(`playlists:${owner}`);

    return result.rows[0].id;
  }

  async getPlaylists({ owner }) {
    let data = [];
    let isCache = false;

    try {
      const result = await this.cacheService(`playlists:${owner}`);
      data = JSON.parse(result);
      isCache = true;
    } catch (error) {
      const query = {
        text: `
          SELECT playlists.*, users.username as username
          FROM playlists
          INNER JOIN users ON playlists.owner = users.id
          LEFT JOIN collaborations ON playlists.id = collaborations.playlist_id
          WHERE playlists.owner = $1 OR collaborations.user_id = $1
        `,
        values: [owner],
      };

      const result = await this.pool.query(query);
      data = result.rows;

      await this.cacheService.set(`playlists:${owner}`, JSON.stringify(data));
    }

    return {
      data, isCache,
    };
  }

  async getPlaylistById({ id }) {
    const query = {
      text: `
        SELECT playlists.*, users.username as username
        FROM playlists
        INNER JOIN users ON playlists.owner = users.id
        WHERE playlists.id = $1
      `,
      values: [id],
    };

    const result = await this.pool.query(query);
    if (!result.rowCount) {
      throw new NotFoundError('Playlist tidak ditemukan');
    }

    return result.rows[0];
  }

  async checkAccessToPlaylist({ id, owner }) {
    const query = {
      text: `
        SELECT * FROM playlists
        LEFT JOIN collaborations ON playlists.id = collaborations.playlist_id
        WHERE playlists.id = $1 AND (playlists.owner = $2 OR collaborations.user_id = $2)
      `,
      values: [id, owner],
    };

    const result = await this.pool.query(query);
    if (!result.rowCount) {
      throw new ForbiddenError('Anda tidak memiliki akses ke playlist ini');
    }

    return result.rows[0].id;
  }

  async checkOwnerToPlaylist({ id, owner }) {
    const query = {
      text: 'SELECT * FROM playlists WHERE id = $1 AND owner = $2',
      values: [id, owner],
    };

    const result = await this.pool.query(query);
    if (!result.rowCount) {
      throw new ForbiddenError('Anda bukan pemilik playlist ini');
    }

    return result.rows[0].id;
  }

  async deletePlaylist({ id }) {
    const query = {
      text: 'DELETE FROM playlists WHERE id = $1 RETURNING owner',
      values: [id],
    };

    const result = await this.pool.query(query);
    if (!result.rowCount) {
      throw new NotFoundError('Playlist gagal dihapus, Id tidak ditemukan!');
    }

    this.cacheService.delete(`playlists:${result.rows[0].owner}`);
  }

  async getSongsFromPlaylist({ playlistId }) {
    const query = {
      text: `
        SELECT * FROM songs
        INNER JOIN playlist_songs ON songs.id = playlist_songs.song_id
        WHERE playlist_songs.playlist_id = $1
      `,
      values: [playlistId],
    };

    const result = await this.pool.query(query);
    return result.rows;
  }

  async addSongToPlaylist({ playlistId, songId }) {
    const id = `album-${nanoid(16)}`;
    const query = {
      text: 'INSERT INTO playlist_songs VALUES($1, $2, $3) RETURNING id',
      values: [id, playlistId, songId],
    };

    const result = await this.pool.query(query);
    if (!result.rows[0].id) {
      return new InvariantError('Lagu gagal ditambahkan ke playlist');
    }

    return result.rows[0].id;
  }

  async deleteSongFromPlaylist({ playlistId, songId }) {
    const query = {
      text: 'DELETE FROM playlist_songs WHERE playlist_id = $1 AND song_id = $2 RETURNING id',
      values: [playlistId, songId],
    };

    const result = await this.pool.query(query);
    if (!result.rowCount) {
      throw new NotFoundError('Lagu playlist gagal dihapus, Data tidak ditemukan!');
    }
  }
}

module.exports = PlaylistsService;
