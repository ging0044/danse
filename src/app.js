require("dotenv").config();

import Eris from "eris";
import ydl from "youtube-dl";
import { getStopByChannelID, updateStop, createOrUpdateStop } from "./db";

const eris = new Eris(process.env.TOKEN);

/**
 * @type {function(this:null)}
 */
const playRite =
  playYoutube.bind(null, process.env.MUSIC_URL);

eris.on("ready", () => {
  eris.on("voiceChannelJoin", voiceChannelJoin);
  eris.on("voiceChannelLeave", voiceChannelLeave);
  eris.on("messageCreate", messageCreate);

  console.info("Ready");
});

eris.connect();

/**
 * Joins a voice channel and plays youtube audio
 * @param member
 * @param channel
 * @returns {Promise.<void>}
 */
async function voiceChannelJoin(member, channel) {
  if (inVoiceChannel(eris, channel))
    return;

  const { dataValues: { stopped } } = await getStopByChannelID(channel.id || channel);

  if (stopped)
    return;

  let channelID;

  switch (typeof channel) {
    case "string":
      channelID = channel;
      break;
    case "object":
      channelID = channel.id;
      break;
  }

  eris.joinVoiceChannel(channelID)
    .then(playRite)
    .catch(console.error);
}

/**
 * Leaves the channel if empty
 * @param member
 * @param channel
 */
function voiceChannelLeave(member, channel) {
  if (!channelEmpty(channel))
    return;

  eris.leaveVoiceChannel(channel.id);
}

/**
 * Checks if message ends with '~` and responds accordingly
 * @param message
 */
function messageCreate(message) {
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
}

/**
 * responds to `stop~` command; stops playing music and listening on channel,
 * then leaves
 * @param message
 * @returns {Promise.<void>}
 */
async function stop(message) {
  if (!isInVoice(message.member)) {
    message.channel.createMessage("join a voice chat first, desu")
      .catch(console.error);
    return;
  }

  const voiceID = message.member.voiceState.channelID;

  const { dataValues: { stopped } } = await getStopByChannelID(voiceID);

  if (stopped) {
    message.channel.createMessage("already stopped, desu!")
      .catch(console.error);
    return;
  }

  createOrUpdateStop(voiceID, stop);

  try {
    eris.voiceConnections.find(x => x.channelID === voiceID).stopPlaying();
  } catch (e) {}
  eris.leaveVoiceChannel(voiceID);

  message.channel.createMessage("stopped, desu!");
}

/**
 * responds to 'go~' command; starts listening on channel, joins, plays music
 * @param message
 * @returns {Promise.<void>}
 */
async function go(message) {
  if (!isInVoice(message.member)) {
    message.channel.createMessage("join a voice chat first, desu")
      .catch(console.error);
    return;
  }

  const voiceID = message.member.voiceState.channelID;
  const { dataValues: { stopped } } = await getStopByChannelID(voiceID);

  if (!stopped) {
    if (!inVoiceChannel(eris, voiceID)) {
      voiceChannelJoin(null, voiceID)
        .catch(console.error);
      message.channel.createMessage("going, desu!")
        .catch(console.error);
      return;
    }

    message.channel.createMessage("not stopped, desu!")
      .catch(console.error);
    return;
  }

  updateStop(voiceID, false)
    .catch(console.error);

  voiceChannelJoin(null, voiceID)
    .catch(console.error);

  message.channel.createMessage("going, desu!")
    .catch(console.error);
}

/**
 * checks if bot is already in voice channel
 * @param client
 * @param channel
 * @returns {boolean}
 */
function inVoiceChannel(client, channel) {
  return (
    (channel.voiceMembers && !!channel.voiceMembers.find(x => x.id === client.user.id)) ||
    (client.voiceConnections && !!client.voiceConnections.find(x => x.id === (channel.id || channel)))
  );
}

/**
 * checks if user is in voice channel
 * @param member
 * @returns {boolean}
 */
function isInVoice(member) {
  return !!member.voiceState.channelID;
}

/**
 * checks if voice channel is empty
 * @param channel
 * @returns {boolean}
 */
function channelEmpty(channel) {
  return (
    channel.voiceMembers.size === 0 ||
    (
      channel.voiceMembers.size === 1 &&
      channel.voiceMembers.has(eris.user.id)
    )
  );
}

/**
 * plays resource to voice connection
 * @param resource
 * @param connection
 * @returns {*}
 */
function playMusic(resource, connection) {
  connection.play(resource);
  return connection;
}

/**
 * takes link and returns resource
 * @param source
 * @returns {stream}
 */
function openYoutube(source) {
  return ydl(source);
}

/**
 * take a link and plays audio through voice connection
 * @param link
 * @param connection
 * @returns {*}
 */
function playYoutube(link, connection) {
  return playMusic(openYoutube(link), connection);
}
