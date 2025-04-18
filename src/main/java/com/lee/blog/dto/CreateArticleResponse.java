package com.lee.blog.dto;

import com.lee.blog.domain.model.Article;

public record CreateArticleResponse(
  String title,
  String content
){
    public static CreateArticleResponse from(Article article) {
        return new CreateArticleResponse(
            article.getTitle(),
            article.getContent()
        );
    }
}
