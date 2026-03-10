package com.pachca.sdk

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
sealed interface ContentBlock {
    val kind: String
}

@Serializable
@SerialName("text")
data class TextContent(
    override val kind: String = "text",
    val text: String,
) : ContentBlock

@Serializable
@SerialName("image")
data class ImageContent(
    override val kind: String = "image",
    val url: String,
    val caption: String? = null,
) : ContentBlock

@Serializable
@SerialName("video")
data class VideoContent(
    override val kind: String = "video",
    val url: String,
    val duration: Int? = null,
) : ContentBlock
