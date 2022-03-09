const got = require("got");

exports.getAccount = async (target, isID) => {
    if (isID) {
        const { statusCode, body: data } = await got({
            url: `https://api.twitter.com/2/users/${target}`,
            responseType: "json",
            throwHttpErrors: false,
            headers: {
                Authorization: process.env.BEARER,
            }
        });

        if (statusCode !== 200) {
            return {
                statusCode,
                body: data,
            }
        }

        if (data.error) {
            return {
                statusCode,
                error: data.erros[0]?.message ?? data.errors[0]?.detail ?? "Unknown error",
            }
        }

        return {
            statusCode,
            body: data.data,
        }
    }
    else {
        const { statusCode, body: data } = await got({
            url: `https://api.twitter.com/2/users/by/username/${target}`,
            responseType: "json",
            throwHttpErrors: false,
            headers: {
                Authorization: process.env.BEARER,
            }
        });

        if (statusCode !== 200) {
            return {
                statusCode,
                body: data,
            }
        }

        if (data.error) {
            return {
                statusCode,
                error: data.erros[0]?.message ?? data.errors[0]?.detail ?? "Unknown error",
            }
        }

        return {
            statusCode,
            body: data.data,
        }
    }
}