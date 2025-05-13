
# Goal of the project

SymPy's `physics/mechanics` and `physics/vector` modules are powerful tools for modeling and analyzing the dynamics of multi-body systems. Users can leverage these modules to set up models of physical systems and automatically generate the corresponding equations of motion. In SymPy, these equations can be derived using two primary methods: **Lagrange's Method** and **Kane’s Method**. This automation significantly simplifies the process of deriving these equations. However, as models become more complex, the computational cost of generating the equations of motion can increase significantly. There are several opportunities to improve the performance of SymPy’s routines.

My goal during the project was to identify these performance bottlenecks through benchmarks and community suggestions, and to develop solutions to address them, ensuring that SymPy remains efficient even when dealing with large and intricate systems. My work resulted in one main contribution: The development of a new Jacobian function that enables faster and more efficient Jacobian calculations. This improvement was driven by the need to speed up the linearization of mechanical systems. The journey was filled with challenges and valuable learnings.

# My contributions

## 1. **Optimization and Benchmarking of Jacobian Function**

### Introduction to the problem

As explained above, through sympy, specifically through the physics/mechanics module, users have the ability to model dynamical system and subsequently generate the equations of motion through two methods: The Lagrange Second Type method, and the Kane’s Method.

One important task which can be performed with the system of equations of motion is linearization. In the study of dynamical systems, linearization is a crucial technique that simplifies the analysis of complex, nonlinear systems. By approximating a nonlinear system with a linear one around a point of interest, **typically an equilibrium point**, we can leverage the well-developed mathematical tools for linear systems to gain insights into the behavior of the original system. Some examples of what we can do with the linearized system:

1. **Predict Stability**: Determine whether small perturbations will decay, grow, or oscillate, helping us understand the system's stability.
2. **Design Controllers**: Develop control strategies based on linear models that can then be applied to the original nonlinear system.

In sympy.mechanics the linearization process is managaed by the Linearizer class. This class implements the method described in [1]. A big role in the implementation is played by the `jacobian()` function, which computes the Jacobian matrix of a matrix of expression wrt (with respect to) a Matrix of variables.

→ **Problem**: For big and complex systems, the jacobian computation might take a very long time. However some methods have been identified to increase its performances.

> *[1] - D. L. Peterson, G. Gede, and M. Hubbard, "**Symbolic linearization of       equations of motion of constrained multibody systems**" Multibody       Syst Dyn, vol. 33, no. 2, pp. 143-161, Feb. 2015, doi:       10.1007/s11044-014-9436-5.*
>

### Solution - Leveraging Common Sub-Expression Elimination

In SymPy, optimizing the `jacobian()` function for large expressions can be achieved by representing the expression as a Directed Acyclic Graph (DAG). In a DAG, **common sub-expressions are stored only once, while in normal tree structures, they might be duplicated.** To convert a normal expression tree into a DAG, a process called Common Sub-Expression Elimination (CSE) is performed.

By using this data structure, **the derivatives of sub-expressions can be computed only once,** speeding up the Jacobian computation.

The idea of using this method to accelerate the Jacobian calculation was first introduced by @brocksam in [[PR #25801](https://github.com/sympy/sympy/pull/25801)]. My plan was to take his PR, which was in draft state, and work on getting it merged.

However, after some experimentation with his implementation, I noticed that it wasn’t robust enough for all possible inputs. Specifically, it struggled with input expressions containing `dynamicsymbols()` and/or `Derivative` nodes.

### Details about my work

I began by testing and assessing the performance of various Jacobian function implementations using benchmark models from the SymPy repository. Following my mentors' advice, I created an [[issue](https://github.com/sympy/sympy/issues/26730)] to update the community. I conducted two phases of benchmarks. After sharing the initial results, the community provided feedback, particularly questioning the benchmark methodology. This prompted me to run a second, more rigorous benchmark. I then created a new [[repository](https://github.com/ricdigi/jacobian_benchmark)] to store methods, test performances, and generate plots for the different Jacobian function implementations I was working on with greater flexibility. The benchmark code proved to be both useful and efficient for testing new modifications to the implementation.

The benchmark results can be found at:

- [[Benchmark 1](https://github.com/sympy/sympy/issues/26730#issuecomment-2188323937)]
- [[Benchmark 2](https://github.com/sympy/sympy/issues/26730#issuecomment-2199939076)]

The input expressions used to benchmark the functions where mainly generated using the following relevant models:

- n_link_pendulum_on_cart() model from  `sympy/physics/mechanics/models.py` 
- Bycicle Model as in J.P Meijaard et al.  `*10.1098/rspa.2007.1857*` 

As explained above, while testing @brocksam implementation I encountered different challenges and problems, which led me to develop a new implementation.

This new implementation was included in [[PR #26773](https://github.com/sympy/sympy/pull/26773)]. This PR included also some commits from   [[PR #25801](https://github.com/sympy/sympy/pull/25801)] in order to give credit to his past work on the topic. **More details about the function’s algorithm can be found in this report’s Appendix**.

The modifications introduced with [[PR #26773](https://github.com/sympy/sympy/pull/26773)] led to a new [[PR #26952](https://github.com/sympy/sympy/pull/26952)].

**PR #26952** introduces the possibility of using the new jacobian function (called _forward_jacobian) inside the Linearizer class. The PR is not completed yet, however it has already shown a performance increase, such as in the physics/mechancis test_kane3.py which runs approx 2.7 times faster.

## 2. **Enhancing the Find Dynamic Symbols Function**

### Introduction to the problem

When working inside the `sympy/physics/mechanics` module, often instead of normal sympy symbol, dynamicsymbols() are used. These `dynamicsymbols()` are used to create time-dependent functions (symbols) for dynamic variables, unlike standard `Symbol()`which represents static variables. `dynamicsymbols()` automatically assumes a dependence on time, making it useful for expressing velocities, accelerations, etc.

It is often necessary to determine which `dynamicsymbols()` are present in a given SymPy expression. Currently, the `find_dynamicsymbols()` function is available for this purpose with the docstring:`“Find all dynamicsymbols in expression."`. However, I have encountered the following problems with it:

- The current function returns both the derived and underived dynamicsymbols when called on an expression containing only the derivative of a dynamicsymbol.
- The function fails to return the dynamicsymbol with the correct derivative order when that dynamicsymbol is found inside an unevaluated time derivative in a SymPy expression.

### Details about my work

I firstly opened [[Issue #26611](https://github.com/sympy/sympy/issues/26611)] to discuss about the problem with the community. Which led me to develop a new implementation proposed through [[PR #26629](https://github.com/sympy/sympy/pull/26629)].

The new implementation aims to use a single expression tree traversal, keeping track of the traversed node type (especially Derivatives), in order to return the set of dynamicsymbols with the correct derivative order. Specific details about the implementation can be found in the PR page.

### Community Feedback

Although the proposed modification can indeed make the implementation more robust to the input, there are other issues to consider, as suggested by the feedback I received from the SymPy community.

1. While the behavior of the function does not exactly match its docstring, attempting to correct it might lead to backward compatibility issues and potentially break user code. Therefore, a better approach would be to create a new function and update the docstrings to more accurately describe the function's behavior.
2. The new implementation should include more unit tests to ensure its robustness across different input types.

## 3. **Development of Partial Velocities Function**

This is the work I did in the application phase to GSoC 24’. Due to its affinity with my project’s topic I am adding this to the report. The modification introduced were based on [[Issue #25070](https://github.com/sympy/sympy/issues/25070)].

### Introduction to the problem

When dealing with multi-body systems, for a system with **n** degrees of freedom, any velocity vector **$v$** and angular velocity vector **$\omega$** can be written as a linear combination of generalized speeds **$u_r$** and some additional terms that are not dependent on these speeds:

$$
\vec{v} = \sum_{r=1}^{n} \vec{v}_r u_r + \vec{v}_t \quad \quad \quad \quad \vec{\omega} = \sum_{r=1}^{n} \vec{\omega}_r u_r + \vec{\omega}_t
$$

**The vecotrs $\vec{v}_r$ are called *partial velocities,* and are quantities of interest when trying to obtain the equations of motion for a system, specifically with Kane’s Method.** The current implementation relyied on the jacobian function (jacobian()), thus differentiating expression to obtain these coefficients:

$$
\vec{v}_r = \frac{\partial \vec{v}}{\partial u_r} \quad \quad \quad \quad \vec{\omega}_r = \frac{\partial \vec{\omega}}{\partial u_r}
$$

However knowing that the linearity relationship explained above, the computation could be made more efficient by avoiding unnecessary differentiation. The new implementation I proposed extract the partial velocities ( $\vec{v}_r$) by setting all coefficients not associated with ($u_r$) to zero, and then read ( $\vec{v}_r$) and ( $\vec{\omega}_r$ ) as coefficients of ( $u_r$ ):

$$
\text{repl} = \{u_1 : 0, u_r : u_r, \ldots, u_n : 0\}
$$

$$
\vec{v} = \vec{v}_r u_r + \vec{v}_t \quad \quad \quad \quad \vec{\omega} = \vec{\omega}_r u_r + \vec{\omega}_t
$$

### Details about my work

This new implementation led to [[PR #26367](https://github.com/sympy/sympy/pull/26367)] and [[PR #26384](https://github.com/sympy/sympy/pull/26384)].  On a few quick benchmarks which results are reported on the PRs page, the new function showed a **speed-up up to 24x** compared to the original implementation.

> **Ref:** Thomas R. Kane, and David A. Levinson. *Dynamics, Theory and Application.* McGraw Hill, 1985. Page: 46
>

# Summary of Issues and PR + Future Work

---

### 1. **Optimization and Benchmarking of Jacobian Function**

- [[Issue #26730](https://github.com/sympy/sympy/issues/26730)]: Identifying and optimizing the performance of the Jacobian function in SymPy
- [[PR #26773](https://github.com/sympy/sympy/pull/26773)]: Implementing a new Jacobian function using forward accumulation to enhance performance
- [[PR #26952](https://github.com/sympy/sympy/pull/26952)]: Integrating the optimized Jacobian function into the Linearizer class for better efficiency
- **Repository**: Created a repository to benchmark and compare different Jacobian implementations: [[jacobian_benchmark](https://github.com/ricdigi/jacobian_benchmark)]

**Future Work:**

While PR #26773 is very likely to be merged before the end of the GSoC period, PR #26952 is still in Draft state. Some improvements are needed, specifically on how to allow users to access the new `forward_jacobian` function within the `Linearizer` class while still keeping it as a private function.

A new PR is also in progress, aiming to introduce a modification in the sparse matrix multiplication routines of SymPy. This change will enable `forward_jacobian` to avoid redundant computations during matrix multiplication, thereby improving performance.

### 2. **Enhancing the Find Dynamic Symbols Function**

- [[Issue #26611](https://github.com/sympy/sympy/issues/26611)]: Addressing the limitations of the existing `find_dynamicsymbols()` function in handling derivatives
- [[PR #26629](https://github.com/sympy/sympy/pull/26629)]: Developing a robust implementation for `find_dynamicsymbols()` to correctly handle dynamic symbols and their derivatives

**Future Work:**

This PR still requires modifications before it is ready to be merged, specifically to incorporate the community feedback mentioned above.

### 3. **Development of Partial Velocities Function**

- [[PR #26367](https://github.com/sympy/sympy/pull/26367)]: Creating a new function to compute partial velocities more efficiently in multi-body systems
- [[PR #26384](https://github.com/sympy/sympy/pull/26384)]: Further improvements and optimizations to the Partial Velocities function

**Future Work:**

These two PRs have been successfully merged; however, there are several other areas in SymPy’s code where the linear properties of expressions could be leveraged to speed up routines, similar to how it was done for the partial velocity function.

### 4. Other Future Work

- From interactions with the community, the need for a timing function has emerged—one that enables reliable measurements, unaffected by caching.
- It is also necessary to establish a system for periodic and automatic benchmarking through GitHub CI to regularly evaluate the performance of the routines in SymPy's physics/mechanics and physics/vector modules.

# Thoughts on GSoC experience

This project has been an incredible introduction to the world of open-source. I've always felt indebted to the open-source community, and now I've finally had the opportunity to contribute. As a mechanical engineer, I particularly enjoyed working on SymPy, tackling topics closely related to my field of study while also gaining valuable experience in software engineering through an in-depth exploration of SymPy’s codebase.

Although the project's goals were adjusted during the GSoC period and some work still needs to be completed, I thoroughly enjoyed the journey. I encountered challenging problems and collaborated with the community to find solutions. Learning how to work on a large-scale project like SymPy, with contributors from all around the world, was my primary goal, and I’m very pleased with how it turned out.

I would like to extend my sincere thanks to my mentors [@moorepants](https://github.com/moorepants) and [@tjstienstra](https://github.com/tjstienstra) for this opportunity and for their invaluable guidance throughout the process. Beyond the technical support, I’m grateful for their reminders to stay focused and sometimes accept compromises to achieve the overall objectives.

# Appendix

## Forward Jacobian function - Algorithm

Given any expression $f(w_1, w_2, \ldots, w_n)$ , Common Subexpression Elimination (CSE) can be applied to optimize the expression. This process involves transforming the original expression, which is typically stored as a normal expression tree, into a Directed Acyclic Graph (DAG). The DAG format allows for efficient storage and computation by eliminating the redundancy of repeated subexpressions within the expression.

$$
f(w_1, w_2, \ldots, w_n) \xrightarrow{\text{CSE}} f(w_1, w_2, \ldots, w_n, x_1, x_2, \ldots, x_m)
$$

After the CSE step, a new set of symbols is defined $(x_1, x_2, \ldots, x_m)$; these will be called replacement symbols (***rep_sym***). Each of these symbols is associated with a common sub-expression(***sub_expr***) from the original expression. The **rep_sym** ($x_i$) and associated **sub_expr** respect by definition the following condition:

$$
x_i = g_i(w_1, w_2, \ldots, w_n, x_1, x_2, \ldots, x_{i-1}) \quad \text{for } 1 \leq i \leq m
$$

Thus

$$
\begin{aligned}
x_1 &= g_1(w_1, w_2, \ldots, w_n) \\
x_2 &= g_2(w_1, w_2, \ldots, w_n, x_1) \\
x_3 &= g_3(w_1, w_2, \ldots, w_n, x_1, x_2) \\
&\vdots \\
x_m &= g_m(w_1, w_2, \ldots, w_n, x_1, x_2, \ldots, x_{m-1})
\end{aligned}
$$

Let’s suppose now that we have an input vector of symbolic expressions  $\vec{f}$ after a CSE operation it would become:

$$
\vec{f} = \begin{bmatrix}
f_1(w_1, \cdots, w_n) \\
f_2(w_1, \cdots, w_n) \\
\vdots \\
f_N(w_1, \cdots, w_n) \\
\end{bmatrix}
\xrightarrow{\text{CSE}}
\vec{f} = \begin{bmatrix}
f_1(w_1, \cdots, w_n, x_1, \cdots, x_m ) \\
f_2(w_1, \cdots, w_n, x_1, \cdots, x_m ) \\
\vdots \\
f_N(w_1, \cdots, w_n, x_1, \cdots, x_m ) \\
\end{bmatrix}
$$

We want now to calculate the Jacobian matrix of  $\vec{f}$ with respect to $(w_1, w_2, \ldots, w_n)$ while taking advantage of the CSE operation, **thus avoiding taking redundant derivatives of repeated sub-expressions**.

Let's first define a notation to distinguish between partial and total derivative when computing the Jacobian matrix. To distinguish between partial and total derivatives, we use different notations:

- $(\frac{\partial f_i}{\partial w_j})$ denotes the partial derivative of $( f_i )$ with respect to $( w_j )$ considering only the direct dependence.
- $(\frac{\mathrm{d} f_i}{\mathrm{d} w_j})$ denotes the total derivative of $( f_i )$ with respect to $( w_j )$, considering both direct and indirect dependencies through the new replacement symbols $( x_k )$

The total Jacobian matrix, considering both dependencies is given by:

$$
\mathbf{J}_{\text{total}} = \begin{bmatrix}
\frac{\mathrm{d} f_1}{\mathrm{d} w_1} & \frac{\mathrm{d} f_1}{\mathrm{d} w_2} & \cdots & \frac{\mathrm{d} f_1}{\mathrm{d} w_n} \\
\frac{\mathrm{d} f_2}{\mathrm{d} w_1} & \frac{\mathrm{d} f_2}{\mathrm{d} w_2} & \cdots & \frac{\mathrm{d} f_2}{\mathrm{d} w_n} \\
\vdots & \vdots & \ddots & \vdots \\
\frac{\mathrm{d} f_N}{\mathrm{d} w_1} & \frac{\mathrm{d} f_N}{\mathrm{d} w_2} & \cdots & \frac{\mathrm{d} f_N}{\mathrm{d} w_n}
\end{bmatrix}
\rightarrow
\mathbf{J}_{\text{total}} = \mathbf{J}_{\text{direct}} + \mathbf{J}_{\text{indirect}}
$$

$$
\mathbf{J}_{\text{direct}} = \frac{\partial \vec{f}}{\partial \mathbf{w}} = \begin{bmatrix}\frac{\partial f_1}{\partial w_1} & \frac{\partial f_1}{\partial w_2} & \cdots & \frac{\partial f_1}{\partial w_n} \\\frac{\partial f_2}{\partial w_1} & \frac{\partial f_2}{\partial w_2} & \cdots & \frac{\partial f_2}{\partial w_n} \\\vdots & \vdots & \ddots & \vdots \\\frac{\partial f_N}{\partial w_1} & \frac{\partial f_N}{\partial w_2} & \cdots & \frac{\partial f_N}{\partial w_n}\end{bmatrix},
\quad
\mathbf{J}_{\text{indirect}} = \frac{\partial \vec{f}}{\partial \mathbf{x}} \cdot \frac{d \mathbf{x}}{d \mathbf{w}}
$$

However also  $\frac{d\mathbf{x}}{d\mathbf{w}}$ which for simplicity we can call matrix $\mathbf{C}$ can be computed by considering direct and indirect dependencies of x with respect to $w$.

**Let’s define a notation** where the $i$-th row of a matrix  $\mathbf{C}$  is denoted by $\mathbf{C_i}$, where  $\mathbf{C_i}$  represents the entire $i$-th row vector of the matrix. To refer to the submatrix containing all rows from the first row up to the i-th row instead, we use the notation $\mathbf{C}_{[1:i], \cdot}$ This submatrix includes all elements from the first through the $i$-th rows of $\mathbf{C}$ , while the notation $(\cdot)$ indicates that all columns are included.

Recalling the property of the ***replacement symbols*** $(x_i)$ to compute the row $\mathbf{C}_i$ we can use:

$$
\mathbf{C}_1 = \mathbf{A}_1
$$


$$
\mathbf{C}_i = \mathbf{A}_i + \mathbf{B}_{i,[1:i-1]} \cdot \mathbf{C}_{[1:i-1], \cdot} \quad \text{for } 2 \leq i \leq m
$$

Where:

$$
\begin{align*}
\mathbf{A} = \begin{bmatrix}
    \frac{\partial x_1}{\partial w_1} & \cdots & \frac{\partial x_1}{\partial w_n} \\
    \vdots & \ddots & \vdots \\
    \frac{\partial x_m}{\partial w_1} & \cdots & \frac{\partial x_m}{\partial w_n}
\end{bmatrix}
\quad
\mathbf{B} = \begin{bmatrix}
    \frac{\partial x_1}{\partial x_1} & \cdots & \frac{\partial x_1}{\partial x_m} \\
    \vdots & \ddots & \vdots \\
    \frac{\partial x_m}{\partial x_1} & \cdots & \frac{\partial x_m}{\partial x_m} \\
\end{bmatrix}
= \begin{bmatrix}
    0 & 0 & \cdots & 0 \\
    \frac{\partial x_2}{\partial x_1} & 0 & \cdots & 0 \\
    \vdots & \ddots & \ddots & \vdots \\
    \frac{\partial x_m}{\partial x_1} & \cdots & \frac{\partial x_m}{\partial x_{m-1}} & 0 \\
\end{bmatrix}
\end{align*}
$$

Thus $\mathbf{C} =  \frac{d \mathbf{x}}{d \mathbf{w}}$ will result in:

$$
\begin{align*}
    \mathbf{C} &= \begin{bmatrix}
        \frac{d x_1}{d w_1} & \cdots & \frac{d x_1}{d w_n} \\
        \vdots & \ddots & \vdots \\
        \frac{d x_o}{d w_1} & \cdots & \frac{d x_o}{d w_n}
    \end{bmatrix} \\
    &= \begin{bmatrix}
        \frac{\partial x_1}{\partial w_1} & \cdots & \frac{\partial x_1}{\partial w_n} \\
        \frac{\partial x_2}{\partial x_1} \frac{d x_1}{d w_1} + \frac{\partial x_2}{\partial w_1} & \cdots &
        \frac{\partial x_2}{\partial x_1} \frac{d x_1}{d w_n} + \frac{\partial x_2}{\partial w_n} \\
        \vdots & \ddots & \vdots \\
        \frac{\partial x_m}{\partial x_{m-1}} \frac{d x_{m-1}}{d w_1} + \cdots +
        \frac{\partial x_m}{\partial x_1} \frac{d x_1}{d w_1} + \frac{\partial x_m}{\partial w_1} & \cdots &
        \frac{\partial x_m}{\partial x_{m-1}} \frac{d x_{m-1}}{d w_n} + \cdots +
        \frac{\partial x_m}{\partial x_1} \frac{d x_1}{d w_n} + \frac{\partial x_m}{\partial w_n}
    \end{bmatrix}
\end{align*}
$$
