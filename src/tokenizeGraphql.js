const State = {
  TopLevelContent: 1,
  AfterKeywordTypeOrInput: 2,
  AfterTypeName: 3,
  InsideTypeObject: 4,
  InsideFunctionParameters: 6,
  BeforeType: 7,
  InsideDoubleQuoteString: 8,
  AfterKeywordScalarOrUnion: 9,
  AfterKeywordEnum: 10,
  InsideEnum: 11,
  InsideTripleDoubleQuoteString: 12,
}

/**
 * @enum number
 */
export const TokenType = {
  None: 0,
  Text: 1,
  Comment: 2,
  Whitespace: 3,
  Keyword: 4,
  Type: 5,
  Punctuation: 6,
  VariableName: 7,
  Function: 8,
  Numeric: 9,
  String: 10,
}

export const TokenMap = {
  [TokenType.Text]: 'Text',
  [TokenType.Comment]: 'Comment',
  [TokenType.Whitespace]: 'Whitespace',
  [TokenType.Keyword]: 'Keyword',
  [TokenType.Type]: 'Type',
  [TokenType.Punctuation]: 'Punctuation',
  [TokenType.VariableName]: 'VariableName',
  [TokenType.Function]: 'Function',
  [TokenType.Numeric]: 'Numeric',
  [TokenType.String]: 'String',
}

export const initialLineState = {
  state: State.TopLevelContent,
  stack: [],
  tokens: [],
}

const RE_LINE_COMMENT = /^#.*/s
const RE_ANYTHING = /^.+/s
const RE_KEYWORD = /^(?:type|scalar|enum|input|union)\b/
const RE_WHITESPACE = /^\s+/
const RE_VARIABLE_NAME = /^[a-zA-Z\_][a-zA-Z\d\_\-]*/
const RE_DECORATOR = /^@\w+/
const RE_CURLY_OPEN = /^\{/
const RE_ROUND_OPEN = /^\(/
const RE_ROUND_CLOSE = /^\)/
const RE_CURLY_CLOSE = /^\}/
const RE_COLON = /^\:/
const RE_FUNCTION_CALL_NAME = /^[\w]+(?=\s*\()/
const RE_EXCLAMATION_MARK = /^\!/
const RE_SQUARE_OPEN = /^\[/
const RE_SQUARE_CLOSE = /^\]/
const RE_EQUAL_SIGN = /^=/
const RE_COMMA = /^,/
const RE_NUMERIC = /^\d+/
const RE_QUOTE_DOUBLE = /^"/
const RE_STRING_DOUBLE_QUOTE_CONTENT = /^[^"\\]+/
const RE_STRING_ESCAPE = /^\\./
const RE_BACKSLASH = /^\\/
const RE_PIPE = /^\|/
const RE_DOUBLE_QUOTE = /^"/
const RE_TRIPLE_QUOTED_STRING_CONTENT_DOUBLE_QUOTES = /.*(?=""")/s
const RE_TRIPLE_QUOTED_STRING_CONTENT_COMMON = /.*/s
const RE_TRIPLE_DOUBLE_QUOTE = /^"{3}/
const RE_AMPERSAND = /^\&/

export const hasArrayReturn = true

/**
 * @param {string} line
 * @param {any} lineState
 */
export const tokenizeLine = (line, lineState) => {
  let next = null
  let index = 0
  let tokens = []
  let token = TokenType.None
  let state = lineState.state
  let stack = [...lineState.stack]
  while (index < line.length) {
    const part = line.slice(index)
    switch (state) {
      case State.TopLevelContent:
        if ((next = part.match(RE_WHITESPACE))) {
          token = TokenType.Whitespace
          state = State.TopLevelContent
        } else if ((next = part.match(RE_KEYWORD))) {
          token = TokenType.Keyword
          state = State.TopLevelContent
          switch (next[0]) {
            case 'type':
            case 'input':
              state = State.AfterKeywordTypeOrInput
              break
            case 'scalar':
            case 'union':
              state = State.AfterKeywordScalarOrUnion

              break
            case 'enum':
              state = State.AfterKeywordEnum
              break
            default:
              break
          }
        } else if ((next = part.match(RE_LINE_COMMENT))) {
          token = TokenType.Comment
          state = State.TopLevelContent
        } else if ((next = part.match(RE_TRIPLE_DOUBLE_QUOTE))) {
          token = TokenType.Punctuation
          state = State.InsideTripleDoubleQuoteString
          stack.push(State.TopLevelContent)
        } else if ((next = part.match(RE_ANYTHING))) {
          token = TokenType.Text
          state = State.TopLevelContent
        } else {
          part //?
          throw new Error('no')
        }
        break
      case State.AfterKeywordTypeOrInput:
        if ((next = part.match(RE_WHITESPACE))) {
          token = TokenType.Whitespace
          state = State.AfterKeywordTypeOrInput
        } else if ((next = part.match(RE_VARIABLE_NAME))) {
          token = TokenType.Type
          state = State.AfterTypeName
        } else if ((next = part.match(RE_LINE_COMMENT))) {
          token = TokenType.Comment
          state = State.TopLevelContent
        } else if ((next = part.match(RE_DECORATOR))) {
          token = TokenType.VariableName
          state = State.AfterKeywordTypeOrInput
        } else if ((next = part.match(RE_CURLY_OPEN))) {
          token = TokenType.Punctuation
          state = State.InsideTypeObject
        } else {
          part
          throw new Error('no')
        }
        break
      case State.AfterTypeName:
        if ((next = part.match(RE_WHITESPACE))) {
          token = TokenType.Whitespace
          state = State.AfterTypeName
        } else if ((next = part.match(RE_CURLY_OPEN))) {
          token = TokenType.Punctuation
          state = State.InsideTypeObject
        } else if ((next = part.match(RE_VARIABLE_NAME))) {
          token = TokenType.VariableName
          state = State.AfterTypeName
        } else if ((next = part.match(RE_DECORATOR))) {
          token = TokenType.VariableName
          state = State.AfterTypeName
        } else if ((next = part.match(RE_AMPERSAND))) {
          token = TokenType.Punctuation
          state = State.AfterTypeName
        } else if ((next = part.match(RE_ROUND_OPEN))) {
          token = TokenType.Punctuation
          state = State.InsideFunctionParameters
          stack.push(State.AfterTypeName)
        } else if ((next = part.match(RE_EQUAL_SIGN))) {
          token = TokenType.Punctuation
          state = State.AfterTypeName
        } else {
          part
          throw new Error('no')
        }
        break
      case State.InsideTypeObject:
        if ((next = part.match(RE_WHITESPACE))) {
          token = TokenType.Whitespace
          state = State.InsideTypeObject
        } else if ((next = part.match(RE_FUNCTION_CALL_NAME))) {
          token = TokenType.Function
          state = State.InsideTypeObject
        } else if ((next = part.match(RE_VARIABLE_NAME))) {
          token = TokenType.VariableName
          state = State.InsideTypeObject
        } else if ((next = part.match(RE_COLON))) {
          token = TokenType.Punctuation
          state = State.BeforeType
        } else if ((next = part.match(RE_ROUND_OPEN))) {
          token = TokenType.Punctuation
          stack.push(State.InsideTypeObject)
          state = State.InsideFunctionParameters
        } else if ((next = part.match(RE_CURLY_CLOSE))) {
          stack.pop()
          token = TokenType.Punctuation
          state = State.TopLevelContent
        } else if ((next = part.match(RE_TRIPLE_DOUBLE_QUOTE))) {
          token = TokenType.Punctuation
          state = State.InsideTripleDoubleQuoteString
          stack.push(State.InsideTypeObject)
        } else if ((next = part.match(RE_LINE_COMMENT))) {
          token = TokenType.Comment
          state = State.InsideTypeObject
        } else if ((next = part.match(RE_ROUND_CLOSE))) {
          token = TokenType.Punctuation
          state = State.InsideTypeObject
        } else if ((next = part.match(RE_CURLY_OPEN))) {
          token = TokenType.Punctuation
          state = State.InsideTypeObject
          stack.push(State.InsideTypeObject)
        } else if ((next = part.match(RE_COMMA))) {
          token = TokenType.Punctuation
          state = State.BeforeType
        } else {
          part
          throw new Error('no')
        }
        break
      case State.InsideFunctionParameters:
        if ((next = part.match(RE_WHITESPACE))) {
          token = TokenType.Whitespace
          state = State.InsideFunctionParameters
        } else if ((next = part.match(RE_VARIABLE_NAME))) {
          token = TokenType.VariableName
          state = State.InsideFunctionParameters
        } else if ((next = part.match(RE_COLON))) {
          token = TokenType.Punctuation
          state = State.BeforeType
          stack.push(State.InsideFunctionParameters)
        } else if ((next = part.match(RE_ROUND_CLOSE))) {
          token = TokenType.Punctuation
          state = stack.pop() || State.TopLevelContent
        } else if ((next = part.match(RE_CURLY_CLOSE))) {
          token = TokenType.Punctuation
          state = stack.pop() || State.TopLevelContent
        } else if ((next = part.match(RE_TRIPLE_DOUBLE_QUOTE))) {
          token = TokenType.Punctuation
          state = State.InsideTripleDoubleQuoteString
          stack.push(State.InsideTypeObject)
        } else if ((next = part.match(RE_COMMA))) {
          token = TokenType.Punctuation
          state = State.InsideFunctionParameters
        } else if ((next = part.match(RE_LINE_COMMENT))) {
          token = TokenType.Comment
          state = State.InsideFunctionParameters
        } else if ((next = part.match(RE_SQUARE_CLOSE))) {
          token = TokenType.Punctuation
          state = State.InsideFunctionParameters
        } else if ((next = part.match(RE_DOUBLE_QUOTE))) {
          token = TokenType.Punctuation
          state = State.InsideDoubleQuoteString
          stack.push(State.InsideFunctionParameters)
        } else {
          part
          throw new Error('no')
        }
        break
      case State.BeforeType:
        if ((next = part.match(RE_WHITESPACE))) {
          token = TokenType.Whitespace
          state = State.BeforeType
        } else if ((next = part.match(RE_VARIABLE_NAME))) {
          token = TokenType.Type
          state = State.BeforeType
        } else if ((next = part.match(RE_ROUND_CLOSE))) {
          token = TokenType.Punctuation
          state = stack.pop() || State.TopLevelContent
        } else if ((next = part.match(RE_EXCLAMATION_MARK))) {
          token = TokenType.Punctuation
          state = State.BeforeType
        } else if ((next = part.match(RE_LINE_COMMENT))) {
          token = TokenType.Comment
          state = State.BeforeType
        } else if ((next = part.match(RE_SQUARE_OPEN))) {
          token = TokenType.Punctuation
          state = State.BeforeType
        } else if ((next = part.match(RE_SQUARE_CLOSE))) {
          token = TokenType.Punctuation
          state = State.BeforeType
        } else if ((next = part.match(RE_EQUAL_SIGN))) {
          token = TokenType.Punctuation
          state = State.BeforeType
        } else if ((next = part.match(RE_COMMA))) {
          token = TokenType.Punctuation
          state = State.BeforeType
        } else if ((next = part.match(RE_COLON))) {
          token = TokenType.Punctuation
          state = State.BeforeType
        } else if ((next = part.match(RE_NUMERIC))) {
          token = TokenType.Numeric
          state = State.BeforeType
        } else if ((next = part.match(RE_QUOTE_DOUBLE))) {
          token = TokenType.Punctuation
          state = State.InsideDoubleQuoteString
        } else if ((next = part.match(RE_DECORATOR))) {
          token = TokenType.VariableName
          state = State.BeforeType
        } else if ((next = part.match(RE_ROUND_OPEN))) {
          token = TokenType.Punctuation
          state = State.InsideFunctionParameters
          stack.push(State.BeforeType)
        } else {
          part
          throw new Error('no')
        }
        break
      case State.InsideDoubleQuoteString:
        if ((next = part.match(RE_QUOTE_DOUBLE))) {
          token = TokenType.Punctuation
          state = stack.pop() || State.TopLevelContent
        } else if ((next = part.match(RE_STRING_DOUBLE_QUOTE_CONTENT))) {
          token = TokenType.String
          state = State.InsideDoubleQuoteString
        } else if ((next = part.match(RE_STRING_ESCAPE))) {
          token = TokenType.String
          state = State.InsideDoubleQuoteString
        } else if ((next = part.match(RE_BACKSLASH))) {
          token = TokenType.String
          state = State.InsideDoubleQuoteString
        } else {
          throw new Error('no')
        }
        break
      case State.AfterKeywordScalarOrUnion:
        if ((next = part.match(RE_WHITESPACE))) {
          token = TokenType.Whitespace
          state = State.AfterKeywordScalarOrUnion
        } else if ((next = part.match(RE_VARIABLE_NAME))) {
          token = TokenType.Type
          state = State.AfterKeywordScalarOrUnion
        } else if ((next = part.match(RE_LINE_COMMENT))) {
          token = TokenType.Comment
          state = State.TopLevelContent
        } else if ((next = part.match(RE_EQUAL_SIGN))) {
          token = TokenType.Punctuation
          state = State.AfterKeywordScalarOrUnion
        } else if ((next = part.match(RE_PIPE))) {
          token = TokenType.Punctuation
          state = State.AfterKeywordScalarOrUnion
        } else if ((next = part.match(RE_DECORATOR))) {
          token = TokenType.VariableName
          state = State.AfterKeywordScalarOrUnion
        } else if ((next = part.match(RE_ROUND_OPEN))) {
          token = TokenType.Punctuation
          state = State.InsideFunctionParameters
          stack.push(State.AfterKeywordScalarOrUnion)
        } else if ((next = part.match(RE_ROUND_CLOSE))) {
          token = TokenType.Punctuation
          state = State.AfterKeywordScalarOrUnion
        } else {
          part
          throw new Error('no')
        }
        break
      case State.AfterKeywordEnum:
        if ((next = part.match(RE_WHITESPACE))) {
          token = TokenType.Whitespace
          state = State.AfterKeywordEnum
        } else if ((next = part.match(RE_VARIABLE_NAME))) {
          token = TokenType.Type
          state = State.AfterKeywordEnum
        } else if ((next = part.match(RE_CURLY_OPEN))) {
          token = TokenType.Punctuation
          state = State.InsideEnum
        } else if ((next = part.match(RE_LINE_COMMENT))) {
          token = TokenType.Comment
          state = State.AfterKeywordEnum
        } else {
          throw new Error('no')
        }
        break
      case State.InsideEnum:
        if ((next = part.match(RE_WHITESPACE))) {
          token = TokenType.Whitespace
          state = State.InsideEnum
        } else if ((next = part.match(RE_VARIABLE_NAME))) {
          token = TokenType.VariableName
          state = State.InsideEnum
        } else if ((next = part.match(RE_CURLY_CLOSE))) {
          token = TokenType.Punctuation
          state = State.TopLevelContent
        } else if ((next = part.match(RE_LINE_COMMENT))) {
          token = TokenType.Comment
          state = State.InsideEnum
        } else {
          throw new Error('no')
        }
        break
      case State.InsideTripleDoubleQuoteString:
        if ((next = part.match(RE_TRIPLE_DOUBLE_QUOTE))) {
          token = TokenType.Punctuation
          state = stack.pop() || State.TopLevelContent
        } else if (
          (next = part.match(RE_TRIPLE_QUOTED_STRING_CONTENT_DOUBLE_QUOTES))
        ) {
          token = TokenType.String
          state = State.InsideTripleDoubleQuoteString
        } else if (
          (next = part.match(RE_TRIPLE_QUOTED_STRING_CONTENT_COMMON))
        ) {
          token = TokenType.String
          state = State.InsideTripleDoubleQuoteString
        } else {
          throw new Error('no')
        }
        break
      default:
        throw new Error('no')
    }
    const tokenLength = next[0].length
    index += tokenLength
    tokens.push(token, tokenLength)
  }
  if (state === State.BeforeType) {
    state = State.InsideTypeObject
  }
  if (state === State.AfterKeywordScalarOrUnion) {
    state = State.TopLevelContent
  }
  return {
    state,
    stack,
    tokens,
  }
}
