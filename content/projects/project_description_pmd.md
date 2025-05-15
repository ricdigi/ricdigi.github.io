# Project Introduction

At the start of the **Precision Mechanisms Design** course, the company **ASML** proposed a design assignment focused on a subsystem of a **lithography machine**. The task was to *design a mechanism with two blades that block light in a scanning motion*. These two blades, or **end-effectors**, must move independently along the **y-direction** and follow arbitrary **time-displacement profiles** with specified **maximum acceleration**, **speed**, and **range**.

The design assignment has been distributed over four subsystems: the **frame**, the **drivetrain**, the **anti-crash system**, and the **blade mechanism**. My group focused on the **blade mechanism**, more specifically the **precision mechanism** that will house the independent linear movement of the blades while also balancing out the exerted forces.

📄 The **full report** detailing all design phases is available for download at [Download](img/projects/project_assets_pmd/Final_Report.pdf).
On this page, I provide a concise overview of the **design challenge** and highlight my **personal contributions** to the project.

## Problem Statement and Functional Requirements

> **Problem statement**:
> *Design a precision mechanism that independently moves two blades in the y-direction whilst simultaneously cancelling out the exerted forces and keeping the accuracy high.*

This subsystem is considered one of the most critical parts of the machine due to its required **high accuracy**, **large range of motion**, and **single degree of freedom (DoF)** control.

Analyzing the constraints provided by ASML, we derived the following **functional requirements**:

1. **Independent linear motion**
   Each blade must move independently in a **precise linear path** along the y-axis, with a **±80mm stroke** and an additional **15mm crash buffer** on each side. The motion must be accurate enough to block the laser beam at any point in the designated area.

2. **Vacuum compatibility**
   The mechanism must be suitable for **vacuum operation**, minimizing particle emission and system outgassing.

3. **Crash tolerance and recoverability**
   In the event of a crash, the subsystem must **protect the rest of the system** and be able to **restart quickly without major human intervention**.

4. **Force balancing**
   The blades must accelerate up to **400m/s²** (\~40g), producing high dynamic forces. These forces must be internally balanced to prevent vibration transmission to the rest of the machine.

5. **Robust blade attachment**
   Each blade weighs approximately **650g**. The connection interface must ensure **no loss of accuracy** due to mechanical play or detachment during high-speed motion.

<p align="center">
  <img src="img/projects/project_assets_pmd/pmd_fig_01.png" alt="Schematic visualisation of designated space for the design assignment" style="max-width:100%; height:auto;">
</p>

**Figure 1**: Schematic visualisation of designated space for the design assignment

# My Contribution
After an initial conceptual phase exploring various mechanism types, we selected a pantograph mechanism. If dimensioned correctly, it can move the actuator’s mover and base in opposite directions with an acceleration ratio that nearly cancels out the exerted forces. More generally, a pantograph is a mechanical linkage based on parallelograms, where the displacement ratio between its endpoints is set by the lengths of links P1–P2 and P2–P3 in **Figure 2**. In our configuration, the midpoint is fixed while both ends move, ensuring opposite motions of the actuator base and mover. This configuration allows the mechanism to balance itself.

However, if the midpoint is treated as a joint fixed in space and the other two points are joints attached to the actuator, the mechanism has 4 Degrees of Freedom (DoF): vertical translation of both endpoints, rotation about the base joint, and rotations of the actuator around each endpoint. Since the system must behave as a 1 DoF mechanism, a second, symmetric pantograph is added. This also cancels forces in the vertical direction. Moreover, a compliant linear guide is added to the actuator base, ensuring the correct number of DOFs (This guide has been designed by the drivetrain group).

> Once the mechanism type was chosen, **my contribution** focused on developing a mathematical model to simulate its motion and estimate its dimensions. This was implemented in Python using the SymPy library. In parallel, a fully parametric CAD model was built in SolidWorks, enabling real-time adjustments of structural and joint parameters for subsequent validation via FEM simulations.

In this section, I will detail the **kinematic modeling and analysis**, the **simulation workflow**, and how analytical and CAD-based tools were integrated to refine and validate the mechanism.

The code described in the following sections is available at this [repository](https://github.com/ricdigi/blade_guiding_mechanism/tree/main#).


<p align="center">
  <img src="img/projects/project_assets_pmd/pmd_fig_2.png" alt="Simplified model of the pantograph mechanism" style="max-width:100%; height:auto;">
</p>

**Figure 2**: Simplified model of the pantograph mechanism

### Kinematic Modeling and Analysis

The **kinematic analysis** aims to define the relationships between the coordinates describing the mechanism and to simulate its motion under given geometric constraints. The objective is to find an optimal combination of **link dimensions** and **initial configuration** that minimizes **angular displacement** of the joints while satisfying the required **linear motion**.

To reduce **friction**, all **joints** are implemented as **rotational flexure components**, which have a limited angular range. This constraint makes it essential to ensure small joint rotations throughout the mechanism’s motion range.

A **kinematic model** was implemented in **Python** using the *SymPy* and *SymPy.mechanics* libraries. The model takes as **input** the **geometric dimensions** of the links (**L1**, **L2**, **L3**) and the desired **linear range of motion** (Figure X). It outputs the **angular displacements** of all joints needed to achieve that motion.

### PRBM - Analysis

To understand the **actuation force** needed to achieve the desired **linear displacement**, a **Pseudo Rigid Body Model (PRBM)** of the mechanism was implemented in **Python**. A **rotational spring** was placed at each **rotational joint**, with the **spring stiffness** depending on the type of **flexure**, its **dimensions**, and its **material**. By combining the **kinematic model** with the **stiffness values** and applying the **virtual work principle**, a **force versus displacement curve** was estimated.

Steps followed for the PRBM analysis:

1. Generate a **PRB model** of the compliant mechanism, incorporating spring constants, effective lengths, and angles.
2. Perform **kinematic analysis** to find displacement relationships and first-order kinematic coefficients.
3. Write **Lagrange coordinates** for each spring (absolute angular displacement).
4. Derive the **virtual displacements** of the Lagrange coordinates.
5. Apply the **virtual work principle**.
6. Substitute the Lagrange coordinate variations into the virtual work expression.
7. Insert the kinematic coefficients from step 2 into the equation from step 6.

<p align="center">
  <img src="img/projects/project_assets_pmd/pmd_fig_3.png" alt="Estiamted driving force vs. displacement curve" style="max-width:100%; height:auto;">
</p>

**Figure 3**: Estiamted driving force vs. displacement curve.

### Parametric CAD Model
To quickly iterate through the design process, a **parametric CAD model** was built in **SolidWorks** using **global variables**. These control key dimensions such as link lengths and joint sizes, enabling real-time adjustments and fast updates of the entire assembly. The model, shown in **Figure 4**, was used to export geometries for **FEM simulations** and validate mechanical performance.

<p align="center">
  <img src="img/projects/project_assets_pmd/pmd_fig_4.png" alt="Paramteric Model" style="max-width:100%; height:auto;">
</p>

**Figure 4** : CAD model of the pantograph mechanism, highlight on the cross flexure joints chosen in the final design.


### Multi-Body Dynamics simulation
As introduced earlier in this section, a **dynamic model** of the mechanism was developed using **Python**, primarily with the *sympy.mechanics* library. The simulation is based on the following assumptions:

- The **links** are modeled as **rigid bars** with uniform mass distribution.
- The **spring forces** from the flexure joints are neglected (focus is on **inertial forces**).
- The mechanism is analyzed in **2D**, so only two **reaction forces** (**Rx**, **Ry**) are computed.
- Only a **single pantograph** is modeled, leveraging symmetry.

To estimate the **exported forces** during normal operation, the system is simulated with a **400 m/s² acceleration**, a **5 Hz cycle frequency**, and a **100 mm stroke**, as specified by **ASML**. The **desired acceleration profile** is shown below:

<p align="center">
  <img src="img/projects/project_assets_pmd/pmd_fig_5.png" alt="Actuation Profiles" style="max-width:100%; height:auto;">
</p>

**Figure 5**: Actuation Profiles

Once the **desired acceleration profile** is defined, a **force with the same temporal shape** is applied to both the **actuator mover** and **actuator base**, in **opposite directions**. This simulates the actual forces exerted by the actuator on the mechanism. The applied force has an amplitude of **F = 800 N**.

With the temporal force profile set, the **equations of motion** are integrated. The resulting outputs—**generalized speeds**, **force profile**, and **generalized coordinates**—are then used to compute the **reaction force** exported to the **fixed base**.

The **temporal evolution** of all coordinates and **reaction forces** is shown in **Figure 6**.

<p align="center">
  <img src="img/projects/project_assets_pmd/pmd_fig_6.png" alt="Temporal evolution of the reaction forces and generalized coordinates" style="max-width:100%; height:auto;">
</p>

**Figure 6**: Temporal evolution of the reaction forces and generalized coordinates

From the plots, it can be observed that the **maximum exported force** in both **x** and **y** directions is around **20 N**. However, due to the **symmetry** of the final design—neglected in this simulation—the **y component** would cancel out entirely.

Additionally, the **x component** of the reaction force (**Rx**) can also be minimized. By tuning the **mass of the mover**, the exported force can be reduced significantly; for example, adding **0.81 kg** brought **Rx** down from **200 N** to **15 N**.

The simulation demonstrates that the mechanism can be **dynamically balanced** through **mass tuning**. However, perfect tuning was not pursued here, as the current model is still a **simplified approximation** of the real system. Achieving accurate tuning would require a more **refined and realistic simulation model**.


### Subsystem Performance Estimation through Finite Element Analysis

In this section, I present the **Performance Analysis** I conducted on the mechanism, focusing on two key metrics: **Driving Stiffness** and **Supporting Stiffness**. These helped me estimate the **required actuator force** and identify any potential **parasitic displacements** of the blade. I also included a **Multibody Dynamics (MBD) Simulation** to evaluate the mechanism’s **balancing performance** and the **magnitude of exported forces**.

I ran several **FEM simulations** using **COMSOL Multiphysics** to validate and improve the results.

The first simulation aimed to assess the **driving stiffness**. To do this, I applied two **equal and opposite boundary loads** on the **base** and **mover**, simulating the force generated by the actuator. I then recorded the resulting **deformations** for various force values.

These deformation values were compared to those estimated using the **PRBM model**. The comparison is shown in **Figure 7**, and the resulting estimated stiffness is approximately **$K_u \sim 0.7 \times 10^3 \,\text{N/m}$**.

<p align="center">
  <img src="img/projects/project_assets_pmd/pmd_fig_7.png" alt="PRBM vs FEA driving force" style="max-width:50%; height:auto;">
</p>

**Figure 7**: Driving force estimation comparison between PRBM and FEA

Moreover, I produced two additional plots, shown in **Figure 14**. One displays the **total deformation magnitude** across all points of the mechanism, while the other shows the **stress distribution** in the joints. The **maximum stress** remains below the **yield strength** of **STAVAX SUPREME** (1.28 GPa), the material used for the flexures. Both plots correspond to the **maximum static displacement** of **100 mm**.

<p align="center">
  <img src="img/projects/project_assets_pmd/pmd_fig_8.png" alt="FEA results" style="max-width:100%; height:auto;">
</p>

**Figure 8**: FEA results for the driving stiffness simulation

To evaluate the **supporting performance** of the mechanism, I conducted an additional **FEM simulation**. The boundary conditions remained the same as in the previous simulation, but two additional loads were applied:

- The **weight of the mechanism**, to assess its **self-supporting capability**.
- The **weight of the blade and actuator mover**, applied at the location of the mover.

The positions of these components are shown in the **scheme in Figure 2**.

The resulting **parasitic deformations due to gravity** are illustrated in **Figure 9**. These deformations are shown at the **maximum static displacement** of **100 mm**, where the **moment arm** of the blade and mover weights is largest.

Unfortunately, the observed parasitic deformation is quite significant, around **$w \sim 1$ cm**. It's important to note that the **weight of the actuator’s base** was not included in the simulation, as it is supported by a separate **linear guide** in the **drive-train subsystem**.

This simulation was performed on a **slightly different CAD model** from the final design, but all key dimensions are the same. For this analysis, the models can be considered equivalent.

One additional assumption was made regarding the **load application**: the weight of the actuator mover was applied as a **concentrated force** at the **end-effector**. In reality, the mover is not supported exactly at its **center of mass**, meaning a **bending moment** will be introduced in the physical system, potentially increasing the displacement even further.

<p align="center">
  <img src="img/projects/project_assets_pmd/pmd_fig_9.png" alt="second FEA results" style="max-width:100%; height:auto;">
</p>

**Figure 9**: FEA results for the supporting stiffness simulation
