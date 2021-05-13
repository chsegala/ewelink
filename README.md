# ewelink light toggle

This project is a POC for controlling SONOFF devices to toggle lights
on/off on a REST call.

This was done mainly to learn about lambda functions and aws-cdk.

## Functions
- getLogin: logs in to ewelink api
- listDevices: get a list of devices to that account
- toggleDevice: toggles the device on/off from the *listDevices* return
  - Payload: `{"state": "on|off"}`