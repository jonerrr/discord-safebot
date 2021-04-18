const config = require("./config.json");
const filter = require("./filter");

const axios = require("axios");
const fs = require("fs");

const options = {
  headers: {
    authorization: config.token,
    "User-Agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 11_2_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.128 Safari/537.36",
  },
};

function sleep(time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

const beat = (ws, time, code) => {
  setTimeout(function () {
    ws.send(
      JSON.stringify({
        op: 1,
        d: code,
      })
    );
    console.log("Heartbeat sent");
  }, time);
};

const del = async (channel, id) => {
  try {
    await sleep(config.time * 1000);

    await axios.delete(
      `https://discord.com/api/v8/channels/${channel}/messages/${id}`,
      options
    );
  } catch (e) {
    if (e.response.status === 429) {
      setTimeout(async () => {
        await axios.delete(
          `https://discord.com/api/v8/channels/${channel}/messages/${id}`,
          options
        );
      }, 1000 * e.response.data.retry_after);
      return;
    }

    console.log(e);
    console.log(
      `Error deleting message. Channel ID: ${channel} Message ID: ${id}`
    );
  }
};

const edit = async (content, channel, id) => {
  try {
    await sleep(config.time * 1000);

    await axios.patch(
      `https://discord.com/api/v8/channels/${channel}/messages/${id}`,
      {
        content: filter.clean(content),
      },
      options
    );
  } catch (e) {
    if (e.response.status === 429) {
      setTimeout(async () => {
        await axios.patch(
          `https://discord.com/api/v8/channels/${channel}/messages/${id}`,
          {
            content: filter.clean(content),
          },
          options
        );
      }, 1000 * e.response.data.retry_after);
      return;
    }
    console.log(e);
    console.log(
      `Error editing message "${content}". Channel ID: ${channel} Message ID: ${id}`
    );
  }
};

const reconnect = (ws, session, seq) => {
  console.log("Reconnecting");
  ws.send(
    JSON.stringify({
      op: 6,
      d: {
        token: config.token,
        session_id: session,
        seq: seq,
      },
    })
  );
};

const save = (link, id, channel) => {
  const File = fs.readFileSync("./links.json");
  const file = JSON.parse(File);
  file[id] = link;
  fs.writeFileSync("./links.json", JSON.stringify(file));
  del(channel, id);
};

const ip_regex = /^((([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$|^(([a-fA-F]|[a-fA-F][a-fA-F0-9\-]*[a-fA-F0-9])\.)*([A-Fa-f]|[A-Fa-f][A-Fa-f0-9\-]*[A-Fa-f0-9])$|^(?:(?:(?:(?:(?:(?:(?:[0-9a-fA-F]{1,4})):){6})(?:(?:(?:(?:(?:[0-9a-fA-F]{1,4})):(?:(?:[0-9a-fA-F]{1,4})))|(?:(?:(?:(?:(?:25[0-5]|(?:[1-9]|1[0-9]|2[0-4])?[0-9]))\.){3}(?:(?:25[0-5]|(?:[1-9]|1[0-9]|2[0-4])?[0-9])))))))|(?:(?:::(?:(?:(?:[0-9a-fA-F]{1,4})):){5})(?:(?:(?:(?:(?:[0-9a-fA-F]{1,4})):(?:(?:[0-9a-fA-F]{1,4})))|(?:(?:(?:(?:(?:25[0-5]|(?:[1-9]|1[0-9]|2[0-4])?[0-9]))\.){3}(?:(?:25[0-5]|(?:[1-9]|1[0-9]|2[0-4])?[0-9])))))))|(?:(?:(?:(?:(?:[0-9a-fA-F]{1,4})))?::(?:(?:(?:[0-9a-fA-F]{1,4})):){4})(?:(?:(?:(?:(?:[0-9a-fA-F]{1,4})):(?:(?:[0-9a-fA-F]{1,4})))|(?:(?:(?:(?:(?:25[0-5]|(?:[1-9]|1[0-9]|2[0-4])?[0-9]))\.){3}(?:(?:25[0-5]|(?:[1-9]|1[0-9]|2[0-4])?[0-9])))))))|(?:(?:(?:(?:(?:(?:[0-9a-fA-F]{1,4})):){0,1}(?:(?:[0-9a-fA-F]{1,4})))?::(?:(?:(?:[0-9a-fA-F]{1,4})):){3})(?:(?:(?:(?:(?:[0-9a-fA-F]{1,4})):(?:(?:[0-9a-fA-F]{1,4})))|(?:(?:(?:(?:(?:25[0-5]|(?:[1-9]|1[0-9]|2[0-4])?[0-9]))\.){3}(?:(?:25[0-5]|(?:[1-9]|1[0-9]|2[0-4])?[0-9])))))))|(?:(?:(?:(?:(?:(?:[0-9a-fA-F]{1,4})):){0,2}(?:(?:[0-9a-fA-F]{1,4})))?::(?:(?:(?:[0-9a-fA-F]{1,4})):){2})(?:(?:(?:(?:(?:[0-9a-fA-F]{1,4})):(?:(?:[0-9a-fA-F]{1,4})))|(?:(?:(?:(?:(?:25[0-5]|(?:[1-9]|1[0-9]|2[0-4])?[0-9]))\.){3}(?:(?:25[0-5]|(?:[1-9]|1[0-9]|2[0-4])?[0-9])))))))|(?:(?:(?:(?:(?:(?:[0-9a-fA-F]{1,4})):){0,3}(?:(?:[0-9a-fA-F]{1,4})))?::(?:(?:[0-9a-fA-F]{1,4})):)(?:(?:(?:(?:(?:[0-9a-fA-F]{1,4})):(?:(?:[0-9a-fA-F]{1,4})))|(?:(?:(?:(?:(?:25[0-5]|(?:[1-9]|1[0-9]|2[0-4])?[0-9]))\.){3}(?:(?:25[0-5]|(?:[1-9]|1[0-9]|2[0-4])?[0-9])))))))|(?:(?:(?:(?:(?:(?:[0-9a-fA-F]{1,4})):){0,4}(?:(?:[0-9a-fA-F]{1,4})))?::)(?:(?:(?:(?:(?:[0-9a-fA-F]{1,4})):(?:(?:[0-9a-fA-F]{1,4})))|(?:(?:(?:(?:(?:25[0-5]|(?:[1-9]|1[0-9]|2[0-4])?[0-9]))\.){3}(?:(?:25[0-5]|(?:[1-9]|1[0-9]|2[0-4])?[0-9])))))))|(?:(?:(?:(?:(?:(?:[0-9a-fA-F]{1,4})):){0,5}(?:(?:[0-9a-fA-F]{1,4})))?::)(?:(?:[0-9a-fA-F]{1,4})))|(?:(?:(?:(?:(?:(?:[0-9a-fA-F]{1,4})):){0,6}(?:(?:[0-9a-fA-F]{1,4})))?::)))))$/;
const url_regex = /[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)?/gi;

module.exports = { beat, edit, del, reconnect, save, ip_regex, url_regex };
