package lee.io.lee.global.exception.notfound;


import lee.io.lee.global.exception.BusinessException;
import lee.io.lee.global.exception.ErrorCode;

public class EntityNotFoundException extends BusinessException {

    public EntityNotFoundException(ErrorCode errorCode) {
        super(errorCode);
    }

    public EntityNotFoundException(ErrorCode errorCode, String message) {
        super(errorCode, message);
    }
}
