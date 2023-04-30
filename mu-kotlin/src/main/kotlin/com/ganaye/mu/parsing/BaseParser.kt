package com.ganaye.mu.parsing

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

    protected fun <T : ASTClass> clearTokenAndReturn(t: T): T {
        tokenizer.clearToken()
        return t
    }

}