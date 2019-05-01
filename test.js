const { AppleTV, scan, parseCredentials } = require("node-appletv");
const config = require("./config");

console.log("credentials", config, config.atv[0].creds);
let credentials = parseCredentials(config.atv[0].creds);

const main = async () => {
  const devices = await scan(credentials.uniqueIdentifier);
  const device = await devices[0].openConnection(credentials);
  console.log("connected");
  //  device.on("debug", message => console.log("debug", message));
  device.on("nowPlaying", message =>
    console.log("message", message.title, message.playbackState)
  );
};
main();
