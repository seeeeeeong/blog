package com.lee.blog.domain.repository;

import com.lee.blog.domain.model.Article;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ArticleRepository extends JpaRepository<Article, Long> {
}
