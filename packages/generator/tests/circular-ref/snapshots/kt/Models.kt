package com.pachca.sdk

import kotlinx.serialization.Serializable

@Serializable
data class Category(
    val id: Int,
    val name: String,
    val parent: Category? = null,
    val children: List<Category>? = null,
)

@Serializable
data class TreeNode(
    val value: String,
    val left: TreeNode? = null,
    val right: TreeNode? = null,
)
