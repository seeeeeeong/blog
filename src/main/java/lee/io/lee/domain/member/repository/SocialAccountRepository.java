package lee.io.lee.domain.member.repository;

import lee.io.lee.domain.member.entity.Member;
import lee.io.lee.domain.member.entity.SocialAccount;
import lee.io.lee.domain.member.enums.Provider;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SocialAccountRepository extends JpaRepository<SocialAccount, Long> {

    Optional<SocialAccount> findByMemberAndProvider(Member member, Provider provider);

}
