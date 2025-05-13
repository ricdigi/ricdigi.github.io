# Project Introduction

At the start of the Precision Mechanisms Design course, the company **ASML** came up with a design assignment which was about *designing a machine with two blades that block the light in a scanning motion*. These two blades, or in other words the end effectors, have to move independently in the **y-direction**. The blades also have to move according to any time-displacement profile, maximum acceleration, speed, and range.

The design assignment has been distributed over four subsystems: the **frame**, the **drivetrain**, the **anti-crash system**, and the **blade mechanism**. My group focused on the **blade mechanism**, more specifically the **precision mechanism** that will house the independent linear movement of the blades while also balancing out the exerted forces.

📄 The **full report** detailing all design phases is available for download at \[link].
On this page, I provide a concise overview of the **design challenge** and highlight my **personal contributions** to the project.

## Problem Statement and Functional Requirements

> **Problem statement**:
> *Design a precision mechanism that independently moves two blades in the y-direction whilst simultaneously cancelling out the exerted forces and keeping the accuracy high.*

This subsystem is considered one of the most critical parts of the machine due to its required **high accuracy**, **large range of motion**, and **single degree of freedom (DoF)** control.

Analyzing the constraints provided by ASML, we derived the following **functional requirements**:

1. **Independent linear motion**
   Each blade must move independently in a **precise linear path** along the y-axis, with a **±80 mm stroke** and an additional **15mm crash buffer** on each side. The motion must be accurate enough to block the laser beam at any point in the designated area.

2. **Vacuum compatibility**
   The mechanism must be suitable for **vacuum operation**, minimizing particle emission and system outgassing.

3. **Crash tolerance and recoverability**
   In the event of a crash, the subsystem must **protect the rest of the system** and be able to **restart quickly without major human intervention**.

4. **Force balancing**
   The blades must accelerate up to **400m/s²** (\~40g), producing high dynamic forces. These forces must be internally balanced to prevent vibration transmission to the rest of the machine.

5. **Robust blade attachment**
   Each blade weighs approximately **650g**. The connection interface must ensure **no loss of accuracy** due to mechanical play or detachment during high-speed motion.

<p align="center">
  <img src="img/projects/project_assets_pmd/AssignmentNew.png" alt="Schematic visualisation of designated space for the design assignment" style="max-width:100%; height:auto;">
</p>

**Figure 1**: Schematic visualisation of designated space for the design assignment

# My Contribution
