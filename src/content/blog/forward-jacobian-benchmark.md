---
title: GSoC - First Benchmark of Forward Jacobian Implementation
date: 2024-06-26T10:00:00+02:00
summary: Initial performance tests and feedback on the forward Jacobian approach in SymPy's mechanics module.
thumbnail: https://placehold.co/300x200?text=Forward+Jacobian
---

## **Summary**

As explained in my latest blog post update, I am currently testing and benchmarking various implementations of a new Jacobian function. The primary goal is to accelerate the linearization process in the `sympy.physics.mechanics` module.

My mentors suggested creating a SymPy issue to keep the community updated on my progress. Consequently, I opened [this issue](https://github.com/sympy/sympy/issues/26730). So far, I have updated the issue twice. The first update included initial results, which received feedback regarding the correctness of the benchmarking methodology. The second update provided more complete results with an improved and hopefully more accurate methodology.

### **Details about First Results**

Here I am going to report some of the findings and feedback received from the start of the investigation.

As a first test, I used the `n_link_pendulum_on_cart` model from SymPy to generate a system of equations of motion with increasing dimension (n + 1 degrees of freedom) to use as input expression for the function. I compared the execution time of the two Jacobian implementations against each other. This showed:

- The Jacobian with respect to the speeds seems to execute faster than the one with respect to the generalized coordinates, probably due to the more nonlinear relationships with the generalized coordinates.
- When increasing the number of variables against which I compute the Jacobian with a fixed expression dimension, the forward Jacobian implementation seems to scale better.
- The substitution present in the current forward Jacobian formulation to bring back the expression to the canonical SymPy expression tree form takes a significant portion of execution time.
- Using `xreplace` instead of `subs` in the current forward Jacobian formulation improves performance.

### **Conclusions**

For the goal of taking a matrix of SymPy expressions in canonical form and calculating the Jacobian with respect to a matrix of expressions always in canonical form, to output a Jacobian matrix where each element is in canonical form, the current Jacobian implementation appears more efficient. **Plots and more detailed comments about performance can be observed** [here](https://github.com/sympy/sympy/issues/26730#issuecomment-2188323937).

From further experimentation with a new implementation, I managed to create a more efficient version of the forward Jacobian function, which successfully outputs a Jacobian matrix with elements in canonical form. This might also be more readable and compact. However, I’ll make another post about it in this same issue.
