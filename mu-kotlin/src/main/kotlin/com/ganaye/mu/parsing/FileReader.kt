package com.ganaye.mu.parsing


class FileReader(val file: ISourceFile) {
    var curChar: Char = EOF_CHAR
        private set
    protected var pos: Int = 0
    protected var line: Int = 1
    protected var column: Int = 1
    protected var source: String = file.content
    protected var length: Int = source.length

    init {
        setCurChar()
    }

    private fun setCurChar() {
        this.curChar = if (pos >= length) EOF_CHAR else source[pos]
    }

    fun nextChar(): Char {
        if (pos < length) {
            pos += 1
            when (curChar) {
                '\n' -> {
                    line += 1
                    column = 1
                }

                else -> {
                    // \r is considered as a normal character
                    column += 1
                }
            }
            setCurChar()
        }
        return curChar
    }

    fun peekChar(offset: Int =1): Char {
        return if (pos + offset >= length) EOF_CHAR else source[pos + offset]
    }

    fun getPos(): FilePos {
        return FilePos(file, line, column, pos)
    }

    fun tokenPosFrom(from: FilePos, toExclusive: FilePos? = null): TokenPos {
        return TokenPos(
            file,
            from.line,
            from.column,
            from.pos,
            (if (toExclusive != null) toExclusive.pos else this.pos) - from.pos
        )
    }

    fun isEof(): Boolean {
        return this.curChar == EOF_CHAR
    }

    fun rewind(filePos: FilePos) {
        this.pos = filePos.pos
        this.line = filePos.line
        this.column = filePos.column
        setCurChar()
    }

    fun skipSpaces() {
        while (this.curChar == ' ' || this.curChar == '\t') this.nextChar()
    }

    fun skipSpacesAndNewLines() {
        while (this.curChar == ' ' || this.curChar == '\t' || this.curChar == '\r' || this.curChar == '\n') this.nextChar()
    }

    companion object {
        const val EOF_CHAR = Char.MIN_VALUE
    }
}

open class FilePos(
    val file: ISourceFile,
    val line: Int,
    val column: Int,
    val pos: Int
) {
    fun lineColumnString(): Any {
        return "line ${line} column ${column} in ${file}"
    }
}
