## **Summary**

After realizing that my implementation worked better with `dynamicsymbols`, I decided to continue refining it. Throughout July, I encountered several challenges and spent time addressing them and improving the implementation overall. The key issues I tackled were:

- Incorrect results when Derivative terms were present in the input expression.
- The use of an unsafe sparse matrix multiplication method.
- Splitting the function to accommodate different input/output formats.

## **Detailed Explanation**

### **Handling Derivative Terms in the Input Expression**

When derivatives of common subexpressions with respect to a variable in the `wrt` list are present in the input expression, the Jacobian is not computed correctly. This issue arises because, during the Common Subexpression Elimination (CSE) step, the subexpression (which is the argument of the derivative) is replaced with a new symbol.

> **Derivative**(sub_expr(sym), sym) → **Derivative**(rep_sym, sym) → `rep_sym` is no longer a function of `sym`!

As a result, when the derivative of this term is computed with respect to any variable in the `wrt` vector, it is incorrectly evaluated to zero instead of being calculated accurately.

Here’s an example to illustrate this issue:

```python
from sympy import ImmutableDenseMatrix, Symbol, Function, Derivative, simplify
from sympy.simplify.cse_diff import _forward_jacobian

# Define the symbols
x = Symbol('x')
y = Symbol('y')
z = Symbol('z')

# Define the custom functions
k = Function('k')(x, y)
f = Function('f')(k, z)

# Define the expression and the variables with respect to which the Jacobian is computed
expr = ImmutableDenseMatrix([Derivative(f + k, x) + k])
wrt = ImmutableDenseMatrix([x])

# Compute the Jacobian using the custom implementation
jacobian_ric = _forward_jacobian(expr, wrt)

# Compute the Jacobian using the classical method
jacobian_cla = expr.jacobian(wrt)

# Calculate the difference between the two Jacobians to identify discrepancies
diff = simplify(jacobian_ric - jacobian_cla)

print(diff)

# Output:
# Matrix([[-Derivative(f(k(x, y), z), k(x, y))*Derivative(k(x, y), (x, 2)) - Derivative(f(k(x, y), z), (k(x, y), 2))*Derivative(k(x, y), x)**2 - Derivative(k(x, y), x) - Derivative(k(x, y), (x, 2))]])
```

**Solution:** The solution, suggested by @tjstienstra, was to add a post-processing step after the CSE where the original expression is substituted back in when it is the argument of a derivative.

### **Improving Sparse Matrix Multiplication Safety**

In my implementation, intermediate partial derivatives, which ultimately form the Jacobian matrix through the chain rule, are organized in matrices for compactness and readability. This approach allows the Jacobian matrix to be obtained by multiplying these matrices.

However, since these matrices are sparse, it’s beneficial to exploit this for both storage and multiplication efficiency.

Initially, due to my limited experience with SymPy, I was unaware that every matrix in SymPy is internally represented as a sparse matrix. I mistakenly developed my own helper function for sparse matrix multiplication, which led to a problem: I overlooked the fact that in sparse symbolic multiplication, skipping all zero values is not safe because some zeros, when multiplied by non-zero values, can lead to NaNs.

Moreover, using existing safe matrix multiplication routines in SymPy could result in redundant computations for my specific use case.

Thanks to suggestions from @oscarbenjamin, I recognized my mistake and adopted the following solution:

- I modified the function to use standard SymPy matrices instead of just dictionaries of keys, as I was initially doing.
- I plan to add a new matrix multiplication routine through another PR that skips all zero values. A separate helper function will perform the NaN check more efficiently for my application.

A preview of this new PR can be seen [here](https://github.com/sympy/sympy/pull/26773#issuecomment-2260416576).

### **Function Splitting**

When computing the Jacobian, users might have already performed Common Subexpression Elimination on the input, or they might require the output in a reduced format (i.e., with replacement symbols). To provide users with this flexibility, I split the function into three parts:

- A core function that takes a CSEd expression and outputs a CSEd Jacobian.
- A standard Jacobian function that takes a normal SymPy expression and outputs the Jacobian with the original symbols.
- A hybrid function that takes a normal SymPy expression as input but outputs a Jacobian matrix in a reduced format.

## **Conclusions**

After these modifications, new benchmarks have confirmed the good performance of the function. I believe that this PR is nearly ready for merging. Afterward, I will create a second PR to allow users to test the performance of the forward Jacobian for system linearization.
