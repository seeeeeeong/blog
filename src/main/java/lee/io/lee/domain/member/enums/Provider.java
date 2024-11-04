package lee.io.lee.domain.member.enums;

import lee.io.lee.global.mapper.EnumMapperType;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum Provider implements EnumMapperType {

    GOOGLE("GOOGLE"),
    KAKAO("KAKAO"),
    APPLE("APPLE");

    private final String description; // Enum 설명

    @Override
    public String getCode() {
        return name();
    }
}
