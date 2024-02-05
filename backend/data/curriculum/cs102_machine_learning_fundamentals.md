# CS102: Machine Learning & Deep Learning Foundations

<!-- metadata:
subject: Machine Learning
topic_id: ml_neural_networks
topic_name: Neural Networks & Backpropagation
difficulty: Advanced
bloom_level: Analyze
prerequisites: Multivariable Calculus, Linear Algebra, Python
-->

## 1. Deep Neural Architectures & Backpropagation

A feedforward neural network computes an output vector `y_hat` through successive non-linear transformations:
`z^[l] = W^[l] a^[l-1] + b^[l]`
`a^[l] = g(z^[l])`

### Backpropagation & The Chain Rule
Gradient calculation proceeds backwards from the scalar loss function `L(y_hat, y)`. The error term δ^[l] for layer `l` is formulated as:
`δ^[l] = (W^[l+1]^T δ^[l+1]) ⊙ g'(z^[l])`
Where `⊙` denotes the Hadamard (element-wise) product and `g'` is the derivative of the activation function (e.g. ReLU, GELU, Sigmoid).

### Gradient Vanishing and Exploding
In deep networks (depth > 20), repeated multiplication by weight matrices causes gradients to vanish exponentially towards zero or explode to infinity.
Mitigations include:
1. **Residual Connections (ResNet)**: `a^[l] = g(W a^[l-1] + b) + a^[l-1]`, allowing gradients to flow unimpeded via identity mappings.
2. **Layer Normalization / Batch Normalization**: Zero-centers and scales activations, stabilizing the internal covariate shift.
3. **Careful Weight Initialization**: He (Kaiming) initialization for ReLU networks `Var(W) = 2 / n_in`.

<!-- metadata:
subject: Machine Learning
topic_id: ml_regularization
topic_name: Model Regularization & Generalization
difficulty: Intermediate
bloom_level: Evaluate
prerequisites: Overfitting, Loss Functions, Gradient Descent
-->

## 2. Regularization, Bias-Variance Trade-off & Optimization

High variance (overfitting) occurs when the model memorizes training noise rather than capturing the underlying distribution.
- **L2 Regularization (Weight Decay)**: Penalizes large weights by adding `(λ / 2m) ||W||_2^2` to the loss function. Drives non-essential weights toward zero while maintaining smoothness.
- **Dropout**: Randomly deactivates a fraction `p` of neuron activations during training forward passes, preventing co-adaptation of features.
- **Adam Optimizer**: Combines Momentum (exponential moving average of gradients) with RMSProp (exponential moving average of squared gradients) with bias correction terms.
