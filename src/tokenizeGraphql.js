const State = {
  TopLevelContent: 1,
  AfterKeywordType: 2,
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
}

export const TokenMap = {
  [TokenType.Text]: 'Text',
  [TokenType.Comment]: 'Comment',
  [TokenType.Whitespace]: 'Whitespace',
  [TokenType.Keyword]: 'Keyword',
  [TokenType.Type]: 'Type',
}

export const initialLineState = {
  state: State.TopLevelContent,
  tokens: [],
}

const RE_LINE_COMMENT = /^#.*/s
const RE_ANYTHING = /^.+/s
const RE_KEYWORD = /^(?:type|scalar|enum)\b/
const RE_WHITESPACE = /^\s+/
const RE_VARIABLE_NAME = /^[a-zA-Z][a-zA-Z\d\_\-]*/

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
          state = State.TopLevelContent
        } else if ((next = part.match(RE_LINE_COMMENT))) {
          token = TokenType.Comment
          state = State.TopLevelContent
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
  return {
    state,
    tokens,
  }
}
