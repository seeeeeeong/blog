package lee.io.lee.domain.member.repository;

import lee.io.lee.domain.member.entity.Member;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MemberRepository extends JpaRepository<Member, Long> {

    List<Member> findAllByEmail(String email);

    boolean existsByNickname(String nickname);


}
