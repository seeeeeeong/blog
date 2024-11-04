package lee.io.lee.domain.member.entity;

import jakarta.persistence.*;
import lee.io.lee.domain.member.enums.Provider;
import lee.io.lee.global.entity.BaseTimeEntity;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(schema = "member")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class SocialAccount extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "social_id")
    private Long socialId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    @Column(name = "provider", nullable = false)
    private Provider provider;

    @Column(name = "provider_uid", updatable = false)
    private String providerUid;

    @Builder
    public SocialAccount(Member member, Provider provider, String providerUid) {
        this.member = member;
        this.provider = provider;
        this.providerUid = providerUid;
    }

    public void updateProviderUid(String providerUid) {
        this.providerUid = providerUid;
    }

}
