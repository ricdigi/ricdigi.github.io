---
title: "Getting Started with ROS 2 Control"
description: "An introduction guide to ROS 2 Control, produced from my personal notes."
thumbnail: "img/research/research_ros2control.png"
filename: "research/research_ros2control.html"
group: "Robotics Software"
---


# Getting Started with ROS 2 Control

This page introduces the `ros2_control` framework, starting with the motivation behind its design and providing an overview of its architecture and workflow. It then presents a practical example: integrating `ros2_control` with a differential drive robot, including the description of a custom hardware component plugin implementation.

The content is based on my own learning process while exploring and experimenting with `ros2_control`. I’ve organized and consolidated useful resources—such as official documentation, GitHub repositories, and relevant third-party materials—which are linked throughout the page. I believe this provides a solid introduction to the framework, though it does not cover all aspects in detail.


## **Introduction & Motivation**
Robotic systems typically integrate a wide range of hardware components—such as motors, encoders, and sensors—and rely on diverse control strategies. Developing custom hardware drivers and controllers for each new project is time-consuming and leads to duplicated effort and poor reusability.

`ros2_control` addresses this by providing a **standardized framework** that abstracts both hardware and control logic, and defines consistent interfaces for their interaction. This streamlines development, simplifies integration, and enhances the reuse of components across different robotic platforms, thus promoting, several of the same [**design principles**](https://manual.ro47003.me.tudelft.nl/4_core_concepts/ros2_design_patterns.html) as ROS 2 itself: **substitution**, **reusability**, and **collaborative development**.

The definition in the official [documentation](https://control.ros.org/jazzy/index.html) is:

> The `ros2_control` is a framework for (**real-time**) control of robots using ([ROS 2](https://docs.ros.org/en/rolling/)). […] `ros2_control`’s goal is to simplify integrating new hardware and overcome some drawbacks.
>

<p align="center">
  <img src="/img/research/research_assets_ros2control/ros2control_highlevel.png" alt="Arduino bldc driver" style="max-width:100%; height:auto;">
<p>

**Figure 1:** High level visualization of the `ros2_control` as an Interface layer **bridging** the ROS 2 application and the robot hardware. The image was inspired by the explanation at this [link](https://masum919.github.io/ros2_control_explained/).

To better understand how this abstraction applies in practice, let’s look at a minimal example. Let’s suppose we have a robot arm with two degrees of freedom, like the one displayed in the image:

<p align="center">
  <img src="/img/research/research_assets_ros2control/robot_arm_example.png" alt="Arduino bldc driver" style="max-width:60%; height:auto;">
<p>

**Figure 2:** Schematic represenentation of a 2DOF robot arm. The robot has 2 joints each with a motor and a position sensor.

What we want to achieve is precisely control the position of the end effector which in this case can move inside a planar configuration space. Thus we need to read the current angular position of each joint and, then command their new positon through the actuators. However, from an hardware standpoint, the motors present in the arm can be of different types, (DC motors, Servo Motors, Stepper Motors, etc.) and they can communicate in diffrernt ways (CAN, Serial, etc.)

**Without** `ros2_control`, you’d need to manually implement drivers for each motor type, handle low-level effort conversions (like PWM for DC motors or pulses for steppers), and write custom control loops, running in parallel threads for each joint. You’d also be responsible for synchronizing sensor feedback with motor commands and coordinating joint movements, especially for trajectories.


**With** `ros2_control`, all of that is abstracted. The hardware interface handles lower-level communication with motors and sensors. Built-in controllers handle low-level control tasks such as PID regulation, trajectory interpolation, and synchronized joint execution. The framework runs the control loop for each joint, synchronizes them, and integrates feedback. **It bridges the two abstraction layers—controllers and hardware—while supporting real-time performance.**


> With `ros2_control`, you still have full control over every aspect of the system—**hardware communication**, **control logic**, and **feedback handling**—but each component is **modular and isolated, thus reusable and easily replaceable.**
>

### **Why Not Just Use ROS Topics?**

At first glance, one might assume that the core design principles of ROS—modular components communicating via topics, services, and actions—would be sufficient to implement controllers and hardware interfaces as standard ROS nodes. However, in many `ros2_control` applications this is not feasible, becasue of **real-time requirements**.

Real-time control in robotics refers to the ability to meet **strict and predictable timing constraints** when reading sensor data, running control algorithms, and sending commands to actuators. [DDS](https://en.wikipedia.org/wiki/Data_Distribution_Service) implementations, while flexible, introduces latency and jitter that make it unsuitable for **hard real-time control loops**.  More info about how `ros2_control` achieves real-time performance can be found later in the page.

## **Architecture Overview**

Let’s now present, in **Figure 2,** an expanded version of **Figure 1** to better understand the operational workflow and the roles of the different components in `ros2_control`. We continue using the robot arm example, focusing on the task of moving the end-effector to a target **(x,y)** position.

<p align="center">
  <img src="/img/research/research_assets_ros2control/robot_arch_overview.png" alt="Arduino bldc driver" style="max-width:100%; height:auto;">
<p>

**Figure 3:** Overview of the `ros2_control` architecture during a control loop execution for the 2DOF robot arm. The ROS 2 application sends high-level commands to the **controller**, which computes joint commands based on the current robot state. The **hardware plugin** handles low-level communication with the robot’s actuators and sensors. The **Resource Manager** maps controller interfaces to the appropriate hardware resources, while the **Controller Manager** oversees controller lifecycle operations. The image was inspired by the explanation at this [link](https://masum919.github.io/ros2_control_explained/).



>❗-> Now let’s imagine reusing the same motors from the previous 2-DOF arm in a 2-Wheels differential drive robot. In this case, we would simply switch to a controller tailored to differential drive kinematics, while reusing the same hardware plugin without any modification. This highlights the power of the `ros2_control` framework: **separation of concerns, modularity, and reusability**.


**General Architecture**
Let’s now formalize more generally the architecture of `ros2_control`, and explain the role of each one of its components. In the architecture two sides can be identified, one for the hardware abstractions, and one for the controllers' abstraction. The core components are:

- **Controller Manager (CM)**
- **Controllers**
- **User Interfaces**
- **Resource Manager (RM)**
- **Hardware Component Plugins**

> **Note:**
Parts of the following descriptions are adapted or quoted directly from the official [**ros2_control** documentation](https://control.ros.org/jazzy/doc/getting_started/getting_started.html).
>

<p align="center">
  <img src="/img/research/research_assets_ros2control/gen_arch_overview.png" alt="Arduino bldc driver" style="max-width:100%; height:auto;">
<p>

**Figure 4:** Schematic representation of the `ros2_control` architecture. The two abstraction sides can be easily individuated: the controllers on the left and the hardware interfaces on the right.

### Controller Manager

The [**Controller Manager**](https://control.ros.org/jazzy/doc/getting_started/getting_started.html#controller-manager) (CM) bridges the controllers and hardware abstraction layers of the `ros2_control` framework. It also serves as the entry-point for users via ROS services.

Its primary role is lifecycle management: it loads, configures, activates, deactivates, and unloads controllers and ensures their access to the required interfaces. Controllers can be specified via a YAML file or dynamically through service calls.

The CM interacts with the hardware through the **Resource Manager (RM)**, which manages the available hardware interfaces. When a controller is activated, the CM grants it access to the required hardware interfaces or returns an error in case of a conflict.

The **CM also orchestrates the control loop**. At a fixed rate, it:

- triggers the hardware interface’s `read()` method to update joint states from sensors,
- calls each active controller’s `update()` method to compute control commands,
- triggers the hardware interface’s `write()` method to send those commands to actuators.

Although the CM performs no control logic itself, it ensures correct sequencing and timing of the control cycle.

The `controller_manager` package provides a default node implementation via [`ros2_control_node`](https://github.com/ros-controls/ros2_control/blob/jazzy/controller_manager/src/ros2_control_node.cpp), which uses an internal executor. Alternatively, the CM can be instantiated without an executor for custom integration.

### Controllers

The controllers in the `ros2_control` framework are based on control theory. **They compare the reference value with the measured output and, based on this error, calculate a system’s input.**

When the control-loop is executed, the `update()` method is called by the Controller Manager. This method can access the latest hardware state and enable the controller to write to the hardware command interfaces.

Controller-specific parameters (e.g., gains, interface names) are typically provided via a `.yaml` configuration file or dynamically through ROS services.

The controllers are objects derived from [ControllerInterface](https://github.com/ros-controls/ros2_control/blob/master/controller_interface/include/controller_interface/controller_interface.hpp) (`controller_interface` package in [ros2_control](https://github.com/ros-controls/ros2_control)) and exported as plugins using `pluginlib`-library. For an example of a controller check the [ForwardCommandController implementation](https://github.com/ros-controls/ros2_controllers/blob/master/forward_command_controller/src/forward_command_controller.cpp) in the [ros2_controllers](https://github.com/ros-controls/ros2_controllers) repository. The controller lifecycle is based on the LifecycleNode class, which implements the state machine described in the Node Lifecycle Design document.

### User Interfaces

Users interact with the `ros2_control` framework using [Controller Manager](https://control.ros.org/jazzy/doc/getting_started/getting_started.html#controller-manager)’s services. For a list of services and their definitions, check the `srv` folder in the [controller_manager_msgs](https://github.com/ros-controls/ros2_control/tree/master/controller_manager_msgs) package.

While service calls can be used directly from the command line or via nodes, there exists a user-friendly `Command Line Interface`(CLI) which integrates with the `ros2_cli`. This supports auto-complete and has a range of common commands available. The base command is`ros2_control`. For the description of our CLI capabilities, see the [Command Line Interface (CLI) documentation](https://control.ros.org/jazzy/doc/ros2_control/ros2controlcli/doc/userdoc.html#ros2controlcli-userdoc).

### Resource Manager

The [**Resource Manager**](https://control.ros.org/jazzy/doc/getting_started/getting_started.html#resource-manager) (RM) abstracts physical hardware and its drivers (called *hardware component plugins*) for the `ros2_control` framework. The RM loads the hardware plugin using the `pluginlib`-library, manages their lifecycle and components’ state and command interfaces.

The abstraction provided by RM allows reuse of implemented *hardware plugins*, without any implementation. For example, if the same servomotor is used in multiple joints, the Resource Manager can create multiple instances of the same hardware component plugin. Similarly, a component plugin developed for a specific hardware can be reused across robots or shared with other users by referencing the same plugin in their configuration.

The Resource Manager is made aware of which hardware component plugins to load via the robot's URDF file, specifically through <code>&lt;ros2_control&gt;</code> tags. The URDF associate robot joints and links, with command and state interfaces, and with the required hardware plugin. The Resource Manager then uses `pluginlib` to dynamically load the hardware plugins, initializes them, and registers their command and state interfaces for use by the Controller Manager and thus controllers.

In the control loop execution, the RM’s `read()` and `write()` methods handle the communication with the hardware components.

### Hardware Component Plugins

The *hardware component plugins* realize communication to physical hardware and represent its abstraction in the `ros2_control` framework. The components have to be exported as plugins using `pluginlib`-library. The [**Resource Manager**](https://control.ros.org/jazzy/doc/getting_started/getting_started.html#resource-manager) dynamically loads those plugins and manages their lifecycle.

There are three basic types of components:

- **System:** Complex (multi-DOF) robotic hardware like industrial robots. The main difference between the *Actuator* component is the possibility to use complex transmissions like needed for humanoid robot’s hands. This component has reading and writing capabilities. It is used when there is only one logical communication channel to the hardware.
- **Sensor:** Robotic hardware is used for sensing its environment. A sensor component is related to a joint (e.g., encoder) or a link (e.g., force-torque sensor). This component type has only reading capabilities, thus providing a state interface.
- **Actuator:** Simple (1 DOF) robotic hardware like motors, valves, and similar. An actuator implementation is related to only one joint. This component type has reading and writing capabilities. Reading is not mandatory if not possible (e.g., DC motor control with Arduino board). The actuator type can also be used with a multi-DOF robot if its hardware enables modular design, e.g., CAN-communication with each motor independently.

## Practical Example: A 2-Wheeled Differential Drive Robot

As part of my learning process with `ros2_control`, I built a differential drive robot and developed a custom hardware plugin. This section uses that example to provide practical guidance on applying `ros2_control` in similar scenarios.

A **2-wheeled differential drive robot** is a basic mobile robot with a single base frame and two independently controlled wheels. This setup allows both linear and rotational motion. A detailed kinematic model is available in the [official ros2_control documentation](https://control.ros.org/humble/doc/ros2_controllers/doc/mobile_robot_kinematics.html#differential-drive-robot).

This example demonstrates how to integrate `ros2_control` with a 2-wheeled differential drive robot using a minimal but realistic architecture. The robot includes two motors with encoder feedback, a microcontroller board, and a ROS 2-enabled computing unit. Control and feedback pass through a custom hardware plugin.

### Example Roadmap

In order to integrate this robot with `ros2_control` several steps must be executed:

1. Creating the robot URDF with appropriate <code>&lt;ros2_control&gt;</code> tags.
2. Creating the controller YAML configuration file
3. Creating/Sourcing the necessary hardware component plugin
4. Creating a launch file to start all the necessary components

I will however first present the specific architecture I designed for this example, such to connect the general architecture concepts to a practical example. Moreover I will briefly give more details on the hardware used.

### Specific Architecture overview for this example

This section outlines the system architecture used in my implementation of a differential drive robot. It's one of many possible configurations; the reader may encounter alternative designs in other projects or documentation.

To understand the employed architecture and apply its concepts to other robotics projects, it’s useful to briefly describe the physical hardware I have used in this example. The system includes a main board with a microcontroller and integrated motor drivers. Two motors—left and right—are connected to the board, each paired with an absolute magnetic encoder for shaft position feedback. The micorcontroller communicates with the robot’s main computing board (running ROS2) through serial communication. The **physical system components** are schematized in the figure below, on the right side.

<p align="center">
  <img src="/img/research/research_assets_ros2control/diff_drive_arch_1.png" alt="Arduino bldc driver" style="max-width:100%; height:auto;">
<p>

**Figure 5:** In the left part of the image above, the hardware abstraction layer of the architecture is illustrated. While on the right side, the hardware, communicating with the robot’s main computing board—running ROS 2—via serial can be observed.

The software component that enables `ros2_control` components to interface with the hardware is the **hardware plugin**. This plugin implements the specific communication protocol used over the serial link: it sends velocity commands to the motors and receives angular position data from the encoders. It then processes the encoder data to compute the unwrapped shaft positions and angular velocities.

> In this case since this plugin must have both read and write capabilities, and abstract a system with more than one actuator, among the types of hardware component plugins introduced in previous sections, the **System** type plugin has been chosen**.**
>

As can observed from the scheme, this example’s plugin exposes six interfaces to the resource manager:

- 2 command interfaces for motor velocities
- 2 state interfaces for unwrapped shaft positions
- 2 state interfaces for angular velocities

The resource manager then makes these interfaces available to the rest of the ROS 2 control framework, specifically the controller manager.

The Resource Manager learns about the robot's structure and the hardware plugin to load through the URDF file. Special `<ros2_control>` tags are used in the URDF to associate command and state interfaces with the robot’s joints and links. An important note is that multiple hardware plugins can be used at the same time to interface with different hardware components. More details on how to write the URDF for this example can be found later in the page.

<p align="center">
  <img src="/img/research/research_assets_ros2control/diff_drive_arch_2.png" alt="Arduino bldc driver" style="max-width:60%; height:auto;">
<p>

**Figure 6:** The image above illustrates the **controller side abstraction**. On the right, the **Controller Manager** is shown, interfacing with the hardware via the **Resource Manager**, which exposes the relevant command and state interfaces. The Controller Manager reads the `.yaml` configuration file and loads the specified controllers—here, only one is used: the [diff_drive_controller](https://control.ros.org/humble/doc/ros2_controllers/diff_drive_controller/doc/userdoc.html).

TODO- join state publisher?

This controller receives a target linear velocity (forward/backward) and an angular velocity around the vertical axis (perpendicular to the motion plane). Based on the robot’s kinematics, it computes velocity commands for the left and right motors. It also uses encoder feedback to publish joint state updates and broadcast coordinate frame transforms over standard ROS 2 topics.

### Defining the Robot Structure and Control Interfaces with Xacro

This section presents the **Xacro** files used to define the differential drive robot, with particular focus on the `<ros2_control>` tag. This tag specifies the state and command interfaces, along with hardware parameters used by the hardware component plugin and controllers. Xacro is used to modularize the robot description and eliminate redundancy across files. It can be compiled in a URDF at runtime.

> With the robot description file, `ros2_control` can associate each joint with its specified state and command interfaces. It also uses the `<ros2_control>` tag to load the corresponding hardware component plugin— in this case, the one corresponding to the drivetrain physical component.
>

Useful resources to write and understand the robot URDF for `ros2_control` are:

- https://github.com/ros-controls/roadmap/blob/master/design_drafts/hardware_access.md
- https://github.com/ros-controls/roadmap/blob/master/design_drafts/components_architecture_and_urdf_examples.md

<p align="center">
  <img src="/img/research/research_assets_ros2control/diff_drive_urdf.png" alt="Arduino bldc driver" style="max-width:50%; height:auto;">
<p>

The figure above shows a model of the robot we want to describe, which consists of three links: the **base link**, and the **left** and **right wheels**. The files are organized as follows:

```arduino
description/
├── meshes/
│   ├── urdf_base_link.STL
│   ├── urdf_left_wheel.STL
│   └── urdf_right_wheel.STL
└── urdf/
    ├── robot_parts/
    │   ├── base_link.xacro
    │   └── wheel.xacro
    ├── **dual_stepper.ros2_control.xacro**
    └── **dual_stepper.urdf.xacro**
```

The `meshes/` folder contains geometry files used purely for visualization. The `urdf/` folder holds the Xacro files that define the robot's structure and control interfaces. Since the focus of this example is on illustrating the use of `ros2_control`, only the Xacro files relevant to this scope will be discussed. The explanation of each block can be found in the xacro files comments.

> **Note:** The `dual_stepper` naming used across the files was chosen due to the use of stepper motors for the wheels actuators
>

**diff_drive_robot.urdf.xacro**

```xml
<?xml version="1.0"?>
<robot xmlns:xacro="http://www.ros.org/wiki/xacro" name="dual_stepper">

    <!-- Include all macro definitions -->
    <xacro:include filename="robot_parts/base_link.xacro"/>
    <xacro:include filename="robot_parts/wheel.xacro"/>
    <xacro:include filename="dual_stepper.ros2_control.xacro"/>

    <!-- Robot structure -->
    <!-- This is the standard robot description section, where links and joints
         are defined. In this case, they are instantiated using the base_link
         and wheel macros. -->
    <xacro:base_link/>

    <xacro:wheel name="left_wheel" parent="base_link"
                 xyz="0.0 0.1156 0.046" rpy="0 0 0"
                 axis="0 1 0" mesh_filename="urdf_left_wheel.STL"/>

    <xacro:wheel name="right_wheel" parent="base_link"
                 xyz="0.0 -0.1156 0.046" rpy="0 0 0"
                 axis="0 1 0" mesh_filename="urdf_right_wheel.STL"/>

    <!-- ros2_control-specific part – defined below -->
    <xacro:ros2_dual_stepper_controller name="DualStepperSystem"
												     left="left_wheel" right="right_wheel"/>

</robot>

```

**diff_drive_robot.ros2_control.xacro**

```xml
<?xml version="1.0"?>
<robot xmlns:xacro="http://ros.org/wiki/xacro">
    <xacro:macro name="ros2_dual_stepper_controller" params="name left right">

        <!-- This tag and its contents are relevant to ros2_control.
             The 'type' attribute specifies the type of hardware component
             being described: System, Actuator, or Sensor. -->
        <ros2_control name="${name}" type="system">

            <!-- The hardware tag defines the hardware plugin, as registered
                 in pluginlib. Additional parameters can be passed here and
                 will be available to the hardware plugin at runtime. -->
            <hardware>
                <plugin>dual_stepper_hardware_interface/DualStepperHardwareInterface</plugin>
                <param name="serial_port">/dev/ttyUSB0</param>
                <param name="baud_rate">115200</param>
            </hardware>

            <!-- Each joint entry tells ros2_control which interfaces are exposed
                 for a specific joint. In this case:
                   - 1 command interface for velocity control
                   - 2 state interfaces: position and velocity

                 IMPORTANT: the joint name here must exactly match the name of
                 the joint defined in the URDF structure. -->
            <joint name="${left}_joint">
                <command_interface name="velocity"/>
                <state_interface name="position"/>
                <state_interface name="velocity"/>
            </joint>

            <joint name="${right}_joint">
                <command_interface name="velocity"/>
                <state_interface name="position"/>
                <state_interface name="velocity"/>
            </joint>

        </ros2_control>

    </xacro:macro>
</robot>

```

### Controller Configuration YAML File

To activate and configure controllers in `ros2_control`, the Controller Manager loads a YAML file at launch time. This file specifies which controllers to start, their plugin types, and the relevant parameters.

In this example, the configuration includes:

- A `JointStateBroadcaster` to publish joint state data to `/joint_states`.
- A `DiffDriveController` to process velocity commands and compute wheel-level control and odometry.

The full configuration is shown below:

```yaml
# This file defines the controller setup for the differential drive robot.
# It is intended to be launched via the controller_manager using the ros2_control framework.
# Specifically, it loads:
# - A JointStateBroadcaster to publish joint state information to /joint_states
# - A DiffDriveController to handle velocity commands and compute odometry based on wheel feedback

controller_manager:
  ros__parameters:
    # Main update frequency of the controller manager (Hz)
    update_rate: 100

    # Joint State Broadcaster
    # Publishes joint positions and velocities to /joint_states
    joint_state_broadcaster:
      type: joint_state_broadcaster/JointStateBroadcaster

    # Differential Drive Controller
    # Receives /cmd_vel commands and computes individual wheel velocities
    dual_stepper_base_controller:
      type: diff_drive_controller/DiffDriveController

# Parameters for the differential drive controller
# **These must match the URDF joint names and physical dimensions**
dual_stepper_base_controller:
  ros__parameters:
    # Wheel joint names **as defined in the URDF**
    left_wheel_names: ["left_wheel_joint"]
    right_wheel_names: ["right_wheel_joint"]

    # Physical properties of the robot
    wheel_separation: 0.2312      # Distance between the centers of the wheels [m]
    wheel_radius: 0.065           # Radius of the wheels [m]

    # Base frame ID used in odometry and transform broadcasts
    base_frame_id: base_link

    # Input and safety parameters
    use_stamped_vel: false        # Set to true if using geometry_msgs/TwistStamped instead of Twist
    cmd_vel_timeout: 0.5          # Timeout (seconds) after which the robot stops if no new /cmd_vel

    # Odometry publishing rate
    publish_rate: 50.0            # Odometry and transform publication rate [Hz]

```

### Writing a Launch file

The launch file is used to quickly launch more nodes each with their specific parameters. In particular here the launch files does:

- Compiles the Xacro file into a URDF and starts a Robot State Publisher node
- Starts a node running the controller manager,  the `.yaml` file is passed as a parameter and subsequently **starts the joint states broadcaster**, to publish the /joint_states topic, and **loads the differential drive controller**

Optionally, the launch file can also start `rviz2` for robot visualization and, for example, a `teleop_twist_keyboard` node to control the robot via keyboard input.

> **Note:**
In order to succesfully launch these nodes, one have to make sure that all the require packages are installed and sourced.
>

```python
from launch import LaunchDescription
from launch.actions import DeclareLaunchArgument, RegisterEventHandler
from launch.conditions import IfCondition
from launch.event_handlers import OnProcessExit
from launch.substitutions import Command, FindExecutable, PathJoinSubstitution, LaunchConfiguration

from launch_ros.actions import Node
from launch_ros.substitutions import FindPackageShare

def generate_launch_description():

		# --- Generate the URDF file from Xacro and publish Robot Description---
    robot_description_content = Command([
        PathJoinSubstitution([FindExecutable(name="xacro")]),
        " ",
        PathJoinSubstitution([
            FindPackageShare("ros2_dual_stepper_controller"),
            "description", "urdf", "dual_stepper.urdf.xacro"
        ])
    ])
    robot_description = {"robot_description": robot_description_content}
    robot_state_pub_node = Node(
        package="robot_state_publisher",
        executable="robot_state_publisher",
        output="both",
        parameters=[robot_description],
    )


		# --- Launch controller manager with robot description and controllers ---
		#
		#     Define the YAML config file path and starts
		#     the following processes:
		#
		#         - Launchs the Controller Manager
		#         - Start the Joint State Boradcaster
		#         - Start the Differential Drive Controller

    robot_controllers = PathJoinSubstitution([
        FindPackageShare("ros2_dual_stepper_controller"),
        "config", "diff_drive_controllers.yaml"
    ])

    control_node = Node(
        package="controller_manager",
        executable="ros2_control_node",
        parameters=[robot_description, robot_controllers],
        output="both",
    )


    joint_state_broadcaster_spawner = Node(
        package="controller_manager",
        executable="spawner",
        arguments=["joint_state_broadcaster", "--controller-manager", "/controller_manager"],
    )

    robot_controller_spawner = Node(
        package="controller_manager",
        executable="spawner",
        arguments=["dual_stepper_base_controller", "--controller-manager", "/controller_manager"],
    )

    return LaunchDescription(declared_arguments + [
        robot_state_pub_node,
        control_node,
        robot_controller_spawner,
    ])

```

### Writing a custom Hardware Interface

In `ros2_control` hardware component plugins are libraries, dynamically loaded by the controller manager using the [pluginlib](https://ros.org/wiki/pluginlib) interface.

This section outlines the process of writing a custom hardware interface. While the official documentation is technically complete, it's not well structured, and certain aspects can be confusing. My goal is to document the steps I followed and the resources I used, providing a more streamlined and practical reference.

The full code for this example is available in the [repository](https://github.com/ricdigi/ros2_dual_stepper_controller), which also includes the firmware for the hardware—though the latter is not directly relevant to this documentation.

> **Note:** The code shown here **targets** **ROS 2 Humble**. Some elements have changed in later versions (e.g. Jazzy); I’ll highlight those design differences where possible, though I haven’t tested them hands-on.
>

**Preparing the package directory**

The first thing to do when writing a custom hardware interface is having an organized package directory. An example **minimal folder structure** is presented here:

```yaml
ros2_dual_stepper_controller/
├── include/
│   └── ros2_dual_stepper_controller/
│       ├── dual_stepper_hardware_interface.hpp
│
├── src/
│   ├── dual_stepper_hardware_interface.cpp
│
├── launch/
├── CMakeLists.txt
├── package.xml
└── ros2_dual_stepper_controller.xml
```

In order to create such folder structure more easily one could use the command:

 `ros2 pkg create <package_name> --build-type ament_cmake`

This will create at least `CMakeLists.txt` and `package.xml` . In addition you will need to create anoter xml file, in this case `ros2_dual_stepper_controller.xml` , used to define the library path and hardware interface’s class which has to be visible to **pluginlib**. Then you need to add the directories: `src` and `include/ros2_dual_stepper_controller` respectively for source and header class files.

**Writing the declarations into header file  (.hpp)**

In `ros2_control`, the hardware plugin class must be an extension of one of the three previously introduced hardware components base classes, **System**, **Sensor**, or **Actuator**:

```cpp
class HardwareInterfaceName : public hardware_interface::$InterfaceType$Interface
```

In my specific case, since I am abstracting my hardware with a **System type** component

```cpp
class DualStepperHardwareInterface : public hardware_interface::SystemInterface
```

I have also to include the corresponding header at the top of the file:
`#include "hardware_interface/system_interface.hpp"`

It might be useful to consult these resources to understand better the methods of base classes:

- https://github.com/ros-controls/ros2_control/blob/humble/hardware_interface/include/hardware_interface/system_interface.hpp
- https://github.com/ros-controls/ros2_control/blob/humble/hardware_interface/src/system.cpp

For a minimal setup, appropriate for a system like my differential drive robot, a constructor without parameters must be defined, and specific methods must be implemented or overridden:

```cpp
public:

hardware_interface::CallbackReturn on_init(const hardware_interface::HardwareInfo & info) override;
hardware_interface::CallbackReturn on_configure(const rclcpp_lifecycle::State & previous_state) override;

std::vector<hardware_interface::StateInterface> export_state_interfaces() override;
std::vector<hardware_interface::CommandInterface> export_command_interfaces() override;

hardware_interface::return_type read(const rclcpp::Time & time, const rclcpp::Duration & period) override;
hardware_interface::return_type write(const rclcpp::Time & time, const rclcpp::Duration & period) override;
```

The `on_init()` method should initialize all memebr variables and process the parameters from the `info` argument which come directly from parsing the URDF file. In the first line usually the parents `on_init` method is called to process standard values, like name. More in the implementation code block below.

The `on_configure()` should setup the communication to the hardware and set everything up so that the hardware can be activated.

The `export_state_interfaces()` is used to define the physical location on the memory where each state interface variable is stored. WHile the `export_command_interfaces()` is used to define the physical location on the memory where each command interface variable is stored. This information will be used from the resource manager to grant access to the controllers to these memory locations.

The `read()` method is the place where to implement the logic relative to the reception of feedback data from the hardware, and then update state interface varaibles. SImilarly, the `write()` method is the place where to implement the sending of commands signal to the hardware.

**Adding the definitions into source file  (.cpp)**

Here I will report without going into much detail the implementation of my methods. The reader is invited to consult the repository for more details. Logging commands, and security checks have been removed to keep only the strictly functional part.  Moreover, the **CMakeList** is only available in the repository.

> It is very **IMPORTANT** to include the `PLUGINLIB_EXPORT_CLASS` macro at the end of the hardware itnerface class source file. For this you will need to include the `"pluginlib/class_list_macros.hpp"` header.
>

```cpp
#include "pluginlib/class_list_macros.hpp"
PLUGINLIB_EXPORT_CLASS(
  dual_stepper_hardware_interface::DualStepperHardwareInterface, hardware_interface::SystemInterface)
```

**on_init() method:**

```cpp
hardware_interface::CallbackReturn DualStepperHardwareInterface::on_init(const hardware_interface::HardwareInfo & info) {

    // Call the parent class default on_init() method
    if (hardware_interface::SystemInterface::on_init(info) != hardware_interface::CallbackReturn::SUCCESS) {
        return hardware_interface::CallbackReturn::ERROR;
    }

    /* The default on_init() method processes the HardwareInfo object, which contains hardware details parsed from the
     * robot's URDF. This parsing is performed by the Resource Manager using the function
     * parse_control_resources_from_urdf(), defined in
     * ros2_control/hardware_interface/include/hardware_interface/component_parser.hpp.
     */

    // Initialize the wheel joints with the parameters from the hardware info
    // Wheel is a class, and name is a class attribute.
    left_wheel_.name = info_.joints[0].name;
    right_wheel_.name = info_.joints[1].name;

}
```

**on_configure() method:**

```cpp
hardware_interface::CallbackReturn DualStepperHardwareInterface::on_configure(const rclcpp_lifecycle::State & /*previous_state*/) {

    // Configure and initialize the serial port and baud rate from the hardware parameters
    // These parameters are the one defined inside the URDF <hardware> tag.
    serial_comm_ = SerialComm();
    serial_comm_.setSerialPort(info_.hardware_parameters.at("serial_port"));
    serial_comm_.setBaudRate(std::stoi(info_.hardware_parameters.at("baud_rate")));

    if (serial_comm_.init() != hardware_interface::CallbackReturn::SUCCESS) {
        return hardware_interface::CallbackReturn::ERROR;
    }

}
```

**export_state_interfaces() method:**

```cpp
std::vector<hardware_interface::StateInterface> DualStepperHardwareInterface::export_state_interfaces() {

  // Create a vector to hold the state interfaces that will be exposed to ros2_control
  // each elemetn will be a pointer to the actual memory where the hardware state value (e.g., position, velocity) is stored.
  std::vector<hardware_interface::StateInterface> state_interfaces;

  // Add a new StateInterface to the vector using emplace_back().
	state_interfaces.emplace_back(
	  joint_name,                          // Name of the joint (must match the one in the URDF)
    hardware_interface::HW_IF_POSITION,  // type of the interface data ("position", "velocity", etc.)
	  &reference_to_variable               // Pointer to the variable holding the actual state data
	);

	// [...] Similar for the other trhee state interfaces [...]

  return state_interfaces;
}
```

**export_commadn_interfaces() method:**

```cpp
std::vector<hardware_interface::CommandInterface> DualStepperHardwareInterface::export_command_interfaces() {

  // Similar to the state interfaces
  std::vector<hardware_interface::CommandInterface> command_interfaces;

  command_interfaces.emplace_back(
		hardware_interface::CommandInterface(
			left_wheel.name,
			hardware_interface::HW_IF_VELOCITY,
			&left_wheel_.commanded_velocity_rad_s));

	// [...] Similar for the other three command interfaces [...]

  return command_interfaces;
}
```

**read() method:**

```cpp
hardware_interface::return_type DualStepperHardwareInterface::read(
    const rclcpp::Time & time, const rclcpp::Duration & period) {


		// In this method I retrieve the encoder data from serial and save it in the correct location
		// the measured velocity is computed here as well.
    readEncoderData(period);

    return hardware_interface::return_type::OK;
}
```

**write() method:**

```cpp
hardware_interface::return_type DualStepperHardwareInterface::write(
    const rclcpp::Time & time, const rclcpp::Duration & period) {

		// Reading the command interface varaible and forwarding its value to the hardware via serial
		// The value was previously updated from the controller.
    if (!sendVelocityCommand()) {
        RCLCPP_ERROR(get_logger(), "Failed to send velocity command to the stepper motors.");
        return hardware_interface::return_type::ERROR;
    }

    return hardware_interface::return_type::OK;
}
```

**Writing the** **export definition file for pluginlib**

```xml
<!-- In the path field you should put the package root directory name -->
<!-- In the class name field you should reference the class name with the correct namespace -->
<library path="ros2_dual_stepper_controller">
    <class name="dual_stepper_hardware_interface/DualStepperHardwareInterface"
           type="dual_stepper_hardware_interface::DualStepperHardwareInterface"
           base_class_type="hardware_interface::SystemInterface">
        <description>
            The ros2_control Dual Stepper HI uses a system hardware interface-type. It uses velocity command and position state interface.
            This hardware component plugin is for a dual stepper motor actuator, designed for differential drive robots.
            The hardware is repurposed from an ANET A8 3D printer.
        </description>
    </class>
</library>

```

## **How `ros2_control` Enables Real-Time Control**

In `ros2_control` the core control loop is executed in a **dedicated real-time thread**, launched by the `ros2_control_node`, allowing controllers and hardware interfaces to interact through **direct memory access** using C++ pointers and handles. The `controller_manager` obtains a **reference (handle)** to each hardware interface.

All services and interactions that are not time-critical, such as controller loading or diagnostics, are handled in non-real-time threads. This separation ensures that non-deterministic operations do not interfere with the real-time control loop.

To facilitate interaction between real-time and non-real-time parts of the system, `ros2_control` uses techniques such as **lock-free buffers** and state machines. These allow for data exchange (e.g., receiving commands, publishing state) without blocking the control thread.

When controllers are loaded or switched, changes take effect at the beginning of the next control cycle. This approach maintains the determinism of the control loop by avoiding mid-cycle alterations.

**Sources:**

1. ROS Discourse – Real-time safety in `ros2_control`:
https://discourse.ros.org/t/ros2-control-realtime-safety/40759/2
2. Reddit discussion – ROS 2 Control doubt:
[https://www.reddit.com/r/ROS/comments/11kc6oc/ros\\_2\\_control\\_doubt/](https://www.reddit.com/r/ROS/comments/11kc6oc/ros%5C%5C_2%5C%5C_control%5C%5C_doubt/)

<aside>
➡️

In this [**ROS Discourse discussion**](https://discourse.ros.org/t/question-regarding-ros2-control-design/38751) a contributor from Stogl Robotics shared his experience with distributing `ros2_control` components across multiple nodes in a network. He reported that he managed to achieve good real-time control performances, but that attaining **hard real-time** performance (with jitter under 1%)—as required in industrial applications—remains challenging. He alsos tates that achieving **soft real-time** performances (with jitter up to 50%) is more easily doable, but still requiring  a consitent amount of work to make it nicely integrated into the current architecture.

</aside>

The framework avoids using ROS topics for the control loop itself. Instead, it:

- Uses **pluginlib** to dynamically load controllers and hardware interfaces.
- Connects them through shared memory and standardized interfaces.
- Ensures timing is **deterministic** and system load is predictable.

This approach has been benchmarked and shown to meet the strict latency and jitter requirements that real-time control demands.
