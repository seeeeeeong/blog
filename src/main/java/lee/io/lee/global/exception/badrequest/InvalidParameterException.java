package lee.io.lee.global.exception.badrequest;


import lee.io.lee.global.exception.BusinessException;
import lee.io.lee.global.exception.ErrorCode;

public class InvalidParameterException extends BusinessException {

    public InvalidParameterException(ErrorCode errorCode) {
        super(errorCode);
    }
}
