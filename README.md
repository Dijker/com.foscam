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

## Supported features
Homey will automatically fetch the camera settings every 5 minutes.

**If you would like to use the email snapshot feature, do not forget to configure the app settings.**
- Create snapshot and send it via email as attachment or inline
- Set brightness of the video
- Set contrast of the video
- Set hue of the video
- Set saturation of the video
- Set sharpness of the video
- Flip the video horizontal
- Mirror the video
- Reboot the camera

## Supported triggers
- When the camera made a snapshot

## Supported Languages
- English
- Dutch (Nederlands)

## Support / feedback
If you have any questions or feedback, please contact me on [Slack](https://athomcommunity.slack.com/team/evdpol).

Please report issues and feature requests at the [issues section](https://github.com/edwinvdpol/com.foscam/issues) on GitHub.

## Changelog

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