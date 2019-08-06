# Motion trigger

Once in a while, people ask me why I did not implement the motion detect trigger in the app.


The reason why I did not implement the motion detect trigger, is that the Foscam cameras only support HTTP requests for getting data from the camera.

If you want to enable something like a motion trigger, it means that Homey has to poll the camera every 2-4 seconds to see if the alarm is on.

If you have for example 4 cameras available in Homey, the number of HTTP requests will be quit a lot.


I did some testing with 1 camera in the past, and it turned out that the memory usage of the app was rapidly growing over time. Not sure why though. I do not know if it is NodeJS, Axios, Homey or something else.

I want to provide a stable app which everyone can use. :wink:

If someone knows a solution to this issue, please let me know!