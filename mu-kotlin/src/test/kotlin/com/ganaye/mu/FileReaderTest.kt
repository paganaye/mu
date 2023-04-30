package com.ganaye.mu

import com.ganaye.mu.parsing.FileReader
import com.ganaye.mu.parsing.SourceFile
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.Assertions.*

class FileReaderTest {
    @Test
    fun emptySource() {
        val fileReader = FileReader(SourceFile("/test", ""))
        assertEquals(Char.MIN_VALUE, fileReader.curChar)
        assertEquals(true, fileReader.isEof())
        val initialPos = fileReader.getPos()
        assertEquals(0, initialPos.pos)
        assertEquals(1, initialPos.line)
        assertEquals(1, initialPos.column)
    }

    @Test
    fun twoCharsSource() {
        val fileReader = FileReader(SourceFile("/test", "ab"))
        assertEquals('a', fileReader.curChar)
        assertEquals(false, fileReader.isEof())
        val aPos = fileReader.getPos()
        assertEquals(0, aPos.pos)
        assertEquals(1, aPos.line)
        assertEquals(1, aPos.column)

        fileReader.nextChar()
        assertEquals('b', fileReader.curChar)
        assertEquals(false, fileReader.isEof())
        val bPos = fileReader.getPos()
        assertEquals(1, bPos.pos)
        assertEquals(1, bPos.line)
        assertEquals(2, bPos.column)

        fileReader.nextChar()
        assertEquals(Char.MIN_VALUE, fileReader.curChar)
        assertEquals(true, fileReader.isEof())
        val eofPos = fileReader.getPos()
        assertEquals(2, eofPos.pos)
        assertEquals(1, eofPos.line)
        assertEquals(3, eofPos.column)
    }

    @Test
    fun twoLinesSourceWithCr() {
        val fileReader = FileReader(SourceFile("/test", "a\nb"))
        assertEquals('a', fileReader.curChar)
        assertEquals(false, fileReader.isEof())
        val aPos = fileReader.getPos()
        assertEquals(0, aPos.pos)
        assertEquals(1, aPos.line)
        assertEquals(1, aPos.column)

        fileReader.nextChar()
        assertEquals('\n', fileReader.curChar)
        assertEquals(false, fileReader.isEof())
        val lfPos = fileReader.getPos()
        assertEquals(1, lfPos.pos)
        assertEquals(1, lfPos.line)
        assertEquals(2, lfPos.column)

        fileReader.nextChar()
        assertEquals('b', fileReader.curChar)
        assertEquals(false, fileReader.isEof())
        val bPos = fileReader.getPos()
        assertEquals(2, bPos.pos)
        assertEquals(2, bPos.line)
        assertEquals(1, bPos.column)

        fileReader.nextChar()
        assertEquals(Char.MIN_VALUE, fileReader.curChar)
        assertEquals(true, fileReader.isEof())
        val eofPos = fileReader.getPos()
        assertEquals(3, eofPos.pos)
        assertEquals(2, eofPos.line)
        assertEquals(2, eofPos.column)
    }

    @Test
    fun twoLinesSourceWithCrLf() {
        val fileReader = FileReader(SourceFile("/test", "a\r\nb"))
        assertEquals('a', fileReader.curChar)
        assertEquals(false, fileReader.isEof())
        val aPos = fileReader.getPos()
        assertEquals(0, aPos.pos)
        assertEquals(1, aPos.line)
        assertEquals(1, aPos.column)

        fileReader.nextChar()
        assertEquals('\r', fileReader.curChar)
        assertEquals(false, fileReader.isEof())
        val crPos = fileReader.getPos()
        assertEquals(1, crPos.pos)
        assertEquals(1, crPos.line)
        assertEquals(2, crPos.column)

        fileReader.nextChar()
        assertEquals('\n', fileReader.curChar)
        assertEquals(false, fileReader.isEof())
        val lfPos = fileReader.getPos()
        assertEquals(2, lfPos.pos)
        assertEquals(1, lfPos.line)
        assertEquals(3, lfPos.column)

        fileReader.nextChar()
        assertEquals('b', fileReader.curChar)
        assertEquals(false, fileReader.isEof())
        val bPos = fileReader.getPos()
        assertEquals(3, bPos.pos)
        assertEquals(2, bPos.line)
        assertEquals(1, bPos.column)

        fileReader.nextChar()
        assertEquals(Char.MIN_VALUE, fileReader.curChar)
        assertEquals(true, fileReader.isEof())
        val eofPos = fileReader.getPos()
        assertEquals(4, eofPos.pos)
        assertEquals(2, eofPos.line)
        assertEquals(2, eofPos.column)
    }
}