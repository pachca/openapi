package com.pachca.sdk

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class Entity(
    @SerialName("class") val `class`: String,
    val type: String,
    @SerialName("import") val `import`: Boolean,
    @SerialName("return") val `return`: String? = null,
    @SerialName("val") val `val`: Int? = null,
)
