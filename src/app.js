require("dotenv").config();

import Eris from "eris";
import ydl from "youtube-dl";
import Sequelize from "sequelize";
import fs from "fs";
import path from "path";

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USERNAME,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: process.env.DB_TYPE,
    dialectOptions: {
      ssl: {
        ca: fs.readFileSync(path.join(__dirname, "../keys/ca.key")).toString(),
        key: fs.readFileSync(path.join(__dirname, "../keys/client.root.key")).toString(),
        cert: fs.readFileSync(path.join(__dirname, "../keys/client.root.crt")).toString(),
      },
    },
    port: process.env.DB_PORT,
    operatorsAliases: false,
  }
);

const Stop = sequelize.define("stop", {
  id: {
    type: Sequelize.STRING,
    primaryKey: true,
  },
  stopped: {
    type: Sequelize.BOOLEAN,
  },
});

const eris = new Eris(process.env.TOKEN);

const playRite =
  playYoutube.bind(null, process.env.MUSIC_URL);

eris.on("ready", () => {

  eris.on("voiceChannelJoin", async (member, channel) => {
    if (inVoiceChannel(eris, channel))
      return;

    const stopped = await Stop.find({
      where: {
        id: {
          [Sequelize.Op.eq]: channel.id,
        }
      },
    });

    if (stopped)
      return;

    channel
      .join()
      .then(playRite)
      .catch(console.error);
  });

  eris.on("voiceChannelLeave", (member, channel) => {
    if (!channelEmpty(channel))
      return;

    channel.leave();
  });

  eris.on("messageCreate", (message) => {
    if (message.author.id === eris.user.id)
      return;

    if (message.content.slice(-1) !== "~")
      return;

    switch (message.content) {
      case "stop~":
        stop(message)
          .catch(console.error);
        break;
      case "go~":
        go(message)
          .catch(console.error);
        break;
    }
  });

  console.log("Ready");
});

eris.connect();

function inVoiceChannel(client, channel) {
  return (
    client.voiceConnections.map(x => x.id).includes(channel.id) ||
    channel.voiceMembers.map(x => x.id).includes(client.user.id)
  );
}

function isInVoice(member) {
  return !!member.voiceState.channelID;
}

async function stop(message) { // TODO: get rid of this repetitive code
  if (!isInVoice(message.member))
    message.channel.createMessage("join a voice chat first, desu")
      .catch(console.error);

  const voiceID = message.member.voiceState.channelID;

  const stopped = await Stop.find({
    where: {
      id: {
        [Sequelize.Op.eq]: voiceID,
      }
    }
  });

  if (stopped) {
    message.channel.createMessage("already stopped, desu!")
      .catch(console.error);
    return;
  }

  Stop.create({
    id: voiceID,
  });

  eris.voiceConnections.find(x => x.id === voiceID).stopPlaying();
  eris.leaveVoiceChannel(voiceID);
}

async function go(message) {
  if (!isInVoice(message.member))
    message.channel.createMessage("join a voice chat first, desu")
      .catch(console.error);

  const voiceID = message.member.voiceState.channelID;

  const stopped = await Stop.find({
    where: {
      id: {
        [Sequelize.Op.eq]: voiceID,
      }
    }
  });

  if (!stopped) {
    message.channel.createMessage("not stopped, desu!")
      .catch(console.error);
  }

  Stop.update({
    stopped: false,
  }, {
    where: {
      id: {
        [Sequelize.Op.eq]: channel.id
      }
    },
  }).catch(console.error);
}

function channelEmpty(channel) {
  return channel.voiceMembers.length === 0;
}

function playMusic(resource, connection) {
  connection.play(resource);
  return connection;
}

function openYoutube(source) {
  return ydl(source);
}

function playYoutube(link, connection) {
  return playMusic(openYoutube(link), connection);
}
