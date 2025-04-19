package com.lee.blog.dto;

public record ArticleRequest(
    String title,
    String thumbnailUrl,
    String content
){
}
