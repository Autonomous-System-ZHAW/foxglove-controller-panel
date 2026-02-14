# foxglove-controller

This project is based on the excellent work from\
https://github.com/joshnewans/foxglove-joystick

Many thanks for providing the foundation for this extension.

This extension for [Foxglove Studio](https://github.com/foxglove/studio)
adds enhanced joystick support, allowing you to subscribe to joystick
topics and map controller inputs in a flexible and intuitive way.

------------------------------------------------------------------------

## Overview

The extension subscribes to the `/joy` topic (`sensor_msgs/msg/Joy`) and
maps inputs from a DualShock controller (or other compatible
controllers) to user-defined outputs.

It allows you to:

-   Visualize joystick axes and button states\
-   Map controller inputs to specific functions\
-   Work directly with ROS2 `/joy` messages\
-   Customize mappings for your specific robotic setup

------------------------------------------------------------------------

## Example Panel

![Joystick
Panel](https://github.com/user-attachments/assets/9ac43ed2-d8fb-4417-b7ae-ec8416eda732)

------------------------------------------------------------------------

## Installation

### Option 1 -- Foxglove Studio Extension Marketplace (Recommended)

1.  Open the Foxglove Studio Desktop App\
2.  Click the profile menu (top right)\
3.  Go to **Extensions**\
4.  Search for the Controller panel\
5.  Add the extension

------------------------------------------------------------------------

### Option 2 -- Build from Source

#### Requirements

-   Node.js\
-   Foxglove Studio Desktop

#### Install dependencies

``` bash
npm install
```

#### Install locally into Foxglove Studio

``` bash
npm run local-install
```

#### Package as `.foxe` file

``` bash
npm run package
```

#### Development mode (live reload)

``` bash
npm run watch
```

This allows you to modify the panel and see changes in real time inside
Foxglove Studio.
