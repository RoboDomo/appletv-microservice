process.env.debug = "appletv";
process.title = process.env.TITLE || "appletv-microservice";

/**
 * Notes:
 *
 * For more than one ATV in mongodb config, if the scan for ATVs doesn't find them all, the whole microservice
 * exits and is respawned by forever.  The node-appletv module doesn't seem to be robust, and the scans frequently
 * fail to find all the devices.  This causes a long delay of restart, restart, restart until they are found.
 *
 * It may be more ideal to use something like node cluster or fork or some other threaded scheme so each
 * ATV is controlled by a thread/process.  If that device causes error that needs to exit(), then the
 * rest of the microservice can remain running.
 *
 * The responses from node-appletv as to what is now playing are not particularly real-time.  We do our best to
 * update the client as soon as new info is available from node-appletv.
 *
 * This code contains some if(false) or if(true) blocks that can be used to try and diagnose the communication
 * stream and what's going on in node-appletv.
 *
 * The node-appletv module is open source so it could be used as a template to implement a better working node module.
 * See pyatv, a pythong apple tv library/client that seems to work, but doesn't provide as much useful information (like
 * nowPlaying details).
 *
 * The startTimer/stopTimer logic is commented out.  The concept is that when a nowPlayingInfo comes in with state
 * "playing" and an elapsedTime, we start a setInterval timer and send a message 1/sec to the client so it can
 * roughly track the current point in the playback.
 */
const console = require("console"),
  debug = require("debug")("appletv"),
  HostBase = require("microservice-core/HostBase"),
  LocalStorage = require("node-localstorage").LocalStorage,
  localStorage = new LocalStorage("/tmp/appletv-localstorage");

const atv = require("node-appletv"),
  { scan, parseCredentials } = atv;

const TOPIC_ROOT = process.env.TOPIC_ROOT || "appletv",
  MQTT_HOST = process.env.MQTT_HOST || "mqtt://robodomo";

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

class DelayedTask {
  constructor(fn, time) {
    this.fn = fn;
    this.timer = setTimeout(fn, time);
    this.time = time;
  }
  defer(time) {
    if (!time) {
      time = this.time;
    } else {
      this.time = time;
    }
    this.cancel();
    this.timer = setTimeout(this.fn, this.time);
  }
  cancel() {
    if (this.timer) {
      clearTimeout(this.timer);
    }
  }
}

class AppleTVHost extends HostBase {
  constructor(host) {
    super(MQTT_HOST, TOPIC_ROOT + "/" + host.device);
    this.watchdog = new DelayedTask(() => {
      //      process.exit(0);
    }, 10000);

    this.host = host;
    this.dev = foundDevices[host.name];
    if (!this.dev) {
      throw new Error("host not found " + host.name);
    }
    this.credentials = parseCredentials(host.credentials);

    this.interval = null;

    //    this.state = { playbackState: "stopped" };
    // devices is an array of AppleTV objects
    this.dev.on("error", e => {
      if (e.message.indexOf("ENOENT") === -1) {
        console.log("device error ", host.device);
        console.log(host.device, e.message);
        console.log(host.device, e.stack);
        process.exit(0);
      } else {
        this.state = {
          timestamp: null,
          duration: null,
          elapsedTime: null,
          playbackRate: null,
          album: null,
          artist: null,
          title: null,
          appDisplayName: null,
          appBundleIdentifier: "NONE",
          playbackState: "stopped",
          info: null,
          displayId: null
        };
        // hackish, due to bug - missing .proto file.
        // disconnected
      }
    });

    setTimeout(async () => {
      await this.connect();
    }, 1);
  }

  async command(type, arg) {
    this.watchdog.defer();
    debug(this.host.device, "commands", commands);
    debug(this.host.device, "command", "'" + arg + "'", commands[arg]);
    debug(this.host.device, commands["BeginForward"]);
    try {
      // see https://github.com/Daij-Djan/DDHidLib/blob/master/usb_hid_usages.txt
      if (commands[arg]) {
        const [page, code] = commands[arg];
        //        console.log(
        //          this.host.name,
        //          `await this.dev.sendKeyPressAndRelease(${page}, 0x${code.toString(
        //            16
        //          )});`
        //        );
        this.watchdog.defer();
        await this.dev.sendKeyPressAndRelease(page, code);
        //        await this.dev.sendKeyCommand(arg);
      } else {
        debug(this.host.name, "invalid command ", arg);
        return;
      }
      //      await this.dev.sendKeyCommand(commands[arg]);
    } catch (e) {
      console.log(this.host.name, "sendKeyCommand", e.message, e.stack);
    }
  }

  stopTimer() {
    debug(this.host.name, "stopTimer");
    return;
    // commented out for now
    /*
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    */
  }

  startTimer() {
    debug(this.host.name, "startTimer", this.state.elapsedTime);
    return;
    // commented out for now
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
    debug(this.host.name, "connected", d.address);
    this.watchdog.defer(15000);
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
    try {
      this.state = JSON.parse(localStorage.getItem("state"));
    } catch (e) {
      this.state = {
        timestamp: null,
        duration: null,
        elapsedTime: null,
        playbackRate: null,
        album: null,
        artist: null,
        title: null,
        appDisplayName: null,
        appBundleIdentifier: "NONE",
        playbackState: "stopped",
        info: null,
        displayId: null
      };
    }

    console.log(this.host.device, "Subscribing to nowPlaying");
    d.on("nowPlaying", info => {
      console.log(this.host.device, "nowPlaying");
      this.watchdog.defer(5000);
      if (this.isStopped(info)) {
        console.log(this.host.device, "stopped");
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
        localStorage.setItem("state", JSON.stringify(this.state));
        this.stopTimer();
        console.log(this.host.device, "null info");
        return;
      }
      const message = info.message.nowPlayingInfo;
      console.log(this.host.device, "info", info);
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
        localStorage.setItem("state", JSON.stringify(this.state));
        if (this.state.playbackState !== "playing") {
          this.stopTimer();
        } else if (info.duration) {
          this.startTimer();
        } else {
          this.stopTimer();
        }
        console.log(
          this.host.device,
          info.appBundleIdentifier,
          info.message.displayName,
          info.playbackState,
          info.message.nowPlayingInfo.title,
          "duration",
          info.duration / 60,
          "elapsed",
          info.elapsedTime / 60
        );
        console.log(this.host.device, "--------");
        console.log(this.host.device, "");
        console.log(this.host.device, "");
      }
    });
    this.atv = d;
  }
}

const main = async () => {
  const Config = await HostBase.config();
  try {
    const devices = await scan(undefined, 5);
    console.log("----- scan complete");
    for (const device of devices) {
      console.log("found device", device.name, device.address, device.port);
      foundDevices[device.name] = device;
    }

    // TODO: use env  for array of atv?
    for (const device of Config.appletv.devices) {
      try {
        hosts[device.name] = new AppleTVHost(device);
      } catch (e) {
        console.log("exception", e);
        process.exit(0);
      }
    }
  } catch (e) {
    console.log("exception 1");
    console.log(e.message);
    console.log(e.stack);
  }
};
main();

//setTimeout(() => {
//  process.exit(0);
//}, 6100);
