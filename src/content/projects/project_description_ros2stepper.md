---
title:  "Design of a Differential Drive Robot Compatible with ROS 2 Control"
description: "Personal project to explore ROS 2 Control and enable future development in autonomous navigation."
card_img: "/img/projects/project_assets_ros2stepper/cardview.png"
filename: "project_description_ros2stepper.html"
group: "Robotics"
order: 1
---

<div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; max-width: 100%;">
  <iframe src="https://www.youtube.com/embed/GvW2oyUfGiU"
          title="ROS 2 Stepper Demo"
          style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen>
  </iframe>
</div>


# Introduction

I’m building a **differential-drive robot** equipped with onboard sensors as a **test platform to deepen my experience with ROS 2**. A key requirement for this robot is the ability to precisely control wheels' velocities and have a feedback on their angular position, which ideally calls for **servo motors**—i.e., actuators that provide both motion control and position feedback.

Since I didn’t have access to continuous-rotation servos, I decided to **repurpose the Anet A8 3D printer motherboard and its stepper motors**, integrating them with **AS5600 magnetic rotary encoders**. With these components I created a **ROS 2-compatible dual stepper controller**, capable of receiving motion commands and reporting back encoders' angular position feedback.

> ➡️ This page documents the development of the drivetrain system, which serves as the foundation for the differential-drive robot. The system is here described from both hardware and software perspective.

# System Overview

This section provides a high-level overview of the system. Below, on the left, is a schematic diagram of the system, accompanied by an image of the first prototype. The components are surrounded with color-coded boxes for easy identification.

The system consists of a motherboard (repurposed from the Anet A8 printer) containing an ATmega1284P microcontroller and A4988 motor drivers. Communication between the motherboard and the main robot board (Raspberry Pi 4) is established via serial communication. The system includes two actuators and two sensors. The actuators are NEMA17 stepper motors, while the sensors are AS5600 absolute magnetic encoders, mounted to measure the angular position of each motor’s shaft and communicate via I²C. Due to the fixed I²C address of the AS5600 encoders, a multiplexer is used to switch between the encoders, allowing the system to selectively read the data from each sensor.

> A detailed documentation of each component is provided later on this page. The section dedicated to the Anet A8 board includes instructions on how to program the board as well.
>

<p align="center">
  <img src="/img/projects/project_assets_ros2stepper/ros2stepper_01.png" alt="Schematic visualisation of designated space for the design assignment" style="max-width:100%; height:auto;">
</p>

# Hardware Documentation
This section describes each component used in the project, providing a brief explanation of their functions and how they are utilized. Relevant external resources are also linked for further reference.

## ANET A8 Motherboard

<div style="display: flex; flex-wrap: wrap; align-items: flex-start; gap: 1.5rem; margin-bottom: 1.5rem;">

  <!-- Text block -->
  <div style="flex: 1 1 400px; min-width: 250px;">
    <div>
      The <strong>ANET A8 motherboard</strong> is built around an <strong>ATmega1284P</strong> microcontroller. Originally designed for 3D printing, it integrates <strong>surface-mounted A4988 stepper motor driver ICs</strong>, enabling direct control of bipolar stepper motors. It also features <strong>high-power outputs controlled via MOSFETs</strong>, which are driven by the microcontroller’s PWM-capable pins to regulate power to components like the heated bed and extruder. Communication with a host computer is handled via a <strong>CH340G USB-to-UART interface</strong>.
    </div>
    <div style="margin-top: 1rem;">
      For this project, the primary components of interest are the <strong>ATmega1284P</strong> and the <strong>A4988 stepper motor drivers</strong>, which are repurposed for general motor control beyond 3D printing.
    </div>
  </div>

  <!-- Image block -->
  <div style="flex: 0 1 300px; min-width: 200px; max-width: 100%; text-align: center;">
    <img src="/img/projects/project_assets_ros2stepper/ros2stepper_07.jpeg"
         alt="ANET A8 motherboard"
         style="width: 100%; max-width: 250px; height: auto; border: 1px solid #ccc; border-radius: 4px; margin-inline: auto;">
  </div>

</div>


<blockquote>
  👉🏻 A reverse engineered schematic of the board can be found at this
  <a href="https://github.com/ralf-e/ANET-3D-Board-V1.0/blob/master/ANET3D_Board_Schematic.pdf" target="_blank"><strong>GitHub repository</strong></a>.
</blockquote>

<p>
  This schematic is particularly useful when programming the board, as it allows you to <strong>identify how the microcontroller’s GPIO pins are routed to the physical connectors</strong>.
</p>


## NEMA17 - Stepper Motor

<div style="display: flex; flex-wrap: wrap; align-items: flex-start; gap: 1.5rem; margin-bottom: 1.5rem;">

  <!-- Text block -->
  <div style="flex: 1 1 400px; min-width: 250px;">
    <div>
      The stepper motor is a <strong>NEMA17</strong>, a typical model for CNC applications. Given the low price of the 3D printer kit from where it comes from, I do not expect high performance from it, but it should be sufficient for my application. The specific characteristics can be found online
      <a href="https://3dprint.wiki/reprap/anet/a8/steppermotor" target="_blank"><strong>here</strong></a>.
    </div>
    <div style="margin-top: 1rem;">
       The image shows the stepper motor with an AS5600 magnetic encoder mounted on its shaft, and a wheel directly attached to the same shaft.
    </div>
</div>

  <!-- Image block -->
  <div style="flex: 0 1 300px; min-width: 200px; max-width: 100%; text-align: center;">
    <img src="/img/projects/project_assets_ros2stepper/ros2stepper_08.jpeg"
         alt="NEMA17 Stepper Motor"
         style="width: 100%; max-width: 250px; height: auto; border: 1px solid #ccc; border-radius: 4px; margin-inline: auto;">
  </div>

</div>

## A4988 Microstepping Motor Driver

<div style="display: flex; flex-wrap: wrap; align-items: flex-start; gap: 1.5rem; margin-bottom: 1.5rem;">

  <!-- Text block -->
  <div style="flex: 1 1 400px; min-width: 250px;">
    <div>
      As shown in the previously linked schematic, the Anet A8 motherboard includes four <strong>A4988</strong> stepper motor drivers. These drivers support up to 35 V and ±2 A output and allow microstepping via three logic inputs (MS1, MS2, MS3). In the image on the right (excerpted from the full schematic), all three microstepping selection pins are pulled high.
    </div>
    <div style="margin-top: 1rem;">
      According to the A4988 datasheet, this configuration enables <strong>1/16 microstepping mode</strong>, meaning each input step advances the motor by 0.1125°. A full revolution thus requires <strong>200 × 16 = 3200 steps</strong>.
    </div>
  </div>

  <!-- Image block -->
  <div style="flex: 0 1 300px; min-width: 200px; max-width: 100%; text-align: center;">
    <img src="/img/projects/project_assets_ros2stepper/ros2stepper_02.png"
         alt="A4988 microstepping schematic section"
         style="width: 100%; max-width: 300px; height: auto; border-radius: 4px; margin-inline: auto;">
  </div>

</div>


## AS5600 Absolute Magnetic Encoder

The AS5600 is a magnetic rotary position sensor with a high-resolution 12-bit analog or PWM output. **It measures the absolute angle** of a diametric magnetized on-axis magnet. It has an industry-standard I²C interface. The breakout-board which I have available is displayed in the following image:

<p align="center">
  <img src="/img/projects/project_assets_ros2stepper/ros2stepper_03.png" alt="Schematic visualisation of designated space for the design assignment" style="max-width:100%; height:auto;">
</p>

While the **AS5600 IC** is designed to work with both 3.3V and 5V input voltage, in this breakout board the VCC pin is connected to the 5V input of the encoder, thus setting that as the operating volatage. As anticipated the communication interface is I²C through the SDA and SCL pins. On the breakout board, two pull-up 10K resistors are present to ensure communication compatibility of the device with 5V micorcontrollers. For more detail about I2C i invite to read this **[link](https://en.wikipedia.org/wiki/I²C).**

On the Anet board, the I2C interface pins were origiannly used to communicate with the LCD display, thus they are exposed through the LCD connector. which schematic is reported ine the above image. on the same connector,  useful GND and 5V pins are present too.


> ⚠️ **UPDATE**: Unfortunately, the AS5600 has a fixed address `0x36` , this means that only one sensor can be reached from the same I2C line. In my case, I have two motors, and thus the necessity to read two encoders. To solve this problem I opted to use a HCF4052 multiplexer detailed in the section below


## HCF4052 multiplexer

As previously mentioned, the AS5600 magnetic encoder has a fixed I²C address, which prevents using multiple devices on the same bus without additional hardware. To interface with two AS5600 encoders, I used an HCF4052 multiplexer. **While this IC is not optimal for I²C switching it was readily available in my inventory and sufficient for prototyping.** The device datasheet can be found at this [link](https://www.alldatasheet.com/datasheet-pdf/pdf/22369/STMICROELECTRONICS/HCF4052.html).

<p align="center">
  <img src="/img/projects/project_assets_ros2stepper/ros2stepper_04.png" alt="Schematic visualisation of designated space for the design assignment" style="max-width:100%; height:auto;">
</p>

<!-- First explanation in single-column -->
<div style="margin-bottom: 1.5rem;">
  <div>
    The <strong>HCF4052</strong> is a dual 4-channel analog multiplexer/demultiplexer controlled by two binary select lines (A and B) and an active-low inhibit input. Each section (X and Y) allows one of four input/output channels to be connected to a common terminal.
  </div>
</div>

<!-- Second explanation + image side-by-side -->
<div style="display: flex; flex-wrap: wrap; align-items: flex-start; gap: 1.5rem; margin-bottom: 1.5rem;">

  <!-- Text block -->
  <div style="flex: 1 1 400px; min-width: 250px;">
    <div>
      By wiring the I²C SDA and SCL lines of the microcontroller to the X and Y common terminals, and connecting each encoder’s SDA and SCL lines to separate I/O channels, it is possible to switch between them using the select lines. This approach enables communication with multiple encoders, though not simultaneously. Data acquisition occurs sequentially, with a short delay introduced by the channel switching time.
    </div>
  </div>

  <!-- Image block -->
  <div style="flex: 0 1 250px; min-width: 200px; max-width: 100%; text-align: center;">
    <img src="/img/projects/project_assets_ros2stepper/ros2stepper_09.jpeg"
         alt="HCF4052 wiring example"
         style="width: 100%; max-width: 250px; height: auto; border-radius: 4px; margin-inline: auto;">
  </div>

</div>

# Software Documentation

This section documents all the software aspects of this project, namely the **firmware** for the Anet A8 board and the **Hardware Component Plugin** used to make the system compatible with ROS2.

## Embedded System Firmware

This section is meant to give a brief explanation of the system firmware from an high level perspective. The full firmware code can be found in this [**repository**](https://github.com/ricdigi/ros2_dual_stepper_controller/tree/humble/firmware).

As can be observed from the image below, there are three classes:   **SerialComm**, **MagneticEncoder**, and **StepperMotor:**

The **SerialComm** class manages serial communication, including receiving commands like enabling/disabling motors and setting motor speeds, while also sending encoder data. It has methods for parsing incoming packets, verifying the integrity via checksums, and extracting data like motor speeds. The communication protocol details are described later in this section.

The **MagneticEncoder** class handles the initialization, calibration, and reading of encoder data. It uses methods like `selectMuxChannel()` for multiplexing sensor channels and `readSensors()` to read the sensor data at specified intervals. Calibration is done by setting offsets based on the encoder’s initial readings.

The **StepperMotor** class manages stepper motor operations, including setting speed, acceleration, and enabling/disabling the motor. The `computeConversionFactor()` method calculates the conversion factor between radians and microsteps, while the `run()` method drives the motor at the current speed, ensuring smooth motion with acceleration and deceleration. Methods like `setSpeedRad()` and `setAccelerationRad()` allow dynamic updates to the motor's motion parameters.

> The code depends on the **AccelStepper** library for stepper motor control, authored by **waspinator** ([GitHub](https://github.com/waspinator/AccelStepper)), the **Wire**library for I²C communication, developed by the **Arduino** community (Arduino), and the **AS5600** library for interfacing with the magnetic encoder, created by **RobTillaart** ([GitHub](https://github.com/RobTillaart/AS5600)).
>

<p align="center">
  <img src="/img/projects/project_assets_ros2stepper/ros2stepper_05.png" alt="Schematic visualisation of designated space for the design assignment" style="max-width:100%; height:auto;">
</p>

### Communication Protocol

As explained in the introduction, the motor controller board is designed to continuously communicate with the Raspberry Pi via USB-serial. On the Raspberry Pi, a dedicated ROS 2 node will handle this communication, translating data between the motor controller and ROS 2 interfaces (such as topics and services). Taking inspiration from the communication protocols used by commercial sensors like LiDARs and IMUs, I implemented a **custom binary protocol to enable structured and efficient data exchange between the two systems.** This section describes the communication protocol and its implementation on the motor controller board through a dedicated C++ class.

<p align="center">
  <img src="/img/projects/project_assets_ros2stepper/ros2stepper_06.png" alt="Schematic visualisation of designated space for the design assignment" style="max-width:100%; height:auto;">
</p>

As can be observed from the image above, the motor controller expects angular angular speed values to assign to its motors, and send back encoder absolute position from both motors. However the communication towards the board migh be exanded in the future with other commands, such as the possibility of disabling completely the motors, or changing the acceleration profiles. For this reason the packet structure has been designed as follows:

$$
[HEADER][CMD][LEN][DATA...][CHECKSUM]
$$

- **HEADER**:     1 byte, fixed value (0xAA) used to mark the start of a new package
- **CMD**:        1 byte, command ID indicating the purpose of the packet (e.g. 0x01 for set velocity)
- **LEN**:        1 byte, number of bytes in the DATA section
- **DATA**:       variable length, payload depending on the CMD (e.g. two **4-byte floats** for motor velocities). Notably, the speed data is sent in little-endian format
- **CHECKSUM**:   1 byte, XOR of all previous bytes (HEADER through last byte of DATA), used for integrity verification

Thus an example packet to set both motors at a speed of 5 rad/s will look like:

```arduino
0xAA|0x01||0x08|0x00 0x00 0xA0 0x40|0x00 0x00 0xA0 0x40|0x0A
```

### Building and Uploading the Firmware

The Anet A8 motherboard is based on the **ATmega1284P**, a microcontroller that is **not officially supported by the default Arduino IDE installation**. However, since it belongs to the **Atmel AVR family**, it is **compatible with the Arduino AVR core**, which implements the standard Arduino API (e.g., `digitalWrite()`, `millis()`, `Serial`) in C/C++ for AVR microcontrollers. With the help of a **third-party board package**—such as **Sanguino**—which includes the necessary configuration files (including clock speed, pin mappings, and upload protocol), the ATmega1284P can be fully programmed using the Arduino framework. This approach works because most AVR chips, including the 1284P, provide the minimum hardware features required by the Arduino core (such as timers, GPIO, and UART). While not every AVR is supported by default, many—including this one—can run Arduino code reliably with the right setup.

In my specific case, however, **installing the [Sanguino](https://github.com/Lauszus/Sanguino) board package in the Arduino IDE was not sufficient**. While the package provides all the necessary configuration files for the ATmega1284P, it also includes a precompiled AVR **toolchain**—specifically the compiler (`avr-gcc`) and uploader (`avrdude`)—that is built for **Intel (x86) processors**. On an **M-series MacBook with an ARM-based processor**, these tools are incompatible and fail to execute. Although **ARM-native versions of the AVR toolchain do exist** (e.g., via Homebrew), I could not find a **straightforward way** of substituting internal toolchain of the Arduino IDE with an external one, making it difficult to program the board using this setup.

The solution to this limitation was to use [PlatformIO](https://docs.platformio.org/en/latest/what-is-platformio.html), a modern development environment for embedded systems that includes both a command-line interface (PlatformIO Core) and an integrated IDE. Unlike the Arduino IDE, PlatformIO allows fine-grained configuration through project files, making it possible to **override the default compiler and upload tools**. This enabled me to use **ARM-native installations of `avr-gcc` and `avrdude`**, allowing me to compile and upload code to the ATmega1284P directly from my M-series Mac.

**Detailed Installation Procedure – macOS**

The first step is to install an **ARM-native AVR compiler and uploader** (toolchain) via Homebrew, followed by PlatformIO Core (CLI only), which installs the `pio` command-line tool.

```bash
brew install avr-gcc avrdude
brew install platformio
```

Next, set up a project directory. PlatformIO provides an easy command: [`pio project init [OPTIONS]`](https://docs.platformio.org/en/latest/core/userguide/project/cmd_init.html), which creates the configuration file and the necessary subdirectories.

```bash
mkdir sketch_try_pio
cd sketch_try_pio
pio project init --board sanguino_atmega1284p
```

> Unlike the Arduino IDE, where third-party boards must be installed via the Board Manager, PlatformIO already includes a database of community-supported boards. Among these is sanguino_atmega1284p, which is the board of interest in our case.
>

Once the project directory is initialized, the next step is to edit the configuration file found at the root of the project: `platformio.ini`. In our case, to the default options, we add the correct **upload speed** (57600 baud) and the correct **USB serial port**.

```
# Default Options
[env:sanguino_atmega1284p]
platform = atmelavr
board = sanguino_atmega1284p
framework = arduino

# Added Options specific to our microcontroller
upload_speed = 57600
upload_port = /dev/cu.usbserial-2140
```

The source code should be placed inside the `/src` directory. For example, our `main.cpp` could be a simple **blink** sketch:

```cpp
#include <Arduino.h>

void setup() {
  // Initialize digital pin LED_BUILTIN as an output.
  pinMode(LED_BUILTIN, OUTPUT);
}

void loop() {
  digitalWrite(LED_BUILTIN, HIGH);  // Turn the LED on
  delay(1000);                      // Wait for a second
  digitalWrite(LED_BUILTIN, LOW);   // Turn the LED off
  delay(1000);                      // Wait for a second
}
```

> In the case of less trivial projects, the source files should be organized for clarity and maintainability. Typically, application code and logic go into the src/ folder, where PlatformIO compiles all .cpp files recursively. Shared headers or configuration files can be placed in the include/ directory, while self-contained reusable modules or libraries belong in the lib/ folder, each within its own subfolder. This structure ensures scalability as the project grows and improves separation between components.
>

Finally, the project can be compiled and uploaded to the board using:

```bash
pio run --target upload
```

This command compiles the code using the appropriate AVR toolchain and uploads it to the board at the specified communication speed and port.

## **Hardware Component Plugin**

To interface this system with ROS 2, **ROS 2 Control** will be used.

> To integrate a new hardware component with ROS 2 Control, a **Hardware Interface Plugin** must be created. This plugin encapsulates the logic for interfacing with the device—typically handling communication over protocols like USB-serial—and exposes the component’s state and command interfaces to the ROS 2 control framework. It acts as a bridge between the physical hardware and the rest of the ROS 2 system.
>

The implementation of the Hardware Interface Plugin is closely tied to the concepts of ROS 2 Control, making it essential to have a solid understanding of ROS 2 Control to fully comprehend its structure and functionality.

In the [Getting Started guide for ROS 2 Control](https://ricdigi.github.io/research/research_ros2control.html), I use a differential drive system as a reference example to explain the process of implementing a Hardware Interface Plugin. I recommend visiting the guide for detailed instructions to avoid redundant explanations here.
