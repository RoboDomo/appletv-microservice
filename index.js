//process.env.DEBUG = "HostBase";

const console = require("console"),
  HostBase = require("microservice-core/HostBase");

const pyatv = require("@sebbo2002/node-pyatv");

const Config = require("./config");

const TOPIC_ROOT = process.env.TOPIC_ROOT || "appletv",
  MQTT_HOST = process.env.MQTT_HOST || "ha";

/*
pyatv
  .scan()
  .then(results => {
    results.forEach(atv => {
      const name = atv._options.name;
      console.log("atv", atv, name);
      const listener = atv.push();

      listener.on("error", error => {
        console.log(`Listener Error for ${name}: ${error}`);
      });
      listener.on("close", () => {
        console.log(`Listener for ${name} closed`);
      });
      listener.on("state", playing => {
        console.log(`${name} state playing`, playing);
      });

      //      setTimeout(() => {
      //        listener.close();
      //      }, 60000);
    });
  })
  .catch(error => {
    console.log("Error during scan:", error);
  });
  */

class AppleTVHost extends HostBase {
  constructor(host) {
    super(MQTT_HOST, `${TOPIC_ROOT}/${host.device}`);
    this.host = host;
    this.interval = null;

    this.connect();
  }

  stopTimer() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  startTimer() {
    console.log("startTimer", this.state.position);
    this.stopTimer();
    let elapsed = this.state.position || 0;
    this.interval = setInterval(() => {
      elapsed++;
      this.state = {
        elapsedTime: elapsed
      };
    }, 1000);
  }

  connect() {
    const host = this.host,
      name = host.name,
      atv = (this.atv = foundDevices[host.name]);

    const listener = atv.push();
    listener.on("error", error => {
      console.log(`Listener Error for ${name}: ${error}`);
    });

    listener.on("close", () => {
      console.log(`Listener for ${name} closed`);
      this.stopTimer();
    });

    listener.on("state", playing => {
      const oldState = this.state,
        newState = Object.assign(
          { title: null, artist: null, album: null, totalTime: 0 },
          playing
        );

      newState.info = playing;
      this.state = newState;
      console.log("oldState", oldState, "newState", newState);
      if (playing.playState === "playing") {
        this.startTimer();
      } else {
        this.stopTimer();
      }
      console.log(`${name} newState nowPlaying`, newState);
    });
  }

  async command(type, arg) {
    try {
      console.log("command", arg);
      switch (arg.toLowerCase()) {
        case "up":
          await this.atv.up();
          break;
        case "down":
          await this.atv.down();
          break;
        case "left":
          await this.atv.left();
          break;
        case "right":
          await this.atv.right();
          break;
        case "menu":
          await this.atv.menu();
          break;
        case "next":
          await this.atv.next();
          break;
        case "previous":
          await this.atv.previous();
          break;
        case "stop":
          await this.atv.stop();
          break;
        case "topmenu":
          await this.atv.topMenu();
          break;
        case "select":
          await this.atv.select();
          break;
        default:
          console.log("command invalid", arg);
          break;
      }
    } catch (e) {
      console.log("sendKeyCommand", e.message, e.stack);
    }
  }

  isStopped(info) {
    if (!info) {
      return true;
    }
    if (info.title !== "") {
      return false;
    }
    return true;
  }
}

const foundDevices = {},
  hosts = {};

const main = async () => {
  console.log("Scanning...");
  const results = await pyatv.scan();
  console.log("Starting...");
  for (const result of results) {
    const options = result._options;
    foundDevices[options.name] = result;
  }
  for (const device of Config.atv) {
    hosts[device.name] = new AppleTVHost(device);
  }
};
main();

/*
const atv = require("node-appletv"),
  { scan, parseCredentials } = atv;

//const atv = require("node-appletv"),
//  { AppleTV, scan, parseCredentials } = atv;

const Config = require("./config");

const TOPIC_ROOT = process.env.TOPIC_ROOT || "appletv",
  MQTT_HOST = process.env.MQTT_HOST || "ha";

const foundDevices = {};
const hosts = {};

// see https://github.com/Daij-Djan/DDHidLib/blob/master/usb_hid_usages.txt
const commands = {
  Suspend: [1, 0x85],
  Menu: [1, 0x86],
  Stop: [1, 0x88],
  Select: [1, 0x89],
  Right: [1, 0x8a],
  Left: [1, 0x8b],
  Up: [1, 0x8c],
  Down: [1, 0x8d],
  //
  Power: [12, 0x30],
  Reboot: [12, 0x31],
  Play: [12, 0xb0],
  Pause: [12, 0xb1],
  BeginForward: [12, 0xb3],
  BeginRewind: [12, 0xb4],
  SkipForward: [12, 0xb5],
  SkipBackward: [12, 0xb6]
};

class AppleTVHost extends HostBase {
  constructor(host) {
    super(MQTT_HOST, TOPIC_ROOT + "/" + host.device);
    this.host = host;
    this.dev = foundDevices[host.name];
    this.credentials = parseCredentials(host.creds);

    this.interval = null;

    //    this.state = { playbackState: "stopped" };
    // devices is an array of AppleTV objects
    this.dev.on("error", e => {
      console.log("device error");
      console.log(e.message);
      console.log(e.stack);
      setTimeout(async () => {
        await this.connect();
      }, 1);
    });

    setTimeout(async () => {
      await this.connect();
    }, 1);
  }

  async command(type, arg) {
    console.log("command", arg);
    try {
      // see https://github.com/Daij-Djan/DDHidLib/blob/master/usb_hid_usages.txt
      if (commands[arg]) {
        const [page, code] = commands[arg];
        console.log(
          `await this.dev.sendKeyPressAndRelease(${page}, 0x${code.toString(
            16
          )});`
        );
        await this.dev.sendKeyPressAndRelease(page, code);
      } else {
        console.log("invalid command ", arg);
        return;
      }
      //      await this.dev.sendKeyCommand(commands[arg]);
    } catch (e) {
      console.log("sendKeyCommand", e.message, e.stack);
    }
  }

  stopTimer() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  startTimer() {
    console.log("startTimer", this.state.elapsedTime);
    this.stopTimer();
    let elapsed = this.state.elapsedTime || 0;
    this.interval = setInterval(() => {
      elapsed++;
      this.state = {
        elapsedTime: elapsed
      };
    }, 1000);
  }

  isStopped(info) {
    if (!info) {
      return true;
    }
    if (info.title !== "") {
      return false;
    }
    return true;
  }

  async connect() {
    const d = await this.dev.openConnection(credentials);
    console.log("connected", d.address);
    //    this.state.timestamp = null;
    //    this.state.duration = null;
    //    this.state.elapsedTime = null;
    //    this.state.playbackRate = null;
    //    this.state.album = null;
    //    this.state.artist = null;
    //    this.state.appDisplayName = null;
    //    this.state.appBundleIdentifier = "NONE";
    //    this.state.playbackState = "NOT PLAYING";
    //    this.state.info = null;
    this.state = {
      timestamp: null,
      duration: null,
      elapsedTime: null,
      playbackRate: null,
      album: null,
      artist: null,
      appDisplayName: null,
      appBundleIdentifier: "NONE",
      playbackState: "stopped",
      info: null,
      displayId: null
    };

    if (true) {
      d.on("debug", message => {
        //        console.log("DEBUG", message);
      });
      d.on("supportedCommands", commands => {
        //        console.log("supportedCommands", commands);
        if (
          commands.length === 0 &&
          !(this.state.playbackState === "playing")
        ) {
          this.state = { playbackState: "stopped" };
        }
      });

      d.on("nowPlaying", xinfo => {
        //        console.log("nowPlaying", info);
        if (xinfo === null) {
          return;
        }

        const info = Object.assign({}, xinfo);
        const stateIsPlaying = info.playbackState === "playing",
          stateIsPaused = info.playbackState === "paused";

        if (stateIsPlaying && !(this.state.playbackState === "playing")) {
          this.state = {
            playbackState: "playing"
          };
        } else if (stateIsPaused && this.state.playbackState === "playing") {
          this.state = {
            playbackState: "paused"
          };
        }
      });
    }

    if (true) {
      d.on("message", message => {
        const playbackStates = ["stopped", "playing", "paused"];

        const handleTransactionMessage = msg => {
          //          console.log("----------");
          console.log("transaction", msg);
          //          if (msg.packets.packets.length) {
          //            console.log(
          //              "packets",
          //              msg.packets.packets[0].packetData.toString()
          //            );
          //          }
          //          console.log(
          //            "TransactionPacket",
          //            msg.packets[0].packetData.toString()
          //          );
          //          console.log("");
          //          console.log("");
          //          console.log("");
        };

        const handleSetStateMessage = msg => {
          if (!msg) {
            return;
          }
          if (msg.nowPlayingInfo) {
            if (!msg.nowPlayingInfo.duration) {
              this.state = {
                timestamp: null,
                duration: null,
                elapsedTime: null,
                playbackRate: null,
                album: null,
                artist: null,
                appDisplayName: null,
                appBundleIdentifier: "NONE",
                playbackState: "stopped",
                info: null,
                displayId: null
              };
              this.stopTimer();
              return;
            }
            msg.nowPlayingInfo.playbackState =
              playbackStates[msg.playbackState];
            msg.nowPlayingInfo.appDisplayName = msg.displayName;
            msg.nowPlayingInfo.appBundleIdentifier = msg.displayID;
          }
          console.log("== msg", msg);
          this.state = {
            info: Object.assign({}, msg.nowPlayingInfo),
            displayId: msg.displayID,
            playbackState: playbackStates[msg.playbackState],
            title: msg.title || null,
            album: msg.album,
            artist: msg.artist,
            duration: msg.duration,
            playbackRate: msg.playbackRate,
            timestamp: msg.timestamp
          };
          if (msg.nowPlayingInfo) {
            this.state = { elapsedTime: msg.nowPlayingInfo.elapsedTime };
          }
          if (this.state.playbackState !== "playing") {
            this.stopTimer();
          } else if (this.state.info.duration) {
            this.startTimer();
          } else {
            this.stopTimer();
          }
          console.warn("=== state", this.state);
        };
        const handleNotificationMessage = msg => {
          console.log("----------");
          console.log("notification", msg);
          console.log("");
          //        console.log("userInfos", msg.userInfos[0].toString("UTF-8"));
          console.log("");
          console.log("");
        };

        //        console.log("----------");
        //        console.log("got message", message);
        switch (message.type) {
          case 4:
            handleSetStateMessage(message.message[".setStateMessage"]);
            break;
          case 11:
            handleNotificationMessage(message.message[".notificationMessage"]);
            break;
          case 33:
            handleTransactionMessage(message.message[".transactionMessage"]);
            break;
        }
      });
    }

    if (false) {
      d.on("nowPlaying", info => {
        console.log("nowPlaying");
        if (this.isStopped(info)) {
          console.log("stopped");
          this.state = {
            timestamp: null,
            duration: null,
            elapsedTime: null,
            playbackRate: null,
            album: null,
            artist: null,
            appDisplayName: null,
            appBundleIdentifier: "NONE",
            playbackState: "NOT PLAYING",
            info: null
          };
          this.stopTimer();
          console.log("null info");
          return;
        }
        const message = info.message.nowPlayingInfo;
        //        console.log("info", info);
        if (message) {
          this.state = {
            timestamp: info.timestamp,
            duration: info.duration,
            elapsedTime: info.elapsedTime,
            playbackRate: message.playbackRate,
            album: message.album || "",
            title: info.message.nowPlayingInfo.title || "wait...",
            artist: message.artist || "",
            appDisplayName: info.appDisplayName || message.displayName || "",
            appBundleIdentifier: info.appBundleIdentifier || "",
            playbackState: info.playbackState || message.playbackState,
            info: JSON.stringify(info)
          };
          if (this.state.playbackState !== "playing") {
            this.stopTimer();
          } else if (info.duration) {
            this.startTimer();
          } else {
            this.stopTimer();
          }
          console.log(
            info.appBundleIdentifier,
            info.message.displayName,
            info.playbackState,
            info.message.nowPlayingInfo.title,
            "duration",
            info.duration / 60,
            "elapsed",
            info.elapsedTime / 60
          );
          console.log("--------");
          console.log("");
          console.log("");
        }
      });
    }
    this.atv = d;
  }
  catch(e) {
    console.log("exception 2");
    console.log(e.message);
    console.log(e.stack);
  }
}

const creds =
    "2CACEC26-98C3-45E7-BA30-7C3DA36ED7FF:31423334334643312d313238332d343745412d393341392d324433453744333844363742:39623063623562372d363664352d346334652d396365322d333637663135303866333866:1b8d1cbe93dc9c5d1ea317d71bd5159ea9580c99a353c4448f31f8a48881fc0f:4deb02b842903c4f699bec4ac4d9cc68a05492719fbf017f77c1da00f733dec3",
  credentials = parseCredentials(creds);

const main = async () => {
  try {
    const devices = await scan(credentials.uniqueIdentifier);
    console.log("----- scan complete");
    for (const device of devices) {
      foundDevices[device.name] = device;
    }

    for (const device of Config.atv) {
      hosts[device.name] = new AppleTVHost(device);
    }
  } catch (e) {
    console.log("exception 1");
    console.log(e.message);
    console.log(e.stack);
  }
};
main();
*/
