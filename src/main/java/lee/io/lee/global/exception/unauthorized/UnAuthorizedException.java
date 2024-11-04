package lee.io.lee.global.exception.unauthorized;


import lee.io.lee.global.exception.BusinessException;
import lee.io.lee.global.exception.ErrorCode;

public class UnAuthorizedException extends BusinessException {

    public UnAuthorizedException(ErrorCode errorCode) {
        super(errorCode);
    }
}
