package com.ganaye.mu.parsing

import com.ganaye.mu.parsing.script.Operator

abstract class BaseParser<Token : IToken, ASTClass>(
    protected val context: Context,
    val tokenizer: Tokenizer<Token>
) {
    val fileReader: FileReader = context.fileReader

    val curToken: Token
        get() = tokenizer.curToken

    fun nextToken(): Token {
        return tokenizer.nextToken()
    }

    protected fun <T : ASTClass> consumeAndReturn(t: T): T {
        this.nextToken()
        return t
    }

}