package com.ganaye.mu.parsing

interface ITokenizer<Token : IToken> {
    fun nextToken(): Token
}

