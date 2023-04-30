package com.ganaye.mu

import com.ganaye.mu.parsing.script.Operator
import com.ganaye.mu.parsing.script.ScriptToken
import com.ganaye.mu.parsing.script.ScriptTokenizer
import com.ganaye.mu.parsing.SourceFile
import com.ganaye.mu.parsing.FileReader
import org.junit.jupiter.api.Test

import org.junit.jupiter.api.Assertions.*

class ScriptTokenizerTest {

    fun getTokenizer(source: String): ScriptTokenizer {
        return ScriptTokenizer(FileReader(SourceFile("/test", source)))
    }

    @Test
    fun `hello world identifiers`() {
        with(getTokenizer("hello world")) {
            withNextToken<ScriptToken.Identifier> { assertEquals("hello", identifier) }
            withNextToken<ScriptToken.Identifier> { assertEquals("world", identifier) }
        }
    }

    @Test
    fun `parse numbers`() {
        with(getTokenizer("12.34")) {
            withNextToken<ScriptToken.Number> { assertEquals(12.34, value) }
        }
    }

    @Test
    fun `parse operators`() {
        with(getTokenizer(" + - ")) {
            withNextToken<ScriptToken.OpToken> { assertEquals(Operator.plus, operator) }
            withNextToken<ScriptToken.OpToken> { assertEquals(Operator.sub, operator) }
        }
    }

    @Test
    fun `parse method calls`() {
        with(getTokenizer("\"abcde\".substring(2,4)"))
        {
            withNextToken<ScriptToken.StringLiteral> { assertEquals("abcde", value) }
            withNextToken<ScriptToken.OpToken> { assertEquals(Operator.dot, operator) }
            withNextToken<ScriptToken.Identifier> { assertEquals("substring", identifier) }
            withNextToken<ScriptToken.OpToken> { assertEquals(Operator.open_parenthesis, operator) }
            withNextToken<ScriptToken.Number> { assertEquals(2.0, value) }
            withNextToken<ScriptToken.OpToken> { assertEquals(Operator.comma, operator) }
            withNextToken<ScriptToken.Number> { assertEquals(4.0, value) }
            withNextToken<ScriptToken.OpToken> { assertEquals(Operator.close_parenthesis, operator) }
            withNextToken<ScriptToken.Eof> { }
        }
    }

}

@Suppress("UNCHECKED_CAST")
fun <T> ScriptTokenizer.withNextToken(action: T.() -> Unit) = action(this.nextToken() as T)