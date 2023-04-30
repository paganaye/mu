package com.ganaye.mu.parsing

interface IParserAST {

}

interface IParser<Token : IToken> {
    fun parse(tokenizer: ITokenizer<Token>): IParserAST
}

open class ParserException(val error: String, val pos: FilePos) : Exception(error + " at " + pos.lineColumnString())
class UnexpectedToken(val curToken: IToken, where: String) :
    ParserException("Invalid token $curToken$where.", curToken.pos)
