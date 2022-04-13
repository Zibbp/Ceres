import { HttpService } from '@nestjs/axios';
import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import * as fs from 'fs';
import { firstValueFrom } from 'rxjs';
import * as cpy from 'cpy';

@Injectable()
export class FilesService {
  private logger = new Logger('FilesService');
  constructor(
    private httpService: HttpService,
  ) { }
  async createFolder(folderName: string) {
    try {
      if (await !fs.existsSync(`/mnt/vods/${folderName}`)) {
        await fs.mkdirSync(`/mnt/vods/${folderName}`, { recursive: true });
      }
    } catch (error) {
      this.logger.error('Error creating folder', error);
      throw new InternalServerErrorException(
        `Error creating folder /mnt/vods/${folderName}`,
      );
    }
  }
  async downloadChannelImage(url: string, channel: string, fileName: string) {
    try {
      const imageReq = await this.httpService.get(url, {
        responseType: 'arraybuffer',
      });
      const response = await firstValueFrom(imageReq);

      await fs.writeFileSync(`/mnt/vods/${channel}/${fileName}`, response.data);
    } catch (error) {
      this.logger.error('Error downloading channel image', error);
      throw new InternalServerErrorException(`Error downloading channel image`);
    }
  }
  async downloadVodThumnail(url: string, path: string) {
    try {
      const imageReq = await this.httpService.get(url, {
        responseType: 'arraybuffer',
      });
      const response = await firstValueFrom(imageReq);

      await fs.writeFileSync(`/mnt/vods/${path}`, response.data);
    } catch (error) {
      this.logger.error('Error downloading vod thumbnail image', error);
      throw new InternalServerErrorException(
        `Error downloading vod thumbnail image`,
      );
    }
  }
  async writeFile(fileName: string, data: string) {
    try {
      await fs.writeFileSync(`/mnt/vods/${fileName}`, data);
    } catch (error) {
      this.logger.error('Error writing file', error);
      throw new InternalServerErrorException(
        `Error writing file /mnt/vods/${fileName}`,
      );
    }
  }
  async moveFile(source: string, destination: string) {
    try {
      await cpy(source, destination);
      await fs.unlinkSync(source);
    } catch (error) {
      this.logger.error('Error copying file', error);
      throw new InternalServerErrorException(
        `Error copying file ${source} to ${destination}`,
      );
    }
  }
  async deleteFolder(path: string) {
    try {
      if (fs.existsSync(path)) {
        fs.rmSync(path, { recursive: true });
      }
    } catch (error) {
      this.logger.error('Error deleting folder', error);
      throw new InternalServerErrorException(`Error deleting folder ${path}`);
    }
  }
  async liveChatParser(path: string, streamInfo) {
    try {
      let newChatJson = {
        "streamer": {
          "name": streamInfo.user_name,
          "id": streamInfo.user_id
        },
        "comments": []
      }
      // Read live stream chat
      const chatFile = fs.readFileSync(path, 'utf8')
      const chatJson = JSON.parse(chatFile)
      //! Beging chat parsing
      this.logger.log(`Parsing live chat for stream ${streamInfo.id}`)
      // Use first chat message as start of stream
      const firstMessageTimestamp = chatJson[0].timestamp.toString()
      const firstMessageEpoch = firstMessageTimestamp.slice(0, -3)
      const startTime = new Date(parseInt(firstMessageEpoch))
      // Loop over each chat message
      for await (const message of chatJson) {
        // First message or two is always blank for some reason
        if (!message.message) {
          continue
        }
        const messageTimestampRaw = message.timestamp.toString()
        const messageTimestampEpoch = messageTimestampRaw.slice(0, -3)
        const messageTimestamp = new Date(parseInt(messageTimestampEpoch))
        // Calculate time offset since first message in seconds
        const offsetSeconds = (messageTimestamp.getTime() - startTime.getTime()) / 1000
        // Form new comment object that is supported by TwitchDownloader Chat Rendering
        let comment = <any>{}
        // Assign comment properties
        comment._id = message.message_id
        comment.source = "chat" // will always be chat
        comment.content_offset_seconds = offsetSeconds
        comment.commenter = {}
        comment.commenter.display_name = message.author.display_name
        comment.commenter.id = message.author.id
        comment.commenter.is_moderator = message.author.is_moderator
        comment.commenter.is_subscriber = message.author.is_subscriber
        comment.commenter.is_turbo = message.author.is_turbo
        comment.commenter.name = message.author.name
        comment.message = {}
        comment.message.body = message.message
        comment.message.bits_spent = 0 // chat-downloader does not support bits
        comment.message.fragments = [
          {
            text: message.message,
            emoticon: null,
          }
        ]
        comment.message.user_badges = []
        comment.message.user_color = message.colour
        comment.message.user_notice_params = {
          "msg-id": null
        }

        // Extract emotes and create fragments with positions
        let emoteFragmentArray = []
        if (message.emotes) {
          for await (const emote of message.emotes) {
            // if emotes are used more than once they have multiple locations
            for await (const location of emote.locations) {
              const emotePositions = location.split('-')
              const pos1 = parseInt(emotePositions[0])
              const pos2 = parseInt(emotePositions[1]) + 1
              const slicedEmote = message.message.slice(pos1, pos2)
              const emoteFragment = {
                text: slicedEmote,
                emoticon: {
                  "emoticon_id": emote.id,
                  "emoticon_set_id": ""
                },
                pos1,
                pos2
              }
              emoteFragmentArray.push(emoteFragment)
            }
          }
        }


        // Sort emote fragments by position ascending
        const sortedEmoteFragmentArray = emoteFragmentArray.sort(function (a, b) { return a.pos1 - b.pos1 })

        // Split message into fragments containing emote and non-emote text
        const newMessageFragments = []
        for await (const [index, emoteFragment] of sortedEmoteFragmentArray.entries()) {
          if (index === 0) {
            const fragmentText = message.message.slice(0, emoteFragment.pos1)
            const textFragment = {
              text: fragmentText,
              emoticon: null,
            }
            newMessageFragments.push(textFragment)
            newMessageFragments.push(emoteFragment)
          } else {
            const fragmentText = message.message.slice(sortedEmoteFragmentArray[index - 1].pos2, emoteFragment.pos1)
            const textFragment = {
              text: fragmentText,
              emoticon: null,
            }
            newMessageFragments.push(textFragment)
            newMessageFragments.push(emoteFragment)
          }
        }

        if (newMessageFragments.length > 0) {
          comment.message.fragments = newMessageFragments
        }

        // Push user badges to object
        if (message.author.badges) {
          for await (const badge of message.author.badges) {
            let badgeObject = {}
            badgeObject['_id'] = badge.name
            badgeObject['version'] = badge.version
            comment.message.user_badges.push(badgeObject)
          }
        }
        // Some users don't have a color set
        if (comment.message.user_color == "") {
          comment.message.user_color = "#a65ee8"
        }

        // Push comment to new chat object
        newChatJson.comments.push(comment)
      }
      // Write new chat object to file
      fs.writeFileSync(`/tmp/${streamInfo.id}_live_chat.json`, JSON.stringify(newChatJson))
      this.logger.log(`Raw stream chat parsed and saved to /tmp/${streamInfo.id}_live_chat.json`)
    } catch (error) {
      this.logger.error('Error parsing live chat file', error);
    }
  }
}
