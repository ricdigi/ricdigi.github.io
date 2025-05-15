# Project Introduction

This page is dedicated to my **master thesis at TU Delft**. It is a long and complex project that lasted just over a year. I will try here to summarize the most important aspects of the work, my **contribution to the field**, and the **results obtained**. The full report is accessible at this [link](https://repository.tudelft.nl/record/uuid:486b73c5-8880-4838-ae47-59da715078ca).

### Context
Additive Manufacturing (AM) plays a central role in Industry 4.0, enabling digital-to-physical part production with minimal waste and unmatched geometric flexibility. However, most AM systems rely on **planar layer deposition**, which limits part quality and design freedom. **Multi-Axis Additive Manufacturing** using robotic arms or 5-/6-axis machines—overcomes this limitation by enabling the deposition of **curved, free-form layers**. This introduces significant advantages but also complex process planning challenges. In metal AM, especially **Wire Arc Additive Manufacturing (WAAM)**, **process-induced deformations** remain a critical issue. These deformations caused by thermal gradients and residual stresses—can compromise dimensional accuracy and even lead to fabrication failure. While some solutions exist for **Powder Bed Fusion (PBF)** via topology optimization or support design, these aren't directly applicable when the geometry is fixed. My work focuses on optimizing the **fabrication sequence** for multi-axis machines, thus how and where each layer is deposited—**without altering the part's shape**.

### Contribution

Building on a 2D method from my research group, my thesis proposes a **3D optimization framework** that improves the **manufacturability** of optimized sequences. The goal: maintain **uniform layer thickness** within and across layers to better align with the physical constraints of WAAM equipment.

Key contributions include:
- A 3D formulation for **layer-sequence optimization**.
- A **regularization technique** to promote smooth transitions between layers, and more regular layer shapes.
- A **parallelized implementation** using C++ and the PETSc library to scale up computations.
- Numerical experiments validating the method on different part geometries.

### Results

- Successfully produced balanced sequences with improved uniformity.
- Demonstrated reduced deformation potential (qualitatively) across test geometries.
- Achieved significant speedup using parallel computation.

<p align="center">
  <img src="img/projects/project_assets_thesis/thesis_fig_0.png" alt="Preliminary view on some results" style="max-width:100%; height:auto;">
</p>

In the image above, a preliminary comparison of results is shown. The **left** side illustrates the **deformation resulting from planar layer fabrication**, while the **right** side displays the outcome of using an **optimized fabrication sequence**, highlighting the potential for deformation reduction.

# Literature Review Summary

Multi-Axis Additive Manufacturing (AM) offers major advantages over traditional and planar-layer AM by enabling the fabrication of complex, freeform geometries through added motion freedom. However, this flexibility comes with significant process planning challenges. Unlike standard 2.5D systems, multi-axis setups must account for changing build directions, risk of collisions, and constraints on layer thickness and deposition paths. Process planning in AM generally has multiple scales: at the part scale, it involves the construction sequence; at the track scale, the tool-path planning; and at the bead scale, control of process parameters like temperature and speed. One technology which usually features a multi-axis setup is **Wire Arc Additive Manufacturing (WAAM)**, which uses a welding torch to deposit material.

A core issue in metal AM is deformation caused by thermal stresses during and after fabrication. These residual stresses result from uneven heating and cooling, often leading to warping or cracking. WAAM, in particular, is susceptible due to its high energy input and material volume. Simulations are crucial to understanding and managing these effects, with methods ranging from highly accurate but expensive fully coupled thermal-mechanical models, to the more efficient but less precise **Inherent Strain Method**. The latter models the shrinkage-induced forces without thermal analysis and is often the only viable option in optimization contexts. Despite existing mitigation strategies, most research and optimization techniques still focus on design-phase solutions, which limits their applicability when the **geometry is fixed and the focus is purely on optimizing the fabrication process**.

<p align="center">
  <img src="img/projects/project_assets_thesis/thesis_fig_1.png" alt="Different Multi-Axis Additive Manufacturing Setups" style="max-width:100%; height:auto;">
</p>

**Figure 1**: Examples of Multi-Axis Additive Manufacturing Systems. A) A six-degree-of-freedom setup using Fused Deposition Modeling, demonstrating the fabrication of an object (in yellow) with free-form layers. B) A Wire Arc Additive Manufacturing setup, consisting in a welding torch attached to a six-degree-of-freedom manipulator. The manufactured part illustrates the characteristic poor surface finish of this method.

**Fabrication Sequence Optimization** is a method used in multi-axis additive manufacturing to determine the optimal order and shape of deposited layers. Instead of following standard planar slicing, this approach assigns each point in the part a **pseudo-time value** representing **when** it should be fabricated. The method groups elements into **lumped layers** based on their pseudo-time values and **uses simulation to evaluate a fabrication quality** objective. The optimization then adjusts the sequence, thus each element pseudo-time value, to minimize the objective while ensuring constraints like continuity and uniform deposition are met. This enables better part quality without changing the original geometry. A problem that can be addressed through **Fabrication Sequence Optimization** are the previously introduced **thermally induced deformations**. By optimizing the sequence, **temperature gradients** within the part during fabrication can be reduced, thereby lowering the risk of **residual stresses and deformation**.

<p align="center">
  <img src="img/projects/project_assets_thesis/thesis_fig_2.png" alt="Fabrication Sequence Optimization overview" style="max-width:70%; height:auto;">
</p>

**Figure 2**: Visualization of three steps in the Fabrication Sequence Optimization process. A) Encoding of the part’s structural layout in the density vector ρ. B) Definition of the pseudo-time field t based on the established structural layout. C) Extraction of an N-layer sequence from the time field through equispaced time intervals. The intervals will then be used to simulate the manufacturing process and evaluate the quality of the sequence.

To an expert reader, the underlying concept in **Fabrication Sequence Optimization** may resemble **Density-Based Topology Optimization**. However, in this case, the **material distribution is fixed**, and only the **pseudo-time field**—which defines the order of deposition—is optimized. Techniques such as the **Method of Moving Asymptotes (MMA)** optimization algorithm are shared between the two approaches.

In **Figure 3**, examples of 2D optimized fabrication sequences produced using state-of-the-art techniques are shown. However, these examples feature **non-uniform layer thickness**, which poses a limitation—particularly in **Wire Arc Additive Manufacturing (WAAM)**, where consistent layer height is critical. The **3D optimization framework** developed in this thesis addresses this issue by introducing a **regularization technique** that promotes **uniform layer thickness** throughout the part.

<p align="center">
  <img src="img/projects/project_assets_thesis/thesis_fig_3.png" alt="Fabrication Sequence Optimization overview" style="max-width:70%; height:auto;">
</p>

**Figure 3**: Examples of optimized fabrication sequences obtained using state-of-the-art formulations. The sequences present visibly irregular layer shapes.

### Project Goals
> The existing 2D fabrication sequence optimization framework laid the foundation for reducing deformation in multi-axis AM. Building on this, the goal of this thesis is to extend the method to **3D**, incorporate a **regularization technique** to ensure **uniform layer thickness**, and implement a **parallelizable solution** using the **PETSc library**. This addresses both deformation control and manufacturability, providing a more practical and scalable approach for metal AM processes such as WAAM.

# Method Overview

The optimization process begins with the **Part Discretization** phase, where the part design is encoded in a structured grid of **hexahedral elements**. Each grid element is designated as either filled or empty, representing the material distribution. This results in a vector, $\boldsymbol{\rho}$, where each element has a value of 1 (filled) or 0 (empty), corresponding to the material state. This operation is commonly referred to as **Voxelization**. In this phase the **fixed base-plate boundary condition** is set as well.

<p align="center">
  <img src="img/projects/project_assets_thesis/thesis_fig_4.png" alt="Part Discretization" style="max-width:60%; height:auto;">
</p>

**Figure 4**: **Visualization of the part discretization in the structured grid of hexahedral elements.**
In this example, the density function $\rho(x, y, z)$ is defined as follows: it takes the value $1.0$ if $z < z_0$ or $x > x_0$, and $z > (x - z_0 - \epsilon)$. Otherwise, $\rho(x, y, z)$ is equal to $0.0$. The fixed build plate condition applies to all the nodes on the bottom face of the geometry.

Next, the **Fabrication Sequence** is defined based on the discretized structural layout. The sequence is represented as a scalar field (pseudo-time field $\mathbf{t}$) encoding the deposition order of the elements, where each element is assigned a normalized time value, $t_e \in [0, 1]$, with 0 marking the start and 1 the end of the process. To ensure a realistic additive manufacturing sequence, the pseudo-time field must exhibit critical properties such as the absence of local minima. The **Thermal Regularization** method from literature is employed to achieve these requirements. This method, instead of directly defining the $t_e$ values on the grid, computes the time field $\mathbf{t}$ by solving a heat equation with spatially varying thermal diffusivity $\boldsymbol{\kappa}$. Local maxima are permissible in the field but only if they occur on the boundaries of the part geometry.

<p align="center">
  <img src="img/projects/project_assets_thesis/thesis_fig_5.png" alt="Thermal Regularization" style="max-width:75%; height:auto;">
</p>

**Figure 5**: **Visualization of the diffusivity field $\kappa(x, y, z)$ (left) and the pseudo-time field $\mathbf{t}$ (right), both defined over the structural layout.**
The pseudo-time field is derived from the diffusivity field by solving a heat equation. Both fields are shown at an arbitrary iteration of the optimization loop.


Unlike more common slicing methods, in this method the number of manufacturing layers, $\mathbf{N}$, is predetermined. Layers are extracted from the pseudo-time field using a **Smooth Heaviside projection**, enabling the field to be segmented in a differentiable manner. The threshold values of the projection functions are evenly spaced between 0 and 1, defined as $T_j = \frac{j}{\mathbf{N}}$ for $j = 0, 1, \dots, \mathbf{N}$.

<p align="center">
  <img src="img/projects/project_assets_thesis/thesis_fig_6.png" alt="Layer Extraction" style="max-width:100%; height:auto;">
</p>

**Figure 6**: **Figure 6.** Visualization of the Smooth Heaviside Projection function. The left image shows two projections with different threshold values, while the middle image demonstrates how these projections are combined to isolate a single layer. The right image illustrates the effect of varying sharpness values on the projection. The projections are used to compute the density vectors $\rho^{\{j\}}$ and $\Delta\rho^{\{j\}}$, representing, respectively, the material deposited up to and including the $j$-th time interval, and the material being deposited in the $j$-th time interval. The resulting fields are shown in 2D for visualization purposes. These fields are then used in the process simulation.

During manufacturing, each element’s addition causes structural deformation. However, in this research, elements are considered **lumped together** in layers, and each layer’s deposition is simulated using the **inherent strain method**. The total process displacement field vector, obtained by summing each layer’s contribution, $\mathbf{U} = \sum_j \Delta \mathbf{U}_j$, is then used to compute the **objective function**. The objective function can represent different distortion measures, such as minimizing displacement at specific points or ensuring surface flatness.

Given the technological limitations of additive manufacturing equipment in industry, it is crucial to control the **shape of the layers** to ensure they align with the equipment’s capabilities. This research addresses this aspect by extending previous formulations from the literature. Specifically, a second objective is introduced to **minimize the non-uniformity of thickness** within each layer, along with a constraint to directly control the **average layer thickness** value.

The objective and constraints are computed along with their sensitivities. These sensitivities are then used to update the design variables—specifically, the diffusivity field $\boldsymbol{\kappa}$—using the Method of Moving Asymptotes.

<p align="center">
  <img src="img/projects/project_assets_thesis/thesis_fig_0.png" alt="Deformation Results" style="max-width:90%; height:auto;">
</p>

**Figure 7**: Visualization of deformation results and comparison between two fabrication sequences: planar layers on the left and optimized layers on the right. The displacement fields from the process simulation demonstrate the effectiveness of the optimized fabrication sequence in minimizing the displacement of the top edge nodes compared to the planar fabrication case.

# Summary on Implementation & Validation

Unlike previous work which mainly explored 2D cases, this study extends the optimization framework to **3D**, where problem size grows dramatically—often involving hundreds of thousands of elements. This increase in scale leads to high memory and computational demands that exceed the capabilities of standard workstations. To address this, a **parallelized implementation** was developed, designed to run efficiently on **high-performance computing (HPC)** infrastructure.

The implementation builds on existing tools from the literature, particularly a PETSc-based framework originally developed for Density-Based Topology Optimization. Although the formulation here differs, it shares structural similarities, making it a solid foundation for extension. The adopted parallelization strategy uses **domain decomposition** with **MPI (Message Passing Interface)**, dividing the computational domain into segments processed independently by different compute nodes. This reduces communication overhead and improves scalability. The use of PETSc provides robust support for distributed memory systems and efficient inter-node communication.

The code repository, mainly written in **C++** and **Python** is not yet available to the public. It will be open-sourced after the final article will be published.

## Validation Approach

To ensure the correctness of the process simulation, two tests were conducted based on examples from the literature. The first test validated the 3D PETSc implementation by comparing its results with a well-established 2D MATLAB reference. The second extended the comparison to a 3D benchmark. The sensitivity analysis has been left out, but ca be found in the full report.

### First Test: 2D to 3D Comparison

The first test simulated the additive manufacturing of a V-shaped part, originally modeled in 2D using MATLAB. To validate the new implementation, the same geometry was extruded into 3D and simulated with $N = 10$ planar lumped layers. Material properties such as $E = 110$ GPa and $\nu = 0.3$ were applied, with an inherent strain vector $\boldsymbol{\varepsilon} = \{-1\times10^{-2}, -1\times10^{-2}, 0, 0, 0, 0\}$. As shown in the following figure, the displacement fields produced by both the MATLAB and PETSc implementations are visually consistent, confirming the reliability of the 3D simulation. Minor differences are attributed to geometric variations in the overhang region.

<p align="center">
  <img src="img/projects/project_assets_thesis/thesis_fig_8.png" alt="Validation 1" style="max-width:70%; height:auto;">
</p>

**Figure 8**: Comparison of the displacement field obtained using the MATLAB implementation and the PETSc implementation. The MATLAB colorbar is in millimeters, while the PETSc results are displayed in meters.

### Second Test: 3D Validation Against Reference Study

The second validation test is based on a benchmark simulation from the literature, which modeled the additive manufacturing of a $100\,\text{mm}^3$ cube using 1000 elements arranged in a $10 \times 10 \times 10$ grid. The process involved depositing 10 planar layers and fixing the base surface. Material properties were set as $E = 125$ GPa and $\nu = 0.333$, with an isotropic inherent strain vector $\boldsymbol{\varepsilon} = \{-5 \times 10^{-3}, -5 \times 10^{-3}, -5 \times 10^{-3}, 0, 0, 0\}$ to simulate uniform shrinkage.

The reference simulation used Abaqus (CalculiX) with C3D8R elements, which apply reduced integration and hourglass control. In contrast, the PETSc implementation developed in this research used **full integration** and extracted layers via a **smooth Heaviside projection** instead of discrete steps. Despite these methodological differences, the results in the following figure are consistent, validating the accuracy of the PETSc-based simulation. Minor differences in deformation are likely due to the different integration schemes.

<p align="center">
  <img src="img/projects/project_assets_thesis/thesis_fig_9.png" alt="Validation 2" style="max-width:90%; height:auto;">
</p>

**Figure 9.** Comparison between the results from the reference study and those obtained using the PETSc implementation. Results labeled **B)** represent the reference simulation from the literature, while results labeled **A)** are produced using the implementation developed in this research.


# Example Numerical Results

The method was implemented in **C++** using the **PETSc** library. This section presents one of the numerical experiments carreid out in my research, designed to evaluate the behavior of the proposed optimization framework. The simulations employ **trilinear hexahedral elements**, as introduced in the Part Discretization section, and focus primarily on **qualitative analysis**.

All part dimensions and displacement magnitudes shown in the plots are expressed in **meters [m]**. The material is characterized by a **Young’s modulus** of $E = 1\,\text{Pa}$, a **Poisson’s ratio** of $0.3$, and an **isotropic inherent strain** vector $\boldsymbol{\varepsilon}^* = \{-1 \times 10^{-2}, -1 \times 10^{-2}, -1 \times 10^{-2}, 0, 0, 0\}$.

#### 1) V-Shaped Component

The first test was performed on a **V-shaped model**, inspired by a 2D geometry from the literature and extended into 3D. The domain size is $2 \times 1 \times 2$, discretized into $80 \times 40 \times 80$ elements, with fixed boundary conditions applied to nodes on the build plate. The distortion measure focuses on the **top-right edge node displacement**, as illustrated in Figure 10A.

The target layer thickness is set to $d_{\text{tar}} = 0.1$, leading to a prescribed number of layers $N = 25$, based on the relation $N \approx \frac{l_c}{d_{\text{tar}}}$, where $l_c$ is the characteristic length of the part. For a fair comparison, the **planar case** uses only 20 layers, since fewer layers of thickness $0.1$ fit along the z-axis.

As shown in Figure 7 and 10, the method successfully generates a fabrication sequence that significantly reduces distortion while preserving **layer thickness uniformity**. The distortion objective decreases from $3.9 \times 10^{-1}$ in the planar case to $7.9 \times 10^{-4}$ in the optimized one. Additionally, the **average thickness** of each layer is controlled within specified **upper and lower bounds**. While **intra-layer thickness variations** are minimized to promote regularity, they are still allowed to support **curved layer geometries**. A notable outcome of the optimization is the emergence of **vanishing layers**—only 24 out of the 25 prescribed layers are used in the final sequence.

This behavior is unique to the current formulation and differs from earlier approaches, which enforced fixed layer volumes. The simulation remains stable despite these disappearing layers due to the addition of a small constant ($1 \times 10^{-9}$) to the element density $\rho_e$ during layer extraction via the Heaviside projection. This ensures numerical robustness while keeping the effect of these near-zero-volume layers negligible in the displacement field.

<p align="center">
  <img src="img/projects/project_assets_thesis/thesis_fig_10.png" alt="vshaped result" style="max-width:100%; height:auto;">
</p>

**Figure 10**: A) Display of the V-Shape component used in the first numerical experiment. The image highlights the base-plate (in red), which imposes a fixed boundary condition on the nodes at the bottom face of each geometry. Nodes considered in the distortion measurements used as objectives are shown in aquamarine. On the right, the optimized sequence and the computed, minimized process distortion.

### Comparison of Alternative Formulations

To better understand the influence of different components in the optimization framework, three alternative **formulations** were tested on the same V-shaped geometry. These formulations differ in the objectives and constraints used to control layer geometry. While the mathematical details are available in the full report, a brief overview is provided here.

- **Formulation 1** builds on the original method with thermal regularization. It minimizes distortion effectively but results in highly irregular layers that are difficult to manufacture and visualize.
- **Formulation 2** adds a uniformity objective, improving the shape of individual layers. However, it still allows large variations in average thickness from layer to layer.
- **Formulation 3** is the complete formulation and includes both the uniformity objective and an explicit constraint to control average layer thickness. This version produces sequences that are both regular and consistent across the build.

<p align="center">
  <img src="img/projects/project_assets_thesis/thesis_fig_11.png" alt="alternative formulations" style="max-width:100%; height:auto;">
</p>

**Figure 11**: Comparison of optimized fabrication sequences obtained using different method formulations. **A)** Sequence generated using the original formulation from the literature, with added thermal regularization. **B)** Sequence obtained using the same formulation as A), with the addition of a uniformity objective to improve layer consistency. **C)** Sequence produced using the complete formulation proposed in this study, combining uniformity and layer thickness control for a more regular and manufacturable result.

As illustrated schematically in **Figure 12**, two consecutive isosurfaces—denoted as $\Omega_j$ and $\Omega_i$—are used to compute the layer thickness. To avoid inaccuracies when the surfaces differ significantly in area, any distance exceeding 30% of the target thickness $d_{\text{tar}}$ is discarded and replaced by a new sample point.

From the plot in **Figure 12**, it is evident that while the **thickness variance** within individual layers remains similar across both formulations, the **average layer thickness** varies significantly when no thickness constraint is applied. This highlights the importance of explicitly enforcing thickness control to ensure consistency throughout the sequence. The first and last layers are excluded from the analysis due to limitations in isosurface extraction, but this does not affect the overall conclusions.


<p align="center">
  <img src="img/projects/project_assets_thesis/thesis_fig_12.png" alt="quantitative_layer" style="max-width:100%; height:auto;">
</p>

**Figure 12**: Comparison between Formulation 2 and Formulation 3. The **left** image provides a schematic representation of the distance calculation process between consecutive isosurfaces. The **middle** image presents a plot comparing the **average thickness** and **thickness variance** for each layer in the two formulations. The **right** image shows a side view of the resulting sequences, with **A** corresponding to Formulation 2 and **B** to Formulation 3.

