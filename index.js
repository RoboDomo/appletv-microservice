process.env.DEBUG = "HostBase";

const console = require("console"),
  HostBase = require("microservice-core/HostBase");

const atv = require("node-appletv"),
  { scan, parseCredentials } = atv;

//const atv = require("node-appletv"),
//  { AppleTV, scan, parseCredentials } = atv;

const Config = require("./config");

const TOPIC_ROOT = process.env.TOPIC_ROOT || "appletv",
  MQTT_HOST = process.env.MQTT_HOST || "mqtt://ha";

console.log("MQTT_HOST", MQTT_HOST);
console.log("TOPIC_ROOT", TOPIC_ROOT);
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
    console.log("this.host", this.host);
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
    console.log("commands", commands);
    console.log("command", "'" + arg + "'", commands[arg]);
    console.log(commands["BeginForward"]);
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
        //        await this.dev.sendKeyCommand(arg);
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
    console.log("stopTimer");
    return;
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  startTimer() {
    console.log("startTimer", this.state.elapsedTime);
    return;
    /*
    this.stopTimer();
    let elapsed = this.state.elapsedTime || 0;
    this.interval = setInterval(() => {
      elapsed++;
      this.state = {
        elapsedTime: elapsed
      };
    }, 1000);
    */
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
    const d = await this.dev.openConnection(this.credentials);
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

    if (false) {
      d.on("debug", message => {
        console.log("DEBUG", message);
      });
    }

    if (false) {
      d.on("supportedCommands", commands => {
        //        console.log("supportedCommands", commands);
        if (
          commands.length === 0 &&
          !(this.state.playbackState === "playing")
        ) {
          this.state = { playbackState: "stopped" };
        }
      });
    }
    if (false) {
      d.on("nowPlaying", xinfo => {
        //        console.log("nowPlaying", xinfo);
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

    if (false) {
      d.on("message", message => {
        console.log("message", message);
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

    if (true) {
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
        console.log("info", info);
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

const main = async () => {
  try {
    const devices = await scan();
    console.log("----- scan complete");
    console.log("devices", devices);
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
setTimeout(() => {
  process.exit(0);
}, 6100);
