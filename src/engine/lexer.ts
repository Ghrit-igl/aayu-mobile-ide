/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * AAYU Lexer / Tokenizer
 * Performs lexical analysis on .aayu source code with precise line and column tracking.
 */

import { Token, TokenType } from './types';

const KEYWORDS: Record<string, TokenType> = {
  // Canonical AAYU Keywords
  action: 'ACTION',
  state: 'STATE',
  end: 'END',
  app: 'APP',
  run: 'RUN',
  respond: 'RESPOND',
  get: 'GET',
  post: 'POST',
  put: 'PUT',

  // Variable & function declarations
  let: 'LET',
  mut: 'MUT',
  const: 'CONST',
  fn: 'FN',
  func: 'FN',
  function: 'FN',
  return: 'RETURN',
  if: 'IF',
  elif: 'ELIF',
  else: 'ELSE',
  while: 'WHILE',
  for: 'FOR',
  in: 'IN',
  loop: 'LOOP',
  break: 'BREAK',
  continue: 'CONTINUE',
  true: 'TRUE',
  false: 'FALSE',
  null: 'NULL',
  none: 'NULL',
  print: 'PRINT',
  println: 'PRINTLN',
  import: 'IMPORT',
  as: 'AS',
  from: 'FROM',
  // Intent keywords
  model: 'MODEL',
  insert: 'INSERT',
  find: 'FIND',
  update: 'UPDATE',
  delete: 'DELETE',
  where: 'WHERE',
  route: 'ROUTE',
  Page: 'PAGE',
  page: 'PAGE',
  Column: 'COLUMN',
  column: 'COLUMN',
  Row: 'ROW',
  row: 'ROW',
  Stack: 'STACK',
  stack: 'STACK',
  Text: 'TEXT',
  text: 'TEXT',
  Button: 'BUTTON',
  button: 'BUTTON',
  Chart: 'CHART',
  chart: 'CHART',
  and: 'AND',
  or: 'OR',
  not: 'NOT',
};

export class LexerError extends Error {
  line: number;
  column: number;
  constructor(message: string, line: number, column: number) {
    super(`Lexer error at line ${line}, col ${column}: ${message}`);
    this.name = 'LexerError';
    this.line = line;
    this.column = column;
  }
}

export class Lexer {
  private source: string;
  private tokens: Token[] = [];
  private start = 0;
  private current = 0;
  private line = 1;
  private lineStart = 0;

  constructor(source: string) {
    this.source = source;
  }

  tokenize(): Token[] {
    this.tokens = [];
    this.start = 0;
    this.current = 0;
    this.line = 1;
    this.lineStart = 0;

    while (!this.isAtEnd()) {
      this.start = this.current;
      this.scanToken();
    }

    this.tokens.push({
      type: 'EOF',
      lexeme: '',
      line: this.line,
      column: this.current - this.lineStart + 1,
      offset: this.current,
    });

    return this.tokens;
  }

  private scanToken(): void {
    const c = this.advance();
    switch (c) {
      case '(':
        this.addToken('LPAREN');
        break;
      case ')':
        this.addToken('RPAREN');
        break;
      case '{':
        this.addToken('LBRACE');
        break;
      case '}':
        this.addToken('RBRACE');
        break;
      case '[':
        this.addToken('LBRACKET');
        break;
      case ']':
        this.addToken('RBRACKET');
        break;
      case ',':
        this.addToken('COMMA');
        break;
      case '.':
        this.addToken('DOT');
        break;
      case ';':
        this.addToken('SEMICOLON');
        break;
      case ':':
        this.addToken('COLON');
        break;
      case '+':
        if (this.match('=')) {
          this.addToken('PLUS_ASSIGN');
        } else {
          this.addToken('PLUS');
        }
        break;
      case '-':
        if (this.match('>')) {
          this.addToken('ARROW');
        } else if (this.match('=')) {
          this.addToken('MINUS_ASSIGN');
        } else {
          this.addToken('MINUS');
        }
        break;
      case '*':
        this.addToken('STAR');
        break;
      case '%':
        this.addToken('PERCENT');
        break;
      case '^':
        this.addToken('CARET');
        break;
      case '!':
        if (this.match('=')) {
          this.addToken('NEQ');
        } else {
          this.addToken('NOT');
        }
        break;
      case '=':
        if (this.match('=')) {
          this.addToken('EQ');
        } else {
          this.addToken('ASSIGN');
        }
        break;
      case '<':
        if (this.match('=')) {
          this.addToken('LTE');
        } else {
          this.addToken('LT');
        }
        break;
      case '>':
        if (this.match('=')) {
          this.addToken('GTE');
        } else {
          this.addToken('GT');
        }
        break;
      case '&':
        if (this.match('&')) {
          this.addToken('AND');
        } else {
          throw new LexerError("Unexpected character '&'. Did you mean '&&' or 'and'?", this.line, this.column());
        }
        break;
      case '|':
        if (this.match('|')) {
          this.addToken('OR');
        } else {
          throw new LexerError("Unexpected character '|'. Did you mean '||' or 'or'?", this.line, this.column());
        }
        break;
      case '/':
        if (this.match('/')) {
          // Line comment
          while (this.peek() !== '\n' && !this.isAtEnd()) {
            this.advance();
          }
        } else if (this.match('*')) {
          // Block comment
          while (!(this.peek() === '*' && this.peekNext() === '/') && !this.isAtEnd()) {
            if (this.peek() === '\n') {
              this.line++;
              this.lineStart = this.current + 1;
            }
            this.advance();
          }
          if (this.isAtEnd()) {
            throw new LexerError('Unterminated block comment', this.line, this.column());
          }
          this.advance(); // consume '*'
          this.advance(); // consume '/'
        } else {
          this.addToken('SLASH');
        }
        break;
      case '#':
        // Python-style single line comment
        while (this.peek() !== '\n' && !this.isAtEnd()) {
          this.advance();
        }
        break;
      case ' ':
      case '\r':
      case '\t':
        // Ignore whitespace
        break;
      case '\n':
        this.line++;
        this.lineStart = this.current;
        break;
      case '"':
      case "'":
        this.string(c);
        break;
      default:
        if (this.isDigit(c)) {
          this.number();
        } else if (this.isAlpha(c)) {
          this.identifier();
        } else {
          throw new LexerError(`Unexpected character '${c}'`, this.line, this.column());
        }
        break;
    }
  }

  private identifier(): void {
    while (this.isAlphaNumeric(this.peek())) {
      this.advance();
    }

    const text = this.source.substring(this.start, this.current);
    const type = KEYWORDS[text] || 'IDENTIFIER';
    let value: any = text;

    if (type === 'TRUE') value = true;
    else if (type === 'FALSE') value = false;
    else if (type === 'NULL') value = null;

    this.addToken(type, value);
  }

  private number(): void {
    while (this.isDigit(this.peek())) {
      this.advance();
    }

    // Look for fractional part
    if (this.peek() === '.' && this.isDigit(this.peekNext())) {
      this.advance(); // consume '.'
      while (this.isDigit(this.peek())) {
        this.advance();
      }
    }

    const text = this.source.substring(this.start, this.current);
    const value = parseFloat(text);
    this.addToken('NUMBER', value);
  }

  private string(quoteChar: string): void {
    let result = '';
    while (this.peek() !== quoteChar && !this.isAtEnd()) {
      if (this.peek() === '\n') {
        this.line++;
        this.lineStart = this.current + 1;
      }
      if (this.peek() === '\\') {
        this.advance(); // skip backslash
        const escaped = this.advance();
        switch (escaped) {
          case 'n':
            result += '\n';
            break;
          case 't':
            result += '\t';
            break;
          case 'r':
            result += '\r';
            break;
          case '"':
            result += '"';
            break;
          case "'":
            result += "'";
            break;
          case '\\':
            result += '\\';
            break;
          default:
            result += escaped;
        }
      } else {
        result += this.advance();
      }
    }

    if (this.isAtEnd()) {
      throw new LexerError('Unterminated string literal', this.line, this.column());
    }

    this.advance(); // Consume closing quote
    this.addToken('STRING', result);
  }

  private match(expected: string): boolean {
    if (this.isAtEnd()) return false;
    if (this.source.charAt(this.current) !== expected) return false;
    this.current++;
    return true;
  }

  private peek(): string {
    if (this.isAtEnd()) return '\0';
    return this.source.charAt(this.current);
  }

  private peekNext(): string {
    if (this.current + 1 >= this.source.length) return '\0';
    return this.source.charAt(this.current + 1);
  }

  private advance(): string {
    return this.source.charAt(this.current++);
  }

  private isDigit(c: string): boolean {
    return c >= '0' && c <= '9';
  }

  private isAlpha(c: string): boolean {
    return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c === '_';
  }

  private isAlphaNumeric(c: string): boolean {
    return this.isAlpha(c) || this.isDigit(c);
  }

  private isAtEnd(): boolean {
    return this.current >= this.source.length;
  }

  private column(): number {
    return this.start - this.lineStart + 1;
  }

  private addToken(type: TokenType, value?: any): void {
    const lexeme = this.source.substring(this.start, this.current);
    this.tokens.push({
      type,
      lexeme,
      value: value !== undefined ? value : lexeme,
      line: this.line,
      column: this.column(),
      offset: this.start,
    });
  }
}
