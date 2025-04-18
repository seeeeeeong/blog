package com.lee.blog.domain.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

@Entity
public class Article {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = false)
    private String title;

    @Column(nullable = false, unique = true)
    private String content;

    protected Article() {

    }

    public Article(String title, String content) {
        this.title = title;
        this.content = content;
    }

    public static Article create(String title, String content) {
        return new Article(title, content);
    }

    public String getTitle() {
        return title;
    }

    public String getContent() {
        return content;
    }
}
