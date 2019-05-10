const { scan } = require("node-appletv");

return scan()
  .then(devices => {
    // devices is an array of AppleTV objects
    let device = devices[0];
    return device
      .openConnection()
      .then(device => {
        return device.pair();
      })
      .then(callback => {
        // the pin is provided onscreen from the Apple TV
        let pin = "1234";
        return callback(pin);
      });
  })
  .then(device => {
    // you're paired!
    let credentials = device.credentials.toString();
    console.log(credentials);
  })
  .catch(error => {
    console.log(error);
  });
