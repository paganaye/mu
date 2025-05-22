package com.ganaye.mu.emit

import java.util.*

open class BuilderWithIndent(var indentSize: Int) {
    private val sb = StringBuilder()
    private val strings = LinkedList<String>()
    private var startingIndent = 0
    private var indentValue = 0
    protected val SpacesPerIndent = 2
    protected fun flush() {
        if (strings.size > 0) {
            // sb.append("/*before-flush-${this.javaClass.name}*/")
            sb.append(" ".repeat(startingIndent * SpacesPerIndent));
            strings.forEach { sb.append(it) }
            strings.clear()
            // sb.append("/*after-flush-${this.javaClass.name}*/")
        }
    }

    protected fun appendString(s: String) {
        if (strings.size == 0) {
            startingIndent = indentValue
        }
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

    fun breakLongLine() {
        val lineWidth = SpacesPerIndent * startingIndent + strings.sumOf { it.length }
        if (lineWidth > 100) {
            appendString("\n")
            flush()
        }
    }
}