package com.lee.blog.service;

import com.lee.blog.domain.model.Article;
import com.lee.blog.domain.repository.ArticleRepository;
import com.lee.blog.dto.CreateArticleRequest;
import com.lee.blog.dto.CreateArticleResponse;
import org.springframework.stereotype.Service;

@Service
public class ArticleService {

    private final ArticleRepository articleRepository;

    public ArticleService(ArticleRepository articleRepository) {
        this.articleRepository = articleRepository;
    }

    public CreateArticleResponse createArticle(CreateArticleRequest request) {

        Article article = Article.create(
            request.title(),
            request.content()
        );

        articleRepository.save(article);
        return CreateArticleResponse.from(article);
    }

}
