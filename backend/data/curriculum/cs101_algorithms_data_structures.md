# CS101: Advanced Data Structures & Algorithmic Analysis

<!-- metadata:
subject: Computer Science
topic_id: dsa_dynamic_programming
topic_name: Dynamic Programming
difficulty: Intermediate
bloom_level: Apply
prerequisites: Recursion, Mathematical Induction, Arrays
-->

## 1. Principles of Dynamic Programming

Dynamic Programming (DP) is an algorithmic paradigm that solves complex problems by breaking them down into simpler subproblems. It is applicable when a problem exhibits two critical properties:
1. **Optimal Substructure**: An optimal solution to the problem contains optimal solutions to its subproblems.
2. **Overlapping Subproblems**: The recursive space contains repeated calls to the same subproblems rather than generating new subproblems at each step.

### Memoization (Top-Down) vs. Tabulation (Bottom-Up)
- **Top-Down Memoization**: Maintains natural recursive decomposition and stores results in a lookup hash map or cache array. Overcomes recursion call-stack overhead using tail-call optimization or state-space bounds.
- **Bottom-Up Tabulation**: Eliminates recursion overhead by iteratively filling an n-dimensional table based on topological ordering of subproblem dependencies. Enables auxiliary space optimization (e.g., state reduction from O(N) to O(1) in Fibonacci or O(N*W) to O(W) in Knapsack).

```python
# Canonical Tabulation Pattern: Coin Change (Fewest Coins)
def min_coins_tabulation(coins: list[int], amount: int) -> int:
    dp = [float('inf')] * (amount + 1)
    dp[0] = 0
    for a in range(1, amount + 1):
        for c in coins:
            if a - c >= 0:
                dp[a] = min(dp[a], 1 + dp[a - c])
    return dp[amount] if dp[amount] != float('inf') else -1
```

<!-- metadata:
subject: Computer Science
topic_id: dsa_trees_graphs
topic_name: Graph Algorithms & Trees
difficulty: Intermediate
bloom_level: Apply
prerequisites: Queues, Stacks, Adjacency Lists
-->

## 2. Graph Algorithms & Shortest Paths

A graph G = (V, E) consists of a set of vertices V and edges E.
- **Dijkstra's Algorithm**: Greedy single-source shortest path algorithm for graphs with non-negative edge weights. Using a min-heap priority queue, runtime complexity is O((|V| + |E|) log |V|).
- **Disjoint-Set Union (DSU / Union-Find)**: Tracks elements partitioned into disjoint subsets. With path compression and union-by-rank heuristics, amortized time complexity per operation is nearly linear O(α(N)), where α is the inverse Ackermann function.
- **Cycle Detection**:
  - Directed graphs: 3-color DFS (WHITE = unvisited, GRAY = active recursion stack, BLACK = fully processed). Finding an edge to a GRAY node confirms a back-edge and hence a directed cycle.
  - Undirected graphs: Union-Find or BFS with parent pointers.
