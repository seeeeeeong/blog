package com.lee.blog.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.lee.blog.domain.model.Article;
import java.time.LocalDateTime;

public record ArticleResponse(
  String title,
  String thumbnailUrl,
  String content,
  String authorName,
  @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
  LocalDateTime createdAt
){
    public static ArticleResponse from(Article article) {
        return new ArticleResponse(
            article.getTitle(),
            article.getThumbnailUrl(),
            article.getContent(),
            article.getAuthorName(),
            article.getCreatedAt()
        );
    }
}
