import { apiErrorResolver } from '../utils'

export function useErrorHandler(error) {
  if (error) {
    const { errorMessage } = apiErrorResolver(error)

    alert(errorMessage)
    // TODO
    // Add global message modal
  }
}