package com.ganaye.mu.emit

open class BuilderWithIndent(var indentSize: Int) {
    private val sb = StringBuilder()
    private val stringFragments = mutableListOf<String>()
    private var indentValue = 0

    protected fun flush() {
        if (stringFragments.size > 0) {
            val line = stringFragments.joinToString(separator = "")
            sb.append(" ".repeat(indentValue * 2) + line)
            stringFragments.clear()
        }
    }

    protected fun appendString(s: String) {
        stringFragments.add(s);
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
}