const config = require("./config.json");
const util = require("./util");
const filter = require("./filter");

const WebSocket = require("ws");

const ws = new WebSocket("wss://gateway.discord.gg/?encoding=json&v=8");

let session;
let seq;

ws.on("open", function open() {
  ws.send(
    JSON.stringify({
      op: 2,
      d: {
        token: config.token,
        capabilities: 61,
        properties: {
          os: "Mac OS X",
          browser: "Chrome",
          device: "",
          system_locale: "en-US",
          browser_user_agent:
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 11_2_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.128 Safari/537.36",
          browser_version: "89.0.4389.128",
          os_version: "11.2.0",
          referrer: "",
          referring_domain: "",
          referrer_current: "",
          referring_domain_current: "",
          release_channel: "stable",
          client_build_number: 82590,
          client_event_source: null,
        },
        presence: {
          status: "online",
          since: 0,
          activities: [],
          afk: false,
        },
        compress: false,
        client_state: {
          guild_hashes: {},
          highest_last_message_id: "0",
          read_state_version: 0,
          user_guild_settings_version: -1,
        },
      },
    })
  );
});

ws.on("message", function incoming(Data) {
  const data = JSON.parse(Data);
  seq = data.s;

  if (data.op === 10) util.beat(ws, data.d.heartbeat_interval, data.s);

  if (data.t === "READY") {
    session = data.d.session_id;
    console.log("Client Ready");
  }
  if (data.t === "MESSAGE_CREATE" || data.t === "MESSAGE_UPDATE") {
    if (data.d.author.id !== config.id) return;

    if (filter.isProfane(data.d.content) || data.d.content.match(util.regex))
      config.delete
        ? util.del(data.d.channel_id, data.d.id)
        : util.edit(data.d.content, data.d.channel_id, data.d.id);
  }

  if (data.op === 7) util.reconnect(ws, session, seq);
});
