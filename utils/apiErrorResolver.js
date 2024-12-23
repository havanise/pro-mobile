export function apiErrorResolver(error) {
    let errorKey = ''
    let errorMessage = 'errorText'
    let errorCode = '500'

    if (
        error &&
        error.response &&
        error.response.data &&
        error.response.data.error
    ) {
        errorMessage = error.response.data.error.message
        errorCode = error.response.data.error.code
        errorKey = error.response.data.error.messageKey
    } else if (error && error.response && error.response.status > 499) {
        errorMessage = '500'
    }

    return {
        errorData: error.response,
        errors: error.response.data.errors,
        errorMessage,
        errorCode,
        errorKey
    }
}
