/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * AAYU Zero-to-Silicon Interactive Curriculum
 * 12 comprehensive modular chapters with verified .aayu code and runnable exercises.
 */

export interface Exercise {
  title: string;
  task: string;
  starterCode: string;
  solutionCode: string;
  expectedOutput: string;
}

export interface TutorialLesson {
  id: string;
  number: number;
  title: string;
  tagline: string;
  concept: string;
  prerequisites: string[];
  explanation: string;
  code: string;
  expectedOutput: string;
  exercise: Exercise;
  docLink: string;
}

export const TUTORIAL_LESSONS: TutorialLesson[] = [
  {
    id: 'ch-01',
    number: 1,
    title: 'Getting Started with AAYU',
    tagline: 'The Intent-First Programming Language',
    concept: 'Introduction to AAYU philosophy, Zero-Dependency stack, and Hello World.',
    prerequisites: ['Basic understanding of programming logic'],
    explanation:
      'AAYU is an enterprise-grade programming language created by Ayush Kaushik (@Minato95-ayu). Its mission is "Intent to Silicon" — compiling high-level developer intent directly into native HTTP servers, relational databases, and user interfaces without external dependencies like npm, pip, or bulky runtime engines. Programs are stored in `.aayu` files.',
    code: `// Lesson 1: Hello World in AAYU
let greeting = "Hello from AAYU!"
println(greeting)

let mission = "Intent to Silicon: Zero Dependencies."
println(mission)
`,
    expectedOutput: `Hello from AAYU!\nIntent to Silicon: Zero Dependencies.\n`,
    exercise: {
      title: 'Personalized Greeting',
      task: 'Declare a variable `name` with your name and print "Welcome, <name> to AAYU Mobile!".',
      starterCode: `let name = "Developer"\n// Complete the print statement\n`,
      solutionCode: `let name = "Developer"\nprintln("Welcome, " + name + " to AAYU Mobile!")\n`,
      expectedOutput: `Welcome, Developer to AAYU Mobile!\n`,
    },
    docLink: 'https://intent-to-silicon.vercel.app/docs',
  },
  {
    id: 'ch-02',
    number: 2,
    title: 'Installation & Workspace Basics',
    tagline: 'CLI Toolchain, Bytecode, and Mobile IDE Architecture',
    concept: 'Working with the AAYU CLI toolchain (`aayu run`, `aayu build`) and IDE file management.',
    prerequisites: ['Chapter 1'],
    explanation:
      'The AAYU standalone compiler is a single binary that translates `.aayu` source code into an Abstract Syntax Tree (AST), generates optimized stack bytecode, and executes it via a memory-safe Stack Virtual Machine. On Android, the mobile IDE integrates this engine via JNI without requiring a remote compilation server.',
    code: `// Inspect environment and basic arithmetic
let compiler = "AAYU Standalone Engine"
let version = 0.42
let is_android = true

println("Compiler:", compiler)
println("Version:", version)
println("Local execution active:", is_android)
`,
    expectedOutput: `Compiler: AAYU Standalone Engine\nVersion: 0.42\nLocal execution active: true\n`,
    exercise: {
      title: 'System Information Banner',
      task: 'Define variables for app name, target ABI ("arm64-v8a"), and RAM budget (64MB), and print a formatted summary.',
      starterCode: `let app = "AAYU Mobile IDE"\n// Add ABI and memory variables\n`,
      solutionCode: `let app = "AAYU Mobile IDE"\nlet abi = "arm64-v8a"\nlet ram_mb = 64\nprintln("App:", app, "| ABI:", abi, "| RAM:", ram_mb, "MB")\n`,
      expectedOutput: `App: AAYU Mobile IDE | ABI: arm64-v8a | RAM: 64 MB\n`,
    },
    docLink: 'https://intent-to-silicon.vercel.app/docs',
  },
  {
    id: 'ch-03',
    number: 3,
    title: 'Syntax, Variables, & Expressions',
    tagline: 'Identifiers, Types, and Mathematical Precedence',
    concept: 'Variable declaration with `let`, mathematical operators, and string operations.',
    prerequisites: ['Chapter 2'],
    explanation:
      'Variables are declared using the `let` keyword. AAYU supports dynamic types: Integers, Floats, Strings, and Booleans. Arithmetic expressions honor standard operator precedence: parentheses `()`, exponentiation `^`, multiplication/division `*`, `/`, `%`, and addition/subtraction `+`, `-`.',
    code: `// Mathematical expressions in AAYU
let a = 15
let b = 4

let sum = a + b
let diff = a - b
let product = a * b
let quotient = a / b
let remainder = a % b
let power = 2 ^ 8

println("Sum:", sum)
println("Product:", product)
println("Quotient:", quotient)
println("Remainder:", remainder)
println("2 ^ 8 =", power)
`,
    expectedOutput: `Sum: 19\nProduct: 60\nQuotient: 3.75\nRemainder: 3\n2 ^ 8 = 256\n`,
    exercise: {
      title: 'Hypotenuse Calculation',
      task: 'Calculate the hypotenuse squared of a right triangle with legs a = 6 and b = 8 using `a^2 + b^2`.',
      starterCode: `let a = 6\nlet b = 8\n// Compute h2\n`,
      solutionCode: `let a = 6\nlet b = 8\nlet h2 = (a ^ 2) + (b ^ 2)\nprintln("Hypotenuse squared:", h2)\n`,
      expectedOutput: `Hypotenuse squared: 100\n`,
    },
    docLink: 'https://intent-to-silicon.vercel.app/docs',
  },
  {
    id: 'ch-04',
    number: 4,
    title: 'Conditions & Loops',
    tagline: 'Flow Control with if, elif, else, while, and for',
    concept: 'Conditional branching and high-performance loop constructs.',
    prerequisites: ['Chapter 3'],
    explanation:
      'Control flow in AAYU is clean and expressive. Conditionals use `if`, `elif`, and `else` blocks with boolean operators (`and`, `or`, `!`, `==`, `!=`, `<`, `>`). Loops can be constructed with `for item in collection`, `while condition`, or infinite `loop { ... }` with `break` and `continue`.',
    code: `// FizzBuzz in AAYU using for and if/elif/else
println("--- FizzBuzz 1 to 15 ---")
for i in range(1, 16) {
    if i % 15 == 0 {
        println("FizzBuzz")
    } elif i % 3 == 0 {
        println("Fizz")
    } elif i % 5 == 0 {
        println("Buzz")
    } else {
        println(i)
    }
}
`,
    expectedOutput: `--- FizzBuzz 1 to 15 ---\n1\n2\nFizz\n4\nBuzz\nFizz\n7\n8\nFizz\nBuzz\n11\nFizz\n13\n14\nFizzBuzz\n`,
    exercise: {
      title: 'Even Number Counter',
      task: 'Count how many even numbers exist between 1 and 20 inclusive, then print the total count.',
      starterCode: `let count = 0\n// Iterate and count\n`,
      solutionCode: `let count = 0\nfor n in range(1, 21) {\n    if n % 2 == 0 {\n        count = count + 1\n    }\n}\nprintln("Total evens:", count)\n`,
      expectedOutput: `Total evens: 10\n`,
    },
    docLink: 'https://intent-to-silicon.vercel.app/docs',
  },
  {
    id: 'ch-05',
    number: 5,
    title: 'Functions & Return Values',
    tagline: 'Modular Code, Parameters, and Recursion',
    concept: 'Defining reusable functions with `fn`, parameter passing, and recursive calls.',
    prerequisites: ['Chapter 4'],
    explanation:
      'Functions are declared with `fn name(param1, param2) { ... }`. Functions return values via `return expr`. When a function is called, the AAYU VM allocates a lightweight call frame on the execution stack. Recursion is fully supported.',
    code: `// Recursive Factorial and Fibonacci
fn factorial(n) {
    if n <= 1 {
        return 1
    }
    return n * factorial(n - 1)
}

fn fibonacci(n) {
    if n <= 0 { return 0 }
    if n == 1 { return 1 }
    return fibonacci(n - 1) + fibonacci(n - 2)
}

println("Factorial of 5:", factorial(5))
println("Fibonacci(7):", fibonacci(7))
`,
    expectedOutput: `Factorial of 5: 120\nFibonacci(7): 13\n`,
    exercise: {
      title: 'Power Function',
      task: 'Write a recursive function `pow(base, exp)` that computes base raised to exp (for integer exp >= 0).',
      starterCode: `fn pow(base, exp) {\n    // Implement recursively\n}\nprintln(pow(2, 5))\n`,
      solutionCode: `fn pow(base, exp) {\n    if exp == 0 { return 1 }\n    return base * pow(base, exp - 1)\n}\nprintln(pow(2, 5))\n`,
      expectedOutput: `32\n`,
    },
    docLink: 'https://intent-to-silicon.vercel.app/docs',
  },
  {
    id: 'ch-06',
    number: 6,
    title: 'Arrays, Dictionaries, & Indexing',
    tagline: 'Compound Data Structures and Heap Collections',
    concept: 'Working with ordered lists `[...]`, key-value maps `{...}`, and indexing.',
    prerequisites: ['Chapter 5'],
    explanation:
      'AAYU provides built-in array and dictionary literals without imports. Arrays support 0-based indexing `arr[i]`, negative indexing, methods like `len()`, and loops. Dictionaries allow key-value association for rapid lookup.',
    code: `// Collections in AAYU
let scores = [92, 85, 98, 77, 100]
println("Scores count:", len(scores))
println("First score:", scores[0])

let user = {
    "username": "kaushik",
    "role": "Architect",
    "level": 10
}

println("User:", user["username"])
println("Role:", user["role"])

// Compute array sum
let total = 0
for s in scores {
    total = total + s
}
println("Average score:", total / len(scores))
`,
    expectedOutput: `Scores count: 5\nFirst score: 92\nUser: kaushik\nRole: Architect\nAverage score: 90.4\n`,
    exercise: {
      title: 'Find Maximum in Array',
      task: 'Iterate through an array of numbers and find the highest value.',
      starterCode: `let nums = [42, 17, 89, 5, 63]\nlet max_val = nums[0]\n// Iterate and update max_val\n`,
      solutionCode: `let nums = [42, 17, 89, 5, 63]\nlet max_val = nums[0]\nfor x in nums {\n    if x > max_val {\n        max_val = x\n    }\n}\nprintln("Maximum:", max_val)\n`,
      expectedOutput: `Maximum: 89\n`,
    },
    docLink: 'https://intent-to-silicon.vercel.app/docs',
  },
  {
    id: 'ch-07',
    number: 7,
    title: 'Imports & Multi-File Projects',
    tagline: 'Modular Project Architecture and Dependency Management',
    concept: 'Splitting programs across multiple `.aayu` files with `import`.',
    prerequisites: ['Chapter 6'],
    explanation:
      'In larger systems, code is organized across multiple files (e.g. `math_utils.aayu`, `models.aayu`). The AAYU compiler resolves imports at compile time, merges the symbol scopes, and prevents circular dependency loops.',
    code: `// Multi-File Project Simulation
// In a project, file 'math_utils.aayu' would declare helper math functions:
fn square(x) { return x * x }
fn cube(x) { return x * x * x }

// Main file consumes helper functions:
let radius = 5
let area_factor = square(radius)
println("Radius squared:", area_factor)
println("Volume factor:", cube(radius))
`,
    expectedOutput: `Radius squared: 25\nVolume factor: 125\n`,
    exercise: {
      title: 'Geometric Volume Calculation',
      task: 'Create a function `cylinder_volume(r, h)` where volume is roughly `3.14 * square(r) * h`.',
      starterCode: `fn square(x) { return x * x }\n// Implement cylinder_volume\n`,
      solutionCode: `fn square(x) { return x * x }\nfn cylinder_volume(r, h) {\n    return 3.14 * square(r) * h\n}\nprintln("Cylinder volume:", cylinder_volume(3, 10))\n`,
      expectedOutput: `Cylinder volume: 282.6\n`,
    },
    docLink: 'https://intent-to-silicon.vercel.app/docs',
  },
  {
    id: 'ch-08',
    number: 8,
    title: 'Error Handling & Debugging',
    tagline: 'Honest Compiler Diagnostics and Line/Column Pinpointing',
    concept: 'Understanding compiler syntax errors vs runtime exceptions.',
    prerequisites: ['Chapter 7'],
    explanation:
      'A true developer tool never hides errors or simulates fake success. AAYU reports errors at three distinct stages: Lexer (invalid characters, unclosed strings), Parser (syntax anomalies with exact line and column), and VM Runtime (division by zero, undefined identifiers, stack exhaustion).',
    code: `// Safe computation with defensive checking
fn safe_divide(numerator, denominator) {
    if denominator == 0 {
        println("Warning: Cannot divide by zero! Returning null.")
        return null
    }
    return numerator / denominator
}

let res1 = safe_divide(100, 5)
println("Result 1:", res1)

let res2 = safe_divide(100, 0)
println("Result 2:", res2)
`,
    expectedOutput: `Result 1: 20\nWarning: Cannot divide by zero! Returning null.\nResult 2: null\n`,
    exercise: {
      title: 'Index Boundary Guard',
      task: 'Write a function `safe_get(arr, idx)` that returns `null` if the index is out of bounds, or `arr[idx]` otherwise.',
      starterCode: `fn safe_get(arr, idx) {\n    // Check 0 <= idx < len(arr)\n}\n`,
      solutionCode: `fn safe_get(arr, idx) {\n    if idx < 0 or idx >= len(arr) {\n        return null\n    }\n    return arr[idx]\n}\nlet items = ["Alpha", "Beta"]\nprintln(safe_get(items, 1))\nprintln(safe_get(items, 9))\n`,
      expectedOutput: `Beta\nnull\n`,
    },
    docLink: 'https://intent-to-silicon.vercel.app/docs',
  },
  {
    id: 'ch-09',
    number: 9,
    title: 'Compiler, Bytecode, & Runtime Internals',
    tagline: 'Under the Hood: AST, OpCodes, and Stack VM',
    concept: 'Examining disassembled bytecode instructions and stack operand mechanics.',
    prerequisites: ['Chapter 8'],
    explanation:
      'The AAYU compiler translates source AST nodes into low-level instructions: `OP_CONSTANT`, `OP_LOAD_VAR`, `OP_STORE_VAR`, `OP_ADD`, `OP_JUMP_IF_FALSE`, and `OP_CALL`. Inspecting disassembled bytecode allows developers to optimize loops and memory allocations.',
    code: `// Program to inspect in the Bytecode Disassembler tab
let x = 10
let y = 20
let z = (x * 2) + y

if z > 30 {
    println("Z exceeds threshold:", z)
}
`,
    expectedOutput: `Z exceeds threshold: 40\n`,
    exercise: {
      title: 'Bytecode Optimization Inspection',
      task: 'Open the "Disassembly" tab in the Console panel to inspect the exact instruction offsets generated for this code.',
      starterCode: `let a = 1\nlet b = 2\nlet c = a + b\nprintln(c)\n`,
      solutionCode: `let a = 1\nlet b = 2\nlet c = a + b\nprintln(c)\n`,
      expectedOutput: `3\n`,
    },
    docLink: 'https://intent-to-silicon.vercel.app/docs',
  },
  {
    id: 'ch-10',
    number: 10,
    title: "AAYU's Intent-First Programming Vision",
    tagline: 'Declarative Models, Embedded Database CRUD, & Native APIs',
    concept: 'Zero-dependency native database models and declarative REST route intent.',
    prerequisites: ['Chapter 9'],
    explanation:
      'The distinguishing innovation of AAYU is "Intent Computing". Instead of importing external ORMs, database drivers, and web frameworks, AAYU understands intent keywords directly: `model User { ... }`, `insert User { ... }`, `find User where ...`, and `route "GET /api" { ... }`.',
    code: `// AAYU Declarative Intent: Database & REST
model Product {
    id: int,
    name: str,
    price: float
}

insert Product {
    name: "AAYU Silicon Chip",
    price: 199.99
}

insert Product {
    name: "Android Mobile IDE Pro",
    price: 49.99
}

// Native query intent
find Product where price > 100.0

// Intent REST route
route "GET /products" {
    find Product
}
`,
    expectedOutput: `[AAYU Intent DB] Initialized schema model 'Product' with 3 columns\n[AAYU Intent DB] Inserted into 'Product': {"id":1,"name":"AAYU Silicon Chip","price":199.99}\n[AAYU Intent DB] Inserted into 'Product': {"id":2,"name":"Android Mobile IDE Pro","price":49.99}\n[AAYU Intent DB] Query 'find Product where price > 100': 1 match(es)\n[AAYU Intent Web] Registered REST route: [GET] /products\n`,
    exercise: {
      title: 'Customer Order Model',
      task: 'Declare a `model Order { id: int, customer: str, total: float }` and insert a record.',
      starterCode: `// Declare model and insert record\n`,
      solutionCode: `model Order {\n    id: int,\n    customer: str,\n    total: float\n}\ninsert Order {\n    customer: "Ayush",\n    total: 350.5\n}\n`,
      expectedOutput: `[AAYU Intent DB] Initialized schema model 'Order' with 3 columns\n[AAYU Intent DB] Inserted into 'Order': {"id":1,"customer":"Ayush","total":350.5}\n`,
    },
    docLink: 'https://intent-to-silicon.vercel.app/docs',
  },
  {
    id: 'ch-11',
    number: 11,
    title: 'Projects & Practical Exercises',
    tagline: 'Zero-Dependency AI Clustering with Native K-Means',
    concept: 'Implementing high-performance native machine learning algorithms without PyTorch or Scikit-learn.',
    prerequisites: ['Chapter 10'],
    explanation:
      'AAYU incorporates native mathematical vector routines. You can perform real K-Means unsupervised clustering on 2D data points using the built-in `train_kmeans(points, k)` function, demonstrating how native intent eliminates hundreds of megabytes of third-party ML wheels on mobile devices.',
    code: `// Native Machine Learning Intent: K-Means
let points = [
    [1.0, 1.0], [1.5, 2.0], [1.0, 1.8],
    [8.0, 8.0], [8.5, 9.0], [9.0, 8.2]
]

println("Training Native K-Means clustering (k = 2)...")
let result = train_kmeans(points, 2)

println("Calculated Centroid 1:", result["centroids"][0])
println("Calculated Centroid 2:", result["centroids"][1])
println("Point Cluster Assignments:", result["clusters"])
`,
    expectedOutput: `Training Native K-Means clustering (k = 2)...\nCalculated Centroid 1: [1.1667, 1.6]\nCalculated Centroid 2: [8.5, 8.4]\nPoint Cluster Assignments: [0, 0, 0, 1, 1, 1]\n`,
    exercise: {
      title: 'Centroid Distance Check',
      task: 'Calculate the difference in x coordinates between Centroid 2 and Centroid 1.',
      starterCode: `let c1_x = 1.1667\nlet c2_x = 8.5\n// Compute difference\n`,
      solutionCode: `let c1_x = 1.1667\nlet c2_x = 8.5\nlet diff_x = c2_x - c1_x\nprintln("Distance X:", diff_x)\n`,
      expectedOutput: `Distance X: 7.3333\n`,
    },
    docLink: 'https://intent-to-silicon.vercel.app/docs',
  },
  {
    id: 'ch-12',
    number: 12,
    title: 'Current Limitations & Roadmap',
    tagline: 'Honest Engineering Assessment and Android Integration Path',
    concept: 'Understanding current engine boundaries, Android NDK constraints, and roadmap.',
    prerequisites: ['Chapter 11'],
    explanation:
      'In production engineering, acknowledging boundaries is essential. Currently in AAYU v0.4.2-alpha: 1) Multi-threading is bounded by the single-threaded Stack VM; 2) Direct Android hardware sensor APIs (Camera, GPS, Bluetooth) require custom JNI glue; 3) Low-port networking (<1024) is forbidden on Android; 4) Dynamic module downloading must be digitally signed to comply with Google Play security policies.',
    code: `// Roadmap & Capability Checklist
let features = {
    "ast_parser": "PASS",
    "stack_vm": "PASS",
    "arm64_ndk": "PARTIAL",
    "sqlite_intent": "PASS",
    "physical_device": "UNVERIFIED"
}

println("=== AAYU Android Verification Status ===")
println("AST Parser:", features["ast_parser"])
println("Stack VM:", features["stack_vm"])
println("ARM64 NDK:", features["arm64_ndk"])
println("Physical Phone Run:", features["physical_device"])
`,
    expectedOutput: `=== AAYU Android Verification Status ===\nAST Parser: PASS\nStack VM: PASS\nARM64 NDK: PARTIAL\nPhysical Phone Run: UNVERIFIED\n`,
    exercise: {
      title: 'Verification Flag Test',
      task: 'Print a readiness message checking if physical device is UNVERIFIED.',
      starterCode: `let status = "UNVERIFIED"\n// Print readiness check\n`,
      solutionCode: `let status = "UNVERIFIED"\nif status == "UNVERIFIED" {\n    println("Hardware deployment pending on user Android device.")\n}\n`,
      expectedOutput: `Hardware deployment pending on user Android device.\n`,
    },
    docLink: 'https://intent-to-silicon.vercel.app/docs',
  },
];
