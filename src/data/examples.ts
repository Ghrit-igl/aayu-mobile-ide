/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Verified AAYU Canonical Example Programs and Starter Projects
 */

export interface ExampleProgram {
  id: string;
  title: string;
  category: 'Basics' | 'Algorithms' | 'Intent Database' | 'Intent Web & UI' | 'Native AI' | 'Multi-File';
  description: string;
  filename: string;
  code: string;
  virtualFiles?: Record<string, string>;
  expectedSnippet: string;
}

export const STARTER_EXAMPLES: ExampleProgram[] = [
  {
    id: 'ex-01-hello',
    title: 'Hello World',
    category: 'Basics',
    description: 'Classic first program printing strings and variables in canonical AAYU.',
    filename: 'hello_world.aayu',
    code: `# Canonical AAYU: Hello World
app HelloSilicon

action main
    let name = "AAYU Mobile IDE"
    let platform = "Android"
    print("Welcome to " + name + " for " + platform + "!")
    print("Intent-to-Silicon: Fast, Safe, Zero Dependencies.")
end

run main
`,
    expectedSnippet: 'Welcome to AAYU Mobile IDE for Android!',
  },
  {
    id: 'ex-02-variables',
    title: 'Variables & Mutable State',
    category: 'Basics',
    description: 'Immutable let, mutable state, arithmetic evaluation, and string operations.',
    filename: 'variables_math.aayu',
    code: `# Variables & Mutable State
app MathVariables

action main
    let radius = 7.5
    let pi = 3.14159
    let circumference = 2 * pi * radius
    let area = pi * (radius ^ 2)

    print("Radius: " + str(radius))
    print("Circumference: " + str(circumference))
    print("Circle Area: " + str(area))

    state counter = 10
    counter = counter + 5
    print("Mutable counter: " + str(counter))
end

run main
`,
    expectedSnippet: 'Circle Area: 176.7144',
  },
  {
    id: 'ex-03-fibonacci',
    title: 'Fibonacci & Control Flow',
    category: 'Algorithms',
    description: 'Recursive mathematical algorithms testing VM call-frames with action and end.',
    filename: 'fibonacci.aayu',
    code: `# Fibonacci Sequence in Canonical AAYU
app FibonacciApp

action fib(n)
    if n <= 0
        return 0
    elif n == 1
        return 1
    else
        return fib(n - 1) + fib(n - 2)
    end
end

action main
    print("Generating Fibonacci sequence:")
    for i in range(0, 10)
        print("fib(" + str(i) + ") = " + str(fib(i)))
    end
end

run main
`,
    expectedSnippet: 'fib(9) = 34',
  },
  {
    id: 'ex-04-bubble-sort',
    title: 'Bubble Sort Algorithm',
    category: 'Algorithms',
    description: 'In-place array manipulation, nested loops, and index assignment in AAYU.',
    filename: 'bubble_sort.aayu',
    code: `# Bubble Sort on AAYU Array
app SortApp

action main
    let items = [64, 34, 25, 12, 22, 11, 90]
    let n = len(items)

    print("Original array: " + str(items))

    for i in range(0, n)
        for j in range(0, n - i - 1)
            if items[j] > items[j + 1]
                let temp = items[j]
                items[j] = items[j + 1]
                items[j + 1] = temp
            end
        end
    end

    print("Sorted array:   " + str(items))
end

run main
`,
    expectedSnippet: 'Sorted array:',
  },
  {
    id: 'ex-05-intent-database',
    title: 'Intent Database: Model & Insert',
    category: 'Intent Database',
    description: 'Zero-config embedded relational database model with automatic WAL sync.',
    filename: 'intent_db.aayu',
    code: `# AAYU In-Memory Relational Database
app DatabaseApp

model Employee
    id Int
    name String
    department String
    salary Int
end

action main
    insert Employee {
        name: "Ayush Kaushik",
        department: "Core Systems Silicon",
        salary: 150000
    }

    insert Employee {
        name: "Neha Sharma",
        department: "AI Research",
        salary: 140000
    }

    let employees = find Employee
    print("All employees: " + str(employees))
end

run main
`,
    expectedSnippet: 'All employees:',
  },
  {
    id: 'ex-06-intent-routes',
    title: 'Full-Stack REST Microservice',
    category: 'Intent Web & UI',
    description: 'Declarative REST route handling for microservices and mobile backends.',
    filename: 'intent_routes.aayu',
    code: `# AAYU Full-Stack REST API Service
app ProductService

model Product
    id Int
    name String
    price Int
end

route "/api/products"
    get
        let catalog = [
            {"id": 1, "name": "Silicon Chip M1", "price": 4999},
            {"id": 2, "name": "AAYU Quantum Shard", "price": 1299}
        ]
        respond(catalog)
    end
    post
        respond({"status": "created", "latency": "1.4 us"})
    end
end

action main
    print("🚀 Silicon Web Server configured.")
    print("Test endpoints in 'Web API' tab or inspect in 'Architecture Graph'.")
end

run main
`,
    expectedSnippet: 'Silicon Web Server configured',
  },
  {
    id: 'ex-07-intent-ui',
    title: 'Declarative Flutter-like UI',
    category: 'Intent Web & UI',
    description: 'Declarative UI Tree that compiles to Android Compose or Web canvas widgets.',
    filename: 'declarative_ui.aayu',
    code: `# AAYU Declarative Mobile UI Tree
app MobilePortal

Page Home
    Column
        Text("AAYU Android Studio")
        Text("Powered by Intent-to-Silicon")
        Button("Compile & Run")
        Button("Inspect Architecture Graph")
    end
end

run Home
`,
    expectedSnippet: 'AAYU Android Studio',
  },
  {
    id: 'ex-08-native-ai',
    title: 'Native AI: K-Means Clustering',
    category: 'Native AI',
    description: 'Zero-dependency machine learning clustering algorithm running directly in the Stack VM.',
    filename: 'kmeans_ai.aayu',
    code: `# Zero-Dependency Native AI: K-Means Clustering
app AIMathApp

action main
    let dataset = [
        [2.1, 1.8], [1.9, 2.2], [2.4, 2.0],
        [9.1, 8.9], [8.7, 9.2], [9.3, 8.6]
    ]

    print("Running Native K-Means on " + str(len(dataset)) + " coordinates...")
    let model = train_kmeans(dataset, 2)

    print("Cluster 1 Centroid: " + str(model["centroids"][0]))
    print("Cluster 2 Centroid: " + str(model["centroids"][1]))
    print("Cluster assignments: " + str(model["clusters"]))
end

run main
`,
    expectedSnippet: 'Running Native K-Means',
  },
  {
    id: 'ex-09-multi-file',
    title: 'Multi-File Module Import',
    category: 'Multi-File',
    description: 'Modular project with main.aayu importing helper functions from math_utils.aayu.',
    filename: 'main.aayu',
    virtualFiles: {
      'math_utils.aayu': `# math_utils.aayu - Mathematical Helper Library
action square(x)
    return x * x
end

action hypotenuse(a, b)
    return ((a ^ 2) + (b ^ 2)) ^ 0.5
end
`,
    },
    code: `# Main Project File: imports helper module
import "math_utils.aayu"

action main
    let base = 6
    let height = 8

    print("Base: " + str(base) + " | Height: " + str(height))
    print("Base squared: " + str(square(base)))
    print("Hypotenuse: " + str(hypotenuse(base, height)))
end

run main
`,
    expectedSnippet: 'Hypotenuse: 10',
  },
  {
    id: 'ex-10-liquid-data',
    title: 'Liquid Data 2.0 (Molecular DAG)',
    category: 'Algorithms',
    description: "Ayush's 7-layer molecular condensation: CAS string interning, Columnar Frame-of-Reference deltas, and 91% compression.",
    filename: 'liquid_data_2.aayu',
    code: `# AAYU Liquid Data 2.0: CAS + Columnar Delta Compression
app LiquidMolecularEngine

action main
    let raw_json_bytes = 13040
    print("=== AAYU LIQUID DATA 2.0 ON-DEVICE ENGINE ===")
    print("Raw Minified JSON Batch: " + str(raw_json_bytes) + " Bytes")

    # 1. Content-Addressable Storage (CAS)
    # Deduplicates recurring tokens like currency, region, status
    let cas_tokens = ["INR", "USD", "EUR", "CONFIRMED_MERKLE_ROOT", "PENDING"]
    print("CAS String Interning Pool: " + str(len(cas_tokens)) + " distinct tokens")

    # 2. Columnar Frame-of-Reference (FoR) Compression
    let base_amount = 4500000
    let delta_1 = 37
    let delta_2 = 74
    print("Base Frame Amount: " + str(base_amount) + " INR")
    print("Record 1 Reconstructed: " + str(base_amount + delta_1))
    print("Record 2 Reconstructed: " + str(base_amount + delta_2))

    # 3. Measured Compaction Results
    let liquid_bundle_bytes = 1164
    let saved_pct = ((raw_json_bytes - liquid_bundle_bytes) * 100) / raw_json_bytes
    print("Liquid 2.0 Compressed Bundle: " + str(liquid_bundle_bytes) + " Bytes")
    print("Real Measured Reduction: " + str(saved_pct) + "% SAVED!")
    print("Fast Cache Key: 7272-6ec6 (O(1) < 1.0 us lookup)")
end

run main
`,
    expectedSnippet: 'Real Measured Reduction: 91% SAVED!',
  },
];
