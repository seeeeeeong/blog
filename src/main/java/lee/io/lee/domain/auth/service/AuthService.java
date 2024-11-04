package lee.io.lee.domain.auth.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.nimbusds.jose.JOSEException;
import com.nimbusds.jose.JWSVerifier;
import com.nimbusds.jose.crypto.RSASSAVerifier;
import com.nimbusds.jose.jwk.JWK;
import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.RSAKey;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;

import lee.io.lee.domain.auth.client.AuthProviderClient;
import lee.io.lee.domain.auth.dto.LoginResponse;
import lee.io.lee.domain.auth.entity.Token;
import lee.io.lee.domain.auth.properties.AppleProperties;
import lee.io.lee.domain.auth.repository.TokenRepository;
import lee.io.lee.domain.member.entity.Member;
import lee.io.lee.domain.member.entity.SocialAccount;
import lee.io.lee.domain.member.enums.NicknameType;
import lee.io.lee.domain.member.enums.Provider;
import lee.io.lee.domain.member.enums.Role;
import lee.io.lee.domain.member.repository.MemberRepository;
import lee.io.lee.domain.member.repository.SocialAccountRepository;
import lee.io.lee.global.jwt.JwtTokenDto;
import lee.io.lee.global.jwt.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.net.URL;
import java.text.ParseException;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;
import java.util.Random;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuthService {

    private final AuthProviderClient authProviderClient;
    private final JwtTokenProvider jwtTokenProvider;
    private final AppleProperties appleProperties;

    private final TokenRepository tokenRepository;
    private final MemberRepository memberRepository;
    private final SocialAccountRepository socialAccountRepository;

    /**
     * <p>구글 로그인</p>
     *
     * @param code 구글 authCode
     * @return accessToken, refreshToken
     */
    @Transactional
    public LoginResponse googleLogin(String code) {
        // 1. accessToken 발급
        String googleAccessToken = authProviderClient.getGoogleAccessToken(code);

        // 2. accessToken -> 유저 정보 응답
        Map<String, Object> userInfo = authProviderClient.getUserInfo(googleAccessToken);

        String email = (String) userInfo.get("email");
        String name = (String) userInfo.get("name");
        String providerUid = (String) userInfo.get("id");
        Provider provider = Provider.GOOGLE;

        // 3. member insert or update
        Member member = mergeMember(email, name, provider);

        // 4. socialAccount insert or update
        mergeSocialAccount(member, provider, providerUid);

        // 5. member -> jwt 토큰 생성
        JwtTokenDto jwtTokenDto = jwtTokenProvider.createJwtTokenDto(member.getMemberId());

        // 6. jwt 토큰 insert
        insertToken(member, jwtTokenDto.getRefreshToken());

        return LoginResponse.of(jwtTokenDto);
    }

    /**
     * <p>카카오 로그인</p>
     *
     * @param code 카카오 authCode
     * @return accessToken, refreshToken
     */
    @Transactional
    public LoginResponse kakaoLogin(String code) throws JsonProcessingException {
        // 1. accessToken 발급
        String kakaoAccessToken = authProviderClient.getKakaoAccesssToken(code);

        // 2. accessToken -> 유저 정보 응답
        Map<String, Object> userInfo = authProviderClient.getKakaoUserInfo(kakaoAccessToken);

        // 2.1 KAKAO -> name 값 미제공
        String email = (String) userInfo.get("email");
        String providerUid = (String) userInfo.get("id");
        Provider provider = Provider.GOOGLE;

        // 3. member insert or update
        Member member = mergeMember(email, null, provider);

        // 4. socialAccount insert or update
        mergeSocialAccount(member, provider, providerUid);

        // 5. member -> jwt 토큰 생성
        JwtTokenDto jwtTokenDto = jwtTokenProvider.createJwtTokenDto(member.getMemberId());

        // 6. jwt 토큰 insert
        insertToken(member, jwtTokenDto.getRefreshToken());
        return LoginResponse.of(jwtTokenDto);
    }

    /**
     * <p>애플 로그인</p>
     *
     * @param code 애플 authCode
     * @return accessToken, refreshToken
     */
    @Transactional
    public LoginResponse appleLogin(String code) throws ParseException, JOSEException, IOException {
        // 1. appleIdToken 발급
        String idToken = authProviderClient.getAppleIdToken(code);

        // 2. appleIdToken 검증
        if (!validateAppleIdToken(idToken)) {
            throw new RuntimeException();
        }

        // 3. JWT -> 유저 정보
        SignedJWT signedJWT = SignedJWT.parse(idToken);
        JWTClaimsSet claims = signedJWT.getJWTClaimsSet();
        String email = claims.getStringClaim("email");
        String name = claims.getStringClaim("name");
        String providerUid = claims.getSubject();
        Provider provider = Provider.APPLE;

        // 3. member insert or update
        Member member = mergeMember(email, name, provider);

        // 4. socialAccount insert or update
        mergeSocialAccount(member, provider, providerUid);

        // 5. member -> jwt 토큰 생성
        JwtTokenDto jwtTokenDto = jwtTokenProvider.createJwtTokenDto(member.getMemberId());

        // 6. jwt 토큰 insert
        insertToken(member, jwtTokenDto.getRefreshToken());

        return LoginResponse.of(jwtTokenDto);
    }

    private boolean validateAppleIdToken(String idToken) throws ParseException, JOSEException, IOException {
        SignedJWT signedJWT = SignedJWT.parse(idToken);
        // 1. Apple의 공개 키 조회
        JWKSet jwkSet = JWKSet.load(new URL(appleProperties.getPublicKeyUrl()));
        JWK jwk = jwkSet.getKeyByKeyId(signedJWT.getHeader().getKeyID());
        // 2. 검증을 위한 RSA 공개 키 생성E
        RSAKey rsaKey = (RSAKey) jwk;
        JWSVerifier verifier = new RSASSAVerifier(rsaKey.toRSAPublicKey());
        // 3. JWT 서명 검증
        return signedJWT.verify(verifier);
    }


    /**
     * <p>member insert or update</p>
     *
     * @param email SNS UserInfo의 email
     * @param name SNS UserInfo의 name
     * @param provider GOOGLE, KAKAO, APPLE
     * @return member
     */
    private Member mergeMember(String email, String name, Provider provider) {

        // 1. email, provider -> member 조회
        Optional<Member> optionalMember = memberRepository.findAllByEmail(email).stream()
                .filter(existingMember -> existingMember.getSocialAccounts().stream()
                        .anyMatch(socialAccount -> socialAccount.getProvider() == provider))
                .findFirst();

        // 2. 기존 유저의 경우 update -> email, name, memberStatus, optionalTermsAgreed, accessedAt
        if (optionalMember.isPresent()) {
            Member member = optionalMember.get();
            member.updateMember(email, name != null ? name : member.getName());

            return memberRepository.save(member);
        } else {
            // 3. 신규 유저의 경우 insert
            Member newMember = insertMember(email, name);

            return newMember;
        }

    }

    /**
     * <p>socialAccount insert or update</p>
     *
     * @param member member
     * @param provider GOOGLE, KAKAO, APPLE
     * @param providerUid SNS UserInfo의 고유 ID
     * @return socialAccount
     */
    private SocialAccount mergeSocialAccount(Member member, Provider provider, String providerUid) {
        SocialAccount socialAccount = socialAccountRepository.findByMemberAndProvider(member, provider)
                .orElseGet(() -> insertSocialAccount(member, provider, providerUid));

        socialAccount.updateProviderUid(providerUid);

        return socialAccountRepository.save(socialAccount);
    }

    /**
     * <p>member insert</p>
     *
     * @param email SNS UserInfo의 email
     * @param name SNS UserInfo의 name
     * @return member
     */
    private Member insertMember(String email, String name) {
        // 1. 닉네임 생성 (공연 관련 텍스트 + _ + 5자리의 난수)
        String nickname = getNickname();

        // 2. SNS UserInfo의 name이 존재한다면 적용, 없을 경우 nickname과 똑같은 값 적용
        Member newMember =  Member.builder()
                .email(email)
                .name(name != null ? name : nickname)
                .nickname(nickname)
                .role(Role.USER)
                .build();

        return memberRepository.save(newMember);
    }

    private String getNickname() {
        String nickname;
        do {
            String nicknameBase = NicknameType.getRandomNickname();
            int randomNumber = new Random().nextInt(100000);
            nickname = String.format("%s_%05d", nicknameBase, randomNumber);
        } while (memberRepository.existsByNickname(nickname));
        return nickname;
    }

    private SocialAccount insertSocialAccount(Member member, Provider provider, String providerUid) {
        SocialAccount socialAccount = SocialAccount.builder()
                .member(member)
                .provider(provider)
                .providerUid(providerUid)
                .build();

        return socialAccountRepository.save(socialAccount);
    }

    private void insertToken(Member member, String refreshToken) {
        tokenRepository.deleteByMemberId(member.getMemberId());

        Token token = Token.builder()
                .memberId(member.getMemberId())
                .refreshToken(refreshToken)
                .userId(null)
                .build();

        tokenRepository.save(token);
    }

}
