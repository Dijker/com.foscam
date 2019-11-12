# Foscam for Homey

Adds support for Foscam IP Cameras.

Homey will automatically fetch the settings from the camera after adding.

The update interval can be changed in the *device settings*.

> Virtually every *newer* camera is supported because all devices use one generic API, but exceptions can occur. The difference with *older* models is that the API support is not the same. - **Foscam Support**

It would be highly appreciated if you could let me know when you're having trouble with a specific model.

If you wonder why the motion detect trigger isn't available, please read [this](https://github.com/edwinvdpol/com.foscam/blob/master/MOTION.md).


## Supported actions
- Create snapshot image (configure settings)
- Send image via email as attachment or inline
- Set brightness of the video
- Set contrast of the video
- Set hue of the video
- Set saturation of the video
- Set sharpness of the video
- Set motion detection on/off
- Flip the video horizontal
- Goto PTZ preset point
- Mirror the video
- Reboot the camera


## Supported triggers
- When the camera takes a snapshot


## Unsupported models
FI89*xx* [...]


## Supported languages
- English
- Dutch (Nederlands)


## Support / feedback
If you have any questions or feedback, please contact me on [Slack](https://athomcommunity.slack.com/team/evdpol).

Please report issues and feature requests at the [issues section](https://github.com/edwinvdpol/com.foscam/issues) on GitHub.
