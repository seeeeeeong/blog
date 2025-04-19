package com.lee.blog.service;

import com.lee.blog.domain.model.Article;
import com.lee.blog.domain.repository.ArticleRepository;
import com.lee.blog.dto.ArticleRequest;
import com.lee.blog.dto.ArticleResponse;
import java.time.LocalDateTime;
import java.util.NoSuchElementException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ArticleService {

    private final ArticleRepository articleRepository;

    public ArticleService(ArticleRepository articleRepository) {
        this.articleRepository = articleRepository;
    }

    @Transactional
    public ArticleResponse addArticle(ArticleRequest request) {
        Article article = Article.create(
            request.title(),
            request.thumbnailUrl(),
            request.content(),
            null,
            LocalDateTime.now()
        );

        articleRepository.save(article);
        return ArticleResponse.from(article);
    }

    @Transactional(readOnly = true)
    public ArticleResponse findArticle(Long id) {
        Article article = articleRepository.findById(id)
            .orElseThrow(() -> new NoSuchElementException("Article Not Found!"));
        return ArticleResponse.from(article);
    }

    @Transactional
    public ArticleResponse updateArticle(Long id, ArticleRequest request) {
        Article article = articleRepository.findById(id)
            .orElseThrow(() -> new NoSuchElementException("Article Not Found!"));
        article.updateArticle(request.title(), request.thumbnailUrl(), request.content());
        return ArticleResponse.from(article);
    }

    @Transactional
    public void deleteArticle(Long id) {
        articleRepository.findById(id)
            .orElseThrow(() -> new NoSuchElementException("Article Not Found!"));
        articleRepository.deleteById(id);
    }

}
