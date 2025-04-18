package com.lee.blog.controller;

import com.lee.blog.dto.CreateArticleRequest;
import com.lee.blog.dto.CreateArticleResponse;
import com.lee.blog.service.ArticleService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/articles")
public class ArticleController {

    private final ArticleService articleService;

    public ArticleController(ArticleService articleService) {
        this.articleService = articleService;
    }

    @PostMapping
    public CreateArticleResponse createArticle(@RequestBody CreateArticleRequest request) {
        return articleService.createArticle(request);
    }


}
