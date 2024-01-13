const { nanoid } = require('nanoid');
const { Pool } = require('pg');
const InvariantError = require('../../exceptions/InvariantError');

class PlaylistActivitiesService {
  constructor(cacheService) {
    this.pool = new Pool();
    this.cacheService = cacheService;
  }

  async addActivity({
    playlistId, songId, userId, action,
  }) {
    const id = `activity-${nanoid(16)}`;
    const time = new Date().toISOString();

    const query = {
      text: 'INSERT INTO playlist_song_activities values($1, $2, $3, $4, $5, $6) RETURNING id',
      values: [id, playlistId, songId, userId, action, time],
    };

    const result = await this.pool.query(query);

    if (!result.rows[0].id) {
      return new InvariantError('Activity gagal ditambahkan');
    }

    this.cacheService.delete(`activity:${playlistId}`);
    return result.rows[0].id;
  }

  async getActivities({ playlistId }) {
    let data = [];
    let isCache = false;

    try {
      const result = await this.cacheService.get(`activity:${playlistId}`);
      data = JSON.parse(result);
      isCache = true;
    } catch (error) {
      const query = {
        text: `
          SELECT u.username as username, songs.title as title, activity.action as action, activity.time as time
          FROM playlist_song_activities as activity
          INNER JOIN users AS u ON activity.user_id = u.id
          INNER JOIN songs ON activity.song_id = songs.id
          WHERE activity.playlist_id = $1
        `,
        values: [playlistId],
      };

      const result = await this.pool.query(query);
      if (!result.rowCount) {
        return new InvariantError('Activity tidak ditemukan');
      }

      data = result.rows;
      await this.cacheService.set(`activity:${playlistId}`, JSON.stringify(data));
    }

    return {
      data, isCache,
    };
  }
}

module.exports = PlaylistActivitiesService;
