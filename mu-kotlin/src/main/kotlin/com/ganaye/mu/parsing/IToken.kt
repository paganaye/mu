package com.ganaye.mu.parsing


interface IToken {
    val pos: TokenPos
}


class TokenPos(
    file: ISourceFile,
    line: Int,
    column: Int,
    pos: Int,
    val length: Int
) : FilePos(file, line, column, pos) {

}
