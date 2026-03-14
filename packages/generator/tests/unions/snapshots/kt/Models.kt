package com.pachca.sdk

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
sealed interface ViewBlockUnion {
    val type: String
}

@Serializable
@SerialName("header")
data class ViewBlockHeader(
    override val type: String = "header",
    val text: String,
) : ViewBlockUnion

@Serializable
@SerialName("plain_text")
data class ViewBlockPlainText(
    override val type: String = "plain_text",
    val text: String,
) : ViewBlockUnion

@Serializable
@SerialName("image")
data class ViewBlockImage(
    override val type: String = "image",
    val url: String,
    val alt: String? = null,
) : ViewBlockUnion
