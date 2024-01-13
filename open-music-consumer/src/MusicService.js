const { Pool } = require('pg');

class MusicService {
  constructor() {
    this.pool = new Pool();
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
    return result.rows[0];
  }

  async getSongsFromPlaylistId({ id }) {
    const query = {
      text: `
        SELECT * FROM songs
        INNER JOIN playlist_songs ON songs.id = playlist_songs.song_id
        WHERE playlist_songs.playlist_id = $1
      `,
      values: [id],
    };

    const result = await this.pool.query(query);
    return result.rows;
  }
}

module.exports = MusicService;
