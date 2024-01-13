/* eslint-disable no-console */

class Listener {
  constructor(musicService, mailSender) {
    this.musicService = musicService;
    this.mailSender = mailSender;

    this.listen = this.listen.bind(this);
  }

  async listen(message) {
    try {
      const { playlistId, targetEmail } = JSON.parse(message.content.toString());

      const playlist = await this.musicService.getPlaylistById({ id: playlistId });
      const songs = await this.musicService.getSongsFromPlaylistId({ id: playlistId });

      const data = {
        playlist: {
          id: playlist.id,
          name: playlist.name,
          songs: songs.map((song) => ({
            id: song.id,
            title: song.title,
            performer: song.performer,
          })),
        },
      };

      const result = await this.mailSender.sendEmail(targetEmail, JSON.stringify(data));
      console.log(result);
    } catch (error) {
      console.error(error);
    }
  }
}

module.exports = Listener;
