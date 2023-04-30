package com.ganaye.mu

import com.ganaye.mu.parsing.Context
import com.ganaye.mu.parsing.SourceFile
import com.ganaye.mu.runtime.Runtime
import org.junit.jupiter.api.Test

import org.junit.jupiter.api.Assertions.*

class ExprParserTest {
    fun toJSExpr(source: String, reactive: Boolean = false): String {
        val context = Context(SourceFile("/test", source))
        val ast = context.exprParser.parseExpr()
        val output = StringBuilder()
        Runtime.toJs(ast, output, reactive)
        return output.toString()
    }

    @Test
    fun parseConstrExpr() {
        val source = "1+2*3"
        assertEquals("7.0", toJSExpr(source))
        assertEquals("7.0", toJSExpr(source, reactive = true))
    }

    @Test
    fun parseSimpleExpr() {
        val source = "a*2"
        assertEquals("a*2.0", toJSExpr(source))
        assertEquals("mu.mul(a,2.0)", toJSExpr(source, reactive = true))
    }

    @Test
    fun parseExprWithPriority() {
        val source = "a+b*c"
        assertEquals("a+b*c", toJSExpr(source))
        assertEquals("mu.plus(a,mu.mul(b,c))", toJSExpr(source, reactive = true))
    }

    @Test
    fun parseExprWithParenthesis() {
        val source = "a*(b+c)"
        assertEquals("a*(b+c)", toJSExpr(source))
        assertEquals("mu.mul(a,mu.plus(b,c))", toJSExpr(source, reactive = true))
    }

    @Test
    fun parseStringLiteral() {
        val source = "\"Hello\""
        assertEquals("\"Hello\"", toJSExpr(source))
        assertEquals("\"Hello\"", toJSExpr(source, reactive = true))
    }

    @Test
    fun parseJSXExpr() {
        val source = "<p>hello</p>"
        assertEquals("<p>hello</p>", toJSExpr(source, false))
        assertEquals("""mu.elt("p",null,"hello")""", toJSExpr(source, true))
    }

    @Test
    fun parseFunctionCall() {
        val source = "substring(2,4)"
        assertEquals("substring(2.0,4.0)", toJSExpr(source, false))
        assertEquals("substring(2.0,4.0)", toJSExpr(source, true))
    }

    @Test
    fun parseMethodCall() {
        val source = "\"abcdef\".substring(2,4)"
        assertEquals("\"abcdef\".substring(2.0,4.0)", toJSExpr(source, false))
        assertEquals("mu.dot(\"abcdef\",substring(2.0,4.0))", toJSExpr(source, true))
    }

}