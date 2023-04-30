package com.ganaye.mu.parsing

class Tokenizer<Token : IToken>(val iTokenizer: ITokenizer<Token>) {
    private var _curToken: Token? = null
    val curToken: Token
        get() = _curToken ?: nextToken()

    fun nextToken(): Token {
        val newToken = iTokenizer.nextToken()
        _curToken = newToken
        return newToken
    }

    fun consumeToken() {
        this._curToken = null
    }
}