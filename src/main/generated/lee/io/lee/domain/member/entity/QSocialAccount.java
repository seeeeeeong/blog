package lee.io.lee.domain.member.entity;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;
import com.querydsl.core.types.dsl.PathInits;


/**
 * QSocialAccount is a Querydsl query type for SocialAccount
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QSocialAccount extends EntityPathBase<SocialAccount> {

    private static final long serialVersionUID = 1541231431L;

    private static final PathInits INITS = PathInits.DIRECT2;

    public static final QSocialAccount socialAccount = new QSocialAccount("socialAccount");

    public final lee.io.lee.global.entity.QBaseTimeEntity _super = new lee.io.lee.global.entity.QBaseTimeEntity(this);

    //inherited
    public final DateTimePath<java.time.LocalDateTime> createdAt = _super.createdAt;

    public final QMember member;

    //inherited
    public final DateTimePath<java.time.LocalDateTime> modifiedAt = _super.modifiedAt;

    public final EnumPath<lee.io.lee.domain.member.enums.Provider> provider = createEnum("provider", lee.io.lee.domain.member.enums.Provider.class);

    public final StringPath providerUid = createString("providerUid");

    public final NumberPath<Long> socialId = createNumber("socialId", Long.class);

    public QSocialAccount(String variable) {
        this(SocialAccount.class, forVariable(variable), INITS);
    }

    public QSocialAccount(Path<? extends SocialAccount> path) {
        this(path.getType(), path.getMetadata(), PathInits.getFor(path.getMetadata(), INITS));
    }

    public QSocialAccount(PathMetadata metadata) {
        this(metadata, PathInits.getFor(metadata, INITS));
    }

    public QSocialAccount(PathMetadata metadata, PathInits inits) {
        this(SocialAccount.class, metadata, inits);
    }

    public QSocialAccount(Class<? extends SocialAccount> type, PathMetadata metadata, PathInits inits) {
        super(type, metadata, inits);
        this.member = inits.isInitialized("member") ? new QMember(forProperty("member")) : null;
    }

}

