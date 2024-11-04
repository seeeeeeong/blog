package lee.io.lee.domain.auth.repository;

import lee.io.lee.domain.auth.entity.Token;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TokenRepository extends JpaRepository<Token, Long> {
    void deleteByMemberId(Long memberId);

}
