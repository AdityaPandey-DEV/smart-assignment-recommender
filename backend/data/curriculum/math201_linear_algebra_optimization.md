# MATH201: Linear Algebra & Matrix Decompositions for AI

<!-- metadata:
subject: Applied Mathematics
topic_id: math_linear_algebra
topic_name: Spectral Theory & Eigenvalues
difficulty: Advanced
bloom_level: Analyze
prerequisites: Matrix Multiplication, Determinants, Vector Spaces
-->

## 1. Spectral Decomposition and Eigenvalue Problems

For a square matrix A ∈ R^(n×n), a non-zero vector v ∈ R^n is an eigenvector if:
`A v = λ v`
Where λ is the scalar eigenvalue.
- **Characteristic Equation**: Solutions to `det(A - λI) = 0` yield the spectrum of eigenvalues.
- **Spectral Theorem for Symmetric Matrices**: Any real symmetric matrix A (A = A^T) has purely real eigenvalues and possesses an orthonormal basis of eigenvectors: `A = Q Λ Q^T`.
- **Geometric Interpretation**: Eigenvectors define the invariant axes of spatial scaling under transformation A.

<!-- metadata:
subject: Applied Mathematics
topic_id: math_svd_factorization
topic_name: Singular Value Decomposition (SVD)
difficulty: Advanced
bloom_level: Apply
prerequisites: Eigenvalues, Matrix Inverses, Orthogonality
-->

## 2. Singular Value Decomposition (SVD) & Low-Rank Approximation

For any arbitrary matrix A ∈ R^(m×n), SVD provides the canonical factorization:
`A = U Σ V^T`
Where:
- `U` ∈ R^(m×m) contains orthonormal left singular vectors (eigenvectors of A A^T).
- `Σ` ∈ R^(m×n) is a diagonal matrix containing non-negative singular values `σ_1 ≥ σ_2 ≥ ... ≥ 0`.
- `V^T` ∈ R^(n×n) contains orthonormal right singular vectors (eigenvectors of A^T A).

**Eckart-Young-Mirsky Theorem**:
The optimal rank-k approximation A_k that minimizes the Frobenius norm error `||A - A_k||_F` is given by truncating SVD to the top k singular components. This is the mathematical cornerstone of Latent Semantic Analysis (LSA), vector embeddings dimensionality reduction, and collaborative filtering recommendation engines.
