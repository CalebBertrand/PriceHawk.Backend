import { ResponseCodes } from "./response-codes.enum.js";

export function generateResponse(code: ResponseCodes) {
    switch(code) {
        case ResponseCodes.CaptchaFailed: 
            return {
                status: 403,
                body: {
                    message: "Captcha Failed",
                    code
                }
            };
        case ResponseCodes.DuplicateWatch: 
            return {
                status: 403,
                body: {
                    message: "You Already Have A Watch For That Query",
                    code
                }
            };
        case ResponseCodes.InvalidContract: 
            return {
                status: 400,
                body: {
                    message: "Invalid Response, Try Reloading The Page",
                    code
                }
            };
        case ResponseCodes.InvalidVerificationCode:
            return {
                status: 403,
                body: {
                    message: "The Verification Code Was Incorrect",
                    code
                }
            };
        case ResponseCodes.Success:
            return {
                status: 200,
                body: {
                    message: "Success!",
                    code
                }
            };
    }
}