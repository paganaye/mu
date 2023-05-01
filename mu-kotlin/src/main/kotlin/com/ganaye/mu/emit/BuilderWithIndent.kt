package com.ganaye.mu.emit

open class BuilderWithIndent(var indentSize: Int) {
    private val sb = StringBuilder()
    private val strings = mutableListOf<String>()
    private var indentValue = 0

    protected fun flush() {
        if (strings.size > 0) {
            // sb.append("/*before-flush-${this.javaClass.name}*/")
            sb.append(" ".repeat(indentValue * 2));
            strings.forEach { sb.append(it) }
            strings.clear()
            // sb.append("/*after-flush-${this.javaClass.name}*/")
        }
    }

    protected fun appendString(s: String) {
        strings.add(s);
    }

    fun indent() {
        indentValue += 1
    }

    fun unindent() {
        if (indentValue > 0) indentValue -= 1
    }

    fun asSingleString(): String {
        flush()
        val result = sb.toString()
        if (result.indexOf("\n") >= 0) {
            throw InternalError("asSingleString does not allow multiple lines.")
        }
        return result;
    }

    override fun toString(): String {
        flush()
        return sb.toString()
    }

    fun rewind(s: String) {
        if (strings.lastOrNull() == s) {
            strings.removeLast()
        } else if (sb.endsWith(s)) {
            sb.setLength(sb.length - s.length)
        }
    }
}