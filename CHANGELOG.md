## 2.1.2 / 2019-10-28
- Added [motion detect trigger documentation](https://github.com/edwinvdpol/com.foscam/blob/master/MOTION.md)
- Added toggle for schedule record status
- Minor CSS / JS fixes


## 2.1.1 / 2019-07-07
- Fixed API response when adding device.


## 2.1.0 / 2019-06-26
- Added inline documentation.
- Added update interval setting.
- Changed API library to axios.
- Implemented new image API (Buffer and Stream both working).
- Removed image tag from snapshot trigger flowcard.
- Various big code updates.


## 2.0.1 / 2019-05-18
- Added better error handling for email settings.
- Changed the 'Send email after snapshot' default setting to 'No'.
- Fixed check SMTP settings when no snapshot is send afterwards.
- Remove initial error (determine motion command) to prevent false errors.


## 2.0.0 / 2019-04-17 (*re-pair required!*)
- Added camera support read only settings.
- Changed logging text and error format.
- Fixed motion detection settings for all supported devices.
- Fixed translations.


## 1.2.4 / 2019-03-31
- Added more error logging for better support / diagnostic report


## 1.2.3 / 2019-03-29
- Added motion detection settings for FI9928P camera.


## 1.2.2 / 2019-03-15
- Added motion detection settings for FI9900EP camera.


## 1.2.1 / 2019-03-09
- Added motion detection settings for the R2, R4 and C2 cameras.
- Added 'Set motion detection sensitivity' action flowcard.
- Moved changelog from `README.md` to `CHANGELOG.md`.


## 1.2.0 / 2019-03-06
- Added motion detection settings (device).
- Added 'Set motion detection on/off' action flowcard.
- Added 'Goto PTZ preset point' action flowcard.
- Added 'Send snapshot' (image) action flowcard.
- Added 'Snapshot token' to 'snapshot is taken' trigger flowcard.
- Added 'Send email on snapshot' setting (app).
- Changed device poll interval from 5 minutes to 1 minute.


## 1.1.0 / 2019-03-01
- Added check if device is already added when pairing device.
- Added extensive logging for better support.
- Added logs tab in the app settings screen for better support.
- Added more readable errors, and better error handling.
- Added the name of the camera in the snapshot email subject.
- Updated custom pairing- and app settings screen (makeover).
- Removed serial number from device information.


## 1.0.0 / 2019-02-14
- Initial working version.
