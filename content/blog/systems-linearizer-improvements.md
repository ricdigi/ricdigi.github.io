## **Introduction to the Problem**

In the study of dynamical systems, linearization is a crucial technique that simplifies the analysis of complex, nonlinear systems. By approximating a nonlinear system with a linear one around a point of interest, **typically an equilibrium point**, we can leverage the well-developed mathematical tools for linear systems to gain insights into the behavior of the original system. Some examples of what we can do with the linearized system:

1. **Predict Stability**: Determine whether small perturbations will decay, grow, or oscillate, helping us understand the system's stability.
2. **Design Controllers**: Develop control strategies based on linear models that can then be applied to the original nonlinear system.

In `sympy.mechanics`, the linearization process is managed by the `Linearizer` class. This class implements the method described in [1]. A big role in the implementation is played by the `jacobian()` function, which computes the Jacobian matrix of a matrix of expression with respect to (wrt) a Matrix of variables.

→ **Problem**: For big and complex systems, the Jacobian computation might take a very long time. However, some methods have been identified to increase its performance.

> *[1] - D. L. Peterson, G. Gede, and M. Hubbard, "**Symbolic linearization of equations of motion of constrained multibody systems**" Multibody Syst Dyn, vol. 33, no. 2, pp. 143-161, Feb. 2015, doi: 10.1007/s11044-014-9436-5.*

## **Solutions Details**

In SymPy, using the `jacobian()` function on large expressions can be significantly optimized by representing the expression as a Directed Acyclic Graph (DAG). In a DAG, common sub-expressions are stored only once, whereas in normal tree structures, they might be duplicated. To pass from a normal expression tree to a DAG, an operation called Common Sub-Expression Elimination (CSE) is performed.

By leveraging this data structure, the derivatives of sub-expressions can be computed only once, enhancing performance. However, this data structure can be useful also in other contexts, for example:

- **Lambdify Function**: The function that enables us to numerically evaluate any symbolic expression already employs Common Subexpression Elimination (CSE) but does not support as input an already precomputed CSE expression. This limitation is addressed in PR [#24649](https://github.com/sympy/sympy/pull/24649) and [#25797](https://github.com/sympy/sympy/pull/25797).

**Jacobian**: Does not yet implement CSE. An open PR ([#25801](https://github.com/sympy/sympy/pull/25801)) aims to address this issue. The work already done on the topic is summarized in the quote-paragraph below:

**References: Citation from Jason K. Moore, Sam Brockie, Timo Stienstra from different sources (Github, CZI grant blogpost)**:

> ➡️ The need to evaluate both a function and its Jacobian is a common use case that is not just limited to optimal control problems like the one shown on [this page](https://mechmotum.github.io/blog/czi-sympy-wrapup.html).
>
> SymPy is capable of taking analytical derivatives but it can be prohibitively slow for large expressions. This limits interactive use and rapid iteration in equation derivation. If common sub-expressions are extracted from a **SymPy expression**, all operations are **represented** **as** a **directed acyclic graph**.
>
> Taking the derivative of a DAG instead of a tree graph, as SymPy stores expressions, can provide exponential speedups to differentiation. If the code generation for the function and its Jacobian uses common sub-expression elimination, then it makes sense to call `cse()` on the function, then take the partial derivatives, and the Jacobian will be in a DAG form for easy code generation.
>
> Sam has introduced a major code generation speed-up for lambdifying large SymPy expressions if you also desire the Jacobian based on the work we did in Opty. The details are in the following pull requests:
>
> - [#24649 Implementing CSEExpr class](https://github.com/sympy/sympy/pull/24649)
> - [#25797 Passing CSEExpr to lambdify](https://github.com/sympy/sympy/pull/25797)
> - [#25801 Forward Jacobian Implementation](https://github.com/sympy/sympy/pull/25801)
>
> *Our experience also led to many new ideas on how to further improve SymPy for large expression manipulation, especially how unevaluated expression forms that use DAGs as the core data structure can drastically speed up SymPy and reduce the computational resources needed. … In the future, we are very interested in incorporating unevaluated expressions and the DAG data structures more into the core of SymPy, as these two ideas can vastly enhance SymPy's performance and the ability to code generate from SymPy expressions with more control and precision.*

## **Plan of Action**

Given the previous work done on the topic, the most logical thing to do would be to complete the Pull Request of Sam Brockie since it has already shown its performance. However:

- His implementation doesn’t seem robust enough to be used as a substitution for the `jacobian()` present at the moment in the `Linearizer` class.
- There are some other possible solutions, involving the use of the `protosym` or `symengine` libraries, which, although not yet complete, are intended to be used as more efficient cores for SymPy.

Together with my supervisor, we decided to better characterize the performance of the implementation proposed by Sam and compare it to the other options. Especially to understand if Sam’s implementation, with an added step to bring the resulting Jacobian to the standard SymPy expression tree form, would still be convenient to use.
