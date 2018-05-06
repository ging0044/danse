require("dotenv").config();

import Eris from "eris";
import ydl from "youtube-dl";

const eris = new Eris(process.env.TOKEN);
const stopped = new Map();

const playRite =
  playYoutube.bind(null, process.env.MUSIC_URL);

eris.on("ready", () => {
  console.log("Ready");
});

eris.on("voiceChannelJoin", (member, channel) => {
  if (inVoiceChannel(eris, channel))
    return;

  if (stopped[channel.id])
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
      stop(message);
      break;
    case "go~":
      go(message);
      break;
  }
});

eris.connect();

function inVoiceChannel(client, channel) {
  return client.voiceConnections.map(x => x.id).includes(channel.id);
}

function isInVoice(member) {
  return !!member.voiceState.channelID;
}

function stop(message) { // TODO: get rid of this repetitive code
  if (!isInVoice(message.member))
    message.channel.createMessage("join a voice chat first, desu");

  if (stopped[message.member.voiceState.channelID])
    message.channel.createMessage("already stopped, desu!");

  stopped[message.member.voiceState.channelID] = true;
  eris.voiceConnections.find(x => x.id = message.member.voiceState.channelID).stopPlaying();
  message.channel.leave();
}

function go(message) {
  if (!isInVoice(message.member))
    message.channel.createMessage("join a voice chat first, desu");

  if (!stopped[message.member.voiceState.channelID])
    message.channel.createMessage("not stopped, desu!");

  delete stopped[message.member.voiceState.channelID];
}

function channelEmpty(channel) {
  return channel.voiceMembers.length === 0;
}

function playMusic(resource, connection) {
  connection.play(resource);
  return connection;
}

function openResource(source) {
  return ydl(source);
}

function playYoutube(link, connection) {
  return playMusic(openResource(link), connection);
}
