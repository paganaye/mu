package com.ganaye.mu

import com.ganaye.mu.parsing.html.HTMLToken
import com.ganaye.mu.parsing.html.HTMLTokenizer
import com.ganaye.mu.parsing.SourceFile
import com.ganaye.mu.parsing.FileReader
import org.junit.jupiter.api.Test

import org.junit.jupiter.api.Assertions.*

class HTMLTokenizerTest {

    @Test
    fun simpleText() {
        val tokenizer = HTMLTokenizer(FileReader(SourceFile("test", "abc")))
        val token1 = tokenizer.nextToken()
        assertTrue(token1 is HTMLToken.Text)
        assertEquals("abc", (token1 as HTMLToken.Text).text)
    }

    @Test
    fun simpleTag() {
        val tokenizer = HTMLTokenizer(FileReader(SourceFile("test", "<hello>world</hello>")))
        val token1 = tokenizer.nextToken()
        assertTrue(token1 is HTMLToken.StartTag)
        assertEquals("hello", (token1 as HTMLToken.StartTag).tagName)
        val token2 = tokenizer.nextToken()
        assertTrue(token2 is HTMLToken.TagContent)
        val token3 = tokenizer.nextToken()
        assertTrue(token3 is HTMLToken.Text)
        val token4 = tokenizer.nextToken()
        assertTrue(token4 is HTMLToken.ClosingTag)
    }

    @Test
    fun tagWithAttribute() {
        //                        1         2
        //              0123456789012345678901234
        val source = """<a href="hello">world</a>"""
        val sourceFile = SourceFile("test", source)
        val htmlTokenizer = HTMLTokenizer(FileReader(sourceFile))
        val token1 = htmlTokenizer.nextToken()
        assertTrue(token1 is HTMLToken.StartTag)
        assertEquals("a", (token1 as HTMLToken.StartTag).tagName)
        val token2 = htmlTokenizer.nextToken()
        assertTrue(token2 is HTMLToken.Spaces)
        val token3 = htmlTokenizer.nextToken()
        assertTrue(token3 is HTMLToken.Identifier)
        val token4 = htmlTokenizer.nextToken()
        assertTrue(token4 is HTMLToken.EqualOp)
        // typically we would change the tokenizer to parse the expression

    }


}