---
title:  "Design of a Differential Drive Robot Compatible with ROS 2 Control"
description: "Personal project to explore ROS 2 Control and enable future development in autonomous navigation."
card_img: "/img/projects/project_assets_ros2stepper/cardview.png"
filename: "project_description_ros2stepper.html"
group: "Robotics"
order: 1
---

<p align="center">
  <img src="/img/projects/project_assets_ros2stepper/header.png" alt="Schematic visualisation of designated space for the design assignment" style="max-width:100%; height:auto;">
</p>

# ⚡ TL;DR (Summary)

<p align="center">
  <img src="/img/projects/project_assets_ros2stepper/tldr1.png" alt="Schematic visualisation of designated space for the design assignment" style="max-width:100%; height:auto;">
</p>

<p align="center">
  <img src="/img/projects/project_assets_ros2stepper/tldr2.png" alt="Schematic visualisation of designated space for the design assignment" style="max-width:100%; height:auto;">
</p>

<div id="content" class="content-wrapper-normal">
  <div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; max-width: 100%;">
  <iframe src="https://www.youtube.com/embed/EcNUWfgLmsY"
          title="ROS 2 Stepper Demo"
          style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen>
  </iframe>
</div>

# Motivation

I started this project to gain practical experience across the entire robotics stack. My goal was to work hands-on with ROS 2, rapid prototyping, and embedded electronics, developing a complete robotic platform. Thus, I set out to build a **modular differential-drive robotic platform** designed for experimentation. The modularity ensures that new hardware components and features can be integrated easily, enabling rapid prototyping and seamless testing of additional ROS2 tools and functionalities.

<br>

# Objectives

The objective of this modular differential-drive robotic platform is to serve as a **didactic system for experimenting with the full robotics stack**. It is designed to support:

- **ROS 2 packages integration** (e.g., `ros2_control`, `Nav2`)
- **Autonomous navigation and SLAM**
- **Hardware variations for testing new sensors and actuators**

<br>

## Functional Requirements

Given this objective, I delineated a set of functional requirements:

| **Category** | **Requirement**                                                                                                                                                                                                                     |
| --- |-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Modularity** | **Mechanical:** Allow frame resizing and attachment of new components. <br> **Electrical:** Support easy integration of additional sensors and actuators. <br> **Software:** Enable flexible implementation of new functionalities. |
| **Structural Integrity** | Maintain structural rigidity under handling and during operation to ensure precise sensor alignment, stable component mounting, and consistent odometry measurements.                                                               |
| **Cost Efficiency** | Deliver the required functionality while minimizing expenses, leveraging repurposed components and low-cost materials.                                                                                                              |
| **ROS2 Compatibility** | Full compatibility with ROS 2, including `ros2_control`, standard interfaces, and support for navigation and SLAM packages.                                                                                                         |
| **Motion Control** | Achieves linear speed control up to 0.5 m/s, comparable to commercial differential-drive platforms, with accuracy sufficient for smooth motion and reliable navigation.                                                             |
| **Odometry Feedback** | Provide reliable wheel position feedback for accurate odometry.                                                                                                                                                                     |
| **Power Autonomy** | Include a portable power source to enable untethered operation.                                                                                                                                                                     |
| **Communication** | Provide Wi-Fi connectivity for internet access and local network communication with external devices.                                                                                                                               |

<br>

# Hardware

This section outlines the design decisions and implementation details behind the robot. It is **focused on the Hardware,** covering the mechanical structure, electronics, and sensor integration. Each section details the **design of a subsystem**, including the specific electronic components used. The **final section** describes the **mechanical design and prototyping** of the frame.

<p align="center">
  <img src="/img/projects/project_assets_ros2stepper/ros2stepper_new_01.png" alt="Schematic visualisation of designated space for the design assignment" style="max-width:100%; height:auto;">
</p>

**Figure 1:** System architecture, highlighting the hardware components of each subsystem and their interconnections.

<br>

## Motor and Encoder Subsystem

The Motor and Encoder Subsystem includes the motors to actuate the robotic platform, and the sensors used to provide feedback on the angular position of the wheels, as shown previously in **Figure 1**. In addition, an extra component—a **multiplexer**—is integrated into this subsystem. Its function is described in detail later in this section.

<p align="center">
  <img src="/img/projects/project_assets_ros2stepper/ros2stepper_new_02.png" alt="Schematic visualisation of designated space for the design assignment" style="max-width:70%; height:auto;">
</p>

**Figure 2:** High-level schematic of the Motor and Encoder Subsystem, illustrating its components and their interconnections.

<br>

### Encoders

To measure the wheels’ angular positions, I used the **AS5600 encoder**. This is a magnetic rotary position sensor featuring a high-resolution 12-bit output, available in either analog or PWM format. It measures the absolute angle of a diametrically magnetized on-axis magnet and supports an industry-standard **I²C interface**. The breakout board I used is shown in the image below:

<p align="center">
  <img src="/img/projects/project_assets_ros2stepper/ros2stepper_new_03.png" alt="Schematic visualisation of designated space for the design assignment" style="max-width:100%; height:auto;">
</p>

**Figure 3:** Driving wheel sub-assembly illustrating the placement of the magnet and encoder. The encoder breakout board is shown on the right.

<br>

While the **AS5600 IC** is designed to work with both 3.3V and 5V input voltage, in this breakout board the VCC pin is connected to the 5V input of the encoder, thus setting that as the operating voltage. As anticipated the communication interface is I²C through the SDA and SCL pins. On the breakout board, two pull-up 10K resistors are present to ensure communication compatibility of the device with 5V microcontrollers. For more details on I²C, see this [**reference**](https://en.wikipedia.org/wiki/I²C).

<br>

> ⚠️ **NOTE**: The AS5600 has a fixed I2C address `0x36` , this means that only one sensor can be reached from the same I2C line. Moreover, the microcontroller I have employed has only one I2C line. In my case, I have two wheels and motors, thus the necessity to read two encoders. To solve this problem I opted to use a HCF4052 multiplexer detailed in the section below

<br>

### Motors

To minimize costs, I reused components already in my possession whenever possible. This included **NEMA17 stepper motors** salvaged from an old 3D printer build—specifically the [**ANET A8**](https://it.aliexpress.com/item/4001053056032.html?src=google&pdp_npi=4%40dis!EUR!192.71!148.39!!!!!%40!10000013818520427!ppc!!!&src=google&albch=shopping&acnt=742-864-1166&isdl=y&slnk=&plac=&mtctp=&albbt=Google_7_shopping&aff_platform=google&aff_short_key=UneMJZVf&gclsrc=aw.ds&&albagn=888888&&ds_e_adid=&ds_e_matchtype=&ds_e_device=c&ds_e_network=x&ds_e_product_group_id=&ds_e_product_id=it4001053056032&ds_e_product_merchant_id=107330331&ds_e_product_country=IT&ds_e_product_language=it&ds_e_product_channel=online&ds_e_product_store_id=&ds_url_v=2&albcp=22261776456&albag=&isSmbAutoCall=false&needSmbHouyi=false&gad_source=1&gad_campaignid=22268279741&gbraid=0AAAAA99aYpdwK_HRyQpeNV2YQZHPmsh90&gclid=Cj0KCQjw-ZHEBhCxARIsAGGN96KtkDKOOmVCvQyNG4M98LLMiPHzoxhfyqc6C3ep_x9JQWEXM8efXfcaAuq0EALw_wcB).

These motors are a typical choice for CNC and 3D printing applications. Given the low cost of the original printer kit, I did not expect exceptional performance, but they provide adequate performances for the platform’s load requirements. The technical specifications are available [**here**](https://3dprint.wiki/reprap/anet/a8/steppermotor).

<br>

### Multiplexer

As previously mentioned, the AS5600 magnetic encoder has a fixed I²C address, which prevents using multiple devices on the same bus without additional hardware. To interface with two AS5600 encoders, I used an HCF4052 multiplexer. **While this IC is not optimal for I²C switching, in line with cost efficiency requirements, it was readily available in my inventory and sufficient for prototyping.** The device datasheet can be found at this [link](https://www.alldatasheet.com/datasheet-pdf/pdf/22369/STMICROELECTRONICS/HCF4052.html).

<p align="center">
  <img src="/img/projects/project_assets_ros2stepper/ros2stepper_new_04.png" alt="Schematic visualisation of designated space for the design assignment" style="max-width:100%; height:auto;">
</p>

**Figure 4:** High-level schematic of the encoder connections to the controller board. On the right, a top view of the HCF4052 multiplexer package with numbered pins.

<br>

The HCF4052 is a dual 4-channel analog multiplexer/demultiplexer controlled by two binary select lines (A and B) and an active-low inhibit input. Each section (X and Y) allows one of four input/output channels to be connected to a common terminal.

By wiring the I²C SDA and SCL lines of the microcontroller to the X and Y common terminals, and connecting each encoder’s SDA and SCL lines to separate I/O channels, it is possible to switch between them using the select lines (A and B). This approach enables communication with multiple encoders, though not simultaneously. **Data acquisition occurs sequentially,** with a short delay introduced by the channel switching time.

<br>

### Custom Expansion Board

To keep the connections for the encoders and the multiplexer organized, I designed a custom expansion board that connects directly to the controller board. Initially, I designed it as a standalone module (shown in **Figure 5**, left), but soon after developed a second prototype that keeps the layout much more organized (shown in **Figure 5**, right).

The controller board featured a convenient connector originally intended for an LCD display, which is now repurposed for the encoder signals, as it provides all the necessary pins as can be observed in **Figure 5**.

The pinout of the LCD connector was obtained from the schematic found at this [**repository**](https://github.com/ralf-e/ANET-3D-Board-V1.0/blob/master/ANET3D_Board_Schematic.pdf).

<p align="center">
  <img src="/img/projects/project_assets_ros2stepper/ros2stepper_new_05.png" alt="Schematic visualisation of designated space for the design assignment" style="max-width:100%; height:auto;">
</p>

**Figure 5:** First and second versions of the custom expansion board featuring the multiplexer and encoder connections. The LCD connector, used to interface the second version of the board with the controller, is also shown.

<br>

## Microcontroller Board (Anet A8)

Similarly to the motors, and aligned with the cost efficiency objective, the controller board has been repurposed from the same 3D printer (Anet A8).

The **ANET A8 motherboard** is built around an **ATmega1284P** microcontroller. Originally designed for 3D printing, it integrates **surface-mounted A4988 stepper motor driver ICs**, enabling direct control of bipolar stepper motors. It also features **high-power outputs controlled via MOSFETs**, which are driven by the microcontroller’s PWM-capable pins to regulate power to components like the heated bed and extruder. Communication with a host computer is handled via a **CH340G USB-to-UART interface**.

A reverse engineered schematic of the board can be found at this [**repository**](https://github.com/ralf-e/ANET-3D-Board-V1.0/blob/master/ANET3D_Board_Schematic.pdf). This schematic is particularly useful when programming the board, as it **provides details on the routing of the microcontroller’s GPIO pins**.

<p align="center">
  <img src="/img/projects/project_assets_ros2stepper/ros2stepper_new_06.png" alt="Schematic visualisation of designated space for the design assignment" style="max-width:100%; height:auto;">
</p>

**Figure 6:** Picture of the ANET A8 motherboard PCB on the top-left. Portions of the full schematic linked above, showing the LCD connector, the A4988 Motor Driver, and the Micorcontroller ATmega1284p.

<br>

### A4988 Stepper Motor Drivers

As shown in the previously linked [**schematic**](https://github.com/ralf-e/ANET-3D-Board-V1.0/blob/master/ANET3D_Board_Schematic.pdf), the controller board already includes four **A4988 stepper motor drivers.** These drivers support up to 35 V and ±2 A output and allow **microstepping** via three logic inputs (MS1, MS2, MS3). In the image on the right (excerpted from the full schematic), all three microstepping selection pins are pulled high.

According to the A4988 datasheet, this configuration enables **1/16 microstepping mode**, meaning each input step advances the motor by 0.1125°. A full revolution thus requires **200 × 16 = 3200 steps**.

To know more about microstepping one can look at this [link](https://www.analog.com/en/resources/analog-dialogue/articles/mastering-precision-understanding-microstepping.html).

<br>

### Full Electronics Schematic

In the following scheme the electronic connections between the motors and encoders system and the microcontroller board are shown.

<p align="center">
  <img src="/img/projects/project_assets_ros2stepper/ros2stepper_new_07.png" alt="Schematic visualisation of designated space for the design assignment" style="max-width:100%; height:auto;">
</p>

**Figure 7:** Complete schematic showing the connections between all electronic components.

<br>

## Compute Platform (Raspberry Pi 4)
The compute unit must be able to run ROS 2 and provide Wi-Fi connectivity, enabling the robot to interface with another ROS 2 system in the network. This external system is responsible for high-level functionalities such as teleoperation, navigation, and SLAM, while the onboard unit handles low-level control and communication.

A **Raspberry Pi 4 Model B with 4 GB RAM** was selected, given its availability in inventory and compliance with these functional requirements. The board is configured with **Ubuntu 22.04 LTS (ARM64)** to ensure compatibility with **ROS 2 Humble Hawksbill**, using the official Debian packages for straightforward installation and long-term support.

The compute unit needs regulated 5 V rail to function, which are provided by a DC-DC step-down converter from the 12V battery pack.

<br>

## Modular Aluminum Frame & 3D-Printed Joints

This section outlines the design and development process of the robotic platform’s frame. The **first prototype** was constructed using **2 cm thick cardboard combined with 3D-printed components**. While this approach served as an effective initial test bench, it lacked robustness and structural integrity. The fragile nature of cardboard also made it difficult to securely mount additional hardware, limiting modularity and potential upgrades. This version is shown in the video linked here below.

To overcome these limitations, the **second prototype** was built on a **lightweight aluminum frame**, providing a stronger and more reliable structural base.

<br>
<div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; max-width: 100%;">
  <iframe src="https://www.youtube.com/embed/GvW2oyUfGiU"
          title="ROS 2 Stepper Demo"
          style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen>
  </iframe>
</div>

<br>


### Frame Design

To satisfy the requirements of **rigidity and modularity**, the frame was constructed using **hollow square aluminum tubes** with a **15 mm cross-section** and **1.5 mm wall thickness**. Two standard lengths—**120 mm** and **270 mm**—were selected to simplify manufacturing and assembly. The hollow design allowed the use of **3D-printed connectors**, enabling the frame sections to be easily joined and reconfigured, making the structure both robust and adaptable for future modifications.

<p align="center">
  <img src="/img/projects/project_assets_ros2stepper/ros2stepper_new_08.png" alt="Schematic visualisation of designated space for the design assignment" style="max-width:100%; height:auto;">
</p>

**Figure 8:** CAD models of the 120 mm and 270 mm square tubes (left) and various connector types (right).

<br>

The connectors were designed to join the aluminum tube sections in various configurations, providing flexibility in the overall frame layout. Since the assembly relied entirely on **friction fit**, the connectors had to balance two conflicting requirements: they needed to grip firmly enough to ensure structural stability while remaining loose enough to allow easy disassembly and reconfiguration.

<p align="center">
  <img src="/img/projects/project_assets_ros2stepper/ros2stepper_new_09.png" alt="Schematic visualisation of designated space for the design assignment" style="max-width:80%; height:auto;">
</p>

**Figure 9:** 3D-printed connector prototypes, illustrating iterations with varying dimensions and tolerances.

<br>

Several connector types were developed to support different joining layouts. Achieving the correct tolerance and insertion depth required multiple iterations, each tested using **3D-printed prototypes**. This iterative process enabled fine-tuning of the connector design until an optimal balance between **strength** and **modularity** was achieved, as illustrated in **Figure 9**.

Given the need for rapid dimensional iterations, the entire structure was modeled in **SolidWorks** using its **parametric design capabilities**. By leveraging **equations** and **configuration** features, key dimensions could be adjusted while automatically updating all dependent components, significantly reducing iteration time. Additionally, the configuration feature allowed different versions of the same part to be imported effortlessly into the assembly.

<p align="center">
  <img src="/img/projects/project_assets_ros2stepper/ros2stepper_new_10.png" alt="Schematic visualisation of designated space for the design assignment" style="max-width:100%; height:auto;">
</p>

**Figure 10:** Equations and configuration settings in SolidWorks for implementing the parametric model.

<br>

The final assembled base frame is shown in **Figure 11**. Its dimensions were not arbitrary; they were based on the **average size of autonomous domestic robots**, ensuring the platform remained compact and practical for indoor environments. Additionally, the spacing between the aluminum bars along the X-axis was deliberately selected to allow the fabrication of attachment components in **a single print on a Prusa MINI+ 3D printer** (build volume: 180 × 180 × 180 mm). This constraint influenced the overall modularity strategy, making the platform both scalable and compatible with desktop 3D printing.

<p align="center">
  <img src="/img/projects/project_assets_ros2stepper/ros2stepper_new_11.png" alt="Schematic visualisation of designated space for the design assignment" style="max-width:80%; height:auto;">
</p>

**Figure 11:** CAD model of the assembled base frame, illustrating the configuration of tubes and connectors.

<br>

### Driving Wheel Sub-Assembly

The design of the driving wheel system, partially shown in **Figure 12**, was constrained by the **fixed dimensions** of three key components: the stepper motors, the frame, and the wheels.

The wheels, sourced from a hardware store rather than 3D-printed, have a **diameter of 95 mm** and feature an **outer rubberized surface** to improve traction on smooth indoor floors. They are secured to the frame using a **custom-designed 3D-printed attachment**, as shown in **Figure 13**. Each wheel is mounted on an **M3 screw acting as a shaft**, supported by **two bearings (10 mm outer diameter) per wheel**. Although this solution is not optimal—due to the axial flexibility of the thin M3 screw—it provides sufficient stiffness for the initial prototype.

<p align="center">
  <img src="/img/projects/project_assets_ros2stepper/ros2stepper_new_12.png" alt="Schematic visualisation of designated space for the design assignment" style="max-width:100%; height:auto;">
</p>

**Figure 12:** Components of the driving wheel subsystem. Top left: nut-slot of the stepper motor rig. Bottom left: bearings and the M3 screw used as the wheel shaft. Right: stepper motor attachment bar, and torque transmission connector on the motor shaft.

<br>

The torque from the stepper motor is transmitted to the wheel through a form-fit adapter. This **adapter** is rigidly secured to the motor shaft and **interlocks with the wheel’s profile**, enabling torque transfer without imposing the robot’s weight on the motor shaft. The form-fit adapter consists of **two separate pieces**, clamped together using **screws and nuts**. This design minimizes the need for support material during 3D printing and allows the parts to be printed in an orientation optimized for the load direction. A **third screw** serves as a set screw, pressing against the flat portion of the motor shaft to prevent slipping and ensure secure torque transmission.

The motor is secured to the frame using a **3D-printed bar attachment**, as shown in **Figure 12** and **13**. Additionally, a **custom mounting rig** was developed for the stepper motors, featuring **precisely aligned mounting holes with integrated nut slots** for secure and straightforward assembly, visible in the top-left detail of **Figure 12**.

<p align="center">
  <img src="/img/projects/project_assets_ros2stepper/ros2stepper_new_13.png" alt="Schematic visualisation of designated space for the design assignment" style="max-width:100%; height:auto;">
</p>

**Figure 13:** Multiple views of the driving wheel sub-assembly, showing its components and attachment to the frame.

<br>

The rig also includes a **dedicated slot for the AS5600 encoder**, ensuring correct positioning for accurate angular feedback. The complete CAD model is presented in **Figure 14** (Encoder section). Notably, the rig is composed of **two separate pieces**, a design choice that enables **support-free fabrication** and ensures an **optimal printing orientation to handle mechanical loads effectively**.

<p align="center">
  <img src="/img/projects/project_assets_ros2stepper/ros2stepper_new_14.png" alt="Schematic visualisation of designated space for the design assignment" style="max-width:100%; height:auto;">
</p>

**Figure 14:** Detail of the stepper motor rig, which connects the motor to the support bar, subsequently attached to the frame.

<br>

> Although the current design of the driving wheel subsystem meets the functional requirements, it is a prime candidate for improvement. A larger shaft with standard bearings could enhance robustness, and replacing the direct coupling with a timing belt drive would provide better torque transmission and reduce stress on the motor shaft.
>

<br>

### Full Robot Assembly

The full robot assembly is shown in **Figure 15**. In addition to the previously mentioned components, the caster wheels and their mounts are visible, which employ a similar attachment method to the driving wheels.

The prototype image also reveals the mounted electronics. These components are secured using custom adapters that rely on shape interlocking and material flexibility around the square tubes rather than screws. This approach is acceptable because the electronics do not require precise positioning and can tolerate slight shifts without affecting functionality.

<p align="center">
  <img src="/img/projects/project_assets_ros2stepper/ros2stepper_new_15.png" alt="Schematic visualisation of designated space for the design assignment" style="max-width:100%; height:auto;">
</p>

**Figure 15:** Full robot assembly on the left, and physical prototype on the right.


<br>

# Software

This section documents all the software aspects of this project, namely the **firmware** for the microcontroller board and the **Hardware Component Plugin** used to make the system compatible with ROS2.

<br>

## Microcontroller Board Firmware (ATmega1284P)

This section is meant to give a brief explanation of the system firmware from an high level perspective. The full firmware code can be found in this [**repository**](https://github.com/ricdigi/ros2_dual_stepper_controller/tree/humble/firmware). As can be observed from the image below, there are three classes:   **SerialComm**, **MagneticEncoder**, and **StepperMotor:**

<p align="center">
  <img src="/img/projects/project_assets_ros2stepper/ros2stepper_new_16.png" alt="Schematic visualisation of designated space for the design assignment" style="max-width:100%; height:auto;">
</p>

**Figure 16:** Firmware classes diagram, illustrating the main classes and their interactions.

<br>

The **SerialComm** class manages serial communication, including receiving commands like enabling/disabling motors and setting motor speeds, while also sending back encoder data to the compute unit. It has methods for parsing incoming packets, verifying the integrity via checksums, and extracting data like motor speeds. The communication protocol details are described later in this section.

The **MagneticEncoder** class handles the initialization, calibration, and reading of encoder data. It uses methods like `selectMuxChannel()` for multiplexing sensor channels and `readSensors()` to read the sensor data at specified intervals. Calibration is done by setting offsets based on the encoder’s initial readings.

The **StepperMotor** class manages stepper motor operations, including setting speed, acceleration, and enabling/disabling the motor. The `computeConversionFactor()` method calculates the conversion factor between radians and microsteps, while the `run()` method drives the motor at the current speed, ensuring smooth motion with acceleration and deceleration. Methods like `setSpeedRad()` and `setAccelerationRad()` allow dynamic updates to the motor's motion parameters.

<br>

> The code depends on the **AccelStepper** library for stepper motor control, authored by **waspinator** ([GitHub](https://github.com/waspinator/AccelStepper)), the **Wire** library for I²C communication, developed by the **Arduino** community (Arduino), and the **AS5600** library for interfacing with the magnetic encoder, created by **RobTillaart** ([GitHub](https://github.com/RobTillaart/AS5600)).
>

<br>

## Custom USB-Serial Binary Protocol

The motor controller board is designed to continuously communicate with the Raspberry Pi via USB-serial. On the Raspberry Pi, a dedicated ROS 2 node will handle this communication, translating data between the motor controller and ROS 2 interfaces (such as topics and services). Taking inspiration from the communication protocols used by other commercial sensors and actuators, I implemented a **custom binary protocol to enable structured and efficient data exchange between the two systems.** This section describes the communication protocol and its implementation on the motor controller board through a dedicated C++ class.

<p align="center">
  <img src="/img/projects/project_assets_ros2stepper/ros2stepper_new_17.png" alt="Schematic visualisation of designated space for the design assignment" style="max-width:100%; height:auto;">
</p>

**Figure 17:** Scheme representing the communication between the compute platform and the motor controller board.

<br>

As can be observed from the image above, the motor controller expects angular speed values to assign to its motors, and send back encoder absolute position from both motors. However, the communication towards the board might be expanded in the future with other commands, such as the possibility of disabling completely the motors, or changing the acceleration profiles. For this reason the packet structure has been designed as follows:

$$
[HEADER][CMD][LEN][DATA...][CHECKSUM]
$$

- **HEADER**:     1 byte, fixed value (0xAA) used to mark the start of a new package
- **CMD**:        1 byte, command ID indicating the purpose of the packet (e.g. 0x01 for set velocity)
- **LEN**:        1 byte, number of bytes in the DATA section
- **DATA**:       variable length, payload depending on the CMD (e.g. two **4-byte floats** for motor velocities). Notably, the speed data is sent in little-endian format
- **CHECKSUM**:   1 byte, XOR of all previous bytes (HEADER through last byte of DATA), used for integrity verification

Thus an example packet to set both motors at a speed of 5 rad/s will look like:

<br>

```arduino
0xAA|0x01||0x08|0x00 0x00 0xA0 0x40|0x00 0x00 0xA0 0x40|0x0A
```

<br>

## Firmware Build & Deployment Workflow

The Anet A8 motherboard is based on the **ATmega1284P**, a microcontroller that is **not officially supported by the default Arduino IDE installation**. However, since it belongs to the **Atmel AVR family**, it is **compatible with the Arduino AVR core**, which implements the standard Arduino API (e.g., `digitalWrite()`, `millis()`, `Serial`) in C/C++ for AVR microcontrollers. With the help of a **third-party board package**—such as **Sanguino**—which includes the necessary configuration files (including clock speed, pin mappings, and upload protocol), the ATmega1284P can be fully programmed using the Arduino framework. This approach works because most AVR chips, including the 1284P, provide the minimum hardware features required by the Arduino core (such as timers, GPIO, and UART). While not every AVR is supported by default, many—including this one—can run Arduino code reliably with the right setup.

>In my specific case, however, **installing the [Sanguino](https://github.com/Lauszus/Sanguino) board package in the Arduino IDE was not sufficient**. While the package provides all the necessary configuration files for the ATmega1284P, it also includes a precompiled AVR **toolchain**—specifically the compiler (`avr-gcc`) and uploader (`avrdude`)—that is built for **Intel (x86) processors**. On an **M-series MacBook with an ARM-based processor**, these tools are incompatible and fail to execute. Although **ARM-native versions of the AVR toolchain do exist** (e.g., via Homebrew), I could not find a **straightforward way** of substituting internal toolchain of the Arduino IDE with an external one, making it difficult to program the board using this setup.

>The solution to this limitation was to use [PlatformIO](https://docs.platformio.org/en/latest/what-is-platformio.html), a modern development environment for embedded systems that includes both a command-line interface (PlatformIO Core) and an integrated IDE. Unlike the Arduino IDE, PlatformIO allows fine-grained configuration through project files, making it possible to **override the default compiler and upload tools**. This enabled me to use **ARM-native installations of `avr-gcc` and `avrdude`**, allowing me to compile and upload code to the ATmega1284P directly from my M-series Mac.

<br>

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

<br>

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

<br>

## ROS 2 Control Hardware Interface Plugin

To interface this system with ROS 2, [**ROS 2 Control**](https://control.ros.org/humble/index.html) will be used. This section briefly introduces ROS 2 Control and documents the development and design choices of the `ros2_control` **hardware component plugin**.

<br>

### What is ROS 2 Control

Robotic systems typically integrate a wide range of hardware components—such as motors, encoders, and sensors—and rely on diverse control strategies. Writing new software for controller implementations and hardware interfaces in every project is time-consuming, creates duplicated code, and limits reusability.

**ROS 2 Control** provides a **standardized framework** that abstracts both hardware and control logic, and **defines consistent interfaces for their interaction**. This streamlines development, simplifies integration, and enhances the reuse of components across different robotic platforms, thus promoting, several of the same [**design principles**](https://manual.ro47003.me.tudelft.nl/4_core_concepts/ros2_design_patterns.html) as ROS 2 itself: **substitution**, **reusability**, and **collaborative development**.

<p align="center">
  <img src="/img/projects/project_assets_ros2stepper/ros2stepper_new_18.png" alt="Schematic visualisation of designated space for the design assignment" style="max-width:100%; height:auto;">
</p>

**Figure 18:** High level visualization of the ros2_control as an Interface layer **bridging** the ROS 2 application and the robot hardware. The image was inspired by the explanation at this [link](https://masum919.github.io/ros2_control_explained/).

<br>

### What is an Hardware Component Plugin

To integrate a new hardware component with ROS 2 Control, a **Hardware Component Plugin** must be created. This plugin is a software component which encapsulates the logic for interfacing with the hardware device—typically handling communication over protocols like USB-serial—and exposes the component’s **states** and **command interfaces** to the **ROS 2 control framework**. It acts as a bridge between the physical hardware and the rest of the ROS 2 system, as observed in **Figure 18**.

The implementation of the Hardware Interface Plugin is closely tied to the concepts of ROS 2 Control, making it essential to have a solid understanding of ROS 2 Control to fully comprehend its structure and functionality. For this reason, I recommend visiting my guide [Getting Started guide for ROS 2 Control](https://www.notion.so/link).

<br>

### Custom Hardware Component Plugin for a 2-Wheeled Differential Drive Robot

The robotic platform which I have developed is a **2-wheeled differential drive robot.** To recap, it is a basic mobile robot with a single base frame and two independently controlled wheels with angular position feedback. This setup allows both linear and rotational motion. A detailed kinematic model is available in the [official ros2_control documentation](https://control.ros.org/humble/doc/ros2_controllers/doc/mobile_robot_kinematics.html#differential-drive-robot).

The custom plugin for this robot must be able to communicate with the hardware, sending velocity commands to the motors and receiving angular position data from the encoders. It then processes the encoder data to compute the unwrapped shaft positions and angular velocities.

Since this plugin must have both read and write capabilities, and abstract a system with more than one actuator, among the types of hardware component plugins templates present in the official documentation, the **System** type plugin has been chosen.

Given its 2 wheeled nature, the robot is characterized by the 6 following interfaces:

- 2 command interfaces for motor velocities
- 2 state interfaces for unwrapped shaft positions
- 2 state interfaces for angular velocities

The plugin exposes the six interfaces to the Resource Manager, which then makes these interfaces available to the rest of the ROS 2 control framework, specifically the Controller Manager. The Resource Manager learns about the robot's structure and the hardware plugin to **load** through the URDF file. Special `<ros2_control>` tags are used in the URDF to associate command and state interfaces with the robot’s joints and links. An important note is that multiple hardware plugins can be used at the same time to interface with different hardware components.

<p align="center">
  <img src="/img/projects/project_assets_ros2stepper/ros2stepper_new_19.png" alt="Schematic visualisation of designated space for the design assignment" style="max-width:100%; height:auto;">
</p>

**Figure 19:** Schematic representation of hardware components  and part of the ROS 2 Control abstractions (Hardware Component Plugin, Resource Manager, and Controller Manager). The six interfaces are visible in the left part as black and grey arrows. The right side shows the hardware, which communicates with the robot’s main ROS 2-enabled computing board via a serial link. Details about ROS 2 Control abstractions are explained in the [Getting Started guide for ROS 2 Control](https://www.notion.so/link).

<br>

The Controller Manager reads the `.yaml` configuration file and **loads** the specified controllers. In this setup, two are used:

- the [**joint_state_broadcaster**](https://control.ros.org/humble/doc/ros2_controllers/joint_state_broadcaster/doc/userdoc.html), which publishes the current positions, velocities, and efforts of the robot joints to the standard `/joint_states` topic.

- the [**diff_drive_controller**](https://control.ros.org/humble/doc/ros2_controllers/diff_drive_controller/doc/userdoc.html), which receives as input a target linear velocity (forward/backward) and an angular velocity around the vertical axis. Based on the robot’s kinematics, it computes the corresponding velocity commands for the left and right wheels and forwards them to the hardware interface.

The `diff_drive_controller` operates **open-loop**: it does not use encoder feedback to regulate wheel motion. Instead, encoder data flows through the hardware interface to the `joint_state_broadcaster`, which publishes it for odometry and state estimation in the ROS 2 ecosystem.

<p align="center">
  <img src="/img/projects/project_assets_ros2stepper/ros2stepper_new_20.png" alt="Schematic visualisation of designated space for the design assignment" style="max-width:80%; height:auto;">
</p>

**Figure 20: Controller side abstraction**. On the right, the **Controller Manager** is shown, interfacing with the hardware via the **Resource Manager**, which exposes the relevant command and state interfaces. The Controller Manager reads the `.yaml` configuration file and loads the specified controllers—here, the [joint_state_broadcaster](https://control.ros.org/humble/doc/ros2_controllers/joint_state_broadcaster/doc/userdoc.html) and the [diff_drive_controller](https://control.ros.org/humble/doc/ros2_controllers/diff_drive_controller/doc/userdoc.html).

<br>

Creating the Hardware Component Plugin is only one part of the integration process. The complete set of steps required to implement `ros2_control` for this robotic platform is outlined below:

1. Creating the robot URDF with appropriate `<ros2_control>` tags.
2. Creating the controller YAML configuration file
3. Creating/Sourcing the necessary **hardware component plugin**
4. Creating a launch file to start all the necessary components

The code relative to all of these steps can be found at this [**repository**](https://github.com/ricdigi/ros2_dual_stepper_controller).

<br>

# Testing & Results

## Introduction

This section presents the tests performed on the robot, along with the collected numerical results and visualizations. The tests validate basic robot functionality and quantify performance, with emphasis on movement speed and payload capacity.

<br>

## Step Response Test

This test verifies the responsiveness between motor command and action. Step inputs from 1 to 5 rad/s were sent directly via serial, without passing through ROS2. Both motors were evaluated under identical conditions.

Each trial consisted of three phases:

1. **Warm-up (2 s, 0 rad/s):** Confirm that both encoders are initially static. Encoder samples collected here (with negative timestamps) provide a well-defined baseline.
2. **Step Command (3 s, 1–5 rad/s):** Apply a sudden change in velocity. Encoder angle is unwrapped across revolutions, and instantaneous velocity is estimated using a 3-point central difference method.
3. **Cool-down (0.5 s, 0 rad/s):** Short idle phase ensuring clean separation between trials.

Metrics were defined as follows:

* **Latency**: time from command to first detectable motion (angle jump > 0.5°).
* **Settling Time**: time when velocity enters a ±10% band around the target and remains there for ≥0.5 s.

Each speed was tested in 10 repetitions, totaling 50 runs per motor. Data were logged at two levels:

* `velocity_detailed_log.csv`: full encoder time series with instantaneous velocity.
* `latency_settling_full_log.csv`: trial-level latency, settling time, and final speed (flagged as `1` if target not reached).

<p align="center">
  <img src="/img/projects/project_assets_ros2stepper/ros2stepper_new_21.png" alt="Step response plots" style="max-width:100%; height:auto;">
</p>

From the plots it can be observed that latency is approximately constant across different commanded speeds, with a value of **51 ms**. Settling time increases with speed, likely due to the limited stepping capability of the microcontroller. At **5 rad/s** the motors do not reach the settling condition, and this data point is excluded from the plot.

<br>

## Steady-State Speed Sweep

This test quantifies speed accuracy and variability at constant setpoints. Both motors were commanded from 1 to 15 rad/s. Each trial had two phases:

1. **Warm-up (2 s at 0 rad/s):** establish a stationary baseline.
2. **Measurement (4 s at target speed):** hold constant speed and record velocity.

For each motor, mean speed and variability were computed over \$N\$ samples \$v\_i\$:

$$
\bar{v} = \frac{1}{N} \sum_{i=1}^{N} v_i, \qquad
\sigma_v^2 = \frac{1}{N} \sum_{i=1}^{N} (v_i - \bar{v})^2, \qquad
\sigma = \sqrt{\sigma_v^2}.
$$

<p align="center">
  <img src="/img/projects/project_assets_ros2stepper/ros2stepper_new_22.png" alt="Steady-state sweep plots" style="max-width:100%; height:auto;">
</p>

The plots show the mean measured speed against the commanded speed, with a translucent band of ±1 standard deviation. At low speeds the motors follow the command closely, while at higher speeds a bias develops as the measured speed falls below the reference. The variability also increases, reflecting reduced smoothness at higher speeds.

<br>

## Max-Speed Sweep Test

The final test determines the maximum achievable steady-state speed. Commands were applied from 0 to 30 rad/s in increments of 1 rad/s. Each setpoint was held for 2 s after a short zero-speed warm-up.

For each motor and each setpoint, mean speed and standard deviation were computed:

$$
\bar{v} = \frac{1}{N} \sum_{i=1}^{N} v_i, \qquad
\sigma = \sqrt{\frac{1}{N} \sum_{i=1}^{N} (v_i - \bar{v})^2}.
$$

<p align="center">
  <img src="/img/projects/project_assets_ros2stepper/ros2stepper_new_23.png" alt="Max-speed sweep plots" style="max-width:100%; height:auto;">
</p>

The results show that both motors eventually saturate around 11 rad/s: as command speed increases, the measured curves flatten below the \$y=x\$ line. Variability also widens near this ceiling.

<br>

## Mass & Payload

The robot **weighs 2.8 kg**. It handles up to **\~3.0 kg of additional payload**; at this limit, **step skipping** becomes more frequent. Mitigation: **reduce acceleration rates** (and, if needed, cap top speed) under high load.

<br>

## Current Draw (measured with multimeter)

Current was measured with a multimeter under the robot’s own mass and no added payload. At idle—drivers enabled, motors holding torque—the system draws **0.87 A**. In straight-line motion at **0.40 m/s**, the average draw is **0.93 A**. Across runs, operating current stays within **0.80–1.00 A**.

Assuming 12.0 V DC and $P=VI$:

- **Idle (0.87 A):** $12 \times 0.87 = 10.44$ W
- **Run @ 0.40 m/s (0.93 A):** $12 \times 0.93 = 11.16$ W
- **Observed range (0.80–1.00 A):** $12 \times [0.80, 1.00] = [9.60, 12.00]$ W

<br>
