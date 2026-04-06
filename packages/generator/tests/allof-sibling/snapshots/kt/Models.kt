package com.pachca.sdk

import java.time.OffsetDateTime
import java.time.format.DateTimeFormatter
import kotlinx.serialization.KSerializer
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.descriptors.PrimitiveKind
import kotlinx.serialization.descriptors.PrimitiveSerialDescriptor
import kotlinx.serialization.encoding.Decoder
import kotlinx.serialization.encoding.Encoder

object OffsetDateTimeSerializer : KSerializer<OffsetDateTime> {
    override val descriptor = PrimitiveSerialDescriptor("OffsetDateTime", PrimitiveKind.STRING)
    override fun serialize(encoder: Encoder, value: OffsetDateTime) = encoder.encodeString(value.format(DateTimeFormatter.ISO_OFFSET_DATE_TIME))
    override fun deserialize(decoder: Decoder): OffsetDateTime = OffsetDateTime.parse(decoder.decodeString(), DateTimeFormatter.ISO_OFFSET_DATE_TIME)
}

@Serializable
data class BaseEntity(
    val id: Int,
    @Serializable(with = OffsetDateTimeSerializer::class) @SerialName("created_at") val createdAt: OffsetDateTime,
)

@Serializable
data class Article(
    val id: Int,
    @Serializable(with = OffsetDateTimeSerializer::class) @SerialName("created_at") val createdAt: OffsetDateTime,
    val title: String,
    val body: String,
    @SerialName("is_published") val isPublished: Boolean? = null,
)
