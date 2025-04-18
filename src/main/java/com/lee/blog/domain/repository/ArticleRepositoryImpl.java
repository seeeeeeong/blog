package com.lee.blog.domain.repository;

import com.lee.blog.domain.model.Article;
import org.springframework.stereotype.Repository;

@Repository
public class ArticleRepositoryImpl implements ArticleRepository{

    private final JpaArticleRepository jpaArticleRepository;

    public ArticleRepositoryImpl(JpaArticleRepository jpaArticleRepository) {
        this.jpaArticleRepository = jpaArticleRepository;
    }

    @Override
    public void save(Article article) {
        jpaArticleRepository.save(article);
    }
}
