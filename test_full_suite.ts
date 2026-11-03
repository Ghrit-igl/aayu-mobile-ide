/**
 * AAYU Mobile IDE - Comprehensive End-to-End Test Suite
 * Tests all language keywords, built-in functions, collections, math,
 * contracts, database, and git version control engine.
 */

import { AayuRunner } from './src/engine/runner';
import { GitService } from './src/services/gitService';
import { WorkspaceService } from './src/services/workspaceService';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ PASS: ${testName}`);
  } else {
    failedTests++;
    console.error(`  ❌ FAIL: ${testName} ${detail ? `(${detail})` : ''}`);
  }
}

async function runTestSuite() {
  console.log('\n=============================================================');
  console.log('🚀 AAYU MOBILE IDE: COMPLETE ENGINE & GIT SUBSYSTEM VERIFICATION');
  console.log('=============================================================\n');

  // -------------------------------------------------------------
  // TEST GROUP 1: Declarations & Keywords
  // -------------------------------------------------------------
  console.log('📌 1. Testing Core Language Keywords & Architecture Declarations...');

  const fullProgram = `
app ECommerceApp

model Product {
    id: Int,
    name: String,
    price: Int
}

route "/api/products"
    get
        respond("All products list")
    end
end

Page Home
    Column
        Text("Product Catalog")
        Button("Refresh")
    end
end

action calculate_tax(amount, rate)
    let tax = amount * rate / 100
    return tax
end

let base_price = 100
state current_tax = calculate_tax(base_price, 18)
let total = base_price + current_tax

print("Total price:", total)
`;

  const run1 = AayuRunner.run(fullProgram);
  assert(run1.success, 'Full-stack single-file keywords (app, model, route, page, column, text, button, action, let, state, respond)', run1.stderr);
  assert(run1.stdout.includes('Total price: 118'), 'Execution output of calculate_tax and print');

  // -------------------------------------------------------------
  // TEST GROUP 2: Control Flow (if, elif, else, while, for, loop, break, continue)
  // -------------------------------------------------------------
  console.log('\n📌 2. Testing Control Flow (if/elif/else, while, for, break, continue)...');

  const controlFlowProgram = `
let score = 85
state grade = ""

if score >= 90
    grade = "A"
elif score >= 80
    grade = "B"
else
    grade = "C"
end
print("Grade:", grade)

# While loop with sum
state i = 1
state while_sum = 0
while i <= 5
    while_sum = while_sum + i
    i = i + 1
end
print("While Sum:", while_sum)

# For in loop
let numbers = [10, 20, 30]
state for_sum = 0
for n in numbers
    for_sum = for_sum + n
end
print("For Sum:", for_sum)

# Loop with break and continue
state counter = 0
state accumulated = 0
loop
    counter = counter + 1
    if counter == 2
        continue
    end
    if counter > 4
        break
    end
    accumulated = accumulated + counter
end
print("Accumulated:", accumulated)
`;

  const run2 = AayuRunner.run(controlFlowProgram);
  assert(run2.success, 'Control flow structures compile and run without error', run2.stderr);
  assert(run2.stdout.includes('Grade: B'), 'if-elif-else branch selection');
  assert(run2.stdout.includes('While Sum: 15'), 'while loop execution');
  assert(run2.stdout.includes('For Sum: 60'), 'for-in list iteration');
  assert(run2.stdout.includes('Accumulated: 8'), 'loop with continue (skip 2) and break (>4): 1 + 3 + 4 = 8');

  // -------------------------------------------------------------
  // TEST GROUP 3: Direct Assignment (e.g. a = 7)
  // -------------------------------------------------------------
  console.log('\n📌 3. Testing Direct Assignment & Dynamic Variables (a = 7)...');

  const assignProgram = `
a = 7
b = 13
c = a * b
print("a:", a, "b:", b, "c:", c)
a += 3
print("a after += 3:", a)
`;
  const run3 = AayuRunner.run(assignProgram);
  assert(run3.success, 'Direct assignment without explicit let/state (a = 7)', run3.stderr);
  assert(run3.stdout.includes('a: 7 b: 13 c: 91'), 'Computed result of direct variables');
  assert(run3.stdout.includes('a after += 3: 10'), 'In-place addition assignment (+=)');

  // -------------------------------------------------------------
  // TEST GROUP 4: Built-in Math Functions
  // -------------------------------------------------------------
  console.log('\n📌 4. Testing Built-in Math Functions (std/math)...');

  const mathProgram = `
let s = math_sqrt(144)
let p = pow(2, 10)
let ab = abs(-42)
let cl = clamp(15, 0, 10)
let r1 = relu(-5)
let r2 = relu(12)
let sig = sigmoid(0)
let mi = min(25, 14)
let ma = max(25, 14)

print("sqrt:", s)
print("pow:", p)
print("abs:", ab)
print("clamp:", cl)
print("relu_neg:", r1, "relu_pos:", r2)
print("sigmoid(0):", sig)
print("min:", mi, "max:", ma)
`;
  const run4 = AayuRunner.run(mathProgram);
  assert(run4.success, 'Math library builtins executed', run4.stderr);
  assert(run4.stdout.includes('sqrt: 12'), 'math_sqrt(144) == 12');
  assert(run4.stdout.includes('pow: 1024'), 'pow(2, 10) == 1024');
  assert(run4.stdout.includes('abs: 42'), 'abs(-42) == 42');
  assert(run4.stdout.includes('clamp: 10'), 'clamp(15, 0, 10) == 10');
  assert(run4.stdout.includes('relu_neg: 0 relu_pos: 12'), 'relu(-5) == 0, relu(12) == 12');
  assert(run4.stdout.includes('sigmoid(0): 0.5'), 'sigmoid(0) == 0.5');
  assert(run4.stdout.includes('min: 14 max: 25'), 'min and max values correct');

  // -------------------------------------------------------------
  // TEST GROUP 5: Built-in Collections (std/collections)
  // -------------------------------------------------------------
  console.log('\n📌 5. Testing Built-in Collections Functions (std/collections)...');

  const collProgram = `
let arr = [5, 2, 8, 1, 9, 3]
let total = sum(arr)
let avg = mean(arr)
let s_arr = sorted(arr)
let rev = reversed([1, 2, 3])
let unq = unique([1, 2, 2, 3, 3, 3, 4])
let a_min = array_min(arr)
let a_max = array_max(arr)
let has_8 = contains(arr, 8)
let has_99 = contains(arr, 99)

print("sum:", total)
print("mean:", avg)
print("min_item:", a_min, "max_item:", a_max)
print("contains 8:", has_8, "contains 99:", has_99)
print("sorted:", s_arr)
print("reversed:", rev)
print("unique:", unq)
`;
  const run5 = AayuRunner.run(collProgram);
  assert(run5.success, 'Collections builtins executed', run5.stderr);
  assert(run5.stdout.includes('sum: 28'), 'sum([5,2,8,1,9,3]) == 28');
  assert(run5.stdout.includes('min_item: 1 max_item: 9'), 'array_min and array_max');
  assert(run5.stdout.includes('contains 8: true contains 99: false'), 'contains function');

  // -------------------------------------------------------------
  // TEST GROUP 6: Cryptographic Hashing & AI Tokens
  // -------------------------------------------------------------
  console.log('\n📌 6. Testing Cryptographic Hashing (SHA-256) & AI Tokens (std/tokens)...');

  const cryptoProgram = `
let hash1 = hash_string("AAYU")
let hash2 = sha256("AAYU")
let text = "AAYU Intent to Silicon programming language for AI Agents"
let tokens = estimate_tokens(text)
let compressed = compress_ai_context(text, 5)

print("hash_len:", len(hash1))
print("hashes_equal:", hash1 == hash2)
print("tokens:", tokens > 0)
print("compressed_len:", len(compressed) <= 20)
`;
  const run6 = AayuRunner.run(cryptoProgram);
  assert(run6.success, 'Crypto and Tokens executed', run6.stderr);
  assert(run6.stdout.includes('hash_len: 64'), 'SHA-256 produces exact 64-char hex digest');
  assert(run6.stdout.includes('hashes_equal: true'), 'hash_string and sha256 aliases match');
  assert(run6.stdout.includes('tokens: true'), 'estimate_tokens returned valid token count');
  assert(run6.stdout.includes('compressed_len: true'), 'compress_ai_context trimmed within budget');

  // -------------------------------------------------------------
  // TEST GROUP 7: Contracts & Assertion Testing
  // -------------------------------------------------------------
  console.log('\n📌 7. Testing Invariants, Preconditions & Assertions (std/contracts, std/test)...');

  const contractProgram = `
test_begin_suite("Silicon Core Assertions")

assert_eq(2 + 2, 4, "addition")
assert_true(100 > 50, "comparison")
require(true, "precondition valid")
ensure(true, "postcondition valid")
invariant(true, "invariant preserved")

test_end_suite()
print("All contract assertions verified successfully.")
`;
  const run7 = AayuRunner.run(contractProgram);
  assert(run7.success, 'Contract testing and assertions passed', run7.stderr);
  assert(run7.stdout.includes('TEST SUITE: Silicon Core Assertions'), 'Suite banner logged');
  assert(run7.stdout.includes('All contract assertions verified successfully'), 'Contract execution finished cleanly');

  // -------------------------------------------------------------
  // TEST GROUP 8: In-Memory Database (std/db)
  // -------------------------------------------------------------
  console.log('\n📌 8. Testing Embedded Database Engine (std/db)...');

  const dbProgram = `
db_create_record("users", { name: "Ayush", role: "creator" })
db_create_record("users", { name: "Agent-01", role: "developer" })
db_create_record("users", { name: "Agent-02", role: "developer" })

let total_users = db_count_records("users")
let dev_users = db_filter_records("users", "role", "developer")
let user_1 = db_find_by_id("users", 1)

print("Total users:", total_users)
print("Dev users count:", len(dev_users))
print("User 1 name:", user_1["name"])
`;
  const run8 = AayuRunner.run(dbProgram);
  assert(run8.success, 'Database functions executed', run8.stderr);
  assert(run8.stdout.includes('Total users: 3'), 'db_count_records returns 3');
  assert(run8.stdout.includes('Dev users count: 2'), 'db_filter_records filtered 2 developers');
  assert(run8.stdout.includes('User 1 name: Ayush'), 'db_find_by_id returned correct record');

  // -------------------------------------------------------------
  // TEST GROUP 9: Git Subsystem (init, status, stage, commit, branch, merge, log)
  // -------------------------------------------------------------
  console.log('\n📌 9. Testing Git Subsystem Engine (gitService.ts)...');

  const testFiles = {
    'main.aayu': 'print("Hello from main.aayu")',
    'utils.aayu': 'action add(a, b) return a + b end',
  };

  const projId = 'proj-test-git';
  // 1. Init
  const repo = GitService.initRepo(projId, testFiles);
  assert(Boolean(repo.branches['main']), 'Git init creates default main branch');
  assert(repo.commits.length === 1, 'Git init creates initial commit');

  // 2. Status
  const status1 = GitService.status(projId, testFiles);
  assert(status1.clean, 'Working tree clean right after commit');

  // 3. Stage & Commit new file
  const updatedFiles = {
    ...testFiles,
    'main.aayu': 'print("Hello from main.aayu v2")',
    'db.aayu': 'print("Database ready")',
  };
  const status2 = GitService.status(projId, updatedFiles);
  assert(status2.modified.includes('main.aayu'), 'git status detects modified files');
  assert(status2.untracked.includes('db.aayu'), 'git status detects untracked files');

  GitService.stageAll(projId, updatedFiles);
  const repoAfterStage = GitService.getRepo(projId);
  assert(repoAfterStage.staged['main.aayu'] !== undefined && repoAfterStage.staged['db.aayu'] !== undefined, 'git add . stages all modified & untracked files');

  const commitRes = GitService.commit(projId, 'feat: add database and update greeting', updatedFiles);
  assert(Boolean(commitRes.hash), 'git commit succeeds with valid hash');
  const repoAfterCommit = GitService.getRepo(projId);
  assert(repoAfterCommit.commits.length === 2, 'git log history contains 2 commits');

  // 4. Branching
  const branchRes = GitService.createBranch(projId, 'feature-ai');
  assert(branchRes, 'git branch feature-ai creates new branch');
  const repoBranch = GitService.getRepo(projId);
  assert(Boolean(repoBranch.branches['feature-ai']), 'Branch list includes feature-ai');

  const switchRes = GitService.switchBranch(projId, 'feature-ai');
  assert(switchRes.success, 'git switch / checkout switches active branch');

  // 5. Work on feature branch
  const featureFiles = {
    ...updatedFiles,
    'ai.aayu': 'print("AI neural weights initialized")',
  };
  GitService.stageAll(projId, featureFiles);
  GitService.commit(projId, 'feat: initialize AI module on feature branch', featureFiles);

  // Switch back to main and merge
  const switchBack = GitService.switchBranch(projId, 'main');
  assert(switchBack.success, 'Switched back to main branch');

  const mergeRes = GitService.merge(projId, 'feature-ai', updatedFiles);
  assert(mergeRes.success, 'git merge feature-ai merges successfully into main');
  assert(mergeRes.files && mergeRes.files['ai.aayu'] !== undefined, 'Merged files include new files from feature branch');

  // 6. Push & Pull
  const pushRes = GitService.push(projId);
  assert(pushRes.success, 'git push synchronizes with origin');

  const pullRes = GitService.pull(projId);
  assert(pullRes.success, 'git pull updates local repository');

  // 7. Git Clone
  const cloneRes = await GitService.cloneRepo('https://github.com/Minato95-ayu/INTENT-TO-SILICON');
  assert(cloneRes.success, 'git clone retrieves repo successfully');
  assert(cloneRes.files['main.aayu'] !== undefined, 'Cloned repository contains valid starter files');

  // -------------------------------------------------------------
  // TEST GROUP 10: Multi-File Imports & Orchestrator
  // -------------------------------------------------------------
  console.log('\n📌 10. Testing Multi-File Project Import Resolution...');

  const multiFiles = {
    'math_lib.aayu': `
action square(x)
    return x * x
end
`,
    'main.aayu': `
import "math_lib.aayu"

let ans = square(9)
print("Square of 9:", ans)
`,
  };

  const run10 = AayuRunner.run(multiFiles['main.aayu'], {
    virtualFiles: multiFiles,
  });
  assert(run10.success, 'Multi-file import resolution and execution', run10.stderr);
  assert(run10.stdout.includes('Square of 9: 81'), 'Imported function square(9) == 81 executed');

  // -------------------------------------------------------------
  // TEST SUMMARY REPORT
  // -------------------------------------------------------------
  console.log('\n=============================================================');
  console.log(`📊 TEST SUITE SUMMARY: ${passedTests}/${totalTests} PASSED (${Math.round((passedTests / totalTests) * 100)}%)`);
  if (failedTests > 0) {
    console.error(`⚠️ FAILED TESTS: ${failedTests}`);
    process.exit(1);
  } else {
    console.log('🎉 ALL 10 TEST SUITES PASSED WITH 100% SUCCESS!');
    console.log('=============================================================\n');
  }
}

runTestSuite().catch((err) => {
  console.error('Fatal error during test run:', err);
  process.exit(1);
});
