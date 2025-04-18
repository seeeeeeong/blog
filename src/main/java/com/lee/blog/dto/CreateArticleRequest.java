package com.lee.blog.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateArticleRequest(
    @NotBlank @Size(min = 5)
    String title,
    @Size(min = 5)
    String content
){
}
