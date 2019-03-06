# Foscam IPCamera for Homey

This app will add support for the IP camera's made by [Foscam](https://www.foscam.com "Foscam - Home Security").

> Virtually every *newer* camera is supported because all devices use one generic API, but exceptions can occur. The difference with *older* models is that the API support is not the same. *-- Foscam Support*

**It would be highly appreciated if you could let me know when you're having trouble with a specific model.**

## Supported devices
This app should support most *newer* types of devices below. I do not know about the Baby Monitor and Battery Camera. Please let me know!
- [Bullet Camera](https://foscam.com/products/Bullet_Camera.html)
- [Cube Camera](https://foscam.com/products/Cube_Camera.html)
- [Dome Camera](https://foscam.com/products/Dome_Camera.html)
- [PT Camera](https://foscam.com/products/PT_Camera.html)
- [PTZ Camera](https://foscam.com/products/PTZ_Camera.html)

## Unsupported models
FI89*xx* [...]

## Supported actions
Homey will automatically fetch the camera settings every minute.

**If you would like to use the email snapshot feature, do not forget to configure the app settings.**
- Create snapshot image
- Send snapshot via email as attachment or inline
- Set brightness of the video
- Set contrast of the video
- Set hue of the video
- Set saturation of the video
- Set sharpness of the video
- Set motion detection on/off
- Flip the video horizontal
- Goto PTZ preset point [`*`]
- Mirror the video
- Reboot the camera

[`*`] Your camera has to support this, please refer to the [user manual](https://foscam.com/downloads/user_mannual.html).

## Supported triggers
- When the camera made a snapshot

## Supported languages
- English
- Dutch (Nederlands)

## Support / feedback
If you have any questions or feedback, please contact me on [Slack](https://athomcommunity.slack.com/team/evdpol).

Please report issues and feature requests at the [issues section](https://github.com/edwinvdpol/com.foscam/issues) on GitHub.

## Changelog

#### v1.2.0
- Added motion detection settings (device).
- Added 'Set motion detection on/off' action flowcard.
- Added 'Goto PTZ preset point' action flowcard.
- Added 'Send snapshot' (image) action flowcard.
- Added 'Snapshot token' to 'snapshot is taken' trigger flowcard.
- Added 'Send email on snapshot' setting (app).
- Changed device poll interval from 5 minutes to 1 minute.


#### v1.1.0
- Added check if device is already added when pairing device.
- Added extensive logging for better support.
- Added logs tab in the app settings screen for better support.
- Added more readable errors, and better error handling.
- Added the name of the camera in the snapshot email subject.
- Updated custom pairing- and app settings screen (makeover).
- Removed serial number from device information.


#### v1.0.1
- Added Paypal account.