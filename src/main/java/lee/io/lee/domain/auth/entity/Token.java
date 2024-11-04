package lee.io.lee.domain.auth.entity;


import jakarta.persistence.*;
import lee.io.lee.global.entity.BaseTimeEntity;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(schema = "system")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Token extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long tokenId; // 토큰 ID

    private Long memberId; // 회원 ID

    private String userId; // 사용자 ID

    @Column(nullable = false)
    private String refreshToken; // 리프레시 토큰

    @Builder
    public Token(Long memberId, String userId, String refreshToken) {
        this.memberId = memberId;
        this.userId = userId;
        setRefreshToken(refreshToken);
    }

    private void setRefreshToken(String refreshToken) {
        removeRefreshToken();
        this.refreshToken = refreshToken;
    }

    private void removeRefreshToken() {
        this.refreshToken = null;
    }

}