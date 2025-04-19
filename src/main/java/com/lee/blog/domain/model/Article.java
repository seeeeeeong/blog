package com.lee.blog.domain.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import java.time.LocalDateTime;

@Entity
public class Article {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = false)
    private String title;

    private String thumbnailUrl;

    @Lob
    @Column(nullable = false)
    private String content;


    private String authorName;

    private LocalDateTime createdAt;

    protected Article() {

    }

    public Article(String title, String thumbnailUrl, String content, String authorName,
        LocalDateTime createdAt) {
        this.title = title;
        this.thumbnailUrl = thumbnailUrl;
        this.content = content;
        this.authorName = authorName;
        this.createdAt = createdAt;
    }

    public static Article create(String title, String thumbnailUrl, String content, String authorName,
        LocalDateTime createdAt) {
        return new Article(title, thumbnailUrl, content, authorName, createdAt);
    }

    public String getTitle() {
        return title;
    }

    public String getThumbnailUrl() {
        return thumbnailUrl;
    }

    public String getContent() {
        return content;
    }

    public String getAuthorName() {
        return authorName;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void updateArticle(String title, String thumbnailUrl, String content) {
        this.title = title;
        this.thumbnailUrl = thumbnailUrl;
        this.content = content;
    }
}
