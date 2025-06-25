---
title: "ROS2 - General Knowledge"
description: "Just a place where I can put some notes about ROS2."
thumbnail: "img/research/research_ROS2.png"
filename: "research/research_ROS2general.html"
group: "Robotics Software"
---

# ROS2 General Knowledge
This section is a work-in-progress collection of notes and concepts I’m learning about **ROS 2**. It’s not meant to be a complete guide, but rather a collection of notes as I explore core components like DDS, workspaces, packages, robot model formats (URDF, SDF, Xacro), and more.

## The Data Distribution Service (DDS)

This section introduces the Data Distribution Service (DDS) used in ROS 2, starting with its core architecture. It then presents supported implementations, communication modes (multicast and unicast), discovery mechanisms—including static discovery in VPNs—and concludes with a discussion on real-time communication in robotics and the role of QoS.

### Introduction to DDS

The Data Distribution Service (DDS) is a communication standard defined by the Object Management Group (OMG), designed for real-time, scalable, and decentralized data exchange, particularly suited for **distributed systems such as robotic applications**. It follows a *publish-subscribe* paradigm, where those who produce data are called *publishers* and those who consume data are *subscribers*. The two are decoupled and communicate via **topics**.

The advantage of this model lies in modularity and decoupling: each node only needs to know the *topic name* and *data type*—i.e., the **communication interface**. ROS 2, however, also includes **services** and **actions**, which are not natively defined by DDS but are implemented internally using DDS topics. Services allow synchronous request-response communication, while actions support long-running tasks with progress feedback and cancellation.

### DDS Implementations in ROS 2

DDS is a standard, and multiple implementations exist. The most widely used open-source implementations in ROS 2 are **Fast DDS** (by eProsima) and **Cyclone DDS** (by the Eclipse Foundation). DDS in ROS 2 enables **peer-to-peer communication**, meaning that each node independently discovers and communicates with other nodes. This is a major shift from ROS 1, where a centralized *ROS Master* handled node registration and topic coordination.

### Communication Modes: Multicast and Unicast

DDS supports different types of communication, primarily **multicast** and **unicast**.

**Multicast** is a method where a single data packet is sent to a group of receivers subscribed to a specific multicast address. This is particularly efficient when a publisher needs to send the same data to multiple subscribers on the same network.

**Unicast**, in contrast, is a one-to-one communication model in which data is sent directly from a publisher to each subscriber. While less efficient for group communication, it is more reliable in restrictive or heterogeneous network environments. **DDS falls back to unicast when multicast is not available or not desired.**

### Discovery Mechanisms

DDS features a built-in discovery mechanism that allows nodes to become aware of each other without a centralized coordinator. This is managed through the **Simple Participant Discovery Protocol (SPDP)** and the **Participant Discovery Protocol (PDP)**. Every DDS participant periodically broadcasts discovery messages that include metadata about its topics, endpoints, and QoS settings.

By default, these discovery messages are transmitted using **multicast**. However, in environments where multicast is not supported—such as certain corporate networks—DDS implementations can use **unicast** for discovery instead. In this case, nodes send individual discovery messages to a list of known participants or to statically configured IP addresses.

An example where unicast discovery is necessary is when nodes communicate over a **VPN**. In such cases, multicast traffic is often blocked or unsupported. To enable discovery, the default DDS configuration (typically defined in an XML file) can be modified to use **static discovery**, explicitly listing the IP addresses or unique identifiers of each node. This allows all participants to locate and communicate with each other over unicast, bypassing the need for multicast-based dynamic discovery.

An example custom configuration file is shown in the code below:

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<profiles xmlns="http://www.eprosima.com/XMLSchemas/fastRTPS_Profiles">

    <!-- Default participant profile -->
    <participant profile_name="TailscaleSimple" is_default_profile="true">
        <rtps>
            <builtin>
                <initialPeersList>
                    <!-- Static discovery: list of known peers (hostnames or IPs) -->
                    <locator>
                        <udpv4>
                            <address>ricdigipi</address>
                        </udpv4>
                    </locator>
                    <locator>
                        <udpv4>
                            <address>ubuntu01</address>
                        </udpv4>
                    </locator>
                </initialPeersList>
            </builtin>
        </rtps>
    </participant>

</profiles>
```

This configuration file defines a **default participant profile** named `TailscaleSimple` for ROS 2 nodes using Fast DDS. It enables **static discovery** by explicitly listing known peers under `<initialPeersList>`. Each `<locator>` entry specifies a hostname (or IP) of another participant. This is essential in VPN setups (e.g. Tailscale), where **multicast is unavailable**, and DDS cannot automatically discover peers. https://fast-dds.docs.eprosima.com/en/latest/fastdds/ros2/ros2_configure.html.

In order for nodes to communicate, they must be assigned to the same **ROS domain** by setting the environment variable `ROS_DOMAIN_ID`, which controls the **isolation** of communication between systems running on the same network. Moreover, setting the environment variable `FASTRTPS_DEFAULT_PROFILES_FILE` specifies the path to a custom Fast DDS configuration file. Finally, `RMW_IMPLEMENTATION` sets the desired DDS implementation to be used by ROS 2. **RMW (ROS Middleware)** layer acts as an abstraction between ROS 2 and the underlying DDS implementation.

### Real-Time Communication and QoS

In the initial definition of DDS, real-time communication was mentioned. In robotics, *real-time* means that the system guarantees specific timing constraints: **responses occur within predictable and bounded time**. This is essential to ensure the safety and stability of robotic behavior—for example, in closed-loop control, where delayed commands can lead to physical errors or instability.

To support real-time behavior, DDS provides fine-grained control over communication through **Quality of Service (QoS) policies**. These parameters allow developers to tune:

- **Reliability** (reliable vs. best-effort delivery),
- **Durability** (data persistence for late joiners),
- **History** (how many past messages are retained),
- **Deadline** (maximum time allowed between messages),
- **Liveliness** (detects whether a publisher is still active).

Selecting appropriate QoS settings is critical in robotic applications, especially where timing, safety, or data consistency is important. Combined with real-time operating systems and properly tuned DDS implementations, ROS 2 can meet the real-time demands of complex robotic systems.

---

## Creating ROS workspaces and packages

When starting a new ROS project, it is standard practice to create a new workspace. This workspace, known as an *overlay*, is built on top of an *underlay*, which is typically the base ROS installation (e.g., `/opt/ros/...`) but can also be another workspace. Creating a dedicated workspace ensures a clean, modular, and manageable development environment.

Each **workspace** **contains** the packages relevant to the project. In ROS, a package is the basic unit of build, organization, and distribution.  A **package** can **include** a wide range of resources, such as source code for nodes (written in C++, Python, or other languages), launch files, configuration files, URDFs, meshes, scripts, and documentation. This structure ensures that each package is self-contained, allowing ROS tools like `catkin` or `colcon` to properly recognize, build, and manage it within the workspace.

When **creating a new ROS workspace**, it is useful to first run the command `colcon build`. Although this is not its only purpose, in this situation it helps set up the necessary folders and configuration files for the workspace. Example created folder structure:

```bash
example_ros_ws/
├── build/
├── install/
│   ├── setup.bash
│   ├── local_setup.bash
│   └── (other setup files)
├── log/
└── src/ # Usually the /src is created manually
```

To **create a ROS package** inside a workspace, we usually position ourselves inside the `src/` directory. We can then run a command that automatically sets up the minimal folder structure and files we need:

```bash
ros2 pkg create <package_name> [OPTIONS]
```

An important option to specify at runtime is `--build-type <type>`, which defines whether the package will use Python or C++. Packages can also include both Python and C++ nodes, but creating a mixed package requires manually modifying one of these two base structures to support both languages properly. An example structure for a C++ package is:

```bash
my_cpp_package/
├── CMakeLists.txt
├── package.xml
├── src/
│   └── my_node.cpp
├── include/
│   └── my_cpp_package/
│       └── my_node.hpp
├── launch/
│   └── my_launch_file.py
├── resource/
│   └── my_cpp_package
└── README.md
```

## What are URDF, SDF, XACRO, and their differences

In robot simulation and visualization with ROS and Gazebo, three main file formats are commonly encountered: **URDF, SDF, and Xacro**. Each serves a different purpose in the workflow and has its own advantages and limitation

**URDF (Unified Robot Description Format)** is the standard format used in ROS to describe a robot's physical structure, including links, joints, and visuals. It is **primarily used for visualization** in RViz, motion planning in MoveIt, and kinematic modeling. However, URDF is limited in terms of simulation features—it does not support advanced physical properties, sensors, or plugins.

URDF does **not simulate** physics—it only declares properties.  This is enough for:

- Kinematic modeling (e.g., MoveIt)
- Basic visualization (e.g., RViz)
- Providing parameters for controllers and simulators

**SDF (Simulation Description Format)**, in contrast, is the native format for Gazebo and is more expressive. It supports detailed physical modeling, sensors, lights, multiple robots, and plugin integration. Models created directly in the Gazebo GUI are saved in SDF format by default. While powerful for simulation, SDF is not natively supported by many ROS tools outside of Gazebo.

**SDF** gives **Gazebo** full control over simulation realism, numerical integration, and environment setup.

URDF and SDF are both XML-based and define robot models using hierarchical structures of elements such as `<link>`, `<joint>`, `<inertial>`, `<visual>`, and `<collision>`, making their overall structure conceptually similar. Both use SI units and follow a tag-based approach to define physical properties. However, they differ notably in syntax and nesting. For example, URDF uses attributes like `<mass value="2.0"/>` and `<origin xyz="0 0 0"/>`, while SDF uses nested tags such as `<mass>2.0</mass>` and `<pose>0 0 0 0 0 0</pose>`. SDF allows deeper nesting (e.g., `<world><model><link>...</link></model></world>`), while URDF maintains a flatter hierarchy focused on a single robot. Additionally, SDF uses `<pose>` in place of URDF’s `<origin>`, and `<inertia>` in SDF includes individual components as tags, whereas URDF defines them as attributes. These differences make the formats structurally parallel but syntactically incompatible without translation.

**Xacro (XML Macros)** is not a format on its own but a preprocessor for URDF files. It allows for the use of variables, macros, and conditional logic to simplify and modularize robot descriptions. This makes Xacro ideal for managing complex URDFs and generating consistent models, especially when components are repeated or parameterized.

These are not the only file formats, but the most commonly used when working with ROS2.

### URDF - basics

To learn the structure and the syntax of an urdf I have taken the urdf files included in the `urdf_tutorial` package in the ROS docuemntation and analyze them. This files seem to define a robot which looks similar to R2D2 from Star Wars, as can be observed by visualizing it through a **Robot Model Display** in **Rviz2.**

The document starts with: `<?xml version="1.0"?>` .

The root element of the file is `<robot name="physics">`. This defines the robot model and wraps all its components. Everything, including links, joints, materials, and geometry, must be contained within this tag. This will be closed only at the end of the document `</robot>` .

A **material** can be defined and reused to be applied to the following links without lengthy repetitions:

```xml
<material name="blue">
<color rgba="0 0 0.8 1"/>
</material>
```

Each **link** in the urdf represent a rigid body like in the example below:

```xml
<link name="base_link">
  <visual>
    <geometry>
      <cylinder length="0.6" radius="0.2"/>
    </geometry>
    <material name="blue"/>
  </visual>
  <collision>
    <geometry>
      <cylinder length="0.6" radius="0.2"/>
    </geometry>
  </collision>
  <inertial>
    <mass value="10"/>
    <inertia ixx="1e-3" ixy="0.0" ixz="0.0" iyy="1e-3" iyz="0.0" izz="1e-3"/>
  </inertial>
</link>
```

as can be obserevd there are three different sub-elements:

- `<visual>`: describes what the robot looks like in a viewer such as RViz.
- `<collision>`: describes the geometry used for collision detection in simulators like Gazebo.
- `<inertial>`: describes mass and moment of inertia for physics-based simulation.

In URDF, the inertia tensor in the `<inertial>` tag is defined relative to the frame specified by its `<origin>`. While this frame can be placed arbitrarily, the inertia values must be correctly computed for that frame—applying the parallel axis theorem and coordinate transformations if needed. For simplicity and physical accuracy, it's common to place the origin at the center of mass and align it with the principal axes, but any frame is valid as long as the inertia tensor matches it.

An important thing to note is that the **geometry** of a link can include basic primitives like `box`, `cylinder`, and `sphere`, as well as mesh files for more complex shapes, like in the example below:

```xml
<visual>
  <origin rpy="0.0 0 0" xyz="0.09137 0.00495 0"/>
  <geometry>
    <mesh filename="package://urdf_tutorial/meshes/l_finger_tip.dae"/>
  </geometry>
</visual>
```

here the **origin** tag is used to specify the pose (position and orientation) of that visual/collision relative to the link frame. It takes the `xyz` for position and `rpy` (roll, pitch, yaw) for orientation.

**Joints** define how two links are conencted and if and how they move relative to each other. A joint can be defined in the urdf like in the following example:

```xml
<joint name="base_to_right_leg" type="fixed">
  <parent link="base_link"/>
  <child link="right_leg"/>
  <origin xyz="0 -0.22 0.25"/>
</joint>
```

the origin here means the pose of the child relative to the parent. Some joints can include an axis, and additionally limits to define the allowable range of motion.

### Xacro - basics

Xacro (XML Macros) is a preprocessor for URDF files. It adds macros, parameters, and expressions, allowing to reuse structures. Once preprocessed from the xacro a urdf is generated. What Xacro allows is to: define variables, write reusable blocks, using expressions, include logic.

**Defining variables**

The variables defined in the code block below, could be reused in the file by calling for example `${width}` .

```xml
<xacro:property name="width" value="0.2" />
<xacro:property name="leglen" value="0.6" />
```

**Reusing block with macros**

With macro an xml block is intended. When calling the macro we can reuse that block. A macro can have parameters that define it, which are passed to the macro each time we intend to use it.

```xml
<xacro:macro name="default_inertial" params="mass">
  <inertial>
    <mass value="${mass}" />
    <inertia ixx="1e-3" ixy="0.0" ... />
  </inertial>
</xacro:macro>
```

in this case when we intend to use it, we need to porvide a mass value:

`<xacro:default_inertial mass="10"/>` . A macro can be used with blocks of any complexity, and can have multiple parameters like in this next example. Macros within macros can be used as well.

```xml
// when it is defined
<xacro:macro name="wheel" params="prefix suffix reflect">
  ...
</xacro:macro>

// when it is used
<xacro:wheel prefix="left" suffix="front" reflect="1"/>
```

**Expressions**

Xacro allows inline arithmetic with `${...}`. In the following example the pose is evaluated at runtime.

```xml
<origin xyz="${baselen*reflect/3} 0 -${wheeldiam/2+.05}" />
```

