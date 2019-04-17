# Foscam IPCamera for Homey

This app will add support for the IP camera's made by [Foscam](https://www.foscam.com "Foscam - Home Security").

Homey will automatically fetch the camera settings every minute.

> Virtually every *newer* camera is supported because all devices use one generic API, but exceptions can occur. The difference with *older* models is that the API support is not the same. - **Foscam Support**

It would be highly appreciated if you could let me know when you're having trouble with a specific model.

**Version 2 requires re-pairing of your device(s).**

If you like this app, consider a donation to support development:

[![Paypal donate][pp-donate-image]][pp-donate-link]


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

**If you would like to use the email snapshot feature, do not forget to configure the app settings.**
- Create snapshot image
- Send image via email as attachment or inline
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
- When the camera takes a snapshot (with image token)


## Supported languages
- English
- Dutch (Nederlands)


## Support / feedback
If you have any questions or feedback, please contact me on [Slack](https://athomcommunity.slack.com/team/evdpol).

Please report issues and feature requests at the [issues section](https://github.com/edwinvdpol/com.foscam/issues) on GitHub.


## Changelog
[Check it out here!](https://github.com/edwinvdpol/com.foscam/blob/master/CHANGELOG.md)

[pp-donate-link]: https://www.paypal.me/edwinvdpol
[pp-donate-image]: https://www.paypalobjects.com/en_US/i/btn/btn_donate_SM.gif