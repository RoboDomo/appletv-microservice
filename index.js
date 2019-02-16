const console = require("console");

const atv = require("node-appletv"),
  { AppleTV, scan, parseCredentials } = atv;

const creds =
    "2CACEC26-98C3-45E7-BA30-7C3DA36ED7FF:31423334334643312d313238332d343745412d393341392d324433453744333844363742:39623063623562372d363664352d346334652d396365322d333637663135303866333866:1b8d1cbe93dc9c5d1ea317d71bd5159ea9580c99a353c4448f31f8a48881fc0f:4deb02b842903c4f699bec4ac4d9cc68a05492719fbf017f77c1da00f733dec3",
  credentials = parseCredentials(creds);

//const sleep = async n => {
//  return new Promise(resolve => {
//    setTimeout(() => {
//      resolve();
//    }, n);
//  });
//};

const main = async () => {
  console.log("keys", AppleTV.Key);
  try {
    const devices = await scan(credentials.uniqueIdentifier);
    let dev;
    for (const device of devices) {
      if (device.name === "THEATER") {
        dev = device;
      }
    }
    // devices is an array of AppleTV objects
    dev.on("error", e => {
      console.log("device error");
      console.log(e.message);
      console.log(e.stack);
    });

    let d = await dev.openConnection(credentials);
    console.log("connected", d.address);
    d.on("nowPlaying", info => {
      if (!info) {
        console.log("null info");
        return;
      }
      const message = info.message;
      if (message) {
        console.log(
          info.message.displayName,
          info.message.playbackState,
          info.message.nowPlayingInfo.title,
          "duration",
          info.duration / 60,
          "elapsed",
          info.elapsedTime / 60
        );
      }
      //      console.log("info", info);
      //      console.log("supportedCommands", info.message.supportedCommands);
    });
    d.on("supportedCommands", x => {
      console.log("supportedCommands", x);
    });
    //    await sleep(10000);
  } catch (e) {
    console.log("exception");
    console.log(e.message);
    console.log(e.stack);
  }
};
main();
