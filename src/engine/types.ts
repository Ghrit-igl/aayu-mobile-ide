/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * AAYU Language Engine - Type Definitions
 * Represents Lexer tokens, AST nodes, Bytecode instructions, and Runtime VM structures.
 */

export type TokenType =
  // Canonical Keywords
  | 'ACTION'
  | 'STATE'
  | 'END'
  | 'APP'
  | 'RUN'
  | 'RESPOND'
  | 'GET'
  | 'POST'
  | 'PUT'
  // Existing Keywords
  | 'LET'
  | 'MUT'
  | 'CONST'
  | 'FN'
  | 'RETURN'
  | 'IF'
  | 'ELIF'
  | 'ELSE'
  | 'WHILE'
  | 'FOR'
  | 'IN'
  | 'LOOP'
  | 'BREAK'
  | 'CONTINUE'
  | 'TRUE'
  | 'FALSE'
  | 'NULL'
  | 'PRINT'
  | 'PRINTLN'
  | 'IMPORT'
  | 'AS'
  | 'FROM'
  // Intent Keywords
  | 'MODEL'
  | 'INSERT'
  | 'FIND'
  | 'UPDATE'
  | 'DELETE'
  | 'WHERE'
  | 'ROUTE'
  | 'PAGE'
  | 'COLUMN'
  | 'ROW'
  | 'STACK'
  | 'TEXT'
  | 'BUTTON'
  | 'CHART'
  // Literals
  | 'IDENTIFIER'
  | 'NUMBER'
  | 'STRING'
  // Operators
  | 'PLUS'
  | 'MINUS'
  | 'STAR'
  | 'SLASH'
  | 'PERCENT'
  | 'CARET'
  | 'ASSIGN'
  | 'PLUS_ASSIGN'
  | 'MINUS_ASSIGN'
  | 'EQ'
  | 'NEQ'
  | 'LT'
  | 'LTE'
  | 'GT'
  | 'GTE'
  | 'AND'
  | 'OR'
  | 'NOT'
  | 'ARROW'
  // Delimiters
  | 'LPAREN'
  | 'RPAREN'
  | 'LBRACE'
  | 'RBRACE'
  | 'LBRACKET'
  | 'RBRACKET'
  | 'COMMA'
  | 'COLON'
  | 'SEMICOLON'
  | 'DOT'
  // Special
  | 'EOF'
  | 'NEWLINE'
  | 'UNKNOWN';

export interface Token {
  type: TokenType;
  lexeme: string;
  value?: any;
  line: number;
  column: number;
  offset: number;
}

export interface SourceLocation {
  line: number;
  column: number;
  file?: string;
}

// AST Nodes
export type ASTNode =
  | ProgramNode
  | AppDeclNode
  | RunStmtNode
  | RespondStmtNode
  | VarDeclNode
  | AssignmentNode
  | FunctionDeclNode
  | IfStmtNode
  | WhileStmtNode
  | ForStmtNode
  | LoopStmtNode
  | ReturnStmtNode
  | BreakStmtNode
  | ContinueStmtNode
  | ExpressionStmtNode
  | ModelDeclNode
  | InsertStmtNode
  | FindStmtNode
  | RouteDeclNode
  | UIDeclNode
  | BinaryExprNode
  | UnaryExprNode
  | LiteralExprNode
  | IdentifierExprNode
  | CallExprNode
  | IndexExprNode
  | ArrayExprNode
  | DictExprNode;

export interface AppDeclNode {
  kind: 'AppDecl';
  name: string;
  loc: SourceLocation;
}

export interface RunStmtNode {
  kind: 'RunStmt';
  target: string;
  loc: SourceLocation;
}

export interface RespondStmtNode {
  kind: 'RespondStmt';
  value: ASTNode;
  loc: SourceLocation;
}

export interface ProgramNode {
  kind: 'Program';
  body: ASTNode[];
  loc: SourceLocation;
}

export interface VarDeclNode {
  kind: 'VarDecl';
  name: string;
  isMut: boolean;
  typeAnnotation?: string;
  init: ASTNode;
  loc: SourceLocation;
}

export interface AssignmentNode {
  kind: 'Assignment';
  target: ASTNode;
  value: ASTNode;
  operator: '=' | '+=' | '-=';
  loc: SourceLocation;
}

export interface FunctionDeclNode {
  kind: 'FunctionDecl';
  name: string;
  params: string[];
  body: ASTNode[];
  loc: SourceLocation;
}

export interface IfStmtNode {
  kind: 'IfStmt';
  condition: ASTNode;
  thenBranch: ASTNode[];
  elifBranches?: { condition: ASTNode; body: ASTNode[] }[];
  elseBranch?: ASTNode[];
  loc: SourceLocation;
}

export interface WhileStmtNode {
  kind: 'WhileStmt';
  condition: ASTNode;
  body: ASTNode[];
  loc: SourceLocation;
}

export interface ForStmtNode {
  kind: 'ForStmt';
  iterator: string;
  iterable: ASTNode;
  body: ASTNode[];
  loc: SourceLocation;
}

export interface LoopStmtNode {
  kind: 'LoopStmt';
  body: ASTNode[];
  loc: SourceLocation;
}

export interface ReturnStmtNode {
  kind: 'ReturnStmt';
  value?: ASTNode;
  loc: SourceLocation;
}

export interface BreakStmtNode {
  kind: 'BreakStmt';
  loc: SourceLocation;
}

export interface ContinueStmtNode {
  kind: 'ContinueStmt';
  loc: SourceLocation;
}

export interface ExpressionStmtNode {
  kind: 'ExpressionStmt';
  expression: ASTNode;
  loc: SourceLocation;
}

export interface ModelDeclNode {
  kind: 'ModelDecl';
  name: string;
  fields: { name: string; type: string }[];
  loc: SourceLocation;
}

export interface InsertStmtNode {
  kind: 'InsertStmt';
  model: string;
  data: Record<string, ASTNode>;
  loc: SourceLocation;
}

export interface FindStmtNode {
  kind: 'FindStmt';
  model: string;
  condition?: { field: string; op: string; value: ASTNode };
  targetVar?: string;
  loc: SourceLocation;
}

export interface RouteDeclNode {
  kind: 'RouteDecl';
  method: string;
  path: string;
  body: ASTNode[];
  loc: SourceLocation;
}

export interface UIDeclNode {
  kind: 'UIDecl';
  widget: string;
  props?: Record<string, any>;
  children?: UIDeclNode[];
  loc: SourceLocation;
}

export interface BinaryExprNode {
  kind: 'BinaryExpr';
  operator: string;
  left: ASTNode;
  right: ASTNode;
  loc: SourceLocation;
}

export interface UnaryExprNode {
  kind: 'UnaryExpr';
  operator: string;
  operand: ASTNode;
  loc: SourceLocation;
}

export interface LiteralExprNode {
  kind: 'LiteralExpr';
  value: any;
  rawType: 'number' | 'string' | 'boolean' | 'null';
  loc: SourceLocation;
}

export interface IdentifierExprNode {
  kind: 'IdentifierExpr';
  name: string;
  loc: SourceLocation;
}

export interface CallExprNode {
  kind: 'CallExpr';
  callee: ASTNode;
  args: ASTNode[];
  loc: SourceLocation;
}

export interface IndexExprNode {
  kind: 'IndexExpr';
  target: ASTNode;
  index: ASTNode;
  loc: SourceLocation;
}

export interface ArrayExprNode {
  kind: 'ArrayExpr';
  elements: ASTNode[];
  loc: SourceLocation;
}

export interface DictExprNode {
  kind: 'DictExpr';
  entries: { key: string; value: ASTNode }[];
  loc: SourceLocation;
}

// Bytecode OpCodes
export enum OpCode {
  OP_CONSTANT = 0,
  OP_LOAD_VAR = 1,
  OP_STORE_VAR = 2,
  OP_ADD = 3,
  OP_SUB = 4,
  OP_MUL = 5,
  OP_DIV = 6,
  OP_MOD = 7,
  OP_POW = 8,
  OP_NEG = 9,
  OP_NOT = 10,
  OP_EQ = 11,
  OP_NEQ = 12,
  OP_LT = 13,
  OP_LTE = 14,
  OP_GT = 15,
  OP_GTE = 16,
  OP_JUMP = 17,
  OP_JUMP_IF_FALSE = 18,
  OP_CALL = 19,
  OP_RETURN = 20,
  OP_PRINT = 21,
  OP_PRINTLN = 22,
  OP_BUILD_ARRAY = 23,
  OP_BUILD_DICT = 24,
  OP_INDEX_GET = 25,
  OP_INDEX_SET = 26,
  OP_MODEL_DEF = 27,
  OP_MODEL_INSERT = 28,
  OP_MODEL_FIND = 29,
  OP_ROUTE_DEF = 30,
  OP_UI_DEF = 31,
  OP_POP = 32,
  OP_HALT = 33,
  OP_APP_DEF = 34,
  OP_RUN_TARGET = 35,
  OP_RESPOND = 36,
  OP_AND = 37,
  OP_OR = 38,
}

export interface Instruction {
  op: OpCode;
  opName: string;
  arg?: any;
  line: number;
}

export interface BytecodeChunk {
  instructions: Instruction[];
  constants: any[];
  lines: number[];
  functions: Record<string, { params: string[]; chunk: BytecodeChunk }>;
  models: Record<string, { fields: { name: string; type: string }[] }>;
  routes: Record<string, { method: string; path: string; chunk: BytecodeChunk }>;
}

export interface ExecutionResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exitCode: number;
  durationMs: number;
  stepCount: number;
  gcStats: {
    allocatedCount: number;
    sweptCount: number;
    activeHeapObjects: number;
  };
  returnedValue?: any;
  databaseState?: Record<string, any[]>;
  registeredRoutes?: { method: string; path: string; chunk?: BytecodeChunk }[];
  uiTree?: any;
  appName?: string;
  mermaidGraph?: string;
  error?: {
    line: number;
    column: number;
    message: string;
    stage: 'lexer' | 'parser' | 'compiler' | 'runtime';
  };
}
