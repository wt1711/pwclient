import { MATRIX_BOT_NAME, MATRIX_HOMESERVER } from '@/constants';
import '@/lib/polyfills';
import * as sdk from 'matrix-js-sdk';
import { MsgType } from 'matrix-js-sdk';

export interface ICookiesObject {
  rur: string;
  ps_n: string;
  ps_l: string;
  ds_user_id: string;
  mid: string;
  ig_did: string;
  sessionid: string;
  datr: string;
  dpr: string;
  wd: string;
  csrftoken: string;
}

class MatrixClient {
  private client: sdk.MatrixClient;
  public botName: string;
  public homeServer: string;

  constructor({
    homeServer,
    accessToken,
    userId,
    deviceId,
    botName,
  }: {
    homeServer?: string;
    accessToken?: string;
    userId?: string;
    deviceId?: string;
    botName?: string;
  }) {
    this.homeServer = homeServer || MATRIX_HOMESERVER;
    this.client = sdk.createClient({
      baseUrl: this.homeServer,
      accessToken,
      userId,
      deviceId,
    });
    this.botName = botName || MATRIX_BOT_NAME;
    console.log(`Matrix client initialized with bot name: ${this.botName}`);
  }

  async login(username: string, password: string) {
    const response = await this.client.loginRequest({
      type: 'm.login.password',
      user: username,
      password,
    });
    return response;
  }

  async startClient() {
    // Start syncing to populate local room cache
    console.log('Starting client sync...');
    await this.client.startClient();

    // Wait for initial sync to complete
    await new Promise((resolve: (value: void | PromiseLike<void>) => void) => {
      this.client.once(sdk.ClientEvent.Sync, (state: sdk.SyncState) => {
        console.log('Sync state:', state);
        if (state === sdk.SyncState.Prepared) {
          resolve();
        }
      });
    });
  }

  async stopClient() {
    // Stop syncing to populate local room cache
    console.log('Stopping client sync...');
    this.client.stopClient();
  }

  async getMessagesFromRoom(roomId: string, limit = 50) {
    try {
      await this.startClient();
      console.log(`📥 Getting messages from room: ${roomId}`);

      const room = this.client.getRoom(roomId);
      if (!room) {
        throw new Error(`Room ${roomId} not found`);
      }

      // Get timeline events (messages)
      const timeline = room.getLiveTimeline();
      const events = timeline.getEvents();

      // Filter for message events
      const messages = events
        .filter((event) => event.getType() === 'm.room.message')
        .slice(-limit) // Get last N messages
        .map((event) => ({
          eventId: event.getId(),
          sender: event.getSender(),
          senderName: room.getMember(event.getSender() ?? '')?.name || event.getSender(),
          timestamp: new Date(event.getTs()),
          content: event.getContent(),
          body: event.getContent().body || '',
          msgtype: event.getContent().msgtype || 'm.text',
        }));

      console.log(`✅ Retrieved ${messages.length} messages from room`);
      return messages;
    } catch (error) {
      console.error(`❌ Error getting messages from room ${roomId}:`, error);
      throw error;
    } finally {
      await this.stopClient();
    }
  }

  async acceptAllDmInvitations() {
    try {
      await this.startClient();
      console.log('🚪 Accepting all DM invitations...');

      const invitedRooms = this.client.getRooms().filter((room) => {
        const membership = room.getMyMembership();
        if (membership !== 'invite') return false;

        // Filter out spaces (room type: m.space)
        const roomType = room.currentState.getStateEvents('m.room.create', '')?.getContent()?.type;
        if (roomType === 'm.space') return false;

        // Filter out bot invitations (check if inviter is a bot)
        const inviter = room.getDMInviter();
        if (inviter) {
          // Common bot patterns
          const botPatterns = [
            /bot$/i, // ends with 'bot'
            /^@.*bot:/i, // starts with @...bot:
            /bridge/i, // contains 'bridge'
            /service/i, // contains 'service'
            /admin/i, // contains 'admin'
            /system/i, // contains 'system'
            /notification/i, // contains 'notification'
          ];

          const isBot = botPatterns.some((pattern) => pattern.test(inviter));
          if (isBot) return false;
        }

        return true;
      });

      if (invitedRooms.length > 0) {
        console.log(`Accepting ${invitedRooms.length} DM invitations...`);

        for (const room of invitedRooms) {
          try {
            console.log(`Accepting invitation to: ${room.name || room.roomId}`);
            await this.client.joinRoom(room.roomId);
            console.log(`✅ Successfully joined: ${room.name || room.roomId}`);

            // Small delay between joins to avoid rate limiting
            await new Promise((resolve) => setTimeout(resolve, 500));
          } catch (joinErr: unknown) {
            console.log(`❌ Failed to join ${room.name || room.roomId}:`, joinErr);
          }
        }

        console.log(`\n🎉 Finished processing ${invitedRooms.length} invitations`);
      } else {
        console.log('\n📭 No pending invitations to accept');
      }
    } catch (err) {
      console.log(err);
    } finally {
      await this.stopClient();
    }
  }

  async loginInstagram(metaBotRoomId: string, instagramCookies: ICookiesObject) {
    try {
      console.log(`🚀 Logging in Instagram with meta bot room id (${metaBotRoomId})...`);
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Send login instagram command
      await this.client.sendTextMessage(metaBotRoomId, 'login instagram');
      console.log('✅ Sent login instagram command');
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await this.client.sendTextMessage(metaBotRoomId, JSON.stringify(instagramCookies));
      console.log('✅ Sent Instagram cookies');

      return await this.checkLoginInstagramResult(metaBotRoomId, 3);
    } catch (err) {
      console.log(err);
    }
  }

  async checkLoginInstagramResult(
    metaBotRoomId: string,
    retries = 3,
    delay = 10000
  ): Promise<boolean> {
    try {
      console.log(`🚀 Checking login Instagram result with meta bot room id (${metaBotRoomId})...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      const messages = await this.getMessagesFromRoom(metaBotRoomId);
      const latestMessage = messages[messages.length - 1];
      if (
        latestMessage.body.includes('Logged in as') &&
        latestMessage.senderName === this.botName &&
        latestMessage.msgtype === MsgType.Notice
      ) {
        console.log('✅ Successfully logged in Instagram');
        return true;
      } else {
        if (retries <= 0) {
          console.log('❌ Failed to log in Instagram after retries');
          return false;
        }
        console.log(`❌ Failed to log in Instagram, retries left: ${retries}`);
        return await this.checkLoginInstagramResult(metaBotRoomId, retries - 1);
      }
    } catch (err) {
      console.log(err);
      return false;
    }
  }

  async createMetaBotRoom(name: string = 'Meta bot Room', botname?: string) {
    try {
      console.log(`🚀 Creating ${name} room with invite [${botname ?? this.botName}]...`);

      // Create a new DM room with the bot
      const createdRoom = await this.client.createRoom({
        invite: [botname || this.botName],
        name,
        is_direct: true,
        preset: sdk.Preset.PrivateChat,
        visibility: sdk.Visibility.Private,
      });

      const metaBotRoomId = createdRoom.room_id;
      await this.client.joinRoom(metaBotRoomId);

      return metaBotRoomId;
    } catch (err) {
      console.log(err);
    }
  }
}

export default MatrixClient;
