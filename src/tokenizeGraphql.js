const State = {
  TopLevelContent: 1,
  AfterKeywordType: 2,
  AfterTypeName: 3,
  InsideTypeObject: 4,
  InsideFunctionParameters: 6,
  BeforeType: 7,
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
}

export const initialLineState = {
  state: State.TopLevelContent,
  stack: [],
  tokens: [],
}

const RE_LINE_COMMENT = /^#.*/s
const RE_ANYTHING = /^.+/s
const RE_KEYWORD = /^(?:type|scalar|enum)\b/
const RE_WHITESPACE = /^\s+/
const RE_VARIABLE_NAME = /^[a-zA-Z][a-zA-Z\d\_\-]*/
const RE_CURLY_OPEN = /^\{/
const RE_ROUND_OPEN = /^\(/
const RE_ROUND_CLOSE = /^\)/
const RE_CURLY_CLOSE = /^\}/
const RE_COLON = /^\:/
const RE_FUNCTION_CALL_NAME = /^[\w]+(?=\s*\()/
const RE_EXCLAMATION_MARK = /^\!/
const RE_SQUARE_OPEN = /^\[/
const RE_SQUARE_CLOSE = /^\]/

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
              state = State.AfterKeywordType
              break
            default:
              break
          }
        } else if ((next = part.match(RE_LINE_COMMENT))) {
          token = TokenType.Comment
          state = State.TopLevelContent
        } else if ((next = part.match(RE_ANYTHING))) {
          token = TokenType.Text
          state = State.TopLevelContent
        } else {
          part //?
          throw new Error('no')
        }
        break
      case State.AfterKeywordType:
        if ((next = part.match(RE_WHITESPACE))) {
          token = TokenType.Whitespace
          state = State.AfterKeywordType
        } else if ((next = part.match(RE_VARIABLE_NAME))) {
          token = TokenType.Type
          state = State.AfterTypeName
        } else if ((next = part.match(RE_LINE_COMMENT))) {
          token = TokenType.Comment
          state = State.TopLevelContent
        } else {
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
        } else {
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
          token = TokenType.Punctuation
          state = stack.pop() || State.TopLevelContent
        } else if ((next = part.match(RE_LINE_COMMENT))) {
          token = TokenType.Comment
          state = State.InsideTypeObject
        } else if ((next = part.match(RE_ROUND_CLOSE))) {
          token = TokenType.Punctuation
          state = State.InsideTypeObject
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
        } else if ((next = part.match(RE_ROUND_CLOSE))) {
          token = TokenType.Punctuation
          state = stack.pop() || State.TopLevelContent
        } else if ((next = part.match(RE_CURLY_CLOSE))) {
          token = TokenType.Punctuation
          state = stack.pop() || State.TopLevelContent
        } else if ((next = part.match(RE_LINE_COMMENT))) {
          token = TokenType.Comment
          state = State.InsideFunctionParameters
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
        } else {
          part
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
  return {
    state,
    stack,
    tokens,
  }
}
