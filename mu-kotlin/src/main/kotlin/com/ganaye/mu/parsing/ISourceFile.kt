package com.ganaye.mu.parsing

interface ISourceFile {
    val filePath: String
    val content: String
}

class SourceFile(override val filePath: String, override val content: String) : ISourceFile

