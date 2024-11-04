package lee.io.lee.global.jwt;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class JwtTokenInfo {

    private Long memberId;
//    private String email;
//    private String provider;

    public static JwtTokenInfo of(Long memberId) {
        return JwtTokenInfo.builder()
                .memberId(memberId)
                .build();
    }

}
