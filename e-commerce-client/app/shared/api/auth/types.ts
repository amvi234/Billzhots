export type VerifyOtpPayload = {
    username: string;
    password: string;
    otp: string;
}

export type VerifyOtpResponse = {
    access_token: string;
    refresh_token: string;
}

export type LoginPayload = {
    username: string;
    password: string;
}

export type LoginResponse = {
    otp_secret: string;
    otp: string;
    message: string;
}